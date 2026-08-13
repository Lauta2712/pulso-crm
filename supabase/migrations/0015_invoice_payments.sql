-- Cobro de facturas vía Mercado Pago Checkout Pro.
alter table invoices
  add column payment_provider text,
  add column mp_preference_id text,
  add column mp_payment_id text,
  add column payment_link text;
