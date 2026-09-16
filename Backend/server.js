import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import db from "./config/db.js";
import userRouter from "./router/userRouter.js";
import paymentRouter from "./router/paymentRouter.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// CORS 
const allowedOrigins = [
    "https://payment-gateway-bice-theta.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
];

if (process.env.CLIENT_URL) {
    process.env.CLIENT_URL.split(",").forEach(url => {
        const trimmed = url.trim().replace(/\/$/, "");
        if (trimmed && !allowedOrigins.includes(trimmed)) {
            allowedOrigins.push(trimmed);
        }
    });
}

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin) return callback(null, true);
        if (
            allowedOrigins.includes(origin) ||
            origin.endsWith(".vercel.app") ||
            origin.includes("localhost") ||
            origin.includes("127.0.0.1")
        ) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
}));

app.use(["/api/order/webhook", "/api/payment/webhook"], express.raw({ type: "application/json" }));
app.use(express.json());

// API health check
app.get("/", (req, res) => {
    return res.status(200).json({ status: "ok", message: "Payment API is operational" });
});

// Application routes
app.use("/api/user", userRouter);
app.use("/api/order", paymentRouter);
app.use("/api/payment", paymentRouter);

// Centralized error handler
app.use((err, req, res, next) => {
    console.error("Internal Server Error:", err.stack || err);
    return res.status(500).json({ success: false, message: "Internal server error" });
});

// Bootstrap server
const startServer = async () => {
    try {
        await db();
        app.listen(PORT, () => {
            console.log(`API running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start server:", err.message);
        process.exit(1);
    }
};

startServer();