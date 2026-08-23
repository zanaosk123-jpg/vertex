const { requiredBody, sendEmail, json, parseRequest, validISODate, rentalDurationInDays } = require("../lib/mail.js");

module.exports = async function handler(request) {
  if (request.method !== "POST") return json({ message: "Method not allowed" }, 405);

  let parsed;
  try {
    parsed = await parseRequest(request);
  } catch (error) {
    return json({ message: error.message || "Invalid request." }, 400);
  }

  const body = parsed.fields;
  if (!requiredBody(body, ["name", "email", "phone", "vehicle", "dateFrom", "dateTo", "duration"])) {
    return json({ message: "Please complete all required rental fields." }, 400);
  }

  if (!validISODate(body.dateFrom) || !validISODate(body.dateTo) || new Date(`${body.dateTo}T00:00:00Z`) < new Date(`${body.dateFrom}T00:00:00Z`)) {
    return json({ message: "Please select a valid rental period." }, 400);
  }

  const days = rentalDurationInDays(body.dateFrom, body.dateTo);
  body.duration = `${days} day${days === 1 ? "" : "s"}`;

  return sendEmail(body, "VertexRent – Rental Cars Request", {
    customerSubject: "Your VertexRent rental request has been received",
  });
};
