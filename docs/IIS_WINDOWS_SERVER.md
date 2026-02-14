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

From the project root (or `backend` folder), set SQL Server env and run migrations:

```cmd
cd backend
set DB_TYPE=mssql
set MSSQL_SERVER=localhost
set MSSQL_DATABASE=PalletDB
set MSSQL_USER=your_user
set MSSQL_PASSWORD=your_password
set MSSQL_TRUST_SERVER_CERTIFICATE=true

npm run migration:run
npm run seed:run
```

Or use a `backend\.env` file:

```env
DB_TYPE=mssql
MSSQL_SERVER=localhost
MSSQL_DATABASE=PalletDB
MSSQL_USER=your_user
MSSQL_PASSWORD=your_password
MSSQL_TRUST_SERVER_CERTIFICATE=true
MSSQL_ENCRYPT=false
```

Then:

```cmd
cd backend
npm run migration:run
npm run seed:run
```

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
node dist/main.js
```

Keep this process running (or use **NSSM** / **PM2** / **Windows Service** to run it in the background). The API will listen on port 3000 (or `PORT` / `API_PORT`).

### Option B – Under IIS with iisnode

1. Install **iisnode** (x64) and ensure the IIS site has the right handler.
2. In IIS, create an **Application** (e.g. `api`) under your site, pointing to the `backend` folder.
3. The `backend\web.config` is already set up for iisnode; it runs `dist/main.js`.
4. Ensure the app pool identity can read the backend folder and that Node is in `PATH` (or set `nodeProcessCommandLine` in `web.config`).
5. The API will be available at `https://your-server/api/` (or whatever path the application has).

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

For **production** on Windows Server with SQL Server, set these (in `backend\.env`, system env, or IIS Application Settings if using iisnode):

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `production` |
| `DB_TYPE` | `mssql` |
| `MSSQL_SERVER` | SQL Server host (e.g. `localhost` or `.\SQLEXPRESS`) |
| `MSSQL_DATABASE` | `PalletDB` |
| `MSSQL_USER` | SQL login name |
| `MSSQL_PASSWORD` | SQL login password |
| `MSSQL_TRUST_SERVER_CERTIFICATE` | `true` if using self-signed cert |
| `MSSQL_ENCRYPT` | `false` for local dev, `true` for encrypted connections |
| `JWT_SECRET` | Strong secret for JWT signing |
| `FRONTEND_URL` | Full URL of the frontend (e.g. `https://your-server.domain.com`) |
| `API_PORT` or `PORT` | Port the API listens on (default 3000) |

---

## 7. Checklist

- [ ] SQL Server database created and migrations/seed run with `DB_TYPE=mssql`
- [ ] Backend `.env` (or env) set for SQL Server and production
- [ ] Backend built (`backend\dist\`) and running (standalone or iisnode)
- [ ] Frontend built (`frontend\dist\`) and deployed to IIS with `deploy\web.config`
- [ ] URL Rewrite (and ARR for proxy) installed and proxy rule pointing to the API
- [ ] CORS: `FRONTEND_URL` matches the URL users use to open the app

After that, the app can run on a standard Windows Server with IIS and SQL Server only.
