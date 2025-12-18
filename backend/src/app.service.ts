import { Injectable } from '@nestjs/common';
import { BattleMerchantImportService } from './features/importer/battlemerchant.service';
import { FreyhandImportService } from './features/importer/freyhand.service';

@Injectable()
export class AppService {
  constructor(
    private battleMerchantService: BattleMerchantImportService,
    private freyhandImportService: FreyhandImportService,
  ) {
    // this.battleMerchantService.main();
    void this.freyhandImportService.main();
    console.log('FINISH');
  }
}
