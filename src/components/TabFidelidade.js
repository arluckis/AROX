'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ResponsiveContainer, Cell, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, PieChart, Pie, Legend } from 'recharts';

const CORES_VIBRANTES = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9', '#f97316', '#14b8a6', '#84cc16'];

export default function TabFidelidade({ temaNoturno, sessao, mostrarAlerta, mostrarConfirmacao, dadosTags, clientesFidelidade, setClientesFidelidade, comandas }) {
  
  const [abaInterna, setAbaInterna] = useState('clientes'); 
  const [busca, setBusca] = useState('');
  
  const [meta, setMeta] = useState({ pontos_necessarios: 10, premio: '1 Açaí de 500ml', valor_minimo: 0 });
  const [mostrarModalNovo, setMostrarModalNovo] = useState(false);
  const [mostrarModalImportacao, setMostrarModalImportacao] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null); 
  const [clientePerfil, setClientePerfil] = useState(null); 
  
  const [novoCliente, setNovoCliente] = useState({ nome: '', telefone: '', aniversario: '', pontos: 0 });
  const [textoImportacao, setTextoImportacao] = useState('');

  useEffect(() => {
    const fetchMeta = async () => {
      const { data } = await supabase.from('config_fidelidade').select('*').eq('empresa_id', sessao.empresa_id).single();
      if (data) setMeta({ pontos_necessarios: data.pontos_necessarios, premio: data.premio, valor_minimo: data.valor_minimo || 0 });
    };
    if (sessao?.empresa_id) fetchMeta();
  }, [sessao]);

  const atualizarMeta = async () => {
    const { error } = await supabase.from('config_fidelidade').upsert({
       empresa_id: sessao.empresa_id, 
       pontos_necessarios: meta.pontos_necessarios, 
       premio: meta.premio,
       valor_minimo: parseFloat(meta.valor_minimo) || 0
    }, { onConflict: 'empresa_id' });
    
    if (!error) mostrarAlerta("Sucesso", "Regras de Fidelidade atualizadas!");
  };

  const clientesFiltrados = clientesFidelidade
    .filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()) || (c.telefone && c.telefone.includes(busca)))
    .sort((a, b) => a.nome.localeCompare(b.nome)); 

  const ranking = [...clientesFidelidade].sort((a, b) => (b.pontos_totais || b.pontos) - (a.pontos_totais || a.pontos)).slice(0, 10);

  const salvarNovoCliente = async () => {
    if (!novoCliente.nome) return mostrarAlerta("Erro", "O nome é obrigatório.");
    
    if (clienteEditando) {
       const { error } = await supabase.from('clientes_fidelidade').update({
         nome: novoCliente.nome, telefone: novoCliente.telefone, aniversario: novoCliente.aniversario || null, pontos: novoCliente.pontos
       }).eq('id', clienteEditando.id);
       
       if (!error) {
         setClientesFidelidade(clientesFidelidade.map(c => c.id === clienteEditando.id ? { ...c, ...novoCliente } : c));
         mostrarAlerta("Sucesso", "Cliente atualizado com sucesso!");
       }
    } else {
       const payload = { ...novoCliente, aniversario: novoCliente.aniversario || null, empresa_id: sessao.empresa_id, pontos_totais: novoCliente.pontos };
       const { data, error } = await supabase.from('clientes_fidelidade').insert([payload]).select().single();
       if (data && !error) {
         setClientesFidelidade([...clientesFidelidade, data]);
         mostrarAlerta("Sucesso", "Cliente cadastrado com sucesso!");
       }
    }
    
    setMostrarModalNovo(false);
    setClienteEditando(null);
    setNovoCliente({ nome: '', telefone: '', aniversario: '', pontos: 0 });
  };

  const abrirEdicao = (cliente) => {
    setClienteEditando(cliente);
    setNovoCliente({ nome: cliente.nome, telefone: cliente.telefone || '', aniversario: cliente.aniversario || '', pontos: cliente.pontos });
    setMostrarModalNovo(true);
  };

  const resgatarPremio = (cliente) => {
    if (cliente.pontos < meta.pontos_necessarios) return mostrarAlerta("Aviso", "O cliente não tem pontos suficientes ainda.");
    
    mostrarConfirmacao("Confirmar Resgate", `Deseja debitar ${meta.pontos_necessarios} pontos de ${cliente.nome} pelo prêmio: ${meta.premio}?`, async () => {
       const novosPontos = cliente.pontos - meta.pontos_necessarios;
       const { error } = await supabase.from('clientes_fidelidade').update({ pontos: novosPontos }).eq('id', cliente.id);
       
       if (!error) {
         setClientesFidelidade(clientesFidelidade.map(c => c.id === cliente.id ? { ...c, pontos: novosPontos } : c));
         mostrarAlerta("Sucesso", "Prêmio resgatado e pontos descontados da carteira!");
       }
    });
  };

  const processarImportacao = async () => {
    if(!textoImportacao.trim()) return;
    try {
      const linhas = textoImportacao.trim().split('\n');
      const novos = linhas.map((l) => {
        let cleanLine = l.replace(/^\|/, '').replace(/\|$/, '').trim(); 
        if (cleanLine.startsWith('---') || cleanLine.includes('---')) return null;

        const cols = cleanLine.includes('\t') ? cleanLine.split('\t') : (cleanLine.includes('|') ? cleanLine.split('|') : cleanLine.split(','));
        
        if(cols.length >= 1 && cols[0].trim()) {
          let nomeStr = cols[0].trim().replace(/\*\*/g, ''); 
          if (nomeStr.toLowerCase().includes('nome') || nomeStr.toLowerCase().includes('cliente')) return null;
          
          let dataNasc = cols[2] ? cols[2].trim() : null;
          if (dataNasc && dataNasc.toLowerCase().includes('anivers')) return null; 

          let ptsStr = cols[3] ? cols[3].replace(/[^\d]/g, '') : '0'; 
          const pt = parseInt(ptsStr) || 0;

          if (dataNasc) {
             if (dataNasc.includes('/')) {
               const partes = dataNasc.split('/');
               if (partes.length === 3) {
                 dataNasc = `${partes[2]}-${partes[1]}-${partes[0]}`;
               } else { dataNasc = null; }
             } else if (/[a-zA-Z]/.test(dataNasc)) {
               dataNasc = null;
             }
             if (dataNasc && !/^\d{4}-\d{2}-\d{2}$/.test(dataNasc)) {
                 dataNasc = null;
             }
          }

          return { 
            nome: nomeStr, 
            telefone: cols[1] ? cols[1].trim() : null, 
            aniversario: dataNasc || null, 
            pontos: pt, 
            pontos_totais: pt, 
            empresa_id: sessao.empresa_id 
          };
        }
        return null;
      }).filter(Boolean);

      if (novos.length > 0) {
        const { data, error } = await supabase.from('clientes_fidelidade').insert(novos).select();
        if (data && !error) {
          setClientesFidelidade([...clientesFidelidade, ...data]);
          setMostrarModalImportacao(false);
          setTextoImportacao('');
          mostrarAlerta("Sucesso", `${data.length} clientes importados com sucesso!`);
        } else {
          mostrarAlerta("Erro", "Erro ao salvar no banco.");
        }
      } else { mostrarAlerta("Aviso", "Nenhum cliente válido encontrado. Verifique a formatação."); }
    } catch(e) { mostrarAlerta("Erro", "Ocorreu um erro ao processar sua tabela."); }
  };

  const dadosReceita = [];
  if (abaInterna === 'publico') {
    let receitaFiel = 0; let receitaAvulsa = 0;
    (comandas || []).forEach(c => {
       const valor = (c.produtos || []).reduce((acc, p) => acc + (p.preco || 0), 0);
       if (c.tags && c.tags.includes('Fidelidade')) { receitaFiel += valor; } else { receitaAvulsa += valor; }
    });
    if (receitaFiel > 0) dadosReceita.push({ name: 'Clientes Fiéis', value: receitaFiel });
    if (receitaAvulsa > 0) dadosReceita.push({ name: 'Clientes Avulsos', value: receitaAvulsa });
  }

  let produtosDoCliente = [];
  if (clientePerfil) {
     const comandasDele = (comandas || []).filter(c => c.nome.toLowerCase() === clientePerfil.nome.toLowerCase());
     const contagem = {};
     comandasDele.forEach(c => {
        (c.produtos || []).forEach(p => {
           const n = p.nome.replace(/\s*\(\d+(?:\.\d+)?\s*g\)/i, '').trim().toUpperCase();
           contagem[n] = (contagem[n] || 0) + 1;
        });
     });
     produtosDoCliente = Object.entries(contagem).map(([nome, qtd]) => ({ nome, qtd })).sort((a,b) => b.qtd - a.qtd).slice(0, 5);
  }

  const formatarData = (dataStr) => {
    if (!dataStr) return '---';
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* TÍTULO FUNDIDO AO HEADER */}
      <div className={`p-5 lg:p-6 pt-4 lg:pt-5 rounded-b-3xl shadow-sm border-x border-b border-t-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative transition-colors duration-500 mb-6 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`absolute top-0 left-6 right-6 border-t border-dashed ${temaNoturno ? 'border-gray-700' : 'border-gray-200'}`}></div>
          <div className="mt-2 md:mt-0">
             <h2 className={`text-xl font-black flex items-center gap-2 uppercase tracking-wide ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>
               Gestão de Clientes
             </h2>
             <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>
               Controle de Retenção e Relacionamento
             </p>
          </div>

          {abaInterna === 'clientes' && (
            <div className="flex flex-wrap gap-2 w-full md:w-auto animate-in fade-in zoom-in-95 duration-300">
              <button 
                onClick={() => setMostrarModalImportacao(true)} 
                className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-sm border ${temaNoturno ? 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}
              >
                Importar Excel
              </button>
              <button 
                onClick={() => { setClienteEditando(null); setNovoCliente({nome:'', telefone:'', aniversario:'', pontos:0}); setMostrarModalNovo(true); }} 
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-all active:scale-95"
              >
                + Cadastrar
              </button>
            </div>
          )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
        
        {/* BARRA LATERAL (HORIZONTAL MOBILE / VERTICAL DESKTOP) */}
        <div className="shrink-0 lg:w-48 flex flex-col gap-4">
           <div className={`p-2 rounded-3xl shadow-sm border h-fit flex flex-row overflow-x-auto lg:flex-col gap-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <button 
                onClick={() => setAbaInterna('clientes')} 
                className={`flex-1 whitespace-nowrap text-left px-4 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 ${abaInterna === 'clientes' ? (temaNoturno ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-50 text-purple-700') : (temaNoturno ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50')}`}
              >
                Clientes
              </button>
              <button 
                onClick={() => setAbaInterna('ranking')} 
                className={`flex-1 whitespace-nowrap text-left px-4 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 ${abaInterna === 'ranking' ? (temaNoturno ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-50 text-purple-700') : (temaNoturno ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50')}`}
              >
                Ranking
              </button>
              <button 
                onClick={() => setAbaInterna('config')} 
                className={`flex-1 whitespace-nowrap text-left px-4 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 ${abaInterna === 'config' ? (temaNoturno ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-50 text-purple-700') : (temaNoturno ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50')}`}
              >
                Regras
              </button>
              {(sessao?.role === 'dono' || sessao?.perm_estudo) && (
                <button 
                  onClick={() => setAbaInterna('publico')} 
                  className={`flex-1 whitespace-nowrap text-left px-4 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 ${abaInterna === 'publico' ? (temaNoturno ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-50 text-purple-700') : (temaNoturno ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50')}`}
                >
                  Público-Alvo
                </button>
              )}
           </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col min-w-0">

          {abaInterna === 'clientes' && (
            <div className={`p-6 rounded-3xl border shadow-sm flex flex-col min-h-[400px] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75 ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
              <div className="mb-6 relative">
                <svg className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <input 
                  type="text" 
                  placeholder="Pesquisar registro de cliente..." 
                  value={busca} 
                  onChange={e => setBusca(e.target.value)} 
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border outline-none font-bold text-sm transition-colors focus:border-purple-500 ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`} 
                />
              </div>
              
              <div className="overflow-x-auto flex-1">
                {clientesFiltrados.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-50">
                    <svg className="w-16 h-16 mb-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    <p className="font-bold uppercase tracking-widest text-[10px]">Registro Vazio</p>
                    <p className="text-[10px] font-bold mt-1">Nenhum cliente cadastrado ou localizado na pesquisa.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className={`border-b text-[10px] font-black uppercase tracking-widest ${temaNoturno ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
                        <th className="p-4 rounded-tl-xl">Nome do Cliente</th>
                        <th className="p-4">Dados de Contato</th>
                        <th className="p-4">Registrado em</th>
                        <th className="p-4">Carteira de Pontos</th>
                        <th className="p-4 text-right rounded-tr-xl">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientesFiltrados.map(c => {
                        const progresso = Math.min((c.pontos / meta.pontos_necessarios) * 100, 100);
                        const acimaDeDez = c.pontos > 10;
                        const atingiuMeta = c.pontos === parseInt(meta.pontos_necessarios);
                        
                        const colorClass = acimaDeDez ? 'bg-red-500' : (atingiuMeta ? 'bg-green-500' : 'bg-purple-500');
                        const textClass = acimaDeDez ? 'text-red-500' : (atingiuMeta ? 'text-green-500' : 'text-purple-500');

                        return (
                          <tr key={c.id} className={`border-b last:border-0 transition-colors ${temaNoturno ? 'border-gray-800 hover:bg-gray-800/50 text-gray-300' : 'border-gray-50 hover:bg-purple-50/50 text-gray-700'}`}>
                            <td className="p-4">
                              <p onClick={() => setClientePerfil(c)} title="Ver Histórico do Cliente" className={`font-black text-sm uppercase cursor-pointer hover:text-purple-500 transition-colors ${temaNoturno ? 'text-gray-200' : 'text-gray-900'}`}>{c.nome}</p>
                              {(atingiuMeta || acimaDeDez) && <p className={`text-[10px] font-bold mt-0.5 uppercase tracking-widest animate-pulse ${textClass}`}>Apto a Prêmio</p>}
                            </td>
                            <td className="p-4 text-xs font-bold opacity-80">
                              {c.telefone ? <p>Tel: {c.telefone}</p> : <p className="text-gray-400">Sem telefone</p>}
                              {c.aniversario && <p className="mt-0.5">Nasc: {c.aniversario.split('-').reverse().join('/')}</p>}
                            </td>
                            <td className="p-4 text-xs font-bold opacity-80">
                               {formatarData(c.created_at)}
                            </td>
                            <td className="p-4">
                              <div className="w-full max-w-[150px]">
                                <div className={`w-full rounded-full h-1.5 mb-1.5 overflow-hidden ${temaNoturno ? 'bg-gray-800' : 'bg-gray-200'}`}>
                                  <div className={`h-1.5 rounded-full transition-all duration-1000 ${colorClass}`} style={{ width: `${progresso}%` }}></div>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                  <span className={temaNoturno ? 'text-gray-400' : 'text-gray-500'}>{c.pontos} / {meta.pontos_necessarios} Pts</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                 <button onClick={() => resgatarPremio(c)} title="Descontar pontos da carteira" className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest active:scale-95 ${c.pontos >= meta.pontos_necessarios ? 'bg-green-500 text-white hover:bg-green-600 shadow-sm' : (temaNoturno ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')}`} disabled={c.pontos < meta.pontos_necessarios}>Resgatar</button>
                                 <button onClick={() => abrirEdicao(c)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest border active:scale-95 ${temaNoturno ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Editar</button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {abaInterna === 'ranking' && (
            <div className="max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
              <div className={`p-6 rounded-3xl border shadow-sm ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                <h3 className={`font-black text-[10px] mb-2 uppercase tracking-widest flex items-center gap-2 ${temaNoturno ? 'text-white' : 'text-gray-800'}`}>
                  <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                  Ranking (Pontuação Histórica)
                </h3>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-6 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Baseado no total de pontos conquistados em toda a vida útil do cliente.</p>
                
                {ranking.length === 0 ? (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Sem dados suficientes para ranking.</p>
                ) : (
                  <div className="space-y-3">
                    {ranking.map((c, idx) => {
                      const ptsTotais = c.pontos_totais || c.pontos;
                      return (
                        <div key={c.id} className={`flex justify-between items-center p-3 rounded-xl border transition-all hover:-translate-y-1 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`text-sm font-black w-6 text-center ${idx < 3 ? 'text-purple-500' : (temaNoturno ? 'text-gray-500' : 'text-gray-400')}`}>#{idx + 1}</div>
                            <span className={`font-black text-xs uppercase ${temaNoturno ? 'text-gray-200' : 'text-gray-800'}`}>{c.nome}</span>
                          </div>
                          <span className={`font-black px-3 py-1 rounded-md text-[10px] uppercase tracking-wider ${temaNoturno ? 'bg-gray-900 text-gray-400' : 'bg-white text-gray-600 border border-gray-200'}`}>
                            {ptsTotais} Pts
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {abaInterna === 'config' && (
            <div className={`p-6 rounded-3xl border shadow-sm max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75 ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
              <h3 className={`font-black text-[10px] mb-6 uppercase tracking-widest ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>Diretrizes de Retenção</h3>
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Pontos necessários para o prêmio</label>
                  <input type="number" value={meta.pontos_necessarios} onChange={e => setMeta({...meta, pontos_necessarios: e.target.value})} className={`w-full p-3 rounded-xl border outline-none font-bold text-sm transition-colors focus:border-purple-500 ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Valor Mínimo p/ Pontuar (R$)</label>
                  <input type="number" value={meta.valor_minimo} onChange={e => setMeta({...meta, valor_minimo: e.target.value})} className={`w-full p-3 rounded-xl border outline-none font-bold text-sm transition-colors focus:border-purple-500 ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Prêmio Oferecido</label>
                  <input type="text" value={meta.premio} onChange={e => setMeta({...meta, premio: e.target.value})} className={`w-full p-3 rounded-xl border outline-none font-bold text-sm transition-colors focus:border-purple-500 ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
                </div>
                <button onClick={atualizarMeta} className="w-full py-4 mt-4 rounded-xl font-black uppercase text-[10px] tracking-widest bg-purple-600 hover:bg-purple-700 text-white shadow-md active:scale-95 transition-all">
                  Salvar Diretrizes
                </button>
              </div>
            </div>
          )}

          {abaInterna === 'publico' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
              <div className={`p-6 rounded-3xl shadow-sm border flex flex-col h-[400px] ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <h3 className={`text-[10px] font-black uppercase tracking-widest mb-2 text-center ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>Receita: Fiéis x Avulsos</h3>
                <p className={`text-[10px] font-bold text-center mb-4 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Comparativo de faturamento baseado na Tag Fidelidade.</p>
                {dadosReceita.length > 0 ? (
                  <div className="flex-1 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={dadosReceita} innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                          {dadosReceita.map((e, i) => <Cell key={i} fill={CORES_VIBRANTES[i % CORES_VIBRANTES.length]} />)}
                        </Pie>
                        <RechartsTooltip formatter={(val) => `R$ ${val.toFixed(2)}`} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: temaNoturno ? '#1f2937' : '#ffffff', color: temaNoturno ? '#ffffff' : '#000000', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: temaNoturno ? '#e5e7eb' : '#374151' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : <div className={`flex-1 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Nenhuma comanda processada.</div>}
              </div>

              <div className={`p-6 rounded-3xl shadow-sm border flex flex-col h-[400px] ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <h3 className={`text-[10px] font-black uppercase tracking-widest mb-4 text-center ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>Inteligência de Tags</h3>
                {dadosTags && dadosTags.length > 0 ? (
                  <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dadosTags} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="nome" type="category" axisLine={false} tickLine={false} tick={{fill: temaNoturno ? '#9ca3af' : '#6b7280', fontSize: 10, fontWeight: 'bold'}} width={120} />
                        <RechartsTooltip cursor={{fill: temaNoturno ? '#374151' : '#f3f4f6'}} content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className={`p-3 shadow-xl rounded-xl border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${temaNoturno ? 'text-gray-300' : 'text-gray-600'}`}>{data.nome}</p>
                                  <p className="text-sm font-bold text-purple-500">{data.qtd} comandas</p>
                                </div>
                              );
                            } return null;
                          }} 
                        />
                        <Bar dataKey="qtd" radius={[0, 4, 4, 0]} barSize={20} label={{ position: 'right', formatter: (val) => `${val} cmds`, fill: temaNoturno ? '#9ca3af' : '#6b7280', fontSize: 10, fontWeight: 'bold' }}>
                          {dadosTags.map((entry, index) => <Cell key={`cell-${index}`} fill={CORES_VIBRANTES[index % CORES_VIBRANTES.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <div className={`flex-1 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>As comandas não receberam tags.</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL CADASTRO / EDIÇÃO DE CLIENTE */}
      {mostrarModalNovo && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`w-full max-w-md p-8 rounded-3xl border shadow-2xl animate-in zoom-in-95 duration-300 ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <h2 className={`text-xl font-black mb-6 uppercase tracking-widest ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>{clienteEditando ? 'Editar Registro' : 'Cadastrar Registro'}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1 mb-1 block">Nome do Cliente</label>
                <input type="text" placeholder="Ex: Carlos Oliveira" value={novoCliente.nome} onChange={e => setNovoCliente({...novoCliente, nome: e.target.value})} className={`w-full p-3 rounded-xl border outline-none font-bold text-sm transition-colors focus:border-purple-500 ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1 mb-1 block">Contato (WhatsApp)</label>
                <input type="text" placeholder="Ex: 84999999999" value={novoCliente.telefone} onChange={e => setNovoCliente({...novoCliente, telefone: e.target.value})} className={`w-full p-3 rounded-xl border outline-none font-bold text-sm transition-colors focus:border-purple-500 ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1 mb-1 block">Data de Nascimento</label>
                <input type="date" value={novoCliente.aniversario} onChange={e => setNovoCliente({...novoCliente, aniversario: e.target.value})} className={`w-full p-3 rounded-xl border outline-none font-bold text-sm transition-colors focus:border-purple-500 color-scheme-dark ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1 mb-1 block">Saldo de Pontos Atual</label>
                <input type="number" placeholder="Ex: 0" value={novoCliente.pontos} onChange={e => setNovoCliente({...novoCliente, pontos: parseInt(e.target.value) || 0})} className={`w-full p-3 rounded-xl border outline-none font-bold text-sm transition-colors focus:border-purple-500 ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => { setMostrarModalNovo(false); setClienteEditando(null); }} className={`flex-1 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all active:scale-95 ${temaNoturno ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Cancelar</button>
              <button onClick={salvarNovoCliente} className="flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest bg-purple-600 text-white shadow-md hover:bg-purple-700 active:scale-95 transition-all">{clienteEditando ? 'Atualizar' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IMPORTAÇÃO EM MASSA */}
      {mostrarModalImportacao && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`w-full max-w-lg p-8 rounded-3xl border shadow-2xl animate-in zoom-in-95 duration-300 ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <h2 className={`text-xl font-black mb-2 uppercase tracking-widest ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>Importar Base de Dados</h2>
            <p className={`text-[10px] font-bold mb-6 leading-relaxed uppercase tracking-widest ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>
              Cole direto do Excel ou peça para uma IA formatar. <br/><br/>
              <span className="text-purple-500">Padrão esperado: Nome, Telefone, Data (AAAA-MM-DD), Pontos</span>
            </p>
            
            <textarea 
              rows="6"
              placeholder="Ex: Carlos Oliveira, 84999999999, 1999-05-10, 5&#10;Hanilton, 84988888888, 1995-12-25, 2" 
              value={textoImportacao} 
              onChange={e => setTextoImportacao(e.target.value)} 
              className={`w-full p-4 rounded-xl border outline-none font-mono text-xs transition-colors focus:border-purple-500 ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`} 
            />
            
            <div className="flex gap-3 mt-8">
              <button onClick={() => setMostrarModalImportacao(false)} className={`flex-1 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all active:scale-95 ${temaNoturno ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Cancelar</button>
              <button onClick={processarImportacao} className="flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest bg-purple-600 text-white shadow-md hover:bg-purple-700 active:scale-95 transition-all">Processar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PERFIL DO CLIENTE (Histórico de Consumo) */}
      {clientePerfil && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`w-full max-w-md p-8 rounded-3xl border shadow-2xl animate-in zoom-in-95 duration-300 ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <div className="flex justify-between items-start mb-6">
               <div>
                 <h2 className={`text-xl font-black uppercase tracking-widest ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>Perfil do Cliente</h2>
                 <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${temaNoturno ? 'text-purple-400' : 'text-purple-600'}`}>{clientePerfil.nome}</p>
               </div>
               <button onClick={() => setClientePerfil(null)} className={`p-2 rounded-full transition-all active:scale-95 ${temaNoturno ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>✕</button>
            </div>
            
            <div className="mb-6 flex gap-4">
               <div className={`flex-1 p-4 rounded-xl border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Saldo Atual</p>
                  <p className={`text-xl font-black ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>{clientePerfil.pontos} <span className="text-xs text-purple-500">pts</span></p>
               </div>
               <div className={`flex-1 p-4 rounded-xl border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Histórico (Total)</p>
                  <p className={`text-xl font-black ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>{clientePerfil.pontos_totais || clientePerfil.pontos} <span className="text-xs text-purple-500">pts</span></p>
               </div>
            </div>

            <h3 className={`text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${temaNoturno ? 'text-gray-300' : 'text-gray-800'}`}>
              <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
              Preferências de Consumo
            </h3>

            {produtosDoCliente.length === 0 ? (
               <p className={`text-[10px] font-bold uppercase tracking-widest text-center p-6 rounded-xl border border-dashed ${temaNoturno ? 'text-gray-500 border-gray-700' : 'text-gray-400 border-gray-300'}`}>Nenhuma comanda vinculada a este nome encontrada no histórico.</p>
            ) : (
               <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                  {produtosDoCliente.map((p, idx) => (
                     <div key={idx} className={`p-3 rounded-xl border flex justify-between items-center transition-all hover:-translate-y-1 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                        <div className="flex items-center gap-3">
                           <div className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-black ${idx === 0 ? 'bg-yellow-100 text-yellow-600' : (temaNoturno ? 'bg-gray-900 text-gray-500' : 'bg-gray-100 text-gray-500')}`}>#{idx + 1}</div>
                           <span className={`text-[10px] font-black uppercase tracking-widest ${temaNoturno ? 'text-gray-200' : 'text-gray-800'}`}>{p.nome}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${temaNoturno ? 'bg-gray-900 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>{p.qtd}x pedidos</span>
                     </div>
                  ))}
               </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}