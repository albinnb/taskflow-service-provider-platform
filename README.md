# TaskFlow - Local Service Provider Platform

TaskFlow is a robust, full-stack MERN application designed to bridge the gap between local service providers (plumbers, electricians, cleaners, etc.) and customers. It features a sophisticated provider onboarding flow, real-time booking management, secure payments, and interactive geospatial service discovery.

## 🌟 Key Features

### For Customers
-   **Service Discovery**: Find providers using interactive maps (Leaflet) and category filters.
-   **Secure Booking**: Book services with specific time slots and durations.
-   **Real-time Chat**: Communicate directly with providers to discuss requirements.
-   **Secure Payments**: Integrated Razorpay payment gateway for seamless transactions.
-   **Reviews & Ratings**: Rate providers and read reviews from other users.

### For Service Providers
-   **Professional Dashboard**: Manage bookings, earnings, and availability.
-   **Profile Management**: Showcase work with a rich profile, including service photos and location.
-   **Availability Control**: Set custom working hours and availability.
-   **Dispute Resolution**: Dedicated flow for handling booking disputes.

## 🛠️ Tech Stack

### Backend
-   **Core**: Node.js, Express.js
-   **Database**: MongoDB (Mongoose)
-   **Authentication**: JWT (JSON Web Tokens)
-   **Real-time**: Socket.io
-   **Payments**: Razorpay
-   **Media**: Cloudinary (Image Uploads)
-   **Email**: Nodemailer

### Frontend
-   **Framework**: React (Vite)
-   **Styling**: Tailwind CSS
-   **Maps**: Leaflet / React-Leaflet
-   **State Management**: React Context API
-   **Notifications**: React-Toastify

## 📂 Project Structure

This monorepo is organized into two main applications:

*   **[Backend (`/taskflow-backend`)](./taskflow-backend)**: The REST API server handling business logic and data persistence.
*   **[Frontend (`/taskflow-frontend`)](./taskflow-frontend)**: The responsive client-side application for user interaction.

## 🚀 Getting Started

To set up the project locally, you need to run both the backend and frontend servers.

### 1. Setup Backend
Go to the **[Backend README](./taskflow-backend/README.md)** for detailed instructions on setting up environment variables, database connection, and seeding data.

### 2. Setup Frontend
Go to the **[Frontend README](./taskflow-frontend/README.md)** for instructions on installing dependencies and connecting to the backend API.

---
*Built with ❤️ by TaskFlow Team*