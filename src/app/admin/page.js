'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SuperAdminPainel from '@/components/SuperAdminPainel';

export default function AdminPage() {
  const router = useRouter();
  const [sessaoAdmin, setSessaoAdmin] = useState(null);
  const [temaNoturno, setTemaNoturno] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sessionData = localStorage.getItem('bessa_session');
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        if (parsed.role === 'super_admin') {
          setSessaoAdmin(parsed);
        } else {
          router.push('/');
        }
      } catch (e) {
        router.push('/');
      }
    } else {
      router.push('/');
    }
    setIsLoading(false);
  }, [router]);

  const fazerLogout = () => {
    localStorage.removeItem('bessa_session');
    localStorage.removeItem('arox_session_id');
    window.location.href = '/';
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-zinc-500 font-mono text-sm">Validando credenciais de acesso seguro...</div>;
  if (!sessaoAdmin) return null;

  return (
    <SuperAdminPainel 
      fazerLogout={fazerLogout} 
      temaNoturno={temaNoturno} 
      setTemaNoturno={setTemaNoturno} 
      sessaoAdmin={sessaoAdmin} 
    />
  );
}