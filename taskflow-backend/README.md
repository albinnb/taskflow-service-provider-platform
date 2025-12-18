# TaskFlow MERN Backend (TaskFlow-backend)

TaskFlow is a professional MERN-stack platform designed to connect local service providers (Taskers) with customers. This backend handles the core logic for user authentication, multi-step provider onboarding, service management, and secure payment processing.

## 🚀 Features
- **Secure Authentication**: JWT-based login and signup with role-based access control (Customer/Provider).
- **Multi-Step Provider Onboarding**: Structured flow for Business Address, Availability/Schedule, and Service Setup.
- **Payment Integration**: Secure transaction handling via **Razorpay Sandbox** (Test Mode).
- **Automated Seeding**: Quick-start database scripts to populate service categories and test users.
- **Security**: Implementation of Helmet, CORS, and Rate Limiting for API protection.

## ⚙️ Setup and Installation

### 1. Prerequisites
* **Node.js**: v18 or higher
* **MongoDB**: A local instance or a MongoDB Atlas Cloud Cluster
* **Razorpay**: A developer account for access to Test API Keys

### 2. Installation

# Clone the repository
git clone <your-repository-url>

# Navigate to the backend directory
cd taskflow/taskflow-backend

# Install dependencies
npm install

### 3. Setting up the Backend
Open a terminal in the `taskflow-backend` folder:

# Install dependencies
npm install

# IMPORTANT: Setup Configuration
# 1. Look for the file: .env.example
# 2. Create a NEW file in the same folder called: .env
# 3. Copy everything from .env.example into .env
# 4. Replace the placeholders with your actual MongoDB and Razorpay keys.

# Seed the database (Run this once to create test data/categories)
npm run seed

# Start the Backend server
npm run dev