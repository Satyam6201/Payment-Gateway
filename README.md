# 💳 Stripe Pay - Payment Gateway & Transaction Management System

[![Node.js](https://img.shields.io/badge/Node.js-v18+-68A063?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-00758F?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Sequelize](https://img.shields.io/badge/Sequelize-6.x-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)](https://sequelize.org/)
[![Stripe](https://img.shields.io/badge/Stripe-API-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)
[![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](LICENSE)

A clean, modern, full-stack payment processing, customer transaction history, and administrator analytics platform. Built with a decoupled **Node.js / Express.js / MySQL (Sequelize)** backend and a human-designed, responsive **React 19 / Vite** frontend with modular per-component CSS, dedicated animated SVG icons, and a secure **Stripe Checkout** workflow.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Database Schema & Data Models](#-database-schema--data-models-mysql)
- [Prerequisites](#-prerequisites)
- [Environment Variables](#-environment-variables)
- [Getting Started & Installation](#-getting-started--installation)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
- [Default Demo Credentials](#-default-demo-credentials)
- [Payment Flow & Stripe Integration](#-payment-flow--stripe-integration)
  - [Stripe Mode Only](#stripe-mode-only)
  - [Supported Currencies](#supported-currencies)
  - [API Key Validation & Local Fallback Simulation](#api-key-validation--local-fallback-simulation)
  - [Stripe Webhook Synchronization](#stripe-webhook-synchronization)
- [REST API Reference](#-rest-api-reference)
  - [Health Check](#health-check)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Payment & Order Endpoints](#payment--order-endpoints)
- [Frontend Architecture & Modular Styling](#-frontend-architecture--modular-styling)
- [Security & Architecture Highlights](#-security--architecture-highlights)
- [Troubleshooting](#-troubleshooting)
- [Author & License](#-author--license)

---

## 🌟 Overview

**Stripe Pay** delivers an intuitive, secure, and clean payment workflow tailored for real-world e-commerce interactions:

1. **User Authentication & Session Management**: Secure user onboarding, login, password encryption via `bcryptjs`, and JSON Web Token (JWT) state management with HTTP-only cookies.
2. **Simplified Stripe Checkout**: Streamlined payment interface exclusively using Stripe Checkout with real-time currency switching between **USD ($)** and **Rupees (₹ / INR)**.
3. **Intelligent Key Handling & Fallback**: Automatic detection of valid Stripe Secret Keys (`sk_test_...` or `rk_test_...`) with seamless local checkout simulation fallback if mock mode is active or when key metadata identifiers (`mk_...`) are provided.
4. **Webhook Lifecycle Handling**: Handles asynchronous Stripe notifications (`checkout.session.completed`, `async_payment_succeeded`, `async_payment_failed`, `expired`) with cryptographic HMAC signature verification.
5. **Personal History ("My Payments")**: Real-time listing of customer purchases with status badges, search filter, and instant text receipt downloads.
6. **Administrator Dashboard**: Role-protected analytics panel with split-currency revenue tracking (USD and Rupees), total order volume metrics, live multi-field search, status filtering, and one-click CSV export.

---

## 🏛 System Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend (React 19 + Vite)"]
        UI[App.jsx Root Controller]
        AuthView[AuthPage: Sign In / Register + Autofill]
        PayView[PayPage: Stripe Checkout with USD & INR]
        HistoryView[MyPaymentsPage: Order Logs + Receipt Download]
        AdminView[AdminPanel: KPIs, USD/INR Volumes & CSV Export]
    end

    subgraph Server["Backend API (Express.js 5)"]
        Router[Routers: /api/user, /api/order, /api/payment]
        AuthCtrl[User Controller: JWT + Bcrypt]
        PayCtrl[Payment Controller: Stripe Checkout & Queries]
        WebhookHandler[Stripe Webhook Listener]
        AutoSeed[Admin Auto-Seeder: db.js]
    end

    subgraph External["External Services & Storage"]
        MySQL[(MySQL Database: payment_gateway)]
        StripeGateway[Stripe Checkout API]
    end

    UI --> AuthView & PayView & HistoryView & AdminView

    AuthView -->|POST /api/user/login, /register| AuthCtrl
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
- **Password Hashing**: Passwords stored using `bcryptjs` with 10 salt rounds.
- **JWT Authorization**: Emits JSON Web Tokens with a 7-day expiration lifespan, saved in client state and passed as HTTP-only cookies.
- **Auto Admin Promotion**: Any registration matching the designated administrator email (`satyam@gmail.com`) automatically receives the `admin` role.
- **One-Click Demo Login**: Convenient "Autofill (satyam@gmail.com)" button on the sign-in screen to quickly test with preconfigured administrative credentials.
- **Concise Error Messaging**: Direct, short messages such as `"Email and password required"` or `"Invalid email or password"`.

### 💳 2. Payment Checkout Flow (Stripe Only)
- **Dedicated Stripe Mode**: The payment portal is focused entirely on Stripe Checkout. Confusing instant-pay toggles have been removed.
- **Strict Currencies**: Supports exclusively **USD ($)** and **Rupees (₹ / INR)** with instant currency toggling.
- **Custom Amount Input**: Clean numeric input with floating-point validation.
- **Optional Note**: Allows customers to attach a memo or note to their payment.
- **Intelligent Fallback Simulation**: If running in local test mode or if an invalid key identifier (`mk_...`) is provided, the system records the payment into MySQL and routes through a simulated success redirect without throwing 500 errors.

### 📊 3. Personal History ("My Payments")
- Dedicated interface displaying user-specific payment records.
- Live search bar filtering across Order ID, Transaction ID, Amount, and Status.
- Status filters: `All`, `Paid`, `Pending`, and `Failed`.
- Direct text receipt generator (`Receipt_<id>.txt`) downloadable right from the browser.
- Manual "Refresh" button with spinning loading feedback.

### 🛡️ 4. Admin Portal & Analytics
- **Strict Access Control**: Accessible only by `satyam@gmail.com` (enforced at both UI and API controller levels).
- **Executive KPIs**:
  - **Total Transactions**: Total number of orders placed across the system.
  - **USD Revenue**: Sum of all successful transactions denominated in USD ($).
  - **Rupees Revenue**: Sum of all successful transactions denominated in INR (₹).
  - **Success Rate**: Real-time percentage of completed vs. failed/pending payments.
- **Search & Filter**: Search across Customer Name, User ID, Transaction ID, and Order ID.
- **CSV Export**: One-click download of all transaction data (`Transactions_YYYY-MM-DD.csv`).

### ⚡ 5. Zero-Config Database Bootstrapping
- On every server boot, `Backend/config/db.js` creates the database `payment_gateway` if it does not already exist.
- Synchronizes Sequelize models with MySQL (`sync({ alter: true })`).
- Automatically verifies and seeds the default administrator account (`satyam@gmail.com` / `Satyam@62`) if absent.

---

## 💻 Technology Stack

### Frontend
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **React** | `^19.2.8` | Component-based UI framework |
| **ReactDOM** | `^19.2.8` | React DOM renderer |
| **Vite** | `^8.2.2` | High-speed frontend development server and bundler |
| **ESLint** | `^10.9.0` | Code quality and React Hooks rules linting |
| **CSS3** | Modular CSS | Separate CSS stylesheets per JSX component (zero heavy CSS frameworks) |

### Backend
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | `>= 18.x` | JavaScript runtime environment (ES Module standard) |
| **Express** | `^5.2.1` | REST API routing and middleware framework |
| **Sequelize** | `^6.37.8` | Relational ORM for MySQL with auto-sync and model pooling |
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
├── .gitignore                      # Git ignored files (node_modules, .env, dist, logs)
├── README.md                       # Comprehensive project documentation
│
├── Backend/                        # Node.js + Express REST API Server
│   ├── config/
│   │   └── db.js                   # MySQL connection, auto-sync & admin auto-seeding logic
│   ├── controller/
│   │   ├── payment.js              # Payment handling, Stripe checkout, mock fallback & queries
│   │   └── user.js                 # Authentication controllers (register, login, logout)
│   ├── model/
│   │   ├── payment.model.js        # Sequelize schema for transaction records
│   │   └── user.model.js           # Sequelize schema for registered users
│   ├── router/
│   │   ├── paymentRouter.js        # /api/order and /api/payment endpoints
│   │   └── userRouter.js           # /api/user authentication endpoints
│   ├── .env                        # Local environment configuration
│   ├── .env.example                # Backend environment variable template
│   ├── package.json                # Express dependencies and scripts
│   ├── schema.sql                  # Direct MySQL DDL schema definitions
│   └── server.js                   # Application entry point & middleware pipeline
│
└── Frontend/                       # React 19 + Vite Single Page Application (SPA)
    ├── public/
    │   ├── favicon.svg             # Website favicon
    │   ├── icons.svg               # Web icons
    │   └── images.png              # Brand icon asset
    ├── src/
    │   ├── assets/
    │   │   ├── hero.png            # Hero banner asset
    │   │   ├── react.svg           # React logo
    │   │   └── vite.svg            # Vite logo
    │   ├── components/
    │   │   ├── AdminPanel.css      # Modular styles for admin analytics & KPI cards
    │   │   ├── AdminPanel.jsx      # Admin dashboard with USD/INR metrics, search & CSV export
    │   │   ├── AuthPage.css        # Modular styles for login & registration cards
    │   │   ├── AuthPage.jsx        # Login / Register forms with admin autofill
    │   │   ├── icons.jsx           # Dedicated vector SVG icon components
    │   │   ├── MyPaymentsPage.css  # Modular styles for payment history table & search
    │   │   ├── MyPaymentsPage.jsx  # Customer transaction history with receipt download
    │   │   ├── Navbar.css          # Modular styles for top navigation bar & user profile
    │   │   ├── Navbar.jsx          # Top navigation bar with active tab & user profile
    │   │   ├── PayPage.css         # Modular styles for payment form & currency toggles
    │   │   └── PayPage.jsx         # Stripe payment portal with USD & INR support
    │   ├── api.js                  # API configuration (API_URL, ADMIN_EMAIL)
    │   ├── App.css                 # Application shell & layout container styles
    │   ├── App.jsx                 # Root component with auth guard, tab routing & Stripe redirect handler
    │   ├── index.css               # Global typography, CSS variables, and base resets
    │   └── main.jsx                # React DOM root mounting
    ├── .env                        # Local frontend environment variables
    ├── .env.example                # Frontend environment variable template
    ├── eslint.config.js            # ESLint rules configuration
    ├── index.html                  # HTML entry point
    ├── package.json                # Frontend dependencies and Vite scripts
    ├── README.md                   # Frontend architecture & component documentation
    └── vite.config.js              # Vite bundler configuration
```

---

## 🗄️ Database Schema & Data Models (MySQL)

The backend utilizes **MySQL** with **Sequelize** ORM (`sync({ alter: true })`). Direct DDL is also available in [`Backend/schema.sql`](file:///c:/Users/satya/OneDrive/Desktop/Project/Assignment/Backend/schema.sql).

### 1. `users` Table
Stores registered platform users and administrative credentials.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique user identifier |
| `name` | `VARCHAR(255)` | `NOT NULL` | User's full name |
| `email` | `VARCHAR(255)` | `NOT NULL`, `UNIQUE` | Normalized lowercase email address |
| `password` | `VARCHAR(255)` | `NOT NULL` | Bcrypt-hashed password (10 salt rounds) |
| `role` | `ENUM('user', 'admin')` | `DEFAULT 'user'` | Access permission tier |
| `createdAt` | `DATETIME` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | Account creation timestamp |
| `updatedAt` | `DATETIME` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Profile update timestamp |

### 2. `payments` Table
Stores completed, pending, and failed payment transaction records (normalized, linked to `users` table).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique payment transaction record ID |
| `userId` | `INT` | `NOT NULL`, `FOREIGN KEY (users.id) ON DELETE CASCADE` | Associated user ID |
| `amount` | `DECIMAL(10, 2)` | `NOT NULL` | Payment amount in currency units |
| `currency` | `VARCHAR(3)` | `NOT NULL`, `DEFAULT 'usd'` | Currency code (`usd` or `inr`) |
| `status` | `ENUM('pending', 'paid', 'failed')` | `NOT NULL`, `DEFAULT 'pending'`, `INDEX` | Lifecycle status of the payment |
| `orderId` | `VARCHAR(255)` | `NOT NULL`, `INDEX` | System order reference |
| `stripeCheckoutSessionId` | `VARCHAR(255)` | `UNIQUE`, `NULLABLE` | Stripe Checkout Session ID |
| `paidAt` | `DATETIME` | `NULLABLE`, `DEFAULT NULL` | Timestamp when payment was confirmed paid |
| `failureMessage` | `VARCHAR(500)` | `NULLABLE` | Failure details or webhook error messages |
| `createdAt` | `DATETIME` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | Record creation timestamp |
| `updatedAt` | `DATETIME` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Record update timestamp |

### Frontend Compatibility
Sequelize models implement custom `toJSON()` serialization:
- Automatically strips `password` from user responses.
- Exposes `_id: String(this.id)` so React components referencing either `p.id` or `p._id` function smoothly.
- Exposes `userId` as a string for safe client-side search and filtering operations.
- Dynamically resolves `userName` from the associated `user` relation (`User.hasMany(Payment)` / `Payment.belongsTo(User)`), maintaining 100% compatibility with frontend components without storing redundant denormalized customer names.

---

## ⚙️ Prerequisites

- **Node.js**: `v18.0.0` or higher ([Download Node.js](https://nodejs.org/))
- **npm**: `v9.0.0` or higher (bundled with Node.js)
- **MySQL**: MySQL Server 8.0+ running on `localhost:3306` (or XAMPP / Docker / cloud MySQL)
- *(Optional)* **Stripe Account**: For live Stripe Checkout and webhook testing ([Stripe Dashboard](https://dashboard.stripe.com/test/apikeys))

---

## 🔐 Environment Variables

### Backend Configuration (`Backend/.env`)

Create or update `Backend/.env`:

```env
# Server Port
PORT=8000

# MySQL Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=payment_gateway

# Alternatively, provide a full MySQL connection URI:
# MYSQL_URI=mysql://root:password@localhost:3306/payment_gateway

# JWT Secret Key for token signing
JWT_SECRET=your_super_secret_jwt_key_here

# Stripe API Keys (Secret Key starts with sk_test_ or rk_test_)
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Set to true to simulate Stripe checkouts locally without calling external Stripe APIs
STRIPE_MOCK=false
```

### Frontend Configuration (`Frontend/.env`)

Create or update `Frontend/.env`:

```env
# Backend API Base URL
VITE_API_URL=http://localhost:8000

# Administrator Email (enables Admin Panel navigation & authorization)
VITE_ADMIN_EMAIL=satyam@gmail.com
```

---

## 🚀 Getting Started & Installation

### 1. Backend Setup

1. Open a terminal and navigate to `Backend`:
   ```bash
   cd Backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure `Backend/.env`:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Enter your MySQL password (`MYSQL_PASSWORD`).
   - If testing locally without a live Stripe key, you can set `STRIPE_MOCK=true`.

4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server starts on `http://localhost:8000`. It creates the `payment_gateway` database if missing, syncs tables, and seeds the default admin account.*

---

### 2. Frontend Setup

1. Open a separate terminal and navigate to `Frontend`:
   ```bash
   cd Frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure `Frontend/.env`:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Ensure `VITE_API_URL=http://localhost:8000`.

4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The app will open at `http://localhost:5173`.*

---

## 🔑 Default Demo Credentials

The backend automatically creates the administrative account on initial startup:

| Role | Email | Password | Available Pages |
| :--- | :--- | :--- | :--- |
| **Administrator** | `satyam@gmail.com` | `Satyam@62` | **Pay**, **My Payments**, and **Admin Panel** (KPIs, USD/INR volumes, CSV export) |
| **Regular User** | *Any registered email* | *User password* | **Pay** and **My Payments** |

> **💡 Quick Tip**: On the frontend login screen, click **"Autofill (satyam@gmail.com)"** to immediately populate the form with admin credentials.

---

## 💳 Payment Flow & Stripe Integration

### Stripe Mode Only
The payment page has been streamlined to exclusively offer **Stripe Checkout**. Confusing dual-mode toggles ("Instant Pay") have been removed to present a clean, real-world checkout experience.

### Supported Currencies
Transactions are strictly restricted to:
1. **USD ($)** — Default currency (`currency: 'usd'`).
2. **Rupees (₹ / INR)** — Indian Rupee (`currency: 'inr'`).

Users can switch between currencies with a single click. The currency symbol dynamically updates on the amount input and action button.

### API Key Validation & Local Fallback Simulation
Stripe API keys have specific prefixes:
- Secret keys always begin with `sk_test_` (or `rk_test_`).
- Keys starting with `mk_` are **key identifiers/metadata IDs**, not secret keys. Passing an `mk_` key to Stripe's SDK results in an invalid key error.

**Built-In Smart Fallback:**
In `Backend/controller/payment.js`, the server automatically evaluates `isRealStripeKey()`:
- If `STRIPE_MOCK=true`, or if a valid `sk_test_` key is absent, or if an identifier like `mk_...` is provided:
  1. The server generates a mock session ID (`cs_mock_...`).
  2. Saves the payment as `paid` in the MySQL database.
  3. Returns `{ success: true, url: ".../payment/success?session_id=..." }`.
  4. The frontend redirects to success, switches to "My Payments", and shows the confirmation alert.
  5. Zero 500 server crashes occur during development!

### Stripe Webhook Synchronization
When connected to a live Stripe account:
1. Stripe sends events to `POST /api/order/webhook`.
2. The raw request body is verified against `STRIPE_WEBHOOK_SECRET` using `stripe.webhooks.constructEvent()`.
3. Event handlers:
   - `checkout.session.completed` &rarr; updates status to `paid` and sets `paidAt`.
   - `checkout.session.async_payment_succeeded` &rarr; updates status to `paid`.
   - `checkout.session.async_payment_failed` / `expired` &rarr; updates status to `failed` and logs `failureMessage`.

---

## 📡 REST API Reference

Base URL: `http://localhost:8000`

### Health Check

#### `GET /`
- **Response `200 OK`**:
  ```json
  {
    "status": "ok",
    "message": "Stripe Payment API is running"
  }
  ```

---

### Authentication Endpoints

Mounted at `/api/user`:

#### `POST /api/user/register`
Registers a new user. If the email is `satyam@gmail.com`, the user is created with the `admin` role.
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "user": {
      "id": 2,
      "_id": "2",
      "email": "jane@example.com",
      "name": "Jane Doe",
      "role": "user"
    },
    "token": "eyJhbGciOi..."
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{"success": false, "message": "All fields required"}`
  - `409 Conflict`: `{"success": false, "message": "Email already registered"}`
  - `500 Server Error`: `{"success": false, "message": "Registration failed"}`

#### `POST /api/user/login`
Authenticates user and returns a signed JWT token.
- **Request Body**:
  ```json
  {
    "email": "satyam@gmail.com",
    "password": "Satyam@62"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "user": {
      "id": 1,
      "_id": "1",
      "email": "satyam@gmail.com",
      "name": "Satyam Admin",
      "role": "admin"
    },
    "token": "eyJhbGciOi..."
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{"success": false, "message": "Email and password required"}`
  - `401 Unauthorized`: `{"success": false, "message": "Invalid email or password"}`

#### `GET /api/user/logout`
Clears session cookie.
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

#### `POST /api/order/stripe`
Creates a Stripe Checkout Session or returns a local simulation URL.
- **Request Body**:
  ```json
  {
    "userId": 1,
    "userName": "Satyam Admin",
    "amount": 50,
    "currency": "usd",
    "note": "Software license",
    "orderId": "order_1741480000"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "url": "https://checkout.stripe.com/c/pay/cs_test_..." or "http://localhost:5173/payment/success?session_id=cs_mock_...",
    "payment": {
      "id": 1,
      "_id": "1",
      "userId": 1,
      "userName": "Satyam Admin",
      "amount": 50,
      "currency": "usd",
      "status": "pending" or "paid",
      "orderId": "order_1741480000"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{"success": false, "message": "Invalid user ID"}` or `{"success": false, "message": "Enter a valid amount"}`
  - `404 Not Found`: `{"success": false, "message": "User not found"}`

#### `POST /api/order/pay`
Records an order directly into the database.
- **Request Body**:
  ```json
  {
    "userId": 1,
    "userName": "Satyam Admin",
    "amount": 25,
    "currency": "usd"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "message": "Payment recorded successfully",
    "payment": { ... }
  }
  ```

#### `GET /api/order/payments`
Returns all payments for a specific user.
- **Query Parameter**: `userId=1`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "count": 3,
    "payments": [
      {
        "id": 1,
        "_id": "1",
        "userId": 1,
        "userName": "Satyam Admin",
        "amount": "50.00",
        "currency": "usd",
        "status": "paid",
        "orderId": "order_1741480000",
        "paidAt": "2026-09-08T09:30:00.000Z",
        "createdAt": "2026-09-08T09:30:00.000Z"
      }
    ]
  }
  ```

#### `GET /api/order/all`
Returns all platform payments. Protected by admin check.
- **Query Parameter or Header**: `adminEmail=satyam@gmail.com` or header `x-admin-email: satyam@gmail.com`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "count": 12,
    "payments": [ ... ]
  }
  ```
- **Error `403 Forbidden`**:
  ```json
  {
    "success": false,
    "message": "Access denied"
  }
  ```

#### `POST /api/order/webhook`
Receives raw webhook payloads from Stripe with signature verification.
- **Header**: `stripe-signature: t=...,v1=...`
- **Response `200 OK`**:
  ```json
  {
    "received": true
  }
  ```

---

## 🎨 Frontend Architecture & Modular Styling

The frontend employs a modular, human-readable architecture where each component has its own dedicated stylesheet and icon definitions:

1. **Component-Scoped CSS**:
   - `Navbar.css` &rarr; Navigation bar, brand logo, profile pill, admin tag, sign-out button.
   - `AuthPage.css` &rarr; Card containers, input styling, autofill demo button.
   - `PayPage.css` &rarr; Clean payment card, USD/INR toggles, currency prefix, action button.
   - `MyPaymentsPage.css` &rarr; Data table, search bar, status badges, receipt download.
   - `AdminPanel.css` &rarr; KPI grid (USD/INR revenue, transactions, success rate), CSV button.
   - `App.css` &rarr; Shell layout, main view padding, alert banners.
   - `index.css` &rarr; Global typography, CSS variables, base resets.
2. **Dedicated Vector Icons (`icons.jsx`)**:
   - High-performance, lightweight SVG icons (`IconCreditCard`, `IconRefresh`, `IconSearch`, `IconDownload`, `IconShield`, `IconCheck`, `IconAlert`, `IconUser`, `IconArrowRight`, `IconLock`).
   - Zero bulky icon libraries (no FontAwesome, no heavy packages).
3. **Receipt Download**:
   - Client-side blob generation creating formatted `.txt` payment receipts on demand without external PDF libraries.

---

## 🔒 Security & Architecture Highlights

1. **Password Encryption**: Salted hashes generated using `bcryptjs` (10 rounds). Passwords never stored or returned in plaintext.
2. **Stateless JWT Authorization**: Tokens signed with HMAC SHA-256 and sent via HTTP-only cookies and Bearer headers.
3. **Raw Body Isolation**: The Stripe webhook endpoint uses `express.raw({ type: "application/json" })` prior to general JSON parsing, ensuring cryptographic signature integrity.
4. **Input Sanitization**: Number validation and string trimming on all controller endpoints.
5. **Role-Based Guards**: Frontend route protection + Backend controller verification (`satyam@gmail.com`).
6. **Connection Pooling**: Sequelize manages an active pool (`max: 10`, `min: 0`, `idle: 10000ms`) for database performance.

---

## 🛠 Troubleshooting

### 1. `Invalid API key provided: mk_...`
- **Cause**: An API key identifier starting with `mk_` was placed in `STRIPE_SECRET_KEY` instead of an actual secret key (`sk_test_...`).
- **Solution**: The backend automatically detects this and falls back to local simulation so the app doesn't crash. To test with real Stripe, generate a secret key from [Stripe API Keys](https://dashboard.stripe.com/test/apikeys) starting with `sk_test_`.

### 2. `Cannot connect to MySQL database`
- Verify your local MySQL service is running.
- In `Backend/.env`, verify `MYSQL_USER` and `MYSQL_PASSWORD`.
- The database `payment_gateway` will be created automatically if your MySQL user has `CREATE` privileges.

### 3. `Server unreachable` in Frontend
- Ensure the backend is running on `http://localhost:8000`.
- Verify `VITE_API_URL=http://localhost:8000` in `Frontend/.env`.

---

## 👨‍💻 Author & License

- **Author / Repository Owner**: [Satyam6201](https://github.com/Satyam6201)
- **Repository**: [Satyam6201/Payment-Gateway](https://github.com/Satyam6201/Payment-Gateway)
- **License**: Licensed under the [ISC License](LICENSE).