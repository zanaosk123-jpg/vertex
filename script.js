/* ========================================
   VERTEXRENT - MAIN JAVASCRIPT
======================================== */


/* ========================================
   MOBILE NAVIGATION
======================================== */

const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");

if (menuToggle && mainNav) {

    menuToggle.addEventListener("click", () => {

        const isOpen = mainNav.classList.toggle("open");

        menuToggle.setAttribute(
            "aria-expanded",
            isOpen
        );

    });


    // Close menu when navigation link is clicked

    const navLinks = mainNav.querySelectorAll("a");

    navLinks.forEach((link) => {

        link.addEventListener("click", () => {

            mainNav.classList.remove("open");

            menuToggle.setAttribute(
                "aria-expanded",
                "false"
            );

        });

    });

}


/* ========================================
   DATE VALIDATION
======================================== */

const dateFrom = document.getElementById("date-from");
const dateTo = document.getElementById("date-to");


if (dateFrom && dateTo) {

    // Today's date

    const today = new Date();

    const year = today.getFullYear();

    const month = String(
        today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        today.getDate()
    ).padStart(2, "0");

    const todayString =
        `${year}-${month}-${day}`;


    // Prevent selecting past dates

    dateFrom.min = todayString;

    dateTo.min = todayString;


    // Date From changes

    dateFrom.addEventListener("change", () => {

        dateTo.min = dateFrom.value;

        if (
            dateTo.value &&
            dateTo.value < dateFrom.value
        ) {

            dateTo.value = "";

        }

    });

}


/* ========================================
   CONTACT FORM DATE VALIDATION
======================================== */

const contactDateFrom =
    document.getElementById(
        "contact-date-from"
    );

const contactDateTo =
    document.getElementById(
        "contact-date-to"
    );


if (contactDateFrom && contactDateTo) {

    const today = new Date();

    const year = today.getFullYear();

    const month = String(
        today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        today.getDate()
    ).padStart(2, "0");

    const todayString =
        `${year}-${month}-${day}`;


    contactDateFrom.min =
        todayString;

    contactDateTo.min =
        todayString;


    contactDateFrom.addEventListener(
        "change",
        () => {

            contactDateTo.min =
                contactDateFrom.value;

            if (
                contactDateTo.value &&
                contactDateTo.value <
                contactDateFrom.value
            ) {

                contactDateTo.value = "";

            }

        }
    );

}


/* ========================================
   FORM SUBMISSION - VERCEL API
======================================== */

function setFormStatus(form, message, type = "") {
    const status = form.querySelector(".service-form-status") || form.querySelector(".form-note");
    if (!status) return;
    status.textContent = message;
    status.classList.remove("is-success", "is-error");
    if (type) status.classList.add(type);
}

function getTodayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

async function compressImage(file, maxDimension = 1600, quality = 0.78) {
    if (!file.type.startsWith("image/")) return file;

    const imageUrl = URL.createObjectURL(file);
    try {
        const image = await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = imageUrl;
        });

        const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d", { alpha: false });
        context.drawImage(image, 0, 0, width, height);

        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
        if (!blob) return file;

        const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
        return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
    } finally {
        URL.revokeObjectURL(imageUrl);
    }
}

async function buildMultipartFormData(form) {
    const formData = new FormData(form);
    const photoInput = form.querySelector('input[type="file"][name="photos"]');

    if (!photoInput || !photoInput.files.length) {
        return formData;
    }

    if (photoInput.files.length > 5) {
        throw new Error("Bitte wählen Sie höchstens 5 Fotos aus.");
    }

    formData.delete("photos");
    let totalBytes = 0;

    for (const file of photoInput.files) {
        const optimized = await compressImage(file);
        totalBytes += optimized.size;
        if (totalBytes > 3 * 1024 * 1024) {
            throw new Error("Die optimierten Fotos sind zu groß. Bitte wählen Sie weniger oder kleinere Bilder (max. 3 MB insgesamt).");
        }
        formData.append("photos", optimized, optimized.name);
    }

    return formData;
}

