# ShopHub - Multi-Vendor E-commerce Marketplace

ShopHub is a production-ready multi-vendor e-commerce platform for Gombe State, Nigeria.

## Features

### Roles
- **Admin**: register/approve vendors, manage users/products/orders, delivery charges, analytics dashboard.
- **Vendor**: manage products, upload images (Cloudinary), monitor orders and revenue.
- **Customer**: browse/search products, cart, checkout, choose home delivery or pickup, pay with Paystack.

### Security
- JWT authentication
- bcrypt password hashing
- role-based authorization
- request validation (`express-validator`)
- rate limiting
- NoSQL injection + XSS + HPP protection
- secure file upload via Cloudinary storage adapter

## Tech Stack
- Frontend: React + React Router + Tailwind CSS + Axios (Vite)
- Backend: Node.js + Express (REST APIs)
- Database: MongoDB + Mongoose
- Payment: Paystack API
- Image Upload: Cloudinary

## Project Structure

```bash
backend/
  controllers/
  routes/
  models/
  middleware/
  config/
  utils/
  server.js

frontend/
  src/
    components/
    pages/
    services/
    layouts/
    context/
    App.jsx
```

## Installation

1. Clone repository
2. Copy environment file:
   - `cp .env.example .env`
3. Install dependencies:
   - `cd backend && npm install`
   - `cd ../frontend && npm install`
4. Start MongoDB locally (or use MongoDB Atlas)
5. Run backend and frontend:
   - Backend: `cd backend && npm run dev`
   - Frontend: `cd frontend && npm run dev`

## API Base URL
`http://localhost:5000/api`

## Key API Endpoints
- `POST /auth/register`
- `POST /auth/login`
- `GET /products`
- `POST /cart` (customer)
- `POST /orders/checkout` (customer, Paystack initialize)
- `GET /orders/verify/:reference`
- `GET /admin/dashboard` (admin)
- `GET /vendor/dashboard` (vendor)

## Deployment Guide

### Backend (Render/Railway/AWS)
- Set all environment variables from `.env.example`
- Enable HTTPS on platform
- Ensure MongoDB network/IP access
- Build command: `npm install`
- Start command: `npm start`

### Frontend (Vercel/Netlify)
- Set `VITE_API_URL` to deployed backend API URL
- Build command: `npm run build`
- Publish directory: `dist`

## Notes for Production
- Create a seed admin user (role=`admin`) using DB script/manual insert.
- Configure Paystack webhook for robust payment sync.
- Use Cloudinary signed uploads if moving upload flow to client-direct.
- Add monitoring/logging (Sentry, Datadog, ELK).
