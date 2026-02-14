import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { AreasModule } from './areas/areas.module';
import { PalletsModule } from './pallets/pallets.module';
import { MovementsModule } from './movements/movements.module';
import { UsersModule } from './users/users.module';
import { ReportsModule } from './reports/reports.module';
import { ExportsModule } from './exports/exports.module';
import { AuditModule } from './audit/audit.module';
import { RolesModule } from './roles/roles.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(__dirname, '..', '.env'), join(process.cwd(), '.env')],
    }),
    TypeOrmModule.forRoot(getTypeOrmConfig()),
    AuthModule,
    AreasModule,
    PalletsModule,
    MovementsModule,
    UsersModule,
    RolesModule,
    ReportsModule,
    ExportsModule,
    AuditModule,
  ],
})
export class AppModule {}
