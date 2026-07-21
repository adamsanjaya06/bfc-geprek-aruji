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
  syncWithBackend
} from "./utils/db";
import { Product, Ingredient, Sale, User } from "./types";
import { Clock, AlertTriangle } from "lucide-react";

export default function App() {
  // Session User Authentication state
  const [user, setUser] = useState<User | null>(null);

  // Initialize and load database states
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  
  // Navigation states
  const [currentTab, setCurrentTab] = useState<string>("dashboard");

  // Clock state
  const [liveTime, setLiveTime] = useState<Date>(new Date());

  // First-time database boot, sync with backend, and loading
  useEffect(() => {
    initializeDb();
    syncWithBackend().then(() => {
      refreshDbStates();
    });
  }, []);

  // Operational real-time live clock ticking
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync state from LocalStorage database
  const refreshDbStates = () => {
    setProducts(getProducts());
    setIngredients(getIngredients());
    setSales(getSales());
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
          <FinanceView />
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
        return <SettingsView />;
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
      setUser(u);
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
      
      {/* Dynamic Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        ingredients={ingredients}
        user={user}
        onLogout={() => setUser(null)}
      />

      {/* Main Workspace Frame container */}
      <main id="main-workspace" className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Operational bar info */}
        <header id="workspace-header" className="bg-white/60 backdrop-blur-md border-b border-bento-border/50 px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0 shadow-xs">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-bento-red bg-bento-light-orange px-2.5 py-1 rounded-full border border-bento-border/60 shadow-xs">
              SISTEM AKTIF • ROLE: {user.role.toUpperCase()}
            </span>
          </div>

          {/* Operational live clock */}
          <div className="flex items-center gap-2 text-bento-text-muted bg-white/80 px-3.5 py-1.5 rounded-xl border border-bento-border text-xs font-bold font-mono shadow-sm">
            <Clock className="w-4 h-4 text-bento-orange shrink-0 animate-pulse" />
            <span id="live-clock">{formatLiveDateTime(liveTime)}</span>
          </div>
        </header>

        {/* Global Low Stock Notification Alert Banner */}
        {lowStockIngredients.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-900 text-xs font-bold shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>
                Peringatan Stok Kritis: Ada {lowStockIngredients.length} bahan baku (
                {lowStockIngredients.slice(0, 3).map(i => i.name).join(", ")}
                {lowStockIngredients.length > 3 ? "..." : ""}) yang menipis di bawah batas minimum!
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
        <section id="workspace-scrollable-content" className="flex-1 overflow-y-auto p-8">
          {renderActiveView()}
        </section>

      </main>
    </div>
  );
}
