import { autoTranslateText, type LocalizedText } from './meal-localization'

export type UserRole = 'admin' | 'employee'

export type UserProfile = {
  id: string
  fullName: string
  username: string
  password: string
  role: UserRole
  department: string
}

export type MenuCategory =
  | 'bodi fit'
  | 'vege'
  | 'ali pa..'
  | 'na hitro...'
  | 'stalna ponudba'

export type MenuItem = {
  id: string
  title: LocalizedText
  category: MenuCategory
  allergens?: string
  description?: LocalizedText
  isAlwaysAvailable?: boolean
}

export type DayOffer = {
  date: string
  label: LocalizedText
  items: MenuItem[]
}

export type WeeklyOffer = {
  weekLabel: LocalizedText
  sourceLabel: LocalizedText
  cutoffHour: number
  days: DayOffer[]
  alwaysAvailable: MenuItem[]
}

export type OrderEntry = {
  mealItemId: string
  note?: string
}

export type OrdersByDay = Record<string, Record<string, OrderEntry>>

const day = (sl: string, en: string, uk: string): LocalizedText => ({ sl, en, uk })
const meal = (sl: string) => autoTranslateText(sl)
const text = (sl: string, en: string, uk: string): LocalizedText => ({ sl, en, uk })

export const demoUsers: UserProfile[] = [
  { id: 'admin', fullName: 'Kristjan Jurcic', username: 'admin', password: 'admin', role: 'admin', department: 'Administracija' },
  { id: 'u1', fullName: 'Marko Novak', username: 'marko', password: 'malica', role: 'employee', department: 'Skladišče' },
  { id: 'u2', fullName: 'Nina Kralj', username: 'nina', password: 'malica', role: 'employee', department: 'Prodaja' },
  { id: 'u3', fullName: 'Tina Zupan', username: 'tina', password: 'malica', role: 'employee', department: 'Računovodstvo' },
  { id: 'u4', fullName: 'Rok Mlakar', username: 'rok', password: 'malica', role: 'employee', department: 'Servis' },
]

