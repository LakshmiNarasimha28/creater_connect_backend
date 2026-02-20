import OTP from "../models/otp.js";

export const createOTP = async (email, otp) => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
export const saveOTP = async (email, otp) => {
    await OTP.deleteMany({email,});
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes
    const otpEntry = await OTP.create({ email, otp, expiresAt });
    // return otpEntry;
}

export const verifyOTP = async (email, otp) => {
    const otpEntry = await OTP.findOne({ email, otp });
    if (!otpEntry) {
        throw new Error("Invalid OTP");
    }
    if (otpEntry.expiresAt < new Date()) {
        await OTP.deleteOne({ _id: otpEntry._id });
        throw new Error("OTP expired");
    }
    await OTP.deleteOne({ _id: otpEntry._id });
    return true; // OTP is valid
}

