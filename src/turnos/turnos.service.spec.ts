import { Test, TestingModule } from '@nestjs/testing';
import { TurnoService } from './turnos.service';

describe('TurnosService', () => {
  let service: TurnoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TurnoService],
    }).compile();

    service = module.get<TurnoService>(TurnoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
