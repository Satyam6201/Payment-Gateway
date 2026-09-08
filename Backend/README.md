# ⚙️ Assignment Pay - Backend API Server

[![Node.js](https://img.shields.io/badge/Node.js-v18+-68A063?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-00758F?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Sequelize](https://img.shields.io/badge/Sequelize-6.x-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)](https://sequelize.org/)
[![Stripe](https://img.shields.io/badge/Stripe-API-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)

The backend REST API service for **Assignment Pay**. Built with **Express.js 5** (ES Modules) and **MySQL** via **Sequelize ORM**, providing robust authentication, payment processing with Stripe Checkout, automated database creation, and administrative analytics.

---

## 📑 Table of Contents

- [Overview](#overview)
- [Architecture & Database Design](#architecture--database-design)
- [Environment Configuration](#environment-configuration)
- [Installation & Startup](#installation--startup)
- [Stripe Checkout & Mock Fallback Logic](#stripe-checkout--mock-fallback-logic)
- [REST API Endpoints](#rest-api-endpoints)
- [Zero-Config Admin Seeding](#zero-config-admin-seeding)
- [Security & Middlewares](#security--middlewares)

---

## 🌟 Overview

- **Runtime**: Node.js `>= 18.x` (native ES Modules standard: `"type": "module"`).
- **Database**: MySQL 8.0+ using Sequelize ORM with connection pooling.
- **Payment Processing**: Stripe Checkout integration (`stripe@^22.6.1`) with raw-body cryptographic webhook support.
- **Smart Fallback**: Automatic mock simulation when live Stripe keys are absent or invalid (`mk_...` IDs), preventing 500 errors.
- **Authentication**: Salted password hashing with `bcryptjs` and stateless 7-day JWT tokens sent via HTTP-only cookies and JSON payloads.
- **Concise Messaging**: Short, standardized error and success messages across all endpoints.

---

## 🗄️ Architecture & Database Design

### Connection & Bootstrapping (`config/db.js`)
- Checks if the target database `payment_gateway` exists; creates it automatically if not.
- Initializes Sequelize with connection pooling:
  - `max: 10`, `min: 0`, `idle: 10000ms`, `acquire: 30000ms`.
- Executes `sequelize.sync({ alter: true })` to safely synchronize models.
- Automatically seeds the default administrator (`satyam@gmail.com` / `Satyam@62`) if not found.

### Models
1. **User (`model/user.model.js`)**:
   - Fields: `id`, `name`, `email` (unique, lowercase), `password` (bcrypt hash), `role` (`user` | `admin`).
   - `toJSON()` strips passwords and provides `_id: String(id)`.
2. **Payment (`model/payment.model.js`)**:
   - Fields: `id`, `userId`, `userName`, `amount`, `currency` (`usd` | `inr`), `status` (`pending`, `paid`, `failed`, `completed`), `orderId`, `stripeCheckoutSessionId`, `stripePaymentIntentId`, `paidAt`, `failureMessage`.
   - Indexed on `userId` and `status`.

---

## 🔐 Environment Configuration

Create a `.env` file in the `Backend` directory:

```env
# Server Port
PORT=8000

# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=payment_gateway

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Stripe Keys
# Secret keys start with sk_test_ or rk_test_
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Set to true to simulate Stripe checkouts locally
STRIPE_MOCK=false
```

---

## 🚀 Installation & Startup

```bash
# Install dependencies
npm install

# Run syntax check
npm run test:syntax   # or node -c server.js controller/*.js model/*.js config/*.js

# Start server in development mode (nodemon)
npm run dev

# Start server in production mode
npm start
```

---

## 💳 Stripe Checkout & Mock Fallback Logic

### Key Format Validation
Stripe secret keys must begin with `sk_test_` or `rk_test_`. If an API key identifier (starting with `mk_`) or an invalid key is provided:
1. `isRealStripeKey()` detects that live Stripe calls cannot be made.
2. The controller smoothly creates a `paid` transaction record in MySQL with a generated `cs_mock_...` session ID.
3. Responds with `{ success: true, url: ".../payment/success?session_id=..." }`.
4. This ensures frictionless local development without crashing or throwing internal server errors.

---

## 📡 REST API Endpoints

### User Routes (`/api/user`)
- `POST /api/user/register` - Register a new account (`name`, `email`, `password`).
- `POST /api/user/login` - Authenticate (`email`, `password`).
- `GET /api/user/logout` - Clear auth cookies.

### Payment & Order Routes (`/api/order` & `/api/payment`)
- `POST /api/order/stripe` - Create Stripe Checkout Session (`userId`, `userName`, `amount`, `currency`, `note`, `orderId`).
- `POST /api/order/pay` - Direct payment record creation.
- `GET /api/order/payments?userId=<id>` - Get transaction history for a customer.
- `GET /api/order/all?adminEmail=satyam@gmail.com` - Get all platform transactions (Admin only).
- `POST /api/order/webhook` - Stripe webhook receiver (requires `stripe-signature` header).

---

## 🔑 Zero-Config Admin Seeding

On startup, the server automatically executes:
```javascript
const defaultAdmin = await User.findOne({ where: { email: 'satyam@gmail.com' } });
if (!defaultAdmin) {
    const hashedPassword = await bcrypt.hash('Satyam@62', 10);
    await User.create({
        name: 'Satyam Admin',
        email: 'satyam@gmail.com',
        password: hashedPassword,
        role: 'admin',
    });
}
```

---

## 🔒 Security & Middlewares

1. **CORS**: Configured with origin whitelisting (`http://localhost:5173`, `http://localhost:5174`) and `credentials: true`.
2. **Raw Webhook Parser**: `express.raw({ type: "application/json" })` strictly precedes general JSON parser on `/api/order/webhook` and `/api/payment/webhook`.
3. **Centralized Error Handler**: Catches unhandled errors and returns `{ success: false, message: "Internal server error" }`.
