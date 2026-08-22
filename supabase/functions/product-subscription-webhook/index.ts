// Supabase Edge Function: product-subscription-webhook
//
// Recibe las notificaciones de Mercado Pago sobre suscripciones
// (subscription_preapproval). Nunca confía en el payload de la notificación:
// siempre vuelve a pedirle el preapproval a la API de Mercado Pago por id y
// recién ahí actualiza `product_subscriptions.status`. Siempre responde 200
// rápido aunque algo interno falle, para no generar una notificación que MP
// reintente sin parar.
//
// Pública: MP no manda un JWT de Supabase, por eso verify_jwt = false en
// config.toml (la autenticidad se valida con la firma HMAC del header
// x-signature, no con Supabase Auth) — mismo patrón que mp-webhook para
// invoices.
//
// Deploy:
//   supabase functions deploy product-subscription-webhook
//
// Configurar en el Developer Panel de Mercado Pago una URL de notificaciones
// separada de la de invoices, apuntando a:
//   https://<project-ref>.supabase.co/functions/v1/product-subscription-webhook
// suscripta a eventos de "Suscripciones", y copiar el webhook secret que MP
// genera ahí a:
//   supabase secrets set MP_SUBSCRIPTION_WEBHOOK_SECRET=...
// (además de MP_ACCESS_TOKEN, ya configurado para create-payment-preference)

import { createClient } from 'npm:@supabase/supabase-js@2'

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

async function verifySignature(req, dataId, webhookSecret) {
  const signatureHeader = req.headers.get('x-signature')
  const requestId = req.headers.get('x-request-id')
  if (!signatureHeader || !requestId) return false

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((part) => {
      const [key, value] = part.split('=')
      return [key.trim(), value?.trim()]
    })
  )

  const ts = parts.ts
  const v1 = parts.v1
  if (!ts || !v1) return false

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest))
  const computed = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return computed === v1
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const url = new URL(req.url)
  const type = url.searchParams.get('type') ?? url.searchParams.get('topic')
  const dataId = url.searchParams.get('data.id') ?? url.searchParams.get('id')

  if ((type !== 'subscription_preapproval' && type !== 'preapproval') || !dataId) {
    return jsonResponse({ received: true })
  }

  const webhookSecret = Deno.env.get('MP_SUBSCRIPTION_WEBHOOK_SECRET')
  const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!webhookSecret || !mpAccessToken) {
    console.error('Falta configurar MP_SUBSCRIPTION_WEBHOOK_SECRET o MP_ACCESS_TOKEN')
    return jsonResponse({ error: 'Webhook no configurado' }, 500)
  }

  const validSignature = await verifySignature(req, dataId, webhookSecret)
  if (!validSignature) {
    return jsonResponse({ error: 'Firma inválida' }, 401)
  }

  const preapprovalRes = await fetch(`https://api.mercadopago.com/preapproval/${dataId}`, {
    headers: { Authorization: `Bearer ${mpAccessToken}` },
  })

  if (!preapprovalRes.ok) {
    console.error('No se pudo consultar la suscripción en Mercado Pago:', await preapprovalRes.text())
    return jsonResponse({ received: true })
  }

  const preapproval = await preapprovalRes.json()

  if (!preapproval.external_reference) {
    return jsonResponse({ received: true })
  }

  // El status de MP (pending/authorized/paused/cancelled) coincide 1 a 1 con
  // el check constraint de product_subscriptions.status.
  const validStatuses = ['pending', 'authorized', 'paused', 'cancelled']
  if (!validStatuses.includes(preapproval.status)) {
    return jsonResponse({ received: true })
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const { error: updateError } = await adminClient
    .from('product_subscriptions')
    .update({
      status: preapproval.status,
      mp_preapproval_id: String(preapproval.id),
    })
    .eq('id', preapproval.external_reference)

  if (updateError) {
    console.error('No se pudo actualizar la suscripción:', updateError.message)
  }

  return jsonResponse({ received: true })
})
