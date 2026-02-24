/**
 * Validation utilities for input data
 */

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password requirements: min 6 chars
const passwordRegex = /^.{6,}$/;

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') {
        return false;
    }
    return emailRegex.test(email.trim());
};

/**
 * Validate password strength
 */
export const isValidPassword = (password) => {
    if (!password || typeof password !== 'string') {
        return false;
    }
    return passwordRegex.test(password);
};

/**
 * Validate name (non-empty string, 2-50 chars)
 */
export const isValidName = (name) => {
    if (!name || typeof name !== 'string') {
        return false;
    }
    const trimmedName = name.trim();
    return trimmedName.length >= 2 && trimmedName.length <= 50;
};

/**
 * Sanitize email (trim and lowercase)
 */
export const sanitizeEmail = (email) => {
    if (!email || typeof email !== 'string') {
        return '';
    }
    return email.trim().toLowerCase();
};

/**
 * Sanitize name (trim and remove extra spaces)
 */
export const sanitizeName = (name) => {
    if (!name || typeof name !== 'string') {
        return '';
    }
    return name.trim().replace(/\s+/g, ' ');
};

/**
 * Validate OTP (6 digits)
 */
export const isValidOTP = (otp) => {
    if (!otp) return false;
    const otpString = String(otp);
    return /^\d{6}$/.test(otpString);
};
