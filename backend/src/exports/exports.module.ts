import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Export } from '../entities/export.entity';
import { ReportsModule } from '../reports/reports.module';
import { ExportsService } from './exports.service';
import { ExportsController } from './exports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Export]), ReportsModule],
  providers: [ExportsService],
  controllers: [ExportsController],
  exports: [ExportsService],
})
export class ExportsModule {}
