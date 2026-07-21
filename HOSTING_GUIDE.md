# Panduan Lengkap Hosting Aplikasi BFC Geprek Aruji

Dokumen ini menjelaskan langkah-demi-langkah cara meng-online-kan (hosting) sistem **BFC Geprek Aruji** agar dapat diakses dari mana saja (HP Kasir, Laptop Owner, Tablet Admin) menggunakan internet.

Sistem BFC Geprek Aruji adalah aplikasi **Full-Stack (React + Node.js Express + MySQL)**. Ada 3 opsi utama untuk meng-online-kan aplikasi jenis ini:

---

## 📌 Daftar Isi
1. [Opsi 1: Menggunakan VPS (Sangat Direkomendasikan)](#-opsi-1-menggunakan-vps-sangat-direkomendasikan)
2. [Opsi 2: Menggunakan Shared Hosting cPanel (Setup Node.js App)](#-opsi-2-menggunakan-shared-hosting-cpanel-setup-nodejs-app)
3. [Opsi 3: Menggunakan Platform Cloud Modern (PaaS)](#-opsi-3-menggunakan-platform-cloud-modern-paas)
4. [Langkah Penting Setelah Hosting Aktif](#-langkah-penting-setelah-hosting-aktif)

---

## 🚀 Opsi 1: Menggunakan VPS (Sangat Direkomendasikan)
VPS (seperti Niagahoster, Hostinger, DigitalOcean, AWS, dll.) memberi Anda kontrol penuh. Ini adalah cara paling stabil dan berkinerja tinggi untuk aplikasi Node.js.

### Langkah-langkah:
1.  **Persiapkan Server VPS**:
    *   Sewa VPS dengan OS Linux (direkomendasikan **Ubuntu Server 22.04 / 24.04 LTS**).
    *   Masuk ke VPS melalui SSH menggunakan terminal komputer Anda:
        ```bash
        ssh root@ip_address_vps_anda
        ```

2.  **Install Node.js & MySQL di VPS**:
    *   Update sistem & install Node.js:
        ```bash
        sudo apt update && sudo apt upgrade -y
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
        ```
    *   Install server MySQL:
        ```bash
        sudo apt install mysql-server -y
        ```
    *   Amankan MySQL dan buat database serta user baru:
        ```bash
        sudo mysql
        # Di dalam MySQL prompt, jalankan:
        CREATE DATABASE chickenpos_db;
        CREATE USER 'bfc_user'@'localhost' IDENTIFIED BY 'PasswordRahasia123';
        GRANT ALL PRIVILEGES ON chickenpos_db.* TO 'bfc_user'@'localhost';
        FLUSH PRIVILEGES;
        EXIT;
        ```

3.  **Unggah Berkas Aplikasi**:
    *   Kompres file proyek Anda ke dalam format `.zip` (abaikan folder `node_modules` agar ringan).
    *   Unggah ke VPS menggunakan SCP, FileZilla, atau klon via Git.
    *   Ekstrak file tersebut di VPS (misalnya di folder `/var/www/bfc-geprek`).

4.  **Konfigurasi File Lingkungan (`.env`)**:
    *   Buat file `.env` di folder utama aplikasi Anda di VPS:
        ```env
        PORT=3000
        NODE_ENV=production
        DB_HOST=localhost
        DB_PORT=3306
        DB_USER=bfc_user
        DB_PASSWORD=PasswordRahasia123
        DB_NAME=chickenpos_db
        ```

5.  **Build dan Jalankan Aplikasi**:
    *   Install dependencies & compile kode produksi:
        ```bash
        npm install
        npm run build
        ```
    *   Gunakan **PM2** (Process Manager untuk Node.js) agar server tetap hidup 24 jam meskipun terminal ditutup:
        ```bash
        sudo npm install -g pm2
        pm2 start dist/server.cjs --name "bfc-geprek"
        pm2 save
        pm2 startup
        ```

6.  **Konfigurasi Domain & Nginx (Web Server)**:
    *   Hubungkan domain/subdomain Anda (misal: `kasir.bfcgeprek.com`) ke IP VPS Anda lewat DNS management.
    *   Install Nginx sebagai Reverse Proxy agar aplikasi bisa diakses via port 80/443 standar:
        ```bash
        sudo apt install nginx -y
        ```
    *   Buat konfigurasi server Nginx:
        ```bash
        sudo nano /etc/nginx/sites-available/bfc-geprek
        ```
        Isi konfigurasinya:
        ```nginx
        server {
            listen 80;
            server_name kasir.bfcgeprek.com;

            location / {
                proxy_pass http://localhost:3000;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_cache_bypass $http_upgrade;
            }
        }
        ```
    *   Aktifkan konfigurasi & restart Nginx:
        ```bash
        sudo ln -s /etc/nginx/sites-available/bfc-geprek /etc/nginx/sites-enabled/
        sudo systemctl restart nginx
        ```
    *   Pasang SSL gratis dari Let's Encrypt agar aman (HTTPS):
        ```bash
        sudo apt install certbot python3-certbot-nginx -y
        sudo certbot --nginx -d kasir.bfcgeprek.com
        ```

---

## 📂 Opsi 2: Menggunakan Shared Hosting cPanel (Setup Node.js App)
Beberapa provider cloud/shared hosting (Hostinger, Niagahoster, DomaiNesia, dll.) menyediakan menu **"Setup Node.js App"** di cPanel mereka.

### Langkah-langkah:
1.  **Buat Database MySQL di cPanel**:
    *   Masuk ke cPanel Anda.
    *   Pilih menu **MySQL® Database Wizard**.
    *   Buat database (misalnya: `user_bfc_db`), buat user database, lalu catat username, nama database, dan password-nya.

2.  **Buat Aplikasi Node.js di cPanel**:
    *   Cari dan klik menu **Setup Node.js App** di cPanel.
    *   Klik **Create Application**.
    *   Tentukan:
        *   **Node.js version**: Pilih versi 18 atau 20.
        *   **Application Mode**: Production.
        *   **Application root**: Nama folder tempat berkas diunggah (misal: `bfc-app`).
        *   **Application URL**: Pilih subdomain atau domain Anda.
        *   **Application startup file**: Isi dengan `dist/server.cjs` (atau arahkan ke file server utama).
    *   Klik **Create**.

3.  **Unggah File Aplikasi**:
    *   Di komputer lokal Anda, jalankan `npm run build` untuk menghasilkan folder `dist/` dan file compiled server.
    *   Kompres seluruh folder proyek Anda (termasuk folder `dist/`, `package.json`, `.env.example`, dll. tetapi **JANGAN sertakan `node_modules`**) menjadi file `.zip`.
    *   Buka cPanel **File Manager**, masuk ke folder application root (`bfc-app`), lalu unggah dan ekstrak file `.zip` tersebut di sana.

4.  **Konfigurasi File `.env`**:
    *   Di cPanel File Manager, edit atau buat file `.env` di dalam folder aplikasi (`bfc-app`):
        ```env
        PORT=3000
        NODE_ENV=production
        DB_HOST=127.0.0.1
        DB_PORT=3306
        DB_USER=username_database_cpanel
        DB_PASSWORD=password_database_cpanel
        DB_NAME=nama_database_cpanel
        ```

5.  **Install npm Package & Jalankan**:
    *   Kembali ke menu **Setup Node.js App** di cPanel.
    *   Klik **Edit** pada aplikasi Anda.
    *   Klik tombol **Run NPM Install** untuk memasang semua dependencies secara otomatis di server.
    *   Setelah instalasi selesai, klik **Restart Application**.
    *   Sistem Anda sekarang online dan siap diakses melalui domain Anda!

---

## ☁️ Opsi 3: Menggunakan Platform Cloud Modern (PaaS)
Jika Anda menginginkan proses deploy yang cepat tanpa ribet mengkonfigurasi server Linux, Anda dapat menggunakan platform cloud berbasis container/git.

*   **Platform Rekomendasi**: **Railway.app**, **Render.com**, **Fly.io**, atau **Heroku**.
*   **Database**: Anda dapat menggunakan database cloud terkelola (Managed MySQL) yang disediakan langsung oleh platform tersebut.

### Langkah-langkah Umum:
1.  **Hubungkan ke GitHub**:
    *   Simpan/upload kode proyek Anda ke repositori pribadi di GitHub.
2.  **Buat Project Baru di PaaS**:
    *   Masuk ke Railway atau Render menggunakan akun GitHub Anda.
    *   Pilih **New Project** -> Hubungkan ke repositori GitHub proyek ini.
3.  **Konfigurasi Variabel Lingkungan (Environment Variables)**:
    *   PaaS menyediakan tab **Variables** atau **Environment**. Masukkan variabel seperti `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, dan `GEMINI_API_KEY`.
4.  **Build Command & Start Command**:
    *   Platform akan secara otomatis mendeteksi file `package.json`.
    *   Pastikan build command diatur ke: `npm run build`
    *   Start command diatur ke: `npm start`
5.  **Deploy**:
    *   Platform akan melakukan proses kompilasi dan meluncurkan aplikasi Anda dalam hitungan menit secara otomatis!

---

## 🔒 Langkah Penting Setelah Hosting Aktif
1.  **Ganti Password Admin Default**:
    *   Masuk pertama kali menggunakan akun `superadmin` dengan sandi default `admin123`.
    *   Masuk ke menu **Pengaturan**, buat akun superadmin pribadi baru atau ubah sandi bawaan demi keamanan.
2.  **Inisialisasi Tabel**:
    *   Masuk ke menu **Manajemen SQL (Database)** di sidebar sebelah kiri jika diaktifkan.
    *   Klik tombol **Inisialisasi Tabel Basis Data (MySQL)** untuk memigrasikan semua skema tabel produk, bahan, transaksi, pengeluaran, dan wastage pertama kali secara bersih di database hosting Anda.
