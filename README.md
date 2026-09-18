# Farm2Market (SIH 2026 Working Prototype)

**Digital Agricultural Marketplace and Procurement-Intelligence Platform**

> **Official Positioning:** Farm2Market is a lightweight, explainable, multi-stakeholder orchestration layer focused on aggregating demand across buyers and coordinating supply from multiple farmers/FPOs, with farmer-first UX and actionable AI.

---

## 1. Project Overview & Problem Statement

Agricultural supply chains in India suffer from severe fragmentation:
- **Smallholder Farmers & FPOs** lack transparent, direct access to bulk buyers and are vulnerable to commission exploitation.
- **Bulk Buyers** (hotels, restaurants, canteens, hostels) struggle to procure predictable volume, consistent quality, and strict delivery windows from single farmers.
- **Logistics Inefficiencies** cause high empty-mile costs and spoilage of perishable produce.
- **Information Asymmetry** obscures true farmer realisations and freshness provenance.

**Farm2Market** bridges this gap through four core technical engines:
1. **Smart Matching Engine**: Multi-supplier aggregation using knapsack optimization with normalized 5-factor scoring (40% Quantity, 20% Distance, 15% Price, 15% Quality, 10% Reliability = 100%).
2. **Demand Forecasting Engine**: Converts historical patterns, seasonality, and festival surges into actionable decision cards ($\text{AI} \rightarrow \text{Recommendation} \rightarrow \text{Action}$).
3. **Logistics & Route Optimisation Engine**: Google OR-Tools routing with vehicle capacity tracking and freshness-first sequencing.
4. **Trust + Transparency Engine**: Multi-factor trust scores (94/100), tamper-evident Digital Lot Passports with scannable QR codes, and transparent ₹/kg price breakdowns.

---

## 2. Tech Stack

- **Frontend**: Next.js 15+ (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Canvas-Confetti, PWA support, Web Speech API.
- **Backend**: Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy 2.0, Uvicorn, Bcrypt, PyJWT.
- **AI / Optimisation**: Google OR-Tools (Capacitated Vehicle Routing Problem), Scikit-learn, Pandas, NumPy.
- **Database**: SQLite (local zero-setup development fallback) / PostgreSQL 16 (production ready).
- **Traceability**: Python `qrcode` library with base64 embedded QR generation.

---

## 3. Seeded Demo Accounts (Maharashtra Corridor)

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Farmer** | `farmer@farm2market.in` | `farmer123` | Ramesh Patil (Pimpalgaon, Nashik) • KYC Verified |
| **FPO** | `fpo@farm2market.in` | `fpo123` | Sahyadri Farmers Producer Co. (350 members) |
| **Buyer** | `buyer@farm2market.in` | `buyer123` | Taj Green & Grand Hotels Procurement (Mumbai) |
| **Driver** | `driver@farm2market.in` | `driver123` | Suresh Gaikwad (Tata Ace 1.2T • MH 15 EF 9021) |
| **Admin** | `admin@farm2market.in` | `admin123` | Maharashtra Agri-Market Intelligence Directorate |

---

## 4. Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### A. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
*API will be available at `http://127.0.0.1:8000` with Swagger documentation at `http://127.0.0.1:8000/docs`.*

### B. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend will run at `http://localhost:3000`.*

### C. Run Backend Tests
```bash
python -m pytest tests/test_engines.py -v -o pythonpath=backend
```

---

## 5. Demonstration Walkthrough (SIH Judges)

Please consult `docs/demo-flow.md` for the exact 5–7 minute live walkthrough:
1. **Post Requirement (Buyer)**: Request 1,000 kg Grade-A Tomato in Mumbai.
2. **Observe Smart Supply Plan**: 3 suppliers aggregated (400 kg FPO + 350 kg Farmer B + 250 kg Farmer C).
3. **Explainable Matching**: Click *"Why 94%?"* to inspect the 5-factor subscores.
4. **Confirm Order & QR Code**: Generate Digital Lot Passport `LOT-TOM-NK-2609-00421`.
5. **Driver Console**: Inspect vehicle capacity (700/1000 kg), start route, and broadcast an 18-minute delay alert.
6. **Farmer Voice Listing**: Speak in Hindi/Marathi to automatically populate crop and inferred shelf life.
7. **Government Intelligence**: Inspect the Mumbai 1,300 kg deficit card and dispatch FPO buffer stock.

---

## 6. Directory Structure

```
Farmers/
├── backend/
│   ├── app/
│   │   ├── engines/           # Core engines (Matching, Forecasting, Logistics, Trust)
│   │   ├── routers/           # FastAPI REST API endpoints
│   │   ├── auth.py            # JWT and bcrypt security
│   │   ├── config.py          # App settings
│   │   ├── database.py        # SQLAlchemy engine and session
│   │   ├── models.py          # Relational ORM models
│   │   ├── schemas.py         # Pydantic schemas
│   │   └── seed_data.py       # Maharashtra demo data seeder
│   ├── main.py                # FastAPI app entrypoint
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── app/               # Next.js App Router pages
│   │   │   ├── admin/         # Government Intelligence Dashboard
│   │   │   ├── buyer/         # Procurement Requirement & Plan Generator
│   │   │   ├── driver/        # Logistics & Vehicle Capacity Console
│   │   │   ├── farmer/        # Farmer-First UX (Sell, Orders, Earnings, Demand)
│   │   │   ├── fpo/           # FPO Hub & Demand Pool Aggregation
│   │   │   ├── lot/[id]/      # Digital Lot QR Produce Passport
│   │   │   └── marketplace/   # Real-time Filtered Produce Marketplace
│   │   ├── components/        # Shared UI (Navbar, Footer)
│   │   ├── context/           # AppContext (Roles, Languages, Offline Sync)
│   │   └── lib/               # API client, translations (EN/HI/MR), offline storage
│   └── package.json
├── docs/
│   ├── technical-architecture.md
│   └── demo-flow.md
├── tests/
│   └── test_engines.py        # Automated test suite
└── docker-compose.yml
```

---

## 7. Known Limitations & Future Integrations

- **External Integrations**: SMS gateway, WhatsApp alerts, and payment gateways are cleanly abstracted via interface adapters for this prototype.
- **Traffic Feeds**: Simulated delay events model live highway congestion between Nashik and Mumbai corridors.

