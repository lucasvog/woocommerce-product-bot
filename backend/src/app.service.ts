import { Injectable } from '@nestjs/common';
import { AiService } from './features/ai/ai.service';
import { ImageService } from './features/image/image.service';
import { WoocommerceService } from './features/woocommerce/woocommerce.service';
import { WordpressService } from './features/wordpress/wordpress.service';
import { ImporterService } from './features/importer/importer.service';
import { Products } from 'woocommerce-rest-ts-api';
import { Images } from 'node_modules/woocommerce-rest-ts-api/dist/src/typesANDinterfaces';

@Injectable()
export class AppService {
  constructor(
    private aiService: AiService,
    private imageService: ImageService,
    private importerService: ImporterService,
    private woocommerceService: WoocommerceService,
    private wordpressService: WordpressService,
  ) {
    this.generateProductforHandelsgildeProducs();
  }
  async generateProductforHandelsgildeProducs() {
    //http://csv.battlemerchant.com/Products_back_in_stock_7_days.csv

    // http://csv.battlemerchant.com/Products_in_stock.csv

    // http://csv.battlemerchant.com/Products_out_of_stock.csv

    // http://csv.battlemerchant.com/Produktinfo.csv

    const errors: string[] = [];

    type InfoKey =
      | 'Artikelnr.'
      | 'EAN'
      | 'Artikelname'
      | 'Zolltarifnr.'
      | 'Variante'
      | 'Gewicht'
      | 'Dein Preis'
      | 'Kundenpreis'
      | 'Vatermodell'
      | 'Marke'
      | 'Bildpfad 1'
      | 'Bildpfad 2'
      | 'Bildpfad 3'
      | 'Bildpfad 4'
      | 'Bildpfad 5'
      | 'Bildpfad 6'
      | 'Shopbeschreibung'
      | 'Variantenname'
      | 'GPSR Hersteller'
      | 'GPSR Verantwortliche Person'
      | 'GPSR Kontakt'
      | 'Sicherheitshinweise';

    const providerProducts =
      await this.importerService.getCsvWithHeader<InfoKey>(
        'http://csv.battlemerchant.com/Produktinfo.csv',
      );
    // const providerProducts =
    //   await this.importerService.getCsvWithHeader<InfoKey>(
    //     './data/Produktinfo.csv',
    //     { isLocal: true },
    //   );
    const categories = await this.woocommerceService.getAllCategories();
    // console.log(providerProducts);
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
    let maximumNumberOfProductsToRun = 1;
    for (const providerProduct of providerProducts
      .filter((e) => e !== undefined && e.Vatermodell === '')
      .filter(
        (e) =>
          e.Shopbeschreibung === undefined ||
          e.Shopbeschreibung.toLowerCase().includes('alkohol') === false,
      )
      .filter(
        (e) =>
          e.Sicherheitshinweise === undefined ||
          e.Sicherheitshinweise.toLowerCase().includes('scharf') === false,
      )) {
      const foundProduct = await this.woocommerceService.getProductsBySku(
        providerProduct['Artikelnr.'],
      );
      if (foundProduct && foundProduct.length > 0) {
        console.log(
          'Skipping product as it is already created:  ' +
            providerProduct.Artikelname,
        );
        continue;
      }
      maximumNumberOfProductsToRun--;
      if (maximumNumberOfProductsToRun < 0) {
        console.log('Stopping because of maximum number of products reached');
        break;
      }
      console.log('Found product to generate:', providerProduct.Artikelname);
      const rewrittenDescription = await this.aiService.textResponse(
        `{
  "meta": {
    "version": "1.0",
    "language": "de",
    "tone": "locker-professionell, du-Form, leicht humorvoll",
    "house_style": [
      "kurze, klare Sätze",
      "maximal 2-3 Sätze pro Abschnitt",
      "keine Floskeln, kein Marketing-Blabla",
      "technische Fakten vorziehen"
    ]
  },
  "input": {
    "product_name": "${providerProduct.Artikelname}",
    "provided_description": \`${providerProduct.Shopbeschreibung}\`,
    "research": {
      "query_hint": "Historische Einordnung zu "${providerProduct.Artikelname}" (Epoche, Region, Nutzung); verwandte Begriffe mit einbeziehen",
      "notes": "Stichpunkte aus der Recherche: Jahreszahlen, Regionen, Nutzung, Besonderheiten; nur belastbare Fakten"
    }
  },
  "rules": {
    "forbidden_in_details": ["Material", "Werkstoff", "Leder", "Stahl", "Baumwolle", "Leinen", "Holz", "Messing"],
    "lengths": {
      "summary_rewrite_max_chars": 380,
      "historical_context_max_chars": 420,
      "materials_craft_max_chars": 480,
      "detail_item_max_chars": 120,
      "details_min_items": 4,
      "details_max_items": 8
    },
    "style": {
      "no_hard_promises": true,
      "avoid_superlatives": true,
      "use_present_tense": true
    },
  },
  "output": {
    "title": "${providerProduct.Artikelname}",
    "mode":"STRICT_HTML_ONLY_NO_MARKDOWN",
    "summary_rewrite": "Kurz zusammengefasst, umgeschrieben aus der Vorgabe – ohne Copy/Paste, neutral, 1–2 Sätze.",
    "historical_context": "Zeitliche Einordnung (Epoche/Region) + 1–2 belastbare Fakten aus der Recherche; knapper Nutzen/Verwendungszweck. ",
    "materials_craft_examples": {
      "material": "Hauptmaterialien (z. B. Rindleder 3–3,5 mm, Stahl C45, Leinen 240 g/m²)",
      "construction": "Fertigung/Techniken (z. B. handvernietet, pflanzlich gegerbt, doppelte Nähte, ölgehärtet)",
      "finish": "Oberfläche/Behandlung (z. B. brüniert, geölt, patiniert)",
      "care": "Pflegehinweise kurz (z. B. trocken lagern, einfetten, Rostschutz)"
    },
    "details_examples": [
      "Stichpunkt 1 ohne Materialbegriff",
      "Stichpunkt 2 (Maße, Passform, Systemkompatibilität)",
      "Stichpunkt 3 (Gewicht, Abmessungen, Verschlussart)",
      "Stichpunkt 4 (Lieferumfang, Hinweise, Normen)"
    ],
    "html_blocks": {
      "title_h1": "<h1>${providerProduct.Artikelname}</h1>",
      "summary": "<p>...</p>",
      "materials": "<h3>Material &amp; Verarbeitung</h3><p>...</p>",
      "details_ul": "<ul><li>...</li><li>...</li><li>...</li><li>...</li></ul>"
    }
  },
  "quality_checks": {
    "no_material_words_in_details": true,
    "has_min_details": true,
    "summary_not_too_long": true
  }
}`,
        providerProduct.Shopbeschreibung,
      );
      console.log('DESCRIPTION:\n\n', rewrittenDescription, '\n\n');
      console.log('rewritting short description:', providerProduct.Artikelname);
      const shortDescription = await this.aiService.textResponse(`{
  "meta": {
    "version": "1.0",
    "type": "short_description",
    "goal":"Kurze Produktbeschreibung für WooCommerce",
    "language": "de",
    "source": "provided_description_only",
    "rules": {
      "max_points": 5,
      "tone": "neutral, informativ, kurz",
      "style": [
        "keine vollständigen Sätze",
        "kein Marketing-Slang",
        "keine Wiederholung des Produktnamens",
        "jedes Stichwort beginnt mit einem Großbuchstaben",
        "keine Punktuation am Ende"
      ],
      "focus": ["Gattung", "Verwendung", "Material", "Verarbeitung", "Besonderheiten"]
    }
  },
  "input": {
    "product_name": "${providerProduct.Artikelname},
    "provided_description": \`${providerProduct.Shopbeschreibung}\`
  },
  "output": {
  "mode":"STRICT_HTML_ONLY_NO_MARKDOWN",
    "short_description_bullets_examples": [
      "Stichpunkt 1 – Gattung oder Art des Produkts (z. B. 'Mittelalterlicher Gürtel')",
      "Stichpunkt 2 – Hauptverwendung oder Einsatzzweck (z. B. 'Geeignet für Reenactment und LARP')",
      "Stichpunkt 3 – Hauptmaterial und Verarbeitung (z. B. 'Pflanzlich gegerbtes Rindleder, handvernietet')",
      "Stichpunkt 4 – Charakteristisches Merkmal (z. B. 'Mit geprägtem Ziermuster im gotischen Stil')",
      "Stichpunkt 5 – Optionales Detail (z. B. 'Erhältlich in mehreren Längen und Farben')"
    ],
    "notes": "Alle Informationen stammen ausschließlich aus der Herstellerbeschreibung, ohne externe Recherche oder Ausschmückung."
  }
}`);
      console.log('SHORT DESCRIPTION:\n\n', rewrittenDescription, '\n\n');
      const productCategories = await this.aiService.categoryNumberResponse(
        JSON.stringify(categories),
        providerProduct.Artikelname + '\n\n' + providerProduct.Shopbeschreibung,
      );
      if (!rewrittenDescription || !shortDescription || !productCategories) {
        skippedProducts.push(providerProduct['Artikelnr.']);
        continue;
      }
      console.log('lade Bilder hoch...');
      const images: Partial<Images>[] = [];
      for (const imageUrl of [
        providerProduct['Bildpfad 1'],
        providerProduct['Bildpfad 2'],
        providerProduct['Bildpfad 3'],
        providerProduct['Bildpfad 4'],
        providerProduct['Bildpfad 5'],
        providerProduct['Bildpfad 6'],
      ].filter((e) => typeof e === 'string' && e.length > 0)) {
        console.log('image:', imageUrl);
        const image = await this.wordpressService.getImageOrConvertAndUpload(
          imageUrl,
          {
            alt_text: providerProduct.Artikelname,
            fileName: this.imageService.getWebpFileNameFromUrl(imageUrl),
            title: providerProduct.Artikelname,
          },
        );
        if (image.errors) {
          console.log('error for image:', imageUrl, image.errors);
          errors.push(...image.errors);
        }
        if (image.data) {
          console.log('success uploading image:', imageUrl);
          images.push({
            id: image.data.id,
            src: image.data.source_url,
            alt: image.data.alt_text,
            name: image.data.title.rendered,
          });
        }
      }

      const tags = await this.woocommerceService.getOrCreateTags(
        providerProduct.Artikelname,
        providerProduct.Shopbeschreibung,
      );

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
        categories: productCategories,
        tags: tags,
        images: images,
        type: 'simple',
        sku: providerProduct['Artikelnr.'],
        featured: false,
        on_sale: false,
        stock_status: 'instock',
        meta_data: [
          {
            key: 'generator',
            value: 'importer-handelsgilde',
          },
        ],
      };
      console.log('creating product');
      const product = await this.woocommerceService.createProduct(wooProduct);
      if (!product) {
        errors.push(
          'Could not create product ' + providerProduct['Artikelnr.'],
        );
      }
      console.log('Created product', providerProduct.Artikelname);
    }
  }
}
