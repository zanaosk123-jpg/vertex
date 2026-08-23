const { requiredBody, sendEmail, json, parseRequest } = require("../lib/mail.js");

module.exports = async function handler(request) {
  if (request.method !== "POST") return json({ message: "Method not allowed" }, 405);

  let parsed;
  try {
    parsed = await parseRequest(request);
  } catch (error) {
    return json({ message: error.message || "Invalid request." }, 400);
  }

  const body = parsed.fields;
  if (!requiredBody(body, ["name", "email", "message"])) {
    return json({ message: "Please complete your name, email and message." }, 400);
  }

  return sendEmail(body, "VertexRent – General Contact Request", {
    customerSubject: "Your VertexRent contact request has been received",
  });
};
