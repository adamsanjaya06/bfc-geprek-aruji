/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  ShoppingBag,
  Zap,
  Trash,
  History,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { Ingredient, Wastage } from "../types";
import { getWastage, recordWastage, getIngredients, editWastage, deleteWastage } from "../utils/db";

interface IngredientsViewProps {
  ingredients: Ingredient[];
  onSaveIngredients: (ingredients: Ingredient[]) => void;
}

export default function IngredientsView({ 
  ingredients, 
  onSaveIngredients 
}: IngredientsViewProps) {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<"inventory" | "wastage">("inventory");

  // Wastage history
  const [wastages, setWastages] = useState<Wastage[]>([]);
  
  // Wastage Form States
  const [selectedIngId, setSelectedIngId] = useState("");
  const [wastageQty, setWastageQty] = useState<number | "">("");
  const [wastageReason, setWastageReason] = useState("");
  const [wastageError, setWastageError] = useState("");
  const [wastageSuccess, setWastageSuccess] = useState("");

  // Wastage Time Filter State
  const [wastageTimeRange, setWastageTimeRange] = useState<"today" | "week" | "month" | "all">("today");

  // Wastage Edit Modal States
  const [isEditWastageModalOpen, setIsEditWastageModalOpen] = useState(false);
  const [editingWastage, setEditingWastage] = useState<Wastage | null>(null);
  const [editWastageQty, setEditWastageQty] = useState<number | "">("");
  const [editWastageReason, setEditWastageReason] = useState("");

  const isWithinWastageTimeRange = (dateStr: string) => {
    const itemDate = new Date(dateStr);
    const now = new Date();
    
    if (wastageTimeRange === "today") {
      return itemDate.getDate() === now.getDate() &&
             itemDate.getMonth() === now.getMonth() &&
             itemDate.getFullYear() === now.getFullYear();
    }
    
    if (wastageTimeRange === "week") {
      const diffTime = Math.abs(now.getTime() - itemDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    
    if (wastageTimeRange === "month") {
      return itemDate.getMonth() === now.getMonth() &&
             itemDate.getFullYear() === now.getFullYear();
    }
    
    return true; // "all"
  };

  const filteredWastages = wastages.filter(w => isWithinWastageTimeRange(w.date));
  const totalWastageCost = filteredWastages.reduce((sum, w) => sum + w.totalCost, 0);

  // Load wastage logs on mount or when tab changes
  useEffect(() => {
    setWastages(getWastage());
  }, [activeTab]);

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [stock, setStock] = useState<number | "">("");
  const [unit, setUnit] = useState("pcs");
  const [minStock, setMinStock] = useState<number | "">("");
  const [cost, setCost] = useState<number | "">("");

  // Quick Restock popup state
  const [quickRestockTarget, setQuickRestockTarget] = useState<Ingredient | null>(null);
  const [quickRestockQty, setQuickRestockQty] = useState<number | "">("");

  // Format currency helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Open modal to add raw material
  const handleOpenAddModal = () => {
    setModalMode("add");
    setEditingIngredient(null);
    setName("");
    setStock("");
    setUnit("pcs");
    setMinStock("");
    setCost("");
    setIsModalOpen(true);
  };

  // Open modal to edit raw material
  const handleOpenEditModal = (ing: Ingredient) => {
    setModalMode("edit");
    setEditingIngredient(ing);
    setName(ing.name);
    setStock(ing.stock);
    setUnit(ing.unit);
    setMinStock(ing.minStock);
    setCost(ing.cost);
    setIsModalOpen(true);
  };

  // Form submission handler
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return alert("Nama bahan baku harus diisi.");
    if (stock === "" || Number(stock) < 0) return alert("Jumlah stok harus berupa angka positif.");
    if (minStock === "" || Number(minStock) < 0) return alert("Minimal stok harus berupa angka positif.");
    if (cost === "" || Number(cost) < 0) return alert("Biaya beli per unit harus berupa angka positif.");

    const newIng: Ingredient = {
      id: modalMode === "add" ? `ing-${Date.now()}` : editingIngredient!.id,
      name: name.trim(),
      stock: Number(stock),
      unit: unit.trim() || "pcs",
      minStock: Number(minStock),
      cost: Number(cost),
    };

    let updatedIngredients: Ingredient[];
    if (modalMode === "add") {
      updatedIngredients = [...ingredients, newIng];
    } else {
      updatedIngredients = ingredients.map((i) => (i.id === editingIngredient!.id ? newIng : i));
    }

    onSaveIngredients(updatedIngredients);
    setIsModalOpen(false);
  };

  // Delete raw material
  const handleDeleteIngredient = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus bahan baku ini? \nPERINGATAN: Menu yang bergantung pada resep bahan baku ini mungkin tidak bisa dimasak.")) {
      const updatedIngredients = ingredients.filter((i) => i.id !== id);
      onSaveIngredients(updatedIngredients);
    }
  };

  // Open quick restock drawer
  const handleOpenQuickRestock = (ing: Ingredient) => {
    setQuickRestockTarget(ing);
    setQuickRestockQty("");
  };

  // Execute quick restock adding to stock
  const handleExecuteQuickRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickRestockTarget || quickRestockQty === "" || Number(quickRestockQty) <= 0) return;

    const updatedIngredients = ingredients.map((i) => {
      if (i.id === quickRestockTarget.id) {
        // Add quantity and round to 3 decimal places
        const totalStock = i.stock + Number(quickRestockQty);
        return { ...i, stock: Math.round(totalStock * 1000) / 1000 };
      }
      return i;
    });

    onSaveIngredients(updatedIngredients);
    setQuickRestockTarget(null);
  };

  const handleWastageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWastageError("");
    setWastageSuccess("");

    if (!selectedIngId) {
      setWastageError("Silakan pilih bahan baku yang rusak/basi.");
      return;
    }

    if (wastageQty === "" || Number(wastageQty) <= 0) {
      setWastageError("Jumlah bahan dibuang harus lebih dari 0.");
      return;
    }

    const matchedIngredient = ingredients.find(i => i.id === selectedIngId);
    if (matchedIngredient && matchedIngredient.stock < Number(wastageQty)) {
      setWastageError(`Jumlah dibuang melebihi sisa stok (${matchedIngredient.stock} ${matchedIngredient.unit}).`);
      return;
    }

    if (!wastageReason.trim()) {
      setWastageError("Silakan berikan alasan pembuangan bahan.");
      return;
    }

    const res = recordWastage(selectedIngId, Number(wastageQty), wastageReason.trim());
    if (res.success) {
      // Trigger parent save ingredients to update all states in real-time!
      onSaveIngredients(getIngredients());
      
      setWastages(getWastage());
      setWastageQty("");
      setWastageReason("");
      setWastageSuccess("Laporan wastage berhasil dicatat! Stok bahan baku otomatis dipotong.");
      
      setTimeout(() => setWastageSuccess(""), 3000);
    } else {
      setWastageError(res.error || "Gagal mencatat wastage.");
    }
  };

  const handleOpenEditWastage = (w: Wastage) => {
    setEditingWastage(w);
    setEditWastageQty(w.quantity);
    setEditWastageReason(w.reason);
    setIsEditWastageModalOpen(true);
  };

  const handleEditWastageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWastage) return;
    if (editWastageQty === "" || Number(editWastageQty) <= 0) {
      alert("Jumlah bahan dibuang harus lebih dari 0.");
      return;
    }
    if (!editWastageReason.trim()) {
      alert("Silakan berikan alasan pembuangan bahan.");
      return;
    }

    const res = editWastage(editingWastage.id, Number(editWastageQty), editWastageReason.trim());
    if (res.success) {
      onSaveIngredients(getIngredients());
      setWastages(getWastage());
      setIsEditWastageModalOpen(false);
      setEditingWastage(null);
    } else {
      alert(res.error || "Gagal memperbarui wastage.");
    }
  };

  const handleDeleteWastage = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus catatan wastage ini?\nStok bahan baku akan dikembalikan secara otomatis!")) {
      const res = deleteWastage(id);
      if (res.success) {
        onSaveIngredients(getIngredients());
        setWastages(getWastage());
      } else {
        alert(res.error || "Gagal menghapus wastage.");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-bento-border shadow-md">
        <div>
          <h2 className="text-2xl font-extrabold text-bento-text tracking-tight">Manajemen Bahan Baku</h2>
          <p className="text-sm text-bento-text-muted font-semibold">Kendalikan persediaan ayam mentah, bumbu, minyak, dsb untuk menjamin pasokan dapur.</p>
        </div>

        <button
          id="add-new-ingredient-btn"
          onClick={handleOpenAddModal}
          className="bg-bento-orange hover:bg-bento-orange-hover text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-md shadow-orange-950/15 transition-all duration-200 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Bahan Baku
        </button>
      </div>

      {/* Tab Selectors */}
      <div className="flex items-center gap-1.5 bg-bento-light-yellow p-1.5 rounded-xl border border-bento-border/50 w-max">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "inventory"
              ? "bg-bento-maroon text-white shadow-xs"
              : "text-bento-text-muted hover:text-bento-text"
          }`}
        >
          <Package className="w-4 h-4" />
          Stok Persediaan Dapur
        </button>
        <button
          onClick={() => setActiveTab("wastage")}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "wastage"
              ? "bg-bento-maroon text-white shadow-xs"
              : "text-bento-text-muted hover:text-bento-text"
          }`}
        >
          <Trash className="w-4 h-4" />
          Stok Opname & Wastage (Bahan Rusak/Basi)
        </button>
      </div>

      {/* Conditional Rendering of Tabs */}
      {activeTab === "inventory" ? (
        /* Grid of Materials Checklist */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
          
          {/* LEFT 2 COLS: Main list table */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-bento-border shadow-md overflow-hidden">
            <div className="p-4 bg-bento-light-yellow border-b border-bento-border/60 flex justify-between items-center">
              <h4 className="font-extrabold text-bento-header text-xs uppercase tracking-wider">Inventaris Gudang Bahan Mentah</h4>
              <span className="text-[10px] text-bento-text font-black bg-white px-2.5 py-1 rounded-md border border-bento-border/50">
                {ingredients.length} Jenis Bahan Baku
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bento-light-yellow/50 border-b border-bento-border/60 text-bento-text-muted font-bold text-xs uppercase tracking-wider">
                    <th className="p-4 pl-6">Nama Bahan</th>
                    <th className="p-4">Stok Saat Ini</th>
                    <th className="p-4">Batas Minimum</th>
                    <th className="p-4">Harga Beli Unit</th>
                    <th className="p-4 pr-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bento-border/40 text-bento-text bg-white">
                  {ingredients.length > 0 ? (
                    ingredients.map((ing) => {
                      const isLowStock = ing.stock <= ing.minStock;
                      return (
                        <tr 
                          key={ing.id} 
                          id={`ingredient-row-${ing.id}`}
                          className={`hover:bg-bento-light-yellow/20 transition-colors ${
                            isLowStock ? "bg-bento-light-orange/20" : ""
                          }`}
                        >
                          {/* Name with warning icon if low */}
                          <td className="p-4 pl-6">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                isLowStock ? "bg-bento-light-orange text-bento-red" : "bg-bento-light-yellow text-bento-text-muted"
                              }`}>
                                <Package className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-extrabold text-sm text-bento-text flex items-center gap-1.5">
                                  {ing.name}
                                  {isLowStock && (
                                    <span className="bg-bento-light-orange text-bento-red p-0.5 rounded-full" title="Segera Belanja!">
                                      <AlertTriangle className="w-3.5 h-3.5" />
                                    </span>
                                  )}
                                </p>
                                <p className="text-[10px] text-bento-text-muted font-bold">ID: {ing.id}</p>
                              </div>
                            </div>
                          </td>

                          {/* Current Stock with custom color if low */}
                          <td className="p-4">
                            <span className={`text-sm font-black ${isLowStock ? "text-bento-red animate-pulse" : "text-bento-text"}`}>
                              {ing.stock} <span className="text-xs font-semibold text-bento-text-muted">{ing.unit}</span>
                            </span>
                          </td>

                          {/* Minimum stock */}
                          <td className="p-4 text-xs font-bold text-bento-text-muted">
                            {ing.minStock} {ing.unit}
                          </td>

                          {/* Cost Unit */}
                          <td className="p-4 text-sm font-black text-bento-text">
                            {formatIDR(ing.cost)} <span className="text-[10px] text-bento-text-muted font-semibold">/{ing.unit}</span>
                          </td>

                          {/* Actions: Edit, Delete, Quick Restock */}
                          <td className="p-4 pr-6 text-right">
                            <div className="flex justify-end items-center gap-1.5">
                              {/* Quick Restock button */}
                              <button
                                id={`ing-quick-restock-${ing.id}`}
                                onClick={() => handleOpenQuickRestock(ing)}
                                className="p-2 text-bento-orange hover:text-white hover:bg-bento-orange border border-bento-border/50 rounded-lg transition-all cursor-pointer"
                                title="Tambah Stok Cepat"
                              >
                                <Zap className="w-3.5 h-3.5" />
                              </button>
                              {/* Edit */}
                              <button
                                id={`ing-edit-btn-${ing.id}`}
                                onClick={() => handleOpenEditModal(ing)}
                                className="p-2 text-bento-text-muted hover:text-bento-maroon hover:bg-bento-light-yellow rounded-lg transition-colors border border-bento-border/40 cursor-pointer"
                                title="Ubah Bahan"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {/* Delete */}
                              <button
                                id={`ing-del-btn-${ing.id}`}
                                onClick={() => handleDeleteIngredient(ing.id)}
                                className="p-2 text-bento-text-muted/60 hover:text-bento-red hover:bg-bento-light-orange/50 rounded-lg transition-colors border border-bento-border/40 cursor-pointer"
                                title="Hapus Bahan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-bento-text-muted font-bold italic">
                        Belum ada bahan baku dapur yang tercatat.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT 1 COL: Quick Action drawer / info cards */}
          <div className="space-y-6">
            {/* Quick Restock Panel */}
            {quickRestockTarget ? (
              <div id="quick-restock-panel" className="bg-white p-6 rounded-2xl border border-bento-border shadow-md animate-in slide-in-from-right duration-250">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-bento-header text-sm flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-bento-orange" />
                      Pasok Stok Cepat
                    </h4>
                    <p className="text-[10px] text-bento-text-muted mt-0.5">Tambah kuantitas persediaan di dapur.</p>
                  </div>
                  <button
                    onClick={() => setQuickRestockTarget(null)}
                    className="text-bento-text-muted hover:text-bento-text p-1 rounded-md hover:bg-bento-light-yellow cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Targets detail */}
                <div className="bg-bento-light-orange border border-bento-border/50 rounded-xl p-3.5 my-4">
                  <span className="text-[10px] font-bold text-bento-maroon uppercase tracking-wider block">Bahan Baku Target</span>
                  <p className="text-sm font-extrabold text-bento-text mt-0.5">{quickRestockTarget.name}</p>
                  <div className="flex justify-between text-xs text-bento-text-muted mt-2 border-t border-bento-border/40 pt-2 font-semibold">
                    <span>Stok Sekarang:</span>
                    <span className="font-extrabold text-bento-text">{quickRestockTarget.stock} {quickRestockTarget.unit}</span>
                  </div>
                </div>

                {/* Form Input */}
                <form onSubmit={handleExecuteQuickRestock} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-bento-text block">Jumlah Pasokan Ditambah</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder={`Contoh: 50 atau 12.5...`}
                        value={quickRestockQty}
                        onChange={(e) => setQuickRestockQty(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full px-3 py-2 bg-bento-light-yellow/20 border border-bento-border rounded-xl focus:outline-none focus:ring-2 focus:ring-bento-orange/20 focus:border-bento-orange text-xs font-black text-bento-text"
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs font-bold text-bento-text-muted uppercase">
                        {quickRestockTarget.unit}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setQuickRestockTarget(null)}
                      className="flex-1 py-2 bg-bento-light-yellow hover:bg-bento-light-orange rounded-xl text-xs font-bold text-bento-text border border-bento-border/50 cursor-pointer transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-bento-orange hover:bg-bento-orange-hover text-white rounded-xl text-xs font-black transition-colors shadow-md shadow-orange-950/10 cursor-pointer"
                    >
                      Simpan Stok
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-bento-light-yellow/80 to-bento-light-orange/50 p-6 rounded-2xl border border-bento-border/60 flex flex-col justify-between shadow-md">
                <div>
                  <h4 className="font-extrabold text-bento-maroon text-sm flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-bento-orange" />
                    Mencegah Kehabisan Bahan
                  </h4>
                  <p className="text-xs text-bento-text mt-2 leading-relaxed font-semibold">
                    Sistem POS ChickenPOS ini otomatis memotong stok bahan baku mentah setiap kali ada nota transaksi kasir sukses. 
                  </p>
                  <p className="text-xs text-bento-text mt-2 leading-relaxed font-semibold">
                    Pastikan batas minimum stok disesuaikan agar Anda mendapatkan peringatan alarm visual sebelum persediaan ayam krispi habis total.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <div className="bg-bento-light-orange p-2.5 rounded-xl text-bento-maroon border border-bento-border/40">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-bento-text">Analisis Food-Cost</p>
                    <p className="text-[10px] text-bento-text-muted font-bold mt-0.5">Biaya modal menentukan estimasi profit.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* STOK OPNAME & WASTAGE VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* Column 1: Input Form */}
          <div className="bg-white p-6 rounded-2xl border border-bento-border shadow-md">
            <h4 className="font-extrabold text-bento-header text-base flex items-center gap-2 mb-1">
              <Trash className="w-5 h-5 text-bento-orange" />
              Catat Wastage & Buang Bahan
            </h4>
            <p className="text-xs text-bento-text-muted mb-4">Laporkan bahan yang basi, busuk, tumpah, atau rusak untuk dipotong langsung dari persediaan.</p>

            <form onSubmit={handleWastageSubmit} className="space-y-4">
              {/* Ingredient selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-bento-text block">Pilih Bahan Baku</label>
                <select
                  value={selectedIngId}
                  onChange={(e) => setSelectedIngId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-bento-light-yellow/20 border border-bento-border rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-bento-orange bg-white"
                >
                  <option value="">-- Pilih Bahan Baku --</option>
                  {ingredients.map(ing => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} (Stok: {ing.stock} {ing.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-bento-text block">Jumlah Dibuang</label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Contoh: 5"
                    value={wastageQty}
                    onChange={(e) => setWastageQty(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-bento-light-yellow/20 border border-bento-border rounded-xl text-xs font-black text-bento-text focus:outline-none focus:ring-1 focus:ring-bento-orange"
                  />
                  {selectedIngId && (
                    <span className="absolute right-3.5 top-2.5 text-xs text-bento-text-muted font-bold uppercase">
                      {ingredients.find(i => i.id === selectedIngId)?.unit}
                    </span>
                  )}
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-bento-text block">Alasan / Keterangan</label>
                <textarea
                  required
                  placeholder="Contoh: 5 potong ayam dibuang karena sudah lewat hari / basi"
                  value={wastageReason}
                  onChange={(e) => setWastageReason(e.target.value)}
                  className="w-full px-3 py-2 bg-bento-light-yellow/20 border border-bento-border rounded-xl text-xs font-bold text-bento-text focus:outline-none focus:ring-1 focus:ring-bento-orange h-24 resize-none"
                />
              </div>

              {/* Feedback messages */}
              {wastageError && (
                <div className="p-3 bg-red-50 text-bento-red text-xs font-semibold rounded-xl border border-red-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{wastageError}</span>
                </div>
              )}

              {wastageSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{wastageSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-bento-red hover:bg-bento-maroon text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash className="w-4 h-4" />
                Catat Kerugian Wastage
              </button>
            </form>
          </div>

          {/* Column 2 & 3: History list and total metrics */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-bento-border shadow-md overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-4 bg-bento-light-yellow border-b border-bento-border/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-bento-orange" />
                  <h4 className="font-extrabold text-bento-header text-xs uppercase tracking-wider">Log Riwayat Bahan Terbuang (Wastage)</h4>
                </div>
                
                {/* Time range selector for Wastage */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-bento-border/50">
                  {[
                    { id: "today", label: "Hari Ini" },
                    { id: "week", label: "7 Hari" },
                    { id: "month", label: "Bulan Ini" },
                    { id: "all", label: "Semua" }
                  ].map((range) => (
                    <button
                      key={range.id}
                      type="button"
                      onClick={() => setWastageTimeRange(range.id as any)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        wastageTimeRange === range.id
                          ? "bg-bento-orange text-white shadow-xs"
                          : "text-bento-text-muted hover:text-bento-text"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto max-h-[380px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-bento-light-yellow/30 border-b border-bento-border/40 text-bento-text-muted font-bold text-[10px] uppercase tracking-wider">
                      <th className="p-3 pl-6">Tanggal</th>
                      <th className="p-3">Nama Bahan</th>
                      <th className="p-3 text-right">Jumlah</th>
                      <th className="p-3">Biaya / Unit</th>
                      <th className="p-3 text-right">Total Kerugian</th>
                      <th className="p-3 pl-4">Alasan Pembuangan</th>
                      <th className="p-3 pr-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-xs">
                    {filteredWastages.length > 0 ? (
                      filteredWastages.map(w => (
                        <tr key={w.id} className="hover:bg-bento-light-orange/10 transition-colors">
                          <td className="p-3 pl-6 text-[10px] text-bento-text-muted font-bold">
                            {new Date(w.date).toLocaleDateString("id-ID")}
                          </td>
                          <td className="p-3 font-extrabold text-bento-text">{w.ingredientName}</td>
                          <td className="p-3 text-right font-black text-bento-text-muted">
                            {w.quantity} <span className="text-[10px] text-stone-400 font-semibold">{w.unit}</span>
                          </td>
                          <td className="p-3 font-semibold text-bento-text-muted">{formatIDR(w.costPerUnit)}</td>
                          <td className="p-3 text-right font-black text-bento-red">{formatIDR(w.totalCost)}</td>
                          <td className="p-3 pl-4 text-bento-text-muted italic max-w-xs truncate" title={w.reason}>
                            {w.reason}
                          </td>
                          {/* Edit / Delete actions for wastage */}
                          <td className="p-3 pr-6 text-right">
                            <div className="flex justify-end items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditWastage(w)}
                                className="p-1.5 text-bento-text-muted hover:text-bento-maroon hover:bg-bento-light-yellow rounded-md transition-colors border border-bento-border/30 cursor-pointer"
                                title="Ubah Catatan"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteWastage(w.id)}
                                className="p-1.5 text-bento-text-muted/60 hover:text-bento-red hover:bg-bento-light-orange/40 rounded-md transition-colors border border-bento-border/30 cursor-pointer"
                                title="Hapus Catatan"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-bento-text-muted font-bold italic">
                          Belum ada catatan bahan terbuang (wastage) untuk periode ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-bento-border/40 bg-bento-light-yellow/30 flex justify-between items-center text-[10px] text-bento-text-muted font-bold">
              <span>Total Catatan: {filteredWastages.length} kejadian</span>
              <span className="text-bento-red text-xs font-black">Total Kerugian: {formatIDR(totalWastageCost)}</span>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING MODAL: Add / Edit Raw Material Details */}
      {isModalOpen && (
        <div id="ingredient-modal" className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-bento-border animate-in fade-in duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-bento-border/50 flex justify-between items-center bg-bento-light-yellow">
              <h4 className="font-extrabold text-bento-header text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-bento-orange" />
                {modalMode === "add" ? "Tambah Bahan Mentah" : "Ubah Detail Bahan"}
              </h4>
              <button
                id="close-ingredient-modal"
                onClick={() => setIsModalOpen(false)}
                className="text-bento-text-muted hover:text-bento-red hover:bg-bento-light-orange/50 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 bg-white">
              {/* Ingredient Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-bento-text block">Nama Bahan Baku</label>
                <input
                  type="text"
                  required
                  id="ing-form-name"
                  placeholder="Contoh: Ayam Fillet"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-bento-light-yellow/20 border border-bento-border rounded-xl focus:outline-none focus:ring-2 focus:ring-bento-orange/20 focus:border-bento-orange text-xs font-bold text-bento-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Current Stock */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-bento-text block">Stok Sekarang</label>
                  <input
                    type="number"
                    step="any"
                    required
                    id="ing-form-stock"
                    placeholder="Contoh: 150"
                    value={stock}
                    onChange={(e) => setStock(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-bento-light-yellow/20 border border-bento-border rounded-xl focus:outline-none focus:ring-2 focus:ring-bento-orange/20 focus:border-bento-orange text-xs font-bold text-bento-text"
                  />
                </div>

                {/* Unit measurement */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-bento-text block">Satuan (Unit)</label>
                  <select
                    id="ing-form-unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2.5 bg-bento-light-yellow/20 border border-bento-border rounded-xl focus:outline-none focus:ring-2 focus:ring-bento-orange/20 focus:border-bento-orange text-xs font-bold text-bento-text bg-white"
                  >
                    <option value="pcs">pcs (biji)</option>
                    <option value="kg">kg (kilogram)</option>
                    <option value="liter">liter</option>
                    <option value="pack">pack</option>
                  </select>
                </div>

                {/* Minimum stock boundary */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-bento-text block">Batas Min. Alarm</label>
                  <input
                    type="number"
                    step="any"
                    required
                    id="ing-form-min"
                    placeholder="Contoh: 20"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-bento-light-yellow/20 border border-bento-border rounded-xl focus:outline-none focus:ring-2 focus:ring-bento-orange/20 focus:border-bento-orange text-xs font-bold text-bento-text"
                  />
                </div>

                {/* Cost Unit Price */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-bento-text block">Biaya Beli / Unit (Rp)</label>
                  <input
                    type="number"
                    required
                    id="ing-form-cost"
                    placeholder="Contoh: 6000"
                    value={cost}
                    onChange={(e) => setCost(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-bento-light-yellow/20 border border-bento-border rounded-xl focus:outline-none focus:ring-2 focus:ring-bento-orange/20 focus:border-bento-orange text-xs font-bold text-bento-text"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 border-t border-bento-border/40 pt-4 mt-4">
                <button
                  type="button"
                  id="cancel-ing-form-btn"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-bento-light-yellow hover:bg-bento-light-orange rounded-xl text-xs font-bold text-bento-text border border-bento-border/50 cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="submit-ing-form-btn"
                  className="flex-1 py-2.5 bg-bento-orange hover:bg-bento-orange-hover text-white rounded-xl text-xs font-black uppercase transition-colors shadow-md shadow-orange-950/10 cursor-pointer"
                >
                  {modalMode === "add" ? "Simpan Bahan" : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLOATING MODAL: Edit Wastage Details */}
      {isEditWastageModalOpen && editingWastage && (
        <div id="edit-wastage-modal" className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-250">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-bento-border">
            {/* Header */}
            <div className="px-6 py-4 border-b border-bento-border/50 flex justify-between items-center bg-bento-light-yellow">
              <h4 className="font-extrabold text-bento-header text-sm flex items-center gap-2">
                <Trash className="w-5 h-5 text-bento-orange" />
                Ubah Catatan Wastage
              </h4>
              <button
                type="button"
                onClick={() => {
                  setIsEditWastageModalOpen(false);
                  setEditingWastage(null);
                }}
                className="text-bento-text-muted hover:text-bento-red hover:bg-bento-light-orange/50 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditWastageSubmit} className="p-6 space-y-4 bg-white">
              {/* Ingredient Name (Readonly) */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-bento-text-muted block">Bahan Baku</span>
                <p className="text-sm font-extrabold text-bento-text">{editingWastage.ingredientName}</p>
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-bento-text block">Jumlah Dibuang</label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Contoh: 5"
                    value={editWastageQty}
                    onChange={(e) => setEditWastageQty(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-bento-light-yellow/20 border border-bento-border rounded-xl text-xs font-black text-bento-text focus:outline-none focus:ring-1 focus:ring-bento-orange"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-bento-text-muted font-bold uppercase">
                    {editingWastage.unit}
                  </span>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-bento-text block">Alasan / Keterangan</label>
                <textarea
                  required
                  placeholder="Keterangan wastage..."
                  value={editWastageReason}
                  onChange={(e) => setEditWastageReason(e.target.value)}
                  className="w-full px-3 py-2 bg-bento-light-yellow/20 border border-bento-border rounded-xl text-xs font-bold text-bento-text focus:outline-none focus:ring-1 focus:ring-bento-orange h-24 resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 border-t border-bento-border/40 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditWastageModalOpen(false);
                    setEditingWastage(null);
                  }}
                  className="flex-1 py-2.5 bg-bento-light-yellow hover:bg-bento-light-orange rounded-xl text-xs font-bold text-bento-text border border-bento-border/50 cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-bento-red hover:bg-bento-maroon text-white rounded-xl text-xs font-black uppercase transition-colors shadow-md cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
