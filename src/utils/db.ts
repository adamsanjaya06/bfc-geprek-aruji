/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Ingredient, Sale, CartItem, Expense, Wastage } from "../types";

const LOCAL_STORAGE_KEYS = {
  PRODUCTS: "pos_fc_products",
  INGREDIENTS: "pos_fc_ingredients",
  SALES: "pos_fc_sales",
  EXPENSES: "pos_fc_expenses",
  WASTAGE: "pos_fc_wastage",
};

const DEFAULT_INGREDIENTS: Ingredient[] = [
  { id: "ing-1", name: "Ayam Potong Segar", stock: 150, unit: "pcs", minStock: 25, cost: 6000 },
  { id: "ing-2", name: "Tepung Bumbu Krispi", stock: 25.0, unit: "kg", minStock: 5.0, cost: 15000 },
  { id: "ing-3", name: "Minyak Goreng Sawit", stock: 40.0, unit: "liter", minStock: 8.0, cost: 14000 },
  { id: "ing-4", name: "Cabe Rawit Merah", stock: 5.5, unit: "kg", minStock: 1.5, cost: 40000 },
  { id: "ing-5", name: "Beras Jasmine Super", stock: 30.0, unit: "kg", minStock: 8.0, cost: 13000 },
  { id: "ing-6", name: "Cup Gelas + Sedotan", stock: 250, unit: "pcs", minStock: 30, cost: 500 },
  { id: "ing-7", name: "Es Batu Kristal", stock: 45.0, unit: "kg", minStock: 10.0, cost: 2000 },
  { id: "ing-8", name: "Jeruk Peras Segar", stock: 12.0, unit: "kg", minStock: 3.0, cost: 12000 },
  { id: "ing-9", name: "Kentang Beku Slices", stock: 15.0, unit: "kg", minStock: 4.0, cost: 22000 },
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Paket Geprek Hot",
    category: "Paket Ayam",
    price: 22000,
    image: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&q=80&w=400",
    isAvailable: true,
    recipe: [
      { ingredientId: "ing-1", quantityNeeded: 1 },
      { ingredientId: "ing-2", quantityNeeded: 0.05 },
      { ingredientId: "ing-3", quantityNeeded: 0.1 },
      { ingredientId: "ing-4", quantityNeeded: 0.02 },
      { ingredientId: "ing-5", quantityNeeded: 0.08 },
      { ingredientId: "ing-6", quantityNeeded: 1 },
      { ingredientId: "ing-7", quantityNeeded: 0.15 },
    ],
  },
  {
    id: "prod-2",
    name: "Paket Mantap Dada",
    category: "Paket Ayam",
    price: 20000,
    image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=400",
    isAvailable: true,
    recipe: [
      { ingredientId: "ing-1", quantityNeeded: 1 },
      { ingredientId: "ing-2", quantityNeeded: 0.05 },
      { ingredientId: "ing-3", quantityNeeded: 0.1 },
      { ingredientId: "ing-5", quantityNeeded: 0.08 },
      { ingredientId: "ing-6", quantityNeeded: 1 },
      { ingredientId: "ing-7", quantityNeeded: 0.15 },
    ],
  },
  {
    id: "prod-3",
    name: "Paket Hemat Sayap",
    category: "Paket Ayam",
    price: 17000,
    image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=400",
    isAvailable: true,
    recipe: [
      { ingredientId: "ing-1", quantityNeeded: 1 },
      { ingredientId: "ing-2", quantityNeeded: 0.05 },
      { ingredientId: "ing-3", quantityNeeded: 0.1 },
      { ingredientId: "ing-5", quantityNeeded: 0.08 },
      { ingredientId: "ing-6", quantityNeeded: 1 },
      { ingredientId: "ing-7", quantityNeeded: 0.15 },
    ],
  },
  {
    id: "prod-4",
    name: "Ayam Dada Krispi",
    category: "Ala Carte",
    price: 12000,
    image: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&q=80&w=400",
    isAvailable: true,
    recipe: [
      { ingredientId: "ing-1", quantityNeeded: 1 },
      { ingredientId: "ing-2", quantityNeeded: 0.05 },
      { ingredientId: "ing-3", quantityNeeded: 0.1 },
    ],
  },
  {
    id: "prod-5",
    name: "Ayam Paha Atas",
    category: "Ala Carte",
    price: 11000,
    image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=400",
    isAvailable: true,
    recipe: [
      { ingredientId: "ing-1", quantityNeeded: 1 },
      { ingredientId: "ing-2", quantityNeeded: 0.05 },
      { ingredientId: "ing-3", quantityNeeded: 0.1 },
    ],
  },
  {
    id: "prod-6",
    name: "Kentang Goreng Krispi",
    category: "Ala Carte",
    price: 12000,
    image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&q=80&w=400",
    isAvailable: true,
    recipe: [
      { ingredientId: "ing-9", quantityNeeded: 0.15 },
      { ingredientId: "ing-3", quantityNeeded: 0.05 },
    ],
  },
  {
    id: "prod-7",
    name: "Es Teh Manis Jumbo",
    category: "Minuman",
    price: 5000,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400",
    isAvailable: true,
    recipe: [
      { ingredientId: "ing-6", quantityNeeded: 1 },
      { ingredientId: "ing-7", quantityNeeded: 0.2 },
    ],
  },
  {
    id: "prod-8",
    name: "Es Jeruk Peras Segar",
    category: "Minuman",
    price: 7000,
    image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=400",
    isAvailable: true,
    recipe: [
      { ingredientId: "ing-8", quantityNeeded: 0.2 },
      { ingredientId: "ing-6", quantityNeeded: 1 },
      { ingredientId: "ing-7", quantityNeeded: 0.15 },
    ],
  },
  {
    id: "prod-9",
    name: "Nasi Putih Jasmine",
    category: "Ala Carte",
    price: 5000,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400",
    isAvailable: true,
    recipe: [{ ingredientId: "ing-5", quantityNeeded: 0.08 }],
  },
];

