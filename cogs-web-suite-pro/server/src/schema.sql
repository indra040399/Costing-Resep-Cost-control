PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT, role TEXT);
CREATE TABLE IF NOT EXISTS bahan (id TEXT PRIMARY KEY, nama TEXT, kategori TEXT, satuanBeli TEXT, hargaBeli REAL, konversi REAL, satuanKecil TEXT, supplier TEXT, aktif INTEGER);
CREATE TABLE IF NOT EXISTS resep (menuId TEXT, bahanId TEXT, qty REAL, PRIMARY KEY(menuId,bahanId));
CREATE TABLE IF NOT EXISTS menu (id TEXT PRIMARY KEY, nama TEXT);
CREATE TABLE IF NOT EXISTS penjualan (id INTEGER PRIMARY KEY, bulan TEXT, outlet TEXT, menuId TEXT, qty INTEGER);
