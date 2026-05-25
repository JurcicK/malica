'use client'

import type { Dispatch, KeyboardEvent, SetStateAction } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  defaultOrders,
  defaultWeeklyOffer,
  demoUsers,
  type MealPeriod,
  type MenuCategory,
  type MenuItem,
  type OrdersByDay,
  type UserProfile,
  type WeeklyOffer,
} from '../lib/mock-data'
import {
  autoTranslateText,
  getLocalizedText,
  type LocalizedText,
} from '../lib/meal-localization'
import { formatTranslation, translations, type Language } from '../lib/translations'

const weeklyCategories: MenuCategory[] = ['bodi fit', 'vege', 'ali pa..', 'na hitro...']
const mealPeriods: MealPeriod[] = ['morning', 'afternoon']
const defaultMealPeriod: MealPeriod = 'morning'
const mealPeriodLabels: Record<MealPeriod, { sl: string; en: string; uk: string; bs: string }> = {
  morning: {
    sl: 'Dopoldanska malica',
    en: 'Morning meal',
    uk: 'ÄÂ ÄÂ°ÄËťÄĹźÄÄľÄË›ÄÂ° Ĺâ€”ÄÂ¶ÄÂ°',
    bs: 'Jutarnji obrok',
  },
  afternoon: {
    sl: 'Popoldanska malica',
    en: 'Afternoon meal',
    uk: 'ÄĹşĹâ€“ĹÂÄÂ»ĹĹąÄÄľÄÂ±Ĺâ€“ÄÂ´ÄËťĹĹą Ĺâ€”ÄÂ¶ÄÂ°',
    bs: 'Popodnevni obrok',
  },
}
const emptyLocalizedText = (): LocalizedText => ({ sl: '', en: '', uk: '', bs: '' })

type WeeklyDraftCell = LocalizedText
type WeeklyDraft = Record<string, Record<MenuCategory, WeeklyDraftCell>>
type WeeklyDraftByPeriod = Record<MealPeriod, WeeklyDraft>
type PrintDepartment = 'Pisarne' | 'Delavnica'
type AlwaysAvailableDraftItem = {
  id: string
  mealPeriod: MealPeriod
  title: LocalizedText
  description: LocalizedText
  allergens: string
  isEditing: boolean
}

function formatDate(dateString: string, language: Language) {
  const localeMap: Record<Language, string> = {
    sl: 'sl-SI',
    en: 'en-US',
    uk: 'uk-UA',
    bs: 'bs-BA',
  }

  return new Intl.DateTimeFormat(localeMap[language], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${dateString}T12:00:00`))
}

function isLocked(dateString: string, cutoffHour: number, now: Date) {
  return now >= new Date(`${dateString}T${String(cutoffHour).padStart(2, '0')}:00:00`)
}

function isPastDay(dateString: string, now: Date) {
  return dateString < now.toISOString().slice(0, 10)
}

function getInitialSelectedDay(offer: WeeklyOffer) {
  const today = new Date()
  const todayIso = today.toISOString().slice(0, 10)

  return (
    offer.days.find((day) => day.date === todayIso)?.date ??
    offer.days.find((day) => !isLocked(day.date, offer.cutoffHour, today))?.date ??
    offer.days[0].date
  )
}

function normalizeLocalizedValue(value: string | Partial<LocalizedText> | undefined) {
  if (!value) {
    return undefined
  }

  if (typeof value === 'string') {
    return autoTranslateText(value)
  }

  const sl = value.sl ?? ''
  const en = value.en ?? sl
  const uk = value.uk ?? sl
  const bs = value.bs ?? sl

  return { sl, en, uk, bs }
}

function normalizeWeeklyOffer(offer: WeeklyOffer): WeeklyOffer {
  return {
    ...offer,
    weekLabel: normalizeLocalizedValue(offer.weekLabel) ?? defaultWeeklyOffer.weekLabel,
    sourceLabel: normalizeLocalizedValue(offer.sourceLabel) ?? defaultWeeklyOffer.sourceLabel,
    days: offer.days.map((day, index) => ({
      ...day,
      label:
        normalizeLocalizedValue(day.label) ??
        defaultWeeklyOffer.days[index]?.label ??
        defaultWeeklyOffer.days[0].label,
      items: day.items.map((item) => ({
        ...item,
        mealPeriod: item.mealPeriod ?? defaultMealPeriod,
        title: normalizeLocalizedValue(item.title) ?? autoTranslateText('Unknown meal'),
        description: normalizeLocalizedValue(item.description),
      })),
    })),
    alwaysAvailable: offer.alwaysAvailable.map((item) => ({
      ...item,
      mealPeriod: item.mealPeriod ?? defaultMealPeriod,
      title: normalizeLocalizedValue(item.title) ?? autoTranslateText('Unknown meal'),
      description: normalizeLocalizedValue(item.description),
    })),
  }
}

function buildWeeklyDraft(offer: WeeklyOffer): WeeklyDraftByPeriod {
  return Object.fromEntries(
    mealPeriods.map((period) => [
      period,
      Object.fromEntries(
        offer.days.map((day) => [
          day.date,
          Object.fromEntries(
            weeklyCategories.map((category) => [
              category,
              (() => {
                const item = day.items.find(
                  (entry) => entry.category === category && entry.mealPeriod === period
                )
                return {
                  sl: getLocalizedText(item?.title, 'sl'),
                  en: getLocalizedText(item?.title, 'en'),
                  uk: getLocalizedText(item?.title, 'uk'),
                  bs: getLocalizedText(item?.title, 'bs'),
                }
              })(),
            ])
          ),
        ])
      ) as WeeklyDraft,
    ])
  ) as WeeklyDraftByPeriod
}

function buildAlwaysAvailableDraft(offer: WeeklyOffer) {
  return offer.alwaysAvailable.map((item): AlwaysAvailableDraftItem => ({
    id: item.id,
    mealPeriod: item.mealPeriod ?? defaultMealPeriod,
    title: {
      sl: getLocalizedText(item.title, 'sl'),
      en: getLocalizedText(item.title, 'en'),
      uk: getLocalizedText(item.title, 'uk'),
      bs: getLocalizedText(item.title, 'bs'),
    },
    description: {
      sl: getLocalizedText(item.description, 'sl'),
      en: getLocalizedText(item.description, 'en'),
      uk: getLocalizedText(item.description, 'uk'),
      bs: getLocalizedText(item.description, 'bs'),
    },
    allergens: item.allergens ?? '',
    isEditing: false,
  }))
}

function localizedDraftFromSlovenian(value: string) {
  const translated = autoTranslateText(value)
  return {
    sl: value,
    en: translated.en,
    uk: translated.uk,
    bs: translated.bs,
  }
}

function addDaysToIsoDate(dateString: string, days: number) {
  const next = new Date(`${dateString}T12:00:00`)
  next.setDate(next.getDate() + days)
  return next.toISOString().slice(0, 10)
}

function getMealPeriodLabel(period: MealPeriod, language: Language) {
  return mealPeriodLabels[period][language]
}

function getPeriodOrders(orders: OrdersByDay, date: string, period: MealPeriod) {
  return Object.entries(orders[date] ?? {})
    .map(([userId, userOrders]) => ({ userId, order: userOrders[period] }))
    .filter((entry): entry is { userId: string; order: NonNullable<typeof entry.order> } =>
      Boolean(entry.order)
    )
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export default function Home() {
  const [isReady, setIsReady] = useState(false)
  const [language, setLanguage] = useState<Language>('sl')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loggedInUser, setLoggedInUser] = useState<UserProfile | null>(null)
  const [users, setUsers] = useState<UserProfile[]>(demoUsers)
  const [orders, setOrders] = useState<OrdersByDay>(defaultOrders)
  const [weeklyOffer, setWeeklyOffer] = useState<WeeklyOffer>(defaultWeeklyOffer)
  const [selectedDay, setSelectedDay] = useState(defaultWeeklyOffer.days[0].date)
  const [selectedMealPeriod, setSelectedMealPeriod] = useState<MealPeriod | null>(null)
  const [now, setNow] = useState(new Date())
  const [pendingMeal, setPendingMeal] = useState<MenuItem | null>(null)
  const [pendingMealNote, setPendingMealNote] = useState('')
  const [pendingOrderRemoval, setPendingOrderRemoval] = useState<{ date: string; period: MealPeriod } | null>(null)
  const [newWeekStart, setNewWeekStart] = useState(addDaysToIsoDate(new Date().toISOString().slice(0, 10), 7))
  const [newWeekSource, setNewWeekSource] = useState('')
  const [copyAlwaysAvailableToNewWeek, setCopyAlwaysAvailableToNewWeek] = useState(true)
  const [weeklyDraft, setWeeklyDraft] = useState<WeeklyDraftByPeriod>(() => buildWeeklyDraft(defaultWeeklyOffer))
  const [alwaysAvailableDraft, setAlwaysAvailableDraft] = useState<AlwaysAvailableDraftItem[]>(() =>
    buildAlwaysAvailableDraft(defaultWeeklyOffer)
  )
  const [editingCells, setEditingCells] = useState<Record<string, boolean>>({})
  const [isSavingOffer, setIsSavingOffer] = useState(false)
  const [printDepartment, setPrintDepartment] = useState<PrintDepartment>('Pisarne')

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const normalizedOffer = normalizeWeeklyOffer(defaultWeeklyOffer)

      setOrders(defaultOrders)
      setWeeklyOffer(normalizedOffer)
      setSelectedDay(getInitialSelectedDay(normalizedOffer))
      setWeeklyDraft(buildWeeklyDraft(normalizedOffer))
      setAlwaysAvailableDraft(buildAlwaysAvailableDraft(normalizedOffer))
      const savedMealPeriod = window.localStorage.getItem('malica:selectedMealPeriod')
      if (savedMealPeriod === 'morning' || savedMealPeriod === 'afternoon') {
        setSelectedMealPeriod(savedMealPeriod)
      }
      setIsReady(true)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (selectedMealPeriod) {
      window.localStorage.setItem('malica:selectedMealPeriod', selectedMealPeriod)
    }
  }, [selectedMealPeriod])

  const t = translations[language]
  type AdminOrderPerson = { user: UserProfile; note: string | undefined }
  const removeMealModal = {
    sl: {
      title: 'Potrdi odjavo',
      body: 'Ali res zelis odjaviti malico za ta dan?',
    },
    en: {
      title: 'Confirm cancellation',
      body: 'Do you really want to cancel your meal for this day?',
    },
    uk: {
      title: 'ĐźŃ–Đ´Ń‚Đ˛ĐµŃ€Đ´Đ¸Ń‚Đ¸ ŃĐşĐ°ŃŃĐ˛Đ°Đ˝Đ˝ŃŹ',
      body: 'Đ’Đ¸ ŃĐżŃ€Đ°Đ˛Đ´Ń– Ń…ĐľŃ‡ĐµŃ‚Đµ ŃĐşĐ°ŃŃĐ˛Đ°Ń‚Đ¸ Đ·Đ°ĐĽĐľĐ˛Đ»ĐµĐ˝Đ˝ŃŹ Đ˝Đ° Ń†ĐµĐą Đ´ĐµĐ˝ŃŚ?',
    },
    bs: {
      title: 'Potvrdi odjavu',
      body: 'Da li stvarno ĹľeliĹˇ odjaviti obrok za ovaj dan?',
    },
  } satisfies Record<Language, { title: string; body: string }>

  const visibleOfferDays = useMemo(
    () =>
      loggedInUser?.role === 'employee'
        ? weeklyOffer.days.filter((day) => !isPastDay(day.date, now))
        : weeklyOffer.days,
    [loggedInUser?.role, now, weeklyOffer.days]
  )
  const activeSelectedDay = useMemo(() => {
    const selectedStillVisible = visibleOfferDays.some((day) => day.date === selectedDay)
    return selectedStillVisible ? selectedDay : visibleOfferDays[0]?.date ?? selectedDay
  }, [selectedDay, visibleOfferDays])
  const selectedOfferDay = useMemo(
    () => visibleOfferDays.find((day) => day.date === activeSelectedDay) ?? visibleOfferDays[0] ?? weeklyOffer.days[0],
    [activeSelectedDay, visibleOfferDays, weeklyOffer.days]
  )
  const activeMealPeriod = selectedMealPeriod ?? defaultMealPeriod

  const mergedItems = useMemo(
    () => [
      ...selectedOfferDay.items.filter((item) => item.mealPeriod === activeMealPeriod),
      ...weeklyOffer.alwaysAvailable.filter((item) => item.mealPeriod === activeMealPeriod),
    ],
    [activeMealPeriod, selectedOfferDay, weeklyOffer.alwaysAvailable]
  )

  const selectedOrder = loggedInUser ? orders[activeSelectedDay]?.[loggedInUser.id]?.[activeMealPeriod] : undefined
  const selectedOrderId = selectedOrder?.mealItemId
  const isSelectedDayLocked = isLocked(selectedOfferDay.date, weeklyOffer.cutoffHour, now)
  const normalizeDepartment = (department: string) => {
    const normalized = department.trim().toLowerCase()

    if (normalized === 'delavnica') {
      return 'Delavnica'
    }

    if (normalized === 'pisarne' || normalized === 'pisarna') {
      return 'Pisarne'
    }

    return department.trim() || 'Ostalo'
  }

  const adminBreakdown = mergedItems
    .map((item) => {
      const people = getPeriodOrders(orders, selectedOfferDay.date, activeMealPeriod)
        .filter(({ order }) => order.mealItemId === item.id)
        .map(({ userId, order }) => {
          const user = users.find((candidate) => candidate.id === userId)
          return user ? { user, note: order.note } : null
        })
        .filter((entry): entry is AdminOrderPerson => Boolean(entry))

      return { item, people }
    })
    .filter(({ people }) => people.length > 0)
  const adminByDepartment = Object.entries(
    adminBreakdown.reduce<
      Record<
        string,
        Array<{
          item: (typeof adminBreakdown)[number]['item']
          people: AdminOrderPerson[]
        }>
      >
    >((acc, entry) => {
      const groupedPeople = entry.people.reduce<Record<string, AdminOrderPerson[]>>((grouped, person) => {
        const department = normalizeDepartment(person.user.department)
        grouped[department] = [...(grouped[department] ?? []), person]
        return grouped
      }, {})

      for (const [department, people] of Object.entries(groupedPeople)) {
        acc[department] = [
          ...(acc[department] ?? []),
          {
            item: entry.item,
            people,
          },
        ]
      }

      return acc
    }, {})
  ).sort(([a], [b]) => {
    const order = ['Delavnica', 'Pisarne', 'Ostalo']
    const aIndex = order.indexOf(a)
    const bIndex = order.indexOf(b)
    const safeA = aIndex === -1 ? order.length : aIndex
    const safeB = bIndex === -1 ? order.length : bIndex

    if (safeA !== safeB) {
      return safeA - safeB
    }

    return a.localeCompare(b, 'sl')
  })
  const adminDepartmentSummary = adminByDepartment.map(([department, meals]) => ({
    department,
    total: meals.reduce((sum, meal) => sum + meal.people.length, 0),
  }))
  const printOrdersCard = (department: PrintDepartment) => {
    setPrintDepartment(department)
    const departmentMeals = adminByDepartment.find(([name]) => name === department)?.[1] ?? []
    const total = departmentMeals.reduce((sum, meal) => sum + meal.people.length, 0)
    const title = `${t.whoOrdered} - ${getLocalizedText(selectedOfferDay.label, language)} - ${getMealPeriodLabel(activeMealPeriod, language)}`
    const dateLabel = formatDate(selectedOfferDay.date, language)
    const mealRows = departmentMeals.length
      ? departmentMeals
          .map(
            ({ item, people }) => `
              <section class="meal">
                <div class="meal-head">
                  <div>
                    <p class="category">${escapeHtml(t.categoryLabels[item.category])}</p>
                    <h2>${escapeHtml(getLocalizedText(item.title, language))}</h2>
                  </div>
                  <strong>${people.length}</strong>
                </div>
                <div class="people">
                  ${people
                    .map(({ user, note }) =>
                      `<span>${escapeHtml(user.fullName)}${note ? ` (${escapeHtml(note)})` : ''}</span>`
                    )
                    .join('')}
                </div>
              </section>
            `
          )
          .join('')
      : '<p class="empty">Za izbran oddelek ni naročil.</p>'

    const printWindow = window.open('', '_blank', 'width=900,height=700')

    if (!printWindow) {
      window.print()
      return
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${escapeHtml(title)}</title>
          <style>
            @page { margin: 14mm; }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              color: #1d1d1b;
              font-family: Arial, sans-serif;
              background: white;
            }
            .card {
              width: 100%;
              border: 1px solid #ddd3c4;
              border-radius: 14px;
              padding: 22px;
            }
            .eyebrow {
              margin: 0 0 6px;
              color: #b45309;
              font-size: 11px;
              font-weight: 700;
              letter-spacing: .16em;
              text-transform: uppercase;
            }
            h1 {
              margin: 0;
              font-size: 26px;
              line-height: 1.2;
            }
            .meta {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 10px;
              margin: 18px 0;
            }
            .meta div {
              border: 1px solid #eadfce;
              border-radius: 10px;
              padding: 10px 12px;
              background: #fffaf1;
            }
            .meta p {
              margin: 0 0 4px;
              color: #675d4f;
              font-size: 12px;
              font-weight: 700;
            }
            .meta strong {
              font-size: 18px;
            }
            .meal {
              break-inside: avoid;
              border: 1px solid #eadfce;
              border-radius: 12px;
              padding: 14px;
              margin-top: 12px;
            }
            .meal-head {
              display: flex;
              justify-content: space-between;
              gap: 16px;
            }
            .category {
              margin: 0;
              color: #b45309;
              font-size: 11px;
              font-weight: 700;
              letter-spacing: .14em;
              text-transform: uppercase;
            }
            h2 {
              margin: 5px 0 0;
              font-size: 18px;
            }
            .meal-head strong {
              border: 1px solid #eadfce;
              border-radius: 999px;
              min-width: 38px;
              height: 30px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              background: #fff0df;
              color: #9a3412;
            }
            .people {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              margin-top: 12px;
            }
            .people span {
              border: 1px solid #eadfce;
              border-radius: 999px;
              padding: 6px 10px;
            }
            .empty {
              margin: 18px 0 0;
              color: #675d4f;
            }
          </style>
        </head>
        <body>
          <main class="card">
            <p class="eyebrow">Admin pregled</p>
            <h1>${escapeHtml(title)}</h1>
            <section class="meta">
              <div>
                <p>Datum</p>
                <strong>${escapeHtml(dateLabel)}</strong>
              </div>
              <div>
                <p>Oddelek</p>
                <strong>${escapeHtml(department)}</strong>
              </div>
              <div>
                <p>Skupaj</p>
                <strong>${total}</strong>
              </div>
            </section>
            ${mealRows}
          </main>
          <script>
            window.addEventListener('load', () => {
              window.print();
              window.setTimeout(() => window.close(), 250);
            });
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const translateLocalizedText = async (value: string) => {
    if (!value.trim()) {
      return emptyLocalizedText()
    }

    try {
      const response = await fetch('/api/translate-meal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: value,
        }),
      })

      if (!response.ok) {
        return localizedDraftFromSlovenian(value)
      }

      const data = (await response.json()) as {
        translation?: LocalizedText
      }

      return data.translation
        ? {
            sl: value,
            en: data.translation.en,
            uk: data.translation.uk,
            bs: data.translation.bs,
          }
        : localizedDraftFromSlovenian(value)
    } catch {
      return localizedDraftFromSlovenian(value)
    }
  }

  const autoTranslateWeeklyCell = async (
    period: MealPeriod,
    date: string,
    category: MenuCategory,
    value: string
  ) => {
    const translation = await translateLocalizedText(value)

    setWeeklyDraft((current) => ({
      ...current,
      [period]: {
        ...current[period],
        [date]: {
          ...(current[period]?.[date] ?? {}),
          [category]: translation,
        } as Record<MenuCategory, WeeklyDraftCell>,
      },
    }))
  }

  const autoTranslateAlwaysAvailableField = async (
    id: string,
    field: 'title' | 'description',
    value: string
  ) => {
    const translation = await translateLocalizedText(value)

    setAlwaysAvailableDraft((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: translation,
            }
          : item
      )
    )
  }

  const login = async () => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      })

      if (!response.ok) {
        setMessage(t.badLogin)
        return
      }

      const data = (await response.json()) as {
        user?: UserProfile
        users?: UserProfile[]
        weeklyOffer?: WeeklyOffer
        orders?: OrdersByDay
      }

      if (!data.user || !data.users || !data.weeklyOffer || !data.orders) {
        setMessage(t.badLogin)
        return
      }

      setUsers(data.users)
      setWeeklyOffer(data.weeklyOffer)
      setWeeklyDraft(buildWeeklyDraft(data.weeklyOffer))
      setAlwaysAvailableDraft(buildAlwaysAvailableDraft(data.weeklyOffer))
      setOrders(data.orders)
      setSelectedDay(getInitialSelectedDay(data.weeklyOffer))
      setLoggedInUser(data.user)
      setMessage('')
    } catch {
      setMessage(t.badLogin)
    }
  }

  const logout = () => {
    setLoggedInUser(null)
    setUsername('')
    setPassword('')
    setMessage('')
  }

  const handleLogin = async () => {
    await login()
  }

  const placeOrder = async (itemId: string) => {
    if (!loggedInUser || loggedInUser.role !== 'employee' || !selectedMealPeriod) return

    if (isSelectedDayLocked) {
      setMessage(
        formatTranslation(t.dayLockedMessage, {
          day: getLocalizedText(selectedOfferDay.label, language),
          hour: weeklyOffer.cutoffHour,
        })
      )
      return
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceDate: selectedOfferDay.date,
          userId: loggedInUser.id,
          mealItemId: itemId,
          mealPeriod: selectedMealPeriod,
          note: pendingMeal?.isAlwaysAvailable ? pendingMealNote : '',
        }),
      })

      if (!response.ok) {
        setMessage('Shranjevanje naroÄŤila v bazo ni uspelo.')
        return
      }
    } catch {
      setMessage('Shranjevanje naroÄŤila v bazo ni uspelo.')
      return
    }

    setOrders((current) => ({
      ...current,
      [selectedOfferDay.date]: {
        ...(current[selectedOfferDay.date] ?? {}),
        [loggedInUser.id]: {
          ...(current[selectedOfferDay.date]?.[loggedInUser.id] ?? {}),
          [selectedMealPeriod]: {
            mealItemId: itemId,
            note: pendingMeal?.isAlwaysAvailable ? pendingMealNote.trim() || undefined : undefined,
          },
        },
      },
    }))

    setMessage(
      formatTranslation(t.orderSaved, {
        day: `${getLocalizedText(selectedOfferDay.label, language).toLowerCase()} (${getMealPeriodLabel(selectedMealPeriod, language)})`,
      })
    )
    setPendingMeal(null)
    setPendingMealNote('')
  }

  const removeOrder = async (dayDate: string, mealPeriod: MealPeriod) => {
    if (!loggedInUser || loggedInUser.role !== 'employee') return

    const day = weeklyOffer.days.find((entry) => entry.date === dayDate)

    if (!day) {
      return
    }

    if (isLocked(dayDate, weeklyOffer.cutoffHour, now)) {
      setMessage(
        formatTranslation(t.dayLockedMessage, {
          day: getLocalizedText(day.label, language),
          hour: weeklyOffer.cutoffHour,
        })
      )
      return
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceDate: dayDate,
          userId: loggedInUser.id,
          mealPeriod,
        }),
      })

      if (!response.ok) {
        setMessage('Odjava malice iz baze ni uspela.')
        return
      }
    } catch {
      setMessage('Odjava malice iz baze ni uspela.')
      return
    }

    setOrders((current) => ({
      ...current,
      [dayDate]: Object.fromEntries(
        Object.entries(current[dayDate] ?? {}).map(([userId, userOrders]) => [
          userId,
          userId === loggedInUser.id
            ? Object.fromEntries(
                Object.entries(userOrders).filter(([period]) => period !== mealPeriod)
              )
            : userOrders,
        ])
      ),
    }))

    setMessage(
      `${t.remove}: ${getLocalizedText(day.label, language).toLowerCase()} (${getMealPeriodLabel(mealPeriod, language)})`
    )
  }

  const createNewWeek = async () => {
    try {
      const response = await fetch('/api/weekly-offer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'createWeek',
          startsOn: newWeekStart,
          cutoffHour: weeklyOffer.cutoffHour,
          copyAlwaysAvailable: copyAlwaysAvailableToNewWeek,
          sourceLabel: newWeekSource.trim()
            ? localizedDraftFromSlovenian(newWeekSource)
            : undefined,
        }),
      })

      if (!response.ok) {
        setMessage('Ustvarjanje novega tedna ni uspelo.')
        return
      }

      const data = (await response.json()) as {
        weeklyOffer?: WeeklyOffer
        orders?: OrdersByDay
      }

      if (!data.weeklyOffer) {
        setMessage('Ustvarjanje novega tedna ni uspelo.')
        return
      }

      setWeeklyOffer(data.weeklyOffer)
      setWeeklyDraft(buildWeeklyDraft(data.weeklyOffer))
      setAlwaysAvailableDraft(buildAlwaysAvailableDraft(data.weeklyOffer))
      setOrders(data.orders ?? {})
      setSelectedDay(getInitialSelectedDay(data.weeklyOffer))
      setEditingCells({})
      setMessage('Novi teden je ustvarjen in nastavljen kot aktiven.')
    } catch {
      setMessage('Ustvarjanje novega tedna ni uspelo.')
    }
  }

  const saveWeeklyOffer = async () => {
    const hasAnyMeal = Object.values(weeklyDraft[activeMealPeriod]).some((dayDraft) =>
      weeklyCategories.some((category) => dayDraft[category]?.sl?.trim())
    )

    if (!hasAnyMeal) {
      setMessage(t.enterMealTitle)
      return
    }

    setIsSavingOffer(true)

    const nextDays = await Promise.all(
      weeklyOffer.days.map(async (day) => {
        const otherPeriodItems = day.items.filter((item) => item.mealPeriod !== activeMealPeriod)
        const nextItems = await Promise.all(
          weeklyCategories.map(async (category) => {
            const title = weeklyDraft[activeMealPeriod][day.date]?.[category]
            const existingItem = day.items.find(
              (item) => item.category === category && item.mealPeriod === activeMealPeriod
            )

            if (!title?.sl?.trim()) {
              return null
            }

            return {
              id: existingItem?.id ?? `${day.date}-${category}`,
              category,
              mealPeriod: activeMealPeriod,
              title,
              allergens: existingItem?.allergens,
              description: existingItem?.description,
            } satisfies MenuItem
          })
        )

        return {
          ...day,
          items: [
            ...otherPeriodItems,
            ...nextItems.filter((item): item is NonNullable<typeof item> => item !== null),
          ],
        }
      })
    )

    const nextOffer = {
      ...weeklyOffer,
      days: nextDays,
      alwaysAvailable: weeklyOffer.alwaysAvailable,
    }

    await saveOfferToSupabase(nextOffer)
  }

  const saveAlwaysAvailable = async () => {
    const nonEmptyItems = alwaysAvailableDraft.filter(
      (item) => item.mealPeriod === activeMealPeriod && item.title.sl.trim()
    )

    if (nonEmptyItems.length === 0) {
      setMessage(t.enterMealTitle)
      return
    }

    setIsSavingOffer(true)

    const alwaysAvailable = nonEmptyItems.map((item) => {
      const existingItem = weeklyOffer.alwaysAvailable.find((candidate) => candidate.id === item.id)

      return {
        id: existingItem?.id ?? item.id,
        category: 'stalna ponudba' as const,
        mealPeriod: activeMealPeriod,
        title: item.title,
        description: item.description.sl.trim() ? item.description : undefined,
        allergens: item.allergens.trim() || undefined,
        isAlwaysAvailable: true,
      } satisfies MenuItem
    })

    const nextOffer = {
      ...weeklyOffer,
      alwaysAvailable: [
        ...weeklyOffer.alwaysAvailable.filter((item) => item.mealPeriod !== activeMealPeriod),
        ...alwaysAvailable,
      ],
    }

    await saveOfferToSupabase(nextOffer)
  }

  const saveOfferToSupabase = async (nextOffer: WeeklyOffer) => {
    try {
      const response = await fetch('/api/weekly-offer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weeklyOffer: nextOffer,
        }),
      })

      if (!response.ok) {
        setMessage('Shranjevanje ponudbe v Supabase ni uspelo.')
        setIsSavingOffer(false)
        return
      }

      const data = (await response.json()) as {
        weeklyOffer?: WeeklyOffer
        orders?: OrdersByDay
      }

      const savedOffer = data.weeklyOffer ?? nextOffer
      const savedOrders = data.orders ?? orders

      setWeeklyOffer(savedOffer)
      setWeeklyDraft(buildWeeklyDraft(savedOffer))
      setAlwaysAvailableDraft(buildAlwaysAvailableDraft(savedOffer))
      setOrders(savedOrders)
      setEditingCells({})
      setMessage(t.mealAdded)
      setIsSavingOffer(false)
    } catch {
      setMessage('Shranjevanje ponudbe v Supabase ni uspelo.')
      setIsSavingOffer(false)
    }
  }

  const removeMeal = (itemId: string, date?: string) => {
    setWeeklyOffer((current) => ({
      ...current,
      alwaysAvailable: current.alwaysAvailable.filter((item) => item.id !== itemId),
      days: current.days.map((day) =>
        date && day.date !== date
          ? day
          : { ...day, items: day.items.filter((item) => item.id !== itemId) }
      ),
    }))

    setOrders((current) =>
      Object.fromEntries(
        Object.entries(current).map(([dateKey, dailyOrders]) => [
          dateKey,
          Object.fromEntries(
            Object.entries(dailyOrders).map(([userId, userOrders]) => [
              userId,
              Object.fromEntries(
                Object.entries(userOrders).filter(([, order]) => order?.mealItemId !== itemId)
              ),
            ])
          ),
        ])
      )
    )

    if (date) {
      setWeeklyDraft((current) => {
        const nextDraft = { ...current }
        const dayDraft = { ...(nextDraft[activeMealPeriod]?.[date] ?? {}) }
        for (const category of weeklyCategories) {
          const matchingItem = weeklyOffer.days
            .find((day) => day.date === date)
            ?.items.find(
              (item) =>
                item.id === itemId &&
                item.category === category &&
                item.mealPeriod === activeMealPeriod
            )

          if (matchingItem) {
            dayDraft[category] = emptyLocalizedText()
          }
        }
        nextDraft[activeMealPeriod][date] = dayDraft as Record<MenuCategory, WeeklyDraftCell>
        return nextDraft
      })
    }
  }

  const addAlwaysAvailableDraftRow = () => {
    setAlwaysAvailableDraft((current) => [
      ...current,
      {
        id: `always-draft-${Date.now()}`,
        mealPeriod: activeMealPeriod,
        title: emptyLocalizedText(),
        description: emptyLocalizedText(),
        allergens: '',
        isEditing: true,
      },
    ])
  }

  const updateAlwaysAvailableDraft = (
    id: string,
    field: 'title' | 'description' | 'allergens',
    value: string,
    fieldLanguage?: Language
  ) => {
    setAlwaysAvailableDraft((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item
        }

        if (field === 'allergens') {
          return { ...item, allergens: value }
        }

        if (!fieldLanguage) {
          return item
        }

        if (fieldLanguage === 'sl') {
          return {
            ...item,
            [field]: localizedDraftFromSlovenian(value),
          }
        }

        return {
          ...item,
          [field]: {
            ...item[field],
            [fieldLanguage]: value,
          },
        }
      })
    )
  }

  const setAlwaysAvailableEditing = (id: string, isEditing: boolean) => {
    setAlwaysAvailableDraft((current) =>
      current.map((item) => (item.id === id ? { ...item, isEditing } : item))
    )
  }

  const removeAlwaysAvailableDraft = (id: string) => {
    setAlwaysAvailableDraft((current) => current.filter((item) => item.id !== id))
  }

  if (!isReady) {
    return (
      <main className="page-shell warm-grid flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="glass-panel relative z-10 w-full max-w-xl rounded-[2rem] p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
            {t.appName}
          </p>
          <h1 className="mt-4 font-[var(--font-display)] text-3xl font-bold">{t.loading}</h1>
        </div>
      </main>
    )
  }

  if (!loggedInUser) {
    return (
      <main className="page-shell warm-grid flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="relative z-10 w-full max-w-xl">
          <section className="glass-panel rounded-[2rem] p-6 sm:p-8 lg:p-10">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                {t.appName}
              </p>
              <LanguageSwitcher language={language} setLanguage={setLanguage} />
            </div>
            <h1 className="mt-4 font-[var(--font-display)] text-4xl font-bold leading-tight sm:text-5xl">
              {t.heroTitle}
            </h1>
            <p className="mt-5 text-base leading-7 text-[var(--muted)] sm:text-lg">
              {t.heroBody}
            </p>
            <h2 className="mt-8 font-[var(--font-display)] text-3xl font-bold">{t.loginTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{t.loginSubtitle}</p>
            <div className="mt-8 space-y-4">
              <Field label={t.username} value={username} onChange={setUsername} placeholder="npr. admin" />
              <Field
                label={t.password}
                value={password}
                onChange={setPassword}
                placeholder={t.password}
                type="password"
                onEnter={handleLogin}
              />
              <button
                type="button"
                onClick={handleLogin}
                onTouchEnd={handleLogin}
                className="relative z-10 w-full cursor-pointer rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white transition hover:bg-[var(--accent-strong)] active:scale-[0.99]"
              >
                {t.loginButton}
              </button>
            </div>
            {message ? <MessageBox message={message} className="mt-6 bg-[var(--accent-soft)]" /> : null}
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="page-shell warm-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="glass-panel rounded-[2rem] p-5 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                {getLocalizedText(weeklyOffer.weekLabel, language)}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="mt-3 font-[var(--font-display)] text-3xl font-bold sm:text-4xl">
                  {t.welcome}, {loggedInUser.fullName}
                </h1>
                <LanguageSwitcher language={language} setLanguage={setLanguage} />
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)] sm:text-base">
                {loggedInUser.role === 'admin' ? t.adminIntro : t.employeeIntro}
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {t.weekSourceIntro}: {getLocalizedText(weeklyOffer.sourceLabel, language)}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3 text-sm">
                <p className="font-semibold">{loggedInUser.department}</p>
                <p className="text-[var(--muted)]">
                  {now.toLocaleDateString(language === 'uk' ? 'uk-UA' : language === 'en' ? 'en-US' : 'sl-SI')} {' '}
                  {language === 'sl' ? 'ob' : language === 'uk' ? 'Đľ' : 'at'}{' '}
                  {now.toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button onClick={logout} className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold transition hover:bg-orange-50">
                {t.logout}
              </button>
            </div>
          </div>
        </section>

        <section className={`grid gap-6 ${loggedInUser.role === 'admin' ? '' : 'lg:grid-cols-[0.42fr_0.58fr]'}`}>
          {!selectedMealPeriod && loggedInUser.role === 'employee' ? (
            <section className="glass-panel rounded-[2rem] p-5 sm:p-6 lg:col-span-2">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                Termin naročanja
              </p>
              <h2 className="mt-2 font-[var(--font-display)] text-3xl font-bold">
                Najprej izberi termin malice
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                Dnevi in ponudba se prikaĹľejo po izbiri termina. Izbira ostane shranjena, zato lahko potem naroÄŤiĹˇ cel teden brez vraÄŤanja na ta korak.
              </p>
              <div className="mt-6 max-w-md">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--muted)]">
                    Termin malice
                  </span>
                  <select
                    value=""
                    onChange={(event) => setSelectedMealPeriod(event.target.value as MealPeriod)}
                    className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-base font-semibold outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-orange-100"
                  >
                    <option value="" disabled>
                      Izberi dopoldansko ali popoldansko malico
                    </option>
                    {mealPeriods.map((period) => (
                      <option key={period} value={period}>
                        {getMealPeriodLabel(period, language)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>
          ) : (
          <>
          <aside className="glass-panel self-start rounded-[2rem] p-5 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
              {t.days}
            </p>
            <div className={`mt-4 ${loggedInUser.role === 'admin' ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-5' : 'space-y-3'}`}>
              {visibleOfferDays.map((day) => {
                const locked = isLocked(day.date, weeklyOffer.cutoffHour, now)
                const dayOrders = getPeriodOrders(orders, day.date, activeMealPeriod).length
                const userOrder = loggedInUser ? orders[day.date]?.[loggedInUser.id]?.[activeMealPeriod] : undefined
                const userOrderId = userOrder?.mealItemId
                const chosenItem = userOrderId
                  ? [...day.items, ...weeklyOffer.alwaysAvailable].find(
                      (item) => item.id === userOrderId && item.mealPeriod === activeMealPeriod
                    )
                  : undefined
                const needsAttention = loggedInUser.role === 'employee' && !chosenItem
                const dayCardClass = `w-full rounded-[1.5rem] border px-4 py-4 text-left transition ${
                  activeSelectedDay === day.date
                    ? 'border-orange-300 bg-orange-50'
                    : needsAttention
                      ? 'border-rose-200 bg-rose-50/90 hover:bg-rose-50'
                      : 'border-[var(--line)] bg-white/70 hover:bg-white'
                }`

                return (
                  <div key={day.date} className={dayCardClass}>
                    <button type="button" onClick={() => setSelectedDay(day.date)} className="w-full text-left">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-[var(--font-display)] text-lg font-semibold">
                            {getLocalizedText(day.label, language)}
                          </p>
                          <p className="mt-1 text-sm text-[var(--muted)]">{formatDate(day.date, language)}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${locked ? 'bg-stone-200 text-stone-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {locked ? t.locked : t.open}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-[var(--muted)]">
                        {day.items.length + weeklyOffer.alwaysAvailable.length} {t.availableMeals}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {dayOrders} {t.registrationsForDay}
                      </p>
                    </button>
                    {loggedInUser.role === 'employee' ? (
                      <div className={`mt-4 flex items-center justify-between gap-3 rounded-2xl px-3 py-2 text-sm ${
                        chosenItem ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-100 text-rose-800'
                      }`}>
                        <span className="min-w-0 flex-1 pr-2">
                          {chosenItem
                            ? `${t.selectedForDay} ${getLocalizedText(chosenItem.title, language)}`
                            : t.nothingSelected}
                        </span>
                        {chosenItem && !locked ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setPendingOrderRemoval({ date: day.date, period: activeMealPeriod })
                            }}
                            className="shrink-0 rounded-xl border border-emerald-200 bg-white/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800 transition hover:bg-white"
                          >
                            {t.remove}
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </aside>

          <div className="space-y-6">
            <section className="glass-panel rounded-[2rem] p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                    {getLocalizedText(selectedOfferDay.label, language)}
                  </p>
                  <h2 className="mt-2 font-[var(--font-display)] text-3xl font-bold">
                    {formatDate(selectedOfferDay.date, language)}
                  </h2>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <label className="block w-full sm:max-w-xs">
                      <span className="mb-2 block text-sm font-medium text-[var(--muted)]">
                        {loggedInUser.role === 'admin' ? 'Termin ponudbe' : 'Termin naročanja'}
                      </span>
                      <select
                        value={activeMealPeriod}
                        onChange={(event) => setSelectedMealPeriod(event.target.value as MealPeriod)}
                        className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-orange-100"
                      >
                        {mealPeriods.map((period) => (
                          <option key={period} value={period}>
                            {getMealPeriodLabel(period, language)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-900">
                      {loggedInUser.role === 'admin' ? 'Pregleduješ' : 'Naročaš'}: {getMealPeriodLabel(activeMealPeriod, language)}
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3 text-sm">
                  <p className="font-semibold">
                    {t.cutoffAt} {String(weeklyOffer.cutoffHour).padStart(2, '0')}:00
                  </p>
                  <p className="text-[var(--muted)]">
                    {isSelectedDayLocked ? t.orderingClosed : t.orderingOpen}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                {mergedItems.map((item) => {
                  const selected = selectedOrderId === item.id
                  const count = getPeriodOrders(orders, activeSelectedDay, activeMealPeriod).filter(
                    ({ order }) => order.mealItemId === item.id
                  ).length

                  return (
                    <article key={item.id} className={`rounded-[1.6rem] border p-5 transition ${selected ? 'border-orange-300 bg-orange-50' : 'border-[var(--line)] bg-white/75'}`}>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="max-w-2xl">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                            {t.categoryLabels[item.category]}
                          </p>
                          <h3 className="mt-2 font-[var(--font-display)] text-xl font-semibold">
                            {getLocalizedText(item.title, language)}
                          </h3>
                          {item.description ? (
                            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                              {getLocalizedText(item.description, language)}
                            </p>
                          ) : null}
                          {item.allergens ? (
                            <p className="mt-3 text-sm text-[var(--muted)]">
                              {t.allergens}: {item.allergens}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-col items-start gap-3 sm:items-end">
                          <span className="rounded-full border border-[var(--line)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                            {count} {t.registrationsForDay}
                          </span>
                          {loggedInUser.role === 'employee' ? (
                            <button
                              onClick={() => {
                                setPendingMeal(item)
                                setPendingMealNote(selected && selectedOrder?.note ? selectedOrder.note : '')
                              }}
                              disabled={isSelectedDayLocked}
                              className="relative z-10 rounded-2xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-stone-300"
                            >
                              {selected ? t.selected : `${t.chooseMealButton} (${getMealPeriodLabel(activeMealPeriod, language)})`}
                            </button>
                          ) : (
                            <button
                              onClick={() => removeMeal(item.id, item.isAlwaysAvailable ? undefined : activeSelectedDay)}
                              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold transition hover:bg-orange-50"
                            >
                              {t.remove}
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>

            {loggedInUser.role === 'admin' ? (
              <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="printable-order-card glass-panel rounded-[1.5rem] p-4 sm:p-5 xl:col-span-2">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                        {t.adminOverview}
                      </p>
                      <h3 className="mt-1 font-[var(--font-display)] text-2xl font-bold">
                        {t.whoOrdered} - {getLocalizedText(selectedOfferDay.label, language)} - {getMealPeriodLabel(activeMealPeriod, language)}
                      </h3>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        {formatDate(selectedOfferDay.date, language)}
                      </p>
                    </div>
                    <div className="print-hide flex flex-col gap-2 sm:flex-row lg:items-center">
                      {(['Pisarne', 'Delavnica'] as PrintDepartment[]).map((department) => (
                        <button
                          key={department}
                          type="button"
                          onClick={() => setPrintDepartment(department)}
                          className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                            printDepartment === department
                              ? 'border-orange-300 bg-orange-50 text-orange-900'
                              : 'border-[var(--line)] bg-white text-[var(--foreground)] hover:bg-orange-50'
                          }`}
                        >
                          {department}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => printOrdersCard(printDepartment)}
                        className="rounded-2xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                      >
                        Tiskaj
                      </button>
                    </div>
                  </div>
                  {adminDepartmentSummary.length > 0 ? (
                    <div className="print-hide mt-4 grid gap-3 sm:grid-cols-3">
                      {adminDepartmentSummary.map(({ department, total }) => (
                        <div key={department} className="rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                            {department}
                          </p>
                          <p className="mt-1 font-[var(--font-display)] text-2xl font-semibold">{total}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1 print:max-h-none print:overflow-visible print:pr-0">
                    {adminByDepartment.length === 0 ? (
                      <div className="rounded-[1rem] border border-[var(--line)] bg-white/70 p-4 text-sm text-[var(--muted)]">
                        {t.noOrders}
                      </div>
                    ) : (
                      adminByDepartment.map(([department, meals]) => (
                        <div
                          key={department}
                          className={`rounded-[1.1rem] border border-[var(--line)] bg-white/75 p-4 ${
                            department === printDepartment ? '' : 'print-department-hidden'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <p className="font-[var(--font-display)] text-xl font-semibold">{department}</p>
                            <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-800">
                              {meals.reduce((sum, meal) => sum + meal.people.length, 0)}
                            </span>
                          </div>
                          <div className="mt-4 space-y-4">
                            {meals.map(({ item, people }) => (
                              <div key={`${department}-${item.id}`} className="rounded-[1rem] border border-[var(--line)] bg-white p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                                      {t.categoryLabels[item.category]}
                                    </p>
                                    <p className="mt-2 font-[var(--font-display)] text-lg font-semibold">
                                      {getLocalizedText(item.title, language)}
                                    </p>
                                  </div>
                                  <span className="rounded-full border border-[var(--line)] bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-800">
                                    {people.length}
                                  </span>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {people.map(({ user, note }) => (
                                    <span key={user.id} className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-sm">
                                      {user.fullName}
                                      {note ? ` (${note})` : ''}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="glass-panel rounded-[1.5rem] p-4 sm:p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                    Novi teden
                  </p>
                  <h3 className="mt-1 font-[var(--font-display)] text-2xl font-bold">Priprava naslednjega tedna</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Ustvari nov aktiven teden. Prejsnji ostane shranjen v arhivu, uporabniki pa bodo videli samo novega.
                  </p>
                  <div className="mt-4 grid gap-3">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-[var(--muted)]">Zacetek tedna</span>
                      <input
                        type="date"
                        value={newWeekStart}
                        onChange={(event) => setNewWeekStart(event.target.value)}
                        className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-orange-100"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-[var(--muted)]">Vir ponudbe</span>
                      <input
                        value={newWeekSource}
                        onChange={(event) => setNewWeekSource(event.target.value)}
                        placeholder="npr. Excel ponudba 6.4.-10.4.2026"
                        className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-orange-100"
                      />
                    </label>
                    <label className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3 text-sm">
                      <input
                        type="checkbox"
                        checked={copyAlwaysAvailableToNewWeek}
                        onChange={(event) => setCopyAlwaysAvailableToNewWeek(event.target.checked)}
                      />
                      <span>Prenesi stalno ponudbo v novi teden</span>
                    </label>
                  </div>
                  <div className="mt-5">
                    <button
                      onClick={createNewWeek}
                      className="rounded-2xl bg-[var(--accent)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                    >
                      Ustvari nov teden
                    </button>
                  </div>
                </div>

                <div className="glass-panel rounded-[1.5rem] p-4 sm:p-5 xl:col-span-2">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                    {t.manualEntry}
                  </p>
                  <h3 className="mt-1 font-[var(--font-display)] text-2xl font-bold">
                    {t.addMeal} - {getMealPeriodLabel(activeMealPeriod, language)}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{t.addMealHint}</p>
                  <div className="mt-6 overflow-x-auto">
                    <div className="min-w-[860px]">
                      <div className="grid grid-cols-[160px_repeat(5,minmax(0,1fr))] gap-3">
                        <div className="rounded-2xl bg-white/60 px-4 py-3 text-sm font-semibold text-[var(--muted)]">
                          {t.category}
                        </div>
                        {weeklyOffer.days.map((day) => (
                          <div
                            key={day.date}
                            className="rounded-2xl bg-white/60 px-4 py-3 text-sm font-semibold"
                          >
                            {getLocalizedText(day.label, language)}
                          </div>
                        ))}

                        {weeklyCategories.map((category) => (
                          <GridRow
                            key={category}
                            categoryLabel={t.categoryLabels[category]}
                            category={category}
                            days={weeklyOffer.days}
                            period={activeMealPeriod}
                            draft={weeklyDraft[activeMealPeriod]}
                            editingCells={editingCells}
                            setEditingCells={setEditingCells}
                            setWeeklyDraft={setWeeklyDraft}
                            onAutoTranslate={autoTranslateWeeklyCell}
                            t={t}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex justify-end">
                    <button
                      onClick={saveWeeklyOffer}
                      disabled={isSavingOffer}
                      className="relative z-10 rounded-2xl bg-[var(--accent)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--accent-strong)] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-stone-300"
                    >
                      {isSavingOffer ? t.addingMeal : t.addToOffer}
                    </button>
                  </div>
                </div>
              </section>
            ) : null}
          </div>
          </>
          )}
        </section>

        {selectedMealPeriod || loggedInUser.role === 'admin' ? (
          <div className="space-y-6">
            {loggedInUser.role === 'admin' ? (
              <section className="glass-panel rounded-[1.5rem] p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                      Termin ponudbe
                    </p>
                    <h3 className="mt-1 font-[var(--font-display)] text-2xl font-bold">
                      Urejaš: {getMealPeriodLabel(activeMealPeriod, language)}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                      Tedenska ponudba, stalna ponudba in admin pregled so vezani na izbran termin.
                    </p>
                  </div>
                  <label className="block w-full sm:max-w-xs">
                    <span className="mb-2 block text-sm font-medium text-[var(--muted)]">
                      Izberi termin za urejanje
                    </span>
                    <select
                      value={activeMealPeriod}
                      onChange={(event) => setSelectedMealPeriod(event.target.value as MealPeriod)}
                      className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-orange-100"
                    >
                      {mealPeriods.map((period) => (
                        <option key={period} value={period}>
                          {getMealPeriodLabel(period, language)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>
            ) : null}

            {loggedInUser.role === 'admin' ? (
              <section className="glass-panel rounded-[1.5rem] p-4 sm:p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                  {t.categoryLabels['stalna ponudba']}
                </p>
                <h3 className="mt-1 font-[var(--font-display)] text-2xl font-bold">
                  {t.manualEntry} - {getMealPeriodLabel(activeMealPeriod, language)}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Ločeno upravljanje stalne ponudbe za izbran termin. Te jedi so vedno prikazane uporabnikom znotraj tega termina.
                </p>
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {alwaysAvailableDraft
                    .filter((item) => item.mealPeriod === activeMealPeriod)
                    .map((item) => (
                    <div key={item.id} className="rounded-[1.1rem] border border-[var(--line)] bg-white/75 p-4">
                      {item.isEditing ? (
                        <div className="space-y-4">
                          <LocalizedFieldsEditor
                            label={t.mealTitle}
                            value={item.title}
                            placeholder={t.mealPlaceholder}
                            t={t}
                            onAutoTranslate={(nextValue) =>
                              autoTranslateAlwaysAvailableField(item.id, 'title', nextValue)
                            }
                            onChange={(fieldLanguage, nextValue) =>
                              updateAlwaysAvailableDraft(item.id, 'title', nextValue, fieldLanguage)
                            }
                          />
                          <LocalizedFieldsEditor
                            label={t.description}
                            value={item.description}
                            placeholder={t.optional}
                            t={t}
                            onAutoTranslate={(nextValue) =>
                              autoTranslateAlwaysAvailableField(item.id, 'description', nextValue)
                            }
                            onChange={(fieldLanguage, nextValue) =>
                              updateAlwaysAvailableDraft(item.id, 'description', nextValue, fieldLanguage)
                            }
                          />
                          <input
                            value={item.allergens}
                            onChange={(event) =>
                              updateAlwaysAvailableDraft(item.id, 'allergens', event.target.value)
                            }
                            placeholder={t.allergens}
                            className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                          />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <LocalizedFieldsPreview label={t.mealTitle} value={item.title} t={t} />
                          {item.description.sl || item.description.en || item.description.uk ? (
                            <LocalizedFieldsPreview label={t.description} value={item.description} t={t} />
                          ) : null}
                          {item.allergens ? (
                            <p className="text-sm text-[var(--muted)]">
                              {t.allergens}: {item.allergens}
                            </p>
                          ) : null}
                        </div>
                      )}

                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={() => setAlwaysAvailableEditing(item.id, !item.isEditing)}
                          className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold transition hover:bg-orange-50"
                        >
                          {item.isEditing ? t.saveDraft : t.edit}
                        </button>
                        <button
                          onClick={() => removeAlwaysAvailableDraft(item.id)}
                          className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold transition hover:bg-orange-50"
                        >
                          {t.remove}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={addAlwaysAvailableDraftRow}
                    className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold transition hover:bg-orange-50"
                  >
                    {t.addMeal}
                  </button>
                  <button
                    onClick={saveAlwaysAvailable}
                    disabled={isSavingOffer}
                    className="rounded-2xl bg-[var(--accent)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-stone-300"
                  >
                    {isSavingOffer ? t.addingMeal : t.addToOffer}
                  </button>
                </div>
              </section>
            ) : null}
          </div>
        ) : null}

        {message ? <MessageBox message={message} className="glass-panel rounded-[1.5rem]" /> : null}
        {pendingMeal ? (
          <ConfirmModal
            title={t.chooseMealTitle}
            body={`${t.chooseMealText} ${getLocalizedText(pendingMeal.title, language)}`}
            noteLabel={pendingMeal.isAlwaysAvailable ? 'Opomba' : undefined}
            notePlaceholder={pendingMeal.isAlwaysAvailable ? 'npr. brez paradiĹľnika' : undefined}
            noteValue={pendingMealNote}
            onNoteChange={setPendingMealNote}
            cancelLabel={t.cancel}
            confirmLabel={t.confirm}
            onCancel={() => {
              setPendingMeal(null)
              setPendingMealNote('')
            }}
            onConfirm={() => placeOrder(pendingMeal.id)}
          />
        ) : null}
        {pendingOrderRemoval ? (
          <ConfirmModal
            title={removeMealModal[language].title}
            body={removeMealModal[language].body}
            cancelLabel={t.cancel}
            confirmLabel={t.confirm}
            onCancel={() => setPendingOrderRemoval(null)}
            onConfirm={() => {
              void removeOrder(pendingOrderRemoval.date, pendingOrderRemoval.period)
              setPendingOrderRemoval(null)
            }}
          />
        ) : null}
      </div>
    </main>
  )
}

function LanguageSwitcher({
  language,
  setLanguage,
}: {
  language: Language
  setLanguage: (language: Language) => void
}) {
  const t = translations[language]

  return (
    <label className="flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-white/80 px-3 py-2 text-sm">
      <span className="text-[var(--muted)]">{t.languageLabel}</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as Language)}
        className="bg-transparent outline-none"
      >
        <option value="sl">{t.languages.sl}</option>
        <option value="en">{t.languages.en}</option>
        <option value="uk">{t.languages.uk}</option>
        <option value="bs">{t.languages.bs}</option>
      </select>
    </label>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  onEnter,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  type?: 'text' | 'password'
  onEnter?: () => void
}) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && onEnter) {
      event.preventDefault()
      onEnter()
    }
  }

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[var(--muted)]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        type={type}
        className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-orange-100"
      />
    </label>
  )
}

function GridRow({
  categoryLabel,
  category,
  period,
  days,
  draft,
  editingCells,
  setEditingCells,
  setWeeklyDraft,
  onAutoTranslate,
  t,
}: {
  categoryLabel: string
  category: MenuCategory
  period: MealPeriod
  days: WeeklyOffer['days']
  draft: WeeklyDraft
  editingCells: Record<string, boolean>
  setEditingCells: Dispatch<SetStateAction<Record<string, boolean>>>
  setWeeklyDraft: Dispatch<SetStateAction<WeeklyDraftByPeriod>>
  onAutoTranslate: (period: MealPeriod, date: string, category: MenuCategory, value: string) => void | Promise<void>
  t: (typeof translations)[Language]
}) {
  return (
    <>
      <div className="rounded-2xl bg-white/70 px-4 py-4 text-sm font-semibold">
        {categoryLabel}
      </div>
      {days.map((day) => {
        const cellKey = `${period}:${day.date}:${category}`
        const value = draft[day.date]?.[category] ?? emptyLocalizedText()
        const isEditing = editingCells[cellKey] ?? !value.sl

        return (
          <div key={cellKey} className="rounded-2xl border border-[var(--line)] bg-white/75 p-3">
            {isEditing ? (
              <LocalizedFieldsEditor
                label={categoryLabel}
                value={value}
                placeholder={t.mealPlaceholder}
                t={t}
                onAutoTranslate={(nextValue) =>
                  onAutoTranslate(period, day.date, category, nextValue)
                }
                onChange={(fieldLanguage, nextValue) => {
                  setEditingCells((current) => ({
                    ...current,
                    [cellKey]: true,
                  }))
                  setWeeklyDraft((current) => ({
                    ...current,
                    [period]: {
                      ...current[period],
                      [day.date]: {
                        ...(current[period]?.[day.date] ?? {}),
                        [category]:
                          fieldLanguage === 'sl'
                            ? localizedDraftFromSlovenian(nextValue)
                            : {
                                ...(current[period]?.[day.date]?.[category] ?? emptyLocalizedText()),
                                [fieldLanguage]: nextValue,
                              },
                      } as Record<MenuCategory, WeeklyDraftCell>,
                    },
                  }))
                }}
              />
            ) : (
              <LocalizedFieldsPreview label={categoryLabel} value={value} t={t} />
            )}

            <div className="mt-3 flex justify-end">
              {isEditing ? (
                <button
                  onClick={() =>
                    setEditingCells((current) => ({
                      ...current,
                      [cellKey]: false,
                    }))
                  }
                  className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold transition hover:bg-orange-50"
                >
                  {t.saveDraft}
                </button>
              ) : (
                <button
                  onClick={() =>
                    setEditingCells((current) => ({
                      ...current,
                      [cellKey]: true,
                    }))
                  }
                  className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold transition hover:bg-orange-50"
                >
                  {t.edit}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </>
  )
}

function LocalizedFieldsEditor({
  label,
  value,
  placeholder,
  t,
  onAutoTranslate,
  onChange,
}: {
  label: string
  value: LocalizedText
  placeholder: string
  t: (typeof translations)[Language]
  onAutoTranslate?: (value: string) => void | Promise<void>
  onChange: (language: Language, value: string) => void
}) {
  const languages: Language[] = ['sl', 'en', 'uk', 'bs']

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[var(--foreground)]">{label}</p>
      <div className="grid gap-3">
        {languages.map((language) => (
          <label key={language} className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
              {t.languages[language]}
            </span>
            <textarea
              value={value[language]}
              onChange={(event) => onChange(language, event.target.value)}
              onBlur={(event) => {
                if (language === 'sl' && onAutoTranslate) {
                  void onAutoTranslate(event.target.value)
                }
              }}
              rows={language === 'sl' ? 3 : 2}
              className="min-h-[72px] w-full resize-y rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              placeholder={placeholder}
            />
          </label>
        ))}
      </div>
    </div>
  )
}

function LocalizedFieldsPreview({
  label,
  value,
  t,
}: {
  label: string
  value: LocalizedText
  t: (typeof translations)[Language]
}) {
  const languages: Language[] = ['sl', 'en', 'uk', 'bs']

  return (
    <div className="min-h-[112px] space-y-3">
      <p className="text-sm font-semibold text-[var(--foreground)]">{label}</p>
      {languages.map((language) =>
        value[language] ? (
          <div key={language}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
              {t.languages[language]}
            </p>
            <p className="mt-1 text-sm leading-6">{value[language]}</p>
          </div>
        ) : null
      )}
    </div>
  )
}

function MessageBox({ message, className }: { message: string; className: string }) {
  return (
    <section className={`${className} border border-[var(--line)] px-5 py-4 text-sm text-[var(--foreground)]`}>
      {message}
    </section>
  )
}

function ConfirmModal({
  title,
  body,
  noteLabel,
  notePlaceholder,
  noteValue,
  onNoteChange,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string
  body: string
  noteLabel?: string
  notePlaceholder?: string
  noteValue?: string
  onNoteChange?: (value: string) => void
  cancelLabel: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 px-4">
      <div className="glass-panel w-full max-w-md rounded-[2rem] p-6">
        <h3 className="font-[var(--font-display)] text-2xl font-bold">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{body}</p>
        {noteLabel && onNoteChange ? (
          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-medium text-[var(--muted)]">{noteLabel}</span>
            <textarea
              value={noteValue ?? ''}
              onChange={(event) => onNoteChange(event.target.value)}
              rows={3}
              placeholder={notePlaceholder}
              className="w-full resize-y rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-orange-100"
            />
          </label>
        ) : null}
        <div className="mt-6 flex gap-3">
          <button onClick={onCancel} className="flex-1 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 font-semibold">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className="flex-1 rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
