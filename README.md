# Majidadi General Services

A full-stack e-commerce platform for **Majidadi General Services**, built for selling phones, laptops, stationeries, books, and other products online.

## Features

* Product catalog with search and categories
* Product details and shopping cart
* Customer registration and login
* Guest checkout and order tracking
* Paystack payment integration
* Order and payment status tracking
* Admin dashboard with sales overview
* Admin product management
* Admin order management
* Customer management
* Admin profile and avatar management
* Responsive design for mobile and desktop
* Supabase database, authentication, and storage

## Tech Stack

**Frontend**

* React
* TypeScript
* Vite
* CSS

**Backend**

* Node.js
* Express
* TypeScript

**Database & Services**

* Supabase
* Paystack
* Vercel
* Render

## Project Structure

majidadi-71shop/
├── frontend/     # React frontend
├── backend/      # Express API
└── README.md

## Getting Started

### 1. Clone the repository

git clone https://github.com/EdogiStar/majidadi-shop.git
cd majidadi-shop

### 2. Install dependencies

cd frontend
npm install

cd ../backend
npm install

### 3. Environment Variables

Create the required `.env` files for the frontend and backend.

Configure:

* Supabase URL
* Supabase keys
* Paystack keys
* API base URL
* Other environment-specific settings

Never commit secret keys or service-role credentials.

### 4. Run locally

Start the backend:

cd backend
npm run dev

Start the frontend in another terminal:

cd frontend
npm run dev

## Testing

Backend:

cd backend
npm test

Frontend:

cd frontend
npm test

## Deployment

* Frontend: Vercel
* Backend: Render
* Database/Auth/Storage: Supabase
* Payments: Paystack

## Business

**Majidadi General Services**

Shop No. 2, Opposite Sunset, Along Abaji Area Council, FCT Abuja, Nigeria.

---

Built with React, Express, TypeScript, Supabase, and Paystack.
