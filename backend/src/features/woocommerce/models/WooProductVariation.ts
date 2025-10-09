// WooCommerce Product Variation Interface
export interface WooProductVariation {
  /** 🔒 Unique identifier for the resource. */
  readonly id: number;

  /** 🔒 The date the variation was created, in the site's timezone. */
  readonly date_created: string;

  /** 🔒 The date the variation was created, as GMT. */
  readonly date_created_gmt: string;

  /** 🔒 The date the variation was last modified, in the site's timezone. */
  readonly date_modified: string;

  /** 🔒 The date the variation was last modified, as GMT. */
  readonly date_modified_gmt: string;

  /** Variation description. */
  description?: string;

  /** 🔒 Variation URL. */
  readonly permalink: string;

  /** Unique SKU identifier. */
  sku?: string;

  /** GTIN, UPC, EAN or ISBN — global unique identifier for the variation. */
  global_unique_id?: string;

  /** 🔒 Current variation price. */
  readonly price?: string;

  /** Regular price of the variation. */
  regular_price?: string;

  /** Sale price of the variation. */
  sale_price?: string;

  /** Start date of sale price (local). */
  date_on_sale_from?: string;

  /** Start date of sale price (GMT). */
  date_on_sale_from_gmt?: string;

  /** End date of sale price (local). */
  date_on_sale_to?: string;

  /** End date of sale price (GMT). */
  date_on_sale_to_gmt?: string;

  /** 🔒 Shows if the variation is currently on sale. */
  readonly on_sale: boolean;

  /** Variation status (draft, pending, private, publish). */
  status?: 'draft' | 'pending' | 'private' | 'publish';

  /** 🔒 Shows if the variation can be purchased. */
  readonly purchasable: boolean;

  /** Whether the variation is virtual. */
  virtual?: boolean;

  /** Whether the variation is downloadable. */
  downloadable?: boolean;

  /** List of downloadable files. */
  downloads?: WooVariationDownload[];

  /** Number of allowed downloads (-1 = unlimited). */
  download_limit?: number;

  /** Number of days until download expires (-1 = never). */
  download_expiry?: number;

  /** Tax status (taxable, shipping, none). */
  tax_status?: 'taxable' | 'shipping' | 'none';

  /** Tax class. */
  tax_class?: string;

  /** Stock management (true, false, or 'parent'). */
  manage_stock?: boolean | 'parent';

  /** Stock quantity. */
  stock_quantity?: number;

  /** Stock status (instock, outofstock, onbackorder). */
  stock_status?: 'instock' | 'outofstock' | 'onbackorder';

  /** Backorder control (no, notify, yes). */
  backorders?: 'no' | 'notify' | 'yes';

  /** 🔒 Shows if backorders are allowed. */
  readonly backorders_allowed: boolean;

  /** 🔒 Shows if the variation is currently backordered. */
  readonly backordered: boolean;

  /** Weight of the variation. */
  weight?: string;

  /** Variation dimensions. */
  dimensions?: WooVariationDimensions;

  /** Shipping class slug. */
  shipping_class?: string;

  /** 🔒 Shipping class ID. */
  readonly shipping_class_id?: string;

  /** Variation image data. */
  image?: WooVariationImage;

  /** Variation attributes. */
  attributes?: WooVariationAttribute[];

  /** Menu order for sorting. */
  menu_order?: number;

  /** Meta data array. */
  meta_data?: WooVariationMeta[];
}

// ----- Sub-Interfaces -----

export interface WooVariationDownload {
  /** File ID. */
  id: string;
  /** File name. */
  name: string;
  /** File URL. */
  file: string;
}

export interface WooVariationDimensions {
  /** Length of the variation. */
  length?: string;
  /** Width of the variation. */
  width?: string;
  /** Height of the variation. */
  height?: string;
}

export interface WooVariationImage {
  /** Image ID. */
  id: number;
  /** 🔒 The date the image was created (local). */
  readonly date_created: string;
  /** 🔒 The date the image was created (GMT). */
  readonly date_created_gmt: string;
  /** 🔒 The date the image was last modified (local). */
  readonly date_modified: string;
  /** 🔒 The date the image was last modified (GMT). */
  readonly date_modified_gmt: string;
  /** Image URL. */
  src: string;
  /** Image name. */
  name: string;
  /** Image alt text. */
  alt: string;
}

export interface WooVariationAttribute {
  /** Attribute ID. */
  id: number;
  /** Attribute name. */
  name: string;
  /** Selected attribute term name. */
  option: string;
}

export interface WooVariationMeta {
  /** 🔒 Meta ID. */
  readonly id: number;
  /** Meta key. */
  key: string;
  /** Meta value. */
  value: string;
}
