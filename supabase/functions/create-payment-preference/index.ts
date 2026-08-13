// Supabase Edge Function: create-payment-preference
//
// Genera un link de pago (Checkout Pro) en Mercado Pago para una factura.
// Solo puede ser llamada por un usuario con rol 'owner' (misma regla que la
// RLS de invoices). Lee la factura con el cliente del caller (scopeada por
// RLS a su org) y guarda el link generado con la service role key.
//
// Deploy:
//   supabase functions deploy create-payment-preference
//
// Requiere estos secrets, además de los automáticos SUPABASE_URL /
// SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY:
//   supabase secrets set MP_ACCESS_TOKEN=...   (Developer Panel de Mercado Pago)
//   supabase secrets set APP_URL=https://<dominio-de-produccion>
//
// El webhook que confirma el pago es mp-webhook/index.ts — hay que
// configurarlo en el Developer Panel apuntando a
// https://<project-ref>.supabase.co/functions/v1/mp-webhook

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
  const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')
  const appUrl = Deno.env.get('APP_URL')

  if (!mpAccessToken || !appUrl) {
    return jsonResponse({ error: 'Falta configurar MP_ACCESS_TOKEN o APP_URL' }, 500)
  }

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
    return jsonResponse({ error: 'Solo el owner puede generar links de cobro' }, 403)
  }

  let body
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'JSON inválido' }, 400)
  }

  const { invoiceId } = body ?? {}
  if (!invoiceId) {
    return jsonResponse({ error: 'Falta el id de la factura' }, 400)
  }

  // Scopeada por RLS al org del caller: si no existe o no es de su org, falla acá.
  const { data: invoice, error: invoiceError } = await callerClient
    .from('invoices')
    .select('*, clients(name, company, email)')
    .eq('id', invoiceId)
    .single()

  if (invoiceError || !invoice) {
    return jsonResponse({ error: 'Factura no encontrada' }, 404)
  }

  if (invoice.status === 'paid') {
    return jsonResponse({ error: 'La factura ya está pagada' }, 400)
  }

  const invoiceUrl = `${appUrl}/app/finance/invoices/${invoice.id}`

  const preferenceRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${mpAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [
        {
          title: `Factura ${invoice.number}`,
          quantity: 1,
          unit_price: Number(invoice.amount),
          currency_id: invoice.currency,
        },
      ],
      payer: {
        name: invoice.clients?.name ?? invoice.clients?.company ?? undefined,
        email: invoice.clients?.email ?? undefined,
      },
      external_reference: invoice.id,
      notification_url: `${supabaseUrl}/functions/v1/mp-webhook`,
      back_urls: {
        success: invoiceUrl,
        failure: invoiceUrl,
        pending: invoiceUrl,
      },
      auto_return: 'approved',
    }),
  })

  if (!preferenceRes.ok) {
    const errBody = await preferenceRes.text()
    console.error('Mercado Pago preference error:', errBody)
    return jsonResponse({ error: 'No se pudo generar el link de pago en Mercado Pago' }, 502)
  }

  const preference = await preferenceRes.json()

  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const { error: updateError } = await adminClient
    .from('invoices')
    .update({
      payment_provider: 'mercadopago',
      mp_preference_id: preference.id,
      payment_link: preference.init_point,
    })
    .eq('id', invoice.id)

  if (updateError) {
    return jsonResponse({ error: updateError.message }, 400)
  }

  return jsonResponse({ paymentLink: preference.init_point })
})
