'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
export default function Login(){
  const [username, setUsername] = useState('admin'); const [role, setRole] = useState<'viewer'|'admin'>('admin'); const router = useRouter();
  return (<div className="bg-white p-6 rounded-2xl shadow w-full max-w-sm">
    <h2 className="text-xl font-bold mb-4">Login</h2>
    <label className="block text-sm mb-1">Username</label>
    <input className="border rounded w-full p-2 mb-3" value={username} onChange={e=>setUsername(e.target.value)} />
    <label className="block text-sm mb-1">Role</label>
    <select className="border rounded w-full p-2 mb-4" value={role} onChange={e=>setRole(e.target.value as any)}><option value="viewer">viewer</option><option value="admin">admin</option></select>
    <button className="w-full py-2 rounded-xl bg-brand-700 text-white" onClick={()=>{ localStorage.setItem('cogs_user', JSON.stringify({username, role})); router.push('/dashboard'); }}>Masuk</button>
  </div>);
}
