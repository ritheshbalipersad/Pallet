import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Pallet } from './pallet.entity';

@Entity('areas')
export class Area {
  @PrimaryGeneratedColumn({ name: 'area_id' })
  areaId: number;

  @Column({ type: 'nvarchar', length: 200 })
  name: string;

  @Column({ name: 'type', type: 'nvarchar', length: 50, nullable: true })
  type: string | null;

  @Column({ name: 'parent_area_id', nullable: true })
  parentAreaId: number | null;

  @ManyToOne(() => Area, (a) => a.children, { nullable: true })
  @JoinColumn({ name: 'parent_area_id' })
  parentArea: Area | null;

  @OneToMany(() => Area, (a) => a.parentArea)
  children: Area[];

  @Column({ type: 'int', nullable: true })
  capacity: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Pallet, (p) => p.currentArea)
  pallets: Pallet[];
}
