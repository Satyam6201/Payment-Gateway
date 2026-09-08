# 💳 Assignment Pay - Payment Gateway & Transaction Management System

[![Node.js](https://img.shields.io/badge/Node.js-v18+-68A063?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-00758F?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Stripe](https://img.shields.io/badge/Stripe-API-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)
[![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](LICENSE)

A full-stack modern payment processing, transaction history tracking, and administrator analytics platform. Built with a decoupled **Express.js / MySQL** backend and a responsive **React 19 / Vite** frontend, featuring both simulated instant payments and live **Stripe Checkout** session integration with asynchronous webhook verification.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Prerequisites](#-prerequisites)
- [Environment Variables](#-environment-variables)
- [Getting Started & Installation](#-getting-started--installation)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
- [Default Demo Credentials](#-default-demo-credentials)
- [REST API Reference](#-rest-api-reference)
  - [Health Check](#health-check)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Payment & Order Endpoints](#payment--order-endpoints)
- [Stripe Integration & Webhook Testing](#-stripe-integration--webhook-testing)
- [Security & Architecture Highlights](#-security--architecture-highlights)
- [Troubleshooting](#-troubleshooting)
- [Author & License](#-author--license)

---

## 🌟 Overview

**Assignment Pay** addresses the core requirements of modern e-commerce payment infrastructure:
1. **User Authentication & Session Management**: Secure user onboarding, login, password encryption via bcrypt, and JSON Web Token (JWT) state management with HTTP-only cookies.
2. **Flexible Payment Processing**:
   - **Direct Payments**: Instant order recording for direct debit / simulated payments with preset shortcuts and custom values.
   - **Stripe Hosted Checkout**: Dynamic session generation with unit conversions (`cents`), customer metadata tagging, and redirect handlers.
3. **Webhook Lifecycle Handling**: Handles asynchronous Stripe notifications (`checkout.session.completed`, `async_payment_succeeded`, `async_payment_failed`, `expired`) with cryptographic signature validation.
4. **User Transaction Log**: Real-time listing of customer purchases with status chips, timestamps, and order identifiers.
5. **Administrative Dashboard**: Role-protected analytics panel with platform-wide revenue calculations, total order volume metrics, and real-time multi-attribute search filtering.

---

## 🏛 System Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend (React 19 + Vite)"]
        UI[User Interface]
        AuthView[Auth: Sign In / Register]
        PayView[Payment Portal: Presets & Custom Input]
        HistoryView[User Transactions: My Payments]
        AdminView[Admin Panel: Analytics & Search]
    end

    subgraph Server["Backend API (Express.js 5)"]
        Router[Express Routers: /api/user, /api/order, /api/payment]
        AuthCtrl[User Controller: JWT + Bcrypt]
        PayCtrl[Payment Controller]
        WebhookHandler[Stripe Webhook Listener]
        AutoSeed[Admin Auto-Seeder: db.js]
    end

    subgraph External["External Services & Storage"]
        MySQL[(MySQL Database)]
        StripeGateway[Stripe Checkout API]
    end

    UI --> AuthView & PayView & HistoryView & AdminView

    AuthView -->|POST /api/user/login, /register| AuthCtrl
    PayView -->|POST /api/order/pay| PayCtrl
    PayView -->|POST /api/order/stripe| PayCtrl
    HistoryView -->|GET /api/order/payments?userId=...| PayCtrl
    AdminView -->|GET /api/order/all?adminEmail=...| PayCtrl

    AuthCtrl -->|Verify & Store User| MySQL
    PayCtrl -->|Create / Fetch Orders| MySQL
    PayCtrl -->|Create Checkout Session| StripeGateway
    StripeGateway -->|Customer Completes Payment| StripeGateway
    StripeGateway -->|POST /api/order/webhook| WebhookHandler
    WebhookHandler -->|Update Order Status: paid / failed| MySQL

    Server -.->|On Boot Connection| AutoSeed
    AutoSeed -.->|Ensure admin user exists| MySQL
```

---

## ✨ Key Features

### 👤 1. Authentication & Role-Based Access Control (RBAC)
- **Email Normalization & Password Hashing**: Passwords stored using `bcryptjs` with 10 salt rounds.
- **JWT Authorization**: Emits JSON Web Tokens with a 7-day expiration lifespan, saved in client state and passed as HTTP-only cookies.
- **Auto Admin Promotion**: Any registration matching the designated administrator email (`satyam@gmail.com`) automatically receives the `admin` role.
- **One-Click Demo Login**: Convenient "Autofill" button on the sign-in screen to quickly test with preconfigured administrative credentials.

### 💳 2. Payment Checkout Flow
- **Quick Presets**: Single-click buttons for frequent denominations (\$20, \$50, \$60, \$100).
- **Custom Denominations**: Number input with decimal/float validation.
- **Direct Processing Route**: `/api/order/pay` immediately stores successful transaction records into MySQL.
- **Stripe Checkout Route**: `/api/order/stripe` provisions a Stripe Checkout Session with product metadata, sets payment status to `pending`, and provides a redirection URL.

### 🔔 3. Webhook Synchronization
- **Endpoint**: `/api/order/webhook` (and `/api/payment/webhook`).
- **Raw Body Preservation**: Configured with `express.raw({ type: "application/json" })` strictly before general JSON parsing to ensure cryptographic signature check validity (`stripe.webhooks.constructEvent`).
- **Event Reconciliation**: Automatically transitions payment states:
  - `checkout.session.completed` / `async_payment_succeeded` &rarr; `paid` + records `stripePaymentIntentId` and `paidAt`.
  - `checkout.session.async_payment_failed` / `expired` &rarr; `failed` + stores specific Stripe error message.

### 📊 4. Personal History ("My Payments")
- Dedicated interface displaying user-specific payment logs.
- Color-coded badges for statuses: `paid` (green), `pending` (yellow), `failed` (red), and `completed` (green).
- Formatted local timestamps and database IDs.
- Manual "Refresh" button for real-time synchronization.

### 🛡️ 5. Admin Portal & Analytics
- **Strict Guarding**: Access granted only to users matching `satyam@gmail.com` (verified on client tab and validated in backend controller via header and query verification).
- **Executive KPIs**:
  - **Total Platform Revenue**: Dynamically calculated across all verified `paid` and `completed` transactions.
  - **Total Transaction Count**: Comprehensive count of orders in system.
- **Live Search & Filter**: Real-time multi-column filter matching across:
  - Customer Full Name
  - User ID
  - Payment Transaction ID

### ⚡ 6. Zero-Config Database Seeding
- On every server start, `config/db.js` verifies whether the default administrative account (`satyam@gmail.com`) exists in the MySQL database.
- If missing, it automatically seeds the account with a securely hashed default password (`Satyam@62`) and assigns the `admin` role.

---

## 💻 Technology Stack

### Frontend
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **React** | `^19.2.8` | Declarative component-based UI framework |
| **ReactDOM** | `^19.2.8` | React DOM renderer |
| **Vite** | `^8.2.2` | High-performance build tool and local dev server |
| **ESLint** | `^10.9.0` | Code quality and React Hooks rules linting |
| **CSS3** | Modern CSS | Modular responsive layouts, flexbox, and grid styling |

### Backend
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | `>= 18.x` | JavaScript runtime environment (ES Module standard) |
| **Express** | `^5.2.1` | REST API routing and middleware framework |
| **Sequelize** | `^6.37.8` | Relational ORM for MySQL with auto-sync and migrations |
| **mysql2** | `^3.24.4` | High-performance MySQL driver with connection pooling |
| **bcryptjs** | `^3.0.3` | Salted password hashing algorithm |
| **jsonwebtoken** | `^9.0.3` | JWT issuance and verification |
| **stripe** | `^22.6.1` | Official Node.js Stripe SDK for checkout & webhooks |
| **cors** | `^2.8.6` | Cross-Origin Resource Sharing middleware |
| **dotenv** | `^17.4.2` | Environment variable loader |
| **nodemon** | `^3.1.14` | Development auto-restart monitor |

---

## 📂 Project Directory Structure

```text
Payment-Gateway/
├── .gitignore                      # Git ignored files (node_modules, .env, logs)
├── README.md                       # Comprehensive project documentation
│
├── Backend/                        # Node.js + Express REST API Server
│   ├── config/
│   │   └── db.js                   # MySQL connection, auto-sync & admin auto-seeding logic
│   ├── controller/
│   │   ├── payment.js              # Payment handling, Stripe checkout, webhooks & queries
│   │   └── user.js                 # Authentication controllers (register, login, logout)
│   ├── model/
│   │   ├── payment.model.js        # Sequelize schema for transaction records
│   │   └── user.model.js           # Sequelize schema for registered users
│   ├── router/
│   │   ├── paymentRouter.js        # /api/order and /api/payment endpoints
│   │   └── userRouter.js           # /api/user authentication endpoints
│   ├── .env.example                # Backend environment variable template
│   ├── package.json                # Express dependencies and scripts
│   ├── schema.sql                  # Direct MySQL DDL schema definitions
│   └── server.js                   # Main application entry point & middleware pipeline
│
└── Frontend/                       # React 19 + Vite Single Page Application (SPA)
    ├── public/
    │   ├── favicon.svg             # Website favicon
    │   ├── icons.svg               # Web icons
    │   └── images.png              # Brand icon asset
    ├── src/
    │   ├── assets/
    │   │   ├── hero.png            # Hero banner asset
    │   │   ├── react.svg           # React icon
    │   │   └── vite.svg            # Vite icon
    │   ├── components/
    │   │   ├── AdminPanel.jsx      # Admin analytics, total revenue, filterable table
    │   │   ├── AuthPage.jsx        # Login / Register forms with admin autofill
    │   │   ├── MyPaymentsPage.jsx  # User's personal order history table
    │   │   ├── Navbar.jsx          # Top navigation bar with active tab & user profile
    │   │   └── PayPage.jsx         # Payment portal with quick presets & custom amount
    │   ├── api.js                  # Frontend configuration for API URL & admin email
    │   ├── App.css                 # Complete UI style system & responsiveness
    │   ├── App.jsx                 # Root component with auth guard & tab routing
    │   ├── index.css               # Base CSS resets
    │   └── main.jsx                # React DOM root mounting
    ├── .env.example                # Frontend environment variable template
    ├── eslint.config.js            # ESLint rules configuration
    ├── index.html                  # HTML entry point
    ├── package.json                # Frontend dependencies and Vite scripts
    └── vite.config.js              # Vite bundler configuration
```

---

## ⚙️ Prerequisites

Ensure you have the following installed on your local machine:
- **Node.js**: `v18.0.0` or higher ([Download](https://nodejs.org/))
- **npm**: `v9.0.0` or higher (bundled with Node.js)
- **MySQL**: MySQL 8.0+ server (local installation, XAMPP, Docker, or cloud instance).
- *(Optional)* **Stripe Account**: For live Stripe Checkout and webhook testing ([Sign up](https://stripe.com)).

---

## 🔐 Environment Variables

### Backend Configuration (`Backend/.env`)

Create a file named `.env` in the `Backend` directory:

```env
# Port on which the Express server listens
PORT=8000

# MySQL Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=payment_gateway

# Alternatively, provide a full MySQL connection URI:
# MYSQL_URI=mysql://root:password@localhost:3306/payment_gateway

# Secret key used for signing JWT tokens
JWT_SECRET=your_jwt_secret_key_here

# (Optional for direct payments; required for Stripe Checkout)
STRIPE_SECRET_KEY=sk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Frontend Configuration (`Frontend/.env`)

Create a file named `.env` in the `Frontend` directory:

```env
# Base URL for the Backend API
VITE_API_URL=http://localhost:8000

# Email recognized by the frontend and backend as platform administrator
VITE_ADMIN_EMAIL=satyam@gmail.com
```

---

## 🚀 Getting Started & Installation

### 1. Backend Setup

1. Open a terminal and navigate to the `Backend` directory:
   ```bash
   cd Backend
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Configure your environment variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Populate `MYSQL_USER`, `MYSQL_PASSWORD`, and `JWT_SECRET`.

4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server will start on `http://localhost:8000`, automatically create the database if needed, synchronize tables, and seed the default admin account.*

---

### 2. Frontend Setup

1. Open a second terminal and navigate to the `Frontend` directory:
   ```bash
   cd Frontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Ensure `VITE_API_URL` is pointing to `http://localhost:8000`.

4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The application will be accessible at `http://localhost:5173`.*

---

## 🔑 Default Demo Credentials

The backend automatically bootstraps an administrative user upon database connection:

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `satyam@gmail.com` | `Satyam@62` | Full access to Pay, My Payments, and **Admin Panel** (Global Transactions & Revenue Analytics) |
| **Regular User** | *Any email via Register* | *User password* | Access to Pay and My Payments only |

> **💡 Quick Tip**: On the frontend login screen, click the **"Autofill (satyam@gmail.com)"** button to immediately fill the admin credentials.

---

## 📡 REST API Reference

Base URL: `http://localhost:8000`

### Health Check

#### `GET /`
Returns the operational status of the server.
- **Response `200 OK`**:
  ```json
  {
    "status": "ok",
    "message": "Assignment Payment API is running"
  }
  ```

---

### Authentication Endpoints

Mounted at `/api/user`:

#### `POST /api/user/register`
Registers a new user or admin.
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "user": {
      "id": "66db53a8123...",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "token": "eyJhbGciOi..."
  }
  ```
- **Error Codes**: `400` (Missing fields), `409` (Email already registered), `500` (Server error).

#### `POST /api/user/login`
Authenticates an existing user.
- **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "Password123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "user": {
      "id": "66db53a8123...",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "token": "eyJhbGciOi..."
  }
  ```
- **Error Codes**: `400` (Missing credentials), `401` (Invalid email or password).

#### `GET /api/user/logout`
Clears the authentication cookie.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

---

### Payment & Order Endpoints

Mounted at `/api/order` (and aliased at `/api/payment`):

#### `POST /api/order/pay`
Records an instant/direct payment.
- **Request Body**:
  ```json
  {
    "userId": "66db53a8123...",
    "userName": "John Doe",
    "amount": 50,
    "currency": "usd"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "message": "Payment of $50 successfully recorded.",
    "payment": {
      "_id": "66db54b9456...",
      "userId": "66db53a8123...",
      "userName": "John Doe",
      "amount": 50,
      "currency": "usd",
      "status": "paid",
      "paidAt": "2026-09-07T11:30:00.000Z"
    }
  }
  ```

#### `POST /api/order/stripe`
Creates a Stripe Checkout Session and initializes a `pending` payment record.
- **Request Body**:
  ```json
  {
    "userId": "66db53a8123...",
    "userName": "John Doe",
    "amount": 100,
    "currency": "usd",
    "orderId": "ORD-12345"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "url": "https://checkout.stripe.com/c/pay/cs_test_...",
    "payment": {
      "_id": "66db55c1789...",
      "status": "pending",
      "stripeCheckoutSessionId": "cs_test_...",
      "amount": 100
    }
  }
  ```

#### `POST /api/order/webhook`
Handles asynchronous Stripe events. Requires raw body and `stripe-signature` header.
- **Header**: `stripe-signature: t=...,v1=...`
- **Supported Events**:
  - `checkout.session.completed` &rarr; Marks payment as `paid`.
  - `checkout.session.async_payment_succeeded` &rarr; Marks payment as `paid`.
  - `checkout.session.async_payment_failed` &rarr; Marks payment as `failed`.
  - `checkout.session.expired` &rarr; Marks payment as `failed`.
- **Response `200 OK`**:
  ```json
  { "received": true }
  ```

#### `GET /api/order/payments`
Fetches transaction history for a specific customer.
- **Query Parameter**: `userId=<userId>`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "count": 2,
    "payments": [
      {
        "_id": "66db54b9456...",
        "userId": "66db53a8123...",
        "userName": "John Doe",
        "amount": 50,
        "currency": "usd",
        "status": "paid",
        "createdAt": "2026-09-07T11:30:00.000Z"
      }
    ]
  }
  ```

#### `GET /api/order/all`
Fetches all platform transactions. Protected by administrative email check.
- **Query Parameter or Header**: `adminEmail=satyam@gmail.com` or header `x-admin-email: satyam@gmail.com`.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "count": 15,
    "payments": [...]
  }
  ```
- **Error `403 Forbidden`**:
  ```json
  {
    "success": false,
    "message": "Access denied. Only satyam@gmail.com can view all payment transactions."
  }
  ```

---

## 🧪 Stripe Integration & Webhook Testing

To test Stripe Checkout Sessions and Webhook callbacks locally:

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli):
   ```bash
   # Windows (via Scoop or manual binary)
   scoop install stripe
   # macOS
   brew install stripe/stripe-cli/stripe
   ```

2. Login to your Stripe account:
   ```bash
   stripe login
   ```

3. Forward webhook events to your local Express server:
   ```bash
   stripe listen --forward-to localhost:8000/api/order/webhook
   ```

4. Copy the webhook signing secret printed by the CLI (e.g., `whsec_...`) into your `Backend/.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

5. Trigger a test checkout event:
   ```bash
   stripe trigger checkout.session.completed
   ```

---

## 🔒 Security & Architecture Highlights

1. **Password Security**: Passwords are never stored in plaintext. `bcryptjs` generates a secure salt and hash.
2. **Stateless JWT with HTTP-Only Cookie Delivery**: Tokens are signed with HMAC SHA-256 and dispatched in an HTTP-only, secure cookie alongside standard payload delivery.
3. **Raw Body Parsing Isolation**: Webhook endpoints are selectively parsed as raw streams before general JSON middlewares, preventing JSON tampering and enabling reliable HMAC-SHA256 signature verification.
4. **CORS Whitelist Protection**: Express restricts cross-origin resource requests specifically to local frontend dev ports (`5173`, `5174`) with credentials enabled.
5. **Role-Based Guards**: Sensitive administrative routes enforce email and role checks at both client UI and API controller levels.
6. **Defensive Schema Design**: Indexed MySQL queries on `userId` and `status` optimize read performance as transaction volume scales.

---

## 🛠 Troubleshooting

### 1. `Cannot connect to backend server` in Frontend
- Verify the backend server is running: `http://localhost:8000` (should return JSON `{ status: "ok" }`).
- Check `Frontend/.env` and ensure `VITE_API_URL=http://localhost:8000`.

### 2. `MySQL connection error`
- Ensure your local MySQL server is running (e.g. port 3306).
- Check `Backend/.env` and ensure `MYSQL_USER` and `MYSQL_PASSWORD` match your MySQL setup.

### 3. Stripe Webhook Signature Verification Failed
- Ensure you pass the exact secret provided by `stripe listen` as `STRIPE_WEBHOOK_SECRET`.
- Verify the raw body middleware in `Backend/server.js` precedes `express.json()`.

---

## 👨‍💻 Author & License

- **Author / Repository Owner**: [Satyam6201](https://github.com/Satyam6201)
- **Repository**: [Satyam6201/Payment-Gateway](https://github.com/Satyam6201/Payment-Gateway)
- **License**: Licensed under the [ISC License](LICENSE).