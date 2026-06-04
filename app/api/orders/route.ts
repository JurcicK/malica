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

async function writeOrderAuditLog(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  payload: {
    actor: { id: string; username: string; role: string }
    action: string
    metadata: Record<string, unknown>
  }
) {
  await supabase.from('app_audit_log').insert({
    actor_user_id: payload.actor.id,
    actor_username: payload.actor.username,
    actor_role: payload.actor.role,
    action: payload.action,
    target_table: 'orders',
    target_id: null,
    metadata: payload.metadata,
  })
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
      .select('id,username,department,role')
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

    await writeOrderAuditLog(supabase, {
      actor: user,
      action: 'place_order',
      metadata: {
        serviceDate: body.serviceDate,
        mealItemId: body.mealItemId,
        mealPeriod: body.mealPeriod,
        hasNote: Boolean(body.note?.trim()),
      },
    })

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
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id,username,role')
      .eq('id', body.userId)
      .maybeSingle()

    if (userError) {
      throw userError
    }

    if (!user) {
      return NextResponse.json({ error: 'Uporabnik ne obstaja vec.' }, { status: 400 })
    }

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('service_date', body.serviceDate)
      .eq('user_id', body.userId)
      .eq('meal_period', body.mealPeriod)

    if (error) {
      throw error
    }

    await writeOrderAuditLog(supabase, {
      actor: user,
      action: 'remove_order',
      metadata: {
        serviceDate: body.serviceDate,
        mealPeriod: body.mealPeriod,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Deleting order failed.', error)
    return NextResponse.json({ error: 'Odjava malice iz baze ni uspela.' }, { status: 500 })
  }
}
