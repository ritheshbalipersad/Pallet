/**
 * Single source of truth for SQL Server connection.
 * Used by TypeORM, test script, migrations, and seed.
 * Matches: sqlcmd -S localhost -d PalletDB (Windows Auth) or SQL auth.
 */

import { platform } from 'node:os';

function parseServer(value: string): string {
  const v = (value || 'localhost').trim();
  return v.includes(':') ? v.split(':')[0] : v;
}

// Same driver names as mssql/msnodesqlv8 connection-pool (Windows vs Mac/Linux)
const ODBC_DRIVER = platform() === 'win32' ? 'SQL Server Native Client 11.0' : 'ODBC Driver 17 for SQL Server';

export interface MssqlConnectionConfig {
  server: string;
  port: number;
  database: string;
  instanceName: string | undefined;
  trustedConnection: boolean;
  user: string | undefined;
  password: string | undefined;
  encrypt: boolean;
  trustServerCertificate: boolean;
  /** ODBC-style connection string for msnodesqlv8 (avoids driver building bugs) */
  connectionString: string;
}

export function getMssqlConnectionConfig(env: NodeJS.ProcessEnv = process.env): MssqlConnectionConfig {
  const server = parseServer(env.MSSQL_HOST || env.MSSQL_SERVER || 'localhost');
  const database = env.MSSQL_DATABASE || 'PalletDB';
  const instanceName = env.MSSQL_INSTANCE?.trim() || undefined;
  const port = parseInt(env.MSSQL_PORT || '1433', 10);
  const trustedConnection = env.MSSQL_TRUSTED_CONNECTION === 'true';
  const user = trustedConnection ? undefined : (env.MSSQL_USER || env.MSSQL_USERNAME || undefined);
  const password = trustedConnection ? undefined : env.MSSQL_PASSWORD;
  const encrypt = env.MSSQL_ENCRYPT !== 'false';
  const trustServerCertificate = env.MSSQL_TRUST_SERVER_CERTIFICATE === 'true';

  const driver = env.MSSQL_ODBC_DRIVER || ODBC_DRIVER;
  const serverPart = instanceName ? `${server}\\${instanceName}` : `${server},${port}`;
  const encStr = encrypt ? 'yes' : 'no';
  const tscStr = trustServerCertificate ? 'yes' : 'no';

  let connectionString: string;
  if (trustedConnection) {
    connectionString = `Driver={${driver}};Server=${serverPart};Database=${database};Trusted_Connection=yes;Encrypt=${encStr};TrustServerCertificate=${tscStr}`;
  } else {
    const uid = user || '';
    const pwd = password || '';
    connectionString = `Driver={${driver}};Server=${serverPart};Database=${database};Uid=${uid};Pwd=${pwd};Encrypt=${encStr};TrustServerCertificate=${tscStr}`;
  }

  return {
    server,
    port,
    database,
    instanceName,
    trustedConnection,
    user,
    password,
    encrypt,
    trustServerCertificate,
    connectionString,
  };
}
