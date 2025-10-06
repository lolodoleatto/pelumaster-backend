import { Test, TestingModule } from '@nestjs/testing';
import { BarberosController } from './barberos.controller';

describe('BarberosController', () => {
  let controller: BarberosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BarberosController],
    }).compile();

    controller = module.get<BarberosController>(BarberosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
