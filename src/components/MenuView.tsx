/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Sparkles, 
  FileEdit, 
  ChevronDown, 
  Package, 
  HelpCircle 
} from "lucide-react";
import { Product, Ingredient, RecipeItem } from "../types";

interface MenuViewProps {
  products: Product[];
  ingredients: Ingredient[];
  onSaveProducts: (products: Product[]) => void;
}

export default function MenuView({ 
  products, 
  ingredients, 
  onSaveProducts 
}: MenuViewProps) {
  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"Paket Ayam" | "Ala Carte" | "Minuman">("Paket Ayam");
  const [price, setPrice] = useState<number | "">("");
  const [image, setImage] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [recipe, setRecipe] = useState<RecipeItem[]>([]);

  // Category filter for the main view
  const [viewCategory, setViewCategory] = useState<string>("Semua");

  const categoriesList = ["Semua", "Paket Ayam", "Ala Carte", "Minuman"];

  // Format currency helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Open modal for adding a product
  const handleOpenAddModal = () => {
    setModalMode("add");
    setEditingProduct(null);
    setName("");
    setCategory("Paket Ayam");
    setPrice("");
    setImage("https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&q=80&w=400"); // default crispy chicken placeholder
    setIsAvailable(true);
    setRecipe([]);
    setIsModalOpen(true);
  };

  // Open modal for editing a product
  const handleOpenEditModal = (product: Product) => {
    setModalMode("edit");
    setEditingProduct(product);
    setName(product.name);
    setCategory(product.category);
    setPrice(product.price);
    setImage(product.image);
    setIsAvailable(product.isAvailable);
    setRecipe([...product.recipe]);
    setIsModalOpen(true);
  };

  // Form submission handler
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return alert("Nama produk tidak boleh kosong.");
    if (price === "" || Number(price) <= 0) return alert("Harga produk harus diisi dengan benar.");

    const newProduct: Product = {
      id: modalMode === "add" ? `prod-${Date.now()}` : editingProduct!.id,
      name: name.trim(),
      category,
      price: Number(price),
      image: image.trim() || "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&q=80&w=400",
      isAvailable,
      recipe,
    };

    let updatedProducts: Product[];
    if (modalMode === "add") {
      updatedProducts = [...products, newProduct];
    } else {
      updatedProducts = products.map((p) => (p.id === editingProduct!.id ? newProduct : p));
    }

    onSaveProducts(updatedProducts);
    setIsModalOpen(false);
  };

  // Delete product handler
  const handleDeleteProduct = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus produk ini dari daftar menu?")) {
      const updatedProducts = products.filter((p) => p.id !== id);
      onSaveProducts(updatedProducts);
    }
  };

  // Toggle availability from card switch directly
  const handleToggleAvailableDirect = (product: Product) => {
    const updatedProducts = products.map((p) => 
      p.id === product.id ? { ...p, isAvailable: !p.isAvailable } : p
    );
    onSaveProducts(updatedProducts);
  };

  // Add line to recipe
  const handleAddRecipeItem = () => {
    if (ingredients.length === 0) return alert("Buat bahan baku terlebih dahulu di tab Bahan Baku.");
    // Choose first ingredient by default that is not already in the recipe
    const availableIng = ingredients.find(ing => !recipe.some(r => r.ingredientId === ing.id));
    const nextIngId = availableIng ? availableIng.id : ingredients[0].id;

    setRecipe([...recipe, { ingredientId: nextIngId, quantityNeeded: 1 }]);
  };

  // Update line in recipe
  const handleUpdateRecipeItem = (index: number, field: keyof RecipeItem, value: any) => {
    const updatedRecipe = [...recipe];
    updatedRecipe[index] = {
      ...updatedRecipe[index],
      [field]: value,
    };
    setRecipe(updatedRecipe);
  };

  // Remove line from recipe
  const handleRemoveRecipeItem = (index: number) => {
    setRecipe(recipe.filter((_, i) => i !== index));
  };

  // Filter products for lists
  const filteredProducts = products.filter((p) => {
    return viewCategory === "Semua" || p.category === viewCategory;
  });

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-bento-border shadow-md">
        <div>
          <h2 className="text-2xl font-extrabold text-bento-text tracking-tight">Manajemen Daftar Menu</h2>
          <p className="text-sm text-bento-text-muted font-semibold">Tambah, ubah, atau hubungkan resep masakan Anda ke bahan baku dapur.</p>
        </div>

        <button
          id="add-new-menu-btn"
          onClick={handleOpenAddModal}
          className="bg-bento-orange hover:bg-bento-orange-hover text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-md shadow-orange-950/15 transition-all duration-200 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Menu Baru
        </button>
      </div>

      {/* Category filter tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto bg-white p-3 rounded-2xl border border-bento-border shadow-md">
        {categoriesList.map((cat) => (
          <button
            key={cat}
            id={`menu-filter-${cat.replace(/\s+/g, "-")}`}
            onClick={() => setViewCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
              viewCategory === cat
                ? "bg-bento-orange text-white border border-bento-orange shadow-xs"
                : "bg-bento-light-yellow text-bento-text-muted hover:text-bento-text border border-bento-border/40"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu List Table / Grid */}
      <div className="bg-white rounded-2xl border border-bento-border shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bento-light-yellow border-b border-bento-border/60 text-bento-text-muted font-bold text-xs uppercase tracking-wider">
                <th className="p-4 pl-6">Info Produk</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">Harga</th>
                <th className="p-4">Resep Bahan Baku</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 pr-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bento-border/40 text-bento-text bg-white">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((prod) => (
                  <tr key={prod.id} id={`menu-row-${prod.id}`} className="hover:bg-bento-light-yellow/20 transition-colors">
                    {/* Image & Name */}
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.image || "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=300&auto=format&fit=crop&q=80"}
                          alt={prod.name}
                          className="w-12 h-12 object-cover rounded-xl border border-bento-border shadow-xs"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="font-extrabold text-sm text-bento-text">{prod.name}</p>
                          <p className="text-[10px] text-bento-text-muted font-bold">ID: {prod.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category badge */}
                    <td className="p-4">
                      <span className="bg-bento-light-orange/70 text-bento-maroon text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border border-bento-border/30">
                        {prod.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="p-4 font-black text-bento-text text-sm">
                      {formatIDR(prod.price)}
                    </td>

                    {/* Recipe mapping summaries */}
                    <td className="p-4 max-w-[280px]">
                      <div className="flex flex-wrap gap-1.5">
                        {prod.recipe.length > 0 ? (
                          prod.recipe.map((recipeItem, index) => {
                            const ing = ingredients.find((i) => i.id === recipeItem.ingredientId);
                            return (
                              <span
                                key={index}
                                className="bg-bento-light-yellow text-bento-text text-[10px] font-bold px-2 py-0.5 rounded-md border border-bento-border/50"
                              >
                                {ing ? ing.name : "Bahan Terhapus"} ({recipeItem.quantityNeeded} {ing?.unit})
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-bento-text-muted text-xs font-semibold italic flex items-center gap-1">
                            <HelpCircle className="w-3.5 h-3.5 text-bento-text-muted" />
                            Tanpa Bahan Baku
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Available toggle switch direct */}
                    <td className="p-4 text-center">
                      <button
                        id={`menu-toggle-${prod.id}`}
                        onClick={() => handleToggleAvailableDirect(prod)}
                        className={`mx-auto flex items-center gap-1 text-[10px] font-extrabold px-3 py-1 rounded-full border transition-all cursor-pointer ${
                          prod.isAvailable
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-bento-light-orange text-bento-red border-bento-border/40"
                        }`}
                        title="Klik untuk mengubah status menu"
                      >
                        <Check className={`w-3 h-3 ${prod.isAvailable ? "block" : "hidden"}`} />
                        {prod.isAvailable ? "Tersedia" : "Habis"}
                      </button>
                    </td>

                    {/* Action buttons edit & delete */}
                    <td className="p-4 pr-6 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          id={`menu-edit-btn-${prod.id}`}
                          onClick={() => handleOpenEditModal(prod)}
                          className="p-2 text-bento-text-muted hover:text-bento-maroon hover:bg-bento-light-yellow rounded-lg transition-colors border border-bento-border/40 cursor-pointer"
                          title="Ubah Menu"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`menu-del-btn-${prod.id}`}
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-2 text-bento-text-muted/60 hover:text-bento-red hover:bg-bento-light-orange/50 rounded-lg transition-colors border border-bento-border/40 cursor-pointer"
                          title="Hapus Menu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-bento-text-muted font-bold italic">
                    Belum ada menu produk jadi di kategori ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FLOATING MODAL: Add / Edit Product Form */}
      {isModalOpen && (
        <div id="menu-modal" className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-bento-border my-8 animate-in fade-in duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-bento-border/50 flex justify-between items-center bg-bento-light-yellow">
              <h4 className="font-extrabold text-bento-header text-base flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-bento-orange" />
                {modalMode === "add" ? "Tambah Menu Baru" : "Ubah Menu Produk"}
              </h4>
              <button
                id="close-menu-modal"
                onClick={() => setIsModalOpen(false)}
                className="text-bento-text-muted hover:text-bento-red hover:bg-bento-light-orange/50 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-bento-text block">Nama Produk</label>
                  <input
                    type="text"
                    required
                    id="menu-form-name"
                    placeholder="Contoh: Paket Geprek Jumbo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-bento-light-yellow/20 border border-bento-border rounded-xl focus:outline-none focus:ring-2 focus:ring-bento-orange/20 focus:border-bento-orange text-xs font-bold text-bento-text"
                  />
                </div>

                {/* Category Selection dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-bento-text block">Kategori</label>
                  <select
                    id="menu-form-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-bento-light-yellow/20 border border-bento-border rounded-xl focus:outline-none focus:ring-2 focus:ring-bento-orange/20 focus:border-bento-orange text-xs font-bold text-bento-text bg-white"
                  >
                    <option value="Paket Ayam">Paket Ayam</option>
                    <option value="Ala Carte">Ala Carte</option>
                    <option value="Minuman">Minuman</option>
                  </select>
                </div>

                {/* Price tag */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-bento-text block">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    required
                    id="menu-form-price"
                    placeholder="Contoh: 15000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-bento-light-yellow/20 border border-bento-border rounded-xl focus:outline-none focus:ring-2 focus:ring-bento-orange/20 focus:border-bento-orange text-xs font-bold text-bento-text"
                  />
                </div>

                {/* Image URL link */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-bento-text block">URL Link Gambar</label>
                  <input
                    type="text"
                    id="menu-form-image"
                    placeholder="Link Unsplash atau placeholder..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full px-3 py-2 bg-bento-light-yellow/20 border border-bento-border rounded-xl focus:outline-none focus:ring-2 focus:ring-bento-orange/20 focus:border-bento-orange text-xs font-bold text-bento-text"
                  />
                </div>
              </div>

              {/* Status Switch available */}
              <div className="flex items-center justify-between p-3 bg-bento-light-yellow/20 rounded-xl border border-bento-border/50">
                <div>
                  <span className="text-xs font-bold text-bento-text block">Status Menu</span>
                  <span className="text-[10px] text-bento-text-muted font-semibold">Tandai menu habis jika stok selesai dimasak hari ini</span>
                </div>
                <button
                  type="button"
                  id="menu-form-toggle-status"
                  onClick={() => setIsAvailable(!isAvailable)}
                  className={`px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                    isAvailable ? "bg-emerald-600 text-white" : "bg-bento-red text-white"
                  }`}
                >
                  {isAvailable ? "Tersedia" : "Habis"}
                </button>
              </div>

              {/* Recipe builder section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-t border-bento-border/40 pt-4">
                  <div>
                    <h5 className="text-xs font-bold text-bento-text uppercase tracking-wide flex items-center gap-1">
                      <Package className="w-4 h-4 text-bento-orange" />
                      Komposisi Resep Bahan Baku
                    </h5>
                    <p className="text-[9px] text-bento-text-muted font-semibold">Daftar bahan yang akan otomatis terpotong saat menu ini dibeli</p>
                  </div>
                  <button
                    type="button"
                    id="add-recipe-line-btn"
                    onClick={handleAddRecipeItem}
                    className="bg-bento-light-orange hover:bg-bento-orange/20 text-bento-maroon px-3 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Bahan
                  </button>
                </div>

                {/* Recipe Mapping Items */}
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {recipe.length > 0 ? (
                    recipe.map((recipeItem, index) => (
                      <div key={index} className="flex gap-2 items-center bg-bento-light-yellow/10 p-2 rounded-xl border border-bento-border/40">
                        {/* Ingredient dropdown selector */}
                        <select
                          value={recipeItem.ingredientId}
                          onChange={(e) => handleUpdateRecipeItem(index, "ingredientId", e.target.value)}
                          className="flex-1 px-2.5 py-1.5 bg-white border border-bento-border rounded-lg text-xs font-bold text-bento-text"
                        >
                          {ingredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name} ({ing.unit})
                            </option>
                          ))}
                        </select>

                        {/* Quantity input box */}
                        <div className="w-24">
                          <input
                            type="number"
                            step="any"
                            required
                            placeholder="Qty"
                            value={recipeItem.quantityNeeded}
                            onChange={(e) => handleUpdateRecipeItem(index, "quantityNeeded", Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-white border border-bento-border rounded-lg text-xs font-black text-bento-text text-center"
                          />
                        </div>

                        {/* Delete recipe item button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipeItem(index)}
                          className="text-bento-text-muted hover:text-bento-red p-1 hover:bg-bento-light-orange/50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-bento-text-muted italic text-center py-4 bg-bento-light-yellow/20 rounded-xl border border-dashed border-bento-border/40 font-semibold">
                      Belum ada komposisi bahan baku untuk resep menu ini.
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 border-t border-bento-border/40 pt-4 mt-2">
                <button
                  type="button"
                  id="cancel-menu-form-btn"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-bento-light-yellow hover:bg-bento-light-orange rounded-xl text-xs font-bold text-bento-text border border-bento-border/50 cursor-pointer transition-all duration-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="submit-menu-form-btn"
                  className="flex-1 py-2.5 bg-bento-orange hover:bg-bento-orange-hover text-white rounded-xl text-xs font-black uppercase transition-all shadow-md shadow-orange-950/10 cursor-pointer"
                >
                  {modalMode === "add" ? "Simpan Menu" : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
