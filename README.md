# TaskFlow - On-Demand Service Platform 👷‍♂️🏠

A modern, full-stack platform connecting local service providers (plumbers, electricians, cleaners) with customers. Built with the MERN stack and optimized for high performance.

![TaskFlow Hero](https://images.unsplash.com/photo-1678132218412-0f18fab9b537?w=1200&auto=format&fit=crop&q=80)

## 🚀 Key Features

*   **Role-Based Dashboards**: Custom interfaces for Customers, Providers, and Admins.
*   **Real-time Booking**: Seamless scheduling and status updates.
*   **Secure Payments**: Integrated with Razorpay/Stripe (Sandbox).
*   **Geospatial Search**: Find providers near you (MongoDB Geospatial queries).
*   **Performance Optimized**: 
    *   **LCP:** 0.46s (Instant Load) ⚡
    *   **PWA Ready**: Mobile-responsive design.

## 🛠️ Tech Stack

*   **Frontend**: React, Vite, TailwindCSS, Framer Motion
*   **Backend**: Node.js, Express.js, Socket.io
*   **Database**: MongoDB Atlas
*   **Authentication**: JWT (HttpOnly Cookies) + BCrypt

## ⚡ Performance

Achieved **World-Class Performance Scores** in production:
*   **Performance:** 96/100
*   **Best Practices:** 100/100
*   **Accessibility:** 89/100

## 📦 Getting Started

### Prerequisites
*   Node.js (v18+)
*   MongoDB URI
*   Cloudinary & Razorpay Keys

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/taskflow.git
cd taskflow

# Install Backend
cd taskflow-backend
npm install

# Install Frontend
cd ../taskflow-frontend
npm install
```

### 2. Configure Environment
Create `.env` in both folders (see `.env.example`).

**Backend `.env`**:
```env
PORT=5000
MONGO_URI=your_mongo_url
JWT_SECRET=your_secret
CLIENT_URL=http://localhost:5173
```

**Frontend `.env`**:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Run Locally

**Backend**:
```bash
cd taskflow-backend
npm run dev
```

**Frontend**:
```bash
cd taskflow-frontend
npm run dev
```

Visit `http://localhost:5173` to view the app.

---
*Built as a Final Year Project by Albin B.*