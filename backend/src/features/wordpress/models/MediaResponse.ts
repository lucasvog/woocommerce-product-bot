export interface MediaResponse {
  id: number;
  date: string;
  date_gmt: string;
  guid: {
    rendered: string;
    raw: string;
  };
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    raw: string;
    rendered: string;
  };
  author: number;
  featured_media: number;
  comment_status: string;
  ping_status: string;
  template: string;
  meta: any[];
  permalink_template: string;
  generated_slug: string;
  class_list: string[];
  description: {
    raw: string;
    rendered: string;
  };
  caption: {
    raw: string;
    rendered: string;
  };
  alt_text: string;
  media_type: string;
  mime_type: string;
  media_details: {
    width: number;
    height: number;
    file: string;
    filesize: number;
    sizes: {
      medium: {
        file: string;
        width: number;
        height: number;
        mime_type: string;
        source_url: string;
      };
      thumbnail: {
        file: string;
        width: number;
        height: number;
        mime_type: string;
        source_url: string;
      };
      woocommerce_gallery_thumbnail: {
        file: string;
        width: number;
        height: number;
        mime_type: string;
        source_url: string;
      };
      full: {
        file: string;
        width: number;
        height: number;
        mime_type: string;
        source_url: string;
      };
      [key: string]: {
        file: string;
        width: number;
        height: number;
        mime_type: string;
        source_url: string;
      };
    };
    image_meta: {
      aperture: string;
      credit: string;
      camera: string;
      caption: string;
      created_timestamp: string;
      copyright: string;
      focal_length: string;
      iso: string;
      shutter_speed: string;
      title: string;
      orientation: string;
      keywords: string[];
    };
  };
  post: number | null;
  source_url: string;
  missing_image_sizes: string[];
  _links: {
    self: Array<{ href: string }>;
    collection: Array<{ href: string }>;
    about: Array<{ href: string }>;
    author: Array<{ embeddable: boolean; href: string }>;
    replies: Array<{ embeddable: boolean; href: string }>;
    'wp:action-unfiltered-html': Array<{ href: string }>;
    'wp:action-assign-author': Array<{ href: string }>;
    curies: Array<{ name: string; href: string; templated: boolean }>;
  };
}
