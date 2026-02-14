# Deploying PalletMS on Windows Server with IIS and SQL Server

This guide covers running PalletMS on a standard Windows Server with **IIS** and **SQL Server**.

## Overview

- **Database:** SQL Server (local or remote)
- **API:** Node.js (NestJS) – can run as a standalone process or under IIS via iisnode
- **Frontend:** Static files (built SPA) served by IIS
- **IIS:** Serves the frontend and optionally proxies `/api` to the Node API

---

## 1. Prerequisites

- Windows Server with IIS installed
- **Node.js** (LTS, e.g. 20.x) installed – [nodejs.org](https://nodejs.org)
- **SQL Server** (Express or full) with a database for PalletMS
- **IIS URL Rewrite** module – [download](https://www.iis.net/downloads/microsoft/url-rewrite)
- For API proxy: **Application Request Routing (ARR)** – [download](https://www.iis.net/downloads/microsoft/application-request-routing)

Optional for running Node inside IIS:

- **iisnode** – [GitHub](https://github.com/Azure/iisnode/releases)

---

## 2. SQL Server setup

### Create database and user

In SQL Server Management Studio or `sqlcmd`:

```sql
CREATE DATABASE PalletDB;
-- Use Windows auth or create a SQL user:
-- CREATE LOGIN palletms WITH PASSWORD = 'YourStrongPassword';
-- USE PalletDB; CREATE USER palletms FOR LOGIN palletms;
-- ALTER ROLE db_owner ADD MEMBER palletms;
```

### Run migrations

Configure SQL Server in `backend\.env` (see [Environment variables](#6-environment-variables-backend) below), then from the **repo root**:

```cmd
npm run migrate
npm run seed
```

Or from the `backend` folder:

```cmd
cd backend
npm run migration:run
npm run seed:run
```

Example `backend\.env` for SQL Server:

```env
MSSQL_SERVER=localhost
MSSQL_DATABASE=PalletDB
MSSQL_USER=your_user
MSSQL_PASSWORD=your_password
MSSQL_TRUST_SERVER_CERTIFICATE=true
MSSQL_ENCRYPT=false
```

For **Windows Authentication** (no SQL user/password), set `MSSQL_TRUSTED_CONNECTION=true` and omit `MSSQL_USER`/`MSSQL_PASSWORD`. For a named instance (e.g. `.\SQLEXPRESS`), set `MSSQL_INSTANCE=SQLEXPRESS` and ensure SQL Server Browser is running.

---

## 3. Build the application

From the repo root:

```cmd
cd backend
npm install
npm run build

cd ..\frontend
npm install
npm run build
```

You should have:

- `backend\dist\` – compiled Node API
- `frontend\dist\` – static files for the SPA

---

## 4. Run the API

### Option A – Standalone (recommended for production)

Run the API as a normal Node process (e.g. under a Windows Service or PM2):

```cmd
cd backend
set NODE_ENV=production
set FRONTEND_URL=https://your-server.domain.com
node dist/main
```

Keep this process running (or use **NSSM** / **PM2** / **Windows Service** to run it in the background). The API will listen on port 3000 (or `PORT` / `API_PORT`).

### Option B – Under IIS with iisnode

1. Install **iisnode** (x64) and ensure the IIS site has the right handler.
2. In IIS, create an **Application** (e.g. `api`) under your site, pointing to the **backend** folder (the one containing `dist\` and `web.config`).
3. The `backend\web.config` is already set up for iisnode; it runs `dist/main.js`. Ensure the app pool identity can read the backend folder and that Node.js is in `PATH` (or set `nodeProcessCommandLine` in `web.config`).
4. The API will be available at `https://your-server/api/` (or whatever path the application has).

---

## 5. Serve the frontend from IIS

1. Create an IIS **Website** (or use the Default Web Site).
2. Set the **Physical path** to the folder that contains:
   - All files from `frontend\dist\`
   - The `web.config` from `deploy\web.config` (copy it into the same folder as `index.html`).

3. If the API runs **standalone** (Option A):
   - Open `web.config` and in the “Proxy API to Node” rule set the URL to your API, e.g. `http://localhost:3000/api/{R:1}`.
   - Enable **ARR** Proxy: IIS → Server → Application Request Routing → Proxy Settings → check “Enable proxy”.

4. If the API runs **under IIS** (Option B) as an application (e.g. `/api`):
   - Point the proxy URL in `web.config` to that application, e.g. `http://localhost/api/{R:1}` (replace `localhost` with your server name if needed).

5. Restart the site and browse to the site root. You should see the app and be able to log in (e.g. **admin** / **password123** after seed).

---

## 6. Environment variables (backend)

For **production** on Windows Server with SQL Server, set these in `backend\.env`, system env, or IIS Application Settings (if using iisnode):

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `production` |
| `MSSQL_SERVER` | SQL Server host (e.g. `localhost`; for named instance use host only and set `MSSQL_INSTANCE`) |
| `MSSQL_DATABASE` | `PalletDB` |
| `MSSQL_USER` | SQL login name (omit when using Windows auth) |
| `MSSQL_PASSWORD` | SQL login password (omit when using Windows auth) |
| `MSSQL_TRUSTED_CONNECTION` | `true` for Windows Authentication |
| `MSSQL_INSTANCE` | Named instance (e.g. `SQLEXPRESS`); ensure SQL Server Browser is running |
| `MSSQL_TRUST_SERVER_CERTIFICATE` | `true` if using self-signed cert |
| `MSSQL_ENCRYPT` | `false` for local/dev, `true` for encrypted connections |
| `JWT_SECRET` | Strong secret for JWT signing |
| `FRONTEND_URL` | Full URL of the frontend (e.g. `https://your-server.domain.com`) for CORS |
| `API_PORT` or `PORT` | Port the API listens on (default 3000) |
| `REDIS_URL` | Optional; only if using background jobs (e.g. `redis://localhost:6379`) |

---

## 7. Checklist

- [ ] SQL Server database created; migrations and seed run from repo root (`npm run migrate`, `npm run seed`) or from `backend` (`npm run migration:run`, `npm run seed:run`)
- [ ] `backend\.env` set for SQL Server and production (no `DB_TYPE`; use `MSSQL_*` and optionally `MSSQL_TRUSTED_CONNECTION=true` for Windows auth)
- [ ] Backend built (`backend\dist\`) and running (standalone with `node dist/main` or under iisnode)
- [ ] Frontend built (`frontend\dist\`) and deployed to IIS site root with `deploy\web.config` copied into the same folder as `index.html`
- [ ] IIS URL Rewrite and ARR installed; ARR proxy enabled; proxy rule in `deploy\web.config` points to the API (e.g. `http://localhost:3000/api/{R:1}` for standalone)
- [ ] CORS: `FRONTEND_URL` in backend matches the URL users use to open the app

After that, the app can run on a standard Windows Server with IIS and SQL Server only.
