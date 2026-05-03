# Aurum-Ecommerce

Aurum-Ecommerce is a full-stack ecommerce management system with separate customer and admin flows. Customers can register with Telegram-based OTP verification, browse products, place orders, and receive notifications. Admin users can manage users, products, categories, brands, and orders through a React dashboard backed by an Express and PostgreSQL API.

## Project Overview

This repository is split into two applications:

- `frontend/`: React + Vite client for authentication, shopping, checkout, and the admin dashboard
- `backend/`: Express API for authentication, product/catalog management, order handling, session management, PostgreSQL access, Telegram messaging, and email notifications

## Features

- Role-based login flow for admin and standard users
- Telegram OTP-based registration and account verification
- Session-based authentication with frontend route protection
- Product catalog browsing with search and filter support
- Checkout and order placement flow
- Admin management screens for users, products, categories, brands, and orders
- Telegram order updates and SMTP email notifications for order activity

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite 5, React Router, Axios, React Toastify |
| Backend | Node.js, Express, Express Session, Axios, Multer, Bcrypt, Nodemailer |
| Database | PostgreSQL (`pg`) |
| Configuration | `dotenv` |

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL
- A Telegram bot token for OTP and order notifications
- SMTP credentials for email notifications

## Installation

1. Install backend dependencies:

   ```bash
   cd backend
   npm install
   ```

2. Install frontend dependencies:

   ```bash
   cd ../frontend
   npm install
   ```

3. Create a local environment file:

   - Copy `backend/.env.example` to `backend/.env`
   - Fill in the real values for database, Telegram, session, and SMTP settings

## Environment Setup

The backend expects the following environment variables:

| Variable | Description |
| --- | --- |
| `PORT` | Port used by the Express server. Defaults to `5000`. |
| `DATABASE_URL` | PostgreSQL connection string for the application database. |
| `SESSION_SECRET` | Secret used by `express-session`; use a long random value. |
| `BOT_TOKEN` | Telegram bot token used for OTP and order notifications. |
| `SMTP_HOST` | SMTP server hostname. |
| `SMTP_PORT` | SMTP server port, usually `587` or `465`. |
| `SMTP_USER` | SMTP username or sender email address. |
| `SMTP_PASS` | SMTP password or app password. |

If you prefer not to use `DATABASE_URL`, the backend also supports `DB_USER`, `DB_HOST`, `DB_NAME`, `DB_PASSWORD`, and `DB_PORT`.

## Database Notes

- The application expects a PostgreSQL database to exist before startup.
- The current codebase references tables such as users, roles, products, categories, brands, and orders.
- Database migrations or seed scripts are not included in this repository, so the schema must be created separately before running locally.

## Running the Project Locally

Start the backend in one terminal:

```bash
cd backend
node server.js
```

Start the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

Then open `http://localhost:5173`.

## Folder Structure

```text
Aurum-Ecommerce/
|-- backend/
|   |-- .env.example
|   |-- package.json
|   |-- server.js
|   |-- src/
|   |   |-- app.js
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middlewares/
|   |   |-- routes/
|   |   `-- services/
|   `-- utils/
|-- frontend/
|   |-- package.json
|   |-- vite.config.js
|   `-- src/
|       |-- App.jsx
|       |-- components/
|       |-- styles/
|       `-- utils/
|-- .gitignore
`-- README.md
```

## Best Practices and Notes

- Keep real secrets only in `backend/.env`; commit `backend/.env.example` instead.
- Do not commit `node_modules`, archive files, logs, or local editor metadata.
- The frontend currently calls `http://localhost:5000` directly, and backend CORS is configured for `http://localhost:5173`. Update both before deploying to another environment.
- Add database migration scripts and automated tests if you plan to maintain this project long term.
- Rotate any secrets that were previously committed to Git, even after adding them to `.gitignore`.
