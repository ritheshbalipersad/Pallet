import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

const jsonObjectTransformer = {
  to: (v: Record<string, unknown> | null) => (v == null ? null : JSON.stringify(v)),
  from: (v: string | null) => (v == null || v === '' ? null : JSON.parse(v)),
};

@Entity('audit_log')
export class AuditLog {
  @PrimaryGeneratedColumn({ name: 'audit_id', type: 'bigint' })
  auditId: string;

  @Column({ name: 'entity_type', type: 'nvarchar', length: 100 })
  entityType: string;

  @Column({ name: 'entity_id', type: 'nvarchar', length: 100 })
  entityId: string;

  @Column({ type: 'nvarchar', length: 50 })
  action: string;

  @Column({ name: 'changed_by', type: 'int', nullable: true })
  changedBy: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'changed_by' })
  changedByUser: User | null;

  @Column({ name: 'changed_at', type: 'datetime2', default: () => 'GETDATE()' })
  changedAt: Date;

  @Column({ name: 'before_data', type: 'nvarchar', length: 'MAX', nullable: true, transformer: jsonObjectTransformer })
  beforeData: Record<string, unknown> | null;

  @Column({ name: 'after_data', type: 'nvarchar', length: 'MAX', nullable: true, transformer: jsonObjectTransformer })
  afterData: Record<string, unknown> | null;
}
