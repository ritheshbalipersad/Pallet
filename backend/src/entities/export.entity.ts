import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

const jsonObjectTransformer = {
  to: (v: Record<string, unknown>) => (v == null ? '{}' : JSON.stringify(v)),
  from: (v: string) => (v == null || v === '' ? {} : JSON.parse(v)),
};

@Entity('exports')
export class Export {
  @PrimaryGeneratedColumn({ name: 'export_id' })
  exportId: number;

  @Column({ name: 'report_type', type: 'nvarchar', length: 100 })
  reportType: string;

  @Column({ type: 'nvarchar', length: 'MAX', default: '{}', transformer: jsonObjectTransformer })
  parameters: Record<string, unknown>;

  @Column({ name: 'generated_by', type: 'int' })
  generatedBy: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'generated_by' })
  generatedByUser: User;

  @Column({ name: 'generated_at', type: 'datetime2', default: () => 'GETDATE()' })
  generatedAt: Date;

  @Column({ name: 'file_path', type: 'nvarchar', length: 500, nullable: true })
  filePath: string | null;

  @Column({ type: 'nvarchar', length: 50, default: 'Pending' })
  status: string;
}
