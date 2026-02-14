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
    const exp = this.repo.create({
      reportType,
      parameters,
      generatedBy: userId,
      status: 'Pending',
    });
    return this.repo.save(exp);
  }

  async listByUser(userId: number, page = 1, limit = 20) {
    const [items, total] = await this.repo.findAndCount({
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
    switch (exp.reportType) {
      case 'area-summary':
        rows = (await this.reports.areaSummary()) as unknown as Record<string, unknown>[];
        break;
      case 'pallet-status':
        rows = (await this.reports.palletStatus()) as unknown as Record<string, unknown>[];
        break;
      case 'movement-history': {
        const p = exp.parameters as { from?: string; to?: string; limit?: number };
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
    const csv = this.toCsv(rows);
    const filename = `export_${exportId}_${Date.now()}.csv`;
    const filePath = path.join(this.storagePath, filename);
    fs.writeFileSync(filePath, csv, 'utf8');
    await this.setCompleted(exportId, filePath);
    return filePath;
  }

  private toCsv(rows: Record<string, unknown>[]): string {
    if (rows.length === 0) return '';
    const headers = [...new Set(rows.flatMap((r) => Object.keys(r)))];
    const line = (obj: Record<string, unknown>) =>
      headers
        .map((h) => {
          const v = obj[h];
          if (v == null) return '';
          const s = String(v);
          return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(',');
    return [headers.join(','), ...rows.map(line)].join('\n');
  }

  getFilePath(exp: Export): string {
    if (!exp.filePath || !fs.existsSync(exp.filePath)) throw new NotFoundException('File not available');
    return exp.filePath;
  }
}
