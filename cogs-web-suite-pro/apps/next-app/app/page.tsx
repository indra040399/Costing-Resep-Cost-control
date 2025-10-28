'use client';
import Link from 'next/link';
export default function Home(){
  return (<div className="grid gap-3"><Link className="underline" href="/login">Login</Link><Link className="underline" href="/dashboard">Dashboard</Link><Link className="underline" href="/master">Master</Link><Link className="underline" href="/resep">Resep</Link><Link className="underline" href="/penjualan">Penjualan</Link></div>);
}
