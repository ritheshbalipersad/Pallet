import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { Pallet } from '../entities/pallet.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private repo: Repository<AuditLog>,
    @InjectRepository(Pallet)
    private palletRepo: Repository<Pallet>,
  ) {}

  async log(params: {
    entityType: string;
    entityId: string;
    action: string;
    changedBy: number | null;
    beforeData?: Record<string, unknown> | null;
    afterData?: Record<string, unknown> | null;
  }) {
    const log = this.repo.create({
      entityType: params.entityType,
      entityId: String(params.entityId),
      action: params.action,
      changedBy: params.changedBy,
      beforeData: params.beforeData ?? null,
      afterData: params.afterData ?? null,
    });
    await this.repo.save(log);
  }

  async find(filters: {
    entityType?: string;
    entityId?: string;
    action?: string;
    palletBarcode?: string;
    from?: Date;
    to?: Date;
    page?: number;
    limit?: number;
  }) {
    let entityType = filters.entityType?.trim();
    let entityId = filters.entityId?.trim();
    if (filters.palletBarcode?.trim()) {
      try {
        const barcode = filters.palletBarcode.trim();
        const row = await this.palletRepo
          .createQueryBuilder('p')
          .select(['p.pallet_id AS id'])
          .where('p.deleted_at IS NULL')
          .andWhere('LOWER(LTRIM(RTRIM(p.barcode))) = LOWER(:barcode)', { barcode })
          .getRawOne<Record<string, unknown>>();
        const palletId = row?.id ?? row?.pallet_id;
        if (palletId != null) {
          entityType = 'Pallet';
          entityId = String(palletId);
        }
      } catch {
        // ignore barcode lookup failure; keep existing filters
      }
    }
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));

    const countQb = this.repo.createQueryBuilder('a');
    if (entityType) countQb.andWhere('a.entity_type = :entityType', { entityType });
    if (entityId) countQb.andWhere('a.entity_id = :entityId', { entityId });
    if (filters.action?.trim()) countQb.andWhere('a.action = :action', { action: filters.action.trim() });
    if (filters.from) countQb.andWhere('a.changed_at >= :from', { from: filters.from });
    if (filters.to) countQb.andWhere('a.changed_at <= :to', { to: filters.to });
    const total = await countQb.getCount();

    // Avoid join + skip/take on SQL Server which can return no rows; load audit rows only
    const listQb = this.repo
      .createQueryBuilder('a')
      .orderBy('a.changed_at', 'DESC');
    if (entityType) listQb.andWhere('a.entity_type = :entityType', { entityType });
    if (entityId) listQb.andWhere('a.entity_id = :entityId', { entityId });
    if (filters.action?.trim()) listQb.andWhere('a.action = :action', { action: filters.action.trim() });
    if (filters.from) listQb.andWhere('a.changed_at >= :from', { from: filters.from });
    if (filters.to) listQb.andWhere('a.changed_at <= :to', { to: filters.to });
    listQb.skip((page - 1) * limit).take(limit);
    const items = await listQb.getMany();
    return { items, total, page, limit };
  }
}