export const defaultWeeklyOffer: WeeklyOffer = {
  weekLabel: text(
    'Tedenska ponudba 30. 3. - 3. 4. 2026',
    'Weekly offer March 30 - April 3, 2026',
    'Тижнева пропозиція 30.03 - 03.04.2026'
  ),
  sourceLabel: text(
    'Uvoz po Excel ponudbi 30.3-4.4.2026',
    'Imported from Excel offer 30.3-4.4.2026',
    'Імпортовано з Excel-пропозиції 30.3-4.4.2026'
  ),
  cutoffHour: 10,
  days: [
    {
      date: '2026-03-30',
      label: day('Ponedeljek', 'Monday', 'Понеділок'),
      items: [
        { id: '2026-03-30-fit', category: 'bodi fit', title: meal('Piščančja tikka masala s kurkuminim rižem'), allergens: '2, 3' },
        { id: '2026-03-30-vege', category: 'vege', title: meal('Vege wrap z zelenjavo, krompirčkom, tzatzikijem in sladko pekočo omako'), allergens: '1, 2, 3' },
        { id: '2026-03-30-duo', category: 'ali pa..', title: meal('Duo krožnik s svinjskim zrezkom, piščančjim zrezkom, jurčkovo omako in pire krompirjem'), allergens: '1, 2, 3' },
        { id: '2026-03-30-fast', category: 'na hitro...', title: meal('Goveje makaronovo meso'), allergens: '1, 2, 3' },
      ],
    },
    {
      date: '2026-03-31',
      label: day('Torek', 'Tuesday', 'Вівторок'),
      items: [
        { id: '2026-03-31-fit', category: 'bodi fit', title: meal('Piščančji zrezek capresse, čičerikin humus in lečina solata po mediteransko'), allergens: '1, 2, 3' },
        { id: '2026-03-31-vege', category: 'vege', title: meal('Testenine v omaki štirih sirov'), allergens: '1, 2, 3' },
        { id: '2026-03-31-plate', category: 'ali pa..', title: meal('Kmečki krožnik s pečenico, prekajenim mesom, svinjsko pečenko, zeljem in praženim krompirjem'), allergens: '1' },
        { id: '2026-03-31-fast', category: 'na hitro...', title: meal('Telečja obara s čemaževimi vodnimi žličniki'), allergens: '1, 2, 3' },
      ],
    },
    {
      date: '2026-04-01',
      label: day('Sreda', 'Wednesday', 'Середа'),
      items: [
        { id: '2026-04-01-fit', category: 'bodi fit', title: meal('Cubisov krožnik z grško solato, piščancem, tzatzikijem in krompirčkom'), allergens: '1, 2, 3' },
        { id: '2026-04-01-vege', category: 'vege', title: meal('Yaki udon rezanci s tofujem, romaneskom, šitake gobami, bučkami in sezamom'), allergens: '1, 2, 7, 8, 9, 10, 11, 12' },
        { id: '2026-04-01-plate', category: 'ali pa..', title: meal('Svinjski kotlet po milansko, žafranova rižota in kremni grah'), allergens: '1, 2, 3' },
        { id: '2026-04-01-fast', category: 'na hitro...', title: meal('Čufte v kremni smetanovi omaki s pire krompirjem'), allergens: '3' },
      ],
    },
    {
      date: '2026-04-02',
      label: day('Četrtek', 'Thursday', 'Четвер'),
      items: [
        { id: '2026-04-02-fit', category: 'bodi fit', title: meal('Svinjski zrezek z lisičkovo omako, pečena polenta z rukolo in parmezanom'), allergens: '3' },
        { id: '2026-04-02-vege', category: 'vege', title: meal('Ocvrti sir, pomfri in domača tatarska omaka'), allergens: '1, 2, 3' },
        { id: '2026-04-02-plate', category: 'ali pa..', title: meal('Piščančji medaljoni v nacho omaki z mehiškim rižem'), allergens: '1, 2, 3' },
        { id: '2026-04-02-fast', category: 'na hitro...', title: meal('Testenine s pršutom in šparglji'), allergens: '1, 2, 3' },
      ],
    },
    {
      date: '2026-04-03',
      label: day('Petek', 'Friday', 'П’ятниця'),
      items: [
        { id: '2026-04-03-fit', category: 'bodi fit', title: meal('Tandoori piščanec s tajsko hrustljavo solato in arašidi'), allergens: '1, 3, 8, 9, 10, 11, 12' },
        { id: '2026-04-03-vege', category: 'vege', title: meal('Zelenjavni burger s krompirčkom in sladko pekočo omako'), allergens: '1, 2, 3' },
        { id: '2026-04-03-plate', category: 'ali pa..', title: meal('Ocvrti file ostriža po dunajsko s krompirjevo solato'), allergens: '1, 2, 3, 10' },
        { id: '2026-04-03-fast', category: 'na hitro...', title: meal('Grška musaka z mletim mesom, feta sirom in tzatzikijem'), allergens: '1, 2, 3' },
      ],
    },
  ],
  alwaysAvailable: [
    { id: 'always-schnitzel', category: 'stalna ponudba', title: meal('Dunajski zrezek z ocvrtim krompirjem'), isAlwaysAvailable: true },
    { id: 'always-fried-cheese', category: 'stalna ponudba', title: meal('Ocvrti sir z ocvrtim krompirjem in tatarsko omako'), isAlwaysAvailable: true },
    {
      id: 'always-salad',
      category: 'stalna ponudba',
      title: meal('Solatni krožnik s pečeno zelenjavo in izbiro dodatka'),
      description: meal('mocarela, šunka/sir, pečen piščanec ali tuna'),
      isAlwaysAvailable: true,
    },
    { id: 'always-burek', category: 'stalna ponudba', title: meal('Sirov ali mesni burek z jogurtom'), isAlwaysAvailable: true },
    { id: 'always-chicken', category: 'stalna ponudba', title: meal('Pečen piščančji file s pečeno zelenjavo'), isAlwaysAvailable: true },
  ],
}

export const defaultOrders: OrdersByDay = {
  '2026-03-31': {
    u1: { mealItemId: '2026-03-31-fit' },
    u2: { mealItemId: 'always-salad', note: 'brez mocarele' },
  },
  '2026-04-01': {
    u1: { mealItemId: '2026-04-01-fit' },
    u2: { mealItemId: '2026-04-01-vege' },
    u3: { mealItemId: '2026-04-01-fast' },
    u4: { mealItemId: 'always-fried-cheese' },
  },
  '2026-04-02': { u3: { mealItemId: '2026-04-02-vege' } },
}
