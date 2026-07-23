/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Receipt, 
  Sparkles, 
  AlertCircle, 
  CheckCircle, 
  X,
  Printer
} from "lucide-react";
import { Product, Ingredient, CartItem, Sale } from "../types";
import { checkCartAvailability, processSale, getStoreSettings } from "../utils/db";

interface PosViewProps {
  products: Product[];
  ingredients: Ingredient[];
  cashierName: string;
  onSaleComplete: () => void;
}

export default function PosView({ 
  products, 
  ingredients, 
  cashierName, 
  onSaleComplete 
}: PosViewProps) {
  // POS States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [activeMobileTab, setActiveMobileTab] = useState<"menu" | "cart">("menu");
  
  // Payment Modal States
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [cashAmount, setCashAmount] = useState<number | "">("");
  const [paymentError, setPaymentError] = useState("");
  
  // Receipt State
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Categories list
  const categories = ["Semua", "Paket Ayam", "Ala Carte", "Minuman"];

  // Helper to format currency in Rupiah (IDR)
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Filter products based on search query and category
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Semua" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate shopping cart costs
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = 0; // Pajak restoran dihapus
  const total = subtotal;

  // Add a product to the cart with recipe check
  const handleAddToCart = (product: Product) => {
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    let updatedCart = [...cart];

    if (existingIndex > -1) {
      updatedCart[existingIndex].quantity += 1;
    } else {
      updatedCart.push({ product, quantity: 1 });
    }

    // Check if ingredient stock allows this update
    const check = checkCartAvailability(updatedCart);
    if (!check.available) {
      alert(`Stok bahan baku tidak mencukupi untuk menambah ${product.name}! \nDetail: ${check.insufficientIngredient}`);
      return;
    }

    setCart(updatedCart);
  };

  // Decrease product quantity in cart
  const handleRemoveOneFromCart = (product: Product) => {
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    if (existingIndex === -1) return;

    let updatedCart = [...cart];
    if (updatedCart[existingIndex].quantity > 1) {
      updatedCart[existingIndex].quantity -= 1;
    } else {
      updatedCart.splice(existingIndex, 1);
    }
    setCart(updatedCart);
  };

  // Remove product completely from cart
  const handleRemoveProductFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  // Clear entire cart
  const handleClearCart = () => {
    if (window.confirm("Apakah Anda yakin ingin mengosongkan keranjang belanja?")) {
      setCart([]);
    }
  };

  // Fast cash payments helpers
  const handleFastCash = (amount: number) => {
    setCashAmount(amount);
  };

  // Check if a single product is available based on ingredients stock
  const isProductOutOfStock = (product: Product) => {
    if (!product.isAvailable) return true;
    
    // Check if any single ingredient for this product has 0 stock or is less than recipe
    for (const recipeItem of product.recipe) {
      const ingredient = ingredients.find(ing => ing.id === recipeItem.ingredientId);
      if (!ingredient || ingredient.stock < recipeItem.quantityNeeded) {
        return true;
      }
    }
    return false;
  };

  // Open pay modal
  const handleOpenPayModal = () => {
    if (cart.length === 0) return;
    setCashAmount("");
    setPaymentError("");
    setIsPayModalOpen(true);
  };

  // Confirm check out process
  const handleProcessCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError("");

    const payValue = Number(cashAmount);
    if (isNaN(payValue) || payValue < total) {
      setPaymentError(`Uang pembayaran kurang. Minimal pembayaran: ${formatIDR(total)}`);
      return;
    }

    // Execute transaction via the db processor
    const result = processSale(cart, payValue, cashierName || "Kasir Utama");
    if (result.success && result.sale) {
      setCompletedSale(result.sale);
      setIsPayModalOpen(false);
      setIsReceiptOpen(true);
      setCart([]); // Reset Cart
      onSaleComplete(); // Notify parent of database update
    } else {
      setPaymentError(result.error || "Gagal memproses transaksi.");
    }
  };

  // Real Thermal Paper Printing using Iframe
  const handleSimulatePrint = () => {
    if (!completedSale) return;
    setIsPrinting(true);

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      setIsPrinting(false);
      return;
    }

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
            <div>Invoice: ${completedSale.invoiceNumber}</div>
            <div>Tanggal: ${new Date(completedSale.date).toLocaleString("id-ID")}</div>
            <div>Kasir  : ${completedSale.cashierName || "Kasir Utama"}</div>
          </div>

          <div class="border-b">
            ${completedSale.items.map(item => `
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
              <span>${formatIDR(completedSale.subtotal)}</span>
            </div>
            <div class="flex font-bold" style="font-size: 12px; margin-top: 4px;">
              <span>TOTAL:</span>
              <span>${formatIDR(completedSale.total)}</span>
            </div>
          </div>

          <div class="border-b" style="font-size: 9px;">
            <div class="flex">
              <span>Tunai:</span>
              <span>${formatIDR(completedSale.paymentAmount)}</span>
            </div>
            <div class="flex">
              <span>Kembali:</span>
              <span>${formatIDR(completedSale.changeAmount)}</span>
            </div>
          </div>

          <div class="text-center mt-2" style="font-size: 8px; color: #78716c;">
            <p style="margin: 0;">Terima Kasih atas Kunjungan Anda!</p>
            <p style="margin: 2px 0 0 0;">Struk belanja sah.</p>
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
        setIsPrinting(false);
      }, 1000);
    }, 500);
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6 h-[calc(100vh-140px)] relative">
      
      {/* Mobile View Selector Tabs */}
      <div className="flex lg:hidden bg-white p-1 rounded-xl border border-bento-border/50 shadow-sm shrink-0 gap-1">
        <button
          onClick={() => setActiveMobileTab("menu")}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeMobileTab === "menu"
              ? "bg-bento-orange text-white shadow-xs"
              : "text-bento-text-muted hover:text-bento-text hover:bg-stone-50"
          }`}
        >
          Daftar Menu Makanan
        </button>
        <button
          onClick={() => setActiveMobileTab("cart")}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 relative ${
            activeMobileTab === "cart"
              ? "bg-bento-orange text-white shadow-xs"
              : "text-bento-text-muted hover:text-bento-text hover:bg-stone-50"
          }`}
        >
          Keranjang Penjualan
          {cart.length > 0 && (
            <span className="bg-bento-red text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
              {cart.reduce((sum, i) => sum + i.quantity, 0)}
            </span>
          )}
        </button>
      </div>
      
      {/* LEFT PANEL: Menu & Product Filter - 7 Cols */}
      <div className={`lg:col-span-7 flex-col justify-between h-full space-y-4 overflow-hidden ${activeMobileTab === "menu" ? "flex" : "hidden lg:flex"}`}>
        {/* Top Control Bar: Search & Category */}
        <div className="bg-white p-4 rounded-2xl border border-bento-border shadow-md space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-bento-text-muted" />
            <input
              type="text"
              id="pos-product-search"
              placeholder="Cari menu crispy, ala carte, minuman..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-bento-light-yellow/30 border border-bento-border rounded-xl focus:outline-none focus:ring-2 focus:ring-bento-orange/20 focus:border-bento-orange text-sm font-bold text-bento-text placeholder:text-bento-text-muted/60"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                id={`pos-cat-${cat.replace(/\s+/g, "-")}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-bento-orange text-white border border-bento-orange shadow-xs"
                    : "bg-bento-light-yellow text-bento-text-muted hover:text-bento-text border border-bento-border/40"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid Panel */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filteredProducts.map((prod) => {
                const isOutOfStock = isProductOutOfStock(prod);
                return (
                  <div
                    key={prod.id}
                    id={`pos-product-${prod.id}`}
                    onClick={() => !isOutOfStock && handleAddToCart(prod)}
                    className={`bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between relative overflow-hidden group p-3 ${
                      isOutOfStock
                        ? "border-bento-border/50 opacity-60 cursor-not-allowed"
                        : "border-bento-border/80 hover:border-bento-orange hover:shadow-lg hover:shadow-orange-950/5 cursor-pointer active:scale-[0.98]"
                    }`}
                  >
                    {/* Thumbnail Image */}
                    <div className="relative w-full h-32 rounded-xl overflow-hidden bg-bento-light-yellow/30 border border-bento-border/40">
                      <img
                        src={prod.image || "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=300&auto=format&fit=crop&q=80"}
                        alt={prod.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      {/* Tag Category */}
                      <span className="absolute top-2 left-2 bg-bento-maroon/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs border border-bento-gold/30">
                        {prod.category}
                      </span>
                      {/* Out of Stock Overlays */}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-bento-text/75 flex flex-col items-center justify-center text-center p-2 backdrop-blur-xs">
                          <span className="bg-bento-red text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {!prod.isAvailable ? "Habis" : "Bahan Kosong"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Metadata info */}
                    <div className="mt-3">
                      <h4 className="text-xs font-extrabold text-bento-text line-clamp-1 leading-snug group-hover:text-bento-maroon transition-colors">
                        {prod.name}
                      </h4>
                      <p className="text-sm font-black text-bento-red mt-1">
                        {formatIDR(prod.price)}
                      </p>
                    </div>

                    {/* Quick Add floating indicator */}
                    {!isOutOfStock && (
                      <div className="absolute bottom-2 right-2 bg-bento-orange text-white p-1.5 rounded-lg transition-all shadow-md group-hover:bg-bento-maroon">
                        <Plus className="w-4 h-4 font-black" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-bento-border bg-bento-light-yellow/20">
              <p className="text-bento-text-muted text-sm font-semibold italic">Tidak ada produk Fried Chicken yang cocok dengan filter.</p>
            </div>
          )}
        </div>

        {/* Floating Cart Button for mobile */}
        {cart.length > 0 && (
          <button
            onClick={() => setActiveMobileTab("cart")}
            className="lg:hidden w-full bg-bento-maroon text-white py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-between shadow-lg hover:bg-bento-maroon/90 cursor-pointer shrink-0 border border-white/10"
          >
            <span className="flex items-center gap-2">
              <span className="bg-bento-gold text-bento-maroon font-black text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                {cart.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
              <span>Lihat Keranjang Belanja</span>
            </span>
            <span className="font-extrabold text-bento-gold">
              {formatIDR(total)} →
            </span>
          </button>
        )}
      </div>

      {/* RIGHT PANEL: Shopping Cart - 5 Cols */}
      <div id="pos-shopping-cart" className={`lg:col-span-5 bg-white rounded-2xl border border-bento-border shadow-md flex-col justify-between h-full overflow-hidden ${activeMobileTab === "cart" ? "flex" : "hidden lg:flex"}`}>
        {/* Cart Header */}
        <div className="p-4 border-b border-bento-border/50 flex justify-between items-center bg-bento-light-yellow">
          <div>
            <h3 className="font-extrabold text-bento-header text-sm">Keranjang Penjualan</h3>
            <p className="text-[10px] text-bento-text-muted font-bold">Nota: {cashierName || "Kasir Utama"}</p>
          </div>
          {cart.length > 0 && (
            <button
              id="pos-clear-cart-btn"
              onClick={handleClearCart}
              className="text-bento-text-muted hover:text-bento-red p-2 rounded-lg hover:bg-bento-light-orange/50 transition-colors cursor-pointer"
              title="Kosongkan Keranjang"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length > 0 ? (
            cart.map((item) => (
              <div
                key={item.product.id}
                id={`cart-item-${item.product.id}`}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-bento-border/40 bg-bento-light-accent group"
              >
                {/* Product Pic */}
                <img
                  src={item.product.image || "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=300&auto=format&fit=crop&q=80"}
                  alt={item.product.name}
                  className="w-10 h-10 object-cover rounded-lg border border-bento-border"
                  referrerPolicy="no-referrer"
                />
                {/* Product details */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-bento-text truncate">{item.product.name}</p>
                  <p className="text-xs text-bento-red font-black mt-0.5">{formatIDR(item.product.price)}</p>
                </div>

                {/* Plus Minus Quantity controllers */}
                <div className="flex items-center gap-1 bg-white border border-bento-border/60 rounded-lg p-1 shadow-xs">
                  <button
                    id={`cart-btn-dec-${item.product.id}`}
                    onClick={() => handleRemoveOneFromCart(item.product)}
                    className="p-1 text-bento-text-muted hover:text-bento-red hover:bg-bento-light-yellow rounded-md transition-colors cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-extrabold px-2 text-bento-text text-center min-w-[20px]">
                    {item.quantity}
                  </span>
                  <button
                    id={`cart-btn-inc-${item.product.id}`}
                    onClick={() => handleAddToCart(item.product)}
                    className="p-1 text-bento-text-muted hover:text-bento-red hover:bg-bento-light-yellow rounded-md transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Subtotal Item & Delete trash */}
                <div className="text-right flex flex-col justify-between h-full items-end min-w-[70px]">
                  <p className="text-xs font-black text-bento-text">
                    {formatIDR(item.product.price * item.quantity)}
                  </p>
                  <button
                    id={`cart-btn-del-${item.product.id}`}
                    onClick={() => handleRemoveProductFromCart(item.product.id)}
                    className="text-bento-text-muted/40 hover:text-bento-red transition-colors mt-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <div className="bg-bento-light-yellow p-4 rounded-full text-bento-orange mb-3 border border-bento-border/50">
                <Receipt className="w-10 h-10" />
              </div>
              <h5 className="text-sm font-bold text-bento-text">Keranjang Belanja Kosong</h5>
              <p className="text-xs text-bento-text-muted mt-1 max-w-[200px] font-semibold">Silakan klik menu makanan di samping kiri untuk memesan.</p>
            </div>
          )}
        </div>

        {/* Checkout Summaries Panel */}
        <div className="p-4 border-t border-bento-border/40 bg-bento-light-yellow/70 space-y-4">
          <div className="space-y-1.5 text-xs font-bold text-bento-text-muted">
            <div className="flex justify-between text-bento-text font-black text-sm border-t border-dashed border-bento-border/60 pt-2 mt-2">
              <span>Total Tagihan</span>
              <span className="text-bento-red font-black text-base">{formatIDR(total)}</span>
            </div>
          </div>

          {/* Pay Button Action */}
          <button
            id="pos-pay-btn"
            disabled={cart.length === 0}
            onClick={handleOpenPayModal}
            className={`w-full py-3.5 rounded-xl font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg transition-all ${
              cart.length > 0
                ? "bg-bento-orange hover:bg-bento-orange-hover text-white shadow-orange-950/20 cursor-pointer active:scale-[0.99]"
                : "bg-stone-200 text-stone-400 cursor-not-allowed shadow-none"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Lanjut Pembayaran (Bayar)
          </button>
        </div>
      </div>

      {/* POPUP MODAL 1: Payment Cash Input Form */}
      {isPayModalOpen && (
        <div id="payment-modal" className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-bento-border animate-in fade-in duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-bento-border/50 flex justify-between items-center bg-bento-light-yellow">
              <h4 className="font-extrabold text-bento-header text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-bento-orange" />
                Selesaikan Pembayaran
              </h4>
              <button
                id="close-pay-modal"
                onClick={() => setIsPayModalOpen(false)}
                className="text-bento-text-muted hover:text-bento-red hover:bg-bento-light-orange/50 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleProcessCheckout} className="p-6 space-y-5 bg-white">
              {/* Bill display */}
              <div className="bg-bento-light-orange border border-bento-border/60 rounded-2xl p-4 flex justify-between items-center shadow-xs">
                <div>
                  <p className="text-xs font-bold text-bento-text-muted uppercase tracking-wider">Total Tagihan</p>
                  <h5 className="text-2xl font-black text-bento-red mt-1">{formatIDR(total)}</h5>
                </div>
                <span className="bg-bento-maroon text-bento-gold text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border border-bento-gold/30">
                  Cashier POS
                </span>
              </div>

              {/* Cash input field */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-bento-text block">Jumlah Uang Diterima (Cash)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-sm font-black text-bento-text-muted">Rp</span>
                  <input
                    type="number"
                    id="cash-received-input"
                    required
                    placeholder="Masukkan nominal uang tunai..."
                    value={cashAmount}
                    onChange={(e) => {
                      const val = e.target.value === "" ? "" : Number(e.target.value);
                      setCashAmount(val);
                      setPaymentError("");
                    }}
                    className="w-full pl-11 pr-4 py-2.5 bg-bento-light-yellow/30 border border-bento-border rounded-xl focus:outline-none focus:ring-2 focus:ring-bento-orange/20 focus:border-bento-orange text-base font-black text-bento-text"
                  />
                </div>
              </div>

              {/* Quick Cash selections buttons */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-bento-text-muted uppercase tracking-wider">Uang Pas & Denominasi Cepat</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    id="quick-cash-pas"
                    onClick={() => handleFastCash(total)}
                    className="py-2 px-2 border border-bento-border hover:border-bento-orange hover:bg-bento-light-orange rounded-xl text-xs font-bold text-bento-text cursor-pointer transition-all duration-200"
                  >
                    Uang Pas
                  </button>
                  {[20000, 50000, 100000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      id={`quick-cash-${amt}`}
                      onClick={() => handleFastCash(amt)}
                      className="py-2 px-2 border border-bento-border hover:border-bento-orange hover:bg-bento-light-orange rounded-xl text-xs font-bold text-bento-text cursor-pointer transition-all duration-200"
                    >
                      {formatIDR(amt)}
                    </button>
                  ))}
                  {[150000, 200000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      id={`quick-cash-${amt}`}
                      onClick={() => handleFastCash(amt)}
                      className="py-2 px-2 border border-bento-border hover:border-bento-orange hover:bg-bento-light-orange rounded-xl text-xs font-bold text-bento-text cursor-pointer transition-all duration-200"
                    >
                      {formatIDR(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Return Change calculation box */}
              {cashAmount !== "" && Number(cashAmount) >= total && (
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 flex justify-between items-center shadow-xs">
                  <div>
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Uang Kembalian</p>
                    <h5 className="text-xl font-extrabold text-emerald-700 mt-0.5">
                      {formatIDR(Number(cashAmount) - total)}
                    </h5>
                  </div>
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
              )}

              {/* Error warning notification */}
              {paymentError && (
                <div id="payment-error-msg" className="bg-bento-light-orange text-bento-red p-3 rounded-xl border border-bento-border text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-bento-red" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Buttons footer */}
              <div className="flex gap-3 border-t border-bento-border/50 pt-4 mt-2">
                <button
                  type="button"
                  id="cancel-checkout-btn"
                  onClick={() => setIsPayModalOpen(false)}
                  className="flex-1 py-3 bg-bento-light-yellow hover:bg-bento-light-orange rounded-xl text-xs font-bold text-bento-text border border-bento-border/50 cursor-pointer transition-all duration-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="confirm-payment-btn"
                  disabled={cashAmount === "" || Number(cashAmount) < total}
                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all tracking-wider ${
                    cashAmount !== "" && Number(cashAmount) >= total
                      ? "bg-bento-orange hover:bg-bento-orange-hover text-white shadow-md shadow-orange-950/10 cursor-pointer"
                      : "bg-stone-200 text-stone-400 cursor-not-allowed"
                  }`}
                >
                  Konfirmasi Bayar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL 2: Receipt thermal paper display */}
      {isReceiptOpen && completedSale && (
        <div id="receipt-modal" className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="max-w-sm w-full bg-bento-light-yellow rounded-3xl p-6 shadow-2xl border border-bento-border relative animate-in zoom-in-95 duration-200">
            
            {/* Ticket roll header simulation card */}
            <div className="bg-white p-5 rounded-2xl border border-bento-border shadow-sm flex flex-col items-center">
              {/* Brand icon */}
              <div className="w-12 h-12 bg-bento-maroon text-bento-gold rounded-full flex items-center justify-center font-bold text-lg shadow-md shadow-orange-900/20 mb-3 border border-bento-gold/30">
                <Sparkles className="w-6 h-6 text-bento-gold" />
              </div>
              <h4 className="font-black text-bento-text text-center tracking-tight uppercase">{getStoreSettings().storeName}</h4>
              <p className="text-[10px] text-bento-orange font-extrabold tracking-widest uppercase">{getStoreSettings().storeTagline}</p>
              <p className="text-[9px] text-bento-text-muted mt-1 text-center">{getStoreSettings().storeAddress}</p>
              {getStoreSettings().storePhone && <p className="text-[9px] text-bento-text-muted">Telp: {getStoreSettings().storePhone}</p>}

              {/* Separator */}
              <div className="w-full border-b border-dashed border-bento-border/60 my-4"></div>

              {/* Invoice Metadata */}
              <div className="w-full space-y-1 text-[10px] font-mono text-bento-text-muted">
                <div className="flex justify-between">
                  <span>Nota No:</span>
                  <span className="font-bold text-bento-text">{completedSale.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span className="text-bento-text">{new Date(completedSale.date).toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span className="text-bento-text">{completedSale.cashierName}</span>
                </div>
              </div>

              {/* Separator */}
              <div className="w-full border-b border-dashed border-bento-border/60 my-4"></div>

              {/* Items Table */}
              <div className="w-full space-y-3">
                {completedSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start gap-4 text-[10px] font-mono text-bento-text">
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold truncate">{item.productName}</p>
                      <p className="text-bento-text-muted text-[9px] mt-0.5 font-semibold">
                        {item.quantity} x {formatIDR(item.price)}
                      </p>
                    </div>
                    <span className="font-bold text-bento-text">{formatIDR(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Separator */}
              <div className="w-full border-b border-dashed border-bento-border/60 my-4"></div>

              {/* Pricing Totals */}
              <div className="w-full space-y-1 text-[10px] font-mono text-bento-text">
                <div className="flex justify-between text-xs font-black text-bento-text border-t border-dashed border-bento-border pt-1.5 mt-1.5">
                  <span>Total Tagihan:</span>
                  <span className="text-bento-red text-sm font-black">{formatIDR(completedSale.total)}</span>
                </div>
                <div className="flex justify-between mt-1 text-bento-text-muted">
                  <span>Tunai (Cash):</span>
                  <span>{formatIDR(completedSale.paymentAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Kembalian:</span>
                  <span>{formatIDR(completedSale.changeAmount)}</span>
                </div>
              </div>

              {/* Separator */}
              <div className="w-full border-b border-dashed border-bento-border/60 my-4"></div>

              {/* Footer Greetings */}
              <p className="text-[10px] font-bold text-bento-text text-center uppercase tracking-wider">Terima Kasih!</p>
              <p className="text-[9px] text-bento-text-muted mt-1 text-center font-medium">Nikmati kelezatan ayam goreng krispi kami di lain waktu.</p>
            </div>

            {/* Print Action button options */}
            <div className="flex gap-3 mt-4">
              <button
                id="receipt-print-btn"
                onClick={handleSimulatePrint}
                disabled={isPrinting}
                className="flex-1 py-2.5 bg-bento-maroon hover:bg-bento-maroon-hover text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-bento-gold" />
                {isPrinting ? "Mencetak..." : "Cetak Struk"}
              </button>
              <button
                id="receipt-new-trans-btn"
                onClick={() => {
                  setIsReceiptOpen(false);
                  setCompletedSale(null);
                }}
                className="flex-1 py-2.5 bg-bento-orange hover:bg-bento-orange-hover text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
