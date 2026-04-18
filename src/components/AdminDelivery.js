// AdminDelivery.jsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDelivery({ empresaId, temaNoturno }) {
  const [bairros, setBairros] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modoMassa, setModoMassa] = useState(false);
  
  const [nome, setNome] = useState('');
  const [taxa, setTaxa] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [textoMassa, setTextoMassa] = useState('');

  useEffect(() => { if(empresaId) carregarBairros(); }, [empresaId]);

  const carregarBairros = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('bairros_entrega').select('*').eq('empresa_id', empresaId).order('nome');
    if (!error && data) setBairros(data);
    setIsLoading(false);
  };

  const salvarBairro = async (e) => {
    if (e) e.preventDefault();
    if (!nome.trim() || taxa === '') return alert("Preencha o nome e a taxa do bairro.");
    const valorTaxa = parseFloat(taxa.toString().replace(',', '.'));
    if (editandoId) { 
      await supabase.from('bairros_entrega').update({ nome, taxa: valorTaxa }).eq('id', editandoId); 
      setEditandoId(null); 
    } else { 
      await supabase.from('bairros_entrega').insert([{ empresa_id: empresaId, nome, taxa: valorTaxa }]); 
    }
    setNome(''); setTaxa(''); carregarBairros();
  };

  const editarBairro = (bairro) => { 
    setModoMassa(false); 
    setEditandoId(bairro.id); 
    setNome(bairro.nome); 
    setTaxa(bairro.taxa.toString()); 
    window.scrollTo({top: 0, behavior: 'smooth'});
  };
  
  const excluirBairro = async (id, nomeBairro) => { 
    if (confirm(`Deseja parar de entregar no bairro "${nomeBairro}"?`)) { 
      await supabase.from('bairros_entrega').delete().eq('id', id); 
      carregarBairros(); 
    } 
  };

  const processarEmMassa = async () => {
    if (!textoMassa.trim()) return alert("Cole a lista de bairros primeiro.");
    const linhas = textoMassa.split('\n'); 
    const novosBairros = [];
    linhas.forEach(linha => {
      const partes = linha.split(/[-;,]/);
      if (partes.length >= 2) {
        const nomeParte = partes[0].trim(); 
        const taxaParte = parseFloat(partes[1].replace(/[^\d.,]/g, '').replace(',', '.'));
        if (nomeParte && !isNaN(taxaParte)) novosBairros.push({ empresa_id: empresaId, nome: nomeParte, taxa: taxaParte });
      }
    });
    if (novosBairros.length === 0) return alert("Siga o formato exato: Nome - 5,00");
    if (confirm(`Vamos importar ${novosBairros.length} bairros. Correto?`)) {
      setIsLoading(true); 
      await supabase.from('bairros_entrega').insert(novosBairros);
      setTextoMassa(''); setModoMassa(false); carregarBairros();
    }
  };

  // --- DESIGN SYSTEM PREMIUM ---
  const isDark = temaNoturno;
  const textPrimary = isDark ? 'text-zinc-100' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const borderSubtle = isDark ? 'border-white/5' : 'border-zinc-200/60';
  const borderFocus = isDark ? 'focus:border-zinc-500 focus:ring-zinc-500/20' : 'focus:border-zinc-400 focus:ring-zinc-400/20';
  
  const labelArox = `block text-[11px] font-semibold tracking-wide uppercase mb-1.5 ${textSecondary}`;
  const inputArox = `w-full h-10 px-3 rounded-lg border text-[13px] font-medium transition-all outline-none bg-transparent ${borderSubtle} ${borderFocus} ${textPrimary} shadow-sm`;
  const btnPrimary = `h-10 px-4 rounded-lg text-[13px] font-semibold transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 ${isDark ? 'bg-zinc-100 text-zinc-900 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`;
  const btnSecondary = `h-10 px-4 rounded-lg text-[13px] font-medium transition-all shadow-sm border active:scale-[0.98] flex items-center justify-center gap-2 ${isDark ? 'bg-transparent border-white/10 text-white hover:bg-white/5' : 'bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50'}`;
  const cardPanel = `p-6 sm:p-8 rounded-2xl border transition-all duration-300 ${isDark ? 'bg-[#121214] border-white/5 shadow-2xl' : 'bg-white border-zinc-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]'} flex flex-col w-full relative`;

  const navTabClass = "px-4 py-2 rounded-lg text-[12px] font-semibold tracking-wide transition-all outline-none shrink-0 whitespace-nowrap";
  const navTabActive = `${navTabClass} shadow-sm ${isDark ? 'bg-[#27272A] text-white' : 'bg-white text-zinc-900 ring-1 ring-black/5'}`;
  const navTabInactive = `${navTabClass} ${isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-700'}`;

  return (
    <div className="max-w-[800px] mx-auto w-full px-5 sm:px-8 py-10 animate-in fade-in duration-500 font-sans pb-32">
      
      {/* HEADER DA SEÇÃO */}
      <div className="w-full flex flex-col gap-6 mb-8">
        <div>
          <h2 className={`text-[24px] font-bold tracking-tight leading-none ${textPrimary}`}>Zonas de Entrega</h2>
          <p className={`text-[13px] mt-1.5 ${textSecondary}`}>Gerencie áreas de cobertura e taxas logísticas.</p>
        </div>
        
        <div className={`inline-flex items-center p-1 rounded-xl self-start ${isDark ? 'bg-[#18181B] ring-1 ring-white/5' : 'bg-zinc-100/80 ring-1 ring-zinc-200/50'}`}>
          <button onClick={() => { setModoMassa(false); setEditandoId(null); }} className={!modoMassa ? navTabActive : navTabInactive}>Entrada Manual</button>
          <button onClick={() => { setModoMassa(true); setEditandoId(null); }} className={modoMassa ? navTabActive : navTabInactive}>Importação em Massa</button>
        </div>
      </div>

      <div className="flex flex-col gap-8 w-full relative">
        
        {/* ADD / CONFIG PANEL */}
        <div className={cardPanel}>
          <div className={`pb-3 mb-5 border-b ${borderSubtle}`}>
            <h3 className={`text-[14px] font-semibold tracking-wide uppercase ${textPrimary}`}>
              {modoMassa ? 'Importação Textual' : editandoId ? 'Editando Rota' : 'Nova Rota de Entrega'}
            </h3>
          </div>

          {!modoMassa ? (
            <form onSubmit={salvarBairro} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelArox}>Nome do Bairro / Região</label>
                  <input type="text" placeholder="Ex: Zona Sul" value={nome} onChange={(e) => setNome(e.target.value)} className={inputArox} autoFocus />
                </div>
                <div>
                  <label className={labelArox}>Custo de Entrega (R$)</label>
                  <div className="relative">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-medium ${textSecondary}`}>R$</span>
                    <input type="number" step="0.01" placeholder="5.00" value={taxa} onChange={(e) => setTaxa(e.target.value)} className={`${inputArox} pl-8`} />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                {editandoId && <button type="button" onClick={() => { setEditandoId(null); setNome(''); setTaxa(''); }} className={btnSecondary}>Cancelar</button>}
                <button type="submit" className={btnPrimary}>{editandoId ? 'Atualizar Rota' : 'Adicionar Rota'}</button>
              </div>
            </form>
          ) : (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div>
                <label className={labelArox}>Cole a lista no formato (Nome - Valor)</label>
                <textarea 
                  rows="6" 
                  placeholder={`Centro - 5,00\nNorte - 10,00\nCondomínio Jardins - 15,50`} 
                  value={textoMassa} 
                  onChange={(e) => setTextoMassa(e.target.value)} 
                  className={`w-full p-4 rounded-xl border text-[13px] font-mono transition-all outline-none bg-transparent resize-y ${borderSubtle} ${borderFocus} ${textPrimary} shadow-sm leading-relaxed`}
                ></textarea>
              </div>
              <div className="flex justify-end">
                <button onClick={processarEmMassa} className={btnPrimary}>Processar Importação</button>
              </div>
            </div>
          )}
        </div>

        {/* LISTA PANEL */}
        <div className="w-full mt-4">
          <div className="flex items-center justify-between mb-5 px-1">
             <h3 className={`text-[16px] font-bold tracking-tight ${textPrimary}`}>Áreas Ativas</h3>
             <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-widest uppercase shadow-sm ${isDark ? 'bg-white/10 text-zinc-300' : 'bg-black/5 text-zinc-600'}`}>{bairros.length} Rotas</span>
          </div>

          <div className="flex flex-col gap-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                 <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${isDark ? 'border-zinc-400' : 'border-zinc-600'}`}></div>
                 <span className={`text-[11px] font-bold tracking-widest uppercase ${textSecondary}`}>Sincronizando...</span>
              </div>
            ) : bairros.length === 0 ? (
              <div className={`text-center py-16 text-[13px] font-medium border border-dashed rounded-2xl ${isDark ? 'border-white/10 text-zinc-500 bg-white/[0.01]' : 'border-zinc-300 text-zinc-500 bg-zinc-50/50'}`}>
                Nenhuma rota de entrega configurada.
              </div>
            ) : (
              bairros.map((b, index) => (
                <div key={b.id} className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 hover:shadow-md animate-in slide-in-from-bottom-2 fade-in fill-mode-both ${isDark ? 'bg-[#121214] border-white/5 hover:border-white/10' : 'bg-white border-zinc-200/80 hover:border-zinc-300 shadow-sm'}`} style={{animationDelay: `${Math.min(index * 30, 300)}ms`}}>
                  <div className="flex flex-col">
                    <p className={`font-semibold text-[15px] tracking-tight leading-none mb-1.5 ${textPrimary}`}>{b.nome}</p>
                    <p className={`text-[13px] font-bold tracking-tight ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>R$ {parseFloat(b.taxa).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                    <button onClick={() => editarBairro(b)} className={`p-2 rounded-lg transition-colors ${isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`} title="Editar Rota">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button onClick={() => excluirBairro(b.id, b.nome)} className={`p-2 rounded-lg transition-colors ${isDark ? 'text-rose-400 hover:bg-rose-500/20' : 'text-rose-600 hover:bg-rose-50'}`} title="Remover Rota">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}