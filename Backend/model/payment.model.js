import { DataTypes } from "sequelize";
import crypto from "crypto";
import { sequelize } from "../config/db.js";
import User from "./user.model.js";

const Payment = sequelize.define("Payment", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: "id",
        },
    },
    userName: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0,
        },
    },
    currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: "usd",
        set(value) {
            this.setDataValue("currency", value ? value.trim().toLowerCase() : "usd");
        },
    },
    status: {
        type: DataTypes.ENUM("pending", "paid", "failed", "completed"),
        defaultValue: "paid",
        allowNull: false,
    },
    orderId: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: () => `order_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
    },
    stripeCheckoutSessionId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
        defaultValue: () => `direct_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`,
    },
    stripePaymentIntentId: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    paidAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    failureMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    tableName: "payments",
    timestamps: true,
    indexes: [
        { fields: ["userId"] },
        { fields: ["status"] },
    ],
});

// Relationships
User.hasMany(Payment, { foreignKey: "userId", as: "payments", onDelete: "CASCADE" });
Payment.belongsTo(User, { foreignKey: "userId", as: "user" });

// Expose _id and string userId for frontend compatibility
Payment.prototype.toJSON = function () {
    const values = { ...this.get() };
    if (values.id !== undefined) {
        values._id = String(values.id);
    }
    if (values.userId !== undefined && values.userId !== null) {
        values.userId = String(values.userId);
    }
    return values;
};

export default Payment;