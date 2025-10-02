import { Test, TestingModule } from '@nestjs/testing';
import { WoocommerceController } from './woocommerce.controller';
import { WoocommerceService } from './woocommerce.service';

describe('WoocommerceController', () => {
  let controller: WoocommerceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WoocommerceController],
      providers: [WoocommerceService],
    }).compile();

    controller = module.get<WoocommerceController>(WoocommerceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
