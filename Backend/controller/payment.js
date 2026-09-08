import Payment from "../model/payment.model.js";
import User from "../model/user.model.js";
import stripe from "stripe";
import crypto from "crypto";

const getStripeClient = () => {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("STRIPE_SECRET_KEY is not configured on this server");
    }
    return new stripe(process.env.STRIPE_SECRET_KEY);
};

export const createPayment = async (req, res) => {
    try {
        const userId = req.userId || req.body?.userId;
        const userName = req.body?.userName || req.userName;
        const { amount, currency = "usd" } = req.body || {};

        if (!userId || !userName) {
            return res.status(400).json({
                success: false,
                message: "User ID and User Name are required to record a payment.",
            });
        }

        const numericUserId = Number(userId);
        if (!numericUserId || isNaN(numericUserId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid User ID format.",
            });
        }

        // Verify user exists in database to prevent foreign key errors
        const targetUser = await User.findByPk(numericUserId);
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "User account not found. Please log in again.",
            });
        }

        const numericAmount = Number(amount);
        if (!numericAmount || numericAmount <= 0 || isNaN(numericAmount)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid positive payment amount.",
            });
        }

        const payment = await Payment.create({
            userId: numericUserId,
            userName: userName.trim(),
            amount: numericAmount,
            currency: currency.toLowerCase().trim(),
            status: "paid",
            paidAt: new Date(),
        });

        return res.status(201).json({
            success: true,
            message: `Payment of ${currency.toUpperCase()} ${numericAmount} successfully recorded.`,
            payment,
        });
    } catch (error) {
        console.error("createPayment error:", error.message);
        return res.status(500).json({ success: false, message: "Internal error processing payment." });
    }
};

export const placeOrderStripe = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId;
        const userName = req.body.userName || "Customer";
        const { orderId, amount, currency = "usd" } = req.body;

        const numericUserId = Number(userId);
        if (!numericUserId || isNaN(numericUserId)) {
            return res.status(400).json({
                success: false,
                message: "Valid User ID is required.",
            });
        }

        const targetUser = await User.findByPk(numericUserId);
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "User account not found.",
            });
        }

        const numericAmount = Number(amount);
        if (!numericAmount || numericAmount <= 0 || isNaN(numericAmount)) {
            return res.status(400).json({
                success: false,
                message: "A valid positive transfer amount is required.",
            });
        }

        let stripeInstance;
        try {
            stripeInstance = getStripeClient();
        } catch (configError) {
            return res.status(500).json({
                success: false,
                message: configError.message,
            });
        }

        const normalizedCurrency = currency.toLowerCase().trim();
        const safeOrderId = orderId || `order_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

        const session = await stripeInstance.checkout.sessions.create({
            mode: "payment",
            line_items: [
                {
                    price_data: {
                        currency: normalizedCurrency,
                        product_data: { name: `Payment from ${userName}` },
                        unit_amount: Math.round(numericAmount * 100),
                    },
                    quantity: 1,
                },
            ],
            success_url: `${req.headers.origin || "http://localhost:5173"}/payment/success`,
            cancel_url: `${req.headers.origin || "http://localhost:5173"}/payment/cancel`,
            metadata: {
                userId: numericUserId.toString(),
                userName,
                orderId: safeOrderId,
            },
        });

        const payment = await Payment.create({
            userId: numericUserId,
            userName: userName.trim(),
            orderId: safeOrderId,
            amount: numericAmount,
            currency: normalizedCurrency,
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
            status: "pending",
        });

        return res.json({ success: true, url: session.url, payment });
    } catch (error) {
        console.error("placeOrderStripe error:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const stripeWebhook = async (req, res) => {
    let stripeInstance;
    try {
        stripeInstance = getStripeClient();
    } catch {
        return res.status(500).send("Stripe is not configured");
    }

    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = stripeInstance.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        return res.status(400).send(`Webhook signature verification failed: ${error.message}`);
    }

    const session = event.data.object;

    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
        await Payment.update(
            {
                status: "paid",
                stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
                paidAt: new Date(),
            },
            {
                where: { stripeCheckoutSessionId: session.id },
            }
        );
    } else if (event.type === "checkout.session.async_payment_failed" || event.type === "checkout.session.expired") {
        await Payment.update(
            {
                status: "failed",
                stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
                failureMessage: session.last_payment_error?.message || "Payment failed or session expired",
            },
            {
                where: { stripeCheckoutSessionId: session.id },
            }
        );
    }

    return res.json({ received: true });
};

export const getUserPayments = async (req, res) => {
    try {
        const userId = req.userId || req.query?.userId || req.body?.userId;

        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        const numericUserId = Number(userId);
        if (!numericUserId || isNaN(numericUserId)) {
            return res.status(400).json({ success: false, message: "Invalid User ID format." });
        }

        const payments = await Payment.findAll({
            where: { userId: numericUserId },
            order: [["createdAt", "DESC"]],
        });

        return res.json({ success: true, count: payments.length, payments });
    } catch (error) {
        console.error("getUserPayments error:", error.message);
        return res.status(500).json({ success: false, message: "Error retrieving user payments." });
    }
};

export const getAllPayments = async (req, res) => {
    try {
        const requesterEmail = req.query?.adminEmail || req.headers?.["x-admin-email"];

        if (!requesterEmail || requesterEmail.trim().toLowerCase() !== "satyam@gmail.com") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only satyam@gmail.com can view all payment transactions.",
            });
        }

        const payments = await Payment.findAll({
            order: [["createdAt", "DESC"]],
        });

        return res.json({ success: true, count: payments.length, payments });
    } catch (error) {
        console.error("getAllPayments error:", error.message);
        return res.status(500).json({ success: false, message: "Error retrieving all payments." });
    }
};