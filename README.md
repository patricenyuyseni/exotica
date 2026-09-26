# EXOTICA

EXOTICA is a premium full-stack e-commerce storefront for luxury exotic products. It combines a dark, modern storefront with a production-ready Node.js/Express API and PostgreSQL data layer.

## Features

- Premium storefront and mobile-first responsive UX
- Product catalog with search, sorting, filtering, and pagination
- Product detail pages with gallery, reviews, and related products
- Cart, wishlist, checkout, and order flow
- JWT-based customer authentication and role-based admin access
- Admin dashboard for analytics, orders, customers, and product management
- PostgreSQL relational data model with inventory tracking and transactions
- Centralized error handling and validation

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router
- Backend: Node.js, Express, TypeScript, PostgreSQL, JWT, bcrypt, Zod
- Database: PostgreSQL
- Auth: JWT + bcrypt
- Deployment: Vercel/Netlify for frontend, Render/Railway/Fly.io for backend

## Folder Structure

```text
exotica/
├── client/
│   ├── public/
│   │   └── images/
│   │       └── products/
│   └── src/
├── server/
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── middleware/
│       ├── services/
│       ├── validators/
│       ├── db/
│       ├── utils/
│       └── server.ts
├── README.md
├── docker-compose.yml
├── .env.example
└── package.json
```

## Installation

1. Clone the repository.
2. Install workspace dependencies (optional for local development):

```bash
npm install
```

3. Start all services with Docker Compose (recommended):

```bash
docker compose up --build
```

4. Copy the example environment file for local runs (if running services without Docker):

```bash
cp .env.example .env
```

5. Update the environment values as needed.

## Environment Variables

```env
DATABASE_URL=postgresql://exotica:exotica123@localhost:5432/exotica
JWT_SECRET=change_me_in_production
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

## Running the backend

From the `server` folder:

```bash
cd server
npm install
npm run build
npm start
```

For development with live reload:

```bash
npm run dev
```

## Database Setup

Create the database and apply migrations from the server project. When the app is initialized, it will create the PostgreSQL schema automatically if configured.

## Development Commands

```bash
npm run dev
```

This runs the Vite client and Express API together.

## Production Build

```bash
npm run build
```

## Deployment Instructions

- Frontend: deploy the client build to Vercel or Netlify.
- Backend: deploy the server build to Render, Railway, or Fly.io.
- Database: use a managed PostgreSQL instance and set DATABASE_URL in the deployment environment.

## API Documentation

Primary REST endpoints include:

- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- GET /api/products
- GET /api/products/:slug
- POST /api/products
- PATCH /api/products/:id
- DELETE /api/products/:id
- GET /api/categories
- GET /api/cart
- POST /api/cart
- PATCH /api/cart/:itemId
- DELETE /api/cart/:itemId
- POST /api/orders
- GET /api/orders
- GET /api/orders/:id
- GET /api/products/:id/reviews
- POST /api/products/:id/reviews

## Notes

- Do not commit .env files.
- Sensitive credentials are never exposed to the frontend.
- The platform is designed for production deployment with secure configuration and validation.
