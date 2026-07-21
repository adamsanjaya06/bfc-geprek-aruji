/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Percent, 
  AlertOctagon, 
  Calendar, 
  ArrowUpRight, 
  CheckCircle, 
  PackageMinus 
} from "lucide-react";
import { Product, Ingredient, Sale } from "../types";
import { calculateProductCOGS } from "../utils/db";

interface DashboardViewProps {
  sales: Sale[];
  products: Product[];
  ingredients: Ingredient[];
  onNavigateToPOS: () => void;
  onNavigateToIngredients: () => void;
}

type TimeRange = "today" | "week" | "all";

export default function DashboardView({ 
  sales, 
  products, 
  ingredients, 
  onNavigateToPOS,
  onNavigateToIngredients 
}: DashboardViewProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("today");

  // Helper to check if a date string belongs to today
  const isToday = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // Helper to check if a date string belongs to the last 7 days
  const isLast7Days = (dateStr: string) => {
    const date = new Date(dateStr);
    const diffTime = Math.abs(new Date().getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  // Filter sales based on time range
  const filteredSales = sales.filter(sale => {
    if (timeRange === "today") return isToday(sale.date);
    if (timeRange === "week") return isLast7Days(sale.date);
    return true; // "all"
  });

  // Calculate stats
  let totalOmzet = 0; // Total actual paid (including tax)
  let totalSubtotal = 0; // Total sales before tax
  let totalTax = 0;
  let totalCOGS = 0;
  let totalItemsCount = 0;

  filteredSales.forEach(sale => {
    totalOmzet += sale.total;
    totalSubtotal += sale.subtotal;
    totalTax += sale.tax;

    sale.items.forEach(item => {
      totalItemsCount += item.quantity;
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const cogs = calculateProductCOGS(product, ingredients);
        totalCOGS += cogs * item.quantity;
      } else {
        // Fallback: estimate COGS as 50% of price
        totalCOGS += (item.price * 0.5) * item.quantity;
      }
    });
  });

  const totalLaba = totalSubtotal - totalCOGS;
  const labaMarginPercent = totalSubtotal > 0 ? (totalLaba / totalSubtotal) * 100 : 0;

  // Format currency in Rupiah (IDR)
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Helper to format currency in short form
  const formatShortIDR = (num: number) => {
    if (num === 0) return "Rp 0";
    if (num >= 1000000) {
      return `Rp ${(num / 1000000).toFixed(1)}jt`;
    } else if (num >= 1000) {
      return `Rp ${(num / 1000).toFixed(0)}rb`;
    }
    return `Rp ${num}`;
  };

  // Get low stock ingredients
  const lowStockIngredients = ingredients.filter(ing => ing.stock <= ing.minStock);

  // Calculate best selling products
  const productSalesMap: Record<string, { name: string; quantity: number; revenue: number; image: string }> = {};
  
  // Initialize with all products
  products.forEach(p => {
    productSalesMap[p.id] = { name: p.name, quantity: 0, revenue: 0, image: p.image };
  });

  // Accumulate quantities and revenue
  filteredSales.forEach(sale => {
    sale.items.forEach(item => {
      if (productSalesMap[item.productId]) {
        productSalesMap[item.productId].quantity += item.quantity;
        productSalesMap[item.productId].revenue += item.subtotal;
      }
    });
  });

  const bestSellers = Object.values(productSalesMap)
    .filter(item => item.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Generate data for the 7-day revenue chart
  const get7DayChartData = () => {
    const data: { dayName: string; dateLabel: string; revenue: number }[] = [];
    const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];
      const dateLabel = `${date.getDate()}/${date.getMonth() + 1}`;
      
      // Sum up revenue for this specific calendar day
      const dayRevenue = sales
        .filter(sale => {
          const saleDate = new Date(sale.date);
          return saleDate.getDate() === date.getDate() &&
                 saleDate.getMonth() === date.getMonth() &&
                 saleDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, sale) => sum + sale.total, 0);

      data.push({
        dayName,
        dateLabel,
        revenue: dayRevenue,
      });
    }
    return data;
  };

  const chartData = get7DayChartData();
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 100000); // Avoid divide by zero

  return (
    <div className="space-y-6">
      {/* Page Title & Time Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-bento-border shadow-md">
        <div>
          <h2 className="text-2xl font-extrabold text-bento-header tracking-tight">Ringkasan Toko</h2>
          <p className="text-sm text-bento-text-muted">Pantau omzet, laba kotor, dan ketersediaan bahan baku ayam krispi Anda.</p>
        </div>
        
        {/* Time Filter Buttons */}
        <div className="flex items-center gap-1 bg-bento-light-yellow p-1.5 rounded-xl border border-bento-border">
          <button
            id="time-filter-today"
            onClick={() => setTimeRange("today")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              timeRange === "today"
                ? "bg-bento-orange text-white shadow-xs"
                : "text-bento-text-muted hover:text-bento-text"
            }`}
          >
            Hari Ini
          </button>
          <button
            id="time-filter-week"
            onClick={() => setTimeRange("week")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              timeRange === "week"
                ? "bg-bento-orange text-white shadow-xs"
                : "text-bento-text-muted hover:text-bento-text"
            }`}
          >
            7 Hari Terakhir
          </button>
          <button
            id="time-filter-all"
            onClick={() => setTimeRange("all")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              timeRange === "all"
                ? "bg-bento-orange text-white shadow-xs"
                : "text-bento-text-muted hover:text-bento-text"
            }`}
          >
            Semua Waktu
          </button>
        </div>
      </div>

      {/* Main Metric Cards - Two-Row Layout */}
      <div className="space-y-4">
        {/* Row 1: Primary Financial metrics (Omzet & Laba) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {/* Omzet Card */}
          <div id="metric-card-omzet" className="bg-white p-6 rounded-2xl border border-bento-border shadow-md relative overflow-hidden group hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-bento-orange/5 rounded-full -mr-6 -mt-6 transition-all group-hover:scale-110"></div>
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1 mr-2">
                <p className="text-[10px] font-bold text-bento-text-muted uppercase tracking-wider">Total Omzet Penjualan</p>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-bento-text mt-2 tracking-tight select-all" title={formatIDR(totalOmzet)}>{formatIDR(totalOmzet)}</h3>
              </div>
              <div className="bg-bento-light-orange text-bento-orange-hover p-2.5 rounded-xl border border-bento-border/50 shrink-0">
                <TrendingUp className="w-5.5 h-5.5" />
              </div>
            </div>
            <p className="text-[11px] text-bento-text-muted mt-4 flex items-center gap-1 font-medium">
              Total penerimaan kotor dari transaksi kasir valid
            </p>
          </div>

          {/* Laba Bersih Card */}
          <div id="metric-card-laba" className="bg-white p-6 rounded-2xl border border-bento-border shadow-md relative overflow-hidden group hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-6 -mt-6 transition-all group-hover:scale-110"></div>
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1 mr-2">
                <p className="text-[10px] font-bold text-bento-text-muted uppercase tracking-wider">Laba Bersih Bersih (Est.)</p>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-700 mt-2 tracking-tight select-all" title={formatIDR(totalLaba)}>{formatIDR(totalLaba)}</h3>
              </div>
              <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-xl border border-emerald-100 shrink-0">
                <DollarSign className="w-5.5 h-5.5" />
              </div>
            </div>
            <p className="text-[11px] text-bento-text-muted mt-4 flex items-center gap-1 font-medium">
              Dihitung dari <span className="font-semibold text-bento-text">Omzet - Modal Bahan Baku resep</span>
            </p>
          </div>
        </div>

        {/* Row 2: Secondary operational metrics (Total Transaksi & Margin) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {/* Transaksi Card */}
          <div id="metric-card-transaksi" className="bg-white p-6 rounded-2xl border border-bento-border shadow-md relative overflow-hidden group hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-bento-gold/5 rounded-full -mr-6 -mt-6 transition-all group-hover:scale-110"></div>
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1 mr-2">
                <p className="text-[10px] font-bold text-bento-text-muted uppercase tracking-wider">Total Transaksi Selesai</p>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-bento-text mt-2 tracking-tight select-all" title={`${filteredSales.length} Nota`}>{filteredSales.length} Nota</h3>
              </div>
              <div className="bg-bento-light-yellow text-bento-orange-hover p-2.5 rounded-xl border border-bento-border shrink-0">
                <ShoppingBag className="w-5.5 h-5.5" />
              </div>
            </div>
            <p className="text-[11px] text-bento-text-muted mt-4 font-medium">
              Terjual sebanyak <span className="font-extrabold text-bento-text">{totalItemsCount}</span> porsi menu kuliner
            </p>
          </div>

          {/* Margin Laba Card */}
          <div id="metric-card-margin" className="bg-white p-6 rounded-2xl border border-bento-border shadow-md relative overflow-hidden group hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-bento-orange/5 rounded-full -mr-6 -mt-6 transition-all group-hover:scale-110"></div>
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1 mr-2">
                <p className="text-[10px] font-bold text-bento-text-muted uppercase tracking-wider">Rasio Margin Keuntungan</p>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-bento-orange mt-2 tracking-tight select-all">
                  {labaMarginPercent.toFixed(1)}%
                </h3>
              </div>
              <div className="bg-bento-light-accent text-bento-orange p-2.5 rounded-xl border border-bento-border/50 shrink-0">
                <Percent className="w-5.5 h-5.5" />
              </div>
            </div>
            <p className="text-[11px] text-bento-text-muted mt-4 font-medium">
              Persentase laba bersih kotor terhadap nilai pokok bahan baku
            </p>
          </div>
        </div>
      </div>

      {/* Charts & Secondary Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 7-Day Revenue Chart (Custom CSS SVG-like Bars with permanent values) */}
        <div className="bg-white p-6 rounded-2xl border border-bento-border shadow-md lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="font-extrabold text-bento-header text-base">Grafik Penjualan Harian</h4>
                <p className="text-xs text-bento-text-muted">Omzet 7 Hari Terakhir</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-bento-text-muted bg-bento-light-yellow px-2.5 py-1 rounded-lg border border-bento-border font-bold">
                <Calendar className="w-3.5 h-3.5 text-bento-orange" />
                Real-time Tracker
              </span>
            </div>

            {/* Bar Chart Graphics */}
            <div className="h-64 flex items-end justify-between gap-2 pt-8 px-2 relative">
              {/* Backing Horizontal Guidelines */}
              <div className="absolute inset-x-0 top-8 bottom-0 flex flex-col justify-between pointer-events-none opacity-40">
                <div className="border-b border-dashed border-stone-200 w-full h-0"></div>
                <div className="border-b border-dashed border-stone-200 w-full h-0"></div>
                <div className="border-b border-dashed border-stone-200 w-full h-0"></div>
                <div className="border-b border-dashed border-stone-200 w-full h-0"></div>
              </div>

              {chartData.map((d, index) => {
                const heightPercent = `${(d.revenue / Math.max(maxRevenue, 1)) * 100}%`;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center group h-full justify-end relative z-1">
                    {/* Permanent Sales Value directly inside chart above the bar */}
                    <div className="text-[9px] sm:text-[10px] font-black text-bento-maroon mb-1 text-center whitespace-nowrap bg-bento-light-yellow/80 px-1 rounded shadow-xs">
                      {formatShortIDR(d.revenue)}
                    </div>
                    
                    {/* Tooltip on Hover */}
                    <div className="opacity-0 group-hover:opacity-100 absolute transform -translate-y-16 bg-bento-text text-white text-[10px] px-2.5 py-1 rounded-lg font-bold pointer-events-none transition-all duration-200 z-10 shadow-lg border border-bento-border">
                      {formatIDR(d.revenue)}
                    </div>

                    {/* Bar Body */}
                    <div 
                      className="w-full bg-bento-light-orange hover:bg-bento-orange rounded-t-lg transition-all duration-300 relative group-hover:shadow-md cursor-pointer flex items-end justify-center"
                      style={{ height: heightPercent, minHeight: d.revenue > 0 ? "8px" : "2px" }}
                    >
                      <div className="w-full h-1 bg-bento-orange-hover opacity-0 group-hover:opacity-100 rounded-t-lg transition-opacity"></div>
                    </div>
                    {/* Date & Day Label */}
                    <p className="text-[10px] font-extrabold text-bento-text mt-2">{d.dayName}</p>
                    <p className="text-[9px] text-bento-text-muted font-bold">{d.dateLabel}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Low Stock Checklist / Warning Panel */}
        <div className="bg-white p-6 rounded-2xl border border-bento-border shadow-md flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-extrabold text-bento-header text-base">Kontrol Bahan Baku</h4>
                <p className="text-xs text-bento-text-muted">Butuh segera di-restock</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${
                lowStockIngredients.length > 0 
                  ? "bg-bento-light-orange text-bento-red border-bento-border animate-pulse" 
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}>
                {lowStockIngredients.length > 0 ? "Peringatan!" : "Aman"}
              </span>
            </div>

            {/* List of Warnings */}
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {lowStockIngredients.length > 0 ? (
                lowStockIngredients.map(ing => (
                  <div key={ing.id} className="flex items-center justify-between p-3 rounded-xl bg-bento-light-accent border border-bento-border">
                    <div className="flex items-center gap-3">
                      <div className="bg-bento-light-orange text-bento-orange-hover p-1.5 rounded-lg border border-bento-border/50">
                        <AlertOctagon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-bento-text">{ing.name}</p>
                        <p className="text-[10px] text-bento-text-muted font-semibold">Min: {ing.minStock} {ing.unit}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-bento-red">{ing.stock} {ing.unit}</p>
                      <p className="text-[9px] text-bento-text-muted font-bold">Stok kritis</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="bg-emerald-50 text-emerald-700 p-4 rounded-full mb-3 border border-emerald-100">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h5 className="text-sm font-bold text-bento-text">Semua Bahan Baku Cukup</h5>
                  <p className="text-xs text-bento-text-muted mt-1 max-w-[200px] font-medium">Semua stok bahan di dapur di atas batas minimum.</p>
                </div>
              )}
            </div>
          </div>

          <button
            id="dashboard-restock-btn"
            onClick={onNavigateToIngredients}
            className="w-full mt-4 bg-bento-light-yellow hover:bg-bento-light-orange text-bento-text font-bold text-xs py-2.5 rounded-xl border border-bento-border flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-xs active:scale-[0.99]"
          >
            <PackageMinus className="w-4 h-4 text-bento-orange" />
            Kelola Stok & Belanja Bahan
          </button>
        </div>
      </div>

      {/* Bottom Row: Top Products Leaders & Quick Action banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Best Selling Products */}
        <div className="bg-white p-6 rounded-2xl border border-bento-border shadow-md lg:col-span-2">
          <h4 className="font-extrabold text-bento-header text-base mb-4">5 Menu Terlaris</h4>
          <div className="divide-y divide-bento-light-orange/30">
            {bestSellers.length > 0 ? (
              bestSellers.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    {/* Rank Badge */}
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? "bg-bento-gold text-bento-maroon shadow-xs" :
                      index === 1 ? "bg-bento-light-orange text-bento-text border border-bento-border/50" :
                      index === 2 ? "bg-bento-light-accent text-bento-text-muted border border-bento-border/50" : "bg-bento-light-yellow text-bento-text-muted/70 border border-bento-border/35"
                    }`}>
                      {index + 1}
                    </span>
                    {/* Product Image */}
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-10 h-10 object-cover rounded-lg border border-bento-border"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="text-sm font-bold text-bento-text">{item.name}</p>
                      <p className="text-xs text-bento-text-muted font-semibold">{item.quantity} porsi terjual</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-bento-text">{formatIDR(item.revenue)}</p>
                    <p className="text-[10px] text-bento-text-muted font-semibold">Total Omzet Menu</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-bento-text-muted py-6 text-center italic font-medium">Belum ada transaksi penjualan yang tercatat.</p>
            )}
          </div>
        </div>

        {/* Quick Cashier Launcher Banner */}
        <div className="bg-gradient-to-br from-bento-maroon to-bento-orange text-white p-6 rounded-2xl shadow-lg flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-8 -mt-8"></div>
          <div>
            <h4 className="font-extrabold text-lg leading-tight text-white">Siap Melayani Pelanggan?</h4>
            <p className="text-xs text-bento-light-yellow mt-2 max-w-[200px] leading-relaxed">
              Buka layar Kasir untuk mencatat orderan paha crispy hangat dan paket geprek hot Anda.
            </p>
          </div>
          <button
            id="dashboard-open-pos-btn"
            onClick={onNavigateToPOS}
            className="w-full mt-6 bg-bento-gold hover:bg-white text-bento-maroon font-black text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98]"
          >
            Buka Kasir POS Sekarang
            <ArrowUpRight className="w-4 h-4 text-bento-maroon" />
          </button>
        </div>
      </div>
    </div>
  );
}
