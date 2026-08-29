# AgriConnect 🌾
> **Theme:** *Agriculture Reimagined for the Digital Era • Technology Empowering Nature*

**AgriConnect** is an advanced, unified agricultural ecosystem designed to bridge the gaps between core agricultural stakeholders: **Farmers**, **Procurement Buyers**, **Processing Mills**, and **Direct Consumers**. By integrating real-time meteorological data, dynamic pricing engines, interactive map interfaces, and direct messaging portals, AgriConnect removes inefficient intermediaries, ensures fair price discovery, and offers complete transparency from farm to fork.

---

## 💡 Project Idea & Core Vision

Traditional agricultural supply chains are plagued by lack of transparency, price manipulation by middle-men, and information asymmetry. Farmers often harvest without knowing current market demand, while buyers face difficulties sourcing quality produce. 

**AgriConnect** solves this by establishing a decentralized-style collaborative web portal:
* **Nature Meets Technology:** Combining Earth-toned, modern glassmorphic aesthetics with real-time data feeds (like meteorological analytics) to create an intuitive workspace for rural and commercial users alike.
* **Direct Marketplace:** Empowering farmers to list their yields directly to commercial buyers and milling facilities, and allowing end-consumers to purchase chemical-free grains direct from source.
* **Intelligent Coordination:** Leveraging geographic and real-time database synchronization to coordinate logistics, procurement rates, and weather forecasts.

---

## 🏛️ Ecosystem Portals & Features

AgriConnect is structured around four distinct user portals, each custom-tailored to a specific stakeholder's workflow:

### 1. 🚜 Farmer Portal (*Empower Your Yield*)
* **Crop Listings:** Farmers can create, edit, and delete active crop listings specifying type, quantity (in quintals), quality grade, and desired price.
* **Real-Time Weather Forecasts:** Integrates the Open-Meteo API to deliver location-specific weather forecasting (temperature, rain probability, wind speed) to optimize harvesting schedules.
* **Direct Negotiation & Pricing:** Tools to adjust market prices dynamically in response to demand.
* **Interactive Field Mapping:** Set precise farm locations on an interactive map coordinate system to let nearby buyers calculate logistics.

### 2. 🤝 Buyer Portal (*Source with Confidence*)
* **Procurement Dashboard:** Search, filter, and browse verified crop listings by location, price, and quality.
* **Enquiry Management:** Send instant purchase enquiries and custom terms directly to listing farmers.
* **Supplier Tracking:** Map interface to find local producers, reducing transit times and carbon footprint.

### 3. 🏭 Mill Portal (*Process Perfection*)
* **Raw Material Intake:** Manage intake batches of raw crops (paddy, wheat, corn) received from suppliers.
* **Processing Flow:** Tracks processing stages from raw material to finished product.
* **Dynamic Capacity & Rates:** Update processing rates per ton and available mill capacity in real-time.

### 4. 🌾 Consumer Portal (*Farm to Fork*)
* **Healthy Living:** Browse organic, fresh, and chemical-free crop products direct from local farms.
* **Transparent Pricing:** Clear breakdown of pricing from farm source to final product.

---

## 🛠️ Technology Stack

AgriConnect utilizes a lightweight, modern, and highly responsive tech stack:

* **Frontend Framework:** React 18+ with Vite for fast Hot Module Replacement (HMR).
* **Styling & Animation:** Custom Vanilla CSS tailored with modern glassmorphism, responsive grids, and customized animations (including floating pollen particles representing the fusion of nature & data).
* **Backend Services:** **Supabase** (PostgreSQL) integration:
  * **Database Tables:** Structured storage for users (`farmers`, `buyers`, `consumers`, `mills`), `crops` logs, and `enquiries` transaction parameters.
  * **Security Policies:** Row Level Security (RLS) policies configured to manage CRUD access rules.
* **External APIs:** **Open-Meteo API** (free, coordinates-based meteorological prediction engine).

---

## 🚀 Getting Started & Setup

### Prerequisites
* [Node.js](https://nodejs.org/) (v16 or higher)
* [npm](https://www.npmjs.com/)

### Installation & Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rdg17128-eng/AGRI-CONNECT.git
   cd AGRI-CONNECT
   ```

2. **Navigate to the application folder:**
   ```bash
   cd new_app
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Environment Configuration:**
    Create a `.env` file in the `new_app` directory (using `.env.example` as a template) and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=https://gxogbczrbmjlzcadvafu.supabase.co
    VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_gwmcOaotUnRFtC4-fosV0w_9l1gnjs_
    ```

5. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173` to see the application in action.

---

## 🎨 Theme & Visual Philosophy

AgriConnect uses a curated, premium visual scheme designed to wow users:
* **Green & Gold-Brown Color Palette:** Premium agricultural leaf green (`#10b981`) combined with a metallic golden wheat-brown (`#c59b4e`) for highlights, tag badges, and custom glowing borders.
* **Earthy Mesh Backgrounds:** Dark forest green and warm golden-wheat earth-brown radial gradient flows.
* **Interactive Particle System:** Floating, glowing dots on the landing page represent seeds, pollen, and data points floating upwards, symbolizing growth and digital interconnectedness.
* **Glassmorphism:** Frosted translucent cards and modal windows that blend beautifully into the background sunset imagery.
