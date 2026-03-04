import { registerUserService, loginUserService } from "../services/authservices.js";
import { saveOtpService, verifyOtpService, generateOtpService } from "../services/otpservices.js";
import { sendEmail } from "../sendEmail.js";
import User from "../models/user.js";
import bcrypt from "bcrypt";

const setAuthCookie = (res, token) => {
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
        httpOnly: true,
        sameSite: isProd ? "none" : "lax",
        secure: isProd,
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
};

export const login = async (req, res) => {
    try {
        const { user, token } = await loginUserService(req.body);
        setAuthCookie(res, token);
        res.json({ id: user._id, name: user.name, email: user.email, token });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const signup = async (req, res) => {
    try {
        const { user, token } = await registerUserService(req.body);
        setAuthCookie(res, token);
        res.status(201).json({ id: user._id, name: user.name, email: user.email, token });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const logoutUser = async (req, res) => {
    res.cookie("token", "", {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production",
        expires: new Date(0)
    });
    res.json({ message: "Logged out successfully" });
};

export const PasswordReset = async (req, res) => {
    try {
        const { email, newPassword, otp } = req.body;
        
        // If OTP and newPassword are provided, complete the reset
        if (otp && newPassword) {
            await verifyOtpService(email, otp);
            
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
            await user.save();
            
            return res.json({ message: "Password reset successful" });
        }
        
        // Otherwise, just send OTP for reset
        const otpCode = await generateOtpService();
        await saveOtpService(email, otpCode);
        await sendEmail(email, "Password Reset OTP", `Your OTP for password reset is: ${otpCode}`);
        res.json({ message: "OTP sent to email" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const verifyOtpController = async (req, res) => {
    try {
        const { name, email, password, otp } = req.body;
        await verifyOtpService(email, otp);
        const { user, token } = await registerUserService({ name, email, password });
        setAuthCookie(res, token);
        res.status(201).json({ id: user._id, name: user.name, email: user.email, token });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }   
};

export const sendOtpController = async (req, res) => {
    try {
        const { email } = req.body;
        const otp = await generateOtpService();
        await saveOtpService(email, otp);
        await sendEmail(email, "Your OTP Code", `Your OTP code is: ${otp}`);
        res.json({ message: "OTP sent to email" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

