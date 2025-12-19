import { Injectable } from '@nestjs/common';
import {
  ShopifyJsonVariant,
  ShopifyProductJson,
} from './models/shopify-public-json';
import { ImporterService } from './importer.service';
import { WordpressService } from '../wordpress/wordpress.service';
import { ImageService } from '../image/image.service';
import { WoocommerceService } from '../woocommerce/woocommerce.service';
import { AiService } from '../ai/ai.service';
import { Images } from 'node_modules/woocommerce-rest-ts-api/dist/src/typesANDinterfaces';
import { WooAttribute } from '../woocommerce/models/WooAttribute';
import { WooVariationImage } from '../woocommerce/models/WooProductVariation';
@Injectable()
export class FreyhandImportService {
  errors: string[] = [];
  constructor(
    private importerService: ImporterService,
    private wordpressService: WordpressService,
    private wooCommerceService: WoocommerceService,
    private imageService: ImageService,
    private aiService: AiService,
  ) {}
  async main() {
    console.log('Freyhand import started');
    console.log('Fetching Freyhand Shopify JSON data...');
    // Example URL, replace with actual Freyhand Shopify JSON URL
    const url = 'https://freyhand.com/products.json';
    // Fetch and process the data
    const data: ShopifyProductJson = await this.loadAllPages(url);
    // Implementation of Freyhand import logic goes here
    await this.importProductIncludingVariants(data);
    console.log('Freyhand import finished');
  }

  async loadAllPages(baseUrl: string) {
    const allProducts: ShopifyProductJson = { products: [] };
    let page = 1;
    while (true) {
      const url = `${baseUrl}?limit=250&page=${page}`;
      console.log('Fetching page:', page);
      const data: ShopifyProductJson =
        (await this.importerService.readJsonFromUrl<ShopifyProductJson>(
          url,
        )) ?? {
          products: [],
        };
      if (data.products.length === 0) {
        break;
      }
      allProducts.products.push(...data.products);
      page++;
    }
    return allProducts;
  }

  async importProductIncludingVariants(productData: ShopifyProductJson) {
    console.log(
      'importing ' + productData.products.length + ' products for Freyhand',
    );
    const categories = await this.wooCommerceService.getAllCategories();
    for (const product of productData.products) {
      console.log(
        'Freyhand import: ',
        product.title,
        this.getFreyhandSKU(product.id),
      );
      const images: Partial<Images>[] = [];
      for (const image of product.images) {
        const uploadResult =
          await this.wordpressService.getImageOrConvertAndUpload(image.src, {
            fileName: this.imageService.getWebpFileNameFromUrl(image.src),
            title: product.title,
            alt_text: product.title,
          });
        if (uploadResult && uploadResult.data) {
          images.push({
            id: uploadResult.data.id,
            src: uploadResult.data.source_url,
            alt: uploadResult.data.alt_text,
            name: uploadResult.data.title.rendered,
          });
        } else {
          console.log('Error uploading image', image.src);
          this.errors.push(
            'Fehler beim Dateiupload',
            product.title,
            image.id.toString(),
          );
        }
      }
      if (images.length <= 0) {
        continue; //skip products without image
      }
      const { longDescriptionHtml, shortDescription } =
        await this.getLongAndShortDescription(product.title, product.body_html);
      if (longDescriptionHtml === undefined || shortDescription === undefined) {
        this.errors.push(
          'Cannot generate long or short description of ' + product.title,
        );
        continue;
      }
      const productCategories = await this.aiService.categoryNumberResponse(
        JSON.stringify(categories),
        product.title + '\n\n' + shortDescription,
      );
      const tags = await this.wooCommerceService.getOrCreateTags(
        product.title,
        shortDescription,
      );
      //das ist sowas wie GRÖSSE oder FARBE
      const uniqueAttributesOfVariations = product.options.map((e) =>
        this.getAttributeTitle(e.name),
      );
      //Das ist sowas wie "Grün" oder "Blau"
      const attributeOptionsOfVariations = product.variants.map((e) =>
        this.getVariantTitle(e.title),
      );
      const attributes: Partial<WooAttribute>[] = [];
      for (const attr of uniqueAttributesOfVariations) {
        console.log('Attribute:', attr);
        const newAttribute =
          await this.wooCommerceService.getOrCreateAttribute(attr);
        if (!newAttribute.data) {
          console.log('Could not create attribute for', attr);
          continue;
        }
        attributes.push(newAttribute.data);
      }
      const productResult = await this.wooCommerceService.createOrUpdateProduct(
        {
          name: product.title,
          status: 'draft',
          description: longDescriptionHtml,
          short_description: shortDescription,
          tax_status: 'taxable',
          manage_stock: true,
          stock_quantity: 0,
          backorders: 'no',
          dimensions: { length: '', width: '', height: '' },
          categories: productCategories,
          tags: tags,
          images: images,
          type: 'variable',
          sku: this.getFreyhandSKU(product.id),
          featured: false,
          on_sale: false,
          stock_status: 'instock',
          meta_data: [
            {
              key: 'generator',
              value: 'importer-handelsgilde',
            },
          ],
          attributes: attributes.map((attr) => ({
            id: attr.id,
            name: attr.name,
            variation: true,
            visible: true,
            options: attributeOptionsOfVariations, // <- Das ist entscheidend!
          })),
        },
      );
      if (!productResult.data) {
        console.log(
          'Error creating parent product:',
          product.title,
          productResult.errors,
        );
        if (productResult.errors) {
          this.errors.push(...productResult.errors);
        }
        return;
      }
      //Next, add variants
      for (const variant of product.variants) {
        console.log(
          'Adding Variant',
          this.getVariantTitle(variant.title),
          'to',
          product.title,
        );
        await this.importProductVariant(
          productResult.data.id.toString(),
          product.title,
          variant,
          attributes,
        );
      }
      return;
    }
  }

  async importProductVariant(
    parentProductId: string,
    parentProductName: string,
    variant: ShopifyJsonVariant,
    attributes: Partial<WooAttribute>[],
  ) {
    let image: WooVariationImage | undefined;
    if (variant.featured_image && variant.featured_image.src) {
      const imageData = await this.wordpressService.getImageOrConvertAndUpload(
        variant.featured_image.src,
        {
          fileName: this.imageService.getWebpFileNameFromUrl(
            variant.featured_image.src,
          ),
          title:
            parentProductName + ' - ' + this.getVariantTitle(variant.title),
          alt_text:
            parentProductName + ' - ' + this.getVariantTitle(variant.title),
        },
      );
      if (imageData.data) {
        image = {
          id: imageData.data.id,
          src: imageData.data.source_url,
          alt: imageData.data.alt_text,
          name: imageData.data.title.rendered,
        };
      }
    }
    const variationData = await this.wooCommerceService.updateOrCreateVariation(
      parentProductId,
      {
        status: 'publish',
        sku: this.getFreyhandSKU(variant.id),
        price: variant.price,
        regular_price: variant.compare_at_price || variant.price,
        stock_quantity: 0,
        manage_stock: true,
        stock_status: 'instock',
        image: image,
        weight: variant.grams.toString(),
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
                option: this.getVariantTitle(variant.title),
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
      console.error(
        'Could not create variation:',
        this.getVariantTitle(variant.title),
        'for',
        parentProductName,
        variationData.errors,
      );
      this.errors.push(...variationData.errors);
    }
  }

  getFreyhandSKU(productId: string | number) {
    return 'freyhand-' + productId.toString();
  }

  /**
   * Returns the attribute Title, such as "Größe" or "Farbe"
   * @param attributeName any
   * @returns correct title
   */
  getAttributeTitle(attributeName: any) {
    return typeof attributeName !== 'string' ||
      attributeName === 'Title' ||
      attributeName === ''
      ? 'Auswahl'
      : attributeName;
  }
  /**
   * Variant title, such as "Blau" or "Grün"
   * @param variantTitle any type
   * @returns correct title of variant
   */
  getVariantTitle(variantTitle: any) {
    return typeof variantTitle !== 'string' ||
      variantTitle === 'Default Title' ||
      variantTitle === ''
      ? 'Standard'
      : variantTitle;
  }

  async getLongAndShortDescription(
    productName: string,
    productDescription: string,
  ) {
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
          "product_name": "${productName}",
          "provided_description": \`${productDescription}\`,
          "research": {
            "query_hint": "Historische Einordnung zu "${productName}" (Epoche, Region, Nutzung); verwandte Begriffe mit einbeziehen",
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
          "title": "${productName}",
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
            "title_h1": "<h1>${productName}</h1>",
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
      productDescription,
    );
    console.log('rewritting short description:', productName);
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
          "product_name": "${productName},
          "provided_description": \`${productDescription}\`
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
    return { longDescriptionHtml: rewrittenDescription, shortDescription };
  }
}
