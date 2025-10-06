import { Test, TestingModule } from '@nestjs/testing';
import { BarberosService } from './barberos.service';

describe('BarberosService', () => {
  let service: BarberosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BarberosService],
    }).compile();

    service = module.get<BarberosService>(BarberosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
