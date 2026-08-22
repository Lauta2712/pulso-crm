// Supabase Edge Function: list-product-subscriptions
//
// Lista todas las suscripciones al producto Compass (`product_subscriptions`)
// para que el superadmin las vea desde su propio dashboard. `product_admins`
// y `product_subscriptions` no tienen policies para anon/authenticated, así
// que esta es la única vía para leerlas desde el cliente — y solo después de
// verificar el rol del caller del lado del servidor con la service role key.
//
// Deploy:
//   supabase functions deploy list-product-subscriptions
//
// La función ya tiene acceso a SUPABASE_URL, SUPABASE_ANON_KEY y
// SUPABASE_SERVICE_ROLE_KEY como secrets automáticos del proyecto.

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

  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  // product_admins no tiene policies para authenticated: el chequeo tiene
  // que hacerse con la service role, nunca con el cliente del caller.
  const { data: admin, error: adminError } = await adminClient
    .from('product_admins')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (adminError || !admin) {
    return jsonResponse({ error: 'No autorizado' }, 403)
  }

  const { data: subscriptions, error: listError } = await adminClient
    .from('product_subscriptions')
    .select('*, product_plans(code, name)')
    .order('created_at', { ascending: false })

  if (listError) {
    return jsonResponse({ error: listError.message }, 400)
  }

  return jsonResponse({ subscriptions })
})
