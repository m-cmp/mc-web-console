function showFieldError(fieldId, message) {
    const errorDiv = document.getElementById(fieldId + "-error");
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = "block";
    }
}

function clearFieldErrors() {
    const errorDivs = document.querySelectorAll("[id$='-error']");
    errorDivs.forEach(function(div) {
        div.style.display = "none";
        div.textContent = "";
    });
}

function showError(message) {
    const errorDiv = document.getElementById("error-message");
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = "block";
    }
}

function showSuccessState(redirectUrl) {
    document.getElementById("signup-form").style.display = "none";
    document.getElementById("success-message").style.display = "block";
    document.getElementById("go-login-btn").addEventListener("click", function() {
        window.location = "/auth/login";
    });
}

function validateSignupForm(email, password, firstName, lastName) {
    let isValid = true;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        showFieldError("email", "Please enter a valid email address.");
        isValid = false;
    }

    if (!password || password.length < 8) {
        showFieldError("password", "Password must be at least 8 characters.");
        isValid = false;
    }

    if (!firstName || firstName.length < 1) {
        showFieldError("firstName", "Please enter your first name.");
        isValid = false;
    }

    if (!lastName || lastName.length < 1) {
        showFieldError("lastName", "Please enter your last name.");
        isValid = false;
    }

    return isValid;
}

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("signupbtn").addEventListener("click", async function() {
        const signupBtn = document.getElementById("signupbtn");

        clearFieldErrors();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const firstName = document.getElementById("firstName").value.trim();
        const lastName = document.getElementById("lastName").value.trim();
        const organization = document.getElementById("organization").value.trim();

        if (!validateSignupForm(email, password, firstName, lastName)) {
            return;
        }

        signupBtn.disabled = true;

        try {
            const requestData = {
                email: email,
                password: password,
                firstName: firstName,
                lastName: lastName
            };

            if (organization !== "") {
                requestData.organization = organization;
            }

            const res = await webconsolejs["common/api/http"].commonAPIPostWithoutRetry("/api/auth/signup", { request: requestData });

            if (res.data && res.data.success === true) {
                showSuccessState(res.data.redirectUrl);
            } else {
                showError((res.data && res.data.error) || "An error occurred during registration.");
            }
        } catch (error) {
            console.error("Signup error:", error);
            showError("An error occurred during registration.");
        } finally {
            signupBtn.disabled = false;
        }
    });

    const fields = ["email", "password", "firstName", "lastName", "organization"];
    fields.forEach(function(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener("keydown", function(event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    document.getElementById("signupbtn").click();
                }
            });
        }
    });
});