// Helper to generate dynamic mock transactions for the last 7 days
function generateMockSales(): Sale[] {
  const salesList: Sale[] = [];
  const baseTime = new Date();
  let invoiceCounter = 1001;

  // Let's create transactions for the last 7 days
  for (let i = 6; i >= 0; i--) {
    const day = new Date(baseTime);
    day.setDate(baseTime.getDate() - i);
    
    // We want about 3 to 7 sales per day to simulate authentic activity
    const numSales = Math.floor(Math.random() * 5) + 3;
    for (let s = 0; s < numSales; s++) {
      const saleHour = 10 + Math.floor(Math.random() * 11); // 10:00 to 20:00
      const saleMin = Math.floor(Math.random() * 60);
      const saleTime = new Date(day);
      saleTime.setHours(saleHour, saleMin, 0);

      // Random items
      const cart: { prod: Product; qty: number }[] = [];
      const prodCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 distinct items
      const usedIds = new Set();
      
      for (let p = 0; p < prodCount; p++) {
        let randProd;
        do {
          randProd = DEFAULT_PRODUCTS[Math.floor(Math.random() * DEFAULT_PRODUCTS.length)];
        } while (usedIds.has(randProd.id));
        usedIds.add(randProd.id);
        
        cart.push({
          prod: randProd,
          qty: Math.floor(Math.random() * 2) + 1, // 1 to 2 units
        });
      }

      // Compute costs
      let subtotal = 0;
      const saleItems = cart.map(item => {
        const sub = item.prod.price * item.qty;
        subtotal += sub;
        return {
          productId: item.prod.id,
          productName: item.prod.name,
          price: item.prod.price,
          quantity: item.qty,
          subtotal: sub,
        };
      });

      const tax = 0;
      const total = subtotal;
      const roundedTotal = total; // No rounding required since tax is removed

      // Let's pay with a higher denomination
      const payOptions = [20000, 50000, 100000, 150000, 200000];
      let pay = payOptions.find(o => o >= roundedTotal) || (Math.ceil(roundedTotal / 50000) * 50000);
      
      salesList.push({
        id: `sale-${invoiceCounter}`,
        invoiceNumber: `INV-${saleTime.getFullYear()}${(saleTime.getMonth() + 1).toString().padStart(2, "0")}${saleTime.getDate().toString().padStart(2, "0")}-${invoiceCounter}`,
        date: saleTime.toISOString(),
        items: saleItems,
        subtotal,
        tax,
        total: roundedTotal,
        paymentAmount: pay,
        changeAmount: pay - roundedTotal,
        cashierName: ["Budi", "Siti", "Andi"][Math.floor(Math.random() * 3)],
      });
      invoiceCounter++;
    }
  }

  return salesList;
}

