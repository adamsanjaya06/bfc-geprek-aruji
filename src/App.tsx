/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import PosView from "./components/PosView";
import MenuView from "./components/MenuView";
import IngredientsView from "./components/IngredientsView";
import LoginView from "./components/LoginView";
import FinanceView from "./components/FinanceView";
import SalesHistoryView from "./components/SalesHistoryView";
import SettingsView from "./components/SettingsView";
import { 
  getProducts, 
  getIngredients, 
  getSales, 
  saveProducts, 
  saveIngredients, 
  initializeDb,
  syncWithBackend,
  getExpenses,
  getWastage,
  getStoreSettings,
  subscribeToDbChanges
} from "./utils/db";
import { Product, Ingredient, Sale, User, Expense, Wastage } from "./types";
import { Clock, AlertTriangle, Menu } from "lucide-react";

export default function App() {
  // Session User Authentication state with localStorage persistence
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("bfc_pos_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Initialize and load database states immediately from cache
  const [products, setProducts] = useState<Product[]>(() => {
    initializeDb();
    return getProducts();
  });
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => getIngredients());
  const [sales, setSales] = useState<Sale[]>(() => getSales());
  const [expenses, setExpenses] = useState<Expense[]>(() => getExpenses());
  const [wastages, setWastages] = useState<Wastage[]>(() => getWastage());
  
  // Navigation states with localStorage persistence
  const [currentTab, setCurrentTabState] = useState<string>(() => {
    const saved = localStorage.getItem("bfc_pos_tab");
    return saved || "dashboard";
  });
  
  const setCurrentTab = (tab: string) => {
    setCurrentTabState(tab);
    localStorage.setItem("bfc_pos_tab", tab);
  };

  const handleSetUser = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem("bfc_pos_user", JSON.stringify(newUser));
      // Save default tab based on user role if not already customized
      if (!localStorage.getItem("bfc_pos_tab")) {
        const defaultTab = newUser.role === "kasir" ? "pos" : "dashboard";
        setCurrentTabState(defaultTab);
        localStorage.setItem("bfc_pos_tab", defaultTab);
      }
    } else {
      localStorage.removeItem("bfc_pos_user");
      localStorage.removeItem("bfc_pos_tab");
    }
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Store information state
  const [storeSettings, setStoreSettings] = useState(getStoreSettings());

  // Clock state
  const [liveTime, setLiveTime] = useState<Date>(new Date());

  // First-time database boot, sync with backend, and loading
  useEffect(() => {
    initializeDb();
    syncWithBackend();
  }, []);

  // Operational real-time live clock ticking
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for centralized database cache updates (live realtime events)
  useEffect(() => {
    const unsubscribe = subscribeToDbChanges(() => {
      refreshDbStates();
    });
    return unsubscribe;
  }, []);

  // Periodic automatic sync with Firebase Firestore (every 1 second for seamless multiplayer)
  useEffect(() => {
    if (!user) return;
    const syncInterval = setInterval(() => {
      syncWithBackend();
    }, 1000);
    return () => clearInterval(syncInterval);
  }, [user]);

  // Sync in-memory states to React to trigger component re-renders
  const refreshDbStates = () => {
    setProducts([...getProducts()]);
    setIngredients([...getIngredients()]);
    setSales([...getSales()]);
    setExpenses([...getExpenses()]);
    setWastages([...getWastage()]);
    setStoreSettings({ ...getStoreSettings() });
  };

  // Low Stock Notification list
  const lowStockIngredients = ingredients.filter(ing => ing.stock <= ing.minStock);

  // Handler to update finished products list
  const handleSaveProducts = (updatedProducts: Product[]) => {
    saveProducts(updatedProducts);
    refreshDbStates();
  };

  // Handler to update raw ingredients list
  const handleSaveIngredients = (updatedIngredients: Ingredient[]) => {
    saveIngredients(updatedIngredients);
    refreshDbStates();
  };

  // Format real-time operational clock in Indonesian
  const formatLiveDateTime = (date: Date) => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const dayName = days[date.getDay()];
    const dateNum = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();
    
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    return `${dayName}, ${dateNum} ${monthName} ${year} • ${hours}:${minutes}:${seconds}`;
  };

  // Helper to dynamically render views
  const renderActiveView = () => {
    if (!user) return null;

    switch (currentTab) {
      case "dashboard":
        return (
          <DashboardView
            sales={sales}
            products={products}
            ingredients={ingredients}
            onNavigateToPOS={() => setCurrentTab("pos")}
            onNavigateToIngredients={() => setCurrentTab("ingredients")}
          />
        );
      case "pos":
        return (
          <PosView
            products={products}
            ingredients={ingredients}
            cashierName={user.name}
            onSaleComplete={refreshDbStates}
          />
        );
      case "menu":
        return (
          <MenuView
            products={products}
            ingredients={ingredients}
            onSaveProducts={handleSaveProducts}
          />
        );
      case "ingredients":
        return (
          <IngredientsView
            ingredients={ingredients}
            onSaveIngredients={handleSaveIngredients}
          />
        );
      case "finance":
        return (
          <FinanceView
            sales={sales}
            products={products}
            ingredients={ingredients}
            expenses={expenses}
            wastages={wastages}
            onFinanceUpdate={refreshDbStates}
          />
        );
      case "sales":
        return (
          <SalesHistoryView
            sales={sales}
            products={products}
            ingredients={ingredients}
            onSalesUpdate={refreshDbStates}
          />
        );
      case "settings":
        return <SettingsView onSettingsUpdate={() => setStoreSettings(getStoreSettings())} />;
      default:
        return (
          <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center text-stone-500">
            Halaman tidak ditemukan.
          </div>
        );
    }
  };

  // Guard: if user is not authenticated, render Login Page
  if (!user) {
    return <LoginView onLoginSuccess={(u) => {
      handleSetUser(u);
      // Auto redirect based on primary role tasks
      if (u.role === "kasir") {
        setCurrentTab("pos");
      } else {
        setCurrentTab("dashboard");
      }
    }} />;
  }

  return (
    <div id="app-root-layout" className="flex bg-bento-bg min-h-screen text-bento-text font-sans">
      
      {/* Mobile Sidebar Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Dynamic Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        ingredients={ingredients}
        user={user}
        onLogout={() => handleSetUser(null)}
        storeName={storeSettings.storeName}
        storeTagline={storeSettings.storeTagline}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Workspace Frame container */}
      <main id="main-workspace" className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        
        {/* Top Operational bar info */}
        <header id="workspace-header" className="bg-white/60 backdrop-blur-md border-b border-bento-border/50 px-4 sm:px-8 py-4 flex justify-between items-center gap-3 shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            {/* Hamburger Menu Trigger for mobile */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2.5 rounded-xl text-bento-text hover:bg-stone-100 transition-colors cursor-pointer border border-bento-border/60 shadow-xs bg-white flex items-center justify-center shrink-0"
              title="Buka Menu"
            >
              <Menu className="w-5 h-5 text-bento-maroon" />
            </button>
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-bento-red bg-bento-light-orange px-2.5 py-1 rounded-full border border-bento-border/60 shadow-xs">
                SISTEM AKTIF • ROLE: {user.role.toUpperCase()}
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60 shadow-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                FIREBASE TERKONEKSI (REALTIME)
              </span>
            </div>
          </div>

          {/* Operational live clock */}
          <div className="flex items-center gap-2 text-bento-text-muted bg-white/80 px-3.5 py-1.5 rounded-xl border border-bento-border text-xs font-bold font-mono shadow-sm">
            <Clock className="w-4 h-4 text-bento-orange shrink-0 animate-pulse" />
            <span id="live-clock" className="hidden sm:inline">{formatLiveDateTime(liveTime)}</span>
            <span id="live-clock-mobile" className="sm:hidden">{liveTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </header>

        {/* Global Low Stock Notification Alert Banner */}
        {lowStockIngredients.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-900 text-xs font-bold shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping shrink-0"></span>
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="text-center sm:text-left">
                Peringatan Stok Kritis: Ada {lowStockIngredients.length} bahan baku yang menipis!
              </span>
            </div>
            <button 
              onClick={() => setCurrentTab("ingredients")} 
              className="px-3 py-1 bg-bento-orange text-white text-[10px] font-black rounded-lg hover:bg-bento-orange-hover transition-colors cursor-pointer uppercase tracking-wider shadow-xs"
            >
              Kelola Stok / Belanja
            </button>
          </div>
        )}

        {/* Scrollable Canvas for views */}
        <section id="workspace-scrollable-content" className="flex-1 overflow-y-auto p-4 sm:p-8">
          {renderActiveView()}
        </section>

      </main>
    </div>
  );
}
