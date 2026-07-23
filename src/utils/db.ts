/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Ingredient, Sale, CartItem, Expense, Wastage, User } from "../types";

export interface StoreSettings {
  storeName: string;
  storeTagline: string;
  storeAddress: string;
  storePhone: string;
}

// Centrally managed in-memory state cache
const dbCache = {
  products: [] as Product[],
  ingredients: [] as Ingredient[],
  sales: [] as Sale[],
  expenses: [] as Expense[],
  wastage: [] as Wastage[],
  storeSettings: {
    storeName: "BFC Geprek Aruji",
    storeTagline: "Berkah Fried Chicken",
    storeAddress: "Jl. Paha Dada Krispi No. 99, Jakarta Barat",
    storePhone: "0812-3456-7890",
  } as StoreSettings,
  users: [] as User[],
};

// Purge legacy localStorage database cache to ensure all devices display 100% synchronized Firestore data
try {
  localStorage.removeItem("bfc_pos_db_cache");
} catch (e) {
  // Ignore
}

// Synchronization guards and change subscription mechanism
let lastPushTime = 0;
let activePushes = 0;

type DbChangeListener = () => void;
const listeners = new Set<DbChangeListener>();

export function subscribeToDbChanges(listener: DbChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyDbChanges() {
  listeners.forEach(l => {
    try {
      l();
    } catch (e) {
      console.error("Listener error:", e);
    }
  });
}

// Periodic automatic sync with Firebase Firestore
export async function syncWithBackend(): Promise<void> {
  // If we have active pushes or recent push in the last 4 seconds, skip GET sync to avoid race conditions
  if (activePushes > 0 || Date.now() - lastPushTime < 4000) {
    return;
  }

  try {
    const res = await fetch("/api/sync/state");
    if (res.ok) {
      const data = await res.json();
      let changed = false;

      if (data.ingredients && Array.isArray(data.ingredients)) {
        if (JSON.stringify(data.ingredients) !== JSON.stringify(dbCache.ingredients)) {
          dbCache.ingredients = data.ingredients;
          changed = true;
        }
      }

      if (data.products && Array.isArray(data.products)) {
        if (JSON.stringify(data.products) !== JSON.stringify(dbCache.products)) {
          dbCache.products = data.products;
          changed = true;
        }
      }

      if (data.sales && Array.isArray(data.sales)) {
        if (JSON.stringify(data.sales) !== JSON.stringify(dbCache.sales)) {
          dbCache.sales = data.sales;
          changed = true;
        }
      }

      if (data.expenses && Array.isArray(data.expenses)) {
        if (JSON.stringify(data.expenses) !== JSON.stringify(dbCache.expenses)) {
          dbCache.expenses = data.expenses;
          changed = true;
        }
      }

      if (data.wastage && Array.isArray(data.wastage)) {
        if (JSON.stringify(data.wastage) !== JSON.stringify(dbCache.wastage)) {
          dbCache.wastage = data.wastage;
          changed = true;
        }
      }

      if (data.storeSettings && JSON.stringify(data.storeSettings) !== JSON.stringify(dbCache.storeSettings)) { 
        dbCache.storeSettings = data.storeSettings; 
        changed = true; 
      }

      if (data.users && Array.isArray(data.users) && JSON.stringify(data.users) !== JSON.stringify(dbCache.users)) { 
        dbCache.users = data.users; 
        changed = true; 
      }

      if (changed) {
        notifyDbChanges();
      }
    }
  } catch (err) {
    console.warn("Backend sync failed:", err);
  }
}

// Push local state update asynchronously to Firebase Firestore
export async function pushToBackend(
  ingredientsOrOptions?: Ingredient[] | { ingredients?: Ingredient[]; products?: Product[]; sales?: Sale[]; expenses?: Expense[]; wastage?: Wastage[]; storeSettings?: any; users?: any[] },
  products?: Product[],
  sales?: Sale[],
  expenses?: Expense[],
  wastage?: Wastage[],
  storeSettings?: any,
  users?: any[]
) {
  let ing: Ingredient[] | undefined;
  let prod: Product[] | undefined;
  let sal: Sale[] | undefined;
  let exp: Expense[] | undefined;
  let wast: Wastage[] | undefined;
  let setts: any;
  let usrs: any[] | undefined;

  if (ingredientsOrOptions && !Array.isArray(ingredientsOrOptions) && typeof ingredientsOrOptions === "object") {
    ing = ingredientsOrOptions.ingredients;
    prod = ingredientsOrOptions.products;
    sal = ingredientsOrOptions.sales;
    exp = ingredientsOrOptions.expenses;
    wast = ingredientsOrOptions.wastage;
    setts = ingredientsOrOptions.storeSettings;
    usrs = ingredientsOrOptions.users;
  } else {
    ing = ingredientsOrOptions as Ingredient[] | undefined;
    prod = products;
    sal = sales;
    exp = expenses;
    wast = wastage;
    setts = storeSettings;
    usrs = users;
  }

  // Optimistic update of the in-memory cache for ultra-responsive UI
  if (ing) dbCache.ingredients = ing;
  if (prod) dbCache.products = prod;
  if (sal) dbCache.sales = sal;
  if (exp) dbCache.expenses = exp;
  if (wast) dbCache.wastage = wast;
  if (setts) dbCache.storeSettings = setts;
  if (usrs) dbCache.users = usrs;

  // Notify listeners immediately for optimistic response in UI
  notifyDbChanges();

  lastPushTime = Date.now();
  activePushes++;

  try {
    const payload: any = {};
    if (ing !== undefined) payload.ingredients = ing;
    if (prod !== undefined) payload.products = prod;
    if (sal !== undefined) payload.sales = sal;
    if (exp !== undefined) payload.expenses = exp;
    if (wast !== undefined) payload.wastage = wast;
    if (setts !== undefined) payload.storeSettings = setts;
    if (usrs !== undefined) payload.users = usrs;

    const res = await fetch("/api/sync/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      let changed = false;

      if (data.products && Array.isArray(data.products) && JSON.stringify(data.products) !== JSON.stringify(dbCache.products)) {
        dbCache.products = data.products;
        changed = true;
      }
      if (data.ingredients && Array.isArray(data.ingredients) && JSON.stringify(data.ingredients) !== JSON.stringify(dbCache.ingredients)) {
        dbCache.ingredients = data.ingredients;
        changed = true;
      }
      if (data.sales && Array.isArray(data.sales) && JSON.stringify(data.sales) !== JSON.stringify(dbCache.sales)) {
        dbCache.sales = data.sales;
        changed = true;
      }
      if (data.expenses && Array.isArray(data.expenses) && JSON.stringify(data.expenses) !== JSON.stringify(dbCache.expenses)) {
        dbCache.expenses = data.expenses;
        changed = true;
      }
      if (data.wastage && Array.isArray(data.wastage) && JSON.stringify(data.wastage) !== JSON.stringify(dbCache.wastage)) {
        dbCache.wastage = data.wastage;
        changed = true;
      }
      if (data.storeSettings && JSON.stringify(data.storeSettings) !== JSON.stringify(dbCache.storeSettings)) {
        dbCache.storeSettings = data.storeSettings;
        changed = true;
      }
      if (data.users && Array.isArray(data.users) && JSON.stringify(data.users) !== JSON.stringify(dbCache.users)) {
        dbCache.users = data.users;
        changed = true;
      }

      if (changed) {
        notifyDbChanges();
      }
    }
  } catch (err) {
    console.warn("Backend state sync failed:", err);
  } finally {
    activePushes = Math.max(0, activePushes - 1);
    lastPushTime = Date.now();
  }
}

export function initializeDb(force = false): void {
  syncWithBackend();
}

export function getProducts(): Product[] {
  return dbCache.products;
}

export function getIngredients(): Ingredient[] {
  return dbCache.ingredients;
}

export function getSales(): Sale[] {
  return dbCache.sales;
}

export function getExpenses(): Expense[] {
  return dbCache.expenses;
}

export function saveExpenses(expenses: Expense[]): void {
  pushToBackend(undefined, undefined, undefined, expenses, undefined);
}

export function getWastage(): Wastage[] {
  return dbCache.wastage;
}

export function saveWastage(wastage: Wastage[]): void {
  pushToBackend(undefined, undefined, undefined, undefined, wastage);
}

export function saveProducts(products: Product[]): void {
  pushToBackend(undefined, products, undefined);
}

export function saveIngredients(ingredients: Ingredient[]): void {
  pushToBackend(ingredients, undefined, undefined);
}

export function saveSales(sales: Sale[]): void {
  pushToBackend(undefined, undefined, sales);
}

// Store settings getters & setters (previously in SettingsView)
export const getStoreSettings = (): StoreSettings => {
  return dbCache.storeSettings;
};

export const saveStoreSettings = (settings: StoreSettings): void => {
  pushToBackend(undefined, undefined, undefined, undefined, undefined, settings);
};

// Users getters & setters (previously in SettingsView)
export const getStoredUsers = (): (User & { password?: string })[] => {
  const defaults = [
    { id: "user-1", username: "superadmin", password: "admin123", role: "superadmin" as const, name: "Adam Superadmin" },
    { id: "user-2", username: "kasir", password: "kasir123", role: "kasir" as const, name: "Siti Kasir Utama" },
    { id: "user-3", username: "owner", password: "owner123", role: "owner" as const, name: "Pak Hartono Owner" }
  ];
  if (dbCache.users && dbCache.users.length > 0) {
    return dbCache.users;
  }
  return defaults;
};

export const saveStoredUsers = (users: (User & { password?: string })[]): void => {
  pushToBackend(undefined, undefined, undefined, undefined, undefined, undefined, users);
};

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

  pushToBackend(ingredients, undefined, undefined, undefined, updatedWastages);

  return { success: true };
}
