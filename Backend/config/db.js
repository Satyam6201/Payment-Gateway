import { Sequelize } from "sequelize";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const dbHost = process.env.MYSQL_HOST || "localhost";
const dbPort = Number(process.env.MYSQL_PORT) || 3306;
const dbUser = process.env.MYSQL_USER || "root";
const dbPassword = process.env.MYSQL_PASSWORD || "";
const dbName = process.env.MYSQL_DATABASE || "payment_gateway";

// Sequelize instance
export const sequelize = process.env.MYSQL_URI
    ? new Sequelize(process.env.MYSQL_URI, {
        dialect: "mysql",
        logging: false,
    })
    : new Sequelize(dbName, dbUser, dbPassword, {
        host: dbHost,
        port: dbPort,
        dialect: "mysql",
        logging: false,
    });

// Auto-create database if not exists
const createDatabaseIfNotExists = async () => {
    if (process.env.MYSQL_URI) return;
    try {
        const connection = await mysql.createConnection({
            host: dbHost,
            port: dbPort,
            user: dbUser,
            password: dbPassword,
        });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await connection.end();
    } catch (err) {
        console.warn(`Database creation check skipped: ${err.message}`);
    }
};

// Seed default admin account
const ensureAdminUser = async () => {
    try {
        const { default: User } = await import("../model/user.model.js");
        const adminEmail = "satyam@gmail.com";
        const existing = await User.findOne({ where: { email: adminEmail } });

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

// Connect to MySQL and synchronize tables
const db = async () => {
    try {
        await createDatabaseIfNotExists();
        await sequelize.authenticate();
        console.log("MySQL is connected successfully!");

        // Load models and sync schema
        await import("../model/user.model.js");
        await import("../model/payment.model.js");

        await sequelize.sync({ alter: true });
        console.log("Database tables synchronized successfully.");

        await ensureAdminUser();
    } catch (error) {
        console.error(`MySQL connection error: ${error.message}`);
    }
};

export default db;