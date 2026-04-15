/**
 * Common Form Validation Utility
 *
 * Usage:
 *   import { validateForm, validateField, clearValidation } from 'common/utils/formvalidation';
 *
 *   // Validate entire form (Bootstrap 5 validation classes)
 *   if (!validateForm('my-form-id')) return;
 *
 *   // Validate a single field with custom rules
 *   validateField('my-input-id', { required: true, minLength: 3 });
 */

/**
 * Validate a single field element.
 * Applies Bootstrap 5 is-valid / is-invalid classes.
 *
 * @param {HTMLElement|string} elOrId  - Element or element ID
 * @param {object}             rules   - Validation rules
 * @param {boolean}            [rules.required]    - Must not be empty
 * @param {number}             [rules.minLength]   - Minimum string length
 * @param {number}             [rules.maxLength]   - Maximum string length
 * @param {RegExp}             [rules.pattern]     - Regex the value must match
 * @param {Function}           [rules.custom]      - (value) => string|null  (return error message or null)
 * @returns {boolean} true if field is valid
 */
export function validateField(elOrId, rules = {}) {
    const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
    if (!el) return true;

    const value = (el.value || '').trim();
    let errorMsg = null;

    if (rules.required && value === '') {
        errorMsg = 'This field is required.';
    } else if (rules.minLength && value.length < rules.minLength) {
        errorMsg = `Must be at least ${rules.minLength} characters.`;
    } else if (rules.maxLength && value.length > rules.maxLength) {
        errorMsg = `Must be no more than ${rules.maxLength} characters.`;
    } else if (rules.pattern && !rules.pattern.test(value)) {
        errorMsg = rules.patternMessage || 'Invalid format.';
    } else if (rules.custom) {
        errorMsg = rules.custom(value) || null;
    }

    _applyFieldState(el, errorMsg);
    return errorMsg === null;
}

/**
 * Validate all required/constrained form fields in a form.
 * Relies on HTML5 constraint attributes (required, minlength, maxlength, pattern, type).
 *
 * @param {HTMLFormElement|string} formOrId - Form element or form ID
 * @returns {boolean} true if the entire form is valid
 */
export function validateForm(formOrId) {
    const form = typeof formOrId === 'string' ? document.getElementById(formOrId) : formOrId;
    if (!form) return true;

    let valid = true;

    const fields = form.querySelectorAll('input, select, textarea');
    fields.forEach(field => {
        if (field.disabled || field.readOnly) return;

        const value = (field.value || '').trim();
        let errorMsg = null;

        if (field.required && value === '') {
            errorMsg = 'This field is required.';
        } else if (field.minLength > 0 && value.length < field.minLength) {
            errorMsg = `Must be at least ${field.minLength} characters.`;
        } else if (field.maxLength > 0 && value.length > field.maxLength) {
            errorMsg = `Must be no more than ${field.maxLength} characters.`;
        } else if (field.pattern && value !== '' && !new RegExp(field.pattern).test(value)) {
            errorMsg = field.title || 'Invalid format.';
        } else if (field.type === 'email' && value !== '' && !_isValidEmail(value)) {
            errorMsg = 'Please enter a valid email address.';
        } else if (field.type === 'url' && value !== '' && !_isValidUrl(value)) {
            errorMsg = 'Please enter a valid URL.';
        } else if (field.type === 'number' && value !== '' && isNaN(Number(value))) {
            errorMsg = 'Please enter a valid number.';
        }

        if (errorMsg) valid = false;
        _applyFieldState(field, errorMsg);
    });

    return valid;
}

/**
 * Clear validation state from all fields in a form or a single field.
 *
 * @param {HTMLFormElement|HTMLElement|string} target - Form, field, or ID
 */
export function clearValidation(target) {
    const el = typeof target === 'string' ? document.getElementById(target) : target;
    if (!el) return;

    const fields = el.tagName === 'FORM'
        ? el.querySelectorAll('input, select, textarea')
        : [el];

    fields.forEach(f => {
        f.classList.remove('is-valid', 'is-invalid');
        const feedback = f.nextElementSibling;
        if (feedback && feedback.classList.contains('invalid-feedback')) {
            feedback.textContent = '';
        }
    });
}

// ─── Helpers ──────────────────────────────────────────────────────

function _applyFieldState(el, errorMsg) {
    if (errorMsg) {
        el.classList.remove('is-valid');
        el.classList.add('is-invalid');
        const feedback = _findOrCreateFeedback(el);
        if (feedback) feedback.textContent = errorMsg;
    } else {
        el.classList.remove('is-invalid');
        el.classList.add('is-valid');
        const feedback = _findOrCreateFeedback(el);
        if (feedback) feedback.textContent = '';
    }
}

function _findOrCreateFeedback(el) {
    let feedback = el.nextElementSibling;
    if (feedback && feedback.classList.contains('invalid-feedback')) return feedback;
    // Try sibling after a wrapper
    const parent = el.parentElement;
    if (parent) {
        feedback = parent.querySelector('.invalid-feedback');
        if (feedback) return feedback;
    }
    return null;
}

function _isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function _isValidUrl(value) {
    try {
        new URL(value);
        return true;
    } catch {
        return false;
    }
}
