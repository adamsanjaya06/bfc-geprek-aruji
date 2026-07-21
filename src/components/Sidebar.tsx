/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Drumstick, 
  LayoutDashboard, 
  ShoppingCart, 
  Utensils, 
  Package, 
  User,
  AlertTriangle,
  Database,
  LogOut,
  Coins,
  ShoppingBag,
  Settings
} from "lucide-react";
import { Ingredient, User as UserType } from "../types";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  ingredients: Ingredient[];
  user: UserType;
  onLogout: () => void;
}

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  ingredients, 
  user,
  onLogout 
}: SidebarProps) {
  // Check how many ingredients are below their minimum stock
  const lowStockCount = ingredients.filter(ing => ing.stock <= ing.minStock).length;

  // Build navigation items based on user role permissions
  const menuItems: { id: string; label: string; icon: any; badge?: number }[] = [];

  const isAdminOrOwner = user.role === "superadmin" || user.role === "owner";

  if (isAdminOrOwner) {
    menuItems.push({ id: "dashboard", label: "Dashboard", icon: LayoutDashboard });
  }

  if (user.role === "superadmin" || user.role === "kasir") {
    menuItems.push({ id: "pos", label: "Kasir (POS)", icon: ShoppingCart });
  }

  if (isAdminOrOwner) {
    menuItems.push({ id: "menu", label: "Manajemen Menu", icon: Utensils });
    menuItems.push({ 
      id: "ingredients", 
      label: "Bahan Baku", 
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : undefined 
    });
    menuItems.push({ id: "sales", label: "Riwayat Penjualan", icon: ShoppingBag });
    menuItems.push({ id: "finance", label: "Keuangan & Laporan", icon: Coins });
    menuItems.push({ id: "settings", label: "Pengaturan", icon: Settings });
  }

  return (
    <aside id="sidebar-nav" className="w-64 bg-bento-maroon text-white flex flex-col justify-between h-screen sticky top-0 border-r border-bento-border/20 shadow-xl">
      <div>
        {/* Brand Logo Header */}
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="bg-bento-gold text-bento-maroon p-2.5 rounded-xl shadow-lg font-black text-xl flex items-center justify-center">
            <Drumstick className="w-6 h-6 text-bento-maroon" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white leading-tight">BFC Geprek Aruji</h1>
            <p className="text-[11px] text-bento-gold font-medium">Berkah Fried Chicken</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-left font-semibold text-sm group ${
                  isActive
                    ? "bg-bento-orange text-white shadow-md shadow-orange-950/30"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <IconComponent className={`w-5 h-5 transition-transform group-hover:scale-105 ${isActive ? "text-white" : "text-white/60 group-hover:text-white"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="flex items-center gap-1 bg-bento-gold text-bento-maroon text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Cashier profile & configuration */}
      <div className="p-4 border-t border-white/10 bg-black/10 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-bento-gold/20 border border-bento-gold/30 flex items-center justify-center text-bento-gold font-bold">
            <User className="w-4 h-4 text-bento-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] text-bento-gold/70 font-black uppercase tracking-wider">{user.role}</p>
            <p className="text-xs font-bold text-white truncate" title={user.name}>
              {user.name}
            </p>
          </div>
        </div>

        <button
          id="logout-btn"
          onClick={onLogout}
          className="w-full py-2 bg-white/5 hover:bg-bento-red text-white hover:text-white border border-white/10 hover:border-bento-red rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-bento-gold" />
          Keluar (Logout)
        </button>

        <p className="text-[9px] text-white/30 text-center font-bold">
          Sistem POS BFC Geprek Aruji v1.2 • Bento Grid
        </p>
      </div>
    </aside>
  );
}
