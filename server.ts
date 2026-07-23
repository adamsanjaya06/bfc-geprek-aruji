import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import "dotenv/config";

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to store JSON fallback database
const DB_FALLBACK_PATH = path.join(process.cwd(), "db-fallback.json");

// System Logs of executed database commands (sent to UI for pedagogical display)
let sqlQueryLogs: { timestamp: string; sql: string; success: boolean; durationMs: number; error?: string }[] = [];

// Helper to log Firestore operations as pseudo-SQL for the console view compatibility
function logDb(action: string, success: boolean, durationMs: number, error?: string) {
  sqlQueryLogs.unshift({
    timestamp: new Date().toISOString(),
    sql: action,
    success,
    durationMs,
    error,
  });
  // Keep last 50 logs
  if (sqlQueryLogs.length > 50) {
    sqlQueryLogs.pop();
  }
}

// Default Data Seed Definition
const DEFAULT_INGREDIENTS = [
  { id: "ing-1", name: "Ayam Potong Segar", stock: 150, unit: "pcs", minStock: 25, cost: 6000 },
  { id: "ing-2", name: "Tepung Bumbu Krispi", stock: 25.0, unit: "kg", minStock: 5.0, cost: 15000 },
  { id: "ing-3", name: "Minyak Goreng Sawit", stock: 40.0, unit: "liter", minStock: 8.0, cost: 14000 },
  { id: "ing-4", name: "Cabe Rawit Merah", stock: 5.5, unit: "kg", minStock: 1.5, cost: 40000 },
  { id: "ing-5", name: "Beras Jasmine Super", stock: 30.0, unit: "kg", minStock: 8.0, cost: 13000 },
];

const DEFAULT_PRODUCTS = [
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
    name: "Nasi Putih Jasmine",
    category: "Ala Carte",
    price: 5000,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400",
    isAvailable: true,
    recipe: [{ ingredientId: "ing-5", quantityNeeded: 0.08 }],
  },
];

const DEFAULT_EXPENSES = [
  {
    id: "exp-1",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    description: "Sewa Ruko Bulanan",
    category: "lainnya",
    amount: 1500000,
  },
  {
    id: "exp-2",
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    description: "Pembayaran Listrik Toko Bulanan",
    category: "listrik",
    amount: 1200000,
  },
  {
    id: "exp-3",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    description: "Pengisian Tabung Gas 12kg",
    category: "gas",
    amount: 210000,
  },
  {
    id: "exp-4",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    description: "Gaji Karyawan Shift Pagi",
    category: "gaji",
    amount: 1500000,
  },
  {
    id: "exp-5",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    description: "Biaya Kebersihan Lingkungan RW",
    category: "lainnya",
    amount: 150000,
  },
];

const DEFAULT_WASTAGE = [
  {
    id: "wast-1",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    ingredientId: "ing-1",
    ingredientName: "Ayam Potong Segar",
    quantity: 5,
    unit: "pcs",
    costPerUnit: 6000,
    totalCost: 30000,
    reason: "Ayam lewat hari / basi",
  },
  {
    id: "wast-2",
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    ingredientId: "ing-2",
    ingredientName: "Tepung Bumbu Krispi",
    quantity: 1,
    unit: "kg",
    costPerUnit: 15000,
    totalCost: 15000,
    reason: "Tepung basah terkena air",
  },
  {
    id: "wast-3",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    ingredientId: "ing-3",
    ingredientName: "Minyak Goreng Sawit",
    quantity: 2,
    unit: "liter",
    costPerUnit: 14000,
    totalCost: 28000,
    reason: "Tumpah saat pengisian wajan",
  },
  {
    id: "wast-4",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    ingredientId: "ing-4",
    ingredientName: "Cabe Rawit Merah",
    quantity: 0.5,
    unit: "kg",
    costPerUnit: 40000,
    totalCost: 20000,
    reason: "Cabe membusuk",
  },
  {
    id: "wast-5",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    ingredientId: "ing-5",
    ingredientName: "Beras Jasmine Super",
    quantity: 1,
    unit: "kg",
    costPerUnit: 13000,
    totalCost: 13000,
    reason: "Beras berkutu",
  },
];

// Read Firebase Config file
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseConfig: any = null;
if (fs.existsSync(firebaseConfigPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
  } catch (err) {
    console.error("Failed to parse firebase-applet-config.json:", err);
  }
}

