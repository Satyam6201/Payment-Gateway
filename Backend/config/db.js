import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../model/user.model.js";

const ensureAdminUser = async () => {
    try {
        const adminEmail = "satyam@gmail.com";
        const existing = await User.findOne({ email: adminEmail });
        if (!existing) {
            const hashedPassword = await bcrypt.hash("Satyam@62", 10);
            await User.create({
                name: "Satyam Admin",
                email: adminEmail,
                password: hashedPassword,
                role: "admin",
            });
            console.log("Admin account initialized: satyam@gmail.com");
        } else if (existing.role !== "admin") {
            existing.role = "admin";
            await existing.save();
        }
    } catch (err) {
        console.error("Admin seed error:", err.message);
    }
};

const db = async () => {
    try {
        if (!process.env.MONGODB_URL) {
            throw new Error("MONGODB_URL environment variable is not defined");
        }
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("MongoDB is connected successfully!");
        await ensureAdminUser();
    } catch (error) {
        console.error(`MongoDB connection error: ${error.message}`);
    }
};

export default db;