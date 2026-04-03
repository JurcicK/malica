import type { Language } from './translations'

export type LocalizedText = Record<Language, string>

const exactTitleTranslations: Record<string, Omit<LocalizedText, 'sl'>> = {
  'Piščančja tikka masala s kurkuminim rižem': {
    en: 'Chicken tikka masala with turmeric rice',
    uk: 'Куряча тікка масала з рисом із куркумою',
  },
  'Vege wrap z zelenjavo, krompirčkom, tzatzikijem in sladko pekočo omako': {
    en: 'Veggie wrap with vegetables, fries, tzatziki and sweet chili sauce',
    uk: 'Овочевий врап з овочами, картоплею фрі, дзадзикі та солодко-гострим соусом',
  },
  'Duo krožnik s svinjskim zrezkom, piščančjim zrezkom, jurčkovo omako in pire krompirjem': {
    en: 'Duo plate with pork steak, grilled chicken steak, porcini sauce and mashed potatoes',
    uk: 'Дуо-тарілка зі свинячим стейком, курячим стейком, соусом з білих грибів і картопляним пюре',
  },
  'Goveje makaronovo meso': {
    en: 'Beef pasta stew',
    uk: 'Яловичина з макаронами',
  },
  'Piščančji zrezek capresse, čičerikin humus in lečina solata po mediteransko': {
    en: 'Chicken caprese steak, chickpea hummus and Mediterranean lentil salad',
    uk: 'Курячий стейк капрезе, хумус із нуту та середземноморський салат із сочевиці',
  },
  'Testenine v omaki štirih sirov': {
    en: 'Pasta in four-cheese sauce',
    uk: 'Паста в соусі з чотирьох сирів',
  },
  'Kmečki krožnik s pečenico, prekajenim mesom, svinjsko pečenko, zeljem in praženim krompirjem': {
    en: 'Farmer’s plate with sausage, smoked meat, roast pork, cabbage and sautéed potatoes',
    uk: 'Селянська тарілка з ковбасою, копченим м’ясом, печеною свининою, капустою та смаженою картоплею',
  },
  'Telečja obara s čemaževimi vodnimi žličniki': {
    en: 'Veal stew with wild garlic dumplings',
    uk: 'Теляча юшка з кнедликами з черемшею',
  },
  'Cubisov krožnik z grško solato, piščancem, tzatzikijem in krompirčkom': {
    en: 'Cubis plate with Greek salad, chicken, tzatziki and fries',
    uk: 'Тарілка Cubis з грецьким салатом, куркою, дзадзикі та картоплею фрі',
  },
  'Yaki udon rezanci s tofujem, romaneskom, šitake gobami, bučkami in sezamom': {
    en: 'Yaki udon noodles with tofu, romanesco, shiitake mushrooms, zucchini and sesame',
    uk: 'Локшина які удон з тофу, романеско, грибами шиїтаке, цукіні та кунжутом',
  },
  'Svinjski kotlet po milansko, žafranova rižota in kremni grah': {
    en: 'Milan-style pork cutlet with saffron risotto and creamed peas',
    uk: 'Свиняча відбивна по-міланськи з шафрановим різото та вершковим горошком',
  },
  'Čufte v kremni smetanovi omaki s pire krompirjem': {
    en: 'Meatballs in creamy sauce with mashed potatoes',
    uk: 'Тефтелі у вершковому соусі з картопляним пюре',
  },
  'Svinjski zrezek z lisičkovo omako, pečena polenta z rukolo in parmezanom': {
    en: 'Pork steak with chanterelle sauce, baked polenta, arugula and parmesan',
    uk: 'Свинячий стейк із соусом з лисичок, запеченою полентою, руколою та пармезаном',
  },
  'Ocvrti sir, pomfri in domača tatarska omaka': {
    en: 'Fried cheese, fries and homemade tartar sauce',
    uk: 'Смажений сир, картопля фрі та домашній соус тартар',
  },
  'Piščančji medaljoni v nacho omaki z mehiškim rižem': {
    en: 'Chicken medallions in nacho sauce with Mexican rice',
    uk: 'Курячі медальйони в соусі начо з мексиканським рисом',
  },
  'Testenine s pršutom in šparglji': {
    en: 'Pasta with prosciutto and asparagus',
    uk: 'Паста з прошуто та спаржею',
  },
  'Tandoori piščanec s tajsko hrustljavo solato in arašidi': {
    en: 'Tandoori chicken with Thai crunchy salad and peanuts',
    uk: 'Курка тандурі з тайським хрустким салатом та арахісом',
  },
  'Zelenjavni burger s krompirčkom in sladko pekočo omako': {
    en: 'Veggie burger with fries and sweet chili sauce',
    uk: 'Овочевий бургер з картоплею фрі та солодко-гострим соусом',
  },
  'Ocvrti file ostriža po dunajsko s krompirjevo solato': {
    en: 'Breaded perch fillet Vienna-style with potato salad',
    uk: 'Смажене філе окуня по-віденськи з картопляним салатом',
  },
  'Grška musaka z mletim mesom, feta sirom in tzatzikijem': {
    en: 'Greek moussaka with minced meat, feta cheese and tzatziki',
    uk: 'Грецька мусака з фаршем, сиром фета та дзадзикі',
  },
  'Dunajski zrezek z ocvrtim krompirjem': {
    en: 'Vienna schnitzel with fried potatoes',
    uk: 'Віденський шніцель зі смаженою картоплею',
  },
  'Ocvrti sir z ocvrtim krompirjem in tatarsko omako': {
    en: 'Fried cheese with fried potatoes and tartar sauce',
    uk: 'Смажений сир зі смаженою картоплею та соусом тартар',
  },
  'Solatni krožnik s pečeno zelenjavo in izbiro dodatka': {
    en: 'Salad plate with roasted vegetables and topping choice',
    uk: 'Салатна тарілка із запеченими овочами та вибором додатка',
  },
  'Sirov ali mesni burek z jogurtom': {
    en: 'Cheese or meat burek with yogurt',
    uk: 'Сирний або м’ясний бурек з йогуртом',
  },
  'Pečen piščančji file s pečeno zelenjavo': {
    en: 'Roasted chicken fillet with roasted vegetables',
    uk: 'Запечене куряче філе із запеченими овочами',
  },
}

const exactDescriptionTranslations: Record<string, Omit<LocalizedText, 'sl'>> = {
  'mocarela, šunka/sir, pečen piščanec ali tuna': {
    en: 'mozzarella, ham/cheese, roasted chicken or tuna',
    uk: 'моцарела, шинка/сир, запечена курка або тунець',
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
    return { sl: trimmed, ...exact }
  }

  return {
    sl: trimmed,
    en: applyPhraseDictionary(trimmed, phraseDictionaryEn),
    uk: applyPhraseDictionary(trimmed, phraseDictionaryUk),
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

  return value[language] || value.sl || value.en || value.uk || ''
}
