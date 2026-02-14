import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { getMssqlConnectionConfig } from './mssql-connection';

export function getTypeOrmConfig(): TypeOrmModuleOptions {
  const c = getMssqlConnectionConfig();

  const options: Record<string, unknown> = {
    encrypt: c.encrypt,
    trustServerCertificate: c.trustServerCertificate,
    enableArithAbort: true,
  };
  if (c.instanceName) {
    options.instanceName = c.instanceName;
  }
  if (c.trustedConnection) {
    options.trustedConnection = true;
  }

  const config: TypeOrmModuleOptions = {
    type: 'mssql',
    host: c.server,
    username: c.user,
    password: c.password,
    database: c.database,
    autoLoadEntities: true,
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
    options,
  };
  if (c.trustedConnection) {
    (config as { driver?: unknown }).driver = require('mssql/msnodesqlv8');
    // Pass our working ODBC connection string so TypeORM uses ODBC Driver 17 (same as db:test)
    (config as { extra?: { connectionString?: string } }).extra = { connectionString: c.connectionString };
  }
  if (!c.instanceName) {
    (config as { port?: number }).port = c.port;
  }
  return config;
}
