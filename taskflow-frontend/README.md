# TaskFlow Frontend

The frontend for TaskFlow is a modern, responsive single-page application built with React and Vite. It provides an intuitive interface for customers to discover services and for providers to manage their business.

## 🚀 Features

-   **Dynamic Service Discovery**: Interactive maps powered by Leaflet to find providers near you.
-   **User Dashboards**: tailored experiences for Customers (Booking history, Profile) and Providers (Booking requests, Stats, Availability).
-   **Real-time Status Updates**: Live updates on booking status changes.
-   **Chat Interface**: Integrated chat UI for communicating with providers.
-   **Responsive Design**: Fully responsive layout built with Tailwind CSS.
-   **Toast Notifications**: Real-time feedback for user actions.

## 🛠️ Tech Stack

-   **Framework**: React (Vite)
-   **Styling**: Tailwind CSS
-   **Maps**: Leaflet, React-Leaflet
-   **HTTP Client**: Axios
-   **Real-time**: Socket.io-client
-   **Forms**: React Hook Form
-   **Icons**: React Icons

## ⚙️ Environment Variables

To run this project, you need to configure the backend API URL. Create a `.env` file in the root of the frontend directory.

`VITE_API_URL` - The full URL of your backend API (e.g., `http://localhost:5000/api`)

## 🏁 Getting Started

### 1. Installation

Navigate to the frontend directory and install dependencies:

```bash
cd taskflow-frontend
npm install
```

### 2. Configuration

Create a `.env` file:

```bash
cp .env.example .env
```

Ensure `VITE_API_URL` points to your running backend instance.

### 3. Running the Application

**Development Mode:**
```bash
npm run dev
```

The application will typically start at `http://localhost:5173`.

**Production Build:**
```bash
npm run build
npm run preview
```
