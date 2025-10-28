export type Bahan = { id:string; nama:string; kategori:string; satuanBeli:string; hargaBeli:number; konversi:number; satuanKecil:string; supplier:string; aktif:boolean };
export type Menu = { id:string; nama:string };
export type ResepRow = { menuId:string; bahanId:string; qty:number };
export type Pricing = { overhead:number; markup:number };
export type SalesRow = { bulan:string; outlet:string; menuId:string; qty:number };

export const seedBahan: Bahan[] = [
  { id:'B001', nama:'Tepung Terigu', kategori:'Bahan Kering', satuanBeli:'kg', hargaBeli:150000, konversi:1000, satuanKecil:'gram', supplier:'Supplier A', aktif:true },
  { id:'B002', nama:'Gula Pasir', kategori:'Bahan Kering', satuanBeli:'kg', hargaBeli:120000, konversi:1000, satuanKecil:'gram', supplier:'Supplier A', aktif:true },
  { id:'B003', nama:'Susu Cair', kategori:'Susu', satuanBeli:'liter', hargaBeli:20000, konversi:1000, satuanKecil:'ml', supplier:'Supplier B', aktif:true },
  { id:'B004', nama:'Telur', kategori:'Protein', satuanBeli:'tray', hargaBeli:36000, konversi:30, satuanKecil:'butir', supplier:'Supplier C', aktif:true },
  { id:'B005', nama:'Mentega', kategori:'Lemak', satuanBeli:'kg', hargaBeli:90000, konversi:1000, satuanKecil:'gram', supplier:'Supplier A', aktif:true },
  { id:'B006', nama:'Keju', kategori:'Dairy', satuanBeli:'kg', hargaBeli:180000, konversi:1000, satuanKecil:'gram', supplier:'Supplier B', aktif:true },
  { id:'B007', nama:'Coklat Bubuk', kategori:'Bahan Kering', satuanBeli:'kg', hargaBeli:220000, konversi:1000, satuanKecil:'gram', supplier:'Supplier D', aktif:true },
  { id:'B008', nama:'Air', kategori:'Lainnya', satuanBeli:'liter', hargaBeli:5000, konversi:1000, satuanKecil:'ml', supplier:'Supplier Local', aktif:true },
  { id:'B009', nama:'Ragi', kategori:'Bahan Kering', satuanBeli:'pack', hargaBeli:5000, konversi:10, satuanKecil:'gram', supplier:'Supplier E', aktif:true },
  { id:'B010', nama:'Garam', kategori:'Bumbu', satuanBeli:'kg', hargaBeli:8000, konversi:1000, satuanKecil:'gram', supplier:'Supplier F', aktif:true },
];

export const seedMenus: Menu[] = [
  { id:'M001', nama:'Pancake Original' }, { id:'M002', nama:'Coffee Latte' },
  { id:'M003', nama:'Cheese Toast' }, { id:'M004', nama:'Chocolate Cake' },
  { id:'M005', nama:'Fried Egg' }, { id:'M006', nama:'Chocolate Drink' },
  { id:'M007', nama:'Butter Croissant' }, { id:'M008', nama:'Spaghetti Bolognese' },
];

export const seedResep: ResepRow[] = [
  { menuId:'M001', bahanId:'B001', qty:150 }, { menuId:'M001', bahanId:'B003', qty:200 }, { menuId:'M001', bahanId:'B004', qty:1 },
  { menuId:'M002', bahanId:'B003', qty:150 }, { menuId:'M002', bahanId:'B008', qty:30 },
  { menuId:'M003', bahanId:'B005', qty:10 }, { menuId:'M003', bahanId:'B006', qty:30 },
  { menuId:'M004', bahanId:'B001', qty:200 }, { menuId:'M004', bahanId:'B007', qty:50 },
  { menuId:'M005', bahanId:'B004', qty:2 },
  { menuId:'M006', bahanId:'B007', qty:25 }, { menuId:'M006', bahanId:'B003', qty:150 },
  { menuId:'M007', bahanId:'B001', qty:120 }, { menuId:'M007', bahanId:'B005', qty:15 },
  { menuId:'M008', bahanId:'B001', qty:100 }, { menuId:'M008', bahanId:'B010', qty:5 }, { menuId:'M008', bahanId:'B004', qty:1 },
];

