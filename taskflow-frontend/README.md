# TaskFlow Frontend (taskflow-frontend)

This is the React-based frontend for the TaskFlow platform, built with Vite and Tailwind CSS. It provides the interface for service discovery, provider onboarding, and booking management.

## 🚀 Features
- **Provider Onboarding**: Multi-step setup for business address and scheduling.
- **Customer Booking**: Browse services by category and book with real-time feedback.
- **Payment Integration**: Secure test payments via Razorpay.
- **Responsive UI**: Optimized for both mobile and desktop views.

## ⚙️ Setup and Installation

### 1. Installation
Open a terminal in the `taskflow-frontend` folder:
```bash
# Install dependencies
npm install

# Setup Configuration
# 1. Create a NEW file called .env
# 2. Copy the contents of .env.example into .env
# 3. Update VITE_API_URL if your backend is running on a different port.