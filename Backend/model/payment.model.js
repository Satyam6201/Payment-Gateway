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
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0,
        },
    },
    currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: "usd",
        set(value) {
            this.setDataValue("currency", value ? value.trim().toLowerCase() : "usd");
        },
    },
    status: {
        type: DataTypes.ENUM("pending", "paid", "failed"),
        defaultValue: "pending",
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
    },
    paidAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    },
    failureMessage: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
}, {
    tableName: "payments",
    timestamps: true,
    indexes: [
        { fields: ["orderId"] },
        { fields: ["status"] },
    ],
});

// Relationships
User.hasMany(Payment, { foreignKey: "userId", as: "payments", onDelete: "CASCADE" });
Payment.belongsTo(User, { foreignKey: "userId", as: "user" });

// Expose _id, string userId, and userName for frontend compatibility
Payment.prototype.toJSON = function () {
    const values = { ...this.get() };
    if (values.id !== undefined) {
        values._id = String(values.id);
    }
    if (values.userId !== undefined && values.userId !== null) {
        values.userId = String(values.userId);
    }
    if (!values.userName && values.user?.name) {
        values.userName = values.user.name;
    }
    return values;
};

export default Payment;