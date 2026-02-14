import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Pallet } from './pallet.entity';
import { Area } from './area.entity';
import { User } from './user.entity';

export type MovementStatus = 'Pending' | 'Completed' | 'Cancelled';

@Entity('movements')
export class Movement {
  @PrimaryGeneratedColumn({ name: 'movement_id' })
  movementId: number;

  @Column({ name: 'pallet_id', type: 'int' })
  palletId: number;

  @ManyToOne(() => Pallet, (p) => p.movements)
  @JoinColumn({ name: 'pallet_id' })
  pallet: Pallet;

  @Column({ name: 'from_area_id', type: 'int', nullable: true })
  fromAreaId: number | null;

  @ManyToOne(() => Area)
  @JoinColumn({ name: 'from_area_id' })
  fromArea: Area | null;

  @Column({ name: 'to_area_id', type: 'int' })
  toAreaId: number;

  @ManyToOne(() => Area)
  @JoinColumn({ name: 'to_area_id' })
  toArea: Area;

  @Column({ name: 'out_by', type: 'int' })
  outBy: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'out_by' })
  outByUser: User;

  @Column({ name: 'out_at', type: 'datetime2' })
  outAt: Date;

  @Column({ name: 'in_by', type: 'int', nullable: true })
  inBy: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'in_by' })
  inByUser: User | null;

  @Column({ name: 'in_at', type: 'datetime2', nullable: true })
  inAt: Date | null;

  @Column({ name: 'eta', type: 'datetime2', nullable: true })
  eta: Date | null;

  @Column({ name: 'movement_status', type: 'nvarchar', length: 50, default: 'Pending' })
  movementStatus: MovementStatus;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
