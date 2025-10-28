# COGS Web Suite PRO
Fitur lengkap:
- **Persisten**: localStorage (client-side)
- **CRUD**: Master Bahan & Resep
- **Import Multi-CSV**: Master_Bahan, Master_Resep, Penjualan (+validasi)
- **Export Excel**
- **Backend Ringan**: Node/Express + SQLite + JWT (opsional)
- **Tema/Branding**: Tailwind custom color `brand`

## Struktur
- `packages/shared` → tipe data, seed, fungsi costing, validator CSV
- `apps/vite-app` → React + Vite (UI utama, CRUD, CSV, export, login demo)
- `apps/next-app` → Next.js (halaman terpisah)
- `server` → Express + SQLite + JWT (auth dan API CRUD)

## Jalankan Vite App
```bash
cd apps/vite-app
npm i
npm run dev
# build:
npm run build && npm run preview
```

## Jalankan Next App
```bash
cd apps/next-app
npm i
npm run dev
# build:
npm run build && npm start
```

## Jalankan Backend (opsional)
```bash
cd server
cp .env.example .env   # set JWT_SECRET bila perlu
npm i
npm run dev
# Daftarkan user:
curl -X POST http://localhost:4000/auth/register -H 'Content-Type: application/json' -d '{ "username":"admin", "password":"admin", "role":"admin" }'
# Login untuk dapat token:
curl -X POST http://localhost:4000/auth/login -H 'Content-Type: application/json' -d '{ "username":"admin", "password":"admin" }'
```

> Client saat ini berjalan sepenuhnya di browser dengan localStorage. Integrasi ke backend bisa ditambahkan pada aksi CRUD (fetch ke API `/bahan`, `/resep`, `/penjualan/import`) menggunakan Bearer token JWT.

## CSV Format Minimal
- **Master_Bahan.csv**: `BahanID,NamaBahan,SatuanBeli,HargaBeli,KonversiKeKecil,SatuanKecil[,Kategori,Supplier]`
- **Master_Resep.csv**: `MenuID,BahanID,QtyResep`
- **Penjualan.csv**: `Bulan,Outlet,MenuID,QtyTerjual`

## Branding
- Warna utama: `brand-700 #0369a1`, aksen: `brand-500 #0ea5e9`.
- Ganti logo bundar huruf **C** di header sesuai brand Anda.
