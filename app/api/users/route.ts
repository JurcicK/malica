import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '../../../lib/supabase-server'

function normalizeDepartmentName(department: string | undefined) {
  const normalized = (department ?? '').trim().toLowerCase()

  if (normalized === 'delavnica') {
    return 'Delavnica'
  }

  return 'Pisarne'
}

function canEditDisplayName(username: string) {
  return username.toLowerCase().includes('delavec')
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      actorUserId?: string
      adminPassword?: string
      username?: string
      password?: string
      fullName?: string
      department?: string
    }

    if (
      !body.actorUserId ||
      !body.adminPassword?.trim() ||
      !body.username?.trim() ||
      !body.password?.trim() ||
      !body.fullName?.trim()
    ) {
      return NextResponse.json({ error: 'Missing user payload.' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    const { data: actor, error: actorError } = await supabase
      .from('users')
      .select('id,username,password,role')
      .eq('id', body.actorUserId)
      .maybeSingle()

    if (actorError) {
      throw actorError
    }

    if (!actor || actor.role !== 'admin' || actor.password !== body.adminPassword.trim()) {
      return NextResponse.json({ error: 'Samo admin lahko dodaja uporabnike.' }, { status: 403 })
    }

    const nextUsername = body.username.trim()

    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('id')
      .eq('username', nextUsername)
      .maybeSingle()

    if (existingUserError) {
      throw existingUserError
    }

    if (existingUser) {
      return NextResponse.json({ error: 'Ta username ze obstaja.' }, { status: 409 })
    }

    const { data: createdUser, error: createError } = await supabase
      .from('users')
      .insert({
        username: nextUsername,
        password: body.password.trim(),
        full_name: body.fullName.trim(),
        role: 'employee',
        department: normalizeDepartmentName(body.department),
        active: true,
      })
      .select('id,username,full_name,role,department')
      .single()

    if (createError || !createdUser) {
      throw createError || new Error('User creation failed.')
    }

    await supabase.from('app_audit_log').insert({
      actor_user_id: actor.id,
      actor_username: actor.username,
      actor_role: actor.role,
      action: 'create_user',
      target_table: 'users',
      target_id: createdUser.id,
      metadata: {
        targetUsername: createdUser.username,
        department: createdUser.department,
      },
    })

    return NextResponse.json({
      ok: true,
      user: {
        id: createdUser.id,
        username: createdUser.username,
        fullName: createdUser.full_name || createdUser.username,
        role: createdUser.role,
        department: createdUser.department || '',
      },
    })
  } catch (error) {
    console.error('Creating user failed.', error)
    return NextResponse.json({ error: 'Dodajanje uporabnika ni uspelo.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      actorUserId?: string
      adminPassword?: string
      targetUserId?: string
      fullName?: string
    }

    if (!body.actorUserId || !body.targetUserId || !body.adminPassword?.trim()) {
      return NextResponse.json({ error: 'Missing user payload.' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    const { data: actor, error: actorError } = await supabase
      .from('users')
      .select('id,username,password,role')
      .eq('id', body.actorUserId)
      .maybeSingle()

    if (actorError) {
      throw actorError
    }

    if (!actor || actor.role !== 'admin' || actor.password !== body.adminPassword.trim()) {
      return NextResponse.json({ error: 'Samo admin lahko ureja uporabnike.' }, { status: 403 })
    }

    const nextFullName = body.fullName?.trim() || null

    const { data: targetUser, error: targetUserError } = await supabase
      .from('users')
      .select('id,username')
      .eq('id', body.targetUserId)
      .maybeSingle()

    if (targetUserError) {
      throw targetUserError
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'Uporabnik ne obstaja vec.' }, { status: 404 })
    }

    if (!canEditDisplayName(targetUser.username)) {
      return NextResponse.json({ error: 'Tega uporabnika tukaj ni dovoljeno urejati.' }, { status: 403 })
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ full_name: nextFullName })
      .eq('id', body.targetUserId)
      .select('id,username,full_name,role,department')
      .maybeSingle()

    if (updateError) {
      throw updateError
    }

    if (!updatedUser) {
      return NextResponse.json({ error: 'Uporabnik ne obstaja vec.' }, { status: 404 })
    }

    await supabase.from('app_audit_log').insert({
      actor_user_id: actor.id,
      actor_username: actor.username,
      actor_role: actor.role,
      action: 'update_user_display_name',
      target_table: 'users',
      target_id: updatedUser.id,
      metadata: {
        targetUsername: updatedUser.username,
        fullName: nextFullName,
      },
    })

    return NextResponse.json({
      ok: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        fullName: updatedUser.full_name || updatedUser.username,
        role: updatedUser.role,
        department: updatedUser.department || '',
      },
    })
  } catch (error) {
    console.error('Updating user failed.', error)
    return NextResponse.json({ error: 'Shranjevanje uporabnika ni uspelo.' }, { status: 500 })
  }
}
