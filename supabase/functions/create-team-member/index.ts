// Supabase Edge Function: create-team-member
//
// Invita un nuevo integrante a la org de quien la invoca. Solo puede ser
// llamada por un usuario con rol 'owner' (verificado contra public.users con
// su propio JWT). Usa la service role key (secret de la función, nunca
// expuesto al frontend) para crear el usuario vía Supabase Auth y asignarlo
// explícitamente al org_id del owner que invita, con el rol elegido.
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
    .select('role, org_id')
    .eq('id', user.id)
    .single()

  if (profileError || callerProfile?.role !== 'owner') {
    return jsonResponse({ error: 'Solo el owner puede crear integrantes' }, 403)
  }

  let body
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'JSON inválido' }, 400)
  }

  const { email, full_name, role, password } = body ?? {}

  if (!email || !full_name || !role || !password) {
    return jsonResponse({ error: 'Faltan datos (email, nombre, rol o contraseña)' }, 400)
  }

  if (!VALID_ROLES.includes(role)) {
    return jsonResponse({ error: 'Rol inválido' }, 400)
  }

  if (password.length < 6) {
    return jsonResponse({ error: 'La contraseña debe tener al menos 6 caracteres' }, 400)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey)

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
  // nada en public.users — lo hacemos acá explícitamente, con el org_id del
  // owner que invita (nunca confiar en un org_id que venga del cliente).
  const { error: insertError } = await adminClient
    .from('users')
    .insert({ id: created.user.id, org_id: callerProfile.org_id, full_name, role })

  if (insertError) {
    return jsonResponse({ error: insertError.message }, 400)
  }

  return jsonResponse({ user: { id: created.user.id, email, full_name, role } })
})
