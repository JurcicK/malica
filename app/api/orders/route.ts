import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '../../../lib/supabase-server'
import type { MealPeriod } from '../../../lib/mock-data'

function isMealPeriod(value: unknown): value is MealPeriod {
  return value === 'morning' || value === 'afternoon'
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
  } catch {
    return NextResponse.json({ error: 'Saving order failed.' }, { status: 500 })
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
  } catch {
    return NextResponse.json({ error: 'Deleting order failed.' }, { status: 500 })
  }
}