export async function syncWithBackend(): Promise<void> {
  try {
    const res = await fetch("/api/sync/state");
    if (res.ok) {
      const data = await res.json();
      if (data.products) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
      }
      if (data.ingredients) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.INGREDIENTS, JSON.stringify(data.ingredients));
      }
      if (data.sales) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.SALES, JSON.stringify(data.sales));
      }
      if (data.expenses) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.EXPENSES, JSON.stringify(data.expenses));
      }
      if (data.wastage) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.WASTAGE, JSON.stringify(data.wastage));
      }
      if (data.storeSettings) {
        localStorage.setItem("pos_fc_settings", JSON.stringify(data.storeSettings));
      }
      if (data.users) {
        localStorage.setItem("pos_fc_users", JSON.stringify(data.users));
      }
    }
  } catch (err) {
    console.warn("Backend sync failed:", err);
  }
}

export async function pushToBackend(
  ingredients?: Ingredient[],
  products?: Product[],
  sales?: Sale[],
  expenses?: Expense[],
  wastage?: Wastage[],
  storeSettings?: any,
  users?: any[]
) {
  try {
    await fetch("/api/sync/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients, products, sales, expenses, wastage, storeSettings, users }),
    });
  } catch (err) {
    console.warn("Backend state sync failed:", err);
  }
}

const DEFAULT_EXPENSES: Expense[] = [
  {
    id: "exp-1",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    description: "Pembayaran Listrik Toko Bulanan",
    category: "listrik",
    amount: 1200000,
  },
  {
    id: "exp-2",
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    description: "Pengisian Tabung Gas 12kg (3 tabung)",
    category: "gas",
    amount: 210000,
  },
  {
    id: "exp-3",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    description: "Gaji Karyawan Shift Pagi & Malam",
    category: "gaji",
    amount: 3500000,
  },
  {
    id: "exp-4",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    description: "Biaya Kebersihan & Keamanan RW",
    category: "lainnya",
    amount: 150000,
  },
];

const DEFAULT_WASTAGE: Wastage[] = [
  {
    id: "wast-1",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    ingredientId: "ing-1",
    ingredientName: "Ayam Potong Segar",
    quantity: 5,
    unit: "pcs",
    costPerUnit: 6000,
    totalCost: 30000,
    reason: "Ayam dibuang karena sudah lewat hari / basi",
  },
  {
    id: "wast-2",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    ingredientId: "ing-9",
    ingredientName: "Kentang Beku Slices",
    quantity: 1.5,
    unit: "kg",
    costPerUnit: 22000,
    totalCost: 33000,
    reason: "Kentang mencair dan tidak layak goreng",
  },
];

export function initializeDb(force = false): void {
  if (force || !localStorage.getItem(LOCAL_STORAGE_KEYS.PRODUCTS)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
  }
  if (force || !localStorage.getItem(LOCAL_STORAGE_KEYS.INGREDIENTS)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.INGREDIENTS, JSON.stringify([]));
  }
  if (force || !localStorage.getItem(LOCAL_STORAGE_KEYS.SALES)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.SALES, JSON.stringify([]));
  }
  if (force || !localStorage.getItem(LOCAL_STORAGE_KEYS.EXPENSES)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.EXPENSES, JSON.stringify([]));
  }
  if (force || !localStorage.getItem(LOCAL_STORAGE_KEYS.WASTAGE)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.WASTAGE, JSON.stringify([]));
  }
}

export function getProducts(): Product[] {
  initializeDb();
  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.PRODUCTS) || "[]");
}

export function getIngredients(): Ingredient[] {
  initializeDb();
  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.INGREDIENTS) || "[]");
}

export function getSales(): Sale[] {
  initializeDb();
  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.SALES) || "[]");
}

export function getExpenses(): Expense[] {
  initializeDb();
  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.EXPENSES) || "[]");
}

export function saveExpenses(expenses: Expense[]): void {
  localStorage.setItem(LOCAL_STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  pushToBackend(undefined, undefined, undefined, expenses, undefined);
}

export function getWastage(): Wastage[] {
  initializeDb();
  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.WASTAGE) || "[]");
}

export function saveWastage(wastage: Wastage[]): void {
  localStorage.setItem(LOCAL_STORAGE_KEYS.WASTAGE, JSON.stringify(wastage));
  pushToBackend(undefined, undefined, undefined, undefined, wastage);
}

export function saveProducts(products: Product[]): void {
  localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  pushToBackend(undefined, products, undefined);
}

