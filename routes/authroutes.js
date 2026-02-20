import { registerUser, loginUser, logoutUser } from "../controllers/authcontrollers.js";

const authRoutes = (app) => {
    app.post("/api/auth/register", registerUser);
    app.post("/api/auth/login", loginUser);
    app.post("/api/auth/logout", logoutUser);
};

export default authRoutes;