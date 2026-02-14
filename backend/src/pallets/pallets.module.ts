import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pallet } from '../entities/pallet.entity';
import { PalletsService } from './pallets.service';
import { PalletsController } from './pallets.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Pallet])],
  providers: [PalletsService],
  controllers: [PalletsController],
  exports: [PalletsService],
})
export class PalletsModule {}
