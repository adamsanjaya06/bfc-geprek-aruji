/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Search, 
  Calendar, 
  Printer, 
  DollarSign, 
  Tag, 
  User, 
  ShoppingBag, 
  Eye, 
  TrendingUp, 
  X, 
  Filter, 
  Percent, 
  FileText,
  Edit3,
  Trash2,
  CheckCircle2
} from "lucide-react";
import { Sale, Product, Ingredient } from "../types";
import { calculateProductCOGS, getSales, saveSales, getIngredients, saveIngredients, getStoreSettings } from "../utils/db";

interface SalesHistoryViewProps {
  sales: Sale[];
  products: Product[];
  ingredients: Ingredient[];
  onSalesUpdate?: () => void;
}

type TimeRange = "today" | "week" | "month" | "all";

export default function SalesHistoryView({ 
  sales, 
  products, 
  ingredients,
  onSalesUpdate
}: SalesHistoryViewProps) {
  // State variables for filter controls
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCashier, setSelectedCashier] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("today");
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<Sale | null>(null);

  // States for Editing a Transaction
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editCashier, setEditCashier] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editPayment, setEditPayment] = useState(0);

  // Delete handler with inventory recovery
  const handleDeleteSale = (saleToDelete: Sale) => {
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus transaksi invoice ${saleToDelete.invoiceNumber}?\nTindakan ini juga akan secara otomatis mengembalikan stok bahan baku ke gudang!`
    );
    if (!confirmDelete) return;

    try {
      // 1. Get current sales list
      const currentSales = getSales();
      const updatedSales = currentSales.filter((s) => s.id !== saleToDelete.id);

      // 2. Restore stocks of ingredients
      const currentIngredients = getIngredients();
      const updatedIngredients = currentIngredients.map((ing) => {
        let newStock = ing.stock;
        for (const item of saleToDelete.items) {
          const prod = products.find((p) => p.id === item.productId);
          if (prod) {
            const recipeItem = prod.recipe.find((r) => r.ingredientId === ing.id);
            if (recipeItem) {
              newStock += recipeItem.quantityNeeded * item.quantity;
            }
          }
        }
        return { ...ing, stock: Math.round(newStock * 1000) / 1000 };
      });

      // 3. Save to localStorage
      saveSales(updatedSales);
      saveIngredients(updatedIngredients);

      // 4. Trigger UI update
      if (onSalesUpdate) {
        onSalesUpdate();
      }

      alert(`Transaksi ${saleToDelete.invoiceNumber} berhasil dihapus dan persediaan bahan baku telah dipulihkan!`);
    } catch (error) {
      console.error("Gagal menghapus transaksi:", error);
      alert("Terjadi kesalahan saat menghapus transaksi.");
    }
  };

  // Edit action handlers
  const handleStartEdit = (sale: Sale) => {
    setEditingSale(sale);
    setEditCashier(sale.cashierName);
    setEditDate(new Date(sale.date).toISOString().slice(0, 16)); // Format for datetime-local
    setEditPayment(sale.paymentAmount);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;

    try {
      const currentSales = getSales();
      const updatedSales = currentSales.map((s) => {
        if (s.id === editingSale.id) {
          const change = editPayment - s.total;
          return {
            ...s,
            cashierName: editCashier,
            date: new Date(editDate).toISOString(),
            paymentAmount: editPayment,
            changeAmount: change >= 0 ? change : 0,
          };
        }
        return s;
      });

      saveSales(updatedSales);

      if (onSalesUpdate) {
        onSalesUpdate();
      }

      setEditingSale(null);
      alert("Detail transaksi berhasil diperbarui!");
    } catch (error) {
      console.error("Gagal menyimpan edit:", error);
      alert("Terjadi kesalahan saat memperbarui detail transaksi.");
    }
  };

  // Reprint Receipt helper
  const handleReprintReceipt = (sale: Sale) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Struk Pembayaran ChickenPOS</title>
          <style>
            body {
              font-family: monospace;
              padding: 20px;
              color: #292524;
              font-size: 11px;
              width: 250px;
              margin: 0 auto;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .border-b { border-bottom: 1px dashed #78716c; padding-bottom: 6px; margin-bottom: 6px; }
            .flex { display: flex; justify-content: space-between; }
            .mt-1 { margin-top: 4px; }
            .mt-2 { margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="text-center border-b">
            <h3 style="margin: 0 0 4px 0; font-size: 14px;">${getStoreSettings().storeName.toUpperCase()}</h3>
            <p style="margin: 0; font-size: 9px; color: #44403c;">${getStoreSettings().storeTagline}</p>
            <p style="margin: 2px 0 0 0; font-size: 8px; color: #78716c;">${getStoreSettings().storeAddress}</p>
            ${getStoreSettings().storePhone ? `<p style="margin: 1px 0 0 0; font-size: 8px; color: #78716c;">Telp: ${getStoreSettings().storePhone}</p>` : ""}
          </div>

          <div class="border-b" style="font-size: 9px;">
            <div>Invoice: ${sale.invoiceNumber}</div>
            <div>Tanggal: ${new Date(sale.date).toLocaleString("id-ID")}</div>
            <div>Kasir  : ${sale.cashierName || "Kasir Utama"}</div>
          </div>

          <div class="border-b">
            ${sale.items.map(item => `
              <div style="margin-bottom: 6px;">
                <div class="font-bold">${item.productName}</div>
                <div class="flex" style="font-size: 9px; color: #44403c;">
                   <span>${item.quantity} x ${formatIDR(item.price)}</span>
                   <span>${formatIDR(item.subtotal)}</span>
                </div>
              </div>
            `).join("")}
          </div>

          <div class="border-b">
            <div class="flex">
              <span>Subtotal:</span>
              <span>${formatIDR(sale.subtotal)}</span>
            </div>
            <div class="flex font-bold" style="font-size: 12px; margin-top: 4px;">
              <span>TOTAL:</span>
              <span>${formatIDR(sale.total)}</span>
            </div>
          </div>

          <div class="border-b" style="font-size: 9px;">
            <div class="flex">
              <span>Tunai:</span>
              <span>${formatIDR(sale.paymentAmount)}</span>
            </div>
            <div class="flex">
              <span>Kembali:</span>
              <span>${formatIDR(sale.changeAmount)}</span>
            </div>
          </div>

          <div class="text-center mt-2" style="font-size: 8px; color: #78716c;">
            <p style="margin: 0;">Terima Kasih atas Kunjungan Anda!</p>
            <p style="margin: 2px 0 0 0;">Struk dicetak ulang sah.</p>
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

  // Helper: check if date is today
  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  };

  // Helper: check if date is within 7 days
  const isLast7Days = (dateStr: string) => {
    const d = new Date(dateStr);
    const diff = Math.abs(new Date().getTime() - d.getTime());
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days <= 7;
  };

  // Helper: check if date is within 30 days
  const isThisMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  // Filter cashier list based on active/inactive ones
  const availableCashiers = Array.from(new Set(sales.map(s => s.cashierName))).filter(Boolean);

  // Filter categories available
  const availableCategories = ["Paket Ayam", "Ala Carte", "Minuman"];

  // Filter sales
  const filteredSales = sales.filter(sale => {
    // 1. Time Range filter
    if (timeRange === "today" && !isToday(sale.date)) return false;
    if (timeRange === "week" && !isLast7Days(sale.date)) return false;
    if (timeRange === "month" && !isThisMonth(sale.date)) return false;

    // 2. Search filter (invoice or cashier name or item names)
    const matchesSearch = 
      sale.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.cashierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;

    // 4. Category filter (checks if sale contains at least one item from selected category)
    if (selectedCategory !== "all") {
      const hasCategoryItem = sale.items.some(item => {
        const prod = products.find(p => p.id === item.productId);
        return prod?.category === selectedCategory;
      });
      if (!hasCategoryItem) return false;
    }

    return true;
  });

  // Calculate totals for currently filtered sales
  let totalOmzet = 0;
  let totalHPP = 0;
  let totalPorsi = 0;

  filteredSales.forEach(sale => {
    totalOmzet += sale.total;
    sale.items.forEach(item => {
      // Filter count based on active category
      const prod = products.find(p => p.id === item.productId);
      if (selectedCategory === "all" || prod?.category === selectedCategory) {
        totalPorsi += item.quantity;
      }

      // Calculate exact HPP (COGS)
      if (prod) {
        const cogs = calculateProductCOGS(prod, ingredients);
        totalHPP += cogs * item.quantity;
      } else {
        totalHPP += (item.price * 0.5) * item.quantity;
      }
    });
  });

  const totalLabaBersih = totalOmzet - totalHPP;
  const labaMargin = totalOmzet > 0 ? (totalLabaBersih / totalOmzet) * 100 : 0;
  const averageTransaction = filteredSales.length > 0 ? totalOmzet / filteredSales.length : 0;

  // Formatting Rupiah (IDR) helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Printing engine for the filtered receipt report
  const handlePrintSalesReport = () => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Laporan Penjualan ChickenPOS</title>
          <style>
            body {
              font-family: monospace;
              padding: 25px;
              color: #292524;
              background-color: #fff;
              font-size: 11px;
            }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #a8a29e; padding-bottom: 12px; }
            .header h2 { margin: 0 0 4px 0; font-size: 16px; color: #7f1d1d; }
            .header p { margin: 2px 0; font-size: 10px; color: #44403c; }
            .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; background: #fffbeb; padding: 12px; border: 1px solid #fef3c7; border-radius: 8px; }
            .meta-title { font-weight: bold; font-size: 12px; color: #78350f; border-bottom: 1px solid #fde68a; padding-bottom: 4px; margin-bottom: 6px; grid-column: span 2; }
            .meta-item { display: flex; justify-content: space-between; padding: 3px 0; }
            .meta-val { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { border-bottom: 2px solid #78716c; padding: 6px 4px; text-align: left; font-weight: bold; }
            td { padding: 8px 4px; border-bottom: 1px solid #e7e5e4; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .footer-info { margin-top: 30px; text-align: center; color: #78716c; font-size: 9px; border-top: 1px dashed #a8a29e; padding-top: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${getStoreSettings().storeName.toUpperCase()} - LAPORAN RIWAYAT PENJUALAN</h2>
            <p>${getStoreSettings().storeTagline} - ${getStoreSettings().storeAddress}</p>
            ${getStoreSettings().storePhone ? `<p>Hubungi: ${getStoreSettings().storePhone}</p>` : ""}
            <p>Tanggal Cetak: ${new Date().toLocaleString("id-ID")}</p>
            <p>Rentang Filter: ${timeRange.toUpperCase()} | Kategori: ${selectedCategory.toUpperCase()}</p>
          </div>

          <div class="meta-grid">
            <div class="meta-title">Ringkasan Keuangan Hasil Filter</div>
            <div class="meta-item"><span>Total Omzet Penjualan:</span><span class="meta-val">${formatIDR(totalOmzet)}</span></div>
            <div class="meta-item"><span>Total Porsi Terjual:</span><span class="meta-val">${totalPorsi} porsi</span></div>
            <div class="meta-item"><span>Jumlah Transaksi:</span><span class="meta-val">${filteredSales.length} Nota</span></div>
          </div>

          <h4 style="margin: 15px 0 5px 0; color: #7f1d1d; font-size: 11px;">DAFTAR NOTA PENJUALAN</h4>
          <table>
            <thead>
              <tr>
                <th>No. Invoice</th>
                <th>Tanggal</th>
                <th>Kasir</th>
                <th>Item Terjual</th>
                <th class="text-right">Total Transaksi</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSales.map(sale => `
                <tr>
                  <td class="font-bold">${sale.invoiceNumber}</td>
                  <td>${new Date(sale.date).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td>${sale.cashierName}</td>
                  <td>
                    ${sale.items.map(i => `${i.productName} (x${i.quantity})`).join(", ")}
                  </td>
                  <td class="text-right font-bold">${formatIDR(sale.total)}</td>
                </tr>
              `).join("")}
              <tr style="border-top: 2px solid #78716c; background-color: #fafaf9;">
                <td colspan="4" class="font-bold text-right" style="padding: 10px 4px;">TOTAL OMZET FILTERED:</td>
                <td class="text-right font-bold" style="padding: 10px 4px; font-size: 12px; color: #7f1d1d;">${formatIDR(totalOmzet)}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer-info">
            Sistem POS ChickenPOS • Laporan ini dicetak secara sah dan otomatis dari database sistem.
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Title & Filter Header Panel */}
      <div className="bg-white p-6 rounded-2xl border border-bento-border shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-bento-border pb-4 mb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-bento-header tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-7 h-7 text-bento-orange" />
              Menu Laporan Penjualan (Sales History)
            </h2>
            <p className="text-sm text-bento-text-muted mt-0.5">
              Analisis riwayat nota transaksi kasir lengkap dengan perhitungan modal, margin, dan keuntungan bersih.
            </p>
          </div>

          <button
            onClick={handlePrintSalesReport}
            className="px-4 py-2 bg-bento-orange hover:bg-bento-orange-hover text-white font-black text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-orange-950/10 self-start md:self-center"
          >
            <Printer className="w-4 h-4" />
            Cetak Laporan Penjualan
          </button>
        </div>

        {/* Filter Toolbar Bento (Dropdown menu, Dropdown category, and Rentang Waktu) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Search Box */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-bento-text-muted uppercase tracking-wider block">Cari Transaksi</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-bento-text-muted">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="No. Invoice, nama menu..."
                className="w-full pl-9 pr-4 py-2 bg-bento-light-yellow/20 border border-bento-border rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-bento-orange placeholder-stone-400 bg-white"
              />
            </div>
          </div>

          {/* Dropdown Kategori */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-bento-text-muted uppercase tracking-wider block">Dropdown Kategori Menu</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-bento-text-muted">
                <Tag className="w-4 h-4" />
              </span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-bento-light-yellow/20 border border-bento-border rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-bento-orange bg-white"
              >
                <option value="all">-- Semua Kategori Menu --</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Rentang Waktu Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-bento-text-muted uppercase tracking-wider block">Rentang Waktu</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-bento-text-muted">
                <Calendar className="w-4 h-4" />
              </span>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="w-full pl-9 pr-4 py-2.5 bg-bento-light-yellow/20 border border-bento-border rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-bento-orange bg-white"
              >
                <option value="all">Semua Riwayat Waktu</option>
                <option value="today">Hari Ini Saja</option>
                <option value="week">7 Hari Terakhir</option>
                <option value="month">Bulan Ini</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Metrics Bento Panel - Two-Row Layout */}
      <div className="space-y-4">
        {/* Row 1: Revenue, COGS, and Profit */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {/* Total Omzet */}
          <div className="bg-white p-6 rounded-2xl border border-bento-border shadow-md flex flex-col justify-between hover:shadow-lg transition-all duration-300">
            <div>
              <p className="text-[10px] font-bold text-bento-text-muted uppercase tracking-wider">Total Penerimaan (Omzet)</p>
              <h4 className="text-xl sm:text-2xl font-black text-bento-text mt-1.5 select-all">{formatIDR(totalOmzet)}</h4>
            </div>
            <span className="text-[10px] text-stone-400 font-bold mt-3 pt-2 border-t border-stone-100">Sesuai total nilai filtered nota</span>
          </div>

          {/* Estimasi HPP */}
          <div className="bg-white p-6 rounded-2xl border border-bento-border shadow-md flex flex-col justify-between hover:shadow-lg transition-all duration-300">
            <div>
              <p className="text-[10px] font-bold text-bento-text-muted uppercase tracking-wider">Modal Bahan Baku (HPP)</p>
              <h4 className="text-xl sm:text-2xl font-black text-bento-text mt-1.5 select-all">{formatIDR(totalHPP)}</h4>
            </div>
            <span className="text-[10px] text-stone-400 font-bold mt-3 pt-2 border-t border-stone-100">Dihitung dari modal resep menu</span>
          </div>

          {/* Laba Bersih */}
          <div className="bg-white p-6 rounded-2xl border border-bento-border shadow-md flex flex-col justify-between hover:shadow-lg transition-all duration-300">
            <div>
              <p className="text-[10px] font-bold text-bento-text-muted uppercase tracking-wider">Laba Bersih Kotor (Est.)</p>
              <h4 className="text-xl sm:text-2xl font-black text-emerald-700 mt-1.5 select-all">{formatIDR(totalLabaBersih)}</h4>
            </div>
            <span className="text-[10px] text-emerald-600 font-bold mt-3 pt-2 border-t border-emerald-50 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Margin Keuntungan: {labaMargin.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Row 2: Operational counts and AOV */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {/* Average Order Value */}
          <div className="bg-white p-6 rounded-2xl border border-bento-border shadow-md flex flex-col justify-between hover:shadow-lg transition-all duration-300">
            <div>
              <p className="text-[10px] font-bold text-bento-text-muted uppercase tracking-wider">Rata-rata Pembelian (AOV)</p>
              <h4 className="text-xl sm:text-2xl font-black text-bento-text mt-1.5 select-all">{formatIDR(averageTransaction)}</h4>
            </div>
            <span className="text-[10px] text-stone-400 font-bold mt-3 pt-2 border-t border-stone-100">Rata-rata transaksi per nota belanja</span>
          </div>

          {/* Total Quantity */}
          <div className="bg-white p-6 rounded-2xl border border-bento-border shadow-md flex flex-col justify-between hover:shadow-lg transition-all duration-300">
            <div>
              <p className="text-[10px] font-bold text-bento-text-muted uppercase tracking-wider">Porsi Menu Terjual</p>
              <h4 className="text-xl sm:text-2xl font-black text-bento-orange mt-1.5">{totalPorsi} porsi</h4>
            </div>
            <span className="text-[10px] text-stone-400 font-bold mt-3 pt-2 border-t border-stone-100 font-medium">Dari {filteredSales.length} total nota transaksi kasir</span>
          </div>
        </div>
      </div>

      {/* Main Transactions List Table */}
      <div className="bg-white rounded-2xl border border-bento-border shadow-md overflow-hidden">
        <div className="p-4 bg-bento-light-yellow border-b border-bento-border/60 flex justify-between items-center">
          <h3 className="font-extrabold text-bento-header text-xs uppercase tracking-wider">Daftar Transaksi Kasir Terkait ({filteredSales.length})</h3>
          <span className="text-[10px] font-bold text-bento-text-muted bg-white px-2 py-1 rounded border border-bento-border/40">
            Urutan: Terbaru di Atas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bento-light-yellow/40 border-b border-bento-border/50 text-bento-text-muted font-bold text-xs uppercase tracking-wider">
                <th className="p-4 pl-6">No. Invoice</th>
                <th className="p-4">Tanggal & Waktu</th>
                <th className="p-4">Nama Kasir</th>
                <th className="p-4">Daftar Menu Makanan / Minuman</th>
                <th className="p-4 text-right">HPP Modal</th>
                <th className="p-4 text-right">Nilai Total Transaksi</th>
                <th className="p-4 pr-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bento-border/30 text-bento-text bg-white text-xs">
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => {
                  // Calculate local COGS for this invoice
                  let saleCOGS = 0;
                  sale.items.forEach(item => {
                    const prod = products.find(p => p.id === item.productId);
                    if (prod) {
                      saleCOGS += calculateProductCOGS(prod, ingredients) * item.quantity;
                    } else {
                      saleCOGS += (item.price * 0.5) * item.quantity;
                    }
                  });

                  return (
                    <tr key={sale.id} className="hover:bg-bento-light-yellow/10 transition-colors">
                      {/* Invoice */}
                      <td className="p-4 pl-6 font-black text-bento-text">
                        {sale.invoiceNumber}
                      </td>

                      {/* Date */}
                      <td className="p-4 text-bento-text-muted font-semibold">
                        {new Date(sale.date).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short"
                        })}
                      </td>

                      {/* Cashier Name */}
                      <td className="p-4 font-bold text-bento-text-muted">
                        {sale.cashierName || "Kasir Utama"}
                      </td>

                      {/* Purchased items list summary */}
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {sale.items.map((it, idx) => (
                            <span key={idx} className="bg-bento-light-yellow border border-bento-border/50 px-2 py-0.5 rounded text-[10px] font-bold text-bento-text">
                              {it.productName} (x{it.quantity})
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Individual HPP */}
                      <td className="p-4 text-right font-bold text-stone-500">
                        {formatIDR(saleCOGS)}
                      </td>

                      {/* Sale total */}
                      <td className="p-4 text-right font-black text-bento-text">
                        {formatIDR(sale.total)}
                      </td>

                      {/* Action buttons */}
                      <td className="p-4 pr-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedSaleDetail(sale)}
                            className="p-1.5 bg-bento-light-yellow hover:bg-bento-light-orange border border-bento-border/50 text-bento-text rounded-lg transition-colors inline-flex items-center gap-1 font-bold text-[10px] cursor-pointer"
                            title="Lihat Detail Nota"
                          >
                            <Eye className="w-3.5 h-3.5 text-bento-orange" />
                            Detail
                          </button>
                          <button
                            onClick={() => handleStartEdit(sale)}
                            className="p-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 rounded-lg transition-colors inline-flex items-center gap-1 font-bold text-[10px] cursor-pointer"
                            title="Edit Transaksi"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSale(sale)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg transition-colors inline-flex items-center gap-1 font-bold text-[10px] cursor-pointer"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-bento-text-muted font-bold italic bg-white">
                    Tidak ditemukan riwayat transaksi penjualan yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* HIDDEN ELEMENT USED FOR REPORT PRINT PREPARATION */}
      <div id="printable-sales-report" className="hidden">
        {/* Simple table layout used in printing */}
        {filteredSales.map(s => s.invoiceNumber).join(", ")}
      </div>

      {/* FLOATING DETAIL MODAL POPUP */}
      {selectedSaleDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-bento-border shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-bento-light-yellow p-4 border-b border-bento-border flex justify-between items-center">
              <div>
                <h4 className="font-extrabold text-bento-header text-sm">STRUK NOTA TRANSAKSI</h4>
                <p className="text-[10px] text-bento-text-muted font-bold">{selectedSaleDetail.invoiceNumber}</p>
              </div>
              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Receipt Body */}
            <div className="p-6 space-y-4 font-mono text-xs text-bento-text">
              <div className="text-center border-b border-dashed border-bento-border pb-3">
                <p className="font-extrabold text-sm text-bento-maroon uppercase">{getStoreSettings().storeName}</p>
                <p className="text-[10px] text-bento-text-muted mt-1 uppercase">{getStoreSettings().storeTagline}</p>
                <p className="text-[9px] text-stone-400 mt-0.5">
                  {new Date(selectedSaleDetail.date).toLocaleString("id-ID")}
                </p>
              </div>

              {/* Items List */}
              <div className="space-y-2.5 pb-3 border-b border-dashed border-bento-border">
                {selectedSaleDetail.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <div>
                      <p className="font-bold">{item.productName}</p>
                      <p className="text-[10px] text-bento-text-muted font-semibold mt-0.5">
                        {item.quantity} x {formatIDR(item.price)}
                      </p>
                    </div>
                    <span className="font-bold">{formatIDR(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Cash payment calculations */}
              <div className="space-y-1.5 border-b border-dashed border-bento-border pb-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatIDR(selectedSaleDetail.subtotal)}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-bento-maroon pt-1">
                  <span>TOTAL AKHIR:</span>
                  <span>{formatIDR(selectedSaleDetail.total)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-bento-text-muted font-semibold">
                  <span>Uang Bayar (Cash):</span>
                  <span>{formatIDR(selectedSaleDetail.paymentAmount)}</span>
                </div>
                <div className="flex justify-between text-bento-text-muted font-semibold">
                  <span>Uang Kembali:</span>
                  <span>{formatIDR(selectedSaleDetail.changeAmount)}</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-stone-400 font-bold pt-2">
                <p>KASIR: {selectedSaleDetail.cashierName || "Kasir Utama"}</p>
                <p className="mt-1 font-semibold italic text-[9px]">Terima Kasih atas Kunjungan Anda!</p>
              </div>
            </div>

            {/* Close & Reprint Button Footer */}
            <div className="p-4 bg-stone-50 border-t border-bento-border flex gap-3">
              <button
                onClick={() => handleReprintReceipt(selectedSaleDetail)}
                className="flex-1 py-2.5 bg-bento-orange hover:bg-bento-orange-hover text-white rounded-xl font-bold text-xs cursor-pointer text-center transition-all flex items-center justify-center gap-1.5 shadow"
              >
                <Printer className="w-4 h-4" />
                Cetak Ulang Struk
              </button>
              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="flex-1 py-2.5 bg-bento-light-yellow hover:bg-bento-light-orange border border-bento-border rounded-xl font-bold text-xs cursor-pointer text-center text-bento-text transition-all"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING EDIT MODAL POPUP */}
      {editingSale && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-bento-border shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-bento-light-yellow p-4 border-b border-bento-border flex justify-between items-center">
              <div>
                <h4 className="font-extrabold text-bento-header text-sm">EDIT DETAIL TRANSAKSI</h4>
                <p className="text-[10px] text-bento-text-muted font-bold">{editingSale.invoiceNumber}</p>
              </div>
              <button
                onClick={() => setEditingSale(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 font-sans text-xs text-bento-text">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-bento-text block">Nama Kasir</label>
                <input
                  type="text"
                  value={editCashier}
                  onChange={(e) => setEditCashier(e.target.value)}
                  className="w-full px-3 py-2 bg-bento-light-yellow/20 border border-bento-border rounded-xl focus:outline-none focus:ring-1 focus:ring-bento-orange text-xs font-bold bg-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-bento-text block">Tanggal & Waktu Transaksi</label>
                <input
                  type="datetime-local"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 bg-bento-light-yellow/20 border border-bento-border rounded-xl focus:outline-none focus:ring-1 focus:ring-bento-orange text-xs font-bold bg-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-bento-text block">Uang Tunai Diterima (Bayar)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-bento-text-muted font-bold text-[10px]">Rp</span>
                  <input
                    type="number"
                    value={editPayment}
                    onChange={(e) => setEditPayment(Number(e.target.value))}
                    min={editingSale.total}
                    className="w-full pl-8 pr-3 py-2 bg-bento-light-yellow/20 border border-bento-border rounded-xl focus:outline-none focus:ring-1 focus:ring-bento-orange text-xs font-bold bg-white"
                    required
                  />
                </div>
                <p className="text-[10px] text-stone-400 font-semibold mt-1">
                  Minimal Rp {editingSale.total.toLocaleString("id-ID")} (Sesuai total belanja)
                </p>
              </div>

              <div className="p-3 bg-stone-50 border border-bento-border/50 rounded-xl space-y-2">
                <div className="flex justify-between font-bold text-stone-600">
                  <span>Total Belanja:</span>
                  <span>{formatIDR(editingSale.total)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Estimasi Uang Kembali:</span>
                  <span>{formatIDR(Math.max(0, editPayment - editingSale.total))}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSale(null)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-xl font-bold text-xs cursor-pointer text-center text-stone-600 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-bento-orange hover:bg-bento-orange-hover text-white rounded-xl font-bold text-xs cursor-pointer text-center transition-all shadow shadow-orange-950/15"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
