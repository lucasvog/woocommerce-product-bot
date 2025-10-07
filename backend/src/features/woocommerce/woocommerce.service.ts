import { Injectable } from '@nestjs/common';
import WooCommerceRestApi, {
  Products,
  WooRestApiOptions,
} from 'woocommerce-rest-ts-api';
import { WooCategory } from './models/WooCategory';
import { FunctionResponse } from './models/FunctionResponse';
import { WooTag } from './models/WooTag';
@Injectable()
export class WoocommerceService {
  private api: WooCommerceRestApi<WooRestApiOptions>;
  constructor() {
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
  }

  async getProducts() {
    try {
      let page = 1;
      const per_page = 100;
      let products: Products[] = [];
      let foundAllData = false;
      while (!foundAllData) {
        const productsData = await this.api.getProducts({
          page: page,
          per_page,
        });
        if (productsData.data && productsData.data.length < per_page) {
          foundAllData = true;
        } else {
          page += 1;
        }
        products = [...products, ...productsData.data];
      }

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
}
