# VertexRent – Vercel Forms Setup

The site remains a static HTML/CSS/JS site. Rental and Moving requests submit to Vercel Functions and are delivered through Resend.

## Environment variables

Set these in **Vercel → Project → Settings → Environment Variables**:

- `RESEND_API_KEY` – Resend API key with permission to send email.
- `CONTACT_TO_EMAIL` – the client's receiving/admin email address.
- `EMAIL_FROM` – a verified sender address/domain in Resend, for example `Website <no-reply@vertexrent.de>`.

After adding or changing variables, redeploy the project.

## Forms

- `services.html#rental-contact` → Rental Contact Form → `/api/rental`
- `services.html#moving-contact` → Moving Contact Form → `/api/moving`
- Homepage contact form → `/api/contact`

The old mixed booking form has been replaced by a service gateway so Rental and Moving requests stay separate.

## Email behavior

Every successful Rental or Moving request sends:

1. A full request email to `CONTACT_TO_EMAIL`.
2. A separate confirmation email to the customer email entered in the form.

Moving photos are optimized in the browser before upload and are included as attachments on the admin email. The implementation allows up to 5 photos with a 3 MB optimized total payload to stay comfortably below Vercel's current serverless function request-size limit.

## Important production step

Verify the sender domain in Resend before using a production address in `EMAIL_FROM`.

## Legal pages

The project includes `impressum.html`, `agb.html`, `datenschutz.html` and `cookies.html`. These are website-ready draft structures. The final Impressum requires the client's real business/operator details, and the AGB/Datenschutz should be reviewed against the actual business terms and live provider configuration before publication.
