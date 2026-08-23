const { requiredBody, sendEmail, json, parseRequest, validISODate } = require("../lib/mail.js");

module.exports = async function handler(request) {
  if (request.method !== "POST") return json({ message: "Method not allowed" }, 405);

  let parsed;
  try {
    parsed = await parseRequest(request);
  } catch (error) {
    return json({ message: error.message || "Invalid upload." }, 400);
  }

  const body = parsed.fields;
  if (!requiredBody(body, [
    "name", "email", "phone", "movingDate", "pickupAddress", "pickupZip",
    "destinationAddress", "destinationZip", "pickupFloor", "destinationFloor",
    "helpers", "pickupElevator", "destinationElevator", "movingItems"
  ])) {
    return json({ message: "Please complete all required moving fields." }, 400);
  }

  if (!validISODate(body.movingDate)) {
    return json({ message: "Please select a valid moving date." }, 400);
  }

  return sendEmail(body, "VertexRent – Moving / Household Moving Request", {
    attachments: parsed.attachments,
    customerSubject: "Your VertexRent moving request has been received",
  });
};
