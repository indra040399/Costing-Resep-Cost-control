import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import {
  Bahan, ResepRow, SalesRow,
  seedBahan as seedBahanDefault, seedMenus, seedResep as seedResepDefault, seedPricing, seedSales, computeCosting, CURRENCY, outlets, months,
  validateBahanCSV, validateResepCSV, validatePenjualanCSV
} from '../../../../packages/shared/src/index';
import { Store } from './store';

type Role = 'viewer'|'admin';
type User = { username:string; role:Role };

const COLORS = ['#60a5fa','#34d399','#fbbf24','#f87171','#a78bfa','#fb7185','#2dd4bf','#f59e0b'];

function Login({onLogin}:{onLogin:(u:User)=>void}){
  const [username,setUsername]=useState('admin'); const [role,setRole]=useState<Role>('admin');
  return (
    <div className="min-h-screen grid place-items-center bg-brand-50">
      <div className="bg-white p-6 rounded-2xl shadow w-full max-w-sm border">
        <div className="text-brand-700 font-bold text-xl mb-4">COGS Web</div>
        <label className="block text-sm mb-1">Username</label>
        <input className="border rounded w-full p-2 mb-3" value={username} onChange={e=>setUsername(e.target.value)}/>
        <label className="block text-sm mb-1">Role</label>
        <select className="border rounded w-full p-2 mb-4" value={role} onChange={e=>setRole(e.target.value as Role)}>
          <option value="viewer">viewer</option>
          <option value="admin">admin</option>
        </select>
        <button onClick={()=>onLogin({username, role})} className="w-full py-2 rounded-xl bg-brand-700 text-white">Login</button>
      </div>
    </div>
  );
}

