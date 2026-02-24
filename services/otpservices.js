import OTP from "../models/otp.js";
import { isValidEmail, sanitizeEmail, isValidOTP } from "../utils/validation.js";

/**
 * Generate a secure 6-digit OTP
 */
export const generateOtpService = async () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Save OTP to database with expiration
 * Removes any existing OTPs for the email to prevent spam
 */
export const saveOtpService = async (email, otp) => {
    if (!email || !otp) {
        throw new Error("Email and OTP are required");
    }

    const sanitizedEmail = sanitizeEmail(email);
    
    if (!isValidEmail(sanitizedEmail)) {
        throw new Error("Invalid email format");
    }

    if (!isValidOTP(otp)) {
        throw new Error("Invalid OTP format");
    }

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email: sanitizedEmail });
    
    // OTP expires in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    const otpEntry = await OTP.create({ 
        email: sanitizedEmail, 
        otp, 
        expiresAt 
    });

    return otpEntry;
};

/**
 * Verify OTP for an email
 * Checks if OTP exists, is valid, and hasn't expired
 */
export const verifyOtpService = async (email, otp) => {
    if (!email || !otp) {
        throw new Error("Email and OTP are required");
    }

    const sanitizedEmail = sanitizeEmail(email);
    
    if (!isValidEmail(sanitizedEmail)) {
        throw new Error("Invalid email format");
    }

    if (!isValidOTP(otp)) {
        throw new Error("Invalid OTP format");
    }

    // Find OTP entry
    const otpEntry = await OTP.findOne({ 
        email: sanitizedEmail, 
        otp: otp.toString() 
    });

    if (!otpEntry) {
        throw new Error("Invalid or expired OTP");
    }

    // Check if OTP has expired
    if (otpEntry.expiresAt < new Date()) {
        await OTP.deleteOne({ _id: otpEntry._id });
        throw new Error("OTP has expired. Please request a new one");
    }

    // Delete the OTP after successful verification
    await OTP.deleteOne({ _id: otpEntry._id });
    
    return true;
};

