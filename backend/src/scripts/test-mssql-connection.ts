/**
 * Test SQL Server connection. Uses same config as the app.
 * Run: npm run db:test
 */
import * as path from 'path';
import { config } from 'dotenv';
import { getMssqlConnectionConfig } from '../config/mssql-connection';

config({ path: path.join(process.cwd(), '.env') });

const c = getMssqlConnectionConfig();
const useTrustedConnection = c.trustedConnection;
const sql = useTrustedConnection ? require('mssql/msnodesqlv8') : require('mssql');

async function testConnection() {
  const displayStr = c.connectionString.replace(/Pwd=[^;]*/, 'Pwd=***');
  console.log('Connection:', displayStr);
  console.log('Auth:', useTrustedConnection ? 'Windows (Trusted Connection)' : 'SQL Server');

  try {
    let pool;
    if (useTrustedConnection) {
      pool = await sql.connect({ connectionString: c.connectionString });
    } else {
      pool = await sql.connect({
        server: c.server,
        port: c.port,
        database: c.database,
        user: c.user,
        password: c.password,
        options: {
          encrypt: c.encrypt,
          trustServerCertificate: c.trustServerCertificate,
          enableArithAbort: true,
        },
      });
    }
    const result = await pool.request().query('SELECT GETDATE() AS now');
    console.log('Result:', result.recordset);
    await pool.close();
    console.log('Connection OK.');
    process.exit(0);
  } catch (err: unknown) {
    const e = err as Error & { code?: string; originalError?: { message?: string } };
    console.error('Connection failed:', e?.message ?? String(err));
    if (e?.code) console.error('Code:', e.code);
    if (e?.originalError?.message) console.error('Details:', e.originalError.message);
    if (useTrustedConnection) {
      console.error('\nEnsure ODBC driver is installed (e.g. "ODBC Driver 17 for SQL Server" or "SQL Server Native Client 11.0") and TCP/IP is enabled for SQL Server.');
    }
    process.exit(1);
  }
}

testConnection();