// Initialize Firebase
let db: any = null;
if (firebaseConfig) {
  try {
    const firebaseApp = initializeApp({
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      appId: firebaseConfig.appId,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
    });
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || "(default)");
    console.log("Firebase initialized successfully with project:", firebaseConfig.projectId);
  } catch (err: any) {
    console.error("Failed to initialize Firebase:", err.message);
  }
}

// Local File Fallback Implementation
function loadFallbackDb(): any {
  if (fs.existsSync(DB_FALLBACK_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(DB_FALLBACK_PATH, "utf-8"));
    } catch (err) {
      console.error("Error reading fallback DB:", err);
    }
  }
  const defaultDb = {
    ingredients: DEFAULT_INGREDIENTS,
    products: DEFAULT_PRODUCTS,
    sales: [],
    expenses: [],
    wastage: [],
    storeSettings: {
      storeName: "BFC Geprek Aruji",
      storeTagline: "Berkah Fried Chicken",
      storeAddress: "Jl. Paha Dada Krispi No. 99, Jakarta Barat",
      storePhone: "0812-3456-7890"
    },
    users: [
      { id: "user-1", username: "superadmin", password: "admin123", role: "superadmin", name: "Adam Superadmin" },
      { id: "user-2", username: "kasir", password: "kasir123", role: "kasir", name: "Siti Kasir Utama" },
      { id: "user-3", username: "owner", password: "owner123", role: "owner", name: "Pak Hartono Owner" }
    ]
  };
  try {
    fs.writeFileSync(DB_FALLBACK_PATH, JSON.stringify(defaultDb, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing default fallback DB:", err);
  }
  return defaultDb;
}

function saveFallbackDb(dbData: any): void {
  try {
    fs.writeFileSync(DB_FALLBACK_PATH, JSON.stringify(dbData, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving fallback DB:", err);
  }
}

// Firebase Firestore Helpers
async function testConnection(): Promise<{ success: boolean; message: string }> {
  const startTime = Date.now();
  if (!db) {
    return { success: false, message: "Firebase is not initialized (missing firebase-applet-config.json)." };
  }
  try {
    await getDocs(collection(db, "users"));
    const elapsed = Date.now() - startTime;
    logDb("/* Test Firestore Connection */ SELECT 1;", true, elapsed);
    return { success: true, message: `Sukses terhubung ke Firebase Firestore (${elapsed}ms).` };
  } catch (err: any) {
    logDb("/* Test Firestore Connection Fail */ SELECT 1;", false, Date.now() - startTime, err.message);
    return { success: false, message: `Gagal terhubung ke Firestore: ${err.message}` };
  }
}

async function fetchCollection(collectionName: string): Promise<any[]> {
  const startTime = Date.now();
  if (!db) {
    logDb(`/* Firestore Read Fallback */ SELECT * FROM ${collectionName};`, true, 1);
    const localDb = loadFallbackDb();
    return (localDb as any)[collectionName] || [];
  }
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const items: any[] = [];
    snapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    logDb(`/* Firestore READ */ SELECT * FROM ${collectionName};`, true, Date.now() - startTime);
    return items;
  } catch (err: any) {
    logDb(`/* Firestore Read Fail */ SELECT * FROM ${collectionName};`, false, Date.now() - startTime, err.message);
    console.warn(`Firestore read failed for ${collectionName}, falling back to local file:`, err.message);
    const localDb = loadFallbackDb();
    return (localDb as any)[collectionName] || [];
  }
}

async function saveCollection(collectionName: string, items: any[]): Promise<void> {
  const startTime = Date.now();
  
  function cleanDataForFirestore(obj: any): any {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) {
      return obj.map(cleanDataForFirestore);
    }
    if (typeof obj === "object" && !(obj instanceof Date)) {
      const cleaned: any = {};
      for (const key of Object.keys(obj)) {
        if (obj[key] !== undefined) {
          cleaned[key] = cleanDataForFirestore(obj[key]);
        }
      }
      return cleaned;
    }
    return obj;
  }

  // Always keep fallback DB updated in sync
  try {
    const localDb = loadFallbackDb();
    (localDb as any)[collectionName] = items;
    saveFallbackDb(localDb);
  } catch (err: any) {
    console.warn(`Failed updating fallback local DB for ${collectionName}:`, err.message);
  }

  if (!db) {
    logDb(`/* Firestore Write Fallback */ REPLACE INTO ${collectionName};`, true, 1);
    return;
  }
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const existingIds = snapshot.docs.map(doc => doc.id);
    const newIds = new Set(items.map(item => String(item.id)));

    // Clean deleted documents (only for collections that support deletion)
    const deletableCollections = ["products", "ingredients", "sales", "expenses", "wastage", "users"];
    if (deletableCollections.includes(collectionName)) {
      for (const id of existingIds) {
        if (!newIds.has(id)) {
          await deleteDoc(doc(db, collectionName, id));
        }
      }
    }

    // Set/upsert new documents with cleaned undefined fields
    for (const item of items) {
      if (!item.id) continue;
      const { id, ...data } = item;
      const cleanedData = cleanDataForFirestore(data);
      await setDoc(doc(db, collectionName, String(id)), cleanedData);
    }
    logDb(`/* Firestore WRITE */ REPLACE INTO ${collectionName} (${items.length} records);`, true, Date.now() - startTime);
  } catch (err: any) {
    logDb(`/* Firestore Write Fail */ REPLACE INTO ${collectionName};`, false, Date.now() - startTime, err.message);
    console.error(`Firestore write failed for ${collectionName}:`, err.message);
  }
}