async function submitToContactApi(form, endpoint) {
    const status = form.querySelector(".service-form-status") || form.querySelector(".form-note");
    const button = form.querySelector("button[type=submit]");

    setFormStatus(form, "Wird gesendet…");
    if (button) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.textContent = "Wird gesendet…";
    }

    try {
        const formData = await buildMultipartFormData(form);
        const response = await fetch(endpoint, {
            method: "POST",
            body: formData
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(result.message || "Die Anfrage konnte nicht gesendet werden.");
        }

        form.reset();
        updateRentalDuration();
        updatePhotoList();
        setFormStatus(form, result.message || "Vielen Dank. Ihre Anfrage wurde erfolgreich gesendet.", "is-success");
        return true;
    } catch (error) {
        setFormStatus(form, error.message || "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.", "is-error");
        return false;
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = button.dataset.originalText || "Anfrage senden";
        }
    }
}

const minToday = getTodayString();

const rentalFrom = document.getElementById("rental-date-from");
const rentalTo = document.getElementById("rental-date-to");


function updateRentalDuration() {
    debugger;
    const rentalFrom = document.getElementById("rental-date-from");
    const rentalTo = document.getElementById("rental-date-to");
    const rentalDuration = document.getElementById("rental-duration");
    if (!rentalFrom || !rentalTo) return;
    if (!rentalFrom.value || !rentalTo.value) {
        rentalDuration.value = "—";
        return;
    }
    const start = new Date(`${rentalFrom.value}T00:00:00`);
    const end = new Date(`${rentalTo.value}T00:00:00`);
    const days = Math.round((end - start) / 86400000) + 1;
    rentalDuration.value = days > 0 ? `${days} day${days === 1 ? "" : "s"}` : "—";
}

if (rentalFrom && rentalTo) {
    rentalFrom.min = minToday;
    rentalTo.min = minToday;
    rentalFrom.addEventListener("change", () => {
        rentalTo.min = rentalFrom.value || minToday;
        if (rentalTo.value && rentalTo.value < rentalFrom.value) rentalTo.value = "";
        updateRentalDuration();
    });
    // rentalTo.addEventListener("change", updateRentalDuration);
    // updateRentalDuration();
}

//cretea event for change in rental duration when rentalFrom or rentalTo changes
document.querySelector("#rental-date-to").addEventListener("change", function () {
    debugger;
    updateRentalDuration();
});

const movingDate = document.getElementById("moving-date");
if (movingDate) movingDate.min = minToday;

function updatePhotoList() {
    const input = document.getElementById("moving-photos");
    const list = document.getElementById("moving-photo-list");
    if (!input || !list) return;
    const files = Array.from(input.files || []);
    list.textContent = files.length
        ? files.map((file) => file.name).join(" • ")
        : "Keine Fotos ausgewählt.";
}

const movingPhotos = document.getElementById("moving-photos");
if (movingPhotos) movingPhotos.addEventListener("change", updatePhotoList);

const serviceForms = document.querySelectorAll("[data-service-form]");
serviceForms.forEach((form) => {
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const endpoint = form.dataset.serviceForm === "moving" ? "/api/moving" : "/api/rental";
        submitToContactApi(form, endpoint);
    });
});

const contactForm = document.getElementById("contactForm");
if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
        event.preventDefault();
        submitToContactApi(contactForm, "/api/contact");
    });
}

/* ========================================
   CURRENT YEAR
======================================== */

const yearElements =
    document.querySelectorAll(
        ".current-year"
    );


yearElements.forEach((element) => {

    element.textContent =
        new Date().getFullYear();

});


/* ========================================
   HEADER SHADOW ON SCROLL
======================================== */

const header =
    document.querySelector(
        ".site-header"
    );


if (header) {

    window.addEventListener(
        "scroll",
        () => {

            if (window.scrollY > 20) {

                header.classList.add(
                    "scrolled"
                );

            } else {

                header.classList.remove(
                    "scrolled"
                );

            }

        }
    );

}

/* ========================================
   COOKIE NOTICE
======================================== */
const cookieNotice = document.getElementById("cookieNotice");
const cookieNecessary = document.getElementById("cookieNecessary");

function showCookieNotice() {
    if (!cookieNotice) return;
    try {
        if (localStorage.getItem("vertexrent-cookie-notice") === "1") return;
    } catch (_) {
        // If storage is unavailable, the notice still works for the session.
    }
    cookieNotice.hidden = false;
}

if (cookieNotice) {
    showCookieNotice();
    if (cookieNecessary) {
        cookieNecessary.addEventListener("click", () => {
            try {
                localStorage.setItem("vertexrent-cookie-notice", "1");
            } catch (_) {}
            cookieNotice.hidden = true;
        });
    }
}
