import './globals.css';
import React from 'react';

export default function RootLayout({children}:{children:React.ReactNode}){
  return (<html lang="id"><body className="bg-slate-50 text-slate-800"><div className="max-w-7xl mx-auto px-4 py-6"><h1 className="text-2xl font-bold mb-6">COGS Web (Next.js)</h1>{children}</div></body></html>);
}