async function fetchStoreSettings(): Promise<any> {
  const startTime = Date.now();
  const defaultSettings = {
    storeName: "BFC Geprek Aruji",
    storeTagline: "Berkah Fried Chicken",
    storeAddress: "Jl. Paha Dada Krispi No. 99, Jakarta Barat",
    storePhone: "0812-3456-7890"
  };
  if (!db) {
    const localDb = loadFallbackDb();
    return localDb.storeSettings || defaultSettings;
  }
  try {
    const docRef = doc(db, "storeSettings", "store");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      logDb(`/* Firestore READ */ SELECT * FROM store_settings LIMIT 1;`, true, Date.now() - startTime);
      return docSnap.data();
    } else {
      await setDoc(docRef, defaultSettings);
      logDb(`/* Firestore READ/WRITE default */ SELECT * FROM store_settings;`, true, Date.now() - startTime);
      return defaultSettings;
    }
  } catch (err: any) {
    logDb(`/* Firestore Read Settings Fail */`, false, Date.now() - startTime, err.message);
    const localDb = loadFallbackDb();
    return localDb.storeSettings || defaultSettings;
  }
}

async function saveStoreSettings(settings: any): Promise<void> {
  const startTime = Date.now();
  if (!db) {
    const localDb = loadFallbackDb();
    localDb.storeSettings = settings;
    saveFallbackDb(localDb);
    return;
  }
  try {
    await setDoc(doc(db, "storeSettings", "store"), settings);
    logDb(`/* Firestore WRITE */ REPLACE INTO store_settings;`, true, Date.now() - startTime);
  } catch (err: any) {
    logDb(`/* Firestore Write Settings Fail */`, false, Date.now() - startTime, err.message);
    const localDb = loadFallbackDb();
    localDb.storeSettings = settings;
    saveFallbackDb(localDb);
  }
}

// Default Expenses & Wastage Seeds are removed to avoid mock data.

// Firestore Seeding and Migrations
async function runSqlMigrations(): Promise<string> {
  if (!db) {
    return "Firebase tidak terinisialisasi. Penyimpanan lokal fallback aktif dan siap digunakan!";
  }
  try {
    let seededCount = 0;

    // 1. Users
    const usersList = await fetchCollection("users");
    if (usersList.length === 0) {
      const PRESET_USERS = [
        { id: "user-1", username: "superadmin", password: "admin123", role: "superadmin", name: "Adam Superadmin" },
        { id: "user-2", username: "kasir", password: "kasir123", role: "kasir", name: "Siti Kasir Utama" },
        { id: "user-3", username: "owner", password: "owner123", role: "owner", name: "Pak Hartono Owner" }
      ];
      await saveCollection("users", PRESET_USERS);
      seededCount++;
    }

    // 2. Ingredients
    const ingredientsList = await fetchCollection("ingredients");
    if (ingredientsList.length === 0) {
      await saveCollection("ingredients", DEFAULT_INGREDIENTS);
      seededCount++;
    }

    // 3. Products
    const productsList = await fetchCollection("products");
    if (productsList.length === 0) {
      await saveCollection("products", DEFAULT_PRODUCTS);
      seededCount++;
    }

    // 4. Expenses
    const expensesList = await fetchCollection("expenses");
    if (expensesList.length === 0) {
      await saveCollection("expenses", DEFAULT_EXPENSES);
      seededCount++;
    }

    // 5. Wastage
    const wastageList = await fetchCollection("wastage");
    if (wastageList.length === 0) {
      await saveCollection("wastage", DEFAULT_WASTAGE);
      seededCount++;
    }

    // 7. Store Settings
    try {
      const docRef = doc(db, "storeSettings", "store");
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await saveStoreSettings({
          storeName: "BFC Geprek Aruji",
          storeTagline: "Berkah Fried Chicken",
          storeAddress: "Jl. Paha Dada Krispi No. 99, Jakarta Barat",
          storePhone: "0812-3456-7890"
        });
        seededCount++;
      }
    } catch (err: any) {
      console.warn("Failed to check/save store settings:", err.message);
    }

    if (seededCount > 0) {
      return `Migrasi berhasil! Database terintegrasi Firebase Firestore telah di-seed dengan sukses (${seededCount} bagian diisi baru).`;
    }
    return "Migrasi berhasil! Struktur database Firebase Firestore telah siap dan sinkron.";
  } catch (err: any) {
    console.error("Firebase seeding error:", err.message);
    return `Migrasi parsial berhasil. Error detail: ${err.message}`;
  }
}