export default function App(){
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<'dashboard'|'master'|'resep'|'penjualan'|'import'>('dashboard');
  const [filterOutlet, setFilterOutlet] = useState('');
  const [filterBulan, setFilterBulan] = useState('');

  // data state with persistence
  const [bahan, setBahan] = useState<Bahan[]>([]);
  const [resep, setResep]   = useState<ResepRow[]>([]);
  const [sales, setSales]   = useState<SalesRow[]>([]);

  useEffect(()=>{
    const u = localStorage.getItem('cogs_user'); if(u) setUser(JSON.parse(u));
    const b = Store.loadBahan(); const r = Store.loadResep(); const s = Store.loadSales();
    setBahan(b.length? b: seedBahanDefault);
    setResep(r.length? r: seedResepDefault);
    setSales(s.length? s: seedSales());
  },[]);

  useEffect(()=>{ Store.saveBahan(bahan); },[bahan]);
  useEffect(()=>{ Store.saveResep(resep); },[resep]);
  useEffect(()=>{ Store.saveSales(sales); },[sales]);

  if(!user){ return <Login onLogin={(u)=>{ localStorage.setItem('cogs_user', JSON.stringify(u)); setUser(u); }}/>; }

  const { rows: costing, priceIndex } = useMemo(()=>computeCosting(bahan, resep, seedPricing),[bahan, resep]);
  const enriched = useMemo(()=> sales.map(s=>{
    const p = priceIndex[s.menuId]; const hargaJual=p?.hargaJual||0; const hpp=p?.hpp||0;
    const totalPenjualan = s.qty * hargaJual; const totalHPP = s.qty * hpp; const laba = totalPenjualan-totalHPP;
    return {...s, hargaJual, hpp, totalPenjualan, totalHPP, laba};
  }),[sales, priceIndex]);
  const filtered = useMemo(()=> enriched.filter(r => (!filterOutlet || r.outlet===filterOutlet) && (!filterBulan || r.bulan===filterBulan)),[enriched, filterOutlet, filterBulan]);

  const KPI = useMemo(()=>{
    const s = filtered.reduce((acc,r)=>{acc.sales+=r.totalPenjualan; acc.hpp+=r.totalHPP; acc.laba+=r.laba; return acc;},{sales:0,hpp:0,laba:0});
    return { totalSales:s.sales, totalHPP:s.hpp, labaKotor:s.laba, margin: s.sales===0?0:s.laba/s.sales };
  },[filtered]);

  // CRUD helpers (admin only)
  const canEdit = user.role==='admin';
  function addBahan(row:Bahan){ setBahan(prev=>[...prev, row]); }
  function deleteBahan(id:string){ setBahan(prev=>prev.filter(b=>b.id!==id)); }
  function addResep(row:ResepRow){ setResep(prev=>[...prev, row]); }
  function deleteResep(menuId:string, bahanId:string){ setResep(prev=>prev.filter(r=> !(r.menuId===menuId && r.bahanId===bahanId))); }

  // CSV importers with validation
  function handleCSV(kind:'bahan'|'resep'|'penjualan', file:File){
    Papa.parse(file, {
      header:true, skipEmptyLines:true,
      complete: (res)=>{
        const rows = res.data as any[];
        if(kind==='bahan'){
          const issues = validateBahanCSV(rows); if(issues.length){ alert('Error CSV Bahan. Contoh: Row '+issues[0].row+' '+issues[0].field+' '+issues[0].message); return; }
          const mapped: Bahan[] = rows.map(r=>({ id:r.BahanID, nama:r.NamaBahan, kategori:r.Kategori||'', satuanBeli:r.SatuanBeli, hargaBeli:Number(r.HargaBeli), konversi:Number(r.KonversiKeKecil), satuanKecil:r.SatuanKecil, supplier:r.Supplier||'', aktif:true }));
          setBahan(mapped);
        }else if(kind==='resep'){
          const issues = validateResepCSV(rows); if(issues.length){ alert('Error CSV Resep. Contoh: Row '+issues[0].row+' '+issues[0].field+' '+issues[0].message); return; }
          const mapped: ResepRow[] = rows.map(r=>({ menuId:r.MenuID, bahanId:r.BahanID, qty:Number(r.QtyResep) }));
          setResep(mapped);
        }else{
          const issues = validatePenjualanCSV(rows); if(issues.length){ alert('Error CSV Penjualan. Contoh: Row '+issues[0].row+' '+issues[0].field+' '+issues[0].message); return; }
          const mapped: SalesRow[] = rows.map(r=>({ bulan:r.Bulan, outlet:r.Outlet, menuId:r.MenuID, qty:Number(r.QtyTerjual) }));
          setSales(mapped);
        }
        alert('Import '+kind+' selesai.');
      }
    });
  }

  function exportExcel(){
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Penjualan_Filtered');
    XLSX.writeFile(wb, 'penjualan_filtered.xlsx');
  }

  return (
    <div className="min-h-screen bg-brand-50 text-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-700 grid place-items-center text-white font-bold">C</div>
            <h1 className="text-2xl font-bold">COGS Web</h1>
          </div>
          <div className="flex gap-2">
            {(['dashboard','master','resep','penjualan','import'] as const).map(t => (
              <button key={t} onClick={()=>setTab(t)} className={`px-3 py-2 rounded-xl text-sm border ${tab===t?'bg-brand-700 text-white':'bg-white hover:bg-brand-100'}`}>{t.toUpperCase()}</button>
            ))}
            <button onClick={()=>{localStorage.removeItem('cogs_user'); location.reload();}} className="px-3 py-2 rounded-xl text-sm border bg-white">Logout</button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-3 border">
            <div className="text-sm mb-1">Filter Outlet</div>
            <select className="w-full border rounded-lg p-2" value={filterOutlet} onChange={e=>setFilterOutlet(e.target.value)}>
              <option value="">Semua Outlet</option>
              {outlets.map(o=> <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="bg-white rounded-xl p-3 border">
            <div className="text-sm mb-1">Filter Bulan</div>
            <select className="w-full border rounded-lg p-2" value={filterBulan} onChange={e=>setFilterBulan(e.target.value)}>
              <option value="">Semua Bulan</option>
              {months.map(m=> <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="bg-white rounded-xl p-3 border flex items-center justify-between">
            <div><div className="text-xs uppercase text-slate-500">Avg Margin</div><div className="text-xl font-bold">{(KPI.margin*100).toFixed(1)}%</div></div>
            <div><div className="text-xs uppercase text-slate-500">Laba Kotor</div><div className="text-xl font-bold">{CURRENCY.format(KPI.labaKotor)}</div></div>
          </div>
        </div>

        {tab==='dashboard' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-2xl shadow p-5"><div className="text-sm text-slate-500">Total Sales</div><div className="text-2xl font-bold">{CURRENCY.format(KPI.totalSales)}</div></div>
              <div className="bg-white rounded-2xl shadow p-5"><div className="text-sm text-slate-500">Total HPP</div><div className="text-2xl font-bold">{CURRENCY.format(KPI.totalHPP)}</div></div>
              <div className="bg-white rounded-2xl shadow p-5"><div className="text-sm text-slate-500">Laba Kotor</div><div className="text-2xl font-bold">{CURRENCY.format(KPI.labaKotor)}</div></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section className="bg-white rounded-2xl shadow p-5"><div className="text-lg font-semibold mb-3">Penjualan per Outlet</div><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={
                Object.entries(filtered.reduce((a:any,r:any)=>{ a[r.outlet]=(a[r.outlet]||0)+r.totalPenjualan; return a; },{})).map(([outlet,sales]:any)=>({outlet, sales}))}><XAxis dataKey="outlet"/><YAxis/><Tooltip/><Bar dataKey="sales"/></BarChart></ResponsiveContainer></div></section>
              <section className="bg-white rounded-2xl shadow p-5"><div className="text-lg font-semibold mb-3">Margin% Bulanan</div><div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={
                Object.entries(filtered.reduce((a:any,r:any)=>{ const x=a[r.bulan]||{sales:0,laba:0}; x.sales+=r.totalPenjualan; x.laba+=r.laba; a[r.bulan]=x; return a; },{})).map(([bulan,v]:any)=>({bulan, margin: v.sales===0?0:v.laba/v.sales}))}><XAxis dataKey="bulan"/><YAxis/><Tooltip/><Line dataKey="margin"/></LineChart></ResponsiveContainer></div></section>
              <section className="bg-white rounded-2xl shadow p-5"><div className="text-lg font-semibold mb-3">Kontribusi Sales per Menu</div><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={
                Object.entries(filtered.reduce((a:any,r:any)=>{ a[r.menuId]=(a[r.menuId]||0)+r.totalPenjualan; return a; },{})).map(([menuId,sales]:any)=>({nama: seedMenus.find(m=>m.id===menuId)?.nama, sales}))} dataKey="sales" nameKey="nama" outerRadius={90}>{[...Array(8)].map((_,i)=>(<Cell key={i} fill={COLORS[i%COLORS.length]}/>))}</Pie><Legend/><Tooltip/></PieChart></ResponsiveContainer></div></section>
            </div>
          </>
        )}

        {tab==='master' && (
          <section className="bg-white rounded-2xl shadow p-5">
            <div className="flex items-center justify-between mb-3"><div className="text-lg font-semibold">Master Bahan (CRUD)</div>{canEdit && <AddBahan onAdd={addBahan}/>}</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead><tr className="text-left border-b"><th className="py-2 pr-3">Kode</th><th className="py-2 pr-3">Nama</th><th className="py-2 pr-3">Kategori</th><th className="py-2 pr-3">Harga Beli</th><th className="py-2 pr-3">Konversi</th><th className="py-2 pr-3">Harga/Satuan Kecil</th><th></th></tr></thead>
                <tbody>{bahan.map(b=> <tr key={b.id} className="border-b"><td className="py-2 pr-3">{b.id}</td><td className="py-2 pr-3">{b.nama}</td><td className="py-2 pr-3">{b.kategori}</td><td className="py-2 pr-3">{CURRENCY.format(b.hargaBeli)}</td><td className="py-2 pr-3">{b.konversi}</td><td className="py-2 pr-3">{CURRENCY.format(b.hargaBeli/b.konversi)}</td><td>{canEdit && <button onClick={()=>deleteBahan(b.id)} className="text-red-600">Hapus</button>}</td></tr>)}</tbody>
              </table>
            </div>
          </section>
        )}

        {tab==='resep' && (
          <section className="bg-white rounded-2xl shadow p-5">
            <div className="flex items-center justify-between mb-3"><div className="text-lg font-semibold">Resep (CRUD)</div>{canEdit && <AddResep onAdd={addResep}/>}</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead><tr className="text-left border-b"><th className="py-2 pr-3">Menu</th><th className="py-2 pr-3">Bahan</th><th className="py-2 pr-3">Qty</th><th></th></tr></thead>
                <tbody>{resep.map((r,idx)=> <tr key={idx} className="border-b"><td className="py-2 pr-3">{r.menuId}</td><td className="py-2 pr-3">{r.bahanId}</td><td className="py-2 pr-3">{r.qty}</td><td>{canEdit && <button onClick={()=>deleteResep(r.menuId, r.bahanId)} className="text-red-600">Hapus</button>}</td></tr>)}</tbody>
              </table>
            </div>

            <div className="mt-6">
              <div className="text-lg font-semibold mb-2">Resep Costing (Hitung)</div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead><tr className="text-left border-b"><th className="py-2 pr-3">Menu</th><th className="py-2 pr-3">Total Bahan</th><th className="py-2 pr-3">Overhead%</th><th className="py-2 pr-3">HPP</th><th className="py-2 pr-3">Markup%</th><th className="py-2 pr-3">Harga Jual</th><th className="py-2 pr-3">Margin%</th></tr></thead>
                  <tbody>{costing.map(r=> <tr key={r.menuId} className="border-b"><td className="py-2 pr-3">{r.nama}</td><td className="py-2 pr-3">{CURRENCY.format(r.totalBahan)}</td><td className="py-2 pr-3">{(r.overheadPct*100).toFixed(0)}%</td><td className="py-2 pr-3">{CURRENCY.format(r.hpp)}</td><td className="py-2 pr-3">{(r.markupPct*100).toFixed(0)}%</td><td className="py-2 pr-3">{CURRENCY.format(r.hargaJual)}</td><td className="py-2 pr-3">{(r.marginPct*100).toFixed(1)}%</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {tab==='penjualan' && (
          <section className="bg-white rounded-2xl shadow p-5">
            <div className="text-lg font-semibold mb-3">Penjualan (Filtered)</div>
            <div className="mb-3 flex gap-2">{canEdit && <button onClick={exportExcel} className="px-3 py-2 rounded-xl border bg-white">Export Excel</button>}</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead><tr className="text-left border-b"><th className="py-2 pr-3">Outlet</th><th className="py-2 pr-3">Bulan</th><th className="py-2 pr-3">Menu</th><th className="py-2 pr-3">Qty</th><th className="py-2 pr-3">Sales</th><th className="py-2 pr-3">HPP</th><th className="py-2 pr-3">Laba</th></tr></thead>
                <tbody>{filtered.slice(0,300).map((r, i)=>{ return <tr key={i} className="border-b"><td className="py-2 pr-3">{r.outlet}</td><td className="py-2 pr-3">{r.bulan}</td><td className="py-2 pr-3">{r.menuId}</td><td className="py-2 pr-3">{r.qty}</td><td className="py-2 pr-3">{CURRENCY.format(r.totalPenjualan)}</td><td className="py-2 pr-3">{CURRENCY.format(r.totalHPP)}</td><td className="py-2 pr-3">{CURRENCY.format(r.laba)}</td></tr>; })}</tbody>
              </table>
            </div>
          </section>
        )}

        {tab==='import' && (
          <section className="bg-white rounded-2xl shadow p-5">
            <div className="text-lg font-semibold mb-3">Import CSV (multi) & Export</div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><div className="mb-1 font-medium">Master_Bahan.csv</div><input type="file" accept=".csv" onChange={e=>{ const f=e.target.files?.[0]; if(f) handleCSV('bahan', f); }}/></div>
              <div><div className="mb-1 font-medium">Master_Resep.csv</div><input type="file" accept=".csv" onChange={e=>{ const f=e.target.files?.[0]; if(f) handleCSV('resep', f); }}/></div>
              <div><div className="mb-1 font-medium">Penjualan.csv</div><input type="file" accept=".csv" onChange={e=>{ const f=e.target.files?.[0]; if(f) handleCSV('penjualan', f); }}/></div>
            </div>
            <div className="text-sm text-slate-500 mt-3">Format minimal: <code>Bahan: BahanID,NamaBahan,SatuanBeli,HargaBeli,KonversiKeKecil,SatuanKecil</code> | <code>Resep: MenuID,BahanID,QtyResep</code> | <code>Penjualan: Bulan,Outlet,MenuID,QtyTerjual</code></div>
          </section>
        )}

        <div className="text-xs text-slate-500 mt-8">Role: <b>{user.role}</b>. CRUD & ekspor hanya untuk admin. © {new Date().getFullYear()} — Tema brand modern.</div>
      </div>
    </div>
  );
}

function AddBahan({onAdd}:{onAdd:(b:any)=>void}){
  const [form, setForm] = useState({id:'', nama:'', kategori:'Bahan Kering', satuanBeli:'kg', hargaBeli:0, konversi:1, satuanKecil:'gram', supplier:'', aktif:true});
  return (
    <div className="flex items-end gap-2">
      {['id','nama','kategori','satuanBeli','satuanKecil','supplier'].map(k=> <input key={k} placeholder={k} className="border rounded p-1 text-sm" value={(form as any)[k]} onChange={e=>setForm({...form, [k]: e.target.value})} />)}
      <input placeholder="hargaBeli" type="number" className="border rounded p-1 text-sm w-28" value={form.hargaBeli} onChange={e=>setForm({...form, hargaBeli:Number(e.target.value)})} />
      <input placeholder="konversi" type="number" className="border rounded p-1 text-sm w-24" value={form.konversi} onChange={e=>setForm({...form, konversi:Number(e.target.value)})} />
      <button onClick={()=>{ if(!form.id||!form.nama){ alert('Kode & Nama wajib'); return; } onAdd(form); }} className="px-3 py-2 rounded-xl bg-brand-700 text-white text-sm">Tambah</button>
    </div>
  );
}
function AddResep({onAdd}:{onAdd:(r:ResepRow)=>void}){
  const [form, setForm] = useState<ResepRow>({menuId:'M001', bahanId:'B001', qty:1});
  return (
    <div className="flex items-end gap-2">
      <input className="border rounded p-1 text-sm" value={form.menuId} onChange={e=>setForm({...form, menuId:e.target.value})} placeholder="MenuID" />
      <input className="border rounded p-1 text-sm" value={form.bahanId} onChange={e=>setForm({...form, bahanId:e.target.value})} placeholder="BahanID" />
      <input type="number" className="border rounded p-1 text-sm w-24" value={form.qty} onChange={e=>setForm({...form, qty:Number(e.target.value)})} placeholder="Qty" />
      <button onClick={()=>{ if(!form.menuId||!form.bahanId||!form.qty){ alert('Lengkapi data'); return; } onAdd(form); }} className="px-3 py-2 rounded-xl bg-brand-700 text-white text-sm">Tambah</button>
    </div>
  );
}