export function saveIngredients(ingredients: Ingredient[]): void {
  localStorage.setItem(LOCAL_STORAGE_KEYS.INGREDIENTS, JSON.stringify(ingredients));
  pushToBackend(ingredients, undefined, undefined);
}

export function saveSales(sales: Sale[]): void {
  localStorage.setItem(LOCAL_STORAGE_KEYS.SALES, JSON.stringify(sales));
  pushToBackend(undefined, undefined, sales);
}

// Calculate the cost of goods sold (COGS) for a specific product based on ingredient prices
export function calculateProductCOGS(product: Product, ingredientsList: Ingredient[]): number {
  let totalCost = 0;
  product.recipe.forEach(recipeItem => {
    const ingredient = ingredientsList.find(ing => ing.id === recipeItem.ingredientId);
    if (ingredient) {
      totalCost += recipeItem.quantityNeeded * ingredient.cost;
    }
  });
  return Math.round(totalCost);
}

// Check ingredient availability for a potential cart item
export function checkCartAvailability(cart: CartItem[]): { available: boolean; insufficientIngredient?: string } {
  const ingredients = getIngredients();
  const neededAmounts: Record<string, number> = {};

  // Accumulate ingredient requirements
  for (const item of cart) {
    for (const recipeItem of item.product.recipe) {
      neededAmounts[recipeItem.ingredientId] = (neededAmounts[recipeItem.ingredientId] || 0) + (recipeItem.quantityNeeded * item.quantity);
    }
  }

  // Check against stocks
  for (const [ingredientId, needed] of Object.entries(neededAmounts)) {
    const ingredient = ingredients.find(ing => ing.id === ingredientId);
    if (ingredient) {
      if (ingredient.stock < needed) {
        return {
          available: false,
          insufficientIngredient: `${ingredient.name} (Stok: ${ingredient.stock} ${ingredient.unit}, Butuh: ${needed.toFixed(2)} ${ingredient.unit})`,
        };
      }
    }
  }

  return { available: true };
}

// Main function to process a Point of Sale checkout
export function processSale(cart: CartItem[], paymentAmount: number, cashierName: string): { success: boolean; sale?: Sale; error?: string } {
  if (cart.length === 0) {
    return { success: false, error: "Keranjang belanja kosong." };
  }

  const ingredients = getIngredients();
  
  // Verify inventory first
  const availability = checkCartAvailability(cart);
  if (!availability.available) {
    return { success: false, error: `Bahan baku tidak mencukupi: ${availability.insufficientIngredient}` };
  }

  // Calculate prices
  let subtotal = 0;
  const saleItems = cart.map(item => {
    const sub = item.product.price * item.quantity;
    subtotal += sub;
    return {
      productId: item.product.id,
      productName: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      subtotal: sub,
    };
  });

  const tax = 0;
  const total = subtotal;

  if (paymentAmount < total) {
    return { success: false, error: "Jumlah pembayaran kurang dari total tagihan." };
  }

  // Deduct stocks from ingredients
  const updatedIngredients = ingredients.map(ing => {
    let newStock = ing.stock;
    for (const item of cart) {
      const recipeItem = item.product.recipe.find(r => r.ingredientId === ing.id);
      if (recipeItem) {
        newStock -= recipeItem.quantityNeeded * item.quantity;
      }
    }
    // Round to 3 decimal places to avoid floating point issues
    return { ...ing, stock: Math.max(0, Math.round(newStock * 1000) / 1000) };
  });

  // Record Sale transaction
  const sales = getSales();
  const nextInvoiceNum = sales.length + 1001;
  const now = new Date();
  
  const newSale: Sale = {
    id: `sale-${Date.now()}`,
    invoiceNumber: `INV-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}-${nextInvoiceNum}`,
    date: now.toISOString(),
    items: saleItems,
    subtotal,
    tax,
    total,
    paymentAmount,
    changeAmount: paymentAmount - total,
    cashierName,
  };

  sales.push(newSale);

  // Save both locally in one atomic stroke and sync to backend combined
  localStorage.setItem(LOCAL_STORAGE_KEYS.INGREDIENTS, JSON.stringify(updatedIngredients));
  localStorage.setItem(LOCAL_STORAGE_KEYS.SALES, JSON.stringify(sales));
  pushToBackend(updatedIngredients, undefined, sales);

  return { success: true, sale: newSale };
}

