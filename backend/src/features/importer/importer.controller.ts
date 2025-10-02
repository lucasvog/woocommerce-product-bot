import { Controller } from '@nestjs/common';
import { ImporterService } from './importer.service';

@Controller('importer')
export class ImporterController {
  constructor(private readonly importerService: ImporterService) {}
}
