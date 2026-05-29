import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '../../../lib/supabase-server'
import type { MealPeriod } from '../../../lib/mock-data'

function isMealPeriod(value: unknown): value is MealPeriod {
  return value === 'morning' || value === 'afternoon'
}

function normalizeDepartmentName(department: string | null | undefined) {
  const normalized = (department ?? '').trim().toLowerCase()

  if (normalized === 'delavnica') {
    return 'Delavnica'
  }

  if (normalized === 'pisarne' || normalized === 'pisarna') {
    return 'Pisarne'
  }

  return normalized || 'Ostalo'
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      serviceDate?: string
      userId?: string
      mealItemId?: string
      mealPeriod?: MealPeriod
      note?: string
    }

    if (!body.serviceDate || !body.userId || !body.mealItemId || !isMealPeriod(body.mealPeriod)) {
      return NextResponse.json({ error: 'Missing order payload.' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id,department,role')
      .eq('id', body.userId)
      .maybeSingle()

    if (userError) {
      throw userError
    }

    if (!user) {
      return NextResponse.json({ error: 'Uporabnik ne obstaja vec.' }, { status: 400 })
    }

    if (body.mealPeriod === 'afternoon' && user.role !== 'admin' && normalizeDepartmentName(user.department) !== 'Delavnica') {
      return NextResponse.json({ error: 'Popoldanska malica je na voljo samo za oddelek Delavnica.' }, { status: 403 })
    }

    const { data: mealItem, error: mealItemError } = await supabase
      .from('meal_items')
      .select('id,meal_period')
      .eq('id', body.mealItemId)
      .maybeSingle()

    if (mealItemError) {
      throw mealItemError
    }

    if (!mealItem) {
      return NextResponse.json({ error: 'Izbrana malica ne obstaja več v ponudbi.' }, { status: 400 })
    }

    if (mealItem.meal_period !== body.mealPeriod) {
      return NextResponse.json({ error: 'Izbrana malica ne spada v izbran termin.' }, { status: 400 })
    }

    const { error } = await supabase.from('orders').upsert(
      {
        service_date: body.serviceDate,
        user_id: body.userId,
        meal_item_id: body.mealItemId,
        meal_period: body.mealPeriod,
        note: body.note?.trim() || null,
      },
      {
        onConflict: 'service_date,user_id,meal_period',
      }
    )

    if (error) {
      throw error
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Saving order failed.', error)
    return NextResponse.json({ error: 'Shranjevanje naročila v bazo ni uspelo.' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as {
      serviceDate?: string
      userId?: string
      mealPeriod?: MealPeriod
    }

    if (!body.serviceDate || !body.userId || !isMealPeriod(body.mealPeriod)) {
      return NextResponse.json({ error: 'Missing order payload.' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('service_date', body.serviceDate)
      .eq('user_id', body.userId)
      .eq('meal_period', body.mealPeriod)

    if (error) {
      throw error
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Deleting order failed.', error)
    return NextResponse.json({ error: 'Odjava malice iz baze ni uspela.' }, { status: 500 })
  }
}
