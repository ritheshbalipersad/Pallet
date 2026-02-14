import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PalletsService } from './pallets.service';
import { Pallet } from '../entities/pallet.entity';
import { AuditService } from '../audit/audit.service';

describe('PalletsService', () => {
  let service: PalletsService;
  let repo: Repository<Pallet>;

  const mockRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    })),
    softRemove: jest.fn(),
  };
  const mockAudit = { log: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PalletsService,
        { provide: getRepositoryToken(Pallet), useValue: mockRepo },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();
    service = module.get(PalletsService);
    repo = module.get(getRepositoryToken(Pallet));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByBarcode', () => {
    it('returns null when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await service.findByBarcode('X');
      expect(result).toBeNull();
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { barcode: 'X', deletedAt: null as unknown as undefined },
        relations: ['currentArea', 'creator'],
      });
    });

    it('returns pallet when found', async () => {
      const pallet = { palletId: 1, barcode: 'PLT001' };
      mockRepo.findOne.mockResolvedValue(pallet);
      const result = await service.findByBarcode('PLT001');
      expect(result).toEqual(pallet);
    });
  });
});