export const seedPricing: Record<string, Pricing> = Object.fromEntries(seedMenus.map(m=>[m.id, {overhead:0.10, markup:0.60}]));
export const outlets = ['Outlet A','Outlet B','Outlet C','Outlet D','Outlet E'];
export const months = Array.from({length:12}, (_,i)=>{
  const d = new Date(2025, i, 1);
  return d.toISOString().slice(0,7);
});
export const CURRENCY = new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR' });
export const hargaPerUnit = (b:Bahan)=> b.hargaBeli / b.konversi;

export function computeCosting(bahan: Bahan[]=seedBahan, resep: ResepRow[]=seedResep, pricing: Record<string, Pricing>=seedPricing) {
  const indexBahan = Object.fromEntries(bahan.map(b=>[b.id, b]));
  const totalCost: Record<string,number> = {};
  for (const r of resep){
    const b = indexBahan[r.bahanId]; if(!b) continue;
    totalCost[r.menuId] = (totalCost[r.menuId]||0) + hargaPerUnit(b)*r.qty;
  }
  const rows = seedMenus.map(m=>{
    const bahanCost = totalCost[m.id]||0;
    const overheadPct = (pricing[m.id]?.overhead) ?? 0;
    const markupPct = (pricing[m.id]?.markup) ?? 0;
    const overhead = bahanCost*overheadPct;
    const hpp = bahanCost+overhead;
    const hargaJual = hpp*(1+markupPct);
    const marginRp = hargaJual - hpp;
    const marginPct = hargaJual===0?0:marginRp/hargaJual;
    return { menuId:m.id, nama:m.nama, totalBahan:bahanCost, overheadPct, overhead, hpp, markupPct, hargaJual, marginRp, marginPct };
  });
  const priceIndex = Object.fromEntries(rows.map(r=>[r.menuId, r]));
  return { rows, priceIndex };
}

// --- CSV validation helpers ---
export type ValidationIssue = { row:number; field:string; message:string };
export function validateBahanCSV(rows:any[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const required = ['BahanID','NamaBahan','SatuanBeli','HargaBeli','KonversiKeKecil','SatuanKecil'];
  rows.forEach((r,i)=>{
    for(const f of required){ if(r[f]===undefined || r[f]==='') issues.push({row:i+2, field:f, message:'wajib diisi'}); }
    if(r.HargaBeli && isNaN(Number(r.HargaBeli))) issues.push({row:i+2, field:'HargaBeli', message:'harus numerik'});
    if(r.KonversiKeKecil && isNaN(Number(r.KonversiKeKecil))) issues.push({row:i+2, field:'KonversiKeKecil', message:'harus numerik'});
  });
  return issues;
}
export function validateResepCSV(rows:any[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const required = ['MenuID','BahanID','QtyResep'];
  rows.forEach((r,i)=>{
    for(const f of required){ if(r[f]===undefined || r[f]==='') issues.push({row:i+2, field:f, message:'wajib diisi'}); }
    if(r.QtyResep && isNaN(Number(r.QtyResep))) issues.push({row:i+2, field:'QtyResep', message:'harus numerik'});
  });
  return issues;
}
export function validatePenjualanCSV(rows:any[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const required = ['Bulan','Outlet','MenuID','QtyTerjual'];
  rows.forEach((r,i)=>{
    for(const f of required){ if(r[f]===undefined || r[f]==='') issues.push({row:i+2, field:f, message:'wajib diisi'}); }
    if(r.QtyTerjual && isNaN(Number(r.QtyTerjual))) issues.push({row:i+2, field:'QtyTerjual', message:'harus numerik'});
  });
  return issues;
}
