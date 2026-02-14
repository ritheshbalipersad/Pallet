import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { Pallet } from '../entities/pallet.entity';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, Pallet])],
  providers: [AuditService],
  controllers: [AuditController],
  exports: [AuditService],
})
export class AuditModule {}
