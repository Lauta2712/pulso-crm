// Supabase Edge Function: delete-team-member
//
// Elimina a un integrante de la org activa de quien la invoca. Solo puede
// ser llamada por un usuario con rol 'owner' (verificado contra org_members
// con su propio JWT). Usa la service role key (secret de la función, nunca
// expuesto al frontend).
//
// Multi-org: esto borra únicamente la membresía (org_members) de ESTA org,
// nunca la cuenta de Auth — la persona puede pertenecer a otras orgs.
//
// Deploy:
//   supabase functions deploy delete-team-member
//
// La función ya tiene acceso a SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY como
// secrets automáticos del proyecto.

import { createClient } from 'npm:@supabase/supabase-js@2'

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
    return jsonResponse({ error: 'Solo el owner puede eliminar integrantes' }, 403)
  }

  let body
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'JSON inválido' }, 400)
  }

  const { user_id } = body ?? {}

  if (!user_id) {
    return jsonResponse({ error: 'Falta el id del integrante' }, 400)
  }

  if (user_id === user.id) {
    return jsonResponse({ error: 'No podés eliminarte a ti mismo' }, 400)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const { data: targetMembership, error: targetError } = await adminClient
    .from('org_members')
    .select('id')
    .eq('user_id', user_id)
    .eq('org_id', callerOrgId)
    .maybeSingle()

  if (targetError || !targetMembership) {
    return jsonResponse({ error: 'Integrante no encontrado' }, 404)
  }

  const { error: deleteError } = await adminClient
    .from('org_members')
    .delete()
    .eq('id', targetMembership.id)

  if (deleteError) {
    return jsonResponse({ error: deleteError.message }, 400)
  }

  return jsonResponse({ success: true })
})
