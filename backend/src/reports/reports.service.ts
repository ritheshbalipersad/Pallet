import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Area } from '../entities/area.entity';
import { Pallet } from '../entities/pallet.entity';
import { Movement } from '../entities/movement.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Area) private areaRepo: Repository<Area>,
    @InjectRepository(Pallet) private palletRepo: Repository<Pallet>,
    @InjectRepository(Movement) private movementRepo: Repository<Movement>,
  ) {}

  async areaSummary() {
    const areas = await this.areaRepo.find({ order: { name: 'ASC' } });
    const counts = await this.palletRepo
      .createQueryBuilder('p')
      .select('p.current_area_id', 'areaId')
      .addSelect('COUNT(*)', 'count')
      .where('p.deleted_at IS NULL')
      .andWhere('p.current_area_id IS NOT NULL')
      .groupBy('p.current_area_id')
      .getRawMany<{ areaId: number; count: string }>();
    const map = new Map(counts.map((c) => [c.areaId, parseInt(c.count, 10)]));
    return areas.map((a) => ({
      areaId: a.areaId,
      name: a.name,
      type: a.type,
      capacity: a.capacity,
      palletCount: map.get(a.areaId) ?? 0,
    }));
  }

  async palletStatus() {
    const raw = await this.palletRepo
      .createQueryBuilder('p')
      .select('p.condition_status', 'conditionStatus')
      .addSelect('COUNT(*)', 'count')
      .where('p.deleted_at IS NULL')
      .groupBy('p.condition_status')
      .getRawMany<{ conditionStatus: string; count: string }>();
    return raw.map((r) => ({ conditionStatus: r.conditionStatus, count: parseInt(r.count, 10) }));
  }

  async movementHistory(filters: { from?: Date; to?: Date; limit?: number }) {
    const limitNum = Math.min(1000, filters.limit ?? 100);
    const idQb = this.movementRepo
      .createQueryBuilder('m')
      .select(['m.movement_id AS id'])
      .orderBy('m.out_at', 'DESC')
      .take(limitNum);
    if (filters.from) idQb.andWhere('m.out_at >= :from', { from: filters.from });
    if (filters.to) idQb.andWhere('m.out_at <= :to', { to: filters.to });
    const idRows = await idQb.getRawMany<Record<string, unknown>>();
    const ids = idRows
      .map((r) => Number(r.id ?? r.movement_id ?? r.m_id))
      .filter((id): id is number => !Number.isNaN(id) && id > 0);
    if (ids.length === 0) return [];
    return this.movementRepo.find({
      where: { movementId: In(ids) },
      relations: ['pallet', 'fromArea', 'toArea', 'outByUser', 'inByUser'],
      order: { outAt: 'DESC' },
    });
  }

  async lostDamaged() {
    return this.palletRepo.find({
      where: [
        { conditionStatus: 'Lost', deletedAt: null as unknown as undefined },
        { conditionStatus: 'Damaged', deletedAt: null as unknown as undefined },
        { conditionStatus: 'Stolen', deletedAt: null as unknown as undefined },
        { conditionStatus: 'Unfit', deletedAt: null as unknown as undefined },
      ],
      relations: ['currentArea'],
      order: { updatedAt: 'DESC' },
    });
  }

  async overdueInbound() {
    const now = new Date();
    const idRows = await this.movementRepo
      .createQueryBuilder('m')
      .select(['m.movement_id AS id'])
      .where('LOWER(LTRIM(RTRIM(m.movement_status))) = LOWER(:st)', { st: 'Pending' })
      .andWhere('m.eta IS NOT NULL')
      .andWhere('m.eta < :now', { now })
      .orderBy('m.out_at', 'ASC')
      .getRawMany<Record<string, unknown>>();
    const ids = idRows
      .map((r) => Number(r.id ?? r.movement_id))
      .filter((id): id is number => !Number.isNaN(id) && id > 0);
    if (ids.length === 0) return [];
    return this.movementRepo.find({
      where: { movementId: In(ids) },
      relations: ['pallet', 'fromArea', 'toArea', 'outByUser'],
      order: { outAt: 'ASC' },
    });
  }
}
