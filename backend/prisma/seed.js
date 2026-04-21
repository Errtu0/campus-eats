const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Adding new test data (Keeping existing items)...");

  // --- 1. NEW INVENTORY ITEMS ---
  console.log("Adding specific inventory items...");
  
  // For Branch 1 (Main Campus)
  const matchaPowder = await prisma.inventoryItem.upsert({
    where: { id: 101 }, // Using high IDs to avoid conflicts with existing data
    update: {},
    create: { id: 101, name: 'Matcha Powder', amount: 5, unit: 'kg', min_limit: 1, restaurant_id: 1 }
  });

  const chocolateSyrup = await prisma.inventoryItem.upsert({
    where: { id: 102 },
    update: {},
    create: { id: 102, name: 'Chocolate Syrup', amount: 10, unit: 'L', min_limit: 2, restaurant_id: 1 }
  });

  // For Branch 2 (Annex)
  const bbqSauce = await prisma.inventoryItem.upsert({
    where: { id: 201 },
    update: {},
    create: { id: 201, name: 'BBQ Sauce', amount: 8, unit: 'L', min_limit: 2, restaurant_id: 2 }
  });

  const frozenFries = await prisma.inventoryItem.upsert({
    where: { id: 202 },
    update: {},
    create: { id: 202, name: 'Frozen Fries', amount: 40, unit: 'kg', min_limit: 10, restaurant_id: 2 }
  });

  // --- 2. NEW MENU ITEMS ---
  console.log("Adding new Menu Items...");

  // BRANCH 1: COFFEE & CLASSICS
  const mocha = await prisma.menuItem.create({
    data: { name: 'Mocha', price: 5.25, category: 'COFFEE', restaurant_id: 1, is_hot: true, is_sweet: true }
  });

  const matchaLatte = await prisma.menuItem.create({
    data: { name: 'Matcha Latte', price: 5.75, category: 'COFFEE', restaurant_id: 1, is_hot: true, is_sweet: false }
  });

  const lemonade = await prisma.menuItem.create({
    data: { name: 'Lemonade', price: 3.50, category: 'DRINKS', restaurant_id: 1, is_sour: true, is_sweet: true }
  });

  // BRANCH 2: GRILL & SPECIALS
  const bbqBurger = await prisma.menuItem.create({
    data: { name: 'BBQ Burger', price: 12.00, category: 'BURGERS', restaurant_id: 2, is_sweet: true, is_hot: false }
  });

  const rodeoBurger = await prisma.menuItem.create({
    data: { name: 'Rodeo Burger', price: 13.50, category: 'BURGERS', restaurant_id: 2, is_hot: true, is_sweet: true }
  });

  const loadedFries = await prisma.menuItem.create({
    data: { name: 'Loaded Fries', price: 7.00, category: 'SNACKS', restaurant_id: 2, is_hot: true }
  });

  // COMMON ITEMS (Added to both for testing)
  await prisma.menuItem.createMany({
    data: [
      { name: 'Coca Cola', price: 2.50, category: 'DRINKS', restaurant_id: 1, is_sweet: true },
      { name: 'Coca Cola', price: 2.50, category: 'DRINKS', restaurant_id: 2, is_sweet: true },
      { name: 'Water', price: 1.50, category: 'DRINKS', restaurant_id: 1 },
      { name: 'Water', price: 1.50, category: 'DRINKS', restaurant_id: 2 },
    ]
  });

  // --- 3. LINKING INGREDIENTS ---
  console.log("Linking ingredients to new items...");
  
  await prisma.menuItemIngredient.createMany({
    data: [
      // Mocha uses Espresso (Assuming ID 1 is Beans from your previous screen) and Chocolate
      { menuItemId: mocha.id, inventoryId: 1, quantityUsed: 0.02 }, 
      { menuItemId: mocha.id, inventoryId: 102, quantityUsed: 0.04 },
      
      // BBQ Burger uses Patties (Assuming ID 2) and BBQ Sauce
      { menuItemId: bbqBurger.id, inventoryId: 2, quantityUsed: 1 },
      { menuItemId: bbqBurger.id, inventoryId: 201, quantityUsed: 0.05 },
      
      // Loaded Fries uses Fries
      { menuItemId: loadedFries.id, inventoryId: 202, quantityUsed: 0.3 }
    ]
  });

  console.log("Additive seeding complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });