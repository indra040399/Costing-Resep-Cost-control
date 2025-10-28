import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const DB_PATH = process.env.DATABASE || './data.db';
const db = new Database(DB_PATH);
const schema = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf-8');
db.exec(schema);

// seed minimal menu
const menus = [['M001','Pancake Original'],['M002','Coffee Latte'],['M003','Cheese Toast'],['M004','Chocolate Cake'],['M005','Fried Egg'],['M006','Chocolate Drink'],['M007','Butter Croissant'],['M008','Spaghetti Bolognese']];
for (const [id,nama] of menus){ db.prepare('INSERT OR IGNORE INTO menu (id,nama) VALUES (?,?)').run(id,nama); }

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function auth(req, res, next){
  const header = req.headers.authorization||'';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if(!token) return res.status(401).json({error:'no token'});
  try{ req.user = jwt.verify(token, JWT_SECRET); next(); } catch(e){ return res.status(401).json({error:'invalid token'}); }
}

app.post('/auth/register', (req,res)=>{
  const {username, password, role='admin'} = req.body;
  if(!username||!password) return res.status(400).json({error:'username/password required'});
  const hash = bcrypt.hashSync(password, 10);
  try{
    db.prepare('INSERT INTO users (username,password,role) VALUES (?,?,?)').run(username, hash, role);
    return res.json({ok:true});
  }catch(e){ return res.status(400).json({error:'username exists'}); }
});

app.post('/auth/login', (req,res)=>{
  const {username,password} = req.body;
  const row = db.prepare('SELECT * FROM users WHERE username=?').get(username);
  if(!row) return res.status(401).json({error:'invalid'});
  if(!bcrypt.compareSync(password, row.password)) return res.status(401).json({error:'invalid'});
  const token = jwt.sign({id:row.id, username:row.username, role:row.role}, JWT_SECRET, {expiresIn:'8h'});
  return res.json({token});
});

// CRUD bahan
app.get('/bahan', auth, (req,res)=>{ res.json(db.prepare('SELECT * FROM bahan').all()); });
app.post('/bahan', auth, (req,res)=>{
  const {id,nama,kategori,satuanBeli,hargaBeli,konversi,satuanKecil,supplier,aktif} = req.body;
  db.prepare('INSERT OR REPLACE INTO bahan (id,nama,kategori,satuanBeli,hargaBeli,konversi,satuanKecil,supplier,aktif) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(id,nama,kategori,satuanBeli,hargaBeli,konversi,satuanKecil,supplier,aktif?1:0);
  res.json({ok:true});
});
app.delete('/bahan/:id', auth, (req,res)=>{ db.prepare('DELETE FROM bahan WHERE id=?').run(req.params.id); res.json({ok:true}); });

// CRUD resep
app.get('/resep', auth, (req,res)=>{ res.json(db.prepare('SELECT * FROM resep').all()); });
app.post('/resep', auth, (req,res)=>{
  const {menuId,bahanId,qty} = req.body;
  db.prepare('INSERT OR REPLACE INTO resep (menuId,bahanId,qty) VALUES (?,?,?)').run(menuId,bahanId,qty);
  res.json({ok:true});
});
app.delete('/resep', auth, (req,res)=>{ const {menuId,bahanId} = req.body; db.prepare('DELETE FROM resep WHERE menuId=? AND bahanId=?').run(menuId,bahanId); res.json({ok:true}); });

// penjualan
app.get('/penjualan', auth, (req,res)=>{ res.json(db.prepare('SELECT * FROM penjualan').all()); });
app.post('/penjualan/import', auth, (req,res)=>{
  const rows = req.body.rows||[];
  const insert = db.prepare('INSERT INTO penjualan (bulan,outlet,menuId,qty) VALUES (?,?,?,?)');
  const tx = db.transaction((items)=>{ for (const it of items) insert.run(it.bulan, it.outlet, it.menuId, it.qty); });
  tx(rows);
  res.json({ok:true, inserted: rows.length});
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=> console.log('Server running on http://localhost:'+PORT));
