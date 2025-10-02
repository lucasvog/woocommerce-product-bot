import { Injectable } from '@nestjs/common';
import { AiService } from './features/ai/ai.service';
import { ImageService } from './features/image/image.service';
import { WoocommerceService } from './features/woocommerce/woocommerce.service';
import { WordpressService } from './features/wordpress/wordpress.service';
import { ImporterService } from './features/importer/importer.service';

@Injectable()
export class AppService {
  constructor(
    private aiService: AiService,
    private imageService: ImageService,
    private importerService: ImporterService,
    private woocommerceService: WoocommerceService,
    private wordpressService: WordpressService,
  ) {
    this.generateProductforHandelsgilde();
  }
  async generateProductforHandelsgilde() {
    //http://csv.battlemerchant.com/Products_back_in_stock_7_days.csv

    // http://csv.battlemerchant.com/Products_in_stock.csv

    // http://csv.battlemerchant.com/Products_out_of_stock.csv

    // http://csv.battlemerchant.com/Produktinfo.csv

    const providerProducts = await this.importerService.getCsvWithHeader(
      'http://csv.battlemerchant.com/Produktinfo.csv',
    );
    console.log(providerProducts);
  }
}
