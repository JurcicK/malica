import type { Language } from './translations'

export type LocalizedText = Record<Language, string>

const exactTitleTranslations: Record<string, Partial<Omit<LocalizedText, 'sl'>>> = {
  'Solatni krožnik s pečeno zelenjavo in izbiro dodatka': {
    en: 'Salad plate with roasted vegetables and topping choice',
    uk: 'Салатна тарілка із запеченими овочами та вибором додатка',
    bs: 'Salatni tanjir sa pečenim povrćem i izborom dodatka',
  },
  'Sirov ali mesni burek z jogurtom': {
    en: 'Cheese or meat burek with yogurt',
    uk: 'Сирний або м’ясний бурек з йогуртом',
    bs: 'Sirni ili mesni burek sa jogurtom',
  },
  'Pečen piščančji file s pečeno zelenjavo': {
    en: 'Roasted chicken fillet with roasted vegetables',
    uk: 'Запечене куряче філе із запеченими овочами',
    bs: 'Pečeni pileći file sa pečenim povrćem',
  },
}

const exactDescriptionTranslations: Record<string, Partial<Omit<LocalizedText, 'sl'>>> = {
  'mocarela, šunka/sir, pečen piščanec ali tuna': {
    en: 'mozzarella, ham/cheese, roasted chicken or tuna',
    uk: 'моцарела, шинка/сир, запечена курка або тунець',
    bs: 'mozzarella, šunka/sir, pečena piletina ili tuna',
  },
}

const phraseDictionaryEn: Array<[string, string]> = [
  ['jajca', 'eggs'],
  ['jajce', 'egg'],
  ['piščančji', 'chicken'],
  ['piščančja', 'chicken'],
  ['piščanec', 'chicken'],
  ['svinjski', 'pork'],
  ['goveje', 'beef'],
  ['telečja', 'veal'],
  ['zrezek', 'steak'],
  ['krompirček', 'fries'],
  ['krompirjem', 'potatoes'],
  ['pire', 'mashed'],
  ['riž', 'rice'],
  ['rižota', 'risotto'],
  ['testenine', 'pasta'],
  ['solata', 'salad'],
  ['omaka', 'sauce'],
  ['ocvrti sir', 'fried cheese'],
  ['burek', 'burek'],
]

const phraseDictionaryUk: Array<[string, string]> = [
  ['jajca', 'яйця'],
  ['jajce', 'яйце'],
  ['piščančji', 'курячий'],
  ['piščančja', 'куряча'],
  ['piščanec', 'курка'],
  ['svinjski', 'свинячий'],
  ['goveje', 'яловичина'],
  ['telečja', 'теляча'],
  ['zrezek', 'стейк'],
  ['krompirček', 'картопля фрі'],
  ['krompirjem', 'картоплею'],
  ['pire', 'пюре'],
  ['riž', 'рис'],
  ['rižota', 'різото'],
  ['testenine', 'паста'],
  ['solata', 'салат'],
  ['omaka', 'соус'],
  ['ocvrti sir', 'смажений сир'],
  ['burek', 'бурек'],
]

const phraseDictionaryBs: Array<[string, string]> = [
  ['jajca', 'jaja'],
  ['jajce', 'jaje'],
  ['piščančji', 'pileći'],
  ['piščančja', 'pileća'],
  ['piščanec', 'piletina'],
  ['svinjski', 'svinjski'],
  ['goveje', 'goveđe'],
  ['telečja', 'teleća'],
  ['zrezek', 'odrezak'],
  ['krompirček', 'pomfrit'],
  ['krompirjem', 'krompirom'],
  ['pire', 'pire'],
  ['riž', 'riža'],
  ['rižota', 'rižoto'],
  ['testenine', 'tjestenina'],
  ['solata', 'salata'],
  ['omaka', 'sos'],
  ['ocvrti sir', 'pohovani sir'],
  ['burek', 'burek'],
]

function applyPhraseDictionary(source: string, dictionary: Array<[string, string]>) {
  let translated = source
  for (const [from, to] of dictionary) {
    translated = translated.replaceAll(from, to)
  }
  return translated
}

export function autoTranslateText(text: string): LocalizedText {
  const trimmed = text.trim()
  const exact = exactTitleTranslations[trimmed] ?? exactDescriptionTranslations[trimmed]

  if (exact) {
    return {
      sl: trimmed,
      en: exact.en ?? applyPhraseDictionary(trimmed, phraseDictionaryEn),
      uk: exact.uk ?? applyPhraseDictionary(trimmed, phraseDictionaryUk),
      bs: exact.bs ?? applyPhraseDictionary(trimmed, phraseDictionaryBs),
    }
  }

  return {
    sl: trimmed,
    en: applyPhraseDictionary(trimmed, phraseDictionaryEn),
    uk: applyPhraseDictionary(trimmed, phraseDictionaryUk),
    bs: applyPhraseDictionary(trimmed, phraseDictionaryBs),
  }
}

export function getLocalizedText(
  value: string | LocalizedText | undefined,
  language: Language
) {
  if (!value) {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  return value[language] || value.sl || value.bs || value.en || value.uk || ''
}
