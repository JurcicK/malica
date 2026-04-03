import { NextResponse } from 'next/server'
import { loadAppData } from '../../../lib/supabase-app'
import { getSupabaseServerClient } from '../../../lib/supabase-server'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string
      password?: string
    }

    const username = body.username?.trim()
    const password = body.password?.trim()

    if (!username || !password) {
      return NextResponse.json({ error: 'Missing credentials.' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .eq('active', true)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
    }

    const appData = await loadAppData()
    const payloadUser = appData.users.find((candidate) => candidate.id === user.id)

    return NextResponse.json({
      user: payloadUser,
      users: appData.users,
      weeklyOffer: appData.weeklyOffer,
      orders: appData.orders,
    })
  } catch {
    return NextResponse.json({ error: 'Login failed.' }, { status: 500 })
  }
}
