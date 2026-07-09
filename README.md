# FixItNow - Home Services Marketplace Backend API

A comprehensive REST API for a home services marketplace built with **Express.js**, **TypeScript**, **Prisma**, and **PostgreSQL**.

## Features

- 🔐 **Authentication** - Register, login, JWT-based auth with role-based access (Customer, Technician, Admin)
- 👨‍🔧 **Technicians** - Profiles, availability management, skills, ratings
- 📋 **Services** - Listing with category filters, price range, search, technician matching
- 📅 **Bookings** - Full lifecycle: REQUESTED → ACCEPTED/PAID → IN_PROGRESS → COMPLETED
- 💳 **Payments** - SSLCommerz integration (sandbox-ready) with IPN confirmation
- ⭐ **Reviews** - Rating system for completed bookings with distribution stats
- 🛡️ **Admin Panel** - Dashboard stats, user management, booking oversight, ban/unban
- 📊 **API Documentation** - Interactive Swagger UI at `/api/docs`
- 🔒 **Security** - Rate limiting, input sanitization, helmet, structured error handling

## Prerequisites

- **Node.js** >= 18
- **PostgreSQL** database (or NeonDB connection string)
- **SSLCommerz** sandbox credentials (optional, included in `.env`)

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url> fixitnow-backend
cd fixitnow-backend
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, and SSLCommerz credentials

# 3. Initialize database
npx prisma generate
npx prisma migrate dev --name init

# 4. Seed admin user and sample data
npm run db:seed

# 5. Start the server
npm run dev
```

## Admin Credentials

| Field    | Value                 |
|----------|-----------------------|
| Email    | admin@fixitnow.com    |
| Password | Admin@123456          |

## API Endpoints

| Method | Endpoint                          | Description                     | Auth Required |
|--------|-----------------------------------|---------------------------------|---------------|
| GET    | `/api/health`                     | Health check                    | No            |
| GET    | `/api/docs`                       | Swagger UI (interactive docs)   | No            |
| GET    | `/api/docs.json`                  | OpenAPI JSON spec               | No            |
| POST   | `/api/auth/register`              | Create account                  | No            |
| POST   | `/api/auth/login`                 | Login, get JWT                  | No            |
| GET    | `/api/auth/me`                    | Current user profile            | Yes           |
| GET    | `/api/categories`                 | List categories                 | No            |
| POST   | `/api/categories`                 | Create category                 | Admin         |
| GET    | `/api/services`                   | List services (filterable)      | No            |
| GET    | `/api/technicians`                | List technicians (filterable)   | No            |
| GET    | `/api/technicians/:id`            | Technician profile              | No            |
| PUT    | `/api/technician/profile`         | Update own profile              | Technician    |
| PUT    | `/api/technician/availability`    | Set availability slots          | Technician    |
| GET    | `/api/technician/bookings`        | View own bookings               | Technician    |
| PATCH  | `/api/technician/bookings/:id`    | Accept/decline/complete booking | Technician    |
| POST   | `/api/bookings`                   | Create booking                  | Customer      |
| GET    | `/api/bookings`                   | List own bookings               | Customer      |
| GET    | `/api/bookings/:id`               | Get booking details             | Customer      |
| PATCH  | `/api/bookings/:id/cancel`        | Cancel booking                  | Customer      |
| POST   | `/api/payments/create`            | Initiate SSLCommerz payment     | Customer      |
| POST   | `/api/payments/confirm`           | SSLCommerz IPN callback         | No            |
| GET    | `/api/payments`                   | List own payments               | Customer      |
| GET    | `/api/payments/:id`               | Get payment details             | Customer      |
| GET    | `/api/payments/success`           | Payment success page            | No            |
| GET    | `/api/payments/fail`              | Payment failure page            | No            |
| GET    | `/api/payments/cancel`            | Payment cancel page             | No            |
| POST   | `/api/reviews`                    | Create review for booking       | Customer      |
| GET    | `/api/reviews`                    | List own reviews                | Customer      |
| GET    | `/api/reviews/technician/:id`     | List technician reviews         | No            |
| GET    | `/api/admin/dashboard`            | Platform statistics             | Admin         |
| GET    | `/api/admin/users`                | List all users                  | Admin         |
| PATCH  | `/api/admin/users/:id/ban`        | Ban/unban user                  | Admin         |
| GET    | `/api/admin/bookings`             | List all bookings               | Admin         |

## Error Response Format

All errors return structured JSON:

```json
{
  "success": false,
  "message": "Validation failed",
  "errorDetails": [
    { "field": "email", "message": "Invalid email address", "code": "invalid_string" }
  ]
}
```

## Tech Stack

- **Runtime**: Node.js, TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Zod
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Payments**: SSLCommerz (sandbox mode available)
- **Documentation**: Swagger/OpenAPI (swagger-jsdoc, swagger-ui-express)
- **Security**: helmet, cors, express-rate-limit, input sanitization

## Project Structure

```
src/
├── config/          # Environment config, Swagger spec
├── controllers/     # Route handlers
├── lib/             # Utilities (Prisma, JWT, password, SSLCommerz, errors)
├── middleware/      # Auth, validation, error handling, sanitization, rate limiting
├── routes/          # Express route definitions
├── validators/      # Zod schemas for input validation
├── index.ts         # Express app entry point
├── seed.ts          # Database seed script
└── prisma/
    └── schema.prisma # Database schema
```

## License

ISC
