const publicKey = "dqyIjQtZVbtpmWEGX";
const serviceId = "service_np5vlef";
const templateId = "template_k713qpl";

// ================================
// EmailJS
// ================================

emailjs.init({
    publicKey: publicKey
});

// // ================================
// // Moving Contact Form
// // ================================
const contactForm = document.querySelector("#contactForm");

if (contactForm) {
  const submitButton = contactForm.querySelector(".contact-submit");
  const status = contactForm.querySelector(".contact-form-status");

  contactForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }

    submitButton.disabled = true;
    status.textContent = "Wird gesendet...";

    try {
      const response = await emailjs.sendForm(
        serviceId,
        templateId,
        contactForm
      );

      status.textContent = "Ihre Anfrage wurde erfolgreich gesendet.";
      contactForm.reset();
    } catch (error) {

      status.textContent =
        "Beim Senden ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.";
    } finally {
      submitButton.disabled = false;
    }
  });
}