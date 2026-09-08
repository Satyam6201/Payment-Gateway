import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../model/user.model.js";

const ADMIN_EMAIL = "satyam@gmail.com";

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

const createAuthToken = (userId, role = "user") => {
    return jwt.sign(
        { id: userId, role },
        process.env.JWT_SECRET || "default_jwt_secret",
        { expiresIn: "7d" }
    );
};

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await User.findOne({ where: { email: normalizedEmail } });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "A user with this email already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const role = normalizedEmail === ADMIN_EMAIL ? "admin" : "user";

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role,
        });

        const token = createAuthToken(user.id, user.role);
        res.cookie("token", token, COOKIE_OPTIONS);

        return res.status(201).json({
            success: true,
            user: { id: user.id, _id: String(user.id), email: user.email, name: user.name, role: user.role },
            token,
        });
    } catch (error) {
        console.error("Registration error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error during registration",
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ where: { email: normalizedEmail } });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const effectiveRole = user.role || (normalizedEmail === ADMIN_EMAIL ? "admin" : "user");
        const token = createAuthToken(user.id, effectiveRole);
        res.cookie("token", token, COOKIE_OPTIONS);

        return res.json({
            success: true,
            user: { id: user.id, _id: String(user.id), email: user.email, name: user.name, role: effectiveRole },
            token,
        });
    } catch (error) {
        console.error("Login error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error during login",
        });
    }
};

export const logout = async (req, res) => {
    try {
        res.clearCookie("token", COOKIE_OPTIONS);
        return res.json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error) {
        console.error("Logout error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error during logout",
        });
    }
};