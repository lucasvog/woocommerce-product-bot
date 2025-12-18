import { forwardRef, Module } from '@nestjs/common';
import { ImporterService } from './importer.service';
import { ImporterController } from './importer.controller';
import { WordpressModule } from '../wordpress/wordpress.module';
import { BattleMerchantImportService } from './battlemerchant.service';
import { FreyhandImportService } from './freyhand.service';
import { AiModule } from '../ai/ai.module';
import { ImageModule } from '../image/image.module';
import { WoocommerceModule } from '../woocommerce/woocommerce.module';

@Module({
  imports: [
    forwardRef(() => AiModule),
    forwardRef(() => ImageModule),
    forwardRef(() => WoocommerceModule),
    forwardRef(() => WordpressModule),
  ],
  controllers: [ImporterController],
  providers: [
    ImporterService,
    BattleMerchantImportService,
    FreyhandImportService,
  ],
  exports: [
    ImporterService,
    BattleMerchantImportService,
    FreyhandImportService,
  ],
})
export class ImporterModule {}
