import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import db from "./config/db.js";
import userRouter from "./router/userRouter.js";
import paymentRouter from "./router/paymentRouter.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// CORS setup for local frontend clients
app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    credentials: true,
}));

// Stripe webhook requires raw body for cryptographic signature verification
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