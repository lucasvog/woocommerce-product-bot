export interface ShopifyProductJson {
  products: ShopifyJsonProduct[];
}

export interface ShopifyJsonProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  vendor: string;
  product_type: string;
  tags: any[];
  variants: ShopifyJsonVariant[];
  images: ShopifyJsonImage[];
  options: ShopifyJsonOption[];
}

export interface ShopifyJsonVariant {
  id: number;
  title: string;
  option1: string;
  option2?: string;
  option3: any;
  sku: string;
  requires_shipping: boolean;
  taxable: boolean;
  featured_image?: ShopifyJsonFeaturedImage;
  available: boolean;
  price: string;
  grams: number;
  compare_at_price: string;
  position: number;
  product_id: number;
  created_at: string;
  updated_at: string;
}

export interface ShopifyJsonFeaturedImage {
  id: number;
  product_id: number;
  position: number;
  created_at: string;
  updated_at: string;
  alt: any;
  width: number;
  height: number;
  src: string;
  variant_ids: number[];
}

export interface ShopifyJsonImage {
  id: number;
  created_at: string;
  position: number;
  updated_at: string;
  product_id: number;
  variant_ids: number[];
  src: string;
  width: number;
  height: number;
}

export interface ShopifyJsonOption {
  name: string;
  position: number;
  values: string[];
}
