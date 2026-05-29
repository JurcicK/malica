import { inflateRawSync } from 'node:zlib'
import { NextResponse } from 'next/server'
import type { MenuCategory } from '../../../lib/mock-data'

export const runtime = 'nodejs'

type ParsedMeal = {
  category: MenuCategory
  title: string
  allergens?: string
}

type ParsedDay = {
  date: string
  items: ParsedMeal[]
}

const dayNames = ['ponedeljek', 'torek', 'sreda', 'četrtek', 'petek']
const categoryMap: Record<string, MenuCategory> = {
  'bodi fit': 'bodi fit',
  vege: 'vege',
  'ali pa..': 'ali pa..',
  'na hitro...': 'na hitro...',
}

function decodeXml(value: string) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
}

function normalizeText(value: string) {
  return decodeXml(value)
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .trim()
}

function normalizeCategory(value: string) {
  return normalizeText(value).toLowerCase().replace('…', '...')
}

function unzipXlsx(buffer: Buffer) {
  const files = new Map<string, Buffer>()
  const eocdSignature = 0x06054b50
  let eocdOffset = -1

  for (let offset = buffer.length - 22; offset >= 0; offset -= 1) {
    if (buffer.readUInt32LE(offset) === eocdSignature) {
      eocdOffset = offset
      break
    }
  }

  if (eocdOffset === -1) {
    throw new Error('Invalid XLSX archive.')
  }

  const entryCount = buffer.readUInt16LE(eocdOffset + 10)
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16)
  let cursor = centralDirectoryOffset

  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(cursor) !== 0x02014b50) {
      throw new Error('Invalid XLSX central directory.')
    }

    const compressionMethod = buffer.readUInt16LE(cursor + 10)
    const compressedSize = buffer.readUInt32LE(cursor + 20)
    const fileNameLength = buffer.readUInt16LE(cursor + 28)
    const extraLength = buffer.readUInt16LE(cursor + 30)
    const commentLength = buffer.readUInt16LE(cursor + 32)
    const localHeaderOffset = buffer.readUInt32LE(cursor + 42)
    const fileName = buffer
      .subarray(cursor + 46, cursor + 46 + fileNameLength)
      .toString('utf8')

    if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
      throw new Error('Invalid XLSX local file header.')
    }

    const localFileNameLength = buffer.readUInt16LE(localHeaderOffset + 26)
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28)
    const dataStart = localHeaderOffset + 30 + localFileNameLength + localExtraLength
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize)

    if (compressionMethod === 0) {
      files.set(fileName, compressed)
    } else if (compressionMethod === 8) {
      files.set(fileName, inflateRawSync(compressed))
    }

    cursor += 46 + fileNameLength + extraLength + commentLength
  }

  return files
}

function parseSharedStrings(xml: string) {
  return [...xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((match) => {
    const textParts = [...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((part) => part[1])
    return normalizeText(textParts.join(''))
  })
}

function parseSheetValues(xml: string, sharedStrings: string[]) {
  const values = new Map<string, string>()

  for (const cell of xml.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
    const attributes = cell[1]
    const body = cell[2]
    const ref = attributes.match(/\br="([^"]+)"/)?.[1]
    const type = attributes.match(/\bt="([^"]+)"/)?.[1]
    const rawValue = body.match(/<v>([\s\S]*?)<\/v>/)?.[1]
    const inlineValue = body.match(/<t\b[^>]*>([\s\S]*?)<\/t>/)?.[1]

    if (!ref) {
      continue
    }

    if (type === 's' && rawValue) {
      values.set(ref, sharedStrings[Number(rawValue)] ?? '')
    } else if (inlineValue) {
      values.set(ref, normalizeText(inlineValue))
    } else if (rawValue) {
      values.set(ref, normalizeText(rawValue))
    }
  }

  return values
}

function parseDateRange(value: string) {
  const match = normalizeText(value).match(/(\d{1,2})\.(\d{1,2})\s*-\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/)

  if (!match) {
    throw new Error('Date range not found.')
  }

  const [, startDay, startMonth, , , year] = match
  const start = new Date(Number(year), Number(startMonth) - 1, Number(startDay), 12)

  return dayNames.map((_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date.toISOString().slice(0, 10)
  })
}

function splitMeal(value: string) {
  const normalized = normalizeText(value)
  const allergenMatch = normalized.match(/\s*\(([\d,\s]+)\)\s*$/)

  if (!allergenMatch) {
    return { title: normalized }
  }

  return {
    title: normalized.slice(0, allergenMatch.index).trim(),
    allergens: allergenMatch[1].replace(/\s+/g, ' ').trim(),
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing Excel file.' }, { status: 400 })
    }

    const archive = unzipXlsx(Buffer.from(await file.arrayBuffer()))
    const sharedStrings = archive.has('xl/sharedStrings.xml')
      ? parseSharedStrings(archive.get('xl/sharedStrings.xml')!.toString('utf8'))
      : []
    const sheetXml = archive.get('xl/worksheets/sheet1.xml')

    if (!sheetXml) {
      return NextResponse.json({ error: 'Worksheet not found.' }, { status: 400 })
    }

    const values = parseSheetValues(sheetXml.toString('utf8'), sharedStrings)
    const dates = parseDateRange(values.get('A3') ?? '')
    const categories = ['B', 'C', 'D', 'E'].map((column) => categoryMap[normalizeCategory(values.get(`${column}3`) ?? '')])

    if (categories.some((category) => !category)) {
      return NextResponse.json({ error: 'Excel categories were not recognized.' }, { status: 400 })
    }

    const days: ParsedDay[] = dayNames.map((dayName, dayIndex) => {
      const row = dayIndex + 4
      const actualDayName = normalizeText(values.get(`A${row}`) ?? '').toLowerCase()

      if (actualDayName !== dayName) {
        throw new Error(`Expected ${dayName} in row ${row}.`)
      }

      const items: ParsedMeal[] = []

      for (const [categoryIndex, column] of ['B', 'C', 'D', 'E'].entries()) {
        const parsedMeal = splitMeal(values.get(`${column}${row}`) ?? '')

        if (parsedMeal.title) {
          items.push({
            category: categories[categoryIndex],
            title: parsedMeal.title,
            allergens: parsedMeal.allergens,
          })
        }
      }

      return {
        date: dates[dayIndex],
        items,
      }
    })

    return NextResponse.json({ days })
  } catch (error) {
    console.error('Parsing weekly menu failed.', error)
    return NextResponse.json({ error: 'Branje Excel ponudbe ni uspelo.' }, { status: 500 })
  }
}
