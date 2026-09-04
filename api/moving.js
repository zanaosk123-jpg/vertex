const {
    getPublicKey,
    getServiceId,
    getTemplateId,
} = require("../lib/emailjs");

// ================================
// EmailJS
// ================================

emailjs.init({
    publicKey: getPublicKey(),
});


// ================================
// Moving Contact Form
// ================================

const movingForm = document.querySelector(".moving-contact-form");

if (movingForm) {
    movingForm.addEventListener("submit", async function (event) {

        event.preventDefault();
        const submitButton = movingForm.querySelector(
            ".service-form-submit"
        );

        const status = movingForm.querySelector(
            ".service-form-status"
        );

        // Check required fields
        if (!movingForm.checkValidity()) {
            movingForm.reportValidity();
            return;
        }

        submitButton.disabled = true;
        status.textContent = "Wird gesendet...";

        try {
            const response = await emailjs.sendForm(
                getServiceId(),
                getTemplateId(),
                movingForm
            );

            console.log(
                "EmailJS SUCCESS:",
                response.status,
                response.text
            );

            status.textContent =
                "Ihre Anfrage wurde erfolgreich gesendet.";

            movingForm.reset();

            // Clear displayed photo list
            const photoList =
                document.getElementById("moving-photo-list");

            if (photoList) {
                photoList.textContent = "";
            }

        } catch (error) {
            console.error("EmailJS FAILED:", error);

            status.textContent =
                "Beim Senden ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.";
        } finally {
            submitButton.disabled = false;
        }
    });
}