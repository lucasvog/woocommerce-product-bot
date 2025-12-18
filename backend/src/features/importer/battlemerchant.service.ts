import { Injectable } from '@nestjs/common';
import { extractHtmlTable } from 'src/helper/tableHelper';
import { Products } from 'woocommerce-rest-ts-api';
import { AiService } from '../ai/ai.service';
import { ImageService } from '../image/image.service';
import { WooAttribute } from '../woocommerce/models/WooAttribute';
import {
  WooProductVariation,
  WooVariationImage,
} from '../woocommerce/models/WooProductVariation';
import { Images } from 'node_modules/woocommerce-rest-ts-api/dist/src/typesANDinterfaces';
import { WoocommerceService } from '../woocommerce/woocommerce.service';
import { WordpressService } from '../wordpress/wordpress.service';
import { ImporterService } from './importer.service';
import * as fs from 'fs';

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

@Injectable()
export class BattleMerchantImportService {
  constructor(
    private aiService: AiService,
    private imageService: ImageService,
    private importerService: ImporterService,
    private woocommerceService: WoocommerceService,
    private wordpressService: WordpressService,
  ) {}
  main() {
    //this.generateProductforHandelsgilde()
    // this.generateProductVariationForHandelsgilde();
    // this.test();
    // this.updateDuplicateElements();
    // this.addTablesFromBattleMerchant();
    // this.setAllToLive();
    console.log('FINISHED BATTLEMERCHANT');
  }
  //   async test() {
  //     const product =
  //       await this.woocommerceService.getProductsBySku('1016385100');
  //     console.log(product);
  //     fs.writeFileSync('./product.json', JSON.stringify(product, null, 2));
  //     console.log('variations');
  //     if (!product || product.length <= 0) {
  //       console.log('No product found');
  //       return;
  //     }
  //     if (!product[0].variations || product[0].variations.length <= 0) {
  //       console.log('No variations found');
  //       return;
  //     }
  //     const variations: WooProductVariation[] = [];
  //     for (const variation of product[0].variations) {
  //       const variationData = await this.woocommerceService.getVariation(
  //         product[0].id.toString(),
  //         variation.toString(),
  //       );
  //       if (variationData.data) {
  //         variations.push(variationData.data);
  //       }
  //     }
  //     console.log(variations);
  //     fs.writeFileSync('./variations.json', JSON.stringify(variations, null, 2));
  //   }
  async generateProductforHandelsgilde() {
    //http://csv.battlemerchant.com/Products_back_in_stock_7_days.csv

    // http://csv.battlemerchant.com/Products_in_stock.csv

    // http://csv.battlemerchant.com/Products_out_of_stock.csv

    // http://csv.battlemerchant.com/Produktinfo.csv

    const errors: string[] = [];

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
    const allProducts = await this.woocommerceService.getProducts();
    if (!providerProducts) {
      console.error('No Products found');
      return;
    }
    if (!categories.data) {
      console.error('Could not load categories');
      return;
    }
    if (!allProducts.data) {
      console.error('Could not load all Products');
      return;
    }
    const skippedProducts: string[] = [];
    //TODO: add check or metadata of importer!
    // let maximumNumberOfProductsToRun = 1;
    const filteredShopBeschreibungTexts = [
      'alkohol',
      't-shirt',
      'hoodie',
      'girlie-hoodie',
      'girlie-shirt',
      'longsleeve-shirt',
      'kaffee',
    ];
    const filderedShopBeschreibungTextsCaseSensitive = ['DVD', 'CD'];
    const filteredSicherheitsinweiseTexts = ['scharf'];
    const filteredProducts = providerProducts
      .filter((e) => e !== undefined && e.Vatermodell === '')
      //filter out any products that contain any of the filteredShopBeschreibungTexts in the shopbeschreibung or sicherheitshinweise
      .filter(
        (e) =>
          e.Shopbeschreibung === undefined ||
          filteredShopBeschreibungTexts.every(
            (text) => e.Shopbeschreibung.toLowerCase().includes(text) === false,
          ),
      )
      .filter(
        (e) =>
          e.Shopbeschreibung === undefined ||
          filderedShopBeschreibungTextsCaseSensitive.every(
            (text) => e.Shopbeschreibung.includes(text) === false,
          ),
      )
      .filter(
        (e) =>
          e.Sicherheitshinweise === undefined ||
          filteredSicherheitsinweiseTexts.every(
            (text) =>
              e.Sicherheitshinweise.toLowerCase().includes(text) === false,
          ),
      );
    let index = 0;

    for (const providerProduct of filteredProducts) {
      fs.writeFileSync('./skipped.txt', JSON.stringify(skippedProducts));
      fs.writeFileSync('./errors.txt', JSON.stringify(errors));
      index += 1;

      console.log(
        'Product',
        index,
        'of',
        filteredProducts.length,
        Math.round((index / filteredProducts.length) * 1000) / 10 + '%',
      );
      // const foundProduct = await this.woocommerceService.getProductsBySku(
      //   providerProduct['Artikelnr.'],
      // );
      const foundProduct = allProducts.data.find(
        (e) => e.sku === providerProduct['Artikelnr.'],
      );
      if (foundProduct) {
        console.log(
          'Skipping product as it is already created:  ' +
            providerProduct.Artikelname,
        );
        continue;
      }
      // maximumNumberOfProductsToRun--;
      // if (maximumNumberOfProductsToRun < 0) {
      //   console.log('Stopping because of maximum number of products reached');
      //   break;
      // }
      console.log('Found product to generate:', providerProduct.Artikelname);
      const rewrittenDescriptionPromise = this.aiService.textResponse(
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
      console.log('rewritting short description:', providerProduct.Artikelname);
      const shortDescriptionPromise = this.aiService.textResponse(`{
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
      const [rewrittenDescription, shortDescription] = await Promise.all([
        rewrittenDescriptionPromise,
        shortDescriptionPromise,
      ]);
      console.log('DESCRIPTION: ', rewrittenDescription?.length);
      console.log('SHORT DESCRIPTION:', rewrittenDescription?.length);
      const productCategories = await this.aiService.categoryNumberResponse(
        JSON.stringify(categories),
        providerProduct.Artikelname + '\n\n' + providerProduct.Shopbeschreibung,
      );
      if (!rewrittenDescription || !shortDescription || !productCategories) {
        console.error('ERROR: Skipping product', providerProduct.Artikelname);
        skippedProducts.push(providerProduct['Artikelnr.']);
        continue;
      }
      console.log('lade Bilder hoch...');
      const images: Partial<Images>[] = [];
      const imageUrls = [
        providerProduct['Bildpfad 1'],
        providerProduct['Bildpfad 2'],
        providerProduct['Bildpfad 3'],
        providerProduct['Bildpfad 4'],
        providerProduct['Bildpfad 5'],
        providerProduct['Bildpfad 6'],
      ].filter((e) => typeof e === 'string' && e.length > 0);

      const imageUploadPromises = imageUrls.map((imageUrl) =>
        this.wordpressService
          .getImageOrConvertAndUpload(imageUrl, {
            alt_text: providerProduct.Artikelname,
            fileName: this.imageService.getWebpFileNameFromUrl(imageUrl),
            title: providerProduct.Artikelname,
          })
          .then((image) => ({ image, imageUrl })),
      );

      const uploadedImages = await Promise.all(imageUploadPromises);

      for (const { image, imageUrl } of uploadedImages) {
        if (image.errors) {
          console.log('error for image:', imageUrl, image.errors);
          errors.push(...image.errors);
          skippedProducts.push(providerProduct['Artikelnr.']);
          continue;
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

  /**
   * This function creates variations
   * @returns Nothing
   */
  async generateProductVariationForHandelsgilde() {
    const errors: string[] = [];

    const providerProducts =
      await this.importerService.getCsvWithHeader<InfoKey>(
        'http://csv.battlemerchant.com/Produktinfo.csv',
      );
    if (!providerProducts) {
      console.error('No Products found');
      return;
    }

    const allProductsInShop = await this.woocommerceService.getProducts();
    if (!allProductsInShop.data) {
      console.error('Could not load products from shop!');
      return;
    }

    const allProductsCreatedByImporter =
      allProductsInShop.data?.filter((e) =>
        JSON.stringify(e.meta_data).includes('importer-handelsgilde'),
      ) || [];

    const allProductsCreatedByImporterSkus = allProductsCreatedByImporter.map(
      (e) => e.sku,
    );
    console.log(
      'All importer created Products',
      allProductsCreatedByImporter.length,
      allProductsCreatedByImporterSkus.length,
    );

    const filteredVariants = providerProducts.filter(
      (e) =>
        e !== undefined &&
        e.Vatermodell !== '' &&
        allProductsCreatedByImporterSkus.includes(e.Vatermodell), //filter only the ones created by the importer
    );
    let index = 0;
    const variantsGroupedByParent: {
      [parentSku: string]: Record<InfoKey, string>[];
    } = {};
    for (const variant of filteredVariants) {
      if (!variantsGroupedByParent[variant.Vatermodell]) {
        variantsGroupedByParent[variant.Vatermodell] = [];
      }
      variantsGroupedByParent[variant.Vatermodell].push(variant);
    }
    console.log(
      'Number of parent products with variants:',
      Object.keys(variantsGroupedByParent).length,
    );
    console.log('Total number of variants to create:', filteredVariants.length);
    // let maximumElementsForDebug = 100;
    //For all parent products, get or create the attributes and then create the variations
    for (const [parentSku, variants] of Object.entries(
      variantsGroupedByParent,
    )) {
      // maximumElementsForDebug--;
      fs.writeFileSync('./errors.txt', JSON.stringify(errors, null, 2));
      // if (maximumElementsForDebug < 0) {
      //   console.log('Stopping because of maximum number reached');
      //   return;
      // }
      if (variants.length <= 0) {
        console.log('Skipping parent due to no variants');
        continue;
      }
      const foundParentProducts =
        await this.woocommerceService.getProductsBySku(variants[0].Vatermodell);
      if (
        !foundParentProducts ||
        foundParentProducts.length <= 0 ||
        foundParentProducts.length > 1
      ) {
        console.log('Skipped Parent Product: Zero or more than one parent');
        continue;
      }
      const foundParentProduct = foundParentProducts[0];
      const correctVariantenNameCase = (e: string) => {
        //this variant is all capital case, we need to convert it to normal case with first letter capital
        const attributeName =
          e.charAt(0).toUpperCase() + e.slice(1).toLowerCase();
        return attributeName;
      };

      const uniqueAttributesOfVariations = Array.from(
        new Set(variants.map((e) => correctVariantenNameCase(e.Variantenname))),
      );
      const attributeOptionsOfVariations = Array.from(
        new Set(variants.map((e) => correctVariantenNameCase(e.Variante))),
      );

      console.log(
        'For parent',
        parentSku,
        'found',
        variants.length,
        'variants with',
        uniqueAttributesOfVariations.length,
        'unique attributes',
      );
      const attributes: Partial<WooAttribute>[] = [];
      for (const attr of uniqueAttributesOfVariations) {
        console.log('Attribute:', attr);
        const newAttribute =
          await this.woocommerceService.getOrCreateAttribute(attr);
        if (!newAttribute.data) {
          console.log('Could not create attribute for', attr);
          continue;
        }
        attributes.push(newAttribute.data);
      }
      console.log(
        'Attributes',
        attributes.map((attr) => ({
          id: attr.id,
          name: attr.name,
        })),
      );
      await this.woocommerceService.updateProduct(foundParentProduct.id, {
        type: 'variable',
        attributes: attributes.map((attr) => ({
          id: attr.id,
          name: attr.name,
          variation: true,
          visible: true,
          options: attributeOptionsOfVariations, // <- Das ist entscheidend!
        })),
        //ignore stock
      });
      //for each variant, create the variation
      const allVariations: WooProductVariation[] = [];
      for (const variant of variants) {
        index += 1;
        console.log(
          'Variant',
          index,
          'of',
          filteredVariants.length,
          Math.round((index / filteredVariants.length) * 1000) / 10 + '%',
        );

        console.log('lade Bilder hoch...');
        const images: WooVariationImage[] = [];
        const imageUrls = [
          variant['Bildpfad 1'],
          variant['Bildpfad 2'],
          variant['Bildpfad 3'],
          variant['Bildpfad 4'],
          variant['Bildpfad 5'],
          variant['Bildpfad 6'],
        ].filter((e) => typeof e === 'string' && e.length > 0);

        const imageUploadPromises = imageUrls.map((imageUrl) =>
          this.wordpressService
            .getImageOrConvertAndUpload(imageUrl, {
              alt_text: variant.Artikelname,
              fileName: this.imageService.getWebpFileNameFromUrl(imageUrl),
              title: variant.Artikelname,
            })
            .then((image) => ({ image, imageUrl })),
        );

        const uploadedImages = await Promise.all(imageUploadPromises);

        for (const { image, imageUrl } of uploadedImages) {
          if (image.errors) {
            console.log('error for image:', imageUrl, image.errors);
            errors.push(...image.errors);
            continue;
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
        console.log('creating variation:');
        const variationData =
          await this.woocommerceService.updateOrCreateVariation(
            foundParentProduct.id.toString(),
            {
              status: 'publish',
              sku: variant['Artikelnr.'],
              price: variant.Kundenpreis.replace(',', '.'),
              regular_price: variant.Kundenpreis.replace(',', '.'),
              stock_quantity: 0,
              manage_stock: true,
              stock_status: 'instock',
              image: images[0],
              weight: variant.Gewicht.replace(',', '.'),
              meta_data: [
                {
                  key: 'generator',
                  value: 'importer-handelsgilde',
                },
              ],
              attributes: attributes
                .map((attr) => {
                  if (attr.id && attr.name) {
                    return {
                      id: attr.id,
                      name: attr.name,
                      option: variant.Variante,
                      variation: true,
                    };
                  } else {
                    return undefined;
                  }
                })
                .filter((e) => e !== undefined),
            },
          );
        if (variationData.errors) {
          console.log('Could not create variation:', variationData.errors);
          errors.push(...variationData.errors);
        } else {
          console.log('Created variation for', variant.Artikelname);
          if (variationData.data) {
            allVariations.push(variationData.data);
          }
        }
      }
      console.log(
        'Updating parent product to variable and adding variants:',
        parentSku,
      );
      await this.woocommerceService.updateProduct(foundParentProduct.id, {
        type: 'variable',
        variations: allVariations
          .map((e) => e.id)
          .filter((e) => e !== undefined),
      });
    }
    if (errors.length > 0) {
      console.error('Errors encountered:', errors);
    }
    fs.writeFileSync('./errors_variations.txt', JSON.stringify(errors));
  }

  async updateDuplicateElements() {
    const ids = Array.from(
      new Set([
        5021, 5021, 5028, 5028, 5124, 5124, 5124, 5124, 5124, 5124, 5128, 5128,
        5128, 5128, 5128, 5128, 5133, 5133, 5133, 5133, 5133, 5133, 5137, 5141,
        5141, 5141, 5141, 5141, 5141, 5144, 5144, 5144, 5144, 5144, 5144, 5147,
        5147, 5150, 5183, 5183, 5183, 5183, 5183, 5183, 5190, 5190, 5190, 5190,
        5190, 5190, 5197, 5197, 5197, 5197, 5197, 5197, 5204, 5204, 5211, 5211,
        5211, 5218, 5218, 5225, 5225, 5225, 5225, 5225, 5229, 5229, 5229, 5229,
        5229, 5236, 5236, 5236, 5236, 5236, 5243, 5243, 5243, 5243, 5243, 5250,
        5250, 5250, 5250, 5250, 5254, 5254, 5254, 5254, 5254, 5267, 5267, 5267,
        5267, 5267, 5274, 5274, 5274, 5274, 5274, 5281, 5281, 5281, 5281, 5281,
        5288, 5288, 5288, 5288, 5288, 5294, 5294, 5294, 5294, 5294, 5301, 5301,
        5301, 5301, 5301, 5308, 5308, 5308, 5308, 5308, 5315, 5315, 5315, 5315,
        5315, 5321, 5321, 5321, 5321, 5321, 5535, 5535, 5535, 5535, 5535, 5562,
        5562, 5573, 5573, 5573, 5573, 5573, 5573, 5580, 5580, 5580, 5580, 5580,
        5580, 5580, 5713, 5713, 5713, 5713, 5713, 5713, 5713, 5718, 5718, 5718,
        5718, 5718, 5718, 5718, 5809, 5809, 5857, 5857, 5857, 5857, 5857, 5857,
        5914, 5914, 5914, 5921, 5921, 5921, 5979, 5979, 5979, 5979, 5979, 5990,
        5990, 5990, 5990, 5990, 5997, 5997, 6153, 6153, 6153, 6153, 6153, 6153,
        6279, 6279, 6279, 6279, 6372, 6372, 6372, 6372, 6379, 6379, 6379, 6379,
        6386, 6386, 6386, 6386, 6489, 6489, 6489, 6489, 6503, 6503, 6503, 6503,
        6572, 6572, 6572, 6599, 6599, 6599, 6599, 6599, 6626, 6626, 6626, 6626,
        6626, 6654, 6654, 6654, 6654, 6654, 6992, 6992, 6992, 6992, 6992, 7083,
        7083, 7083, 7083, 7083, 7090, 7090, 7090, 7090, 7090, 7097, 7097, 7097,
        7097, 7097, 7174, 7174, 7174, 7174, 7174, 7257, 7257, 7257, 7257, 7257,
        7257, 7294, 7294, 7294, 7294, 7294, 9232, 9232, 9232, 4832, 4832, 4832,
        4835, 4835, 4835, 4865, 4865, 4865, 12220, 12655, 12655, 12655, 12729,
        12729, 12729, 13865, 13865, 15002, 15002, 15002, 15002, 15005, 15005,
        15043, 15043, 15043, 15043, 15043, 15057, 15057, 15057, 15057, 15057,
        15709, 15709, 15709, 15709, 15709, 15709, 15709, 15709, 15775, 15775,
        15775, 15775, 15775, 15775, 15775, 15775, 15853, 15853, 15919, 15919,
        16096, 16096,
      ]),
    );
    const skippedProducts: number[] = [];
    for (const id of ids) {
      fs.writeFileSync(
        './skipped-update.txt',
        JSON.stringify(skippedProducts, null, 2),
      );
      const newProductData = await this.woocommerceService.getProduct(id);
      if (!newProductData || !newProductData.data) {
        console.log('Could not find product with id', id);
        continue;
      }
      const newProduct = newProductData.data;
      const matchingOtherProducts =
        await this.woocommerceService.searchProducts(newProduct.name);
      if (!matchingOtherProducts) {
        console.log('No matching products found for', newProduct.name);
        skippedProducts.push(id);
        continue;
      }
      const exactMatches = matchingOtherProducts.filter(
        (otherProduct) =>
          otherProduct.name === newProduct.name &&
          otherProduct.variations.length > 0 &&
          otherProduct.id !== newProduct.id,
      );
      console.log(
        'Found',
        newProduct.id,
        newProduct.name,
        'products with name',
        exactMatches.map((e) => e.id),
      );
      if (exactMatches.length <= 0 || exactMatches.length > 1) {
        console.log('Zero or more than one matches, skipping');
        skippedProducts.push(id);
        continue;
      }
      const exactMatch = exactMatches[0];
      fs.writeFileSync(
        `./backupBeforeDelete/${id.toString()}.json`,
        JSON.stringify(newProduct, null, 2),
      );
      try {
        await this.woocommerceService.updateProduct(newProduct.id, {
          sku: newProduct.sku + '-TO-DELETE',
        });
        const foundProductData = await this.woocommerceService.getProduct(id);
        if (!foundProductData.data) {
          console.error('Error re-finding product');
          continue;
        }
        const foundProduct = foundProductData.data;
        if (foundProduct.sku.includes('-TO-DELETE')) {
          console.log('Deleting ', foundProduct.name, foundProduct.sku);
          await this.woocommerceService.deleteProduct(id);
        }

        console.log('Deleted product with id', id);
        console.log('Updating product', exactMatch.id);
        await this.woocommerceService.updateProduct(exactMatch.id, {
          sku: newProduct.sku,
        });
      } catch (e) {
        console.error(e);
        skippedProducts.push(id);
      }
    }
    fs.writeFileSync(
      './skipped-update.txt',
      JSON.stringify(skippedProducts, null, 2),
    );
  }

  async addTablesFromBattleMerchant() {
    // const errors: string[] = [];

    const providerProducts =
      await this.importerService.getCsvWithHeader<InfoKey>(
        'http://csv.battlemerchant.com/Produktinfo.csv',
      );
    if (!providerProducts) {
      console.error('No Products found');
      return;
    }

    const filteredVariants = providerProducts.filter(
      (e) => e !== undefined && e.Vatermodell !== '',
    );

    const variantsGroupedByParent: {
      [parentSku: string]: Record<InfoKey, string>[];
    } = {};

    for (const variant of filteredVariants) {
      if (!variantsGroupedByParent[variant.Vatermodell]) {
        variantsGroupedByParent[variant.Vatermodell] = [];
      }
      variantsGroupedByParent[variant.Vatermodell].push(variant);
    }
    let html = '';
    let index = 0;
    const length = Object.entries(variantsGroupedByParent).length;
    for (const [parentSku, variants] of Object.entries(
      variantsGroupedByParent,
    )) {
      index += 1;
      console.log(
        '----------',
        index,
        Math.round((index / length) * 100) + '%',
      );
      if (variants.length <= 0) {
        console.error('No variants for product', parentSku);
        continue;
      }
      console.info('Handling Product', parentSku);
      const parentInShopData =
        await this.woocommerceService.getProductsBySku(parentSku);
      if (!parentInShopData || parentInShopData.length <= 0) {
        console.error('Cannot get parent', parentInShopData);
        continue;
      }
      const parentInShop = parentInShopData[0];
      if (
        !JSON.stringify(parentInShop.meta_data).includes(
          'importer-handelsgilde',
        )
      ) {
        console.error('Not from Importer, skipping', parentSku);
        continue;
      }
      const parentFromProviderData = providerProducts.filter(
        (e) => e['Artikelnr.'] === parentSku,
      );
      if (
        parentFromProviderData.length <= 0 ||
        parentFromProviderData.length > 1
      ) {
        console.error('Unclear number of found results', parentSku);
        continue;
      }
      const parentFromProvider = parentFromProviderData[0];
      const tableInProduct = extractHtmlTable(parentInShop.description);
      if (tableInProduct !== undefined) {
        console.log('Product already has a table', parentSku);
        continue;
      }
      const tableInProvider = extractHtmlTable(
        parentFromProvider.Shopbeschreibung,
      );
      if (tableInProvider === undefined) {
        console.log(
          'Could not find provider Table',
          parentSku,
          parentFromProvider.Shopbeschreibung.toLowerCase().includes('<table'),
        );
        continue;
      }
      await this.woocommerceService.updateProduct(parentInShop.id, {
        description:
          parentInShop.description + '<br><br>' + tableInProvider + '<br>',
      });
      console.log('SUCCESS', parentSku);
      html += '<br><br>' + tableInProvider;
      fs.writeFileSync('./allData.html', html);
      //now: the shop item does not have a table, but the parent has
    }
    console.log('Finished!');
  }

  async setAllToLive() {
    const errors: string[] = [];

    const providerProducts =
      await this.importerService.getCsvWithHeader<InfoKey>(
        'http://csv.battlemerchant.com/Produktinfo.csv',
      );
    if (!providerProducts) {
      console.error('No Products found');
      return;
    }

    const allProductsInShop = await this.woocommerceService.getProducts();
    if (!allProductsInShop.data) {
      console.error('Could not load products from shop!');
      return;
    }

    const allDrafts = allProductsInShop.data.filter(
      (e) => e.status === 'draft',
    );

    // Batch updates in chunks of 10
    const batchSize = 10;
    for (let i = 0; i < allDrafts.length; i += batchSize) {
      const batch = allDrafts.slice(i, i + batchSize);
      console.log(i, 'batch', allDrafts.length);
      await Promise.all(
        batch.map(async (draft) => {
          try {
            await this.woocommerceService.updateProduct(draft.id, {
              status: 'publish',
            });
          } catch (err) {
            console.error(`Failed to update product ${draft.id}:`, err);
            errors.push(draft.id.toString());
          }
        }),
      );
    }
    console.log('Finish');
    if (errors.length) {
      console.warn(`Failed to update ${errors.length} products:`, errors);
    } else {
      console.log('All drafts successfully set to live.');
    }
  }
}
