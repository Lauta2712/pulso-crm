// Supabase Edge Function: mp-webhook
//
// Recibe las notificaciones de pago de Mercado Pago (webhooks v2). Valida la
// firma con MP_WEBHOOK_SECRET, confirma el pago contra la API de Mercado
// Pago (nunca confía en el payload solo) y, si está aprobado, marca la
// factura como pagada e inserta la transacción de ingreso correspondiente.
// Pública: MP no manda un JWT de Supabase, por eso verify_jwt = false en
// config.toml (la autenticidad se valida con la firma HMAC, no con Supabase
// Auth).
//
// Deploy:
//   supabase functions deploy mp-webhook
//
// Configurar en el Developer Panel de Mercado Pago la URL de notificaciones:
//   https://<project-ref>.supabase.co/functions/v1/mp-webhook
// suscripta a eventos de "Pagos", y copiar el webhook secret que MP genera
// ahí a:
//   supabase secrets set MP_WEBHOOK_SECRET=...
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

  if (type !== 'payment' || !dataId) {
    return jsonResponse({ received: true })
  }

  const webhookSecret = Deno.env.get('MP_WEBHOOK_SECRET')
  const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!webhookSecret || !mpAccessToken) {
    console.error('Falta configurar MP_WEBHOOK_SECRET o MP_ACCESS_TOKEN')
    return jsonResponse({ error: 'Webhook no configurado' }, 500)
  }

  const validSignature = await verifySignature(req, dataId, webhookSecret)
  if (!validSignature) {
    return jsonResponse({ error: 'Firma inválida' }, 401)
  }

  const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
    headers: { Authorization: `Bearer ${mpAccessToken}` },
  })

  if (!paymentRes.ok) {
    console.error('No se pudo consultar el pago en Mercado Pago:', await paymentRes.text())
    return jsonResponse({ received: true })
  }

  const payment = await paymentRes.json()

  if (payment.status !== 'approved' || !payment.external_reference) {
    return jsonResponse({ received: true })
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const { data: invoice, error: invoiceError } = await adminClient
    .from('invoices')
    .select('*')
    .eq('id', payment.external_reference)
    .single()

  if (invoiceError || !invoice) {
    console.error('Factura no encontrada para external_reference:', payment.external_reference)
    return jsonResponse({ received: true })
  }

  if (invoice.mp_payment_id === String(payment.id)) {
    return jsonResponse({ received: true })
  }

  const today = new Date().toISOString().slice(0, 10)

  const { error: updateError } = await adminClient
    .from('invoices')
    .update({ status: 'paid', paid_date: today, mp_payment_id: String(payment.id) })
    .eq('id', invoice.id)

  if (updateError) {
    console.error('No se pudo actualizar la factura:', updateError.message)
    return jsonResponse({ received: true })
  }

  const { error: txError } = await adminClient.from('transactions').insert({
    org_id: invoice.org_id,
    project_id: invoice.project_id,
    invoice_id: invoice.id,
    type: 'income',
    amount: invoice.amount,
    currency: invoice.currency,
    date: today,
    description: `Pago Mercado Pago - Factura ${invoice.number}`,
    category: 'Cobro cliente',
  })

  if (txError) {
    console.error('No se pudo insertar la transacción:', txError.message)
  }

  return jsonResponse({ received: true })
})
