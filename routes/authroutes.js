import { login, signup, logoutUser, PasswordReset, verifyOtpController, sendOtpController } from "../controllers/authcontrollers.js";
import express from "express";
import protect from "../middleware/authmiddleware.js";

const authrouter = express.Router();

authrouter.post("/signup", signup);
authrouter.post("/login", login);
authrouter.post("/logout", logoutUser);
authrouter.post("/password-reset", PasswordReset);
authrouter.post("/verify-otp", verifyOtpController);
authrouter.post("/send-otp", sendOtpController);
authrouter.get("/me", protect, (req, res) => {
    res.json({ user: req.user });
});

export default authrouter;