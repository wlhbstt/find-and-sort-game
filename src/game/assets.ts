import type { LevelItem } from './level';

const itemVariants: Record<string, readonly string[]> = {
  boxes: ['package', 'card_file_box'],
  bags: ['handbag', 'backpack', 'clutch_bag'],
  cleaning: ['broom', 'bucket', 'lotion_bottle'],
  garden: ['cactus', 'herb', 'bouquet'],
  sports: ['basketball', 'baseball', 'badminton'],
  clothes: ['coat', 'dress', 'jeans'],
  drinks: ['beverage_box', 'bubble_tea', 'cup_with_straw', 'glass_of_milk'],
  snacks: ['cookie', 'chocolate_bar', 'doughnut', 'candy'],
  books: ['books', 'blue_book', 'open_book', 'green_book'],
  magazines: ['newspaper', 'notebook_with_decorative_cover', 'notebook'],
  photos: ['framed_picture', 'film_frames', 'camera'],
  stationery: ['pencil', 'fountain_pen', 'crayon', 'pen'],
  electronics: ['keyboard', 'computer_mouse', 'electric_plug', 'headphone'],
  tea: ['hot_beverage', 'teapot', 'teacup_without_handle'],
  toys: ['teddy_bear', 'puzzle_piece', 'yo-yo', 'game_die'],
  storage: ['package', 'card_file_box', 'basket'],
  decor: ['candle', 'globe_showing_asia-australia', 'crystal_ball', 'mirror_ball'],
  tableware: ['fork_and_knife_with_plate', 'fork_and_knife', 'teacup_without_handle'],
  pots: ['pot_of_food', 'cooking', 'shallow_pan_of_food'],
  utensils: ['kitchen_knife', 'spoon', 'chopsticks'],
  fruit: ['red_apple', 'green_apple', 'pear', 'banana', 'strawberry', 'watermelon', 'tangerine'],
  vegetables: ['carrot', 'eggplant', 'broccoli', 'leafy_green', 'bell_pepper'],
  seasonings: ['salt', 'hot_pepper', 'honey_pot'],
  containers: ['jar', 'bento_box', 'takeout_box', 'basket'],
  'street-food': ['pizza', 'taco', 'sushi', 'hamburger', 'pretzel', 'popcorn'],
  jewelry: ['custom_ring', 'watch', 'sunglasses'],
  flowers: ['bouquet', 'herb'],
  lights: ['flashlight', 'candle'],
  'paper-bags': ['handbag', 'clutch_bag'],
  tools: ['hammer', 'wrench', 'toolbox'],
  souvenirs: ['ticket', 'trophy', 'crystal_ball', 'globe_showing_asia-australia'],
  'shoes-hats': ['custom_shoe', 'socks', 'scarf'],
  luggage: ['luggage', 'backpack', 'handbag'],
  appliances: ['television', 'radio', 'camera', 'keyboard'],
  dumbbells: ['custom_dumbbell'],
  shoes: ['custom_shoe'],
  towels: ['custom_towel'],
  bottles: ['custom_bottle'],
  protective: ['custom_knee_pad', 'gloves'],
  bands: ['custom_band'],
  yoga: ['custom_mat'],
  'training-clothes': ['custom_jersey', 'shorts'],
  nutrition: ['banana', 'chocolate_bar', 'beverage_box'],
  headphones: ['headphone'],
  timers: ['stopwatch', 'watch'],
  balls: ['basketball', 'baseball', 'volleyball', 'tennis'],
  'jump-ropes': ['custom_jump_rope'],
};

export function itemAssetName(item: LevelItem): string {
  const variants = itemVariants[item.categoryId];
  return variants[(item.variant ?? 0) % variants.length];
}

export function itemAssetUrl(item: LevelItem): string {
  const name = itemAssetName(item);
  return name.startsWith('custom_')
    ? `/assets/items/${name}.svg`
    : `/assets/fluent-emoji/${name}.png`;
}
