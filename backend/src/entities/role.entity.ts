import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';

const jsonArrayTransformer = {
  to: (v: string[]) => (v == null ? '[]' : JSON.stringify(v)),
  from: (v: unknown): string[] => {
    if (v == null || v === '') return [];
    try {
      const s = typeof v === 'string' ? v : String(v);
      return JSON.parse(s);
    } catch {
      return [];
    }
  },
};

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn({ name: 'role_id' })
  roleId: number;

  @Column({ type: 'nvarchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'nvarchar', length: 'MAX', default: '[]', transformer: jsonArrayTransformer })
  permissions: string[];

  @OneToMany(() => User, (u) => u.role)
  users: User[];
}
