import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Area } from '../entities/area.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AreasService {
  constructor(
    @InjectRepository(Area)
    private repo: Repository<Area>,
    private audit: AuditService,
  ) {}

  async findAll(): Promise<Area[]> {
    return this.repo.find({
      order: { name: 'ASC' },
      relations: ['parentArea'],
    });
  }

  async findById(id: number): Promise<Area> {
    const area = await this.repo.findOne({
      where: { areaId: id },
      relations: ['parentArea', 'children'],
    });
    if (!area) throw new NotFoundException('Area not found');
    return area;
  }

  async create(
    data: { name: string; type?: string; parentAreaId?: number; capacity?: number },
    userId: number,
  ) {
    const area = this.repo.create({
      name: data.name,
      type: data.type ?? null,
      parentAreaId: data.parentAreaId ?? null,
      capacity: data.capacity ?? null,
    });
    const saved = await this.repo.save(area);
    await this.audit.log({
      entityType: 'Area',
      entityId: String(saved.areaId),
      action: 'CREATE',
      changedBy: userId,
      afterData: saved as unknown as Record<string, unknown>,
    });
    return saved;
  }

  async update(
    id: number,
    data: Partial<{ name: string; type: string; parentAreaId: number; capacity: number }>,
    userId: number,
  ) {
    const existing = await this.findById(id);
    const before = { ...existing };
    await this.repo.update(id, data);
    const updated = await this.findById(id);
    await this.audit.log({
      entityType: 'Area',
      entityId: String(id),
      action: 'UPDATE',
      changedBy: userId,
      beforeData: before as unknown as Record<string, unknown>,
      afterData: updated as unknown as Record<string, unknown>,
    });
    return updated;
  }

  async remove(id: number, userId: number) {
    const existing = await this.findById(id);
    await this.repo.delete(id);
    await this.audit.log({
      entityType: 'Area',
      entityId: String(id),
      action: 'DELETE',
      changedBy: userId,
      beforeData: existing as unknown as Record<string, unknown>,
    });
  }
}
