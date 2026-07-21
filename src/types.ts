/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Ingredient {
  id: string;
  name: string;
  stock: number;
  unit: string; // e.g., "pcs", "kg", "liter", "pack"
  minStock: number;
  cost: number; // cost price per unit (e.g., Rp 6.000 per pcs)
}

export interface RecipeItem {
  ingredientId: string;
  quantityNeeded: number; // e.g., 1 (pcs) for Ayam, 0.05 (kg) for Tepung
}

export interface Product {
  id: string;
  name: string;
  category: "Paket Ayam" | "Ala Carte" | "Minuman";
  price: number;
  image: string;
  isAvailable: boolean;
  recipe: RecipeItem[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: string; // ISO string
  items: SaleItem[];
  subtotal: number;
  tax: number; // PB1 10%
  total: number;
  paymentAmount: number;
  changeAmount: number;
  cashierName: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: "superadmin" | "kasir" | "owner";
}

export interface Expense {
  id: string;
  date: string; // ISO String
  description: string;
  category: "listrik" | "gas" | "gaji" | "bahan" | "lainnya";
  amount: number;
}

export interface Wastage {
  id: string;
  date: string; // ISO String
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
  reason: string;
}

export interface DbConfig {
  type: "postgresql" | "mysql" | "simulation";
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  ssl?: boolean;
}

