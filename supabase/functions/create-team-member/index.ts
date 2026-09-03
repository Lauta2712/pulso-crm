// Supabase Edge Function: create-team-member
//
// Agrega un integrante a la org activa de quien la invoca. Solo puede ser
// llamada por un usuario con rol 'owner' (verificado contra org_members con
// su propio JWT). Usa la service role key (secret de la función, nunca
// expuesto al frontend).
//
// Multi-org: si el email invitado ya tiene una cuenta en Compass (en
// cualquier org), no se crea una cuenta nueva ni se pide password — solo se
// inserta la membresía nueva en org_members. Si es un email nuevo, se crea
// la cuenta de Auth como antes.
//
// Deploy:
//   supabase functions deploy create-team-member
//
// La función ya tiene acceso a SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY como
// secrets automáticos del proyecto.

import { createClient } from 'npm:@supabase/supabase-js@2'

const VALID_ROLES = ['owner', 'developer', 'designer', 'pm', 'viewer']

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Falta el header de autorización' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const token = authHeader.replace('Bearer ', '')

  const {
    data: { user },
    error: userError,
  } = await callerClient.auth.getUser(token)

  if (userError || !user) {
    return jsonResponse({ error: 'Sesión inválida' }, 401)
  }

  const { data: callerProfile, error: profileError } = await callerClient
    .from('users')
    .select('active_org_id')
    .eq('id', user.id)
    .single()

  if (profileError || !callerProfile) {
    return jsonResponse({ error: 'No se pudo resolver la organización del caller' }, 400)
  }

  const callerOrgId = callerProfile.active_org_id

  const { data: callerMembership, error: membershipError } = await callerClient
    .from('org_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('org_id', callerOrgId)
    .single()

  if (membershipError || callerMembership?.role !== 'owner') {
    return jsonResponse({ error: 'Solo el owner puede crear integrantes' }, 403)
  }

  let body
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'JSON inválido' }, 400)
  }

  const { email, full_name, role, password } = body ?? {}

  if (!email || !full_name || !role) {
    return jsonResponse({ error: 'Faltan datos (email, nombre o rol)' }, 400)
  }

  if (!VALID_ROLES.includes(role)) {
    return jsonResponse({ error: 'Rol inválido' }, 400)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const { data: existingUserId, error: lookupError } = await adminClient.rpc(
    'find_user_id_by_email',
    { p_email: email }
  )

  if (lookupError) {
    return jsonResponse({ error: lookupError.message }, 400)
  }

  if (existingUserId) {
    // Ya tiene cuenta en Compass (en cualquier org): solo se lo suma a esta
    // org, sin tocar su active_org_id — que elija cuándo cambiarse.
    const { error: memberError } = await adminClient
      .from('org_members')
      .insert({ org_id: callerOrgId, user_id: existingUserId, role })

    if (memberError) {
      if (memberError.code === '23505') {
        return jsonResponse({ error: 'Ese usuario ya es miembro de esta organización' }, 400)
      }
      return jsonResponse({ error: memberError.message }, 400)
    }

    return jsonResponse({ user: { id: existingUserId, email, full_name, role, existing: true } })
  }

  if (!password || password.length < 6) {
    return jsonResponse({ error: 'La contraseña debe tener al menos 6 caracteres' }, 400)
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, invited: true },
  })

  if (createError) {
    return jsonResponse({ error: createError.message }, 400)
  }

  // invited: true le dice al trigger on_auth_user_created que no inserte
  // nada en public.users — lo hacemos acá explícitamente, con la org del
  // owner que invita (nunca confiar en un org_id que venga del cliente).
  const { error: insertError } = await adminClient
    .from('users')
    .insert({ id: created.user.id, full_name, active_org_id: callerOrgId })

  if (insertError) {
    return jsonResponse({ error: insertError.message }, 400)
  }

  const { error: memberError } = await adminClient
    .from('org_members')
    .insert({ org_id: callerOrgId, user_id: created.user.id, role })

  if (memberError) {
    return jsonResponse({ error: memberError.message }, 400)
  }

  return jsonResponse({ user: { id: created.user.id, email, full_name, role } })
})