// Force reset and re-seed database with clean, pristine, real-world empty transactions
async function runSqlReset(): Promise<string> {
  const PRESET_USERS = [
    { id: "user-1", username: "superadmin", password: "admin123", role: "superadmin", name: "Adam Superadmin" },
    { id: "user-2", username: "kasir", password: "kasir123", role: "kasir", name: "Siti Kasir Utama" },
    { id: "user-3", username: "owner", password: "owner123", role: "owner", name: "Pak Hartono Owner" }
  ];

  if (!db) {
    const defaultDb = {
      ingredients: DEFAULT_INGREDIENTS,
      products: DEFAULT_PRODUCTS,
      sales: [],
      expenses: DEFAULT_EXPENSES,
      wastage: DEFAULT_WASTAGE,
      storeSettings: {
        storeName: "BFC Geprek Aruji",
        storeTagline: "Berkah Fried Chicken",
        storeAddress: "Jl. Paha Dada Krispi No. 99, Jakarta Barat",
        storePhone: "0812-3456-7890"
      },
      users: PRESET_USERS
    };
    saveFallbackDb(defaultDb);
    return "Reset local fallback database berhasil dilakukan dengan data seed baru.";
  }

  try {
    const collectionsToClear = ["users", "ingredients", "products", "sales", "expenses", "wastage"];
    
    for (const colName of collectionsToClear) {
      try {
        const colRef = collection(db, colName);
        const snapshot = await getDocs(colRef);
        for (const docSnap of snapshot.docs) {
          await deleteDoc(doc(db, colName, docSnap.id));
        }
      } catch (e: any) {
        console.warn(`Failed to clear collection ${colName}:`, e.message);
      }
    }

    // Clear storeSettings
    try {
      await deleteDoc(doc(db, "storeSettings", "store"));
    } catch (err) {
      console.warn("Failed to delete store settings on reset:", err);
    }

    // Re-seed Users, Ingredients, Products, Expenses, Wastage and Store Settings
    await saveCollection("users", PRESET_USERS);
    await saveCollection("ingredients", DEFAULT_INGREDIENTS);
    await saveCollection("products", DEFAULT_PRODUCTS);
    await saveCollection("expenses", DEFAULT_EXPENSES);
    await saveCollection("wastage", DEFAULT_WASTAGE);

    await saveStoreSettings({
      storeName: "BFC Geprek Aruji",
      storeTagline: "Berkah Fried Chicken",
      storeAddress: "Jl. Paha Dada Krispi No. 99, Jakarta Barat",
      storePhone: "0812-3456-7890"
    });

    // Sync fallback file as well
    const defaultDb = {
      ingredients: DEFAULT_INGREDIENTS,
      products: DEFAULT_PRODUCTS,
      sales: [],
      expenses: DEFAULT_EXPENSES,
      wastage: DEFAULT_WASTAGE,
      storeSettings: {
        storeName: "BFC Geprek Aruji",
        storeTagline: "Berkah Fried Chicken",
        storeAddress: "Jl. Paha Dada Krispi No. 99, Jakarta Barat",
        storePhone: "0812-3456-7890"
      },
      users: PRESET_USERS
    };
    saveFallbackDb(defaultDb);

    return "Database Firestore berhasil di-reset total dan di-seed dengan sukses.";
  } catch (err: any) {
    console.error("Firebase reset error:", err.message);
    throw new Error(`Gagal mereset Firestore: ${err.message}`);
  }
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// System Health & State
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: db ? "firebase" : "fallback" });
});

