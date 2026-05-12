# ForexPro — Forex Money Exchange Management System

A full-stack MERN application for managing Forex/Money Exchange operations.

## Tech Stack
- **Frontend**: React (Vite) + Tailwind CSS + Redux Toolkit
- **Backend**: Node.js + Express.js + MongoDB
- **Auth**: JWT Authentication with role-based access
- **Exports**: Excel (xlsx) + PDF (jsPDF + autoTable)

## Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)

### 1. Clone / Extract the project

### 2. Setup Server
```bash
cd server
cp .env.example .env
# Edit .env and set your MONGO_URI and JWT_SECRET
npm install
node seed.js        # Creates default admin user
npm run dev         # Starts server on port 5000
```

### 3. Setup Client
```bash
cd client
npm install
npm run dev         # Starts frontend on port 5173
```

### 4. Login
- URL: http://localhost:5173
- Email: admin@forexpro.com
- Password: password123

## Features
- Dashboard with profit charts and summaries
- Riyal (SAR) transactions — buy/sell with auto profit calculation
- Dirham (AED) transactions — buy/sell with payment tracking
- PKR transactions with margin-based profit
- Advance records with partial deduction support
- Riyal-to-Saudi conversion with 0.95 factor and weighted average rate
- Loan management (given & taken) with repayment tracking
- Village Account ledger with deposit/withdrawal history
- Profit management with hide/show toggle and reset
- Full Excel & PDF export on every module
- Dark/Light mode
- JWT auth with role-based access (admin, manager, viewer)

## API Endpoints
- `POST /api/auth/register` — Register user
- `POST /api/auth/login` — Login
- `GET /api/dashboard` — Dashboard stats
- `GET/POST /api/riyal` — Riyal transactions
- `GET/POST /api/dirham` — Dirham transactions
- `GET/POST /api/pkr` — PKR transactions
- `GET/POST /api/advance` — Advance records
- `GET/POST /api/loans` — Loan management
- `GET/POST /api/village` — Village account
- `GET /api/profit/summary` — Profit summary
- `POST /api/reports/generate` — Generate Excel reports

## Folder Structure
```
forexpro/
├── server/
│   ├── models/         MongoDB schemas
│   ├── controllers/    Business logic
│   ├── routes/         API routes
│   ├── middleware/     Auth middleware
│   ├── utils/          Excel exporter, profit calculator
│   ├── index.js        Entry point
│   └── seed.js         Seed admin user
└── client/
    ├── src/
    │   ├── pages/      All page components
    │   ├── components/ Reusable UI components
    │   ├── store/      Redux store + slices
    │   ├── utils/      API client, formatters, exporters
    │   └── hooks/      Custom hooks
    └── index.html
```
