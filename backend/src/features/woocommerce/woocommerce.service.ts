import { Injectable } from '@nestjs/common';
import WooCommerceRestApi, {
  Products,
  WooRestApiOptions,
} from 'woocommerce-rest-ts-api';
import { WooCategory } from './models/WooCategory';
import { FunctionResponse } from './models/FunctionResponse';
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
  }

  async getProducts() {
    try {
      const products = await this.api.getProducts();
      console.log('Produkte:', products);
      //TODO: go through pages!
      return products.data;
    } catch (e) {
      console.error(e);
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

  async getAllCategories(): Promise<FunctionResponse<WooCategory>> {
    try {
      const categories = await this.api.get<WooCategory>('products/categories');
      return { data: categories.data };
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
