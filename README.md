# AssetFlow

AssetFlow is an enterprise-style asset and resource management web application built for hackathon delivery. It combines a React frontend with an Express + MongoDB backend to manage assets, allocations, bookings, maintenance requests, audits, reports, notifications, and organization setup.


#### Deployed Link : https://asset-flow-odoo-hackathon-12th-july.vercel.app/login


## 🚀 Project Overview

This project provides a complete asset lifecycle management solution:
- User authentication and role-based access control
- Asset inventory and category management
- Asset allocation and return tracking
- Resource booking for bookable assets and facilities
- Maintenance request handling and status updates
- Audit cycles and audit item tracking
- Management reports and dashboard analytics
- Notifications and operational alerts
- Department and organization setup for enterprise teams

## 🧩 Tech Stack

- Frontend: React, React Router, Axios
- Backend: Node.js, Express, MongoDB, Mongoose
- Authentication: JWT-based auth with protected API routes
- Email: Nodemailer for password reset emails
- Styling: CSS-based layout with dashboard and card components

## 📁 Repository Structure

```
client/              # React frontend app
server/              # Express API server
  src/
    config/          # DB connection logic
    middleware/      # auth and role middleware
    models/          # Mongoose data models
    routes/          # REST API route handlers
    utils/           # helper utilities and mailer
    seed.js          # sample data seeding script
Readme.md            # project documentation
```

## ✅ Key Features

- Login / Signup / Password Reset
- Role-based access control for `admin`, `asset_manager`, `department_head`, and `employee`
- Dashboard analytics with asset availability, bookings, maintenance, pending requests, and overdue allocations
- Asset register with category management
- Asset allocation and return tracking
- Booking of bookable resources and facilities
- Maintenance request creation and review
- Audit cycle support and audit item tracking
- Reports API for dashboard and utilization data
- Notifications integration for activity updates
- Organization setup for departments and department heads

## 🔐 Roles and Permissions

- `admin` - full access, organization setup, user and department control
- `asset_manager` - asset registration, allocation, and resource management
- `department_head` - reporting access and department oversight
- `employee` - asset usage, booking, and maintenance requests

## ⚙️ Installation

### 1. Prerequisites

- Node.js (14+ recommended)
- MongoDB instance or Atlas cluster
- npm

### 2. Setup Backend

```bash
cd server
npm install
```

Create a `.env` file in `server/` with the required variables:

```env
MONGODB_URI=mongodb://localhost:27017/assetflow
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password
PORT=5000
```

### 3. Seed Sample Data (optional)

```bash
cd server
node src/seed.js
```

This creates sample users, departments, categories, and assets.

### 4. Start the API Server

```bash
cd server
npm run dev
```

### 5. Setup Frontend

```bash
cd client
npm install
npm start
```

The React app runs at `http://localhost:3000` and proxies API requests to the backend at `http://localhost:5000`.

## 🧪 Example Seed Accounts

The seed script sets up the following users:

- Admin: `admin@assetflow.com` / `password123`
- Asset Manager: `manager@assetflow.com` / `password123`
- Department Head: `head@assetflow.com` / `password123`
- Employee: `employee@assetflow.com` / `password123`

## 📌 API Endpoints

The server exposes these main API groups:

- `/api/auth` - authentication, signup, login, password reset
- `/api/departments` - department CRUD and organization management
- `/api/categories` - asset category management
- `/api/employees` - employee and user management
- `/api/assets` - asset registration and inventory management
- `/api/allocations` - asset allocation lifecycle
- `/api/bookings` - resource booking and scheduling
- `/api/maintenance` - maintenance request handling
- `/api/audits` - audit cycles and audit items
- `/api/reports` - dashboard and utilization reports
- `/api/notifications` - notification feed

Additional route:
- `/api/health` - basic health check endpoint

## 📡 Client Details

The React application includes:

- `src/context/AuthContext.js` - handles user session, token storage, and auth lifecycle
- `src/api/axios.js` - Axios instance with JWT interceptor and auto-logout on 401
- `src/App.js` - route definitions and protected route layout
- `src/pages/` - UI pages for dashboard, login, signup, assets, allocations, bookings, maintenance, audit, reports, notifications, and organization setup
- `src/components/` - layout and common UI pieces like navbar, sidebar, modal, and KPI cards

## 🔧 Available Scripts

### Backend

- `npm run dev` - start server with nodemon
- `npm start` - start server normally

### Frontend

- `npm start` - run React dev server
- `npm run build` - create production build

  ## Screenshots

### Login

<img width="1600" height="900" alt="Login Page" src="https://github.com/user-attachments/assets/9e1cc20a-efdc-4779-b87b-1189e029de36" />

### Dashboard
<img width="1600" height="900" alt="dashboard" src="https://github.com/user-attachments/assets/6965330e-14de-4d32-a334-03c022dae8ed" />


## 📌 Notes

- The frontend uses a proxy configuration to forward `/api` requests to the backend.
- Ensure `JWT_SECRET` is set and kept private.
- If email credentials are not configured, password reset email delivery will fail.

## 💡 Recommended Workflow

1. Start MongoDB.
2. Start backend server in `server/`.
3. Start frontend in `client/`.
4. Open `http://localhost:3000` and log in using one of the seeded accounts.

## 🛠️ Future Improvements

- Add role management UI in the frontend
- Improve audit trail and activity logging display
- Add pagination and filtering for large asset inventories
- Add real-time notifications with WebSockets
- Add user profile and password management pages
