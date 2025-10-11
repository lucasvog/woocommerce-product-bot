import { Injectable } from '@nestjs/common';
import WooCommerceRestApi, {
  Products,
  WooRestApiOptions,
} from 'woocommerce-rest-ts-api';
import { WooCategory } from './models/WooCategory';
import { FunctionResponse } from './models/FunctionResponse';
import { WooTag } from './models/WooTag';
import { AiService } from '../ai/ai.service';
import { Tags } from 'node_modules/woocommerce-rest-ts-api/dist/src/typesANDinterfaces';
@Injectable()
export class WoocommerceService {
  private api: WooCommerceRestApi<WooRestApiOptions>;
  constructor(private aiService: AiService) {
    //https://www.npmjs.com/package/woocommerce-rest-ts-api
    //https://woocommerce.github.io/woocommerce-rest-api-docs/#introduction
    this.api = new WooCommerceRestApi({
      url: process.env.HG_URL || '',
      consumerKey: process.env.HG_WOOC_USER_KEY || '',
      consumerSecret: process.env.HG_WOOC_USER_SECRET || '',
      version: 'wc/v3',
      queryStringAuth: false,
    });
    // this.getAllCategories();
    // this.getProducts();
    console.log('TEST');
    // void this.getProductsBySku('0101002722')
    // void this.getAllTags()
    //   .then((e) => console.log(JSON.stringify(e)))
    //   .catch((e) => console.error(e));
    this.test();
  }

  async test() {
    //     const tags = await this.getAllTags();
    //     if (tags.data) {
    //       console.log(
    //         JSON.stringify(
    //           tags.data?.map((e) => {
    //             return { id: e.id, name: e.name };
    //           }),
    //         ),
    //       );
    //       const sortedTags = await this.aiService.sortTagsInExistingAndNew(
    //         'Preußischer Offizierssäbel mit Stahlscheide, mit Mängeln',
    //         `Preußischer Offizierssäbel mit Stahlscheide, mit Mängeln
    // Dieser dekorative Löwenkopfsäbel der preußischen leichten Kavallerie aus dem 19. Jahrhundert hat Fertigungsfehler, weshalb er im Preis reduziert ist. Die Klinge und Scheide sind beschädigt und nicht optimal verarbeitet.
    // Der Säbel stammt aus der Epoche der preußischen Armee im 19. Jahrhundert, symbolisiert durch seinen markanten Löwenkopfschliff. Solche Säbel gehörten zur Ausrüstung der Offiziere. Quelle(n): 1
    // Material & Verarbeitung
    // Hauptmaterialien: Kohlenstoffstahl und Messing. Handgefertigt mit handgeschmiedeter Klinge und umwickeltem Griff. Oberfläche nicht rostfrei. Pflegehinweis: Regelmäßig mit Universalöl bearbeiten.
    // Gesamtlänge ca. 107 cm
    // Klingenlänge ca. 92 cm
    // Gewicht ohne Scheide ca. 1 kg
    // Lieferung inklusive Stahlscheide mit Ringen`,
    //         JSON.stringify(
    //           tags.data.map((e) => {
    //             return { id: e.id, name: e.name };
    //           }),
    //         ),
    //       );
    //       console.log(sortedTags);
    //     }
  }

  async getProducts() {
    try {
      let page = 1;
      const per_page = 100;
      let products: Products[] = [];
      let foundAllData = false;
      while (!foundAllData) {
        console.log('Loading Products, page', page);
        const productsData = await this.api.getProducts({
          page: page,
          per_page,
        });
        if (productsData.data && productsData.data.length < per_page) {
          foundAllData = true;
        } else {
          if (!productsData.data || productsData.data.length === 0) {
            foundAllData = true;
          }
          page += 1;
        }
        products = [...products, ...productsData.data];
      }
      console.log('found products:', products.length);
      return { data: products };
    } catch (e) {
      console.error(e);
      return { errors: ['Error fetching Products', JSON.stringify(e)] };
    }
  }

  async searchProducts(search: string) {
    try {
      const products = await this.api.getProducts({
        search: search,
      });
      return products.data;
    } catch (e) {
      console.error(e);
    }
  }

  async getProductsBySku(sku: string) {
    try {
      const products = await this.api.getProducts({
        sku: sku,
      });
      return products.data;
    } catch (e) {
      console.error(e);
    }
  }

  async getAllCategories(): Promise<FunctionResponse<WooCategory[]>> {
    try {
      let page = 1;
      const per_page = 100;
      let categories: WooCategory[] = [];
      let foundAllData = false;
      while (!foundAllData) {
        const categoriesData = await this.api.get<WooCategory[]>(
          'products/categories',
          { page: page, per_page },
        );
        if (categoriesData.data && categoriesData.data.length < per_page) {
          foundAllData = true;
        } else {
          page += 1;
        }
        categories = [...categories, ...categoriesData.data];
      }

      return { data: categories };
    } catch (e) {
      console.error(e);
      return { errors: ['Error updating Product', JSON.stringify(e)] };
    }
  }

