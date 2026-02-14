import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  userId: number;

  @Column({ type: 'nvarchar', length: 100, unique: true })
  username: string;

  @Column({ name: 'password_hash', type: 'nvarchar', length: 255 })
  @Exclude()
  passwordHash: string;

  @Column({ name: 'display_name', type: 'nvarchar', length: 200, nullable: true })
  displayName: string | null;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  email: string | null;

  @Column({ name: 'role_id', type: 'int' })
  roleId: number;

  @ManyToOne(() => Role, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'is_active', type: 'bit', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
