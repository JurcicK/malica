import { defaultWeeklyOffer, type MenuItem, type OrdersByDay, type UserProfile, type WeeklyOffer } from './mock-data'
import { autoTranslateText, type LocalizedText } from './meal-localization'
import { getSupabaseServerClient } from './supabase-server'

type DbUser = {
  id: string
  username: string
  password: string
  full_name: string | null
  role: 'admin' | 'employee'
  department: string | null
  active: boolean
}

type DbWeeklyOffer = {
  id: string
  week_label: LocalizedText | string | null
  source_label: LocalizedText | string | null
  cutoff_hour: number
  starts_on: string
  ends_on: string
  is_active: boolean
}

type DbMealItem = {
  id: string
  offer_id: string
  service_date: string | null
  category: MenuItem['category']
  title: LocalizedText | string
  description: LocalizedText | string | null
  allergens: string | null
  is_always_available: boolean
  sort_order: number | null
}

type DbOrder = {
  service_date: string
  user_id: string
  meal_item_id: string
  note: string | null
}

function asLocalizedText(value: LocalizedText | string | null | undefined) {
  if (!value) {
    return autoTranslateText('')
  }

  if (typeof value === 'string') {
    return autoTranslateText(value)
  }

  return value
}

function mapDbUsers(users: DbUser[]): UserProfile[] {
  return users
    .filter((user) => user.active)
    .map((user) => ({
      id: user.id,
      username: user.username,
      password: user.password,
      fullName: user.full_name || user.username,
      role: user.role,
      department: user.department || '',
    }))
}

function getWeekDates(startsOn: string, endsOn: string) {
  const dates: string[] = []
  const cursor = new Date(`${startsOn}T12:00:00`)
  const end = new Date(`${endsOn}T12:00:00`)

  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
}

function weekdayLabel(date: string) {
  const day = new Date(`${date}T12:00:00`).getDay()
  const labels: Record<number, LocalizedText> = {
    1: { sl: 'Ponedeljek', en: 'Monday', uk: 'Понеділок' },
    2: { sl: 'Torek', en: 'Tuesday', uk: 'Вівторок' },
    3: { sl: 'Sreda', en: 'Wednesday', uk: 'Середа' },
    4: { sl: 'Četrtek', en: 'Thursday', uk: 'Четвер' },
    5: { sl: 'Petek', en: 'Friday', uk: 'П’ятниця' },
    6: { sl: 'Sobota', en: 'Saturday', uk: 'Субота' },
    0: { sl: 'Nedelja', en: 'Sunday', uk: 'Неділя' },
  }

  return labels[day]
}

function mapDbOffer(offer: DbWeeklyOffer, items: DbMealItem[]): WeeklyOffer {
  const weekDates = getWeekDates(offer.starts_on, offer.ends_on)
  const alwaysAvailable = items
    .filter((item) => item.is_always_available)
    .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))
    .map((item) => ({
      id: item.id,
      category: item.category,
      title: asLocalizedText(item.title),
      description: item.description ? asLocalizedText(item.description) : undefined,
      allergens: item.allergens || undefined,
      isAlwaysAvailable: true,
    }))

  return {
    weekLabel: asLocalizedText(offer.week_label || defaultWeeklyOffer.weekLabel),
    sourceLabel: asLocalizedText(offer.source_label || defaultWeeklyOffer.sourceLabel),
    cutoffHour: offer.cutoff_hour,
    alwaysAvailable,
    days: weekDates.map((date) => ({
      date,
      label: weekdayLabel(date),
      items: items
        .filter((item) => item.service_date === date && !item.is_always_available)
        .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))
        .map((item) => ({
          id: item.id,
          category: item.category,
          title: asLocalizedText(item.title),
          description: item.description ? asLocalizedText(item.description) : undefined,
          allergens: item.allergens || undefined,
        })),
    })),
  }
}

export async function loadAppData() {
  const supabase = getSupabaseServerClient()

  const [{ data: users, error: usersError }, { data: activeOffer, error: offerError }] =
    await Promise.all([
      supabase.from('users').select('*').eq('active', true).order('full_name'),
      supabase
        .from('weekly_offers')
        .select('*')
        .eq('is_active', true)
        .order('starts_on', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

  if (usersError) throw usersError
  if (offerError) throw offerError

  const mappedUsers = mapDbUsers((users as DbUser[] | null) ?? [])

  if (!activeOffer) {
    return {
      users: mappedUsers,
      weeklyOffer: defaultWeeklyOffer,
      orders: {} as OrdersByDay,
    }
  }

  const [{ data: items, error: itemsError }, { data: orders, error: ordersError }] =
    await Promise.all([
      supabase
        .from('meal_items')
        .select('*')
        .eq('offer_id', activeOffer.id)
        .order('sort_order'),
      supabase
        .from('orders')
        .select('service_date,user_id,meal_item_id,note')
        .gte('service_date', activeOffer.starts_on)
        .lte('service_date', activeOffer.ends_on),
    ])

  if (itemsError) throw itemsError
  if (ordersError) throw ordersError

  const mappedOrders = ((orders as DbOrder[] | null) ?? []).reduce<OrdersByDay>((acc, order) => {
    acc[order.service_date] = {
      ...(acc[order.service_date] ?? {}),
      [order.user_id]: {
        mealItemId: order.meal_item_id,
        note: order.note || undefined,
      },
    }
    return acc
  }, {})

  return {
    users: mappedUsers,
    weeklyOffer: mapDbOffer(activeOffer as DbWeeklyOffer, (items as DbMealItem[] | null) ?? []),
    orders: mappedOrders,
  }
}
