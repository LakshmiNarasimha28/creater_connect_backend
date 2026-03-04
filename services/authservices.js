import User from "../models/user.js";
import bcrypt from "bcrypt";
import generateToken from "../utils/generatetoken.js";
import { isValidEmail, isValidPassword, isValidName, sanitizeEmail, sanitizeName } from "../utils/validation.js";

export const registerUserService = async ({ name, email, password }) => {
    // Validate required fields
    if (!name || !email || !password) {
        throw new Error("Name, email, and password are required");
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedName = sanitizeName(name);

    // Validate email format
    if (!isValidEmail(sanitizedEmail)) {
        throw new Error("Invalid email format");
    }

    // Validate name
    if (!isValidName(sanitizedName)) {
        throw new Error("Name must be between 2 and 50 characters");
    }

    // Validate password strength
    if (!isValidPassword(password)) {
        throw new Error("Password must be at least 6 characters long");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: sanitizedEmail }).lean();
    if (existingUser) {
        throw new Error("User already exists with this email");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
        name: sanitizedName,
        email: sanitizedEmail,
        password: hashedPassword
    });
    await newUser.save();

    const token = generateToken(newUser);
    return { user: newUser, token };
};

export const loginUserService = async ({ email, password }) => {
    // Validate required fields
    if (!email || !password) {
        throw new Error("Email and password are required");
    }

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email);

    // Validate email format
    if (!isValidEmail(sanitizedEmail)) {
        throw new Error("Invalid email format");
    }

    // Find user
    const user = await User.findOne({ email: sanitizedEmail }).lean();
    if (!user) {
        throw new Error("Invalid email or password");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error("Invalid email or password");
    }

    const token = generateToken(user);
    return { user, token };
};

