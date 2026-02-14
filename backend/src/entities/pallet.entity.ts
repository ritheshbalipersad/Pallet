import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Area } from './area.entity';
import { User } from './user.entity';
import { Movement } from './movement.entity';

export type ConditionStatus = 'Good' | 'Damaged' | 'Lost' | 'Stolen' | 'Unfit';

@Entity('pallets')
export class Pallet {
  @PrimaryGeneratedColumn({ name: 'pallet_id' })
  palletId: number;

  @Column({ type: 'nvarchar', length: 100, unique: true })
  barcode: string;

  @Column({ name: 'type', type: 'nvarchar', length: 50, nullable: true })
  type: string | null;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  size: string | null;

  @Column({ name: 'condition_status', type: 'nvarchar', length: 50, default: 'Good' })
  conditionStatus: ConditionStatus;

  @Column({ name: 'current_area_id', type: 'int', nullable: true })
  currentAreaId: number | null;

  @ManyToOne(() => Area, { nullable: true })
  @JoinColumn({ name: 'current_area_id' })
  currentArea: Area | null;

  @Column({ type: 'nvarchar', length: 200, nullable: true })
  owner: string | null;

  @Column({ name: 'created_by', type: 'int' })
  createdBy: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  @OneToMany(() => Movement, (m) => m.pallet)
  movements: Movement[];
}
