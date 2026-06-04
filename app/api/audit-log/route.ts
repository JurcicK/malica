import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '../../../lib/supabase-server'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      actorUserId?: string
      action?: string
      targetTable?: string
      targetId?: string
      metadata?: Record<string, unknown>
    }

    if (!body.actorUserId || !body.action) {
      return NextResponse.json({ error: 'Missing audit payload.' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()
    const { data: actor, error: actorError } = await supabase
      .from('users')
      .select('id,username,role')
      .eq('id', body.actorUserId)
      .maybeSingle()

    if (actorError) {
      throw actorError
    }

    if (!actor || actor.role !== 'admin') {
      return NextResponse.json({ error: 'Samo admin lahko zapise admin audit dogodek.' }, { status: 403 })
    }

    const { error: auditError } = await supabase.from('app_audit_log').insert({
      actor_user_id: actor.id,
      actor_username: actor.username,
      actor_role: actor.role,
      action: body.action,
      target_table: body.targetTable ?? null,
      target_id: body.targetId ?? null,
      metadata: body.metadata ?? {},
    })

    if (auditError) {
      throw auditError
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Writing app audit log failed.', error)
    return NextResponse.json({ error: 'Audit zapis ni uspel.' }, { status: 500 })
  }
}