  async getAllTags(): Promise<FunctionResponse<WooTag[]>> {
    try {
      let page = 1;
      const per_page = 100;
      let tags: WooTag[] = [];
      let foundAllData = false;
      while (!foundAllData) {
        const tagsData = await this.api.get<WooTag[]>('products/tags', {
          page: page,
          per_page,
        });
        if (tagsData.data && tagsData.data.length < per_page) {
          foundAllData = true;
        } else {
          page += 1;
        }
        tags = [...tags, ...tagsData.data];
      }

      return { data: tags };
    } catch (e) {
      console.error(e);
      return { errors: ['Error updating Product', JSON.stringify(e)] };
    }
  }

  async createTag(name: string): Promise<FunctionResponse<WooTag>> {
    try {
      const tagResponse = await this.api.post<WooTag>('products/tags', {
        name: name,
      });
      return { data: tagResponse.data };
    } catch (e) {
      console.error(e);
      return { errors: ['Error creating Tag', JSON.stringify(e)] };
    }
  }

  async getOrCreateTag(name: string): Promise<FunctionResponse<WooTag>> {
    try {
      const existingTags = await this.getAllTags();
      if (existingTags.data) {
        const foundTag = existingTags.data.find(
          (tag) => tag.name.toLowerCase() === name.toLowerCase(),
        );
        if (foundTag) {
          return { data: foundTag };
        }
      }
      return await this.createTag(name);
    } catch (e) {
      console.error(e);
      return { errors: ['Error creating Tag', JSON.stringify(e)] };
    }
  }

  // async completeAllTagsAi(productName: string, productDescription: string) {
  //   this.aiService.textResponse("Du bist ein WooCommerce Text-Bot, der Tags ")
  // }

  async createOrUpdateProduct(
    data: Partial<Products>,
  ): Promise<FunctionResponse<Products>> {
    try {
      if (!data.sku) {
        return { errors: ['Missing SKU'] };
      }
      const searchResult = await this.getProductsBySku(data.sku);
      if (searchResult && searchResult.length > 1 && searchResult[0].sku) {
        console.log(
          'found product for SKU',
          searchResult[0].sku,
          searchResult[0].id,
        );
        const product_id = searchResult[0].id;
        if (product_id) {
          const updatedProduct = await this.updateProduct(product_id, data);
          return { data: updatedProduct.data };
        }
      }
      const createdProduct = await this.createProduct(data);
      return { data: createdProduct.data };
    } catch (e) {
      console.error(e);
      return { errors: ['Error updating Product', JSON.stringify(e)] };
    }
  }

  async updateProduct(
    id: number,
    data: Partial<Products>,
  ): Promise<FunctionResponse<Products>> {
    try {
      const product = await this.api.updateProduct(id, data);
      return { data: product.data };
    } catch (e) {
      console.error(e);
      return { errors: ['Error updating Product', JSON.stringify(e)] };
    }
  }

  async createProduct(
    data: Partial<Products>,
  ): Promise<FunctionResponse<Products>> {
    try {
      const product = await this.api.createProduct(data);
      return { data: product.data };
    } catch (e) {
      console.error(e);
      return { errors: ['Error creating Product', JSON.stringify(e)] };
    }
  }

  //   async createProductVariation(): Promise<FunctionResponse<Products>> {
  //     try {
  //       const product = await this.api.(data);
  //       return {product.data};
  //     } catch (e) {
  //       console.error(e);
  //       return {errors:["Error updating Product",JSON.stringify(e)]}
  //     }
  //   }

  async getOrCreateTags(
    productName: string,
    productDescription: string,
  ): Promise<Partial<Tags>[]> {
    const tags = await this.getAllTags();
    if (!tags.data) {
      console.error('Could not set tags for ', productName);
      return [];
    }
    let returningTags: Partial<Tags>[] = [];
    const sortedTags = await this.aiService.sortTagsInExistingAndNew(
      productName,
      productDescription,
      JSON.stringify(
        tags.data.map((e) => {
          return { id: e.id, name: e.name };
        }),
      ),
    );
    if (!sortedTags) {
      console.error('Could not get and sort tags for ', productName);
      return [];
    }
    returningTags = [...sortedTags.existingTags];
    const newTagsToAdd: {
      name: string;
    }[] = [];
    for (const testTag of sortedTags.newTags) {
      const foundTag = tags.data.find((e) => e.name === testTag.name);
      if (foundTag) {
        returningTags.push(testTag);
      } else {
        newTagsToAdd.push(testTag);
      }
    }

    for (const newTag of newTagsToAdd) {
      const newTagData = await this.createTag(newTag.name);
      if (newTagData.data) {
        console.log('created new Tag', newTag.name);
        returningTags.push({
          id: newTagData.data.id,
        });
      }
      if (newTagData.errors) {
        console.error('Error creating Tag', newTag.name);
      }
    }
    return returningTags;
  }
}
