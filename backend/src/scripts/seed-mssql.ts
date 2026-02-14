import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';
import { getMssqlConnectionConfig } from '../config/mssql-connection';

config({ path: path.join(process.cwd(), '.env') });

const c = getMssqlConnectionConfig();
const sql = c.trustedConnection ? require('mssql/msnodesqlv8') : require('mssql');

const seedDir = path.join(process.cwd(), '..', 'database', 'seed');
const defaultPassword = 'password123';

function parseCsv(content: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = content.trim().split('\n');
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = values[i] ?? ''));
    return obj;
  });
  return { headers, rows };
}

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

  // Delete in reverse FK order
  await pool.request().query('DELETE FROM audit_log');
  await pool.request().query('DELETE FROM exports');
  await pool.request().query('DELETE FROM movements');
  await pool.request().query('DELETE FROM pallets');
  await pool.request().query('DELETE FROM users');
  await pool.request().query('DELETE FROM areas');
  await pool.request().query('DELETE FROM roles');

  const rolesCsv = fs.readFileSync(path.join(seedDir, 'roles.csv'), 'utf8');
  const { rows: rolesRows } = parseCsv(rolesCsv);
  for (const r of rolesRows) {
    if (!r.role_id) continue;
    await pool.request()
      .input('role_id', sql.Int, parseInt(r.role_id, 10))
      .input('name', sql.NVarChar(100), r.name)
      .input('permissions', sql.NVarChar(sql.MAX), r.permissions || '[]')
      .query('SET IDENTITY_INSERT roles ON; INSERT INTO roles (role_id, name, permissions) VALUES (@role_id, @name, @permissions); SET IDENTITY_INSERT roles OFF');
  }

  const areasCsv = fs.readFileSync(path.join(seedDir, 'areas.csv'), 'utf8');
  const { rows: areasRows } = parseCsv(areasCsv);
  for (const r of areasRows) {
    if (!r.area_id) continue;
    await pool.request()
      .input('area_id', sql.Int, parseInt(r.area_id, 10))
      .input('name', sql.NVarChar(200), r.name)
      .input('type', sql.NVarChar(50), r.type || null)
      .input('parent_area_id', sql.Int, r.parent_area_id ? parseInt(r.parent_area_id, 10) : null)
      .input('capacity', sql.Int, r.capacity ? parseInt(r.capacity, 10) : null)
      .query('SET IDENTITY_INSERT areas ON; INSERT INTO areas (area_id, name, type, parent_area_id, capacity) VALUES (@area_id, @name, @type, @parent_area_id, @capacity); SET IDENTITY_INSERT areas OFF');
  }

  const hash = await bcrypt.hash(defaultPassword, 10);
  const usersCsv = fs.readFileSync(path.join(seedDir, 'users.csv'), 'utf8');
  const { rows: usersRows } = parseCsv(usersCsv);
  for (const r of usersRows) {
    if (!r.user_id) continue;
    await pool.request()
      .input('user_id', sql.Int, parseInt(r.user_id, 10))
      .input('username', sql.NVarChar(100), r.username)
      .input('password_hash', sql.NVarChar(255), hash)
      .input('display_name', sql.NVarChar(200), r.display_name || null)
      .input('email', sql.NVarChar(255), r.email || null)
      .input('role_id', sql.Int, parseInt(r.role_id, 10))
      .input('is_active', sql.Bit, r.is_active === 'true')
      .query('SET IDENTITY_INSERT users ON; INSERT INTO users (user_id, username, password_hash, display_name, email, role_id, is_active) VALUES (@user_id, @username, @password_hash, @display_name, @email, @role_id, @is_active); SET IDENTITY_INSERT users OFF');
  }

  const palletsCsv = fs.readFileSync(path.join(seedDir, 'pallets.csv'), 'utf8');
  const { rows: palletsRows } = parseCsv(palletsCsv);
  for (const r of palletsRows) {
    if (!r.barcode) continue;
    await pool.request()
      .input('barcode', sql.NVarChar(100), r.barcode)
      .input('type', sql.NVarChar(50), r.type || null)
      .input('size', sql.NVarChar(50), r.size || null)
      .input('condition_status', sql.NVarChar(50), r.condition_status || 'Good')
      .input('current_area_id', sql.Int, r.current_area_id ? parseInt(r.current_area_id, 10) : null)
      .input('owner', sql.NVarChar(200), r.owner || null)
      .input('created_by', sql.Int, parseInt(r.created_by, 10))
      .query(`INSERT INTO pallets (barcode, type, size, condition_status, current_area_id, owner, created_by)
       VALUES (@barcode, @type, @size, @condition_status, @current_area_id, @owner, @created_by)`);
  }

  const movementsCsv = fs.readFileSync(path.join(seedDir, 'movements.csv'), 'utf8');
  const { rows: movementsRows } = parseCsv(movementsCsv);
  for (const r of movementsRows) {
    if (!r.movement_id) continue;
    await pool.request()
      .input('movement_id', sql.Int, parseInt(r.movement_id, 10))
      .input('pallet_id', sql.Int, parseInt(r.pallet_id, 10))
      .input('from_area_id', sql.Int, r.from_area_id ? parseInt(r.from_area_id, 10) : null)
      .input('to_area_id', sql.Int, parseInt(r.to_area_id, 10))
      .input('out_by', sql.Int, parseInt(r.out_by, 10))
      .input('out_at', sql.DateTime2, r.out_at ? new Date(r.out_at) : new Date())
      .input('in_by', sql.Int, r.in_by ? parseInt(r.in_by, 10) : null)
      .input('in_at', sql.DateTime2, r.in_at ? new Date(r.in_at) : null)
      .input('eta', sql.DateTime2, r.eta ? new Date(r.eta) : null)
      .input('movement_status', sql.NVarChar(50), r.movement_status || 'Pending')
      .input('notes', sql.NVarChar(sql.MAX), r.notes || null)
      .query(`SET IDENTITY_INSERT movements ON;
        INSERT INTO movements (movement_id, pallet_id, from_area_id, to_area_id, out_by, out_at, in_by, in_at, eta, movement_status, notes)
        VALUES (@movement_id, @pallet_id, @from_area_id, @to_area_id, @out_by, @out_at, @in_by, @in_at, @eta, @movement_status, @notes);
        SET IDENTITY_INSERT movements OFF`);
  }

  await pool.close();
  console.log('Seed done (SQL Server). Default password for all users:', defaultPassword);
}

export { run };
