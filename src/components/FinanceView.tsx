/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Filter, 
  Sparkles, 
  AlertCircle, 
  FileText,
  Clock,
  Printer,
  ChevronRight
} from "lucide-react";
import { Sale, Expense, Wastage, Ingredient, Product } from "../types";
import { 
  getExpenses, 
  saveExpenses, 
  getWastage, 
  getSales, 
  getProducts, 
  getIngredients, 
  calculateProductCOGS 
} from "../utils/db";
import { getStoreSettings } from "./SettingsView";

interface FinanceViewProps {
  sales: Sale[];
  products: Product[];
  ingredients: Ingredient[];
  expenses: Expense[];
  wastages: Wastage[];
  onFinanceUpdate: () => void;
}

export default function FinanceView({
  sales,
  products,
  ingredients,
  expenses,
  wastages,
  onFinanceUpdate,
}: FinanceViewProps) {
  // Expenses Form states
  const [expDescription, setExpDescription] = useState("");
  const [expCategory, setExpCategory] = useState<Expense["category"]>("listrik");
  const [expAmount, setExpAmount] = useState<number | "">("");
  const [expDate, setExpDate] = useState(new Date().toISOString().split("T")[0]);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month" | "all">("today");
  const [expenseSearch, setExpenseSearch] = useState("");
  const [expenseFilterCategory, setExpenseFilterCategory] = useState<string>("Semua");

  // Helper: Format Rupiah (IDR)
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Helper to filter entries based on selected time range
  const isWithinTimeRange = (dateStr: string) => {
    const itemDate = new Date(dateStr);
    const now = new Date();
    
    if (timeRange === "today") {
      return itemDate.getDate() === now.getDate() &&
             itemDate.getMonth() === now.getMonth() &&
             itemDate.getFullYear() === now.getFullYear();
    }
    
    if (timeRange === "week") {
      const diffTime = Math.abs(now.getTime() - itemDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    
    if (timeRange === "month") {
      return itemDate.getMonth() === now.getMonth() &&
             itemDate.getFullYear() === now.getFullYear();
    }
    
    return true; // "all"
  };

  // Filter lists based on time range
  const filteredSales = sales.filter(s => isWithinTimeRange(s.date));
  const filteredExpenses = expenses.filter(e => isWithinTimeRange(e.date));
  const filteredWastages = wastages.filter(w => isWithinTimeRange(w.date));

  // Compute metrics
  let totalOmzet = 0;
  let totalCOGS = 0; // HPP (Modal Bahan Baku Terjual)

  filteredSales.forEach(sale => {
    totalOmzet += sale.total;
    
    sale.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const cogsUnit = calculateProductCOGS(product, ingredients);
        totalCOGS += cogsUnit * item.quantity;
      } else {
        totalCOGS += (item.price * 0.5) * item.quantity; // Fallback
      }
    });
  });

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalWastageLoss = filteredWastages.reduce((sum, w) => sum + w.totalCost, 0);
  const netProfit = totalOmzet - totalCOGS - totalExpenses - totalWastageLoss;

  // Add a new expense
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!expDescription.trim()) {
      setErrorMsg("Keterangan pengeluaran tidak boleh kosong.");
      return;
    }
    if (expAmount === "" || Number(expAmount) <= 0) {
      setErrorMsg("Jumlah nominal pengeluaran harus di atas Rp 0.");
      return;
    }

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      date: new Date(expDate).toISOString(),
      description: expDescription.trim(),
      category: expCategory,
      amount: Number(expAmount),
    };

    const updatedExpenses = [newExpense, ...expenses];
    saveExpenses(updatedExpenses);
    onFinanceUpdate();

    // Reset Form
    setExpDescription("");
    setExpAmount("");
    setExpDate(new Date().toISOString().split("T")[0]);
    setSuccessMsg("Pengeluaran operasional berhasil dicatat!");
    
    // Auto clear success message after 3 seconds
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  // Delete an expense
  const handleDeleteExpense = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus catatan pengeluaran ini?")) {
      const updatedExpenses = expenses.filter(e => e.id !== id);
      saveExpenses(updatedExpenses);
      onFinanceUpdate();
    }
  };

  // Beautiful clean printing inside an iframe-compatible hidden document
  const handlePrint = () => {
    const printContents = document.getElementById("printable-laporan-rugi")?.innerHTML;
    if (!printContents) return;

    // Create temporary print container
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
          <title>Laporan Laba Rugi ChickenPOS</title>
          <style>
            body {
              font-family: monospace;
              padding: 30px;
              color: #1c1917;
              background-color: #fff;
            }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .font-bold { font-weight: bold; }
            .font-black { font-weight: 900; }
            .text-sm { font-size: 14px; }
            .text-xs { font-size: 12px; }
            .p-3 { padding: 12px; }
            .p-4 { padding: 16px; }
            .pl-8 { padding-left: 32px; }
            .border-b { border-bottom: 1px solid #e0c097; }
            .border-t { border-top: 1px solid #e0c097; }
            .border-double { border-top: 3px double #3e2723; border-bottom: 3px double #3e2723; }
            .divide-y > * + * { border-top: 1px solid #e0c097; }
            .uppercase { text-transform: uppercase; }
            .text-emerald-700 { color: #047857 !important; font-weight: bold; }
            .text-bento-red { color: #c62828 !important; }
            .text-orange-600 { color: #ea580c !important; }
            .max-w-3xl { max-w: 48rem; margin: 0 auto; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .border { border: 1px solid #e0c097; }
            .rounded-xl { border-radius: 12px; }
            .overflow-hidden { overflow: hidden; }
            .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #e0c097; padding-bottom: 15px; }
            .header h1 { margin: 0 0 5px 0; font-size: 20px; color: #8b0000; }
            .header p { margin: 3px 0; font-size: 11px; color: #8d6e63; font-weight: bold; }
            
            /* Enhanced Tailwind Mappings for Printable Iframe */
            [class*="bg-stone-50"] { background-color: #fafaf9 !important; }
            [class*="bg-bento-light-accent"] { background-color: #fffbeb !important; }
            [class*="bg-bento-light-orange"] { background-color: #fef3c7 !important; }
            [class*="bg-red-50"] { background-color: #fef2f2 !important; }
            [class*="bg-emerald-50"] { background-color: #ecfdf5 !important; }
            [class*="border-bento-border"] { border-color: #e0c097 !important; }
            [class*="divide-stone-100"] > * + * { border-top: 1px solid #f5f5f4 !important; }
            [class*="text-emerald-700"] { color: #047857 !important; }
            [class*="text-bento-red"] { color: #c62828 !important; }
            [class*="text-orange-600"] { color: #ea580c !important; }
            [class*="text-emerald-800"] { color: #065f46 !important; }
            [class*="text-red-800"] { color: #991b1b !important; }
            [class*="border-dashed"] { border-style: dashed !important; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${getStoreSettings().storeName.toUpperCase()} - LAPORAN LABA RUGI</h1>
            <p>${getStoreSettings().storeTagline} - ${getStoreSettings().storeAddress}</p>
            <p>Tanggal Cetak: ${new Date().toLocaleString("id-ID")}</p>
            <p>Periode: ${timeRange === "all" ? "Semua Catatan" : "Filter " + timeRange.toUpperCase()}</p>
          </div>
          <div class="max-w-3xl">
            ${printContents}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Focus and execute print directly from parent window to ensure absolute compatibility and reliability
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

  // Filter Expense History List
  const displayedExpenses = filteredExpenses.filter(e => {
    const matchesSearch = e.description.toLowerCase().includes(expenseSearch.toLowerCase());
    const matchesCategory = expenseFilterCategory === "Semua" || e.category === expenseFilterCategory;
    return matchesSearch && matchesCategory;
  });

  // Category labels and styles
  const categoryMeta: Record<string, { label: string; bg: string; text: string }> = {
    listrik: { label: "Listrik / PLN", bg: "bg-blue-50", text: "text-blue-700" },
    gas: { label: "Gas & LPG", bg: "bg-orange-50", text: "text-orange-700" },
    gaji: { label: "Gaji Karyawan", bg: "bg-purple-50", text: "text-purple-700" },
    bahan: { label: "Belanja Bahan", bg: "bg-amber-50", text: "text-amber-700" },
    lainnya: { label: "Biaya Lainnya", bg: "bg-stone-50", text: "text-stone-700" },
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Time Range Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-bento-border shadow-md">
        <div>
          <h2 className="text-2xl font-extrabold text-bento-header tracking-tight">Laporan & Keuangan</h2>
          <p className="text-sm text-bento-text-muted">Kelola pengeluaran operasional, hitung HPP modal, dan pantau laba bersih berkala.</p>
        </div>

        {/* Range Buttons */}
        <div className="flex items-center gap-1 bg-bento-light-yellow p-1.5 rounded-xl border border-bento-border">
          {[
            { id: "today", label: "Hari Ini" },
            { id: "week", label: "7 Hari Ini" },
            { id: "month", label: "Bulan Ini" },
            { id: "all", label: "Semua Waktu" }
          ].map((range) => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id as any)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                timeRange === range.id
                  ? "bg-bento-orange text-white shadow-xs"
                  : "text-bento-text-muted hover:text-bento-text"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Financial Metrics Cards (Bento Grid) - Split into two spacious rows */}
      <div className="space-y-4">
        {/* Row 1: Revenue and COGS (2 cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {/* Omzet Card */}
          <div className="bg-white p-6 rounded-2xl border border-bento-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-bento-text-muted">1. Pendapatan Omzet</span>
              <h3 className="text-xl sm:text-2xl font-black text-bento-text mt-2">{formatIDR(totalOmzet)}</h3>
            </div>
            <div className="flex items-center gap-1.5 mt-4 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg w-max border border-emerald-100">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Kasir POS Otomatis
            </div>
          </div>

          {/* HPP Card */}
          <div className="bg-white p-6 rounded-2xl border border-bento-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-bento-text-muted">2. Modal Bahan (HPP)</span>
              <h3 className="text-xl sm:text-2xl font-black text-stone-700 mt-2">{formatIDR(totalCOGS)}</h3>
            </div>
            <p className="text-[10px] text-bento-text-muted mt-4 font-semibold border-t border-stone-100 pt-2">
              Bahan terpakai dari resep porsi terjual
            </p>
          </div>
        </div>

        {/* Row 2: Operational, Wastage, Separated Net Profit and Net Loss (4 cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Expenses Card */}
          <div className="bg-white p-6 rounded-2xl border border-bento-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-bento-text-muted">3. Operasional</span>
              <h3 className="text-xl font-extrabold text-bento-red mt-2">{formatIDR(totalExpenses)}</h3>
            </div>
            <p className="text-[10px] text-bento-text-muted mt-4 font-semibold border-t border-stone-100 pt-2">
              Listrik, gas, gaji karyawan (input manual)
            </p>
          </div>

          {/* Wastage Loss Card */}
          <div className="bg-white p-6 rounded-2xl border border-bento-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-bento-text-muted">4. Kerugian Wastage</span>
              <h3 className="text-xl font-extrabold text-orange-600 mt-2">{formatIDR(totalWastageLoss)}</h3>
            </div>
            <p className="text-[10px] text-bento-text-muted mt-4 font-semibold border-t border-stone-100 pt-2">
              Nilai pokok bahan dibuang / rusak
            </p>
          </div>

          {/* Separated Net Profit Card */}
          <div className={`p-6 rounded-2xl border flex flex-col justify-between transition-all duration-300 ${
            netProfit >= 0 
              ? "bg-emerald-50/80 border-emerald-200 shadow-md" 
              : "bg-stone-50/30 border-stone-200 text-stone-400 opacity-50"
          }`}>
            <div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${
                netProfit >= 0 ? "text-emerald-800" : "text-stone-500"
              }`}>5. Keterangan Laba Bersih</span>
              <h3 className={`text-xl font-black mt-2 ${
                netProfit >= 0 ? "text-emerald-700" : "text-stone-400"
              }`}>
                {netProfit >= 0 ? formatIDR(netProfit) : "Rp 0"}
              </h3>
            </div>
            <div className="mt-4">
              {netProfit >= 0 ? (
                <span className="text-[9px] font-black text-emerald-800 uppercase bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg">PROFIT POSITIF</span>
              ) : (
                <span className="text-[9px] font-bold text-stone-400 uppercase bg-stone-100 px-2 py-1 rounded-lg">NIHIL / MERUGI</span>
              )}
            </div>
          </div>

          {/* Separated Net Loss Card */}
          <div className={`p-6 rounded-2xl border flex flex-col justify-between transition-all duration-300 ${
            netProfit < 0 
              ? "bg-red-50/80 border-red-200 shadow-md" 
              : "bg-stone-50/30 border-stone-200 text-stone-400 opacity-50"
          }`}>
            <div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${
                netProfit < 0 ? "text-red-800" : "text-stone-500"
              }`}>6. Keterangan Rugi Bersih</span>
              <h3 className={`text-xl font-black mt-2 ${
                netProfit < 0 ? "text-red-700" : "text-stone-400"
              }`}>
                {netProfit < 0 ? formatIDR(Math.abs(netProfit)) : "Rp 0"}
              </h3>
            </div>
            <div className="mt-4">
              {netProfit < 0 ? (
                <span className="text-[9px] font-black text-red-800 uppercase bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg">TERJADI KERUGIAN</span>
              ) : (
                <span className="text-[9px] font-bold text-stone-400 uppercase bg-stone-100 px-2 py-1 rounded-lg">NIHIL / BEBAS RUGI</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profit & Loss Statement (Laporan Laba Rugi) */}
      <div className="bg-white p-6 rounded-2xl border border-bento-border shadow-md">
        <div className="flex justify-between items-center border-b border-bento-border pb-4 mb-4">
          <div>
            <h4 className="font-extrabold text-bento-header text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-bento-orange" />
              Laporan Ikhtisar Laba Rugi
            </h4>
            <p className="text-xs text-bento-text-muted">Periode: {timeRange === "all" ? "Semua Catatan" : `Filter ${timeRange.toUpperCase()}`}</p>
          </div>
          
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-bento-light-yellow hover:bg-bento-light-orange border border-bento-border text-bento-text font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-bento-orange" />
            Cetak Laporan
          </button>
        </div>

        <div id="printable-laporan-rugi" className="max-w-3xl mx-auto border border-bento-border rounded-xl overflow-hidden font-mono text-xs text-bento-text">
          {/* Header */}
          <div className="bg-bento-light-accent p-3 border-b border-bento-border flex justify-between font-extrabold">
            <span>Uraian Akun</span>
            <span>Nilai Rupiah</span>
          </div>
          
          {/* Revenue */}
          <div className="divide-y divide-stone-100">
            <div className="p-3 flex justify-between font-bold bg-stone-50/50">
              <span className="flex items-center gap-1">1. PENDAPATAN</span>
              <span></span>
            </div>
            <div className="p-3 pl-8 flex justify-between">
              <span>Pendapatan Omzet Penjualan (Kasir)</span>
              <span className="text-emerald-700 font-bold">{formatIDR(totalOmzet)}</span>
            </div>
            
            {/* Direct Expenses (COGS) */}
            <div className="p-3 flex justify-between font-bold bg-stone-50/50">
              <span>2. BEBAN POKOK PENJUALAN</span>
              <span></span>
            </div>
            <div className="p-3 pl-8 flex justify-between text-stone-600">
              <span>Harga Pokok Penjualan (HPP Bahan Baku)</span>
              <span>({formatIDR(totalCOGS)})</span>
            </div>

            <div className="p-3 pl-8 flex justify-between font-bold bg-bento-light-orange/10 border-t border-b border-dashed border-bento-border/50 text-bento-text">
              <span>Laba Kotor Penjualan (Omzet - HPP)</span>
              <span>{formatIDR(totalOmzet - totalCOGS)}</span>
            </div>

            {/* Operating Expenses */}
            <div className="p-3 flex justify-between font-bold bg-stone-50/50">
              <span>3. BEBAN OPERASIONAL & KERUSAKAN</span>
              <span></span>
            </div>
            <div className="p-3 pl-8 flex justify-between text-bento-red">
              <span>Beban Listrik & Utilitas</span>
              <span>({formatIDR(filteredExpenses.filter(e => e.category === "listrik").reduce((sum, e) => sum + e.amount, 0))})</span>
            </div>
            <div className="p-3 pl-8 flex justify-between text-bento-red">
              <span>Beban Gas Elpiji & Dapur</span>
              <span>({formatIDR(filteredExpenses.filter(e => e.category === "gas").reduce((sum, e) => sum + e.amount, 0))})</span>
            </div>
            <div className="p-3 pl-8 flex justify-between text-bento-red">
              <span>Beban Gaji Karyawan</span>
              <span>({formatIDR(filteredExpenses.filter(e => e.category === "gaji").reduce((sum, e) => sum + e.amount, 0))})</span>
            </div>
            <div className="p-3 pl-8 flex justify-between text-bento-red">
              <span>Beban Belanja Bahan Operasional</span>
              <span>({formatIDR(filteredExpenses.filter(e => e.category === "bahan").reduce((sum, e) => sum + e.amount, 0))})</span>
            </div>
            <div className="p-3 pl-8 flex justify-between text-bento-red">
              <span>Beban Lain-lain</span>
              <span>({formatIDR(filteredExpenses.filter(e => e.category === "lainnya").reduce((sum, e) => sum + e.amount, 0))})</span>
            </div>
            <div className="p-3 pl-8 flex justify-between text-orange-600">
              <span>Kerugian Bahan Terbuang (Wastage & Basi)</span>
              <span>({formatIDR(totalWastageLoss)})</span>
            </div>

            <div className="p-3 pl-8 flex justify-between font-bold text-bento-red border-t border-b border-stone-100 bg-red-50/20">
              <span>Total Beban Operasional & Kerugian</span>
              <span>({formatIDR(totalExpenses + totalWastageLoss)})</span>
            </div>

            {/* Net Income */}
            <div className={`p-4 flex justify-between font-black text-sm border-t border-double border-bento-border ${
              netProfit >= 0 ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
            }`}>
              <span className="uppercase">LABA BERSIH (NET INCOME)</span>
              <span>{formatIDR(netProfit)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row: Add Expenses Form & Expenses History List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Input Manual Expenses Form */}
        <div className="bg-white p-6 rounded-2xl border border-bento-border shadow-md">
          <div className="mb-4">
            <h4 className="font-extrabold text-bento-header text-base flex items-center gap-2">
              <Coins className="w-5 h-5 text-bento-orange" />
              Input Pengeluaran Operasional
            </h4>
            <p className="text-xs text-bento-text-muted">Masukkan rincian biaya pengeluaran toko secara manual.</p>
          </div>

          <form onSubmit={handleAddExpense} className="space-y-4">
            {/* Expense Date input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-bento-text block">Tanggal Pengeluaran</label>
              <input
                type="date"
                required
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
                className="w-full px-3 py-2 bg-bento-light-yellow/20 border border-bento-border rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-bento-orange"
              />
            </div>

            {/* Category selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-bento-text block">Kategori Biaya</label>
              <select
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-bento-light-yellow/20 border border-bento-border rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-bento-orange"
              >
                <option value="listrik">Listrik / PLN / Utilitas</option>
                <option value="gas">Gas & Elpiji Masak</option>
                <option value="gaji">Gaji Karyawan Toko</option>
                <option value="bahan">Belanja Bahan Tambahan</option>
                <option value="lainnya">Lainnya / Lain-lain</option>
              </select>
            </div>

            {/* Description input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-bento-text block">Keterangan / Deskripsi</label>
              <input
                type="text"
                required
                placeholder="Contoh: Beli Token Listrik 200rb"
                value={expDescription}
                onChange={(e) => setExpDescription(e.target.value)}
                className="w-full px-3 py-2 bg-bento-light-yellow/20 border border-bento-border rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-bento-orange"
              />
            </div>

            {/* Amount input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-bento-text block">Nominal Biaya (Rp)</label>
              <input
                type="number"
                required
                placeholder="Nominal rupiah..."
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 bg-bento-light-yellow/20 border border-bento-border rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-bento-orange"
              />
            </div>

            {/* Form alerts feedback */}
            {errorMsg && (
              <div className="p-3 bg-red-50 text-bento-red text-xs font-semibold rounded-xl border border-red-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-bento-red shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              className="w-full py-2.5 bg-bento-orange hover:bg-bento-orange-hover text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Simpan Pengeluaran
            </button>
          </form>
        </div>

        {/* Expenses list logs */}
        <div className="bg-white p-6 rounded-2xl border border-bento-border shadow-md lg:col-span-2 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h4 className="font-extrabold text-bento-header text-base">Daftar Pengeluaran Toko</h4>
                <p className="text-xs text-bento-text-muted">Riwayat pengeluaran yang dicatat manual.</p>
              </div>

              {/* Filters for Category */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={expenseFilterCategory}
                  onChange={(e) => setExpenseFilterCategory(e.target.value)}
                  className="px-2.5 py-1.5 bg-bento-light-yellow border border-bento-border rounded-xl text-[10px] font-bold text-bento-text focus:outline-none"
                >
                  <option value="Semua">Semua Kategori</option>
                  <option value="listrik">Listrik</option>
                  <option value="gas">Gas LPG</option>
                  <option value="gaji">Gaji</option>
                  <option value="bahan">Belanja Bahan</option>
                  <option value="lainnya">Lainnya</option>
                </select>
                
                <input
                  type="text"
                  placeholder="Cari..."
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  className="px-2.5 py-1.5 bg-bento-light-yellow border border-bento-border rounded-xl text-[10px] font-bold text-bento-text focus:outline-none placeholder-bento-text-muted/60 w-24 sm:w-32"
                />
              </div>
            </div>

            {/* List */}
            <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1">
              {displayedExpenses.length > 0 ? (
                displayedExpenses.map(exp => (
                  <div key={exp.id} className="flex items-center justify-between p-3 bg-bento-light-accent border border-bento-border rounded-xl hover:border-bento-orange/40 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg text-xs font-bold border shrink-0 ${categoryMeta[exp.category].bg} ${categoryMeta[exp.category].text} border-current/10`}>
                        {categoryMeta[exp.category].label.split(" ")[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-bento-text truncate" title={exp.description}>
                          {exp.description}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-bento-text-muted font-bold mt-0.5">
                          <span>{new Date(exp.date).toLocaleDateString("id-ID")}</span>
                          <span>•</span>
                          <span className="uppercase text-[9px]">{categoryMeta[exp.category].label}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 pl-2">
                      <span className="text-xs font-black text-bento-red text-right">
                        {formatIDR(exp.amount)}
                      </span>
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1 text-bento-text-muted/40 hover:text-bento-red rounded-lg hover:bg-red-50 hover:border-red-100 transition-all border border-transparent cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-bento-text-muted italic text-xs font-medium">
                  Tidak ada catatan pengeluaran operasional yang cocok dengan filter.
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t border-bento-border/50 pt-4 mt-4 flex justify-between items-center text-[10px] text-bento-text-muted font-bold">
            <span>Menampilkan {displayedExpenses.length} dari {filteredExpenses.length} catatan</span>
            <span>Total: {formatIDR(displayedExpenses.reduce((sum, e) => sum + e.amount, 0))}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
