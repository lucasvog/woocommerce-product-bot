import { Controller } from '@nestjs/common';
import { WoocommerceService } from './woocommerce.service';

@Controller('woocommerce')
export class WoocommerceController {
  constructor(private readonly woocommerceService: WoocommerceService) {}
}
