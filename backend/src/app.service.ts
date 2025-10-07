import { Injectable } from '@nestjs/common';
import { AiService } from './features/ai/ai.service';
import { ImageService } from './features/image/image.service';
import { WoocommerceService } from './features/woocommerce/woocommerce.service';
import { WordpressService } from './features/wordpress/wordpress.service';
import { ImporterService } from './features/importer/importer.service';
import { Products } from 'woocommerce-rest-ts-api';

@Injectable()
export class AppService {
  constructor(
    private aiService: AiService,
    private imageService: ImageService,
    private importerService: ImporterService,
    private woocommerceService: WoocommerceService,
    private wordpressService: WordpressService,
  ) {
    // this.generateProductforHandelsgilde();
  }
  async generateProductforHandelsgilde() {
    //http://csv.battlemerchant.com/Products_back_in_stock_7_days.csv

    // http://csv.battlemerchant.com/Products_in_stock.csv

    // http://csv.battlemerchant.com/Products_out_of_stock.csv

    // http://csv.battlemerchant.com/Produktinfo.csv

    const infoKeys = [
      'Artikelnr.',
      'EAN',
      'Artikelname',
      'Zolltarifnr.',
      'Variante',
      'Gewicht',
      'Dein Preis',
      'Kundenpreis',
      'Vatermodell',
      'Marke',
      'Bildpfad 1',
      'Bildpfad 2',
      'Bildpfad 3',
      'Bildpfad 4',
      'Bildpfad 5',
      'Bildpfad 6',
      'Shopbeschreibung',
      'Variantenname',
      'GPSR Hersteller',
      'GPSR Verantwortliche Person',
      'GPSR Kontakt',
      'Sicherheitshinweise',
    ] as const;

    type InfoKey = (typeof infoKeys)[number];

    const providerProducts =
      await this.importerService.getCsvWithHeader<InfoKey>(
        'http://csv.battlemerchant.com/Produktinfo.csv',
      );
    const categories = await this.woocommerceService.getAllCategories();
    console.log(providerProducts);
    if (!providerProducts) {
      console.error('No Products found');
      return;
    }
    if (!categories) {
      console.error('Could not load categories');
      return;
    }
    const skippedProducts: string[] = [];
    //TODO: add check or metadata of importer!
    for (const providerProduct of providerProducts.slice(0, 2)) {
      const rewrittenDescription = await this.aiService.textResponse(
        'Du bist ein Textbot, der HTML-Beschreibungen von Produkten umformuliert. Wichtig ist, dass die Fakten gleich bleiben, aber sich die Formulierung vom folgenden Originaltext unterscheidet. Der HTML-Code ist für eine WooCommerce Produktbeschreibung. Formuliere den Text weniger überschwänglich und eher mehr faktenbasiert. Denke auch an die SEO-Suchbarkeit des Textes. Antworte mit nichts anderem als den unformulierten Text.',
        providerProduct.Shopbeschreibung,
      );
      const shortDescription = await this.aiService.textResponse(
        'Du bist ein Textbot, der Kurzbeschreibungen für Produkte in WooCommerce erzeugt. Du nimmst dafür den folgenden Text des Titels und der Beschreibung und generierst daraus eine Kurzbeschreibung, nicht mehr als einen Satz. Ein Beispiel für eine Kurzbeschreibung ist das hier: "<p>Authentische Nachbildung des US-Kavalleriesäbels von 1860 mit Karbonstahlklinge und Messinggriff.</p>". Antworte mit nichts anderen als so eine Kurzbeschreibung.',
        providerProduct.Artikelname + '\n\n' + providerProduct.Shopbeschreibung,
      );
      const productCategories = await this.aiService.categoryNumberResponse(
        JSON.stringify(categories),
        providerProduct.Artikelname + '\n\n' + providerProduct.Shopbeschreibung,
      );
      if (!rewrittenDescription || !shortDescription || !productCategories) {
        skippedProducts.push(providerProduct['Artikelnr.']);
        continue;
      }

      const wooProduct: Partial<Products> = {
        name: providerProduct.Artikelname,
        status: 'draft',
        description: rewrittenDescription,
        short_description: shortDescription,
        price: providerProduct.Kundenpreis.replace(',', '.'),
        regular_price: providerProduct.Kundenpreis.replace(',', '.'),
        tax_status: 'taxable',
        manage_stock: true,
        stock_quantity: 0, //TODO: insert?
        backorders: 'no',
        weight: providerProduct.Gewicht.replace(',', '.'),
        dimensions: { length: '', width: '', height: '' },
        // related_ids: [], //TODO: Nachfragen? wie soll das gehen?
        categories: productCategories,
        tags: [], //TODO: retrieve
        images: [], //TODO: images
        attributes: [],
        default_attributes: [],
        variations: [],
        grouped_products: [],
        menu_order: 0,
        per_page: 0,
        page: 0,
        context: '',
        search: '',
        after: '',
        before: '',
        modified_after: '',
        modified_before: '',
        dates_are_gmt: false,
        exclude: [],
        include: [],
        offset: 0,
        order: '',
        orderby: '',
        parent: [],
        parent_exclude: [],

        type: '',
        sku: providerProduct['Artikelnr.'],
        featured: false,
        tag: '',
        attribute: '',
        attribute_term: '',
        tax_class: '',
        on_sale: false,
        min_price: '',
        max_price: '',
        stock_status: '',
      };
    }
  }
}
