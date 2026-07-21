import React, { useState } from "react";
import { motion } from "motion/react";
import { Lock, User, Drumstick, ArrowRight, ShieldCheck, ShoppingCart, BarChart3, AlertCircle } from "lucide-react";
import { User as UserType } from "../types";
import { getStoreSettings } from "./SettingsView";

interface LoginViewProps {
  onLoginSuccess: (user: UserType) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const storeSettings = getStoreSettings();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        onLoginSuccess(data.user);
      } else {
        setErrorMessage(data.message || "Gagal masuk. Periksa kembali username & password.");
      }
    } catch (err) {
      // Fallback if backend is booting or offline (Read custom user accounts from local database)
      let presets = [
        { id: "user-1", username: "superadmin", password: "admin123", role: "superadmin" as const, name: "Adam Superadmin" },
        { id: "user-2", username: "kasir", password: "kasir123", role: "kasir" as const, name: "Siti Kasir Utama" },
        { id: "user-3", username: "owner", password: "owner123", role: "owner" as const, name: "Pak Hartono Owner" }
      ];

      try {
        const saved = localStorage.getItem("pos_fc_users");
        if (saved) {
          presets = JSON.parse(saved);
        }
      } catch (e) {
        console.error("Gagal membaca luring pos_fc_users:", e);
      }

      const matched = presets.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password);
      if (matched) {
        onLoginSuccess({
          id: matched.id,
          username: matched.username,
          name: matched.name,
          role: matched.role
        });
      } else {
        setErrorMessage("Kredensial login luring salah atau pengguna belum terdaftar.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (role: "superadmin" | "kasir" | "owner") => {
    if (role === "superadmin") {
      setUsername("superadmin");
      setPassword("admin123");
    } else if (role === "kasir") {
      setUsername("kasir");
      setPassword("kasir123");
    } else if (role === "owner") {
      setUsername("owner");
      setPassword("owner123");
    }
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen bg-bento-bg flex flex-col justify-center items-center p-6 select-none relative overflow-hidden">
      {/* Background ambient light effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-bento-orange/5 rounded-full blur-3xl -translate-y-12"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-bento-maroon/5 rounded-full blur-3xl translate-y-12"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-white border border-bento-border shadow-2xl rounded-3xl overflow-hidden p-8 z-10 relative"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-bento-maroon text-bento-gold p-4 rounded-2xl shadow-xl shadow-orange-950/10 mb-4 border border-white/10">
            <Drumstick className="w-8 h-8 text-bento-gold" />
          </div>
          <h2 className="text-2xl font-black text-bento-header tracking-tight">{storeSettings.storeName}</h2>
          <p className="text-[11px] text-bento-text-muted mt-1 font-bold uppercase tracking-widest">
            {storeSettings.storeTagline}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-bento-text block">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-bento-text-muted absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                id="login-username"
                placeholder="Masukkan username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-bento-light-yellow/20 border border-bento-border rounded-xl focus:outline-none focus:ring-2 focus:ring-bento-orange/20 focus:border-bento-orange text-xs font-bold text-bento-text placeholder:text-bento-text-muted/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-bento-text block">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-bento-text-muted absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                id="login-password"
                placeholder="Masukkan password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-bento-light-yellow/20 border border-bento-border rounded-xl focus:outline-none focus:ring-2 focus:ring-bento-orange/20 focus:border-bento-orange text-xs font-bold text-bento-text placeholder:text-bento-text-muted/50"
              />
            </div>
          </div>

          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              id="login-error-message"
              className="bg-bento-light-orange border border-bento-border p-3.5 rounded-xl text-xs font-bold text-bento-red flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-bento-red" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          <button
            type="submit"
            id="login-submit-btn"
            disabled={isLoading}
            className="w-full py-3.5 bg-bento-orange hover:bg-bento-orange-hover text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-950/10 cursor-pointer transition-all duration-200 active:scale-[0.99] disabled:opacity-50"
          >
            {isLoading ? "Memproses..." : "Masuk ke Aplikasi"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 text-center text-[10px] font-bold text-bento-text-muted">
          <span>ChickenPOS v1.0.0 • Sistem Informasi Kasir Terenkripsi</span>
        </div>
      </motion.div>
    </div>
  );
}
