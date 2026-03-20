# ☕ CampusEats - Technical Guide

CampusEats is a real-time restaurant management system built with **Node.js**, **PostgreSQL (Prisma)**, and **React Native (Expo)**. 

## 🛠 Prerequisites
Before starting, ensure you have the following installed:
* **Node.js** (v18 or higher)
* **PostgreSQL** (Running locally or on a Docker container)
* **Expo Go App** (On your physical iOS/Android device)

---

## 🚀 Quick Start for Developers

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd CampusEats

# Install Backend dependencies
cd backend && npm install

# Install Frontend dependencies
cd ../frontend && npm install
```

### 2. Environment Setup
Create a `.env` file inside the `/backend` folder. Add your local database connection string:
```text
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/campuseats?schema=public"
```

### 3. Sync Database
Run the following inside the `/backend` folder to create the tables in your local PostgreSQL:
```bash
npx prisma db push
```

### 4. Run the Project
**Terminal 1 (Backend):**
```bash
cd backend
node index.js
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npx expo start
```
*Scan the QR code with your **Expo Go** app. Ensure your phone and computer are on the **same Wi-Fi network**.*

---

## 👥 User Guides by Role

### 1. Customer Portal 📱
* **Entry:** Choose **Sign In**, **Register**, or **Continue as Guest**.
* **Table Access:** * **Scan QR:** Generates a unique 4-digit **Table Code** (e.g., `XY72`).
    * **Join Table:** Friends enter `XY72` to join the same shared cart.
* **Splitting the Bill:** Use the **Selection Tool** (checkboxes) to claim specific items you want to pay for.
* **Notifications:** Receive a push alert when Staff marks your order as **"Ready"**.

### 2. Staff Portal 📋
* **Secure Login:** Credentials + **OTP** verification required for entry.
* **Live Table Map:** * **Red (Occupied):** Guests are currently at the table.
    * **Yellow (Cleaning):** Guests have paid; table needs clearing.
    * **Green (Empty):** Table is reset and visible to customers.
* **Order Preparation:** Click **"Order Ready"** to notify customers for pickup.

### 3. Owner/Admin Portal 🔐
* **Staff Control:** Add, update, or remove employee accounts.
* **Inventory Management:** Update stock levels; items with 0 stock are hidden from customers.
* **Promotions:** Create and manage active discount coupons.

---

## 🛠 API Interaction Flow

| Action | Endpoint | Method | Key Logic |
| :--- | :--- | :--- | :--- |
| **Login/Auth** | `/api/auth/login-signup` | `POST` | Role-based gatekeeping (OTP vs. Direct). |
| **Start Session** | `/api/tables/open-session` | `POST` | Sets table to `OCCUPIED` & generates code. |
| **Claim Item** | `/api/orders/claim-item` | `PATCH` | For individual item-based bill splitting. |
| **Reset Table** | `/api/staff/set-empty` | `PATCH` | Switches status from `CLEANING` to `EMPTY`. |

---

### Important Developer Note
Since we are using physical devices for testing, **do not use `localhost`** in your frontend API calls. Use your computer's **Local IP Address** (e.g., `192.168.1.XX`) so the Expo Go app can reach your local Node.js server.
