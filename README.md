# Student Hostel Allocation Management System — Backend API

A RESTful API built with **Express.js**, **Prisma ORM**, and **MySQL**, powering the
web-based student hostel allocation management system described in Chapters 1–2
of the accompanying project report.

## Tech Stack

| Layer      | Technology                     |
| ---------- | ------------------------------ |
| Runtime    | Node.js (v18+)                 |
| Framework  | Express.js                     |
| ORM        | Prisma                         |
| Database   | PostgreSQL                     |
| Auth       | JWT (JSON Web Tokens) + bcrypt |
| Validation | Zod                            |

## Features

- JWT authentication with role-based access control (`STUDENT`, `WARDEN`, `ADMIN`)
- Hostel, room, and bed management with automatic bed-record generation per room
- Student application workflow (apply → pay → approve → allocate)
- **Automatic room/bed allocation algorithm** — gender-matched, first-come-first-served,
  transaction-safe against double allocation (see `src/services/allocation.service.js`)
- Simulated online payment gateway, structured so it can be swapped for a real
  provider (Paystack/Flutterwave/Stripe) by editing only `src/services/payment.service.js`
- Maintenance ticketing system (students raise issues, wardens/admins resolve them)
- Admin analytics dashboard (occupancy rate, revenue, pipeline stats)
- In-app notifications
- Centralized error handling, request validation, and consistent JSON response shape

## Getting Started

### 1. Prerequisites

- Node.js 18+
- A running MySQL server (local, Docker, or a cloud instance such as PlanetScale/Railway/Aiven)

### 2. Install dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

- `DATABASE_URL` — your MySQL connection string
- `JWT_SECRET` — any long random string

### 4. Set up the database

```bash
npm run prisma:generate
npm run prisma:migrate
```

This creates all tables defined in `prisma/schema.prisma`.

### 5. Seed sample data (optional but recommended)

```bash
npm run seed
```

This creates:

- Admin: `admin@hostel.edu` / `Admin@12345` (or whatever you set in `.env`)
- Warden: `warden@hostel.edu` / `Warden@123`
- Student: `student@hostel.edu` / `Student@123`
- 3 sample hostels, each with 6 rooms and generated bed records
- An active academic session (`2025/2026`)

### 6. Run the server

```bash
npm run dev      # development with auto-reload (nodemon)
npm start        # production
```

The API will be available at `http://localhost:5000`.

## API Overview

All routes are prefixed with `/api/v1`.

| Resource          | Base Path               |
| ----------------- | ----------------------- |
| Auth              | `/api/v1/auth`          |
| Users             | `/api/v1/users`         |
| Hostels           | `/api/v1/hostels`       |
| Rooms             | `/api/v1/rooms`         |
| Applications      | `/api/v1/applications`  |
| Payments          | `/api/v1/payments`      |
| Allocations       | `/api/v1/allocations`   |
| Maintenance       | `/api/v1/maintenance`   |
| Dashboard         | `/api/v1/dashboard`     |
| Notifications     | `/api/v1/notifications` |
| Academic Sessions | `/api/v1/sessions`      |
| Health check      | `GET /api/v1/health`    |

Every protected route expects a header: `Authorization: Bearer <token>`.

## Deployment Notes

- Run `npx prisma migrate deploy` (not `migrate dev`) in production.
- Set `NODE_ENV=production`.
- Point `CLIENT_URL` to your deployed frontend's origin for correct CORS behaviour.
- This project is ready to deploy to any Node host (Render, Railway, Fly.io, a VPS, etc.)
  paired with a managed MySQL instance.
