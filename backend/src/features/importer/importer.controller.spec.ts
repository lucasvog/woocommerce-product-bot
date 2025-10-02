import { Test, TestingModule } from '@nestjs/testing';
import { ImporterController } from './importer.controller';
import { ImporterService } from './importer.service';

describe('ImporterController', () => {
  let controller: ImporterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImporterController],
      providers: [ImporterService],
    }).compile();

    controller = module.get<ImporterController>(ImporterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
