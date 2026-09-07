import express from "express";
import { createPayment, getAllPayments, getUserPayments, placeOrderStripe, stripeWebhook } from "../controller/payment.js";

const paymentRouter = express.Router();

paymentRouter.post("/pay", createPayment);
paymentRouter.post("/stripe", placeOrderStripe);
paymentRouter.post("/webhook", stripeWebhook);
paymentRouter.get("/payments", getUserPayments);
paymentRouter.get("/all", getAllPayments);

export default paymentRouter;