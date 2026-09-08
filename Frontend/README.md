# 💻 Stripe Pay - Frontend Application Deep Dive

[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.2.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![JavaScript](https://img.shields.io/badge/ES_Modules-ES2022-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/)
[![CSS3](https://img.shields.io/badge/CSS3-Modular_Component_CSS-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://www.w3.org/TR/CSS/)
[![ESLint](https://img.shields.io/badge/ESLint-10.x-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)](https://eslint.org/)

This document provides a comprehensive, component-by-component, and architectural breakdown of the **Stripe Pay** frontend client. It covers state management, UI component trees, modular per-component styling architecture, Stripe-only checkout flow, API interactions, and developer workflows.

---

## 📑 Table of Contents

- [Architectural Overview](#-architectural-overview)
- [Component Hierarchy & Data Flow](#-component-hierarchy--data-flow)
- [Application State & Session Management](#-application-state--session-management)
- [In-Depth Component Breakdown](#-in-depth-component-breakdown)
  - [1. App.jsx (Root Controller & Stripe Redirects)](#1-appjsx-root-controller--stripe-redirects)
  - [2. Navbar.jsx (Header & Navigation)](#2-navbarjsx-header--navigation)
  - [3. AuthPage.jsx (Authentication Portal)](#3-authpagejsx-authentication-portal)
  - [4. PayPage.jsx (Stripe Checkout & Currencies)](#4-paypagejsx-stripe-checkout--currencies)
  - [5. MyPaymentsPage.jsx (History & Receipt Download)](#5-mypaymentspagejsx-history--receipt-download)
  - [6. AdminPanel.jsx (Analytics, Volumes & CSV Export)](#6-adminpaneljsx-analytics-volumes--csv-export)
  - [7. icons.jsx (Vector SVG Icon Suite)](#7-iconsjsx-vector-svg-icon-suite)
- [Design System & Modular CSS Architecture](#-design-system--modular-css-architecture)
- [API Layer & Configuration (api.js)](#-api-layer--configuration-apijs)
- [Component Props & State Reference](#-component-props--state-reference)
- [Developer Workflow & Scripts](#-developer-workflow--scripts)
- [User Interaction Flows](#-user-interaction-flows)
- [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 🏗 Architectural Overview

The frontend is constructed as a **Single Page Application (SPA)** using **React 19** and bundled with **Vite 8**. It adheres to a clean, component-driven architecture with modular per-component styling and centralized session persistence through browser `localStorage`.

### Key Design Principles:
- **Zero Framework Bloat**: Pure modern React and scoped native CSS3 (no bulky UI libraries like Tailwind, Bootstrap, or Material UI).
- **Clean Human-Designed Layout**: Minimalist cards, subtle borders, clean typography, and zero robotic gradients or oversized glow effects.
- **Stripe Mode Focus**: The checkout experience is focused entirely on Stripe Checkout (no confusing Instant Pay toggles).
- **Currencies Restricted**: Strictly limited to **USD ($)** and **Rupees (₹ / INR)**.
- **Modular Stylesheet Per Component**: Every `.jsx` component has an accompanying `.css` file with scoped class names.
- **Lightweight SVG Icons**: Built-in SVG icons with smooth CSS animation support.

---

## 🌲 Component Hierarchy & Data Flow

```mermaid
flowchart TD
    IndexHTML["index.html (#root)"] --> Main["src/main.jsx (StrictMode)"]
    Main --> App["src/App.jsx (Root Controller)"]

    App -->|user == null| Auth["<AuthPage onLogin={handleLogin} />"]
    App -->|user != null| AuthenticatedLayout["Authenticated View"]

    AuthenticatedLayout --> Nav["<Navbar activeTab setActiveTab user onLogout />"]
    AuthenticatedLayout --> Router{"activeTab Router"}

    Router -->|activeTab == 'pay'| Pay["<PayPage user={user} />"]
    Router -->|activeTab == 'my-payments'| MyPayments["<MyPaymentsPage user={user} onNavigateToPay={...} />"]
    Router -->|activeTab == 'admin'| Admin["<AdminPanel user={user} />"]

    subgraph API["Backend API Calls (/src/api.js)"]
        Auth -.->|POST /api/user/login<br/>POST /api/user/register| ServerAPI[(Express REST API)]
        Pay -.->|POST /api/order/stripe| ServerAPI
        MyPayments -.->|GET /api/order/payments?userId=...| ServerAPI
        Admin -.->|GET /api/order/all?adminEmail=...| ServerAPI
    end
```

---

## 💾 Application State & Session Management

Session state is managed within [`App.jsx`](file:///c:/Users/satya/OneDrive/Desktop/Project/Assignment/Frontend/src/App.jsx) and synchronized with `localStorage` under the key `'assignment_user'`.

### User Object Schema
```typescript
interface User {
  id: number | string;  // Unique user ID in MySQL
  _id: string;          // Stringified identifier for compatibility
  name: string;         // Full name
  email: string;        // Normalized lowercase email
  role: 'user' | 'admin';
}
```

### Stripe Redirect Lifecycle
In `App.jsx`, a `useEffect` hook monitors URL paths upon mount:
- **Success (`/payment/success`)**: Switches the view to `'my-payments'`, triggers a success notification banner, and cleans the URL via `window.history.replaceState`.
- **Cancel (`/payment/cancel`)**: Keeps the user on `'pay'`, displays a cancellation alert, and resets the URL path.

---

## 🔍 In-Depth Component Breakdown

### 1. `App.jsx` (Root Controller & Stripe Redirects)
- **Path**: [`src/App.jsx`](file:///c:/Users/satya/OneDrive/Desktop/Project/Assignment/Frontend/src/App.jsx)
- **Styling**: [`src/App.css`](file:///c:/Users/satya/OneDrive/Desktop/Project/Assignment/Frontend/src/App.css)
- **Responsibilities**:
  - Top-level authentication barrier (renders `<AuthPage />` if unauthenticated).
  - Maintains `activeTab` (`'pay'`, `'my-payments'`, or `'admin'`).
  - Intercepts Stripe return routes (`/payment/success` and `/payment/cancel`).
  - Renders dismissible alert banners.

---

### 2. `Navbar.jsx` (Header & Navigation)
- **Path**: [`src/components/Navbar.jsx`](file:///c:/Users/satya/OneDrive/Desktop/Project/Assignment/Frontend/src/components/Navbar.jsx)
- **Styling**: [`src/components/Navbar.css`](file:///c:/Users/satya/OneDrive/Desktop/Project/Assignment/Frontend/src/components/Navbar.css)
- **Props**: `activeTab`, `setActiveTab`, `user`, `onLogout`
- **Key Behaviors**:
  - **Dynamic Admin Tab**: Displays the "Admin Panel" tab with an accent badge if `user.email === ADMIN_EMAIL`.
  - **User Profile Pill**: Displays the user's initial and name, with an `"Admin"` chip for administrative accounts.
  - **Brand Return**: Clicking `"Assignment Pay"` logo routes back to the `'pay'` tab.
  - **Sign Out Action**: Cleans user state and storage with visual confirmation.

---

### 3. `AuthPage.jsx` (Authentication Portal)
- **Path**: [`src/components/AuthPage.jsx`](file:///c:/Users/satya/OneDrive/Desktop/Project/Assignment/Frontend/src/components/AuthPage.jsx)
- **Styling**: [`src/components/AuthPage.css`](file:///c:/Users/satya/OneDrive/Desktop/Project/Assignment/Frontend/src/components/AuthPage.css)
- **Props**: `onLogin(userData)`
- **Key Features**:
  - Seamless toggle between **Sign In** and **Create an Account**.
  - **Autofill Button**: One-click autofill for the admin reviewer account (`satyam@gmail.com` / `Satyam@62`).
  - Inline error alerts displaying concise messages directly from the server.
  - Form validation with clean visual focus states.

---

### 4. `PayPage.jsx` (Stripe Checkout & Currencies)
- **Path**: [`src/components/PayPage.jsx`](file:///c:/Users/satya/OneDrive/Desktop/Project/Assignment/Frontend/src/components/PayPage.jsx)
- **Styling**: [`src/components/PayPage.css`](file:///c:/Users/satya/OneDrive/Desktop/Project/Assignment/Frontend/src/components/PayPage.css)
- **Props**: `user`
- **Key Features**:
  - **Stripe Mode Only**: Directly initiates a Stripe checkout session via `POST /api/order/stripe`.
  - **Supported Currencies**: Clean pill toggle between **USD ($)** and **Rupees (₹ / INR)**.
  - **Dynamic Prefix**: Input prefix and action button text automatically adjust to `$ ` or `₹ `.
  - **Optional Note**: Field allowing customers to specify payment purposes.
  - **Safe Fallback**: Connects smoothly whether using live Stripe keys or local simulation.
  - **Encrypted Checkout Notice**: Displays security reassurance with lock and shield icons.

---

### 5. `MyPaymentsPage.jsx` (History & Receipt Download)
- **Path**: [`src/components/MyPaymentsPage.jsx`](file:///c:/Users/satya/OneDrive/Desktop/Project/Assignment/Frontend/src/components/MyPaymentsPage.jsx)
- **Styling**: [`src/components/MyPaymentsPage.css`](file:///c:/Users/satya/OneDrive/Desktop/Project/Assignment/Frontend/src/components/MyPaymentsPage.css)
- **Props**: `user`, `onNavigateToPay`
- **Key Features**:
  - Automatic query on mount: `GET /api/order/payments?userId=${user.id}`.
  - **Search Bar**: Instant filtering by Order ID, Transaction ID, Amount, or Status.
  - **Status Filter**: Toggle between `All`, `Paid`, `Pending`, and `Failed`.
  - **One-Click Receipt Download**: Clicking the download button produces a formatted `.txt` payment receipt named `Receipt_<orderId>.txt`.
  - **Manual Refresh**: Reload button with animated rotation during requests.
  - **Empty State**: Direct link to make the first payment when no orders exist.

---

### 6. `AdminPanel.jsx` (Analytics, Volumes & CSV Export)
- **Path**: [`src/components/AdminPanel.jsx`](file:///c:/Users/satya/OneDrive/Desktop/Project/Assignment/Frontend/src/components/AdminPanel.jsx)
- **Styling**: [`src/components/AdminPanel.css`](file:///c:/Users/satya/OneDrive/Desktop/Project/Assignment/Frontend/src/components/AdminPanel.css)
- **Props**: `user`
- **Key Features**:
  - **Access Restriction**: Hard check against `ADMIN_EMAIL` (`satyam@gmail.com`).
  - **Executive KPI Cards**:
    - **Total Transactions**: Total number of orders placed.
    - **USD Revenue**: Accrued volume of all completed USD ($) transactions.
    - **Rupees Revenue**: Accrued volume of all completed INR (₹) transactions.
    - **Success Rate**: Calculated percentage of completed transactions.
  - **Multi-Field Search**: Filters by Customer Name, User ID, Transaction ID, and Order ID.
  - **Status Tabs**: Quick filtering across `All`, `Paid`, `Pending`, and `Failed`.
  - **CSV Export**: Instant download of `Transactions_YYYY-MM-DD.csv` containing complete order details.

---

### 7. `icons.jsx` (Vector SVG Icon Suite)
- **Path**: [`src/components/icons.jsx`](file:///c:/Users/satya/OneDrive/Desktop/Project/Assignment/Frontend/src/components/icons.jsx)
- **Key Features**:
  - Zero external icon dependencies.
  - Clean inline vector SVG implementations:
    - `IconCreditCard`, `IconRefresh`, `IconSearch`, `IconDownload`, `IconShield`, `IconCheck`, `IconAlert`, `IconUser`, `IconArrowRight`, `IconLock`.
  - Configurable `size`, `color`, and `className` props (e.g. `className="spin"` for loading states).

---

## 🎨 Design System & Modular CSS Architecture

Styles are cleanly divided into separate files for each component:

| Component | CSS File | Styling Focus |
| :--- | :--- | :--- |
| `main.jsx` | `src/index.css` | Typography, color variables, button styles, status pills, animations |
| `App.jsx` | `src/App.css` | App container, max-width wrapper, alert notification bars |
| `Navbar.jsx` | `src/components/Navbar.css` | Header bar, navigation tabs, user initials avatar, sign-out button |
| `AuthPage.jsx` | `src/components/AuthPage.css` | Auth card, toggle buttons, form inputs, autofill demo pill |
| `PayPage.jsx` | `src/components/PayPage.css` | Payment card, currency toggle pills, amount prefix, security notice |
| `MyPaymentsPage.jsx` | `src/components/MyPaymentsPage.css` | Filter bar, search input, modern table, receipt download button |
| `AdminPanel.jsx` | `src/components/AdminPanel.css` | KPI cards, USD/INR volumes, search controls, CSV export button |

---

## 🌐 API Layer & Configuration (`api.js`)

Located at [`src/api.js`](file:///c:/Users/satya/OneDrive/Desktop/Project/Assignment/Frontend/src/api.js):

```javascript
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'satyam@gmail.com'
```

---

## 📋 Component Props & State Reference

| Component | Props Accepted | State Variables | API Request |
| :--- | :--- | :--- | :--- |
| `<App />` | None | `user`, `activeTab`, `notification` | None (`localStorage` sync) |
| `<Navbar />` | `activeTab`, `setActiveTab`, `user`, `onLogout` | None (derived `isAdmin`) | None |
| `<AuthPage />` | `onLogin(userData)` | `isRegister`, `form`, `status`, `loading` | `POST /api/user/login`<br/>`POST /api/user/register` |
| `<PayPage />` | `user` | `amount`, `currency`, `note`, `loading`, `status` | `POST /api/order/stripe` |
| `<MyPaymentsPage />` | `user`, `onNavigateToPay` | `payments`, `loading`, `error`, `filterStatus`, `search` | `GET /api/order/payments?userId=...` |
| `<AdminPanel />` | `user` | `payments`, `loading`, `error`, `filterStatus`, `search` | `GET /api/order/all?adminEmail=...` |

---

## 🛠 Developer Workflow & Scripts

Execute from the `Frontend` directory:

```bash
# Start Vite development server (port 5173)
npm run dev

# Build for production (outputs to dist/)
npm run build

# Preview production build locally
npm run preview

# Run ESLint quality checks
npm run lint
```

---

## 🔄 User Interaction Flows

### Flow 1: Authentication & Demo Login
```text
[User Opens App]
       │
       ▼
[AuthPage Displayed]
       │
       ├─► Option A: Fill Name, Email, Password -> Click "Create Account"
       │
       ├─► Option B: Click "Autofill (satyam@gmail.com)" -> Click "Sign In"
       │
       ▼
[Backend Validates & Returns User + JWT]
       │
       ▼
[User stored in localStorage -> Redirect to PayPage]
```

### Flow 2: Stripe Payment
```text
[User on PayPage]
       │
       ├─► Select Currency: USD ($) or Rupees (₹)
       ├─► Enter Amount (e.g., 50.00)
       ├─► (Optional) Enter Note
       │
       ▼
[Click "Pay $50 with Stripe"]
       │
       ▼ (Button switches to "Redirecting to Stripe...")
[POST /api/order/stripe]
       │
       ▼
[Redirect to Stripe Checkout (or Simulated Local Checkout URL)]
       │
       ▼ (Payment Completed)
[Redirect back to /payment/success]
       │
       ▼
[App switches to MyPaymentsPage with success confirmation banner]
```

### Flow 3: Admin Review & CSV Export
```text
[Admin logs in as satyam@gmail.com]
       │
       ▼
[Navbar shows "Admin Panel" tab]
       │
       ▼
[AdminPanel loads all transactions]
       │
       ├─► View Total Transactions, USD Revenue, Rupees Revenue & Success Rate
       ├─► Search by Customer, User ID, or Order ID
       ├─► Filter by status (Paid, Pending, Failed)
       └─► Click "Export CSV" -> Downloads Transactions_YYYY-MM-DD.csv
```

---

## ❓ Troubleshooting & FAQs

### 1. `Server unreachable` error
- Verify the backend server is running on `http://localhost:8000`.
- Verify `Frontend/.env` contains `VITE_API_URL=http://localhost:8000`.

### 2. Admin Panel tab is not visible
- Ensure your logged-in account email matches `satyam@gmail.com` exactly.
- Use the **Autofill (satyam@gmail.com)** button on the sign-in form.

### 3. Stripe checkout shows simulation
- If your `Backend/.env` has `STRIPE_MOCK=true` or lacks a valid secret key starting with `sk_test_`, the system automatically simulates checkout so you can test complete end-to-end payment flows without errors.
