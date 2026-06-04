import { NextResponse } from 'next/server'
import type { WeeklyOffer } from '../../../lib/mock-data'
import { getLocalizedText } from '../../../lib/meal-localization'
import { loadAppData } from '../../../lib/supabase-app'
import { getSupabaseServerClient } from '../../../lib/supabase-server'

type EditScope =
  | { kind: 'weekly'; mealPeriod: string; serviceDates: string[] }
  | { kind: 'always'; mealPeriod: string; serviceDate?: string | null }

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

function getItemScope(item: { service_date: string | null; meal_period: string | null; is_always_available: boolean }) {
  return [
    item.is_always_available ? 'always' : 'day',
    item.service_date ?? 'global',
    item.meal_period ?? 'morning',
  ].join(':')
}

function getEditableScopes(editScope: EditScope | undefined, fallbackScopes: Set<string>) {
  if (!editScope) {
    return fallbackScopes
  }

  if (editScope.kind === 'weekly') {
    return new Set(editScope.serviceDates.map((date) => ['day', date, editScope.mealPeriod].join(':')))
  }

  return new Set([['always', editScope.serviceDate ?? 'global', editScope.mealPeriod].join(':')])
}

function getEditScopeKey(editScope: EditScope | undefined) {
  if (!editScope) {
    return null
  }

  if (editScope.kind === 'weekly') {
    return `weekly:${editScope.mealPeriod}`
  }

  return `always:${editScope.serviceDate ?? 'global'}:${editScope.mealPeriod}`
}

async function getActor(supabase: ReturnType<typeof getSupabaseServerClient>, actorUserId: string | undefined) {
  if (!actorUserId) {
    return null
  }

  const { data, error } = await supabase
    .from('users')
    .select('id,username,role')
    .eq('id', actorUserId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

async function writeAppAuditLog(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  payload: {
    actor?: { id: string; username: string; role: string } | null
    action: string
    targetTable?: string
    targetId?: string
    metadata?: Record<string, unknown>
  }
) {
  await supabase.from('app_audit_log').insert({
    actor_user_id: payload.actor?.id ?? null,
    actor_username: payload.actor?.username ?? null,
    actor_role: payload.actor?.role ?? null,
    action: payload.action,
    target_table: payload.targetTable ?? null,
    target_id: payload.targetId ?? null,
    metadata: payload.metadata ?? {},
  })
}

function addDays(date: string, days: number) {
  const next = new Date(`${date}T12:00:00`)
  next.setDate(next.getDate() + days)
  return next.toISOString().slice(0, 10)
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: 'save' | 'createWeek' | 'saveCutoffs'
      weeklyOffer?: WeeklyOffer
      startsOn?: string
      sourceLabel?: { sl: string; en: string; uk: string; bs: string }
      copyAlwaysAvailable?: boolean
      cutoffHour?: number
      cutoffMinute?: number
      cutoffOverrides?: WeeklyOffer['cutoffOverrides']
      editScope?: EditScope
      expectedEditVersion?: number
      actorUserId?: string
    }

    const supabase = getSupabaseServerClient()
    const actor = await getActor(supabase, body.actorUserId)

    if (body.action === 'createWeek') {
      if (!body.startsOn) {
        return NextResponse.json({ error: 'Missing startsOn.' }, { status: 400 })
      }

      if (actor?.role !== 'admin') {
        return NextResponse.json({ error: 'Samo admin lahko ustvari nov teden.' }, { status: 403 })
      }

      const startsOn = body.startsOn
      const endsOn = addDays(startsOn, 5)
      const cutoffHour = body.cutoffHour ?? 10
      const cutoffMinute = body.cutoffMinute ?? 0

      const weekLabel = {
        sl: `Tedenska ponudba ${startsOn} - ${endsOn}`,
        en: `Weekly offer ${startsOn} - ${endsOn}`,
        uk: `Тижнева пропозиція ${startsOn} - ${endsOn}`,
        bs: `Sedmična ponuda ${startsOn} - ${endsOn}`,
      }

      const sourceLabel = body.sourceLabel ?? {
        sl: 'Ročni vnos novega tedna',
        en: 'Manual entry for a new week',
        uk: 'Ручне створення нового тижня',
        bs: 'Ručni unos novog tjedna',
      }

      const { data: currentActiveOffer } = await supabase
        .from('weekly_offers')
        .select('id')
        .eq('is_active', true)
        .order('starts_on', { ascending: false })
        .limit(1)
        .maybeSingle()

      let alwaysAvailableItems:
        | Array<{
            category: string
            service_date: string | null
            meal_period: string
            title: WeeklyOffer['alwaysAvailable'][number]['title']
            description: WeeklyOffer['alwaysAvailable'][number]['description'] | null
            allergens: string | null
            sort_order: number
          }>
        = []

      if (body.copyAlwaysAvailable && currentActiveOffer?.id) {
        const { data: currentAlwaysItems, error: currentAlwaysItemsError } = await supabase
          .from('meal_items')
          .select('category,service_date,meal_period,title,description,allergens,sort_order')
          .eq('offer_id', currentActiveOffer.id)
          .eq('is_always_available', true)
          .order('sort_order')

        if (currentAlwaysItemsError) {
          throw currentAlwaysItemsError
        }

        alwaysAvailableItems =
          currentAlwaysItems?.map((item) => ({
            category: item.category,
            service_date: item.service_date,
            meal_period: item.meal_period ?? 'morning',
            title: item.title,
            description: item.description,
            allergens: item.allergens,
            sort_order: item.sort_order ?? 100,
          })) ?? []
      }

      const { data: insertedOffer, error: insertOfferError } = await supabase
        .from('weekly_offers')
        .insert({
          week_label: weekLabel,
          source_label: sourceLabel,
          cutoff_hour: cutoffHour,
          cutoff_minute: cutoffMinute,
          cutoff_overrides: body.cutoffOverrides ?? {},
          edit_versions: {},
          starts_on: startsOn,
          ends_on: endsOn,
          is_active: true,
        })
        .select('id')
        .single()

      if (insertOfferError || !insertedOffer) {
        throw insertOfferError || new Error('Offer insert failed.')
      }

      if (alwaysAvailableItems.length > 0) {
        const { error: insertAlwaysError } = await supabase.from('meal_items').insert(
          alwaysAvailableItems.map((item) => ({
            offer_id: insertedOffer.id,
            service_date: item.service_date,
            category: item.category,
            meal_period: item.meal_period,
            title: item.title,
            description: item.description,
            allergens: item.allergens,
            is_always_available: true,
            sort_order: item.sort_order,
          }))
        )

        if (insertAlwaysError) {
          throw insertAlwaysError
        }
      }

      await writeAppAuditLog(supabase, {
        actor,
        action: 'create_week',
        targetTable: 'weekly_offers',
        targetId: insertedOffer.id,
        metadata: { startsOn, endsOn, copyAlwaysAvailable: Boolean(body.copyAlwaysAvailable) },
      })

      const appData = await loadAppData()

      return NextResponse.json({
        ok: true,
        weeklyOffer: appData.weeklyOffer,
        weeklyOffers: appData.weeklyOffers,
        orders: appData.orders,
      })
    }

    if (body.action === 'saveCutoffs') {
      const weeklyOffer = body.weeklyOffer

      if (!weeklyOffer?.id) {
        return NextResponse.json({ error: 'Missing weekly offer id.' }, { status: 400 })
      }

      if (actor?.role !== 'admin') {
        return NextResponse.json({ error: 'Samo admin lahko shrani roke prijave.' }, { status: 403 })
      }

      const { error: updateCutoffsError } = await supabase
        .from('weekly_offers')
        .update({
          cutoff_hour: weeklyOffer.cutoffHour,
          cutoff_minute: weeklyOffer.cutoffMinute,
          cutoff_overrides: weeklyOffer.cutoffOverrides,
        })
        .eq('id', weeklyOffer.id)

      if (updateCutoffsError) {
        throw updateCutoffsError
      }

      await writeAppAuditLog(supabase, {
        actor,
        action: 'save_cutoffs',
        targetTable: 'weekly_offers',
        targetId: weeklyOffer.id,
        metadata: {
          cutoffHour: weeklyOffer.cutoffHour,
          cutoffMinute: weeklyOffer.cutoffMinute,
          cutoffOverrides: weeklyOffer.cutoffOverrides,
        },
      })

      const appData = await loadAppData()

      return NextResponse.json({
        ok: true,
        weeklyOffer: appData.weeklyOffer,
        weeklyOffers: appData.weeklyOffers,
        orders: appData.orders,
      })
    }

    const weeklyOffer = body.weeklyOffer

    if (!weeklyOffer || weeklyOffer.days.length === 0) {
      return NextResponse.json({ error: 'Missing weekly offer.' }, { status: 400 })
    }

    if (actor?.role !== 'admin') {
      return NextResponse.json({ error: 'Samo admin lahko shrani ponudbo.' }, { status: 403 })
    }

    const startsOn = weeklyOffer.days[0].date
    const endsOn = weeklyOffer.days[weeklyOffer.days.length - 1].date

    let offerId = weeklyOffer.id

    if (!offerId) {
      const { data: currentActiveOffer } = await supabase
        .from('weekly_offers')
        .select('id')
        .eq('is_active', true)
        .eq('starts_on', startsOn)
        .limit(1)
        .maybeSingle()

      offerId = currentActiveOffer?.id
    }

    const editScopeKey = getEditScopeKey(body.editScope)
    let nextEditVersions = weeklyOffer.editVersions ?? {}

    if (offerId && editScopeKey) {
      const { data: currentOfferVersion, error: versionError } = await supabase
        .from('weekly_offers')
        .select('edit_versions')
        .eq('id', offerId)
        .maybeSingle()

      if (versionError) {
        throw versionError
      }

      const currentEditVersions = (currentOfferVersion?.edit_versions ?? {}) as WeeklyOffer['editVersions']
      const currentEditVersion = currentEditVersions[editScopeKey] ?? 0
      const expectedEditVersion = body.expectedEditVersion ?? 0

      if (currentEditVersion !== expectedEditVersion) {
        return NextResponse.json(
          {
            error:
              'Ponudba se je medtem spremenila v drugem admin pogledu. Osvezi stran in ponovno preveri spremembe.',
            currentEditVersion,
          },
          { status: 409 }
        )
      }

      nextEditVersions = {
        ...currentEditVersions,
        [editScopeKey]: currentEditVersion + 1,
      }
    }

    if (offerId) {
      const { error: updateOfferError } = await supabase
        .from('weekly_offers')
        .update({
          week_label: weeklyOffer.weekLabel,
          source_label: weeklyOffer.sourceLabel,
          cutoff_hour: weeklyOffer.cutoffHour,
          cutoff_minute: weeklyOffer.cutoffMinute,
          cutoff_overrides: weeklyOffer.cutoffOverrides,
          edit_versions: nextEditVersions,
          starts_on: startsOn,
          ends_on: endsOn,
          is_active: true,
        })
        .eq('id', offerId)

      if (updateOfferError) {
        throw updateOfferError
      }
    } else {
      const { data: insertedOffer, error: insertOfferError } = await supabase
        .from('weekly_offers')
        .insert({
          week_label: weeklyOffer.weekLabel,
          source_label: weeklyOffer.sourceLabel,
          cutoff_hour: weeklyOffer.cutoffHour,
          cutoff_minute: weeklyOffer.cutoffMinute,
          cutoff_overrides: weeklyOffer.cutoffOverrides,
          edit_versions: nextEditVersions,
          starts_on: startsOn,
          ends_on: endsOn,
          is_active: true,
        })
        .select('id')
        .single()

      if (insertOfferError || !insertedOffer) {
        throw insertOfferError || new Error('Offer insert failed.')
      }

      offerId = insertedOffer.id
    }

    const { data: existingItems, error: existingItemsError } = await supabase
      .from('meal_items')
      .select('id,service_date,meal_period,is_always_available')
      .eq('offer_id', offerId)

    if (existingItemsError) {
      throw existingItemsError
    }

    const incomingDayItems = weeklyOffer.days.flatMap((day) =>
      day.items.map((item, index) => ({
        id: item.id,
        offer_id: offerId,
        service_date: day.date,
        category: item.category,
        meal_period: item.mealPeriod,
        title: item.title,
        description: item.description ?? null,
        allergens: item.allergens ?? null,
        is_always_available: false,
        sort_order: index,
      }))
    )

    const incomingAlwaysItems = weeklyOffer.alwaysAvailable.map((item, index) => ({
      id: item.id,
      offer_id: offerId,
      service_date: item.serviceDate ?? null,
      category: item.category,
      meal_period: item.mealPeriod,
      title: item.title,
      description: item.description ?? null,
      allergens: item.allergens ?? null,
      is_always_available: true,
      sort_order: 100 + index,
    }))

    const incomingItems = [...incomingDayItems, ...incomingAlwaysItems]
    const incomingScopes = new Set(incomingItems.map(getItemScope))
    const editableScopes = getEditableScopes(body.editScope, incomingScopes)

    const incomingExistingIds = incomingItems
      .map((item) => item.id)
      .filter((id) => isUuid(id))

    const removableIds = (existingItems ?? [])
      .filter((item) => {
        const itemScope = getItemScope(item)

        return editableScopes.has(itemScope) && !incomingExistingIds.includes(item.id)
      })
      .map((item) => item.id)

    if (removableIds.length > 0) {
      const { data: blockingOrders, error: blockingOrdersError } = await supabase
        .from('orders')
        .select('meal_item_id')
        .in('meal_item_id', removableIds)
        .limit(1)

      if (blockingOrdersError) {
        throw blockingOrdersError
      }

      if ((blockingOrders ?? []).length > 0) {
        return NextResponse.json(
          { error: 'Jedi, na katero je nekdo ze prijavljen, ni mogoce izbrisati.' },
          { status: 409 }
        )
      }

      const { error: deleteMealsError } = await supabase
        .from('meal_items')
        .delete()
        .in('id', removableIds)

      if (deleteMealsError) {
        throw deleteMealsError
      }
    }

    const editableIncomingItems = incomingItems.filter((item) => editableScopes.has(getItemScope(item)))
    const itemsToUpdate = editableIncomingItems.filter((item) => isUuid(item.id))
    const itemsToInsert = editableIncomingItems.filter((item) => !isUuid(item.id))

    if (itemsToUpdate.length > 0) {
      const { error: updateMealsError } = await supabase
        .from('meal_items')
        .upsert(
          itemsToUpdate.map((item) => ({
            id: item.id,
            offer_id: item.offer_id,
            service_date: item.service_date,
            category: item.category,
            meal_period: item.meal_period,
            title: item.title,
            description: item.description,
            allergens: item.allergens,
            is_always_available: item.is_always_available,
            sort_order: item.sort_order,
          }))
        )

      if (updateMealsError) {
        throw updateMealsError
      }
    }

    if (itemsToInsert.length > 0) {
      const insertRows = itemsToInsert.map((item) => ({
        offer_id: item.offer_id,
        service_date: item.service_date,
        category: item.category,
        meal_period: item.meal_period,
        title: item.title,
        description: item.description,
        allergens: item.allergens,
        is_always_available: item.is_always_available,
        sort_order: item.sort_order,
      }))

      const { error: insertMealsError } = await supabase.from('meal_items').insert(insertRows)

      if (insertMealsError) {
        throw insertMealsError
      }
    }

    await writeAppAuditLog(supabase, {
      actor,
      action: body.editScope?.kind === 'always' ? 'save_always_available' : 'save_weekly_offer',
      targetTable: 'weekly_offers',
      targetId: offerId,
      metadata: {
        editScope: body.editScope ?? null,
        insertedItems: itemsToInsert.length,
        updatedItems: itemsToUpdate.length,
        deletedItems: removableIds.length,
      },
    })

    const appData = await loadAppData()

    return NextResponse.json({
      ok: true,
      message: `Saved weekly offer ${getLocalizedText(weeklyOffer.weekLabel, 'sl')}`,
      weeklyOffer: appData.weeklyOffer,
      weeklyOffers: appData.weeklyOffers,
      orders: appData.orders,
    })
  } catch {
    return NextResponse.json({ error: 'Saving weekly offer failed.' }, { status: 500 })
  }
}
