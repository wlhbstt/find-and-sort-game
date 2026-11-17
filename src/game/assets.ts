import type { LevelItem } from './level';

const itemVariants: Record<string, readonly string[]> = {
  boxes: ['package', 'card_file_box'],
  bags: ['handbag', 'backpack', 'clutch_bag'],
  cleaning: ['broom', 'bucket', 'lotion_bottle'],
  garden: ['cactus', 'herb', 'bouquet', 'potted_plant'],
  sports: ['basketball', 'baseball', 'badminton', 'soccer_ball', 'american_football'],
  clothes: ['coat', 'dress', 'jeans'],
  drinks: ['beverage_box', 'bubble_tea', 'cup_with_straw', 'glass_of_milk', 'baby_bottle', 'bottle_with_popping_cork'],
  snacks: ['cookie', 'chocolate_bar', 'doughnut', 'candy', 'bagel', 'baguette_bread'],
  books: ['books', 'blue_book', 'open_book', 'green_book', 'closed_book', 'orange_book'],
  magazines: ['newspaper', 'notebook_with_decorative_cover', 'notebook'],
  photos: ['framed_picture', 'film_frames', 'camera', 'camera_with_flash', 'movie_camera'],
  stationery: ['pencil', 'fountain_pen', 'crayon', 'pen', 'bookmark'],
  electronics: ['keyboard', 'computer_mouse', 'electric_plug', 'headphone', 'desktop_computer'],
  tea: ['hot_beverage', 'teapot', 'teacup_without_handle'],
  toys: ['teddy_bear', 'puzzle_piece', 'yo-yo', 'game_die', 'balloon', 'wrapped_gift'],
  storage: ['package', 'card_file_box', 'basket'],
  decor: ['candle', 'globe_showing_asia-australia', 'crystal_ball', 'mirror_ball', 'potted_plant'],
  tableware: ['fork_and_knife_with_plate', 'fork_and_knife', 'teacup_without_handle'],
  pots: ['pot_of_food', 'cooking', 'shallow_pan_of_food'],
  utensils: ['kitchen_knife', 'spoon', 'chopsticks'],
  fruit: ['red_apple', 'green_apple', 'pear', 'banana', 'strawberry', 'watermelon', 'tangerine', 'kiwi_fruit'],
  vegetables: ['carrot', 'eggplant', 'broccoli', 'leafy_green', 'bell_pepper'],
  seasonings: ['salt', 'hot_pepper', 'honey_pot'],
  containers: ['jar', 'bento_box', 'takeout_box', 'basket'],
  'street-food': ['pizza', 'taco', 'sushi', 'hamburger', 'pretzel', 'popcorn', 'bagel', 'baguette_bread'],
  jewelry: ['custom_ring', 'watch', 'sunglasses'],
  flowers: ['bouquet', 'herb'],
  lights: ['flashlight', 'candle'],
  'paper-bags': ['handbag', 'clutch_bag'],
  tools: ['hammer', 'wrench', 'toolbox'],
  souvenirs: ['ticket', 'trophy', 'crystal_ball', 'globe_showing_asia-australia'],
  'shoes-hats': ['custom_shoe', 'socks', 'scarf', 'flat_shoe', 'high-heeled_shoe', 'mans_shoe', 'womans_hat'],
  luggage: ['luggage', 'backpack', 'handbag'],
  appliances: ['television', 'radio', 'camera', 'keyboard', 'desktop_computer'],
  dumbbells: ['custom_dumbbell'],
  shoes: ['custom_shoe'],
  towels: ['custom_towel'],
  bottles: ['custom_bottle'],
  protective: ['custom_knee_pad', 'gloves'],
  bands: ['custom_band'],
  yoga: ['custom_mat'],
  'training-clothes': ['custom_jersey', 'shorts'],
  nutrition: ['banana', 'chocolate_bar', 'beverage_box', 'bagel'],
  headphones: ['headphone'],
  timers: ['stopwatch', 'watch'],
  balls: ['basketball', 'baseball', 'volleyball', 'tennis', 'soccer_ball', 'american_football'],
  'jump-ropes': ['custom_jump_rope'],
};

export function itemAssetName(item: LevelItem): string {
  const variants = itemVariants[item.categoryId];
  return variants[(item.variant ?? 0) % variants.length];
}

export function itemAssetUrl(item: LevelItem): string {
  const name = itemAssetName(item);
  return `/assets/stickers/${name}.png`;
}
