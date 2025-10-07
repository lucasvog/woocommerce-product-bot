export interface WooTag {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  _links: {
    self: { href: string }[];
    collection: { href: string }[];
  };
}
