import type { AppData } from './types';
export const DEMO_RESTAURANT_ID = '11111111-1111-4111-8111-111111111111';
export const SECOND_RESTAURANT_ID = '22222222-2222-4222-8222-222222222222';
export const seed: AppData = {
  restaurants: [
    { id: DEMO_RESTAURANT_ID, name: 'BRASA', slug: 'brasa', tagline: 'Cocina de autor · Buenos Aires', description: 'Ingredientes de estación. Fuego lento. Platos para compartir.', address: 'Palermo, Buenos Aires · Restaurante de ejemplo', hours: 'Mar a dom · 12:00 a 23:00', accent: '#c84924', currency: 'ARS', categories: ['Para empezar', 'Principales', 'Postres', 'Bebidas'], published: true },
    { id: SECOND_RESTAURANT_ID, name: 'VERDE', slug: 'verde', tagline: 'Cocina natural · Buenos Aires', description: 'Una pausa fresca, hecha con ingredientes de estación.', address: 'Belgrano, Buenos Aires · Restaurante de ejemplo', hours: 'Lun a sáb · 09:00 a 20:00', accent: '#35694c', currency: 'ARS', categories: ['Para empezar', 'Principales', 'Bebidas'], published: true }
  ],
  dishes: [
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', restaurant_id: DEMO_RESTAURANT_ID, name: 'Palta de estación', description: 'Palta fresca, aceite de oliva y sal en escamas. Un comienzo simple para compartir.', price: 7800, category: 'Para empezar', image_url: '/media/avocado.jpg', model_url: '/models/avocado.glb', usdz_url: '', available: true, featured: true, demo_model: true, allergens: '', sort_order: 0 },
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', restaurant_id: DEMO_RESTAURANT_ID, name: 'Burger de la casa', description: 'Medallón a la parrilla, cheddar, vegetales frescos y nuestro aderezo, en pan tostado.', price: 14500, category: 'Principales', image_url: '/media/burger.jpg', model_url: '/models/burger.glb', usdz_url: '', available: true, featured: true, demo_model: true, allergens: 'Gluten, leche, huevo', sort_order: 1 },
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', restaurant_id: DEMO_RESTAURANT_ID, name: 'Pizza margarita', description: 'Masa de fermentación lenta, salsa de tomates, mozzarella y albahaca fresca.', price: 16900, category: 'Principales', image_url: '/media/pizza.jpg', model_url: '/models/pizza.glb', usdz_url: '', available: true, featured: false, demo_model: true, allergens: 'Gluten, leche', sort_order: 2 },
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', restaurant_id: DEMO_RESTAURANT_ID, name: 'Postre de chocolate', description: 'Chocolate intenso, textura suave y un final para disfrutar sin apuro.', price: 8200, category: 'Postres', image_url: '/media/dessert.jpg', model_url: '/models/cake.glb', usdz_url: '', available: true, featured: false, demo_model: true, allergens: 'Leche, huevo, gluten', sort_order: 3 },
    { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', restaurant_id: SECOND_RESTAURANT_ID, name: 'Palta fresca', description: 'Palta madura, aceite de oliva y un toque de limón.', price: 6900, category: 'Para empezar', image_url: '/media/avocado.jpg', model_url: '/models/avocado.glb', usdz_url: '', available: true, featured: true, demo_model: true, allergens: '', sort_order: 0 }
  ]
};
export function freshSeed(): AppData { return structuredClone(seed); }
export const modelPresets = [
  { label: 'Palta · modelo de ejemplo', url: '/models/avocado.glb', image: '/media/avocado.jpg' },
  { label: 'Hamburguesa · modelo de ejemplo', url: '/models/burger.glb', image: '/media/burger-3d.png' },
  { label: 'Pizza · modelo de ejemplo', url: '/models/pizza.glb', image: '/media/pizza-3d.png' },
  { label: 'Torta · modelo de ejemplo', url: '/models/cake.glb', image: '/media/cake-3d.png' }
];