export function recordWastage(ingredientId: string, quantity: number, reason: string): { success: boolean; error?: string } {
  const ingredients = getIngredients();
  const ingIndex = ingredients.findIndex(i => i.id === ingredientId);
  if (ingIndex === -1) {
    return { success: false, error: "Bahan baku tidak ditemukan." };
  }
  const ingredient = ingredients[ingIndex];
  if (ingredient.stock < quantity) {
    return { success: false, error: `Jumlah stok tersedia (${ingredient.stock}) kurang dari jumlah yang ingin dibuang (${quantity}).` };
  }

  // Subtract stock
  ingredient.stock = Math.max(0, Math.round((ingredient.stock - quantity) * 1000) / 1000);

  // Record wastage
  const wastages = getWastage();
  const totalCost = Math.round(quantity * ingredient.cost);
  const newWastage: Wastage = {
    id: `wast-${Date.now()}`,
    date: new Date().toISOString(),
    ingredientId: ingredient.id,
    ingredientName: ingredient.name,
    quantity,
    unit: ingredient.unit,
    costPerUnit: ingredient.cost,
    totalCost,
    reason,
  };
  wastages.unshift(newWastage); // Put new at the top

  // Save both locally and push as a combined payload to the backend
  localStorage.setItem(LOCAL_STORAGE_KEYS.INGREDIENTS, JSON.stringify(ingredients));
  localStorage.setItem(LOCAL_STORAGE_KEYS.WASTAGE, JSON.stringify(wastages));
  pushToBackend(ingredients, undefined, undefined, undefined, wastages);

  return { success: true };
}

export function editWastage(wastageId: string, newQuantity: number, newReason: string): { success: boolean; error?: string } {
  const wastages = getWastage();
  const wastIndex = wastages.findIndex(w => w.id === wastageId);
  if (wastIndex === -1) {
    return { success: false, error: "Catatan wastage tidak ditemukan." };
  }
  const wastage = wastages[wastIndex];
  const ingredients = getIngredients();
  const ingIndex = ingredients.findIndex(i => i.id === wastage.ingredientId);
  
  if (ingIndex !== -1) {
    const ingredient = ingredients[ingIndex];
    // Calculate stock change: how much more is being wasted
    const diff = newQuantity - wastage.quantity;
    if (ingredient.stock < diff) {
      return { success: false, error: `Stok tidak mencukupi untuk memperbarui wastage. Sisa stok: ${ingredient.stock} ${ingredient.unit}.` };
    }
    // Update ingredient stock
    ingredient.stock = Math.max(0, Math.round((ingredient.stock - diff) * 1000) / 1000);
  }

  // Update wastage record
  wastage.quantity = newQuantity;
  wastage.reason = newReason;
  wastage.totalCost = Math.round(newQuantity * wastage.costPerUnit);

  // Save both locally and sync to backend as a combined single update
  localStorage.setItem(LOCAL_STORAGE_KEYS.INGREDIENTS, JSON.stringify(ingredients));
  localStorage.setItem(LOCAL_STORAGE_KEYS.WASTAGE, JSON.stringify(wastages));
  pushToBackend(ingredients, undefined, undefined, undefined, wastages);

  return { success: true };
}

export function deleteWastage(wastageId: string): { success: boolean; error?: string } {
  const wastages = getWastage();
  const wastIndex = wastages.findIndex(w => w.id === wastageId);
  if (wastIndex === -1) {
    return { success: false, error: "Catatan wastage tidak ditemukan." };
  }
  const wastage = wastages[wastIndex];
  const ingredients = getIngredients();
  const ingIndex = ingredients.findIndex(i => i.id === wastage.ingredientId);

  if (ingIndex !== -1) {
    const ingredient = ingredients[ingIndex];
    // Restore the ingredient stock from deleted wastage
    ingredient.stock = Math.round((ingredient.stock + wastage.quantity) * 1000) / 1000;
  }

  // Remove wastage record
  const updatedWastages = wastages.filter(w => w.id !== wastageId);

  // Save both locally and sync to backend combined
  localStorage.setItem(LOCAL_STORAGE_KEYS.INGREDIENTS, JSON.stringify(ingredients));
  localStorage.setItem(LOCAL_STORAGE_KEYS.WASTAGE, JSON.stringify(updatedWastages));
  pushToBackend(ingredients, undefined, undefined, undefined, updatedWastages);

  return { success: true };
}
