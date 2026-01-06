# TaskFlow Backend API

The backend for TaskFlow is built with Node.js and Express, providing a robust RESTful API for the platform. It handles authentication, data management, interactions with MongoDB, real-time communication via Socket.io, and payment processing with Razorpay.

## 🚀 Features

-   **Authentication & Authorization**: Secure User/Provider login using JWT and HttpOnly cookies.
-   **Role-Based Access Control (RBAC)**: Middleware to protect routes for Admins, Providers, and Customers.
-   **Service Management**: CRUD operations for services, categories, and availability.
-   **Booking System**: Complete booking flow containing requests, confirmations, and completion statuses.
-   **Real-time Chat**: Socket.io integration for instant messaging between customers and providers.
-   **Payments**: Razorpay integration for creating orders and verifying signatures.
-   **Reviews**: Rating and review system for completed services.
-   **Media Uploads**: Cloudinary integration for handling profile pictures and service images.
-   **Email Notifications**: Transactional emails using Nodemailer.

## 🛠️ Tech Stack

-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Database**: MongoDB (Mongoose)
-   **Authentication**: JSON Web Token (JWT), bcryptjs
-   **Real-time**: Socket.io
-   **Payment Gateway**: Razorpay
-   **File Storage**: Cloudinary (via Multer)
-   **Validation**: Express-Validator, Joi

## ⚙️ Environment Variables

To run this project, you will need to add the following environment variables to your `.env` file. A template is provided in `.env.example`.

`PORT` - Server port (default: 5000)
`NODE_ENV` - Environment (development/production)
`MONGO_URI` - Your MongoDB connection string
`JWT_SECRET` - Secret key for signing tokens
`JWT_EXPIRES_IN` - Token expiration time (e.g., 30d)

**Cloudinary Config**
`CLOUDINARY_CLOUD_NAME`
`CLOUDINARY_API_KEY`
`CLOUDINARY_API_SECRET`

**Razorpay Config**
`RAZORPAY_KEY_ID`
`RAZORPAY_KEY_SECRET`

**Email Config (SMTP)**
`SMTP_HOST`
`SMTP_PORT`
`SMTP_USER`
`SMTP_PASS`
`EMAIL_FROM`

## 🏁 Getting Started

### 1. Installation

Navigate to the backend directory and install dependencies:

```bash
cd taskflow-backend
npm install
```

### 2. Configuration

Create a `.env` file in the `taskflow-backend` directory and populate it with your credentials:

```bash
cp .env.example .env
# Edit .env and add your API keys and Database URI
```

### 3. Database Seeding

Populate your database with initial categories and test data:

```bash
npm run seed
```

### 4. Running the Server

**Development Mode (with auto-reload):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

## 📜 API Documentation

The API is structured around the following resources:

-   `/api/auth` - Authentication routes (Login, Register, Logout)
-   `/api/users` - User profile management
-   `/api/providers` - Provider specific endpoints (Dashboard stats, etc.)
-   `/api/services` - Service listing and management
-   `/api/bookings` - Booking operations
-   `/api/chats` - Chat history and messaging
-   `/api/payments` - Payment processing
-   `/api/upload` - File upload endpoints