import { NextResponse } from 'next/server'
import type { WeeklyOffer } from '../../../lib/mock-data'
import { getLocalizedText } from '../../../lib/meal-localization'
import { loadAppData } from '../../../lib/supabase-app'
import { getSupabaseServerClient } from '../../../lib/supabase-server'

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      weeklyOffer?: WeeklyOffer
    }

    const weeklyOffer = body.weeklyOffer

    if (!weeklyOffer || weeklyOffer.days.length === 0) {
      return NextResponse.json({ error: 'Missing weekly offer.' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()
    const startsOn = weeklyOffer.days[0].date
    const endsOn = weeklyOffer.days[weeklyOffer.days.length - 1].date

    const { data: currentActiveOffer } = await supabase
      .from('weekly_offers')
      .select('id')
      .eq('is_active', true)
      .order('starts_on', { ascending: false })
      .limit(1)
      .maybeSingle()

    await supabase.from('weekly_offers').update({ is_active: false }).eq('is_active', true)

    let offerId = currentActiveOffer?.id

    if (offerId) {
      const { error: updateOfferError } = await supabase
        .from('weekly_offers')
        .update({
          week_label: weeklyOffer.weekLabel,
          source_label: weeklyOffer.sourceLabel,
          cutoff_hour: weeklyOffer.cutoffHour,
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
      .select('id,is_always_available')
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
      service_date: null,
      category: item.category,
      title: item.title,
      description: item.description ?? null,
      allergens: item.allergens ?? null,
      is_always_available: true,
      sort_order: 100 + index,
    }))

    const incomingItems = [...incomingDayItems, ...incomingAlwaysItems]

    const incomingExistingIds = incomingItems
      .map((item) => item.id)
      .filter((id) => isUuid(id))

    const removableIds = (existingItems ?? [])
      .filter((item) => !incomingExistingIds.includes(item.id))
      .map((item) => item.id)

    if (removableIds.length > 0) {
      const { error: deleteMealsError } = await supabase
        .from('meal_items')
        .delete()
        .in('id', removableIds)

      if (deleteMealsError) {
        throw deleteMealsError
      }
    }

    const itemsToUpdate = incomingItems.filter((item) => isUuid(item.id))
    const itemsToInsert = incomingItems.filter((item) => !isUuid(item.id))

    if (itemsToUpdate.length > 0) {
      const { error: updateMealsError } = await supabase
        .from('meal_items')
        .upsert(
          itemsToUpdate.map((item) => ({
            id: item.id,
            offer_id: item.offer_id,
            service_date: item.service_date,
            category: item.category,
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

    const appData = await loadAppData()

    return NextResponse.json({
      ok: true,
      message: `Saved weekly offer ${getLocalizedText(weeklyOffer.weekLabel, 'sl')}`,
      weeklyOffer: appData.weeklyOffer,
      orders: appData.orders,
    })
  } catch {
    return NextResponse.json({ error: 'Saving weekly offer failed.' }, { status: 500 })
  }
}
