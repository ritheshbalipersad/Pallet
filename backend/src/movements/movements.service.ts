import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Movement, MovementStatus } from '../entities/movement.entity';
import { Pallet } from '../entities/pallet.entity';
import { AuditService } from '../audit/audit.service';

/** Find pallet by id, non-deleted only (SQL Server–friendly). */
async function findPalletForMovement(repo: Repository<Pallet>, palletId: number): Promise<Pallet | null> {
  return repo
    .createQueryBuilder('p')
    .leftJoinAndSelect('p.currentArea', 'a')
    .where('p.pallet_id = :id', { id: palletId })
    .andWhere('p.deleted_at IS NULL')
    .getOne();
}

@Injectable()
export class MovementsService {
  constructor(
    @InjectRepository(Movement)
    private repo: Repository<Movement>,
    @InjectRepository(Pallet)
    private palletRepo: Repository<Pallet>,
    private audit: AuditService,
  ) {}

  private movementQuery() {
    return this.repo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.pallet', 'p')
      .leftJoinAndSelect('m.fromArea', 'fa')
      .leftJoinAndSelect('m.toArea', 'ta')
      .leftJoinAndSelect('m.outByUser', 'ob')
      .leftJoinAndSelect('m.inByUser', 'ib');
  }

  async findById(id: number): Promise<Movement> {
    const m = await this.movementQuery()
      .where('m.movement_id = :id', { id })
      .getOne();
    if (!m) throw new NotFoundException('Movement not found');
    return m;
  }

  async findPaginated(filters: {
    palletId?: number;
    movementStatus?: string;
    page?: number;
    limit?: number;
  }) {
    const pageNum = Math.max(1, filters.page ?? 1);
    const limitNum = Math.min(100, Math.max(1, filters.limit ?? 20));
    const statusFilter = filters.movementStatus?.trim();

    const countQb = this.repo.createQueryBuilder('m');
    if (filters.palletId != null) countQb.andWhere('m.pallet_id = :pid', { pid: filters.palletId });
    if (statusFilter) countQb.andWhere('LOWER(LTRIM(RTRIM(m.movement_status))) = LOWER(:st)', { st: statusFilter });
    const total = await countQb.getCount();

    const idQb = this.repo
      .createQueryBuilder('m')
      .select(['m.movement_id AS id'])
      .orderBy('m.out_at', 'DESC');
    if (filters.palletId != null) idQb.andWhere('m.pallet_id = :pid', { pid: filters.palletId });
    if (statusFilter) idQb.andWhere('LOWER(LTRIM(RTRIM(m.movement_status))) = LOWER(:st)', { st: statusFilter });
    idQb.skip((pageNum - 1) * limitNum).take(limitNum);
    const idRows = await idQb.getRawMany<Record<string, unknown>>();
    const ids = idRows
      .map((r) => Number(r.id ?? r.movement_id ?? r.m_id))
      .filter((id) => !Number.isNaN(id) && id > 0);

    if (ids.length === 0) return { items: [], total, page: pageNum, limit: limitNum };

    const items = await this.repo.find({
      where: { movementId: In(ids) },
      relations: ['pallet', 'fromArea', 'toArea', 'outByUser', 'inByUser'],
      order: { outAt: 'DESC' },
    });
    items.sort((a, b) => ids.indexOf(a.movementId) - ids.indexOf(b.movementId));
    return { items, total, page: pageNum, limit: limitNum };
  }

  async startMovement(
    data: { palletId: number; toAreaId: number; eta?: Date; notes?: string },
    userId: number,
  ) {
    const pallet = await findPalletForMovement(this.palletRepo, data.palletId);
    if (!pallet) throw new NotFoundException('Pallet not found');
    const fromAreaId = pallet.currentAreaId;
    if (fromAreaId === data.toAreaId) throw new BadRequestException('Destination must differ from current area');
    const movement = this.repo.create({
      palletId: data.palletId,
      fromAreaId,
      toAreaId: data.toAreaId,
      outBy: userId,
      outAt: new Date(),
      eta: data.eta ?? null,
      movementStatus: 'Pending',
      notes: data.notes ?? null,
    });
    const saved = await this.repo.save(movement);
    await this.audit.log({
      entityType: 'Movement',
      entityId: String(saved.movementId ?? ''),
      action: 'CREATE',
      changedBy: userId,
      afterData: saved as unknown as Record<string, unknown>,
    });
    let id = saved.movementId != null ? Number(saved.movementId) : NaN;
    if (Number.isNaN(id)) {
      const row = await this.repo
        .createQueryBuilder('m')
        .select(['m.movement_id AS id'])
        .where('m.pallet_id = :pid', { pid: data.palletId })
        .andWhere('m.out_by = :uid', { uid: userId })
        .orderBy('m.out_at', 'DESC')
        .take(1)
        .getRawOne<{ id: number }>();
      if (row?.id != null) id = Number(row.id);
    }
    if (!Number.isNaN(id)) {
      try {
        return await this.findById(id);
      } catch {
        // fallback: return saved with relations loaded by re-querying
      }
    }
    const withRels = await this.repo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.pallet', 'p')
      .leftJoinAndSelect('m.fromArea', 'fa')
      .leftJoinAndSelect('m.toArea', 'ta')
      .leftJoinAndSelect('m.outByUser', 'ob')
      .leftJoinAndSelect('m.inByUser', 'ib')
      .where('m.pallet_id = :pid', { pid: data.palletId })
      .andWhere('m.movement_status = :st', { st: 'Pending' })
      .orderBy('m.out_at', 'DESC')
      .take(1)
      .getOne();
    return withRels ?? saved;
  }

  async confirmMovement(id: number, userId: number, notes?: string, inAt?: Date) {
    const movement = await this.findById(id);
    if (movement.movementStatus !== 'Pending') throw new BadRequestException('Movement is not pending');
    const resolvedInAt = inAt && !Number.isNaN(inAt.getTime()) ? inAt : new Date();
    const outAt = movement.outAt instanceof Date ? movement.outAt : new Date(movement.outAt);
    if (resolvedInAt <= outAt) {
      throw new BadRequestException('In date/time must be after out date/time');
    }
    // Check for overlapping movements: [out_at, in_at] must not overlap any other completed movement for this pallet
    const overlapping = await this.repo
      .createQueryBuilder('m2')
      .where('m2.pallet_id = :palletId', { palletId: movement.palletId })
      .andWhere('m2.movement_id != :id', { id })
      .andWhere('m2.in_at IS NOT NULL')
      .andWhere("LOWER(LTRIM(RTRIM(m2.movement_status))) = 'completed'")
      .andWhere('m2.out_at < :inAt', { inAt: resolvedInAt })
      .andWhere('m2.in_at > :outAt', { outAt })
      .getCount();
    if (overlapping > 0) {
      throw new BadRequestException(
        'This in date/time overlaps with another movement for this pallet. Choose a different date/time.',
      );
    }
    const before = { ...movement };
    movement.inBy = userId;
    movement.inAt = resolvedInAt;
    movement.movementStatus = 'Completed' as MovementStatus;
    if (notes !== undefined) movement.notes = notes;
    await this.repo.save(movement);
    await this.palletRepo.update(movement.palletId, { currentAreaId: movement.toAreaId });
    await this.audit.log({
      entityType: 'Movement',
      entityId: String(id),
      action: 'CONFIRM_IN',
      changedBy: userId,
      beforeData: before as unknown as Record<string, unknown>,
      afterData: movement as unknown as Record<string, unknown>,
    });
    return this.findById(id);
  }
}
