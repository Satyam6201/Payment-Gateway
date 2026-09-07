import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import db from "./config/db.js";
import userRouter from "./router/userRouter.js";
import paymentRouter from "./router/paymentRouter.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware cors
app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    credentials: true,
}));

// Stripe  raw body before JSON parser
app.use(["/api/order/webhook", "/api/payment/webhook"], express.raw({ type: "application/json" }));
app.use(express.json());

// Healthcheck endpoint
app.get("/", (req, res) => {
    return res.status(200).json({ status: "ok", message: "Assignment Payment API is running" });
});

//  Routes
app.use("/api/user", userRouter);
app.use("/api/order", paymentRouter);
app.use("/api/payment", paymentRouter);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Unhandled server error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
});

// Connect to Database 
await db();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});