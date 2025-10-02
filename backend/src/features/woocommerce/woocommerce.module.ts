import { Module } from '@nestjs/common';
import { WoocommerceService } from './woocommerce.service';
import { WoocommerceController } from './woocommerce.controller';

@Module({
  controllers: [WoocommerceController],
  providers: [WoocommerceService],
  exports: [WoocommerceService],
})
export class WoocommerceModule {}
