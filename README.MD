

# CampusEats: Smart Campus Restaurant Management

CampusEats is an end-to-end, real-time hospitality management ecosystem designed for high-density campus dining environments. By integrating a Neobrutalist UI/UX with a complex transactional backend, the system solves the common friction points of shared table ordering, split-bill processing, and dynamic kitchen management.



## System Architecture & Technology Stack

* **Frontend:** React Native (Expo) featuring persistent state management with `AsyncStorage` and real-time navigation via React Navigation.
* **Backend:** Node.js (Express) with an event-driven architecture.
* **Database:** PostgreSQL managed via Prisma ORM, ensuring type-safe data handling for inventory, orders, and sessions.
* **Payments:** Stripe Payment Sheets for secure, tokenized multi-user split billing.
* **Real-Time Sync:** WebSockets (via Socket.io) for live kitchen/admin order updates and density tracking.



## Development Methodology

This project was developed utilizing an **Agile, Component-Driven Methodology**. The workflow prioritized rapid iteration and tight integration between the mobile client and the RESTful backend.

The system architecture is fundamentally **Event-Driven**. Rather than relying on constant client-side polling, the backend acts as the central source of truth, emitting state changes (e.g., an order moving from "Pending" to "Ready") via WebSockets. This ensures absolute data consistency across multiple concurrent users, administrators, and kitchen staff, while significantly reducing unnecessary API payloads and server load.


## Portal Definitions

### 1. Customer Portal (The Student Experience)

The customer app is the primary interface for dining. Key features include:

* **Table Sessioning:** Students scan a unique QR code matrix at their table to initialize a shared session. Friends can join the same table session using a 4-digit code.
* **Interactive Customizations:** A dynamic modal system for item configuration. Users can add kitchen notes (e.g., "no lettuce") or select specific options (e.g., "Oat Milk" for coffee).
* **Fractional Bill Splitting:** Unlike standard POS systems, CampusEats allows users to pay for a specific fraction of an order. The backend logic automatically splits the row in the database, marking the user's portion as `PAID` while spawning a new `PENDING` row for remaining units.
* **Loyalty Integration:** Real-time point tracking with dynamic progress bar visualizers.

### 2. Staff Portal (The Operational Interface)

Built to maximize efficiency in high-pressure campus kitchens:

* **Live Table Map:** Provides staff with an overhead view of table states (Occupied, Cleaning, Empty).
* **Order Preparation:** One-tap status updates. Tapping "Order Ready" triggers an event-driven notification loop to the student's app, reducing front-of-house bottlenecks.

### 3. Admin Portal (The Business Intelligence Suite)

The central command center for branch managers:

* **Inventory & Menu Management:** Updates here are reflected globally and instantaneously in the customer app. The system supports inventory-linked recipe deductions—selling a burger automatically deducts the precise amount of buns and patties from the pantry ledger.
*  **Staff Management:** Managers has full crud control over the staff accounts.
* **Live Bulletin Dispatches:** A custom broadcast engine that pushes announcements to a horizontally-scrolling carousel on the customer homepage, facilitating flash sales or menu updates.
* **Discount Logic:** A robust coupon engine supporting fixed or percentage discounts, restricted by product sector and minimum spend thresholds.
* **Logs & Density Tracking:** This system handles both of them with websockets data flow from the customer portal constantly. Admin can be able to filter data on this page for specific timelines.


## API Interaction Flow

| Action Layer | Method | Core Logic |
| --- | --- | --- |
| **Session Initialization** | `POST` | Validates QR code, opens a new database session, and generates a short-lived join code. |
| **Customized Ordering** | `POST` | Injects item ID, quantity, and stringified kitchen preference metadata into `OrderItem`. |
| **Split-Payment Processing** | `POST` | Parses the `splitPayload` object to calculate exact costs; creates new row for unpaid balance. |
| **Inventory Deduction** | `PATCH` | Transactional rollback-safe decrementing based on item-ingredient recipe maps. |
| **Live Dispatch** | `GET` | Public-facing endpoint allowing customer app synchronization without requiring admin role auth. |



## Key Design Decisions

* **Transactional Integrity:** Every order payment is wrapped in a **Prisma Transaction (`$transaction`)**. This ensures that if a partial payment succeeds, the database splitting logic, inventory deduction, and loyalty point awarding either *all* happen or *none* happen, preventing inventory data mismatches.
* **Local Caching:** `AsyncStorage` is utilized as a high-performance read cache for menu, tables, and news data, significantly reducing API latency and ensuring the UI remains responsive even under poor campus Wi-Fi conditions.
* **Neobrutalism UI:** The visual language uses high-contrast borders, solid shadows, and clear grid layouts to communicate status (e.g., Table Status, Loyalty Tier) immediately to the user.



## Local Development & Setup Guide

To run the CampusEats ecosystem on your local machine, follow these steps strictly. Because the Expo Go mobile application needs to communicate with your local machine's backend, we will use **Ngrok** to create a secure tunnel.

### Prerequisites

* **Node.js** (v18 or higher recommended)
* **PostgreSQL** (Running locally or via a cloud provider like Supabase/Neon)
* **Ngrok** (Download and install from [ngrok.com](https://ngrok.com/download) if you do not have it)
* **Expo CLI** (Mobile development environment)

### Phase 1: Backend & Database Initialization

1. **Navigate to the backend directory and install dependencies:**
```bash
cd backend
npm install

```


2. **Configure Environment Variables:**
Open the `.env` file in the `backend` directory and ensure your database and payment keys are set:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/campuseats_db"
STRIPE_SECRET_KEY="sk_test_..."
JWT_SECRET="your_secure_secret"
TWILIO_ACCOUNT_SID=AC512312312...
TWILIO_AUTH_TOKEN=512412312...
TWILIO_VERIFY_SERVICE_SID=VA3123123...
```


3. **Initialize the Database via Prisma:**
Push the Prisma schema to your PostgreSQL database to create the necessary tables and relationships:
```bash
npx prisma generate
npx prisma db push

```


4. **Start the Backend Server:**
```bash
npm start

```


*Note: Ensure you note the port the server is running on (e.g., port 3000).*

### Phase 2: Exposing the Localhost via Ngrok

Mobile devices (or emulators) cannot natively resolve `localhost` to your computer's backend. Ngrok bridges this gap.

1. Open a **new** terminal window.
2. Start an Ngrok HTTP tunnel targeting your backend port (assuming port 3000):
```bash
ngrok http 3000

```


3. Ngrok will generate a public "Forwarding" URL that looks like this:
`https://a1b2-34-56-78-90.ngrok-free.app`
**Copy this HTTPS URL.** Do not close this terminal, as it keeps the tunnel alive.

### Phase 3: Frontend Configuration & Launch

1. **Navigate to the frontend directory and install dependencies:**
```bash
cd frontend
npm install

```


2. **Update the API Configuration:**
You must point the mobile application to your new Ngrok tunnel. Locate your configuration file (e.g., `frontend/src/config.js` or `frontend/.env`).
Replace the existing local IP or old URL with the new Ngrok URL you copied in Phase 2:
```javascript
// Inside config.js
// Replace this with the URL shown in your ngrok terminal (make sure no trailing slash /)
const NGROK_URL = "https://devtest.ngrok-free.dev"; 
export const SOCKET_URL = NGROK_URL; 
// BASE_URL for your REST fetch calls
export const BASE_URL = `${SOCKET_URL}/api`; 
// ... other endpoints

```


3. **Start the Expo Development Server:**
```bash
npx expo start

```


4. **Run the Application:**
* Scan the QR code provided in the terminal using the **Expo Go** app on your physical iOS/Android device.
* Alternatively, press `a` for Android Emulator or `i` for iOS Simulator directly within the terminal.