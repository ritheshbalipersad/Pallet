import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';
import { getMssqlConnectionConfig } from '../config/mssql-connection';

config({ path: path.join(process.cwd(), '.env') });

const c = getMssqlConnectionConfig();
const sql = c.trustedConnection ? require('mssql/msnodesqlv8') : require('mssql');

async function run() {
  const connectConfig = c.trustedConnection
    ? { connectionString: c.connectionString }
    : {
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
      };
  const pool = await sql.connect(connectConfig);
  const migrationsDir = path.join(process.cwd(), '..', 'database', 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('_mssql.sql'))
    .sort();
  for (const file of files) {
    const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log('Running', file);
    await pool.request().query(sqlContent);
  }
  await pool.close();
  console.log('Migrations done.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
