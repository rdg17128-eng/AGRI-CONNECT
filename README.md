# KisanConnect 🌾
> **Theme:** *Agriculture Reimagined for the Digital Era • Technology Empowering Nature*

**KisanConnect** is an advanced, unified agricultural ecosystem designed to bridge the gaps between core agricultural stakeholders: **Farmers**, **Procurement Buyers & Processing Mills**, and **Agro-Transport Logistics Providers**. By integrating real-time meteorological data, dynamic pricing engines, camera-based QR verification, digital load receiving manifests, and smart truck-capacity matching, KisanConnect removes inefficient intermediaries, ensures fair price discovery, and offers complete transparency from farm to fork.

---

## 💡 Project Idea & Core Vision

Traditional agricultural supply chains are plagued by lack of transparency, price manipulation by middle-men, and information asymmetry. Farmers often harvest without knowing current market demand, while buyers face difficulties sourcing quality produce. 

**KisanConnect** solves this by establishing a secure, transparent, and connected web portal:
* **Farmer-to-Mill Traceability:** Permanent Enquiry IDs (`KC-2026-XXXXXX`) connect crops directly to verified processing mills.
* **Camera-Based QR Verification:** Accepted farmer enquiries automatically receive a cryptographically signed QR code. Gate operators scan the QR to verify crop authenticity, acreage, quantity, and mill matching before authorizing load entry.
* **Digital Load Receiving:** In-system confirmation turns verified loads into permanent ledger receipts with timestamps.
* **Smart Truck Matching & Logistics:** Haulage requests (`TR-2026-XXXXXX`) automatically match transport providers whose truck capacity (5T, 10T, 15T, 20T+) satisfies the crop load volume.
* **Nature Meets Technology:** Combining Earth-toned, modern glassmorphic aesthetics with real-time data feeds to create an intuitive workspace for rural and commercial users alike.

---

## 🏛️ Ecosystem Portals & Features

KisanConnect is structured around four distinct user portals, each custom-tailored to a specific stakeholder's workflow:

### 1. 🚜 Farmer Portal (*Empower Your Yield*)
* **Crop Listings & Management:** Farmers register, update, and track active crop yields with GPS coordinates and acreage.
* **Nearby Mills Discovery:** Search verified milling facilities buying specific crops, sorted by distance from the farm.
* **Enquiry Dispatch:** Send supply proposals with quantity (Tons), acreage, expected rate, and transport requirements.
* **Crop Verification QR Codes:** Instant access to digital QR codes for accepted enquiries with native Web Share and PNG Download.
* **Load Status Lifecycle:** Visual stepper tracking:
  `PENDING` ➔ `ACCEPTED BY MILL` ➔ `QR GENERATED` ➔ `QR SCANNED` ➔ `LOAD RECEIVED AT MILL` ➔ `COMPLETED`.
* **Transport Fleet & Quotes:** Review haulage bids from verified logistics providers and assign vehicles in one click.
* **Weather & Market Intelligence:** Location-specific forecast and live commodity rates.

### 2. 🏭 Mill & Buyer Portal (*Source with Confidence & Precision*)
* **Farmer Enquiries Inbox:** Real-time stream of incoming farmer supply proposals with distance and transport specs.
* **Instant Acceptance & QR Generation:** Accept enquiries to auto-generate crop verification manifests.
* **Camera-Based QR Scanner:** High-speed mobile and desktop camera scanner (powered by `html5-qrcode`) to authenticate arriving trucks:
  * 🟢 **VERIFIED MATCH:** Authorizes gate entry and load acceptance.
  * 🔴 **NOT MATCHED:** Prevents unauthorized loads or wrong mill routing.
* **Load Receiving Confirmation:** One-tap digital confirmation recording `received_at`, `received_by`, and quantity into permanent records.
* **Loads Received Audit Ledger:** Complete audit table of all received batches.
* **Capacity & Price Management:** Set dynamic buying prices per quintal for cereals, pulses, and oilseeds.

### 3. 🚛 Transport Provider Portal (*Smart Agro-Logistics*)
* **Smart Truck Matching:** Algorithmic filtering ensuring haulage requests are only shown to trucks with sufficient tonnage capacity ($\text{Capacity} \ge \text{Crop Quantity}$).
* **Real-time Quoting:** Submit competitive price quotes and estimated pickup arrival windows.
* **Dispatch & Transit Progression:** Live status transitions:
  `ASSIGNED` ➔ `PICKUP_STARTED` ➔ `CROP_PICKED_UP` ➔ `IN_TRANSIT` ➔ `ARRIVED_AT_MILL` ➔ `DELIVERED`.
* **Fleet Management:** Vehicle registration, tonnage rating, and price per km configurations.

---

## 🔄 The Complete KisanConnect Workflow

```
FARMER                           MILL                           TRANSPORTER
  │                                │                                │
  ├── Register Crop & Find Mill    │                                │
  ├── Send Enquiry (Enquiry ID) ──►│                                │
  │   [Transport: YES]             ├── Review & Accept Enquiry      │
  │◄── Receive Verification QR ────┤   [Auto-Creates Transport Req]─┼──► Receives Request (TR-ID)
  │                                │                                ├── Submits Quote (₹ Price)
  ├── Compares Quotes & Accepts ───┼────────────────────────────────┼──► Vehicle Assigned
  │                                │                                ├── Pickup Started
  │                                │                                ├── Crop Picked Up
  │                                │                                ├── In Transit
  │                                │                                ├── Arrived at Mill Gate
  │                                ├── Mill Scans Farmer QR ◄───────┤
  │                                ├── 🟢 VERIFIED MATCH            │
  │                                ├── Confirms Load Received       │
  │◄── 🟢 LOAD RECEIVED (Realtime) ┼── Status: LOAD_RECEIVED ───────┼──► Delivery Completed
```

---

## 🛠️ Technology Stack

* **Frontend:** React 19 + Vite for ultra-fast HMR and performance.
* **Branding & Assets:** Custom KisanConnect vector SVG identity with golden wheat stalk, emerald sprout, and digital connection nodes.
* **Styling:** Curated Vanilla CSS with glassmorphism, responsive bento grids, and micro-animations.
* **QR Engine:** `qrcode` for vector/raster QR generation + `html5-qrcode` for responsive camera hardware scanning.
* **Mapping:** Leaflet & React-Leaflet for interactive farm plot and mill geo-coordinates.
* **Backend Database:** **Supabase** (PostgreSQL) with Realtime channels, RLS policies, and localized offline resilience.

---

## 🚀 Getting Started & Setup

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [npm](https://www.npmjs.com/)

### Installation & Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rdg17128-eng/AGRI-CONNECT.git
   cd AGRI-CONNECT
   ```

2. **Navigate to the application directory:**
   ```bash
   cd new_app
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Environment Configuration:**
   Verify `.env` has Supabase and weather credentials:
   ```env
   VITE_SUPABASE_URL=YOUR_SUPABASE_URL
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
   VITE_OPENWEATHER_API_KEY=YOUR_OPENWEATHER_API_KEY
   ```

5. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` to explore KisanConnect!

---

## 🎨 Theme & Visual Philosophy

KisanConnect uses a curated, premium visual scheme:
* **Emerald & Gold-Brown Color Palette:** Premium agricultural leaf green (`#10b981`) combined with a metallic golden wheat (`#f59e0b` / `#fbbf24`) for brand highlights, QR containers, and glowing badges.
* **Glassmorphism:** Frosted translucent cards and modal windows that blend into the sunset farmland backdrop.
* **Accessibility:** High-contrast QR codes and intuitive mobile camera scanner viewports.
