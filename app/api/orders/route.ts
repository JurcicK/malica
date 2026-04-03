import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '../../../lib/supabase-server'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      serviceDate?: string
      userId?: string
      mealItemId?: string
    }

    if (!body.serviceDate || !body.userId || !body.mealItemId) {
      return NextResponse.json({ error: 'Missing order payload.' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()
    const { error } = await supabase.from('orders').upsert(
      {
        service_date: body.serviceDate,
        user_id: body.userId,
        meal_item_id: body.mealItemId,
      },
      {
        onConflict: 'service_date,user_id',
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
