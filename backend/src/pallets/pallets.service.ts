import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pallet, ConditionStatus } from '../entities/pallet.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PalletsService {
  constructor(
    @InjectRepository(Pallet)
    private repo: Repository<Pallet>,
    private audit: AuditService,
  ) {}

  private baseQuery() {
    return this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.currentArea', 'a')
      .leftJoinAndSelect('p.creator', 'u')
      .where('p.deleted_at IS NULL');
  }

  async findByBarcode(barcode: string): Promise<Pallet | null> {
    const trimmed = barcode?.trim() ?? '';
    if (!trimmed) return null;
    let pallet = await this.repo.findOne({ where: { barcode: trimmed } });
    if (!pallet) {
      const raw = await this.repo
        .createQueryBuilder('p')
        .select(['p.pallet_id AS id', 'p.deleted_at AS deletedAt'])
        .where('p.barcode = :barcode', { barcode: trimmed })
        .getRawOne<{ id: number; deletedAt: Date | null }>();
      if (raw?.id != null && (raw.deletedAt === null || raw.deletedAt === undefined)) {
        try {
          pallet = await this.findById(raw.id);
        } catch {
          pallet = null;
        }
      }
    }
    if (!pallet || pallet.deletedAt != null) return null;
    return this.repo.findOne({
      where: { palletId: pallet.palletId },
      relations: ['currentArea', 'creator'],
    });
  }

  async findById(id: number): Promise<Pallet> {
    const pallet = await this.baseQuery()
      .andWhere('p.pallet_id = :id', { id })
      .getOne();
    if (!pallet) throw new NotFoundException('Pallet not found');
    return pallet;
  }

  async findPaginated(filters: {
    barcode?: string;
    currentAreaId?: number;
    conditionStatus?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.currentArea', 'a')
      .leftJoinAndSelect('p.creator', 'u')
      .where('p.deleted_at IS NULL');
    if (filters.barcode) qb.andWhere('p.barcode LIKE :barcode', { barcode: `%${filters.barcode}%` });
    if (filters.currentAreaId) qb.andWhere('p.current_area_id = :aid', { aid: filters.currentAreaId });
    if (filters.conditionStatus) qb.andWhere('p.condition_status = :cs', { cs: filters.conditionStatus });
    qb.orderBy('p.created_at', 'DESC').skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async create(
    data: {
      barcode: string;
      type?: string;
      size?: string;
      currentAreaId: number;
      owner?: string;
    },
    userId: number,
  ) {
    const existing = await this.findByBarcode(data.barcode);
    if (existing) throw new ConflictException('Pallet with this barcode already exists');
    const pallet = this.repo.create({
      barcode: data.barcode,
      type: data.type ?? null,
      size: data.size ?? null,
      conditionStatus: 'Good',
      currentAreaId: data.currentAreaId,
      owner: data.owner ?? null,
      createdBy: userId,
    });
    const saved = await this.repo.save(pallet);
    await this.audit.log({
      entityType: 'Pallet',
      entityId: String(saved.palletId ?? ''),
      action: 'CREATE',
      changedBy: userId,
      afterData: saved as unknown as Record<string, unknown>,
    });
    let id = saved.palletId != null ? Number(saved.palletId) : NaN;
    if (Number.isNaN(id)) {
      const row = await this.repo
        .createQueryBuilder('p')
        .select(['p.pallet_id AS id'])
        .where('p.barcode = :barcode', { barcode: saved.barcode })
        .getRawOne<{ id: number }>();
      if (row?.id != null) id = Number(row.id);
    }
    if (!Number.isNaN(id)) {
      try {
        return await this.findById(id);
      } catch {
        const basic = await this.repo.findOne({
          where: { palletId: id },
          relations: ['currentArea', 'creator'],
        });
        if (basic) return basic;
      }
    }
    const byBarcode = await this.repo.findOne({
      where: { barcode: saved.barcode },
      relations: ['currentArea', 'creator'],
    });
    return byBarcode ?? saved;
  }

  async update(
    id: number,
    data: Partial<{
      type: string;
      size: string;
      conditionStatus: ConditionStatus;
      currentAreaId: number;
      owner: string;
      statusChangeReason: string;
    }>,
    userId: number,
  ) {
    const existing = await this.findById(id);
    const before = { ...existing };
    const { statusChangeReason, ...updatePayload } = data;
    await this.repo.update(id, updatePayload);
    const updated = await this.findById(id);
    const afterData = { ...(updated as unknown as Record<string, unknown>) };
    if (statusChangeReason != null && statusChangeReason !== '') {
      afterData.statusChangeReason = statusChangeReason;
    }
    await this.audit.log({
      entityType: 'Pallet',
      entityId: String(id),
      action: 'UPDATE',
      changedBy: userId,
      beforeData: before as unknown as Record<string, unknown>,
      afterData,
    });
    return updated;
  }

  async softDelete(id: number, userId: number) {
    const existing = await this.findById(id);
    await this.repo.softRemove(existing);
    await this.audit.log({
      entityType: 'Pallet',
      entityId: String(id),
      action: 'DELETE',
      changedBy: userId,
      beforeData: existing as unknown as Record<string, unknown>,
    });
  }
}
