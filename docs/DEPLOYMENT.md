# PalletMS Deployment Guide

## Local development

1. **Environment**
   - Copy `.env.example` to `.env` and set `MSSQL_SERVER`, `MSSQL_DATABASE` (PalletDB), `MSSQL_USER`, `MSSQL_PASSWORD`, `REDIS_URL`, `JWT_SECRET` as needed.
   - For local SQL Server, `MSSQL_TRUST_SERVER_CERTIFICATE=true` is often required.

2. **Database**
   - Ensure SQL Server is running and create the database: `CREATE DATABASE PalletDB;`
   - Run migrations and seed:
   ```bash
   npm run migrate
   npm run seed
   ```
   Seed creates roles, 4 users (admin/operator1/operator2/viewer), 10 areas, 100 pallets, 50 movements. Default password: `password123`.

3. **Run app**
   ```bash
   npm run dev
   ```
   Starts API (port 3000), frontend dev server (port 5173). Frontend proxies `/api` to the API.

   Or run separately:
   - `cd backend && npm run start:dev`
   - `cd frontend && npm run dev`

## Production (Docker Compose)

1. Set `JWT_SECRET`, `MSSQL_SERVER`, `MSSQL_USER`, `MSSQL_PASSWORD` (and optionally `MSSQL_DATABASE`) in `.env`.
2. Build and run:
   ```bash
   docker compose up -d
   ```
   Runs: redis, api (port 3000), worker. The API connects to SQL Server (use `MSSQL_SERVER=host.docker.internal` if SQL Server is on the host). Serve frontend via a separate web server or add a frontend service.

## Production (Azure example)

- **API**: Deploy backend to Azure App Service (Node 20). Set app settings: `MSSQL_*`, `REDIS_URL`, `JWT_SECRET`, `FRONTEND_URL`.
- **Database**: Azure SQL. Run migrations manually or in release pipeline.
- **Redis**: Azure Cache for Redis.
- **Storage**: For CSV exports, set `EXPORT_STORAGE_PATH` or use Azure Blob.
- **Frontend**: Build with `npm run build` in frontend; deploy `dist` to Static Web Apps or App Service static site.

## Backups

- Enable daily backups on SQL Server.
- Retain export files per policy; consider lifecycle rules on blob storage.

## TLS

- Use HTTPS in production (TLS termination at load balancer or App Service).
- Set `FRONTEND_URL` to the HTTPS frontend origin for CORS.
