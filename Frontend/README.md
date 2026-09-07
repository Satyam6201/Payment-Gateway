# 💻 Assignment Pay - Frontend Client

This is the client-side single page application (SPA) for **Assignment Pay**, built with **React 19** and **Vite**.

For comprehensive documentation covering the entire system, backend APIs, Stripe setup, and architecture, please refer to the [Root README.md](../README.md).

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in this directory (refer to [`.env.example`](.env.example)):
```env
VITE_API_URL=http://localhost:8000
VITE_ADMIN_EMAIL=satyam@gmail.com
```

### 3. Run Development Server
```bash
npm run dev
```
The app will run locally at [http://localhost:5173](http://localhost:5173).

---

## 📁 Key Components

- **`src/App.jsx`**: Top-level application layout, auth state observer with `localStorage` persistence, and tab switcher.
- **`src/components/AuthPage.jsx`**: User sign-in and registration forms with one-click admin autofill.
- **`src/components/Navbar.jsx`**: Header navigation, active tab highlight, admin badge, and logout trigger.
- **`src/components/PayPage.jsx`**: Quick preset payment buttons (\$20, \$50, \$60, \$100) and custom payment submission.
- **`src/components/MyPaymentsPage.jsx`**: Tabular personal transaction history with status badges and refresh control.
- **`src/components/AdminPanel.jsx`**: Executive dashboard with total revenue calculation, total transaction count, and instant multi-column search/filtering.
