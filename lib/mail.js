const RESEND_API_URL = "https://api.resend.com/emails";
const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_BYTES = 1 * 1024 * 1024;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function clean(value) {
  return String(value ?? "").trim().slice(0, 5000);
}

function requiredBody(body, required) {
  return required.every((field) => clean(body[field]));
}

function escapeHtml(value) {
  return clean(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatLabel(key) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function emailRows(data) {
  return Object.entries(data)
    .filter(([, value]) => clean(value))
    .map(([key, value]) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:700;width:35%">${escapeHtml(formatLabel(key))}</td><td style="padding:8px 12px;border-bottom:1px solid #eee">${escapeHtml(value).replaceAll("\n", "<br>")}</td></tr>`)
    .join("");
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(email));
}

function validISODate(value) {
  const text = clean(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const date = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
}

function rentalDurationInDays(from, to) {
  if (!validISODate(from) || !validISODate(to)) return 0;
  const start = Date.parse(`${clean(from)}T00:00:00Z`);
  const end = Date.parse(`${clean(to)}T00:00:00Z`);
  const days = Math.round((end - start) / 86400000) + 1;
  return days > 0 ? days : 0;
}

async function parseRequest(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    const body = await request.json();
    return { fields: body || {}, attachments: [] };
  }

  const formData = await request.formData();
  const fields = {};
  const attachments = [];

  for (const [key, value] of formData.entries()) {
    const isUploadedFile = value && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string";
    if (isUploadedFile) {
      if (!value.size) continue;
      if (!value.type.startsWith("image/")) {
        throw new Error("Only image files can be uploaded.");
      }
      if (attachments.length >= MAX_ATTACHMENTS) {
        throw new Error(`A maximum of ${MAX_ATTACHMENTS} photos is allowed.`);
      }
      if (value.size > MAX_ATTACHMENT_BYTES) {
        throw new Error(`Each photo must be smaller than ${Math.round(MAX_ATTACHMENT_BYTES / 1024)} KB.`);
      }
      const buffer = Buffer.from(await value.arrayBuffer());
      attachments.push({
        filename: value.name || `moving-photo-${attachments.length + 1}.jpg`,
        content: buffer.toString("base64"),
      });
      continue;
    }
    fields[key] = clean(value);
  }

  return { fields, attachments };
}

async function sendResendEmail({ apiKey, from, to, replyTo, subject, html, attachments = [] }) {
  const payload = {
    from,
    to: [to],
    subject,
    html,
    ...(replyTo ? { reply_to: replyTo } : {}),
    ...(attachments.length ? { attachments } : {}),
  };

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("Resend error", details);
    throw new Error("Email delivery failed.");
  }

  return response.json().catch(() => ({}));
}

async function sendEmail(data, subject, options = {}) {
  const apiKey = process.env.RESEND_API_KEY;
  
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !to || !from) {
    return json({ message: "The form is not configured yet. Set RESEND_API_KEY, CONTACT_TO_EMAIL and EMAIL_FROM in Vercel." }, 503);
  }

  const customerEmail = clean(data.email);
  if (!validEmail(customerEmail)) {
    return json({ message: "Please enter a valid email address." }, 400);
  }
  const to = customerEmail;
  
  const attachments = options.attachments || [];
  const adminHtml = `<div style="font-family:Arial,sans-serif;max-width:760px;color:#111"><h2 style="margin-bottom:8px">${escapeHtml(subject)}</h2><p style="color:#666">A new request was submitted through vertexrent.de.</p><table style="width:100%;border-collapse:collapse;border:1px solid #eee">${emailRows(data)}</table>${attachments.length ? `<p style="margin-top:18px;color:#666">${attachments.length} photo attachment(s) included.</p>` : ""}</div>`;

  // 1. Admin receives the full request, with moving photos when available.
  await sendResendEmail({
    apiKey,
    from,
    to,
    replyTo: customerEmail,
    subject,
    html: adminHtml,
    attachments,
  });

  // 2. Customer receives a separate confirmation email.
  const customerSubject = options.customerSubject || "VertexRent – Request received";
  const customerHtml = `<div style="font-family:Arial,sans-serif;max-width:680px;color:#111"><div style="padding:28px 0;border-bottom:1px solid #eee"><strong style="font-size:20px">VERTEX<span style="font-weight:400">RENT</span></strong></div><div style="padding:28px 0"><p style="margin-top:0">Hello ${escapeHtml(data.name)},</p><h2>${escapeHtml(customerSubject)}</h2><p>Thank you for contacting VertexRent. We have received your request and will review the details shortly.</p><p>Availability, pricing and the next step will be confirmed by our team before any payment is required.</p><p style="margin-top:28px">Best regards,<br>VertexRent</p></div></div>`;

  await sendResendEmail({
    apiKey,
    from,
    to: customerEmail,
    subject: customerSubject,
    html: customerHtml,
    replyTo: to,
  });

  return json({ message: "Thank you. Your request has been sent successfully. A confirmation email has been sent to you." });
}

module.exports = { clean, requiredBody, sendEmail, json, parseRequest, validISODate, rentalDurationInDays };
