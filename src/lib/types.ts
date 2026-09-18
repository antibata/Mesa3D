export type Restaurant = {
  id: string; name: string; slug: string; tagline: string; description: string;
  address: string; hours: string; accent: string; currency: string;
  categories: string[]; published: boolean;
};
export type Dish = {
  id: string; restaurant_id: string; name: string; description: string;
  price: number; category: string; image_url: string; model_url: string;
  usdz_url: string; available: boolean; featured: boolean; demo_model: boolean;
  allergens: string; sort_order: number;
};
export type AppData = { restaurants: Restaurant[]; dishes: Dish[] };
export type Access = { kind: 'platform' | 'restaurant'; restaurantIds: string[]; email: string };
