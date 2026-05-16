export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category?: string;
  customizable?: boolean;
  status: 'available' | 'unavailable' | 'out-of-stock';
};