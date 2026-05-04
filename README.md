# ForexPro — Currency Exchange Management System

A full-stack MERN application for managing AED/SAR/PKR currency exchange transactions.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm

### Option 1: Local Development

**Backend:**
```bash
cd server
cp .env.example .env        # Edit MONGO_URI and JWT_SECRET
npm install
npm run dev                  # Runs on http://localhost:5000
```

**Frontend:**
```bash
cd client
npm install
npm run dev                  # Runs on http://localhost:5173
```

### Option 2: Docker Compose
```bash
docker-compose up -d
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000
```

## 🔐 Default Login
- **Username:** `admin`
- **Password:** `password`

> Change in production: hash your password with bcrypt and update `ADMIN_PASS` in `.env`

## 📋 Features

### Party Management
- Add/edit/delete persons (Buyer/Seller/Both)
- Running balance tracking per person
- Full ledger view with Dr/Cr running balance

### Transactions (AED & SAR)
- Buy / Sell transactions
- Manual rate entry
- Auto PKR calculation
- Profit tracking per transaction (with buying rate input)

### Payments
- Record cash/bank payments received or paid
- Auto-updates person balance and account balance

### Accounts
- Cash accounts (Peshawar, Village, etc.)
- Bank accounts (HBL, Meezan, etc.)
- Real-time balance tracking

### Reports
- Dashboard with daily/monthly stats
- Interactive profit charts
- Date range filtering
- CSV export

## 🗄️ Data Models

```
Person  → balance (+ = they owe us, - = we owe them)
Transaction → linked to Person, affects balance
Payment → linked to Person + Account, affects both
Account → cash/bank balance tracking
```

## 🛠️ Tech Stack
- **Frontend:** React 18 + Vite + Tailwind CSS + Recharts
- **Backend:** Node.js + Express
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (admin-only)
- **Deploy:** Docker + Nginx
