import { registerUserService, loginUserService } from "../services/authservices.js";
import { saveOtpService, verifyOtpService, generateOtpService } from "../services/otpservices.js";
import { sendEmail } from "../sendEmail.js";

export const login = async (req, res) => {
    try {
        const {user , token} = await loginUserService(req.body);
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: 'lax'
        });
        res.json({ id: user._id, name: user.name, email: user.email });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const signup = async (req, res) => {
    try {
        const { user, token } = await registerUserService(req.body);
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: 'lax'
        });
        res.status(201).json({ id: user._id, name: user.name, email: user.email });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const logoutUser = async (req, res) => {
    res.cookie("token", "", {
        httpOnly: true,
        sameSite: 'lax',
        expires: new Date(0)
    });
    res.json({ message: "Logged out successfully" });
};

export const PasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        const otp = await generateOtpService();
        await saveOtpService(email, otp);
        await sendEmail(email, "Password Reset OTP", `Your OTP for password reset is: ${otp}`);
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
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: 'lax'
        });
        res.status(201).json({ id: user._id, name: user.name, email: user.email });
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

