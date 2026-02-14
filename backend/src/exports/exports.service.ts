import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Export } from '../entities/export.entity';
import { ReportsService } from '../reports/reports.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ExportsService {
  private storagePath: string;

  constructor(
    @InjectRepository(Export)
    private repo: Repository<Export>,
    private reports: ReportsService,
  ) {
    this.storagePath = process.env.EXPORT_STORAGE_PATH || path.join(process.cwd(), 'storage', 'exports');
    try {
      fs.mkdirSync(this.storagePath, { recursive: true });
    } catch {
      // ignore
    }
  }

  async create(reportType: string, parameters: Record<string, unknown>, userId: number) {
    const result = await this.repo.insert({
      reportType,
      parameters: parameters ?? {},
      generatedBy: userId,
      status: 'Pending',
    } as Parameters<Repository<Export>['insert']>[0]);
    const raw = result.identifiers?.[0] as { export_id?: number; exportId?: number } | undefined;
    const exportId = raw?.export_id ?? raw?.exportId;
    if (exportId == null) {
      const row = await this.repo
        .createQueryBuilder('e')
        .select('e.export_id', 'id')
        .where('e.generated_by = :uid', { uid: userId })
        .orderBy('e.export_id', 'DESC')
        .limit(1)
        .getRawOne<{ id: number }>();
      const id = row?.id;
      if (id == null) throw new Error('Export created but could not get id');
      const exp = await this.repo.findOne({ where: { exportId: id } });
      return exp ?? { exportId: id, reportType, status: 'Pending', generatedBy: userId, generatedAt: new Date(), filePath: null, parameters };
    }
    const exp = await this.repo.findOne({ where: { exportId } });
    return exp ?? { exportId, reportType, status: 'Pending', generatedBy: userId, generatedAt: new Date(), filePath: null, parameters };
  }

  async listByUser(userId: number, page = 1, limit = 20) {
    const total = await this.repo.count({ where: { generatedBy: userId } });
    const items = await this.repo.find({
      where: { generatedBy: userId },
      order: { generatedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async getById(id: number, userId?: number): Promise<Export> {
    const exp = await this.repo.findOne({ where: { exportId: id } });
    if (!exp) throw new NotFoundException('Export not found');
    if (userId != null && exp.generatedBy !== userId) throw new NotFoundException('Export not found');
    return exp;
  }

  async setCompleted(id: number, filePath: string) {
    await this.repo.update(id, { status: 'Completed', filePath });
  }

  async setFailed(id: number) {
    await this.repo.update(id, { status: 'Failed' });
  }

  async generateCsv(exportId: number): Promise<string> {
    const exp = await this.repo.findOne({ where: { exportId } });
    if (!exp) throw new NotFoundException('Export not found');
    let rows: Record<string, unknown>[] = [];
    try {
      switch (exp.reportType) {
        case 'area-summary':
          rows = (await this.reports.areaSummary()) as unknown as Record<string, unknown>[];
          break;
        case 'pallet-status':
          rows = (await this.reports.palletStatus()) as unknown as Record<string, unknown>[];
          break;
        case 'movement-history': {
          const p = (exp.parameters || {}) as { from?: string; to?: string; limit?: number };
          rows = (await this.reports.movementHistory({
            from: p.from ? new Date(p.from) : undefined,
            to: p.to ? new Date(p.to) : undefined,
            limit: p.limit,
          })) as unknown as Record<string, unknown>[];
          break;
        }
        case 'lost-damaged':
          rows = (await this.reports.lostDamaged()) as unknown as Record<string, unknown>[];
          break;
        case 'overdue-inbound':
          rows = (await this.reports.overdueInbound()) as unknown as Record<string, unknown>[];
          break;
        default:
          await this.setFailed(exportId);
          throw new Error('Unknown report type');
      }
      const csv = this.toCsv(Array.isArray(rows) ? rows : []);
      const filename = `export_${exportId}_${Date.now()}.csv`;
      const filePath = path.join(this.storagePath, filename);
      fs.mkdirSync(this.storagePath, { recursive: true });
      fs.writeFileSync(filePath, csv, 'utf8');
      await this.setCompleted(exportId, filePath);
      return filePath;
    } catch (err) {
      await this.setFailed(exportId);
      throw err;
    }
  }

  private toCsv(rows: Record<string, unknown>[]): string {
    if (rows.length === 0) return '';
    const safeValue = (v: unknown): string => {
      if (v == null) return '';
      if (typeof v === 'object') {
        if (v instanceof Date) return v.toISOString();
        try {
          const o = v as Record<string, unknown>;
          if (typeof o.name === 'string') return o.name;
          if (typeof o.barcode === 'string') return o.barcode;
          return JSON.stringify(v);
        } catch {
          return '';
        }
      }
      const s = String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const headers = [...new Set(rows.flatMap((r) => Object.keys(r).filter((k) => typeof r[k] !== 'function')))];
    const escape = (s: string) =>
      s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    const line = (obj: Record<string, unknown>) =>
      headers.map((h) => escape(safeValue(obj[h]))).join(',');
    return [headers.join(','), ...rows.map(line)].join('\n');
  }

  getFilePath(exp: Export): string {
    if (!exp.filePath || !fs.existsSync(exp.filePath)) throw new NotFoundException('File not available');
    return exp.filePath;
  }
}
