const publicKey = "2MP3zNzGusKiciao0";
const serviceId = "service_2a7bujg";
const templateId = "template_ex5rq37";

// ================================
// EmailJS
// ================================

emailjs.init({
    publicKey: publicKey
});

// ================================
// Moving Contact Form
// ================================

const movingForm = document.querySelector(
    ".moving-contact-form"
);

if (movingForm) {
    movingForm.addEventListener(
        "submit",
        async function (event) {
            event.preventDefault();

            const submitButton =
                movingForm.querySelector(
                    ".service-form-submit"
                );

            const status =
                movingForm.querySelector(
                    ".service-form-status"
                );

            // Validate form
            if (!movingForm.checkValidity()) {
                movingForm.reportValidity();
                return;
            }

            submitButton.disabled = true;
            status.textContent = "Wird gesendet...";

            try {
                // Send complete form through EmailJS
                const response = await emailjs.sendForm(
                    serviceId,
                    templateId,
                    movingForm
                );

                console.log(
                    "EmailJS SUCCESS:",
                    response.status,
                    response.text
                );

                status.textContent =
                    "Ihre Anfrage wurde erfolgreich gesendet.";

                // Reset form
                movingForm.reset();

                // Clear photo list
                const photoList =
                    document.getElementById(
                        "moving-photo-list"
                    );

                if (photoList) {
                    photoList.textContent = "";
                }

            } catch (error) {
                console.error(
                    "EMAILJS ERROR:",
                    error
                );

                status.textContent =
                    "Beim Senden ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.";
            } finally {
                submitButton.disabled = false;
            }
        }
    );
}
