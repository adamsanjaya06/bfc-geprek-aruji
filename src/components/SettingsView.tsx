/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Settings, 
  UserPlus, 
  Trash2, 
  Store, 
  Users, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle,
  Smartphone,
  MapPin,
  Lock,
  Tag
} from "lucide-react";
import { User } from "../types";
import { pushToBackend } from "../utils/db";

// Helper for store settings
export interface StoreSettings {
  storeName: string;
  storeTagline: string;
  storeAddress: string;
  storePhone: string;
}

export const getStoreSettings = (): StoreSettings => {
  const defaults = {
    storeName: "BFC Geprek Aruji",
    storeTagline: "Berkah Fried Chicken",
    storeAddress: "Jl. Paha Dada Krispi No. 99, Jakarta Barat",
    storePhone: "0812-3456-7890",
  };
  try {
    const saved = localStorage.getItem("pos_fc_settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.storeName === "ChickenPOS" || !parsed.storeName) {
        return defaults;
      }
      return { ...defaults, ...parsed };
    }
  } catch (err) {
    console.error("Gagal membaca pengaturan toko:", err);
  }
  return defaults;
};

export const saveStoreSettings = (settings: StoreSettings): void => {
  localStorage.setItem("pos_fc_settings", JSON.stringify(settings));
  pushToBackend(undefined, undefined, undefined, undefined, undefined, settings, undefined);
};

// Helper for users list
export const getStoredUsers = (): (User & { password?: string })[] => {
  const defaults = [
    { id: "user-1", username: "superadmin", password: "admin123", role: "superadmin" as const, name: "Adam Superadmin" },
    { id: "user-2", username: "kasir", password: "kasir123", role: "kasir" as const, name: "Siti Kasir Utama" },
    { id: "user-3", username: "owner", password: "owner123", role: "owner" as const, name: "Pak Hartono Owner" }
  ];
  try {
    const saved = localStorage.getItem("pos_fc_users");
    if (saved) return JSON.parse(saved);
    // If not saved yet, write defaults to local storage
    localStorage.setItem("pos_fc_users", JSON.stringify(defaults));
    return defaults;
  } catch (err) {
    console.error("Gagal membaca daftar pengguna:", err);
  }
  return defaults;
};

export const saveStoredUsers = (users: (User & { password?: string })[]): void => {
  localStorage.setItem("pos_fc_users", JSON.stringify(users));
  pushToBackend(undefined, undefined, undefined, undefined, undefined, undefined, users);
};

interface SettingsViewProps {
  onSettingsUpdate?: () => void;
}

export default function SettingsView({ onSettingsUpdate }: SettingsViewProps) {
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(getStoreSettings());
  const [users, setUsers] = useState<(User & { password?: string })[]>(getStoredUsers());

  // Form states for new user
  const [newUsername, setNewUsername] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<User["role"]>("kasir");

  // Status feedback
  const [storeError, setStoreError] = useState("");
  const [storeSuccess, setStoreSuccess] = useState("");
  const [userError, setUserError] = useState("");
  const [userSuccess, setUserSuccess] = useState("");

  // Store profile handler
  const handleSaveStoreSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setStoreError("");
    setStoreSuccess("");

    if (!storeSettings.storeName.trim()) {
      setStoreError("Nama toko tidak boleh kosong!");
      return;
    }

    saveStoreSettings(storeSettings);
    setStoreSuccess("Profil informasi toko berhasil diperbarui!");
    if (onSettingsUpdate) {
      onSettingsUpdate();
    }
    setTimeout(() => setStoreSuccess(""), 3000);
  };

  // Add User handler
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserError("");
    setUserSuccess("");

    if (!newUsername.trim() || !newName.trim() || !newPassword.trim()) {
      setUserError("Semua kolom isian pengguna wajib diisi!");
      return;
    }

    // Check unique username
    const usernameExists = users.some(u => u.username.toLowerCase() === newUsername.trim().toLowerCase());
    if (usernameExists) {
      setUserError("Username sudah terdaftar! Gunakan nama username yang lain.");
      return;
    }

    const newUser = {
      id: `user-${Date.now()}`,
      username: newUsername.trim().toLowerCase(),
      password: newPassword.trim(),
      name: newName.trim(),
      role: newRole,
    };

    const updatedUsers = [...users, newUser];
    saveStoredUsers(updatedUsers);
    setUsers(updatedUsers);

    // Reset Form
    setNewUsername("");
    setNewName("");
    setNewPassword("");
    setNewRole("kasir");

    setUserSuccess("Akun pengguna baru berhasil ditambahkan!");
    setTimeout(() => setUserSuccess(""), 3000);
  };

  // Delete User handler
  const handleDeleteUser = (id: string, username: string) => {
    if (username === "superadmin") {
      alert("Akun superadmin bawaan sistem tidak boleh dihapus demi keamanan!");
      return;
    }
    if (window.confirm(`Apakah Anda yakin ingin menghapus pengguna '${username}'?`)) {
      const updatedUsers = users.filter(u => u.id !== id);
      saveStoredUsers(updatedUsers);
      setUsers(updatedUsers);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-bento-border shadow-md">
        <div>
          <h2 className="text-2xl font-extrabold text-bento-header tracking-tight flex items-center gap-2">
            <Settings className="w-7 h-7 text-bento-orange" />
            Pengaturan Sistem & Toko
          </h2>
          <p className="text-sm text-bento-text-muted">Kelola identitas outlet fried chicken, tambahkan akun kasir, role pengguna, dan konfigurasi lainnya.</p>
        </div>
      </div>

      {/* Grid: Store Settings & User Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Store Information */}
        <div className="bg-white p-6 rounded-2xl border border-bento-border shadow-md flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center gap-2 pb-3 border-b border-bento-border">
              <Store className="w-5 h-5 text-bento-orange" />
              <div>
                <h3 className="font-extrabold text-bento-header text-base">Identitas & Informasi Toko</h3>
                <p className="text-xs text-bento-text-muted">Detail ini akan tercetak otomatis pada struk belanja pelanggan dan laporan keuangan.</p>
              </div>
            </div>

            <form onSubmit={handleSaveStoreSettings} className="space-y-4">
              {/* Store Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-bento-text block">Nama Toko / Outlet</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-bento-text-muted text-xs">
                    <Store className="w-4 h-4 text-bento-text-muted" />
                  </span>
                  <input
                    type="text"
                    value={storeSettings.storeName}
                    onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                    placeholder="Contoh: ChickenPOS Premium"
                    className="w-full pl-9 pr-4 py-2.5 bg-bento-light-yellow/20 border border-bento-border rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-bento-orange"
                  />
                </div>
              </div>

              {/* Store Slogan / Tagline */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-bento-text block">Tagline / Keterangan Singkat</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-bento-text-muted text-xs">
                    <Tag className="w-4 h-4 text-bento-text-muted" />
                  </span>
                  <input
                    type="text"
                    value={storeSettings.storeTagline}
                    onChange={(e) => setStoreSettings({ ...storeSettings, storeTagline: e.target.value })}
                    placeholder="Contoh: Fried Chicken & Diner Legendaris"
                    className="w-full pl-9 pr-4 py-2.5 bg-bento-light-yellow/20 border border-bento-border rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-bento-orange"
                  />
                </div>
              </div>

              {/* Store Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-bento-text block">Alamat Outlet Lengkap</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-bento-text-muted text-xs">
                    <MapPin className="w-4 h-4 text-bento-text-muted" />
                  </span>
                  <input
                    type="text"
                    value={storeSettings.storeAddress}
                    onChange={(e) => setStoreSettings({ ...storeSettings, storeAddress: e.target.value })}
                    placeholder="Contoh: Jl. Raya Paha Dada No. 89, Jakarta Barat"
                    className="w-full pl-9 pr-4 py-2.5 bg-bento-light-yellow/20 border border-bento-border rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-bento-orange"
                  />
                </div>
              </div>

              {/* Store Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-bento-text block">No. Telepon / WhatsApp</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-bento-text-muted text-xs">
                    <Smartphone className="w-4 h-4 text-bento-text-muted" />
                  </span>
                  <input
                    type="text"
                    value={storeSettings.storePhone}
                    onChange={(e) => setStoreSettings({ ...storeSettings, storePhone: e.target.value })}
                    placeholder="Contoh: 0812-3456-7890"
                    className="w-full pl-9 pr-4 py-2.5 bg-bento-light-yellow/20 border border-bento-border rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-bento-orange"
                  />
                </div>
              </div>

              {storeError && (
                <div className="p-3 bg-red-50 text-bento-red text-xs font-semibold rounded-xl border border-red-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-bento-red shrink-0" />
                  <span>{storeError}</span>
                </div>
              )}

              {storeSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{storeSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-bento-orange hover:bg-bento-orange-hover text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer active:scale-[0.99] flex items-center justify-center gap-2"
              >
                Simpan Profil Outlet
              </button>
            </form>
          </div>
        </div>

        {/* Card 2: User Account & Role Management */}
        <div className="bg-white p-6 rounded-2xl border border-bento-border shadow-md flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center gap-2 pb-3 border-b border-bento-border">
              <Users className="w-5 h-5 text-bento-orange" />
              <div>
                <h3 className="font-extrabold text-bento-header text-base">Registrasi Pengguna & Hak Akses (Role)</h3>
                <p className="text-xs text-bento-text-muted">Tambah akun karyawan baru, tentukan hak akses sebagai Kasir, Owner, atau Superadmin.</p>
              </div>
            </div>

            {/* User addition form */}
            <form onSubmit={handleAddUser} className="space-y-4 mb-6 p-4 bg-bento-light-accent border border-bento-border/50 rounded-2xl">
              <h4 className="font-bold text-xs text-bento-text uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-bento-orange" />
                Tambah Pengguna Baru
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-bento-text-muted block">Nama Lengkap</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Contoh: Budi Cahyono"
                    className="w-full px-3 py-1.5 bg-white border border-bento-border rounded-xl text-xs font-bold focus:outline-none"
                  />
                </div>

                {/* Username */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-bento-text-muted block">Username Login</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Contoh: budi_kasir"
                    className="w-full px-3 py-1.5 bg-white border border-bento-border rounded-xl text-xs font-bold focus:outline-none"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-bento-text-muted block">Kata Sandi (Password)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5">
                      <Lock className="w-3.5 h-3.5 text-stone-400" />
                    </span>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Sandi login..."
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-bento-border rounded-xl text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Role selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-bento-text-muted block">Hak Akses Sistem</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-white border border-bento-border rounded-xl text-xs font-bold focus:outline-none"
                  >
                    <option value="kasir">Kasir (Hanya POS)</option>
                    <option value="owner">Owner (Dashboard & Laporan)</option>
                    <option value="superadmin">Superadmin (Semua Fitur)</option>
                  </select>
                </div>
              </div>

              {userError && (
                <div className="p-2.5 bg-red-50 text-bento-red text-[11px] font-semibold rounded-xl border border-red-100 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-bento-red shrink-0" />
                  <span>{userError}</span>
                </div>
              )}

              {userSuccess && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 text-[11px] font-semibold rounded-xl border border-emerald-100 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{userSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                className="px-4 py-2 bg-bento-orange hover:bg-bento-orange-hover text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Simpan Akun Pengguna
              </button>
            </form>

            {/* List of existing users */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-bento-text-muted uppercase tracking-wider block mb-2">Akun Terdaftar ({users.length})</h4>
              <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-bento-light-yellow/30 border border-bento-border rounded-xl hover:border-bento-orange/40 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-bento-maroon/10 border border-bento-maroon/20 flex items-center justify-center text-bento-maroon font-black text-xs uppercase shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-bento-text">{u.name}</p>
                        <p className="text-[10px] text-bento-text-muted font-bold">
                          username: <span className="font-mono text-bento-text">{u.username}</span> • sandi: <span className="font-mono">{u.password || "●●●●●●"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${
                        u.role === "superadmin" ? "bg-purple-50 text-purple-700 border-purple-100" :
                        u.role === "owner" ? "bg-amber-50 text-amber-700 border-amber-100" :
                        "bg-blue-50 text-blue-700 border-blue-100"
                      }`}>
                        {u.role}
                      </span>
                      {u.username !== "superadmin" && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          className="p-1 text-bento-text-muted/50 hover:text-bento-red rounded-lg transition-colors cursor-pointer"
                          title="Hapus Karyawan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
