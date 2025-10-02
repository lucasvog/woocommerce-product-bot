export interface WooCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  display: string;
  image: string | null;
  menu_order: number;
  count: number;
  _links: {
    self: {
      href: string;
      targetHints?: {
        allow: string[];
      };
    }[];
    collection: {
      href: string;
    }[];
    up?: {
      href: string;
    }[];
  };
}
