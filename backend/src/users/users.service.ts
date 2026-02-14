import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private repo: Repository<User>,
  ) {}

  async findByUsername(username: string): Promise<User | null> {
    return this.repo.findOne({
      where: { username },
      relations: ['role'],
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.repo.findOne({
      where: { userId: id },
      relations: ['role'],
    });
  }

  async findAll(page = 1, limit = 20) {
    const [items, total] = await this.repo.findAndCount({
      relations: ['role'],
      skip: (page - 1) * limit,
      take: limit,
      order: { userId: 'ASC' },
    });
    return { items, total, page, limit };
  }

  async create(data: {
    username: string;
    password: string;
    displayName?: string;
    email?: string;
    roleId: number;
  }) {
    const hash = await bcrypt.hash(data.password, 10);
    const user = this.repo.create({
      username: data.username,
      passwordHash: hash,
      displayName: data.displayName ?? null,
      email: data.email ?? null,
      roleId: data.roleId,
      isActive: true,
    });
    return this.repo.save(user);
  }

  async update(
    id: number,
    data: Partial<{ displayName: string; email: string; roleId: number; isActive: boolean; password: string }>,
  ) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    const update: Partial<User> = {};
    if (data.displayName !== undefined) update.displayName = data.displayName;
    if (data.email !== undefined) update.email = data.email;
    if (data.roleId !== undefined) update.roleId = data.roleId;
    if (data.isActive !== undefined) update.isActive = data.isActive;
    if (data.password) update.passwordHash = await bcrypt.hash(data.password, 10);
    if (Object.keys(update).length === 0) return user;
    await this.repo.update(id, update);
    return this.findById(id);
  }
}
