// Supabase Edge Function: create-team-member
//
// Invita un nuevo integrante a la org de Pulso Studio. Solo puede ser llamada
// por un usuario con rol 'owner' (verificado contra public.users con su propio
// JWT). Usa la service role key (secret de la función, nunca expuesto al
// frontend) para invitar al usuario vía Supabase Auth y asignarle el rol
// elegido.
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

  const {
    data: { user },
    error: userError,
  } = await callerClient.auth.getUser()

  if (userError || !user) {
    return jsonResponse({ error: 'Sesión inválida' }, 401)
  }

  const { data: callerProfile, error: profileError } = await callerClient
    .from('users')
    .select('role')
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

  const { email, full_name, role } = body ?? {}

  if (!email || !full_name || !role) {
    return jsonResponse({ error: 'Faltan datos (email, nombre o rol)' }, 400)
  }

  if (!VALID_ROLES.includes(role)) {
    return jsonResponse({ error: 'Rol inválido' }, 400)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    email,
    { data: { full_name } }
  )

  if (inviteError) {
    return jsonResponse({ error: inviteError.message }, 400)
  }

  // El trigger on_auth_user_created ya insertó la fila en public.users con
  // org_id y rol por defecto ('developer'). Acá la actualizamos con el
  // nombre y el rol elegidos.
  const { error: updateError } = await adminClient
    .from('users')
    .update({ full_name, role })
    .eq('id', invited.user.id)

  if (updateError) {
    return jsonResponse({ error: updateError.message }, 400)
  }

  return jsonResponse({ user: { id: invited.user.id, email, full_name, role } })
})
