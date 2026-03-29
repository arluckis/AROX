'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminWorkspaceDrawer({ workspace, temaNoturno, onClose }) {
  const [loading, setLoading] = useState(true);
  const [detalhes, setDetalhes] = useState(null);
  const [metricas, setMetricas] = useState(null);

  useEffect(() => {
    if (workspace) carregarDadosProfundos();
  }, [workspace]);

  const carregarDadosProfundos = async () => {
    setLoading(true);
    try {
      // 1. DADOS ORIGINAIS DE SESSÃO E IDENTIDADE
      const { data: sessoes } = await supabase.from('sessoes_acesso')
        .select('*').eq('empresa_id', workspace.id).order('ultimo_heartbeat', { ascending: false }).limit(5);
      
      const { data: dono } = await supabase.from('usuarios')
        .select('*, ultimo_ping_at, status_presenca').eq('empresa_id', workspace.id).eq('role', 'dono').single();

      // 2. DADOS DE TELEMETRIA PREMIUM
      const { data: pags } = await supabase.from('pagamentos').select('valor').eq('empresa_id', workspace.id);
      const { data: comProd } = await supabase.from('comanda_produtos').select('preco, custo, pago').eq('empresa_id', workspace.id);
      const { count: fidelidadeCount } = await supabase.from('clientes_fidelidade').select('*', { count: 'exact', head: true }).eq('empresa_id', workspace.id);

      // 3. DERIVAÇÃO DA INTELIGÊNCIA
      const gmvReal = pags ? pags.reduce((acc, curr) => acc + Number(curr.valor), 0) : 0;
      let lucroEstimado = 0;
      let vazamento = 0;

      if (comProd) {
        comProd.forEach(item => {
          if (item.pago) {
            lucroEstimado += (Number(item.preco) - Number(item.custo || 0));
          } else {
            vazamento += Number(item.preco);
          }
        });
      }

      setDetalhes({ dono, ultimasSessoes: sessoes || [] });
      setMetricas({ gmvReal, lucroEstimado, vazamento, fidelidadeCount: fidelidadeCount || 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calcularStatusSessao = (pingAt, statusString) => {
    if (!pingAt) return { tag: 'Offline', cor: 'bg-zinc-500' };
    const pingTime = new Date(pingAt).getTime();
    const agora = Date.now();
    const diffMinutos = (agora - pingTime) / 1000 / 60;
    
    if (diffMinutos > 5 || statusString === 'offline') return { tag: 'Offline', cor: 'bg-zinc-500' };
    if (statusString === 'ausente') return { tag: 'Ausente (Inativo/Outra Aba)', cor: 'bg-amber-500' };
    return { tag: 'Online Agora', cor: 'bg-emerald-500' };
  };

  if (!workspace) return null;
  const sessionStatus = detalhes?.dono ? calcularStatusSessao(detalhes.dono.ultimo_ping_at, detalhes.dono.status_presenca) : { tag: 'Calculando...', cor: 'bg-zinc-500' };

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className={`relative w-[90vw] max-w-[480px] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 ${temaNoturno ? 'bg-[#0A0A0A] border-l border-white/10 text-white' : 'bg-[#FAFAFA] text-slate-900'}`}>
        
        <div className={`px-6 py-5 border-b flex justify-between items-start ${temaNoturno ? 'border-white/5' : 'border-black/5'}`}>
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0">
               {workspace.logo_url && (
                 <img src={workspace.logo_url} alt="Logo" className="w-full h-full object-cover absolute inset-0 z-10" referrerPolicy="no-referrer" onError={(e) => e.currentTarget.style.display = 'none'} />
               )}
               <div className={`absolute inset-0 z-0 flex items-center justify-center font-black text-xl ${temaNoturno ? 'bg-[#222] text-zinc-400' : 'bg-zinc-200 text-zinc-500'}`}>
                 {workspace.nome.charAt(0).toUpperCase()}
               </div>
            </div>
            <div>
              <h3 className="text-[18px] font-bold tracking-tight">{workspace.nome}</h3>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${sessionStatus.cor}`}></div>
                <span className={`text-[12px] font-medium ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>{sessionStatus.tag}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${temaNoturno ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-black/5 text-zinc-500'}`}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-40 space-y-4 py-10">
                <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                <span className="text-xs font-mono text-indigo-500 animate-pulse">Descriptografando Telemetria...</span>
             </div>
          ) : (
             <>
               {/* IDENTIDADE ORIGINIAL PRESERVADA */}
               <div>
                 <h4 className={`text-[11px] font-bold uppercase tracking-widest mb-4 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Identidade e Licença</h4>
                 <div className={`rounded-xl border p-4 grid grid-cols-2 gap-4 ${temaNoturno ? 'bg-[#111] border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
                    <div>
                      <p className={`text-[11px] font-medium mb-1 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Gestor (Dono)</p>
                      <p className="text-[13px] font-semibold truncate">{detalhes?.dono?.nome_usuario || 'Não configurado'}</p>
                    </div>
                    <div>
                      <p className={`text-[11px] font-medium mb-1 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>E-mail de Acesso</p>
                      <p className="text-[13px] font-semibold truncate">{detalhes?.dono?.email || '---'}</p>
                    </div>
                    <div>
                      <p className={`text-[11px] font-medium mb-1 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Plano Comercial</p>
                      <p className="text-[13px] font-bold text-indigo-500 uppercase">{workspace.plano}</p>
                    </div>
                    <div>
                      <p className={`text-[11px] font-medium mb-1 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Integração POS</p>
                      <p className="text-[13px] font-mono font-semibold">{workspace.codigo_integracao || 'N/A'}</p>
                    </div>
                 </div>
               </div>

               {/* NOVA CAMADA: SINAIS VITAIS FINANCEIROS */}
               <div>
                 <h4 className={`text-[11px] font-bold uppercase tracking-widest mb-4 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Insight de Valor Gerado</h4>
                 <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-2xl border ${temaNoturno ? 'bg-[#111] border-white/5' : 'bg-white border-black/5'}`}>
                       <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">GMV Transacionado</p>
                       <p className="text-[20px] font-black">R$ {metricas?.gmvReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className={`p-4 rounded-2xl border ${temaNoturno ? 'bg-[#111] border-emerald-500/20' : 'bg-emerald-50/50 border-emerald-200'}`}>
                       <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1">Lucro Estimado</p>
                       <p className="text-[20px] font-black text-emerald-500">R$ {metricas?.lucroEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                 </div>
               </div>

               {/* NOVA CAMADA: RISCO E ADOÇÃO */}
               <div className="grid grid-cols-1 gap-4">
                 <div className={`p-4 rounded-2xl border flex items-center justify-between ${temaNoturno ? 'bg-[#111] border-rose-500/20' : 'bg-rose-50 border-rose-200'}`}>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-1">Leakage (Vazamento)</p>
                      <p className={`text-[12px] font-medium ${temaNoturno ? 'text-rose-400' : 'text-rose-600'}`}>Saída de cozinha sem pagamento.</p>
                    </div>
                    <p className="text-[20px] font-black text-rose-500">R$ {metricas?.vazamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                 </div>
                 
                 <div className={`p-4 rounded-2xl border flex items-center justify-between ${temaNoturno ? 'bg-[#111] border-white/5' : 'bg-white border-black/5'}`}>
                    <span className={`text-[13px] font-medium ${temaNoturno ? 'text-zinc-400' : 'text-zinc-600'}`}>Base Fidelizada</span>
                    <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 font-bold text-[12px]">{metricas?.fidelidadeCount} cadastros</span>
                 </div>
               </div>

               {/* SESSÕES ORIGINAIS PRESERVADAS */}
               <div>
                 <h4 className={`text-[11px] font-bold uppercase tracking-widest mb-4 flex justify-between items-center ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>
                   Últimas Sessões Fixas
                 </h4>
                 <div className={`rounded-xl border overflow-hidden ${temaNoturno ? 'bg-[#111] border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
                    {detalhes.ultimasSessoes.length === 0 ? (
                       <div className="p-4 text-center text-[12px] font-medium text-zinc-500">Nenhum registro de sessão estruturado encontrado.</div>
                    ) : (
                      <div className="divide-y divide-black/5 dark:divide-white/5">
                        {detalhes.ultimasSessoes.map(sessao => (
                          <div key={sessao.id} className="p-4 flex flex-col gap-1">
                            <div className="flex justify-between items-start">
                              <span className="text-[13px] font-semibold">{new Date(sessao.inicio_sessao).toLocaleString('pt-BR')}</span>
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${sessao.fim_sessao ? (temaNoturno ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500') : (temaNoturno ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600')}`}>
                                {sessao.fim_sessao ? 'Encerrada' : 'Ativa'}
                              </span>
                            </div>
                            <div className={`text-[11px] font-medium truncate ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>
                              IP: {sessao.ip_origem || 'Desconhecido'} • Último Ping: {new Date(sessao.ultimo_heartbeat).toLocaleTimeString('pt-BR')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                 </div>
               </div>
             </>
          )}
        </div>
      </div>
    </div>
  );
}