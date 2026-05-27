# ☕ CampusEats: Smart Campus Restaurant Management

CampusEats is an end-to-end, real-time hospitality management ecosystem designed for high-density campus dining environments. By integrating **Neobrutalist UI/UX** with a complex transactional backend, the system solves the common friction points of shared table ordering, split-bill processing, and dynamic kitchen management.

---

## 🏗 System Architecture & Technology Stack

* **Frontend:** React Native (Expo) featuring persistent state management with `AsyncStorage` and real-time navigation via `react-navigation`.
* **Backend:** Node.js (Express) with an event-driven architecture.
* **Database:** PostgreSQL managed via **Prisma ORM**, ensuring type-safe data handling for inventory, orders, and sessions.
* **Payments:** Stripe Payment Sheets for secure, tokenized multi-user split billing.
* **Real-Time Sync:** WebSockets (via `socket.io`) for live kitchen/admin order updates and density tracking.

---

## 👥 Portal Definitions

### 1. Customer Portal (The Student Experience)

The customer app is the primary interface for dining. Key features include:

* **Table Sessioning:** Students scan a unique QR code matrix at their table to initialize a shared session. Friends can join the same table session using a 4-digit code.
* **Interactive Customizations:** A dynamic modal system for item configuration. Users can add kitchen notes (e.g., "no lettuce") or select specific options (e.g., "Oat Milk" for coffee).
* **Fractional Bill Splitting:** Unlike standard POS systems, CampusEats allows users to pay for a specific fraction of an order. The backend logic automatically splits the row in the database, marking the user's portion as `PAID` while spawning a new `PENDING` row for remaining units.
* **Loyalty Integration:** Real-time point tracking ($1 = 10 pts) with dynamic progress bar visualizers.

### 2. Staff Portal (The Operational Interface)

Built to maximize efficiency in high-pressure campus kitchens:

* **Live Table Map:** Provides staff with an overhead view of table states:
* 🔴 **Occupied:** Active session.
* 🟡 **Cleaning:** Paid but not yet reset.
* 🟢 **Empty:** Ready for new guests.


* **Order Preparation:** One-tap status updates. Tapping "Order Ready" triggers an event-driven notification loop to the student's app, reducing front-of-house bottlenecks.

### 3. Admin Portal (The Business Intelligence Suite)

The central command center for branch managers:

* **Inventory & Menu Management:** Updates here are reflected globally and instantaneously in the customer app. The system supports inventory-linked recipe deductions—selling a burger automatically deducts the precise amount of buns and patties from the pantry ledger.
* **Live Bulletin Dispatches:** A custom broadcast engine that pushes announcements to a horizontally-scrolling carousel on the customer homepage, facilitating flash sales or menu updates.
* **Discount Logic:** A robust coupon engine supporting fixed or percentage discounts, restricted by product sector (Coffee, Burgers, etc.) and minimum spend thresholds.

---

## 🗺 API Interaction Flow

| Action Layer | Method | Core Logic |
| --- | --- | --- |
| **Session Initialization** | `POST` | Validates QR code, opens a new database session, and generates a short-lived join code. |
| **Customized Ordering** | `POST` | Injects item ID, quantity, and stringified kitchen preference metadata into `OrderItem`. |
| **Split-Payment Processing** | `POST` | Parses the `splitPayload` object to calculate exact costs; creates new row for unpaid balance. |
| **Inventory Deduction** | `PATCH` | Transactional rollback-safe decrementing based on item-ingredient recipe maps. |
| **Live Dispatch** | `GET` | Public-facing endpoint allowing customer app synchronization without requiring admin role auth. |

---

## ⚠️ Key Design Decisions

* **Transactional Integrity:** Every order payment is wrapped in a **Prisma Transaction (`$transaction`)**. This ensures that if a partial payment succeeds, the database splitting logic, inventory deduction, and loyalty point awarding either *all* happen or *none* happen, preventing inventory mismatch.
* **Local Caching:** We use `AsyncStorage` as a high-performance read cache for menu, tables, and news data, significantly reducing API latency and ensuring the UI remains snappy even under poor campus Wi-Fi conditions.
* **Neobrutalism UI:** The visual language uses high-contrast borders, solid shadows, and clear grid layouts to communicate status (e.g., Table Status, Loyalty Tier) immediately to the user.

---

### 🚀 Getting Started

1. **Clone & Install:** `npm install` in both `backend` and `frontend`.
2. **Env Config:** Configure `DATABASE_URL` (PostgreSQL) and `STRIPE_SECRET_KEY` in the backend `.env`.
3. **Database Sync:** Run `npx prisma db push` to initialize the relational maps.
4. **Launch:** Start the backend node server and use `npx expo start` for the frontend client.