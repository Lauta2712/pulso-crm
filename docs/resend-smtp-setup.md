# Configurar SMTP con Resend

Objetivo: que los mails de autenticación (reset de contraseña, cambio de email) salgan desde
el dominio propio de Pulso Studio en lugar de `noreply@mail.app.supabase.io`.

Resend es gratis hasta 3.000 mails/mes y se integra directo con Supabase vía SMTP.

---

## Paso 1 — Crear cuenta en Resend

- Entrá a **resend.com** → Sign Up (se puede usar la cuenta de GitHub)

---

## Paso 2 — Agregar y verificar el dominio

1. En Resend: **Domains → Add Domain**
2. Ingresá el dominio (ej: `pulsostudio.com.ar`)
3. Resend genera registros DNS (TXT + MX + DKIM) para agregar en el panel de DNS del dominio
   (Cloudflare, GoDaddy, Namecheap, etc.)
4. Una vez agregados, tocás **Verify** — puede tardar unos minutos en propagar

> Si no hay dominio propio todavía, Resend da un sandbox `@resend.dev` que solo entrega
> mails a tu propio email — sirve para probar mientras tanto.

---

## Paso 3 — Crear API Key

1. En Resend: **API Keys → Create API Key**
2. Nombre sugerido: `Pulso CRM Supabase`
3. Permission: **Sending access**
4. Domain: seleccionar el dominio verificado
5. Copiar la key (empieza con `re_...`)

---

## Paso 4 — Configurar SMTP en Supabase

En el Supabase Dashboard del proyecto **Pulso CRM**:

**Project Settings → Authentication → SMTP Settings**

Activar **"Enable Custom SMTP"** y completar:

| Campo           | Valor                                      |
|-----------------|--------------------------------------------|
| Host            | `smtp.resend.com`                          |
| Port            | `465`                                      |
| Username        | `resend`                                   |
| Password        | `re_...` (la API key del paso anterior)    |
| Sender name     | `Pulso Studio`                             |
| Sender email    | `noreply@pulsostudio.com.ar`               |

Guardar.

---

## Paso 5 — Actualizar el template de Reset Password

En **Authentication → Email Templates → Reset Password**, reemplazar el Body con:

```html
<div style="font-family: 'Inter', Arial, sans-serif; background: #0f0f13; padding: 40px 20px; min-height: 100vh;">
  <div style="max-width: 480px; margin: 0 auto; background: #1a1a24; border: 1px solid #2a2a3a; border-radius: 12px; padding: 40px;">

    <div style="margin-bottom: 32px;">
      <span style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px;">Pulso Studio</span>
      <span style="font-size: 20px; color: #7c6af7; font-weight: 700;"> ·</span>
    </div>

    <h1 style="color: #ffffff; font-size: 22px; font-weight: 600; margin: 0 0 12px 0;">
      Cambiar contraseña
    </h1>
    <p style="color: #8b8b9e; font-size: 15px; line-height: 1.6; margin: 0 0 32px 0;">
      Recibimos una solicitud para restablecer la contraseña de tu cuenta en el CRM de Pulso Studio.
    </p>

    <a href="{{ .ConfirmationURL }}"
       style="display: inline-block; background: #7c6af7; color: #ffffff; text-decoration: none;
              font-size: 15px; font-weight: 600; padding: 13px 28px; border-radius: 8px;">
      Restablecer contraseña
    </a>

    <p style="color: #55556a; font-size: 13px; margin: 32px 0 0 0; line-height: 1.6;">
      Si no solicitaste este cambio, ignorá este mail. El link expira en 1 hora.
    </p>
  </div>
</div>
```

Subject: `Restablecer contraseña · Pulso Studio`

---

## Paso 6 — Probar

En **Authentication → Email Templates → Reset Password** hay un botón
**"Send test email"** para verificar que el mail llega desde el dominio correcto.
