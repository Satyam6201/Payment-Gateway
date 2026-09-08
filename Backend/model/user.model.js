import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const User = sequelize.define("User", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: true,
        },
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
        set(value) {
            this.setDataValue("email", value ? value.trim().toLowerCase() : value);
        },
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM("user", "admin"),
        defaultValue: "user",
        allowNull: false,
    },
}, {
    tableName: "users",
    timestamps: true,
});

// Expose safe user properties and _id for frontend compatibility
User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password; // Never expose password hashes in API responses
    if (values.id !== undefined) {
        values._id = String(values.id);
    }
    return values;
};

export default User;