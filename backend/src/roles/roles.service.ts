import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private repo: Repository<Role>,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }
}
