# Farm2Market: Recommended 5–7 Minute SIH Live Demonstration Flow

Follow this exact sequence to demonstrate all major platform capabilities to hackathon evaluators.

---

### Step 1: Open the Application & Note Positioning (0:00 – 0:45)
- Open `http://localhost:3000` in the browser.
- Point out the top **SIH 2026 Prototype** utility bar with the **Role Switcher** (Farmer | FPO | Buyer | Driver | Admin), **Language Selector** (English, हिंदी, मराठी), and **Data Saver** mode.
- Highlight product positioning: *A lightweight, explainable, multi-stakeholder orchestration layer.*
- Show the visual flow: **Farmer/FPO → Smart Matching → Demand Pool → Optimised Logistics → Buyer**.

---

### Step 2: Buyer Flow — Post Requirement & Multi-Supplier Matching (0:45 – 2:15)
- Switch role to **Buyer** (or click *"Post a Requirement"*).
- Enter standard SIH demonstration parameters:
  - **Commodity**: `Tomato`
  - **Required Quantity**: `1000 kg`
  - **Quality Grade**: `Grade A`
  - **Location**: `Mumbai`
  - **Delivery Date**: `20 Sept 2026`
- Click **"Find Supply"**.
- Point out the knapsack solver animation: *"Analysing available supply across verified farmers & FPOs..."*
- Show the **Smart Supply Plan Ready**:
  - **Required**: 1,000 kg | **Matched**: 1,000 kg | **Suppliers**: 3 | **Average Price**: ₹25.05/kg | **Pickup Points**: 3
  - **Matched Suppliers**:
    1. *Sahyadri Farmers FPO* — 400 kg (Nashik)
    2. *Ramesh Patil (Farmer)* — 350 kg (Pimpalgaon)
    3. *Godavari Agro Collective* — 250 kg (Niphad)
- Click **"Why 94%?"** on any supplier:
  - Explain the 5-factor normalized weights: Quantity (40%), Distance (20%), Price (15%), Quality (15%), Reliability (10%).
- Show the **Transparent Price Breakdown**:
  - Buyer Price: ₹32/kg = Farmer Realisation (₹25) + Logistics (₹4) + Platform (₹2) + Packaging (₹1).
- Click **"Confirm Procurement Plan"** (triggering confetti and Order confirmation).

---

### Step 3: FPO & Demand Pool Aggregation (2:15 – 3:15)
- Click **"FPO Hub"** in the navigation bar.
- Show **Sahyadri Farmers Producer Co.** (350 members, 5 collection centers, Trust: 97/100).
- Show the active **Demand Pool**:
  - `POOL-TOM-MUM-260901`: 1,000 kg Tomato aggregated across Taj Grand Hotels (500 kg), Spice Court (300 kg), and IIT Bombay Hostels (200 kg).
  - Explain the benefits: **14.2% bulk pricing savings**, **40% fewer trips**, and guaranteed smallholder absorption.

---

### Step 4: Driver Logistics & Freshness-First Route (3:15 – 4:15)
- Switch to the **Driver Route** portal (`/driver`).
- Point out the primary action: **"START ROUTE"**.
- Inspect the **Vehicle Capacity Meter**:
  - Capacity: 1,000 kg | Loaded: 700 kg | Available: 300 kg.
  - Notice the intelligent notice: *"Next Pickup: Farmer C (300 kg) — Vehicle will be full after this pickup."*
- Click **"Report 18-Min Traffic Delay"**:
  - Show immediate alert broadcast: *"⚠ Delivery may be delayed by 18 minutes (Kasara Ghat corridor). New ETA: 11:48 AM."*

---

### Step 5: Digital Lot & Produce Passport Traceability (4:15 – 5:15)
- Click **"Lot Traceability"** (`/lot/LOT-TOM-NK-2609-00421`).
- Show the scannable **QR code**, batch origin (Nashik, Maharashtra), and harvest timestamp (15 Sept, 6:30 AM).
- Walk down the step-by-step provenance audit trail:
  1. *Farm Harvest & Selection* (Ramesh Patil)
  2. *FPO Aggregation & Sorting* (Sahyadri FPO)
  3. *Quality Clearance* (Krishi Vigyan Inspector)
  4. *In Transit* (Driver Suresh Gaikwad, Route RT-MH-01)
  5. *Destination Receiving Hub* (Navi Mumbai)

---

### Step 6: Farmer Experience — Voice Listing & Earnings (5:15 – 6:15)
- Switch to **Farmer Portal** (`/farmer`).
- Demonstrate the 4 simple tabs: **Sell | Orders | Earnings | Demand**.
- In **Sell**:
  - Show the **"Try Hindi Demo"** voice button (populates *"Mere paas 500 kilo tomato hai, grade A"* and automatically infers shelf life of 5 days).
  - Show the offline capability banner: *"Offline Mode — will sync automatically when online"*.
- In **Earnings**:
  - Show metrics: Sold: 2,450 kg | Revenue: ₹68,500 | Average Realised Price: **₹27.95/kg (+12% vs previous period)**.
- In **Demand**:
  - Show the AI Recommendation: *"Demand expected to rise in Mumbai (+26%). [List Additional Supply]"*.

---

### Step 7: Government / Admin Intelligence (6:15 – 7:00)
- Switch to **Admin Dashboard** (`/admin`).
- Show the regional supply-demand gap overview:
  - **Mumbai**: Demand 8,200 kg vs Supply 6,900 kg $\rightarrow$ **1,300 kg Shortage**.
- Click the Mumbai shortage card to display the **Action Recommendation**:
  - *"Nearby FPO supply in Nashik can potentially cover the shortage. Authorize inter-district dispatch."*
- Conclude the demo!

