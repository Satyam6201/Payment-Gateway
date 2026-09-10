import Payment from "../model/payment.model.js";
import User from "../model/user.model.js";
import stripe from "stripe";
import crypto from "crypto";

const isRealStripeKey = () => {
    const key = (process.env.STRIPE_SECRET_KEY || "").trim();
    return (key.startsWith("sk_") || key.startsWith("rk_")) && process.env.STRIPE_MOCK !== "true";
};

const getStripeClient = () => {
    const key = (process.env.STRIPE_SECRET_KEY || "").trim();
    if (!key) {
        throw new Error("Stripe secret key missing");
    }

    if (key.startsWith("mk_")) {
        throw new Error("Invalid key: 'mk_' is an ID, not a secret key. Use 'sk_test_'");
    }

    if (!key.startsWith("sk_") && !key.startsWith("rk_") && key !== "mock") {
        throw new Error("Invalid key: Must start with 'sk_' or 'rk_'");
    }

    return new stripe(key);
};

export const createPayment = async (req, res) => {
    try {
        const userId = req.userId || req.body?.userId;
        const userName = req.body?.userName || req.userName;
        const { amount, currency = "usd" } = req.body || {};

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID required",
            });
        }

        const numericUserId = Number(userId);
        if (!numericUserId || isNaN(numericUserId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID",
            });
        }

        const targetUser = await User.findByPk(numericUserId);
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const numericAmount = Number(amount);
        if (!numericAmount || numericAmount <= 0 || isNaN(numericAmount)) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid amount",
            });
        }

        const payment = await Payment.create({
            userId: numericUserId,
            amount: numericAmount,
            currency: currency.toLowerCase().trim(),
            status: "paid",
            paidAt: new Date(),
        });
        payment.dataValues.user = targetUser;

        return res.status(201).json({
            success: true,
            message: "Payment recorded successfully",
            payment,
        });
    } catch (error) {
        console.error("createPayment error:", error.message);
        return res.status(500).json({ success: false, message: "Payment processing failed" });
    }
};

export const placeOrderStripe = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId;
        const { orderId, amount, currency = "usd" } = req.body;

        const numericUserId = Number(userId);
        if (!numericUserId || isNaN(numericUserId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID",
            });
        }

        const targetUser = await User.findByPk(numericUserId);
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const customerName = req.body.userName || targetUser.name || "Customer";

        const numericAmount = Number(amount);
        if (!numericAmount || numericAmount <= 0 || isNaN(numericAmount)) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid amount",
            });
        }

        const normalizedCurrency = currency.toLowerCase().trim();
        const safeOrderId = orderId || `order_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

        // Local fallback when real Stripe is not configured
        if (!isRealStripeKey()) {
            const origin = req.headers.origin || "http://localhost:5173";
            const mockSessionId = `cs_mock_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
            const payment = await Payment.create({
                userId: numericUserId,
                orderId: safeOrderId,
                amount: numericAmount,
                currency: normalizedCurrency,
                stripeCheckoutSessionId: mockSessionId,
                status: "paid",
                paidAt: new Date(),
            });
            payment.dataValues.user = targetUser;

            return res.json({
                success: true,
                url: `${origin}/payment/success?session_id=${mockSessionId}`,
                payment,
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

        const session = await stripeInstance.checkout.sessions.create({
            mode: "payment",
            line_items: [
                {
                    price_data: {
                        currency: normalizedCurrency,
                        product_data: { name: `Payment from ${customerName}` },
                        unit_amount: Math.round(numericAmount * 100),
                    },
                    quantity: 1,
                },
            ],
            success_url: `${req.headers.origin || "http://localhost:5173"}/payment/success`,
            cancel_url: `${req.headers.origin || "http://localhost:5173"}/payment/cancel`,
            metadata: {
                userId: numericUserId.toString(),
                userName: customerName,
                orderId: safeOrderId,
            },
        });

        const payment = await Payment.create({
            userId: numericUserId,
            orderId: safeOrderId,
            amount: numericAmount,
            currency: normalizedCurrency,
            stripeCheckoutSessionId: session.id,
            status: "pending",
        });
        payment.dataValues.user = targetUser;

        return res.json({ success: true, url: session.url, payment });
    } catch (error) {
        console.error("placeOrderStripe error:", error.message);
        return res.status(500).json({ success: false, message: error.message || "Checkout failed" });
    }
};

export const stripeWebhook = async (req, res) => {
    let stripeInstance;
    try {
        stripeInstance = getStripeClient();
    } catch {
        return res.status(500).send("Stripe not configured");
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
        return res.status(400).send(`Webhook signature failed: ${error.message}`);
    }

    const session = event.data.object;

    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
        await Payment.update(
            {
                status: "paid",
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
            return res.status(400).json({ success: false, message: "User ID required" });
        }

        const numericUserId = Number(userId);
        if (!numericUserId || isNaN(numericUserId)) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }

        const payments = await Payment.findAll({
            where: { userId: numericUserId },
            include: [{ model: User, as: "user", attributes: ["name", "email"] }],
            order: [["createdAt", "DESC"]],
        });

        return res.json({ success: true, count: payments.length, payments });
    } catch (error) {
        console.error("getUserPayments error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to fetch payments" });
    }
};

export const getAllPayments = async (req, res) => {
    try {
        const requesterEmail = req.query?.adminEmail || req.headers?.["x-admin-email"];

        if (!requesterEmail || requesterEmail.trim().toLowerCase() !== "satyam@gmail.com") {
            return res.status(403).json({
                success: false,
                message: "Access denied",
            });
        }

        const payments = await Payment.findAll({
            include: [{ model: User, as: "user", attributes: ["name", "email"] }],
            order: [["createdAt", "DESC"]],
        });

        return res.json({ success: true, count: payments.length, payments });
    } catch (error) {
        console.error("getAllPayments error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to fetch payments" });
    }
};