import { Bahan, ResepRow, SalesRow } from '../../../../packages/shared/src/index';

const KEYS = {
  bahan: 'cogs_bahan',
  resep: 'cogs_resep',
  sales: 'cogs_sales',
};

export const Store = {
  loadBahan(): Bahan[] { const raw = localStorage.getItem(KEYS.bahan); return raw? JSON.parse(raw): []; },
  saveBahan(rows: Bahan[]){ localStorage.setItem(KEYS.bahan, JSON.stringify(rows)); },
  loadResep(): ResepRow[] { const raw = localStorage.getItem(KEYS.resep); return raw? JSON.parse(raw): []; },
  saveResep(rows: ResepRow[]){ localStorage.setItem(KEYS.resep, JSON.stringify(rows)); },
  loadSales(): SalesRow[] { const raw = localStorage.getItem(KEYS.sales); return raw? JSON.parse(raw): []; },
  saveSales(rows: SalesRow[]){ localStorage.setItem(KEYS.sales, JSON.stringify(rows)); },
};
