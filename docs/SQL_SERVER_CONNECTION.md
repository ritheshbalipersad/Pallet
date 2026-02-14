# SQL Server Connection

## Mapping your SSMS connection string to `backend/.env`

If SSMS connects with a string like:

`Data Source=localhost;Integrated Security=True;Encrypt=True;TrustServerCertificate=True;...`

use in `backend/.env`:

| SSMS | backend/.env |
|------|----------------|
| Data Source=localhost | `MSSQL_SERVER=localhost` |
| (no instance = default) | Leave `MSSQL_INSTANCE` unset; app uses port 1433 |
| Integrated Security=True | `MSSQL_TRUSTED_CONNECTION=true` |
| Encrypt=True | `MSSQL_ENCRYPT=true` |
| TrustServerCertificate=True | `MSSQL_TRUST_SERVER_CERTIFICATE=true` |
| Database | `MSSQL_DATABASE=PalletDB` |

No `MSSQL_USER` or `MSSQL_PASSWORD` when using Windows Authentication.

---

## Why SSMS Connects but the App Doesn't

If you can connect in **SQL Server Management Studio (SSMS)** but the app fails with "Could not connect" or "Login failed", it's usually one of these:

## 1. You're using a **named instance** (e.g. SQLEXPRESS)

In SSMS you might connect to:
- `.\SQLEXPRESS`
- `(localdb)\MSSQLLocalDB`
- `localhost\SQLEXPRESS`

The app was defaulting to `localhost:1433`, which is the **default instance**. Named instances use a different port (or no fixed port).

**Fix:** In `backend/.env` set the instance name and leave port default:

```env
MSSQL_SERVER=localhost
MSSQL_INSTANCE=SQLEXPRESS
```

Leave `MSSQL_PORT` unset so the driver uses the **SQL Server Browser** service to find the instance. Ensure **SQL Server Browser** is running (Services → SQL Server Browser → Start).

---

## 2. Windows Authentication (Trusted Connection) shows "Connection failed: [object Object]"

The app uses **msnodesqlv8**, which needs an **ODBC driver** on Windows. If you see a generic failure with no details:

1. Install one of these (from Microsoft):
   - **ODBC Driver 17 for SQL Server** (recommended), or
   - **SQL Server Native Client 11.0**
2. Ensure **TCP/IP** is enabled for your SQL Server instance (Configuration Manager → Protocols).
3. For local dev, try `MSSQL_ENCRYPT=false` in `backend/.env`.

---

## 3. You're using **Windows Authentication** in SSMS (Trusted Connection)

If your working connection string is `Server=localhost;Database=PalletDB;Trusted_Connection=True;`, use **Windows Authentication** in the app:

**Fix:** In `backend/.env` set:

```env
MSSQL_SERVER=localhost
MSSQL_DATABASE=PalletDB
MSSQL_TRUSTED_CONNECTION=true
MSSQL_TRUST_SERVER_CERTIFICATE=true
```

Leave `MSSQL_USER` and `MSSQL_PASSWORD` empty. For **default instance** leave `MSSQL_INSTANCE` unset; for a named instance (e.g. `localhost\Rithesh`) set `MSSQL_INSTANCE=Rithesh`. The app uses the **msnodesqlv8** driver for Trusted Connection (Windows Auth).

**Alternative – SQL Server Authentication:** If you prefer a SQL login instead of Windows Auth, set `MSSQL_TRUSTED_CONNECTION=false` (or leave it unset) and:

1. In SSMS, connect with Windows Auth, then:
   - **Security → Logins → New Login**
   - Choose **SQL Server authentication**, set login name and password
   - Uncheck "Enforce password policy" if you want a simple dev password
   - Default database: **PalletDB**
2. On the server: **Server → Properties → Security** → set **SQL Server and Windows Authentication mode**, then restart the SQL Server service.
3. In `backend/.env` set:
   ```env
   MSSQL_USER=YourNewLogin
   MSSQL_PASSWORD=YourPassword
   ```

Or use the **sa** account (if you know the password and it’s enabled).

---

## 4. TCP/IP is disabled for SQL Server (error: "Failed to connect to localhost:1433" / ESOCKET)

SSMS can connect via **shared memory** or named pipes. The Node app **only uses TCP/IP**. If TCP/IP is disabled for your instance, the app will fail with something like:

`Failed to connect to localhost:1433 - Could not connect (sequence)` or `Code: ESOCKET`

**Fix:**

1. Open **SQL Server Configuration Manager** (search for it in Windows).
2. Go to **SQL Server Network Configuration** → **Protocols for &lt;YourInstance&gt;** (e.g. "Protocols for MSSQLSERVER" for default, or "Protocols for Rithesh" for named instance).
3. Right‑click **TCP/IP** → **Enable**.
4. Restart the **SQL Server** service (and if you use a named instance, ensure **SQL Server Browser** is also running).
5. If you use a **named instance**, in `backend/.env` set `MSSQL_INSTANCE=Rithesh` (or your instance name) and leave port unset so the driver uses SQL Server Browser to find the port.

---

## 5. Wrong instance or port

- If in SSMS you connect to **localhost** (no backslash), use the **default instance**: leave `MSSQL_INSTANCE` empty in `.env`; the app will use port 1433.
- If in SSMS you connect to **localhost\\Rithesh** or **.\\Rithesh**, use a **named instance**: set `MSSQL_INSTANCE=Rithesh` in `.env` and make sure **SQL Server Browser** is running (Services → SQL Server Browser → Start). Do **not** set `MSSQL_PORT` when using a named instance.

---

## Quick checklist

- [ ] `MSSQL_SERVER` matches what you use in SSMS (e.g. `localhost`).
- [ ] For **Windows Auth**: set `MSSQL_TRUSTED_CONNECTION=true` and leave `MSSQL_USER`/`MSSQL_PASSWORD` empty. For default instance leave `MSSQL_INSTANCE` empty.
- [ ] For **SQL Auth**: set `MSSQL_USER` and `MSSQL_PASSWORD` to a SQL Server login; leave `MSSQL_TRUSTED_CONNECTION` unset or false.
- [ ] If you use a named instance (e.g. `.\SQLEXPRESS`), set `MSSQL_INSTANCE` and have SQL Server Browser running.
- [ ] Server authentication is set to "SQL Server and Windows Authentication mode" (needed for SQL logins; Windows Auth works with Windows mode).
- [ ] TCP/IP is enabled for the instance.

After changing `.env`, run migrations and start the API again.
