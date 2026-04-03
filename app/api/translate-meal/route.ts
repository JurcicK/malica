import { NextResponse } from 'next/server'
import { autoTranslateText } from '../../../lib/meal-localization'

type TranslatePayload = {
  text?: string
}

type MyMemoryResponse = {
  responseData?: {
    translatedText?: string
  }
}

function fallbackResponse(text: string) {
  return {
    translation: autoTranslateText(text),
    usedFallback: true,
  }
}

async function myMemoryTranslate(text: string, target: 'en' | 'uk', email?: string) {
  const params = new URLSearchParams({
    q: text,
    langpair: `sl|${target}`,
  })

  if (email) {
    params.set('de', email)
  }

  const response = await fetch(`https://api.mymemory.translated.net/get?${params.toString()}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`MyMemory failed with ${response.status}`)
  }

  const data = (await response.json()) as MyMemoryResponse
  const translatedText = data.responseData?.translatedText?.trim()

  if (!translatedText) {
    throw new Error('MyMemory did not return translatedText')
  }

  return translatedText
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TranslatePayload
    const text = body.text?.trim()

    if (!text) {
      return NextResponse.json({ error: 'Missing text.' }, { status: 400 })
    }

    const email = process.env.MYMEMORY_EMAIL

    try {
      const [en, uk] = await Promise.all([
        myMemoryTranslate(text, 'en', email),
        myMemoryTranslate(text, 'uk', email),
      ])

      return NextResponse.json({
        translation: {
          sl: text,
          en,
          uk,
        },
        usedFallback: false,
      })
    } catch {
      return NextResponse.json(fallbackResponse(text))
    }
  } catch {
    return NextResponse.json({ error: 'Translation failed.' }, { status: 500 })
  }
}
