import { registerUser as registerUserService, loginUser as loginUserService } from "../services/authservices.js";

export const registerUser = async (req, res) => {
    await registerUserService(req, res);
};

export const loginUser = async (req, res) => {
    await loginUserService(req, res);
};

export const logoutUser = async (req, res) => {
    // Clear token on client side; optionally add to blacklist on server
    res.json({ message: "Logged out successfully" });
};



