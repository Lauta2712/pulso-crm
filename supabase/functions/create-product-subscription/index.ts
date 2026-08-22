// Supabase Edge Function: create-product-subscription
//
// Arranca el checkout de la suscripción de una agencia al producto Compass
// (distinto de que la agencia le cobre a SUS clientes — eso es
// create-payment-preference/mp-webhook sobre `invoices`). Pública, sin
// sesión: la llama cualquiera desde la página de precios.
//
// El precio se resuelve del lado del servidor desde `product_plans` — nunca
// se confía en un precio mandado por el frontend. Se inserta primero una
// fila `pending` en `product_subscriptions` (para tener registro del intento
// aunque el pago nunca se complete), después se crea la suscripción en
// Mercado Pago con `external_reference` = el id de esa fila, y recién ahí se
// guarda el `mp_preapproval_id`/`mp_init_point` devueltos.
//
// Deploy:
//   supabase functions deploy create-product-subscription
//
// Requiere estos secrets (además de los automáticos SUPABASE_URL /
// SUPABASE_SERVICE_ROLE_KEY):
//   supabase secrets set MP_ACCESS_TOKEN=...   (ya configurado para create-payment-preference)
//   supabase secrets set APP_URL=https://<dominio-de-producción>
//
// El webhook que confirma/actualiza el estado es
// product-subscription-webhook/index.ts — hay que configurarlo en el
// Developer Panel de Mercado Pago apuntando a
// https://<project-ref>.supabase.co/functions/v1/product-subscription-webhook

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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')
  const appUrl = Deno.env.get('APP_URL')

  if (!mpAccessToken || !appUrl) {
    return jsonResponse({ error: 'Falta configurar MP_ACCESS_TOKEN o APP_URL' }, 500)
  }

  let body
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'JSON inválido' }, 400)
  }

  const { planId, contactName, contactEmail, orgName, billingCycle } = body ?? {}

  if (!planId || !contactName || !contactEmail || !orgName) {
    return jsonResponse({ error: 'Faltan datos (plan, nombre, email o agencia)' }, 400)
  }

  if (billingCycle !== 'monthly' && billingCycle !== 'yearly') {
    return jsonResponse({ error: 'Ciclo de facturación inválido' }, 400)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const { data: plan, error: planError } = await adminClient
    .from('product_plans')
    .select('*')
    .eq('id', planId)
    .eq('is_active', true)
    .single()

  if (planError || !plan) {
    return jsonResponse({ error: 'Plan no encontrado' }, 404)
  }

  const amountUsd = billingCycle === 'yearly' ? Number(plan.price_usd_yearly) : Number(plan.price_usd_monthly)

  const dolarRes = await fetch('https://dolarapi.com/v1/dolares/oficial')
  if (!dolarRes.ok) {
    return jsonResponse({ error: 'No se pudo obtener la cotización del dólar' }, 502)
  }
  const dolar = await dolarRes.json()
  const arsRate = Number(dolar?.venta)
  if (!arsRate) {
    return jsonResponse({ error: 'Cotización del dólar inválida' }, 502)
  }
  const amountArs = Math.round(amountUsd * arsRate)

  const { data: subscription, error: insertError } = await adminClient
    .from('product_subscriptions')
    .insert({
      plan_id: plan.id,
      contact_name: contactName,
      contact_email: contactEmail,
      org_name: orgName,
      billing_cycle: billingCycle,
      status: 'pending',
      amount_usd: amountUsd,
      amount_ars: amountArs,
      ars_rate: arsRate,
    })
    .select()
    .single()

  if (insertError || !subscription) {
    return jsonResponse({ error: insertError?.message ?? 'No se pudo registrar la suscripción' }, 400)
  }

  const preapprovalRes = await fetch('https://api.mercadopago.com/preapproval', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${mpAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reason: `Compass — Plan ${plan.name} (${billingCycle === 'yearly' ? 'anual' : 'mensual'})`,
      external_reference: subscription.id,
      payer_email: contactEmail,
      back_url: `${appUrl}/gracias-suscripcion`,
      auto_recurring: {
        frequency: 1,
        frequency_type: billingCycle === 'yearly' ? 'years' : 'months',
        transaction_amount: amountArs,
        currency_id: 'ARS',
      },
      notification_url: `${supabaseUrl}/functions/v1/product-subscription-webhook`,
      status: 'pending',
    }),
  })

  if (!preapprovalRes.ok) {
    const errBody = await preapprovalRes.text()
    console.error('Mercado Pago preapproval error:', errBody)
    return jsonResponse({ error: 'No se pudo generar el checkout en Mercado Pago' }, 502)
  }

  const preapproval = await preapprovalRes.json()

  const { error: updateError } = await adminClient
    .from('product_subscriptions')
    .update({
      mp_preapproval_id: preapproval.id,
      mp_init_point: preapproval.init_point,
    })
    .eq('id', subscription.id)

  if (updateError) {
    return jsonResponse({ error: updateError.message }, 400)
  }

  return jsonResponse({ initPoint: preapproval.init_point })
})
