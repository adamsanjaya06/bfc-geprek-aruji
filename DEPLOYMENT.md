# Panduan Lengkap Penggunaan & Aktivasi Sistem BFC Geprek Aruji

Dokumen ini berisi panduan teknis lengkap cara memulai, menjalankan, mengkonfigurasi, dan mendeploy aplikasi **BFC Geprek Aruji** (Sistem POS & Keuangan Outlet BFC Geprek Aruji - Berkah Fried Chicken) Anda yang baru.

---

## 📌 Daftar Isi
1. [Arsitektur Sistem](#-arsitektur-sistem)
2. [Cara Menjalankan di Localhost (Komputer Sendiri)](#-cara-menjalankan-di-localhost-komputer-sendiri)
3. [Panduan Integrasi Database MySQL](#-panduan-integrasi-database-mysql)
4. [Cara Registrasi & Akun Bawaan Luring](#-cara-registrasi--akun-bawaan-luring)
5. [Panduan Cetak Nota & Laporan](#-panduan-cetak-nota--laporan)
6. [Opsi Deploy ke Cloud (Production Server)](#-opsi-deploy-ke-cloud-production-server)

---

## 🏗️ Arsitektur Sistem

Aplikasi BFC Geprek Aruji dibangun dengan teknologi modern berkemampuan tinggi:
*   **Frontend**: Single Page Application (SPA) berbasis **React 18** + **Vite** + **Tailwind CSS**. Desain menggunakan layout Bento Grid yang estetik, responsif, dan ramah di mata.
*   **Backend & API**: Server **Node.js + Express** (`server.ts`) yang mengatur manajemen basis data MySQL dan autentikasi.
*   **Database**: Mendukung relasi penuh basis data **MySQL**. Aplikasi juga dilengkapi dengan mekanisme **Simulasi Penyimpanan Mandiri (Offline LocalStorage Engine)**. Jika koneksi backend/MySQL terputus, sistem secara otomatis beralih ke mode offline, sehingga transaksi di kasir tidak akan terganggu.

---

## 💻 Cara Menjalankan di Localhost (Komputer Sendiri)

Untuk menjalankan BFC Geprek Aruji di komputer lokal Anda, ikuti langkah-langkah mudah berikut:

### Prasyarat:
1.  **Node.js**: Pastikan komputer Anda sudah terinstall **Node.js** (Rekomendasi versi 18 ke atas) untuk menjalankan engine server React/Express.
2.  **XAMPP (Opsional)**: Jika ingin menggunakan database MySQL secara offline lokal, Anda bisa menggunakan **XAMPP** sebagai penyedia server database MySQL.

---

### 🛠️ Langkah-langkah Lengkap Menjalankan dengan XAMPP & Node.js:

#### Langkah 1: Setup Database MySQL di XAMPP
1.  Buka **XAMPP Control Panel**.
2.  Klik tombol **Start** pada modul **MySQL** (Modul Apache tidak wajib dijalankan karena sistem Node.js kita akan membuat servernya sendiri di port 3000, namun Anda boleh mengaktifkannya jika mau).
3.  Buka browser Anda dan akses **`http://localhost/phpmyadmin`**.
4.  Buat database baru dengan mengklik menu **New** di sebelah kiri, beri nama database: **`chickenpos_db`**, lalu klik **Create**. (Tidak perlu membuat tabel secara manual, server Node.js kita akan membuatkannya secara otomatis!).

#### Langkah 2: Konfigurasi File Lingkungan (`.env`)
1.  Buka berkas bernama `.env` di folder utama proyek ChickenPOS Anda (jika belum ada, buat file baru dengan nama `.env`).
2.  Masukkan konfigurasi kredensial MySQL XAMPP Anda seperti ini:
    ```env
    DB_HOST=localhost
    DB_PORT=3306
    DB_USER=root
    DB_PASSWORD=
    DB_NAME=chickenpos_db
    ```
    *(Catatan: Secara default bawaan XAMPP, `DB_USER` adalah `root` dan `DB_PASSWORD` dikosongkan).*

#### Langkah 3: Menginstal Pustaka & Menjalankan Server Node.js
1.  Buka aplikasi **Terminal**, **Command Prompt (CMD)**, atau **PowerShell** di komputer Anda.
2.  Arahkan ke folder tempat Anda mengekstrak berkas BFC Geprek Aruji ini (contoh perintah terminal: `cd C:\xampp\htdocs\bfc-geprek-aruji`).
3.  Jalankan perintah berikut untuk mengunduh pustaka-pustaka pendukung sistem:
    ```bash
    npm install
    ```
4.  Setelah selesai, jalankan perintah ini untuk mengaktifkan sistem kasir BFC Geprek Aruji Anda:
    ```bash
    npm run dev
    ```
5.  Sistem akan mendeteksi MySQL di XAMPP Anda yang aktif, membangun seluruh tabel database secara otomatis, dan menjalankan aplikasi di alamat: **`http://localhost:3000`**.
6.  Buka browser Anda, kunjungi **`http://localhost:3000`**, dan sistem kasir yang andal siap digunakan!

---

## 🗄️ Panduan Integrasi Database MySQL

Secara bawaan, BFC Geprek Aruji menyertakan backend server yang siap dihubungkan langsung ke server basis data MySQL Anda.

### Cara Menghubungkan ke MySQL:
1.  Buka berkas konfigurasi lingkungan bernama `.env` (atau buat baru jika belum ada dengan meniru berkas contoh `.env.example`).
2.  Isi kredensial MySQL lokal Anda:
    ```env
    DB_HOST=localhost
    DB_PORT=3306
    DB_USER=root
    DB_PASSWORD=password_mysql_anda
    DB_NAME=chickenpos_db
    ```
3.  Simpan berkas `.env` tersebut.
4.  Jalankan server kembali (`npm run dev`). Server backend akan otomatis mendeteksi konfigurasi tersebut, membuat basis data, dan melakukan migrasi seluruh tabel (Produk, Bahan Baku, Riwayat Transaksi, Keuangan) secara otomatis.

> 💡 **INFO**: Jika Anda tidak menginstal MySQL, sistem akan tetap mendeteksi secara cerdas dan beralih ke penyelarasan **Offline Engine** menggunakan LocalStorage di browser. Data penjualan, menu, resep, dan pengaturan role tetap tersimpan aman di komputer lokal Anda.

---

## 👥 Cara Registrasi & Akun Bawaan Luring

Saat aplikasi pertama kali dibuka, Anda akan diarahkan ke halaman Login.

### 🔑 Akun Default Bawaan Sistem:
Sistem memiliki 3 akun bawaan dengan peran (role) berbeda:

| Username | Password | Role | Nama Lengkap | Kegunaan |
| :--- | :--- | :--- | :--- | :--- |
| **`superadmin`** | `admin123` | Superadmin | Adam Superadmin | Memiliki akses mutlak ke seluruh fitur sistem |
| **`kasir`** | `kasir123` | Kasir | Siti Kasir Utama | Hanya memiliki akses ke layar POS transaksi kasir |
| **`owner`** | `owner123` | Owner | Pak Hartono Owner | Hak akses untuk Dashboard, Riwayat, Keuangan & Laporan |

### ⚙️ Registrasi Pengguna & Role Baru:
Untuk mendaftarkan pengguna baru (misalnya menambah karyawan kasir):
1.  Masuk menggunakan akun **`superadmin`**.
2.  Pilih menu **Pengaturan** di sidebar sebelah kiri.
3.  Pada panel **Registrasi Pengguna & Hak Akses**, masukkan Nama Lengkap, Username, Kata Sandi, dan pilih Peran (Kasir / Owner / Superadmin).
4.  Klik **Simpan Akun Pengguna**.
5.  Akun baru tersebut sekarang dapat langsung digunakan untuk masuk (login) ke sistem, baik secara online maupun offline!

---

## 🖨️ Panduan Cetak Nota & Laporan

Sistem ini mendukung pencetakan fisik maupun penyimpanan digital (PDF) secara instan:

1.  **Cetak Nota Transaksi Kasir**:
    Setelah kasir memasukkan barang belanjaan, mengisi nominal bayar tunai, dan mengklik **Selesaikan & Cetak Nota**, jendela cetak browser akan otomatis terbuka. Anda dapat menghubungkan komputer Anda ke printer thermal (lebar 58mm atau 80mm) untuk langsung mencetak struk belanja kertas.
2.  **Reprint (Cetak Ulang) Nota**:
    Jika ingin mencetak ulang transaksi lama, masuk ke menu **Riwayat Penjualan**, temukan transaksi terkait, klik **Lihat Struk**, lalu klik tombol **Cetak Nota**. Sesuai instruksi Anda, informasi HPP/Modal bahan baku bersifat rahasia dan **tidak akan pernah muncul** di struk belanja pembeli.
3.  **Cetak Laporan Penjualan & Keuangan**:
    Pada menu **Riwayat Penjualan** dan **Keuangan & Laporan**, tersedia tombol **Cetak Laporan Penjualan** yang akan memformat data hasil filter rentang waktu dan kategori menjadi laporan berformat formal yang siap diprint atau disimpan sebagai berkas PDF.

---

## 🚀 Opsi Deploy ke Cloud (Production Server)

Jika Anda ingin sistem BFC Geprek Aruji ini dapat diakses oleh kasir atau owner dari luar toko melalui jaringan internet (smartphone, tablet, laptop di mana saja), Anda dapat mendeploy-nya ke server cloud.

Aplikasi BFC Geprek Aruji Anda dirancang siap saji untuk dideploy ke platform container **Cloud Run** menggunakan tombol **Deploy** di bilah kanan atas AI Studio Workspace Anda.

### Cara Produksi Build Manual:
Jika Anda ingin menyiapkannya di Virtual Private Server (VPS) mandiri:
1.  Lakukan kompilasi optimal frontend dan backend:
    ```bash
    npm run build
    ```
2.  Jalankan aplikasi mode produksi:
    ```bash
    npm start
    ```
    Aplikasi akan siap melayani transaksi pelanggan secara cepat, aman, dan tanpa kendala.

---

*Sistem POS ini dikembangkan khusus dengan performa prima, visual bento grid termutakhir, serta relasi data stok bahan baku yang responsif.*
