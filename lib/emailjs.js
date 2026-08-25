const publicKey = "2MP3zNzGusKiciao0";
const serviceId = "service_2a7bujg";
const templateId = "template_ex5rq37";

emailjs.init({
    publicKey
});

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

            if (!movingForm.checkValidity()) {
                movingForm.reportValidity();
                return;
            }

            submitButton.disabled = true;
            status.textContent = "Wird gesendet...";

            try {
                const formData =
                    new FormData(movingForm);

                // Save photos
                const uploadResponse =
                    await fetch(
                        "/api/upload-moving",
                        {
                            method: "POST",
                            body: formData
                        }
                    );

                const uploadResult =
                    await uploadResponse.json();

                if (
                    !uploadResponse.ok ||
                    !uploadResult.success
                ) {
                    throw new Error(
                        uploadResult.message ||
                        "Foto-Upload fehlgeschlagen."
                    );
                }

                // Prepare EmailJS data
                const emailData = {};

                for (
                    const [key, value]
                    of formData.entries()
                ) {
                    if (key !== "photos") {
                        emailData[key] = value;
                    }
                }

                // Photo links
                emailData.photoLinks =
                    uploadResult.urls.length > 0
                        ? uploadResult.urls.join("\n")
                        : "Keine Fotos hochgeladen.";

                // Send email
                const response =
                    await emailjs.send(
                        serviceId,
                        templateId,
                        emailData
                    );

                console.log(
                    "Email sent:",
                    response
                );

                status.textContent =
                    "Ihre Anfrage wurde erfolgreich gesendet.";

                movingForm.reset();

            } catch (error) {
                console.error(
                    "MOVING FORM ERROR:",
                    error
                );

                status.textContent =
                    "Beim Senden ist ein Fehler aufgetreten.";
            } finally {
                submitButton.disabled = false;
            }
        }
    );
}