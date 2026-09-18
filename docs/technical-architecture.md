# KisanKart: Technical Architecture Document (SIH 2026)

## 1. Executive Summary & Product Positioning

**KisanKart** is a digital agricultural marketplace and procurement-intelligence platform that connects **Farmers, FPOs, Buyers** (restaurants, hotels, hostels, institutions, consumers), **Logistics/Drivers**, and **Administrators/Government Stakeholders**.

### Product Positioning
> **KisanKart is a lightweight, explainable, multi-stakeholder orchestration layer focused on aggregating demand across buyers and coordinating supply from multiple farmers/FPOs, with farmer-first UX and actionable AI.**
> We do not claim to have "invented agricultural logistics" or that "nobody else does this." Rather, we eliminate fragmentation, guarantee explainable decisions, ensure transparent farmer realisations, and provide actionable intelligence.

---

## 2. High-Level Architecture Diagram

```
+---------------------------------------------------------------------------------------+
|                                    PRESENTATION LAYER                                  |
|  Next.js 15+ (App Router) | React 19 | Tailwind CSS | PWA Service Worker | Web Speech |
|                                                                                       |
|   +---------------+  +---------------+  +---------------+  +-------------+  +------+  |
|   | Farmer Portal |  | Buyer Portal  |  |   FPO Hub     |  | Driver View |  | Admin|  |
|   | (Voice, Sell, |  | (Post Demand, |  | (Demand Pool, |  | (Capacity,  |  | (Gap |  |
|   |  Earnings)    |  |  Smart Plan)  |  |  Member Agg)  |  |  Route ETA) |  | Map) |  |
|   +---------------+  +---------------+  +---------------+  +-------------+  +------+  |
+-------------------------------------------+-------------------------------------------+
                                            | REST API (HTTP / JSON)
+-------------------------------------------v-------------------------------------------+
|                                    BACKEND ENGINE LAYER                                |
|                           Python FastAPI | Pydantic v2 | Uvicorn                      |
|                                                                                       |
|  +---------------------------------------------------------------------------------+  |
|  | 1. Smart Matching Engine                                                        |  |
|  |    Normalized 5-Factor Knapsack: Quantity (40%), Distance (20%), Price (15%),   |  |
|  |    Quality (15%), Reliability (10%) = 100.0%. Multi-Supplier Aggregation.       |  |
|  +---------------------------------------------------------------------------------+  |
|  | 2. Demand Forecasting Engine                                                    |  |
|  |    Inputs: Seasonality, festivals, arrivals, region. Action Cards Generation.  |  |
|  +---------------------------------------------------------------------------------+  |
|  | 3. Logistics & Route Optimisation Engine                                        |  |
|  |    Google OR-Tools (CVRP) + Freshness-First sequencing + Delay Recalculation.   |  |
|  +---------------------------------------------------------------------------------+  |
|  | 4. Trust & Transparency Engine                                                  |  |
|  |    Multi-stakeholder Trust index, Digital Lot Passport (QR), Price Breakdown.   |  |
|  +---------------------------------------------------------------------------------+  |
+-------------------------------------------+-------------------------------------------+
                                            | SQLAlchemy 2.0
+-------------------------------------------v-------------------------------------------+
|                                      DATA PERSISTENCE                                 |
|  PostgreSQL (Production) / SQLite (Zero-friction local dev) | Browser IndexedDB Cache |
+---------------------------------------------------------------------------------------+
```

---

## 3. The Four Core Technical Engines

### A. Smart Matching Engine (`backend/app/engines/matching_engine.py`)
- **The Problem**: A buyer requests 1,000 kg Grade-A Tomato. Returning a single farmer frequently fails due to smallholder farm size constraints.
- **The Solution**: Multi-supplier aggregation combining multiple farmers and FPOs.
- **Rebalanced Scoring Formula (summing to exactly 100.0%)**:
  $$\text{Score} = 0.40 \cdot S_{\text{qty}} + 0.20 \cdot S_{\text{dist}} + 0.15 \cdot S_{\text{price}} + 0.15 \cdot S_{\text{quality}} + 0.10 \cdot S_{\text{reliability}}$$
- **Explainable Matching**: When the user clicks *"Why 94%?"*, subscores and qualitative verification checkpoints are displayed.

### B. Demand Forecasting Engine (`backend/app/engines/forecasting_engine.py`)
- **Principle**: $\text{AI} \rightarrow \text{Recommendation} \rightarrow \text{Action}$.
- Incorporates regional multipliers (e.g. Mumbai 1.35x, Pune 1.15x) and festival spikes (e.g. Ganesh Chaturthi preparation).
- Generates actionable decision cards across roles:
  - Farmer: *"Good time to list tomato — demand rising +26% in Mumbai. [List Additional Supply]"*
  - Government: *"Supply shortage in Mumbai (1,300 kg deficit). [Dispatch FPO Supply]"*

### C. Logistics & Route Optimisation Engine (`backend/app/engines/logistics_engine.py`)
- **Google OR-Tools**: Models pickup and delivery stops as a Capacitated Vehicle Routing Problem (CVRP).
- **Freshness-First Priority**: Lots with shorter harvest shelf lives are collected and routed earliest.
- **Vehicle Capacity Meter**: Real-time load accounting (e.g., 700 kg loaded / 300 kg available / 1,000 kg capacity).
- **Dynamic Delay Broadcast**: When a driver reports a highway delay (e.g., 18 minutes in Kasara Ghat), route ETA adjusts from 11:30 AM to 11:48 AM, and alerts are dispatched to affected buyers.

### D. Trust & Transparency Engine (`backend/app/engines/trust_engine.py`)
- **Multi-Factor Trust Index**:
  $$\text{Trust} = 0.35 \cdot \text{Fulfilment} + 0.30 \cdot \text{OnTime} + 0.25 \cdot \text{Quality} + 0.10 \cdot (100 - 5 \cdot \text{Cancel})$$
- **Digital Lot / Produce Passport**: Unique lot codes (e.g., `LOT-TOM-NK-2609-00421`) with scannable QR codes showing complete farm-to-buyer provenance.
- **Transparent Price Breakdown**:
  $$\text{Buyer Price ₹32/kg} = \text{Farmer Realisation ₹25} + \text{Logistics ₹4} + \text{Platform ₹2} + \text{Packaging ₹1}$$

---

## 4. Farmer-First UX & Accessibility

1. **Smart Inference Forms**: The system never asks what it can infer. Selecting "Tomato" infers category "Vegetable", unit "kg", and typical shelf life "4–7 days".
2. **Voice Listing**: Browser Web Speech API parses voice phrases like *"Mere paas 500 kilo tomato hai, grade A"* into structured listings.
3. **Offline-First & PWA**: If internet connectivity is interrupted, listings save to local IndexedDB (`f2m_offline_listings`) and automatically synchronize once connectivity is restored.
4. **Localization**: Tri-lingual support in English, Hindi (हिंदी), and Marathi (मराठी).
5. **Data Saver Mode**: Lightweight cached dashboard with compression for rural 2G/3G connectivity.

