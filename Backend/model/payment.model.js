import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
        index: true,
    },
    userName: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        required: true,
        lowercase: true,
        default: "usd",
    },
    status: {
        type: String,
        enum: ["pending", "paid", "failed", "completed"],
        default: "paid",
        index: true,
    },
    orderId: {
        type: String,
        default: () => new mongoose.Types.ObjectId().toString(),
    },
    stripeCheckoutSessionId: {
        type: String,
        default: () => `direct_${new mongoose.Types.ObjectId()}`,
        unique: true,
        sparse: true,
    },
    stripePaymentIntentId: {
        type: String,
    },
    paidAt: {
        type: Date,
        default: Date.now,
    },
    failureMessage: String,
}, { timestamps: true });

const Payment = mongoose.models.payment || mongoose.model("payment", paymentSchema);

export default Payment;