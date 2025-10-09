import { forwardRef, Module } from '@nestjs/common';
import { WoocommerceService } from './woocommerce.service';
import { WoocommerceController } from './woocommerce.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [forwardRef(() => AiModule)],
  controllers: [WoocommerceController],
  providers: [WoocommerceService],
  exports: [WoocommerceService],
})
export class WoocommerceModule {}
