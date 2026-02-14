# PalletMS – Pallet Tracking Web Application

A mobile-friendly pallet tracking web application with admin management, RBAC, pallet lifecycle (add, move, update, mark lost/damaged/stolen/unfit), paired movement tracking (Out/In), reporting with CSV export, barcode scanning, audit logging, and optional offline queueing.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, PWA, ZXing (barcode)
- **Backend:** Node.js, NestJS, TypeScript, TypeORM
- **Database:** SQL Server (PalletDB)
- **Background jobs:** BullMQ (Redis)
- **Auth:** JWT, OAuth2/OpenID Connect (Azure AD SSO ready)
- **Storage:** Local/S3-compatible for CSV exports

## Quick Start

```bash
# 1. Install dependencies (from repo root)
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 2. Create the database in SQL Server
# In SSMS or sqlcmd: CREATE DATABASE PalletDB;

# 3. Configure backend/.env with your SQL Server credentials
# Set MSSQL_SERVER, MSSQL_USER, MSSQL_PASSWORD (and optionally MSSQL_DATABASE=PalletDB)

# 4. Apply database migrations (from repo root)
npm run migrate

# 5. Seed sample data (100 pallets, 10 areas, 50 movements; users: admin/operator1/operator2/viewer with password password123)
npm run seed

# 6. Run full stack (API + frontend dev server)
npm run dev
# Or: cd backend && npm run start:dev  and  cd frontend && npm run dev
```

### View from another PC on the same network

With the stack running, open the app from another device (e.g. phone or laptop on the same Wi‑Fi):

1. Find this PC’s IP (e.g. `ipconfig` on Windows → IPv4 Address).
2. On the other device, open **http://\<this-pc-ip\>:5173** (e.g. `http://192.168.1.100:5173`).

The frontend dev server listens on all interfaces (`host: true`), and the API allows CORS from any origin in development, so no extra config is needed. Camera scanning may require HTTPS or localhost on some browsers.

**E2E tests:** Start the stack (API + frontend) and seed data first, then from `frontend`: `npm run test:e2e`.

### Database setup

- **SQL Server:** Create a database (e.g. `CREATE DATABASE PalletDB;`) and ensure the instance is running.
- Set in `backend/.env`: `MSSQL_SERVER`, `MSSQL_DATABASE` (default PalletDB), `MSSQL_USER`, `MSSQL_PASSWORD`. For a **named instance** (e.g. `.\SQLEXPRESS` in SSMS), set `MSSQL_INSTANCE=SQLEXPRESS` and ensure the SQL Server Browser service is running.
- **If SSMS connects but the app doesn’t,** see [SQL Server connection troubleshooting](docs/SQL_SERVER_CONNECTION.md) (named instance, Windows vs SQL auth, TCP/IP).
- Then run `npm run migrate` and `npm run seed` from the repo root.

## Project Structure

```
PalletMS/
├── backend/          # NestJS API
├── frontend/         # React PWA
├── database/         # Migrations (SQL Server) and seed CSVs
├── docs/             # API docs, deployment, acceptance tests
├── docker-compose.yml
└── package.json      # Root scripts
```

## Environment Variables

Copy `.env.example` to `.env` and set values. Key variables:

- `MSSQL_SERVER` – SQL Server host (e.g. localhost or .\SQLEXPRESS)
- `MSSQL_DATABASE` – Database name (default PalletDB)
- `MSSQL_USER` / `MSSQL_PASSWORD` – SQL login
- `REDIS_URL` – Redis for BullMQ
- `JWT_SECRET` – Signing secret for tokens
- `AZURE_AD_*` – Optional Azure AD SSO

## IIS and Windows Server

The app is designed to run on **SQL Server** and can be hosted on **IIS**. See **[IIS and Windows Server deployment](docs/IIS_WINDOWS_SERVER.md)** for building, running the API (standalone or iisnode), and serving the frontend from IIS with URL Rewrite/ARR to proxy `/api`.

## Documentation

- [API Reference](docs/API.md) – OpenAPI and endpoint list
- [Deployment Guide](docs/DEPLOYMENT.md)
- [IIS and Windows Server](docs/IIS_WINDOWS_SERVER.md) – SQL Server + IIS
- [Acceptance Test Cases](docs/ACCEPTANCE_TESTS.md)

## License

Proprietary / MIT as applicable.
