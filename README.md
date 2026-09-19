# KisanKart 🌾🛒

**Empowering Indian Agriculture through Direct Farmer-to-Consumer Digital Trade & Intelligent Supply Chain Orchestration**

> **Smart India Hackathon (SIH 2026) Working Prototype**  
> *A production-grade, explainable, multi-stakeholder platform connecting Farmers, FPOs, Consumers, Bulk Buyers, and Operations Administrators.*

---

## 🌟 Executive Summary

Traditional agricultural supply chains in India suffer from acute structural fragmentation, opaque middleman commissions, and high logistics spoilage:
- **Smallholder Farmers & FPOs** frequently receive below-MSP realisations, lack direct market access, and face high commission markups.
- **Consumers & Institutional Buyers** (restaurants, hotels, canteens) face volatile pricing, inconsistent quality, and delayed delivery windows.
- **Logistics & Aggregation** are plagued by empty-return trips and lack of route optimization for perishable commodities.

**KisanKart** solves these challenges by combining a farmer-first multilingual interface, direct consumer e-commerce, algorithmic multi-stop logistics routing, and transparent real-time price discovery.

---

## 🏛️ System Architecture: Three Dedicated Portals

KisanKart segregates platform workflows into three tailored experiences:

```
                               ┌──────────────────────────────────────────────┐
                               │           KisanKart Gateway                  │
                               └──────────────────────┬───────────────────────┘
                                                      │
             ┌────────────────────────────────────────┼────────────────────────────────────────┐
             ▼                                        ▼                                        ▼
┌─────────────────────────┐              ┌─────────────────────────┐              ┌─────────────────────────┐
│     Farmer / FPO        │              │    Consumer / Buyer     │              │    Operations & Admin   │
│        Portal           │              │       E-Commerce        │              │         Center          │
├─────────────────────────┤              ├─────────────────────────┤              ├─────────────────────────┤
│ • Produce Lot Listings  │              │ • Live Fresh Produce    │              │ • Dynamic Pricing Rules │
│ • AI Voice-to-Listing   │              │ • Direct Farm-to-Fork   │              │ • Regional Demand AI    │
│ • MSP & Price Breakdown │              │ • Cost Breakdown (₹/kg) │              │ • OR-Tools Fleet Routing│
│ • FPO Collective Buffer │              │ • QR Digital Lot Passes │              │ • Driver Dispatch & Map │
│ • Direct UPI Earnings   │              │ • Bulk Demand Pooling   │              │ • Audit & Governance    │
└─────────────────────────┘              └─────────────────────────┘              └─────────────────────────┘
```

### 1. 🌾 Farmer / FPO Portal (`/farmer/dashboard`)
- **Farmer-First UX**: Voice-assisted listing in English, Hindi, and Marathi (via Web Speech API) allowing rural farmers to list crops hands-free.
- **Transparent Price Discovery**: Instant visualization of farmer gross payout, platform processing fee (2%), and logistics costs.
- **FPO Collective Hub**: Allows Farmer Producer Organizations to aggregate volume from hundreds of marginal farmers into commercial-grade lots.
- **Direct UPI Payout Tracking**: Live tracking of direct bank settlements without third-party commission deductions.

### 2. 🛒 Consumer / Buyer E-Commerce Portal (`/shop`, `/shop/cart`, `/buyer/requirement`)
- **Direct Farm Fresh Marketplace**: Consumers browse verified crop listings direct from local farmers and FPOs.
- **Traceability & Provenance**: Every item is backed by a **Digital Lot Passport** (`LOT-CROP-YYYYMMDD-XXXXX`) with a tamper-evident QR code showing farm origin, harvest date, grade, and shelf-life.
- **Bulk Institutional Procurement**: Hotels and hostels can post multi-ton requirements and instantly receive optimized multi-farmer aggregation plans.
- **Offline Resilience & Data-Saver**: Built-in PWA offline caching and low-bandwidth image compression modes for rural connectivity.

### 3. 🛡️ Private Admin & Operations Center (`/admin/dashboard`, `/admin/login`)
- **Operations Console**: Secure role-based management for platform operators, logistics coordinators, and evaluators.
- **Dynamic Pricing Engine**: Automated ceiling/floor rules, perishable shelf-life discounts, and surge pricing controls.
- **AI Demand Forecasting**: Machine learning models predicting regional demand spikes (festivals, wedding seasons) and translating them into actionable decision cards.
- **Google OR-Tools Logistics**: Multi-stop Capacitated Vehicle Routing Problem (CVRP) optimizer with vehicle capacity meters and delay notifications.
- **Immutable Audit Trail**: Chronological event logs for price rule modifications, dispatch assignments, and KYC approvals.

---

## ⚙️ The Four Core Technical Engines

### A. Multi-Supplier Smart Matching Engine
- Utilizes knapsack-based combinatorial optimization to aggregate supply across multiple smallholder farmers to fulfill large bulk orders.
- Evaluates listings across a normalized 5-factor scoring model:
  $$\text{Score} = (0.40 \times \text{Quantity}) + (0.20 \times \text{Distance}) + (0.15 \times \text{Price}) + (0.15 \times \text{Quality}) + (0.10 \times \text{Reliability})$$
- Features an **Explainable AI** popup explaining the exact mathematical score to buyers.

### B. AI Demand Forecasting Engine
- Combines historical purchase records, commodity price trajectories, and upcoming festival spikes (e.g. Ganesh Chaturthi, Diwali).
- Generates actionable decision cards: $\text{Forecast} \rightarrow \text{Recommendation} \rightarrow \text{One-Click Action}$ (e.g., dispatching FPO buffer stock to alleviate a 1,300 kg tomato deficit in Mumbai).

### C. Logistics & Route Optimisation Engine
- Powered by **Google OR-Tools** solving the Capacitated Vehicle Routing Problem (CVRP) with Freshness-First constraints.
- Coordinates multi-point farmer pickups, live vehicle load tracking (e.g., 700 / 1000 kg), and dynamic delay recalculations.

### D. Trust & Traceability Engine
- Digital Lot Passports encoded with scannable QR codes containing cryptographic harvest and quality data.
- 100% transparent fee breakdowns: Base Farmer Rate + Logistics Transport + 2% Platform Maintenance.

---

## 💻 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | **Next.js 15+** (App Router), **React 19**, **TypeScript**, **Tailwind CSS**, **Lucide Icons**, **Recharts**, **Web Speech API**, **PWA / Service Workers** |
| **Backend** | **FastAPI** (Python 3.10+), **Pydantic v2**, **SQLAlchemy 2.0**, **Uvicorn**, **Bcrypt**, **PyJWT** |
| **Database** | **PostgreSQL 16** (Supabase Cloud Database with Connection Pooling) • SQLite (Local dev fallback) |
| **AI / Operations** | **Google OR-Tools** (Routing), **NumPy**, **Pandas**, **Scikit-learn** |
| **Deployment** | **Vercel** (Frontend CI/CD) • **Render** (Backend Web Service) • **GitHub Actions** |

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher
- **Git**

### 2. Clone the Repository
```bash
git clone https://github.com/Psudhanshu-07/KisanKart.git
cd KisanKart
```

### 3. Backend Setup
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- The interactive API documentation will be available at: `http://127.0.0.1:8000/docs`
- Health check endpoint: `http://127.0.0.1:8000/health`

### 4. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
- Open `http://localhost:3000` in your browser.

---

## 👥 Team & Admin Management

KisanKart supports dedicated admin accounts for evaluation and platform administration.

### Creating an Admin Account
To create or update an administrator account, run the CLI utility in the backend directory:
```bash
cd backend
python create_admin.py
```
Follow the prompts to enter:
1. **Admin Email** (e.g., `your.email@gmail.com`)
2. **Admin Name**
3. **Password**

### Logging In
Platform users and team members can sign in through two streamlined entry points:
1. **Unified Login (`/login`)**: Select **Farmer/FPO**, **Consumer**, or **Admin/Team**. Entering valid admin credentials automatically authenticates and routes you straight to `/admin/dashboard`.
2. **Private Admin Console (`/admin/login`)**: A dedicated high-security dark console for platform operations.

---

## 🌐 Production Deployment

### Deploying Frontend to Vercel
1. Import the repository on [Vercel](https://vercel.com).
2. Set the Root Directory to `frontend`.
3. Add the following Environment Variable:
   - `NEXT_PUBLIC_API_URL`: Your deployed Render backend URL (e.g., `https://farm2market-api.onrender.com`).
4. Click **Deploy**.

### Deploying Backend to Render
1. Connect your GitHub repository to [Render](https://render.com).
2. Create a new **Web Service** with the Root Directory set to `backend`.
3. Configure the build and start commands:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   - `DATABASE_URL`: Your Supabase PostgreSQL connection string.
   - `SECRET_KEY`: A secure 32+ character random string.
   - `PYTHON_VERSION`: `3.10.12`

Alternatively, deploy using the included Blueprint: `render.yaml`.

---

## 🧪 Testing

Run backend engine tests and routing benchmarks:
```bash
cd backend
pytest tests/ -v
```

---

## 📄 License & Acknowledgements

Developed for **Smart India Hackathon (SIH 2026)**.  
Designed to support the Digital Agriculture Mission and empower rural farming communities across India.