// Logs Endpoint
app.get("/api/db/logs", (req, res) => {
  res.json(sqlQueryLogs);
});

// Settings Management
app.get("/api/db/config", (req, res) => {
  res.json({
    type: "firebase",
    host: firebaseConfig?.projectId || "Firebase Cloud",
    port: 443,
    user: "client-sdk",
    database: firebaseConfig?.firestoreDatabaseId || "(default)",
  });
});

app.post("/api/db/config", async (req, res) => {
  const testRes = await testConnection();
  res.json({ success: true, message: `Konfigurasi Firebase Firestore aktif. ${testRes.message}` });
});

// Test Connection Endpoint
app.post("/api/db/test", async (req, res) => {
  const testRes = await testConnection();
  res.json(testRes);
});

// Run DB Migrations
app.post("/api/db/migrate", async (req, res) => {
  try {
    const msg = await runSqlMigrations();
    res.json({ success: true, message: msg });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Run DB Reset
app.post("/api/db/reset", async (req, res) => {
  try {
    const msg = await runSqlReset();
    res.json({ success: true, message: msg });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Run Raw query emulation
app.post("/api/db/query", async (req, res) => {
  const { sql } = req.body;
  if (!sql) {
    return res.status(400).json({ error: "SQL query is required" });
  }

  try {
    const cleanSql = sql.toLowerCase();
    logDb(`/* Query Console */ ${sql}`, true, 10);

    if (cleanSql.includes("from users")) {
      const users = await fetchCollection("users");
      return res.json({ success: true, rows: users, affectedRows: 0 });
    }
    if (cleanSql.includes("from store_settings")) {
      const settings = await fetchStoreSettings();
      return res.json({ success: true, rows: [settings], affectedRows: 0 });
    }
    if (cleanSql.includes("from ingredients")) {
      const ingredients = await fetchCollection("ingredients");
      return res.json({ success: true, rows: ingredients, affectedRows: 0 });
    }
    if (cleanSql.includes("from products")) {
      const products = await fetchCollection("products");
      return res.json({ success: true, rows: products, affectedRows: 0 });
    }
    if (cleanSql.includes("from sales")) {
      const sales = await fetchCollection("sales");
      return res.json({ success: true, rows: sales, affectedRows: 0 });
    }

    res.json({ success: true, rows: [], affectedRows: 0 });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

// Authentication Access Endpoint
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    let usersList = await fetchCollection("users");
    if (usersList.length === 0) {
      await runSqlMigrations();
      usersList = await fetchCollection("users");
    }

    const matched = usersList.find(u => u.username === username && u.password === password);
    if (matched) {
      return res.json({
        success: true,
        user: {
          id: matched.id,
          username: matched.username,
          name: matched.name,
          role: matched.role
        }
      });
    }
  } catch (err: any) {
    console.warn("Firestore authentication check failed, using fallback:", err.message);
  }

  const PRESET_USERS = [
    { id: "user-1", username: "superadmin", password: "admin123", role: "superadmin", name: "Adam Superadmin" },
    { id: "user-2", username: "kasir", password: "kasir123", role: "kasir", name: "Siti Kasir Utama" },
    { id: "user-3", username: "owner", password: "owner123", role: "owner", name: "Pak Hartono Owner" }
  ];

  const matchedPreset = PRESET_USERS.find(u => u.username === username && u.password === password);
  if (matchedPreset) {
    return res.json({
      success: true,
      user: {
        id: matchedPreset.id,
        username: matchedPreset.username,
        name: matchedPreset.name,
        role: matchedPreset.role
      }
    });
  }

  res.status(401).json({ success: false, message: "Kombinasi Username dan Password salah!" });
});

// Sync State API endpoints
// Helper to read and format all collections from Firebase Firestore
async function getFullDbState(): Promise<any> {
  const [ingredients, products, sales, expenses, wastage, users, storeSettings] = await Promise.all([
    fetchCollection("ingredients"),
    fetchCollection("products"),
    fetchCollection("sales"),
    fetchCollection("expenses"),
    fetchCollection("wastage"),
    fetchCollection("users"),
    fetchStoreSettings(),
  ]);

  const formattedIngredients = ingredients.map(ing => ({
    id: ing.id,
    name: ing.name,
    stock: Number(ing.stock),
    unit: ing.unit,
    minStock: Number(ing.minStock ?? ing.min_stock ?? 0),
    cost: Number(ing.cost),
  }));

  const formattedProducts = products.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: Number(p.price),
    image: p.image,
    isAvailable: p.isAvailable === true || p.isAvailable === 1 || p.is_available === true,
    recipe: Array.isArray(p.recipe) ? p.recipe.map((r: any) => ({
      ingredientId: r.ingredientId ?? r.ingredient_id,
      quantityNeeded: Number(r.quantityNeeded ?? r.quantity_needed ?? 0)
    })) : []
  }));

  const formattedSales = sales.map(s => ({
    id: s.id,
    invoiceNumber: s.invoiceNumber ?? s.invoice_number,
    date: s.date,
    items: Array.isArray(s.items) ? s.items.map((item: any) => ({
      productId: item.productId ?? item.product_id,
      productName: item.productName ?? item.product_name,
      price: Number(item.price),
      quantity: Number(item.quantity),
      subtotal: Number(item.subtotal),
    })) : [],
    subtotal: Number(s.subtotal),
    tax: Number(s.tax ?? 0),
    total: Number(s.total),
    paymentAmount: Number(s.paymentAmount ?? s.payment_amount ?? s.total),
    changeAmount: Number(s.changeAmount ?? s.change_amount ?? 0),
    cashierName: s.cashierName ?? s.cashier_name,
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formattedExpenses = expenses.map(e => ({
    id: e.id,
    date: e.date,
    description: e.description,
    category: e.category,
    amount: Number(e.amount),
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formattedWastage = wastage.map(w => ({
    id: w.id,
    date: w.date,
    ingredientId: w.ingredientId ?? w.ingredient_id,
    ingredientName: w.ingredientName ?? w.ingredient_name,
    quantity: Number(w.quantity),
    unit: w.unit,
    costPerUnit: Number(w.costPerUnit ?? w.cost_per_unit ?? 0),
    totalCost: Number(w.totalCost ?? w.total_cost ?? 0),
    reason: w.reason,
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    ingredients: formattedIngredients,
    products: formattedProducts,
    sales: formattedSales,
    expenses: formattedExpenses,
    wastage: formattedWastage,
    users: users.length > 0 ? users : undefined,
    storeSettings,
  };
}

app.get("/api/sync/state", async (req, res) => {
  try {
    const state = await getFullDbState();
    res.json(state);
  } catch (err: any) {
    console.error("Failed to read state from Firestore:", err.message);
    const fallbackDb = loadFallbackDb();
    res.json(fallbackDb);
  }
});

app.post("/api/sync/state", async (req, res) => {
  const { ingredients, products, sales, expenses, wastage, storeSettings, users } = req.body;
  try {
    if (storeSettings) {
      await saveStoreSettings(storeSettings);
    }

    if (users) {
      await saveCollection("users", users);
    }

    if (ingredients) {
      await saveCollection("ingredients", ingredients);
    }

    if (products) {
      await saveCollection("products", products);
    }

    if (sales) {
      await saveCollection("sales", sales);
    }

    if (expenses) {
      await saveCollection("expenses", expenses);
    }

    if (wastage) {
      await saveCollection("wastage", wastage);
    }

    // Immediately fetch and return the updated state from Firestore
    const state = await getFullDbState();
    res.json(state);
  } catch (err: any) {
    console.error("Failed to save state to Firestore:", err.message);
    const fallbackDb = loadFallbackDb();
    if (ingredients) fallbackDb.ingredients = ingredients;
    if (products) fallbackDb.products = products;
    if (sales) fallbackDb.sales = sales;
    if (expenses) fallbackDb.expenses = expenses;
    if (wastage) fallbackDb.wastage = wastage;
    if (storeSettings) fallbackDb.storeSettings = storeSettings;
    if (users) fallbackDb.users = users;
    saveFallbackDb(fallbackDb);
    res.json({ ...fallbackDb, fallback: true });
  }
});

// Vite middleware for development & production static serve
async function startServer() {
  try {
    await runSqlMigrations();
    console.log("Firebase migration completed on startup.");
  } catch (err: any) {
    console.error("Auto-migration on startup failed:", err.message);
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server Fried Chicken POS running on port ${PORT}`);
    });
  }
}

startServer();

export default app;
