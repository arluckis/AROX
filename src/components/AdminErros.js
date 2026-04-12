'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminErros({ temaNoturno, onFechar }) {
  const [erros, setErros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataPrazo, setDataPrazo] = useState('');
  const [erroSelecionado, setErroSelecionado] = useState(null);

  useEffect(() => { fetchErros(); }, []);

  const fetchErros = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('status_erros').select('*').order('atualizado_em', { ascending: false });
    if (!error && data) setErros(data);
    setLoading(false);
  };

  const atualizarStatus = async (codigo, statusAtual) => {
    const novoStatus = statusAtual === 'resolvido' ? 'pendente' : 'resolvido';
    const payload = { status: novoStatus, atualizado_em: new Date().toISOString() };
    if (novoStatus === 'resolvido') payload.previsao_retorno = null; // Limpa o prazo ao resolver

    await supabase.from('status_erros').update(payload).eq('codigo_erro', codigo);
    fetchErros();
  };

  const salvarPrazo = async () => {
    if (!erroSelecionado || !dataPrazo) return;
    const isoDate = new Date(dataPrazo).toISOString();
    await supabase.from('status_erros').update({ 
      previsao_retorno: isoDate, status: 'pendente', atualizado_em: new Date().toISOString() 
    }).eq('codigo_erro', erroSelecionado);
    
    setErroSelecionado(null);
    setDataPrazo('');
    fetchErros();
  };

  const formatarData = (iso) => iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Não definida';

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col animate-in slide-in-from-right duration-300 ${temaNoturno ? 'bg-[#09090b] text-white' : 'bg-white text-zinc-900'}`}>
      
      {/* Header do Admin */}
      <div className={`px-6 py-4 flex justify-between items-center border-b ${temaNoturno ? 'border-white/10' : 'border-zinc-200'}`}>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Centro de Resolução de Bugs</h2>
          <p className={`text-sm mt-0.5 ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Gerencie SLAs e status de erros sistêmicos (Global)</p>
        </div>
        <button onClick={onFechar} className={`p-2.5 rounded-full transition-colors ${temaNoturno ? 'hover:bg-white/10' : 'hover:bg-zinc-100'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      {/* Tabela de Erros */}
      <div className="flex-1 overflow-auto p-6 max-w-6xl mx-auto w-full">
        {loading ? (
           <p className="opacity-50">Carregando telemetria...</p>
        ) : erros.length === 0 ? (
           <p className="opacity-50 italic">Nenhum erro registrado pelos Error Boundaries até o momento.</p>
        ) : (
          <div className="grid gap-4">
            {erros.map(erro => (
              <div key={erro.codigo_erro} className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${temaNoturno ? 'bg-white/[0.02] border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
                
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${erro.status === 'resolvido' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                      {erro.status}
                    </span>
                    <span className="font-mono text-[12px] opacity-50">{erro.codigo_erro}</span>
                  </div>
                  <h3 className="font-bold text-[15px]">{erro.modulo}</h3>
                  <p className={`text-[12px] font-medium mt-1 ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Previsão: <span className={erro.previsao_retorno ? (temaNoturno ? 'text-amber-400' : 'text-amber-600') : ''}>{formatarData(erro.previsao_retorno)}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Bloco de Definir Prazo */}
                  {erroSelecionado === erro.codigo_erro ? (
                    <div className="flex items-center gap-2 animate-in fade-in zoom-in-95">
                      <input 
                        type="datetime-local" 
                        value={dataPrazo} onChange={(e) => setDataPrazo(e.target.value)}
                        className={`p-2 rounded-lg text-[12px] outline-none border ${temaNoturno ? 'bg-black border-white/20' : 'bg-white border-zinc-300'}`}
                      />
                      <button onClick={salvarPrazo} className="px-4 py-2 rounded-lg text-[12px] font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors">Salvar Prazo</button>
                      <button onClick={() => setErroSelecionado(null)} className="text-[12px] underline opacity-50 hover:opacity-100">Cancelar</button>
                    </div>
                  ) : (
                    <>
                      {erro.status === 'pendente' && (
                        <button 
                          onClick={() => setErroSelecionado(erro.codigo_erro)}
                          className={`px-4 py-2 rounded-lg text-[12px] font-semibold border transition-colors ${temaNoturno ? 'border-white/20 hover:bg-white/10' : 'border-zinc-300 hover:bg-zinc-200'}`}
                        >
                          {erro.previsao_retorno ? 'Alterar Prazo' : 'Definir Prazo de Correção'}
                        </button>
                      )}
                      
                      <button 
                        onClick={() => atualizarStatus(erro.codigo_erro, erro.status)}
                        className={`px-5 py-2 rounded-lg text-[12px] font-bold transition-all ${erro.status === 'resolvido' ? (temaNoturno ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-zinc-200 text-black hover:bg-zinc-300') : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                      >
                        {erro.status === 'resolvido' ? 'Reabrir Chamado' : 'Marcar Resolvido'}
                      </button>
                    </>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}