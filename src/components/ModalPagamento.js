'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const Icons = {
  Dinheiro: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  Pix: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l8.5 8.5-8.5 8.5L3.5 11 12 2.5zm0 3.8l-4.7 4.7 4.7 4.7 4.7-4.7-4.7-4.7zm0 2.5a2.2 2.2 0 110 4.4 2.2 2.2 0 010-4.4z" /></svg>,
  CartaoCredito: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  CartaoDebito: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 8a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V8zM8 10h3v4H8zM14 14h2" /></svg>,
  iFood: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
  Fidelidade: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
  Remover: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
};

// HELPER: Garante precisão decimal exata (evita bugs de 0.3000000004 do JavaScript)
const arredondar = (valor) => Math.round((parseFloat(String(valor).replace(',', '.')) || 0) * 100) / 100;

export default function ModalPagamento({ comanda, onConfirmar, onCancelar, temaNoturno, clientesFidelidade, metaFidelidade }) {
  const [pagamentos, setPagamentos] = useState([]);
  const [desconto, setDesconto] = useState('');
  const [modoDivisao, setModoDivisao] = useState(false);
  const [itensSelecionados, setItensSelecionados] = useState([]);
  const [listaItensExpandida, setListaItensExpandida] = useState(true);

  const [precisaBairro, setPrecisaBairro] = useState(false);
  const [bairros, setBairros] = useState([]);
  const [bairroSelecionado, setBairroSelecionado] = useState('');
  
  const [teclaPressionada, setTeclaPressionada] = useState(null);

  const inputsRef = useRef({});
  const descontoRef = useRef(null);
  const finalizarRef = useRef(null);

  useEffect(() => {
    const verificarMotoboy = async () => {
      const { data: empData } = await supabase.from('empresas').select('motoboy_ativo').eq('id', comanda.empresa_id).single();
      if (empData?.motoboy_ativo && (comanda.tipo === 'Delivery' || comanda.tipo === 'iFood' || comanda.tipo === 'Balcão')) {
        setPrecisaBairro(true);
        const { data: bairrosData } = await supabase.from('bairros_entrega').select('*').eq('empresa_id', comanda.empresa_id).order('nome');
        if (bairrosData) setBairros(bairrosData);
      }
    };
    verificarMotoboy();
  }, [comanda.empresa_id, comanda.tipo]);

  const bairroObj = bairros.find(b => String(b.id) === String(bairroSelecionado));
  const taxaEntrega = bairroObj ? arredondar(bairroObj.taxa) : 0;

  const clienteFidelizado = clientesFidelidade?.find(c => c.nome.toLowerCase() === comanda.nome.toLowerCase());
  const temPontosParaResgate = clienteFidelizado && clienteFidelizado.pontos >= metaFidelidade?.pontos_necessarios;
  const isFidelidade = pagamentos.some(p => p.forma === 'Fidelidade');

  const itensPendentes = comanda.produtos.filter(p => !p.pago);
  const totalPendente = arredondar(itensPendentes.reduce((acc, p) => acc + p.preco, 0));
  
  const subtotalItens = modoDivisao 
    ? arredondar(comanda.produtos.filter(p => itensSelecionados.includes(p.id)).reduce((acc, p) => acc + p.preco, 0))
    : totalPendente;

  const subtotal = arredondar(subtotalItens + taxaEntrega);
  const valorDesconto = arredondar(desconto);
  
  const valorFinal = isFidelidade ? 0 : Math.max(0, arredondar(subtotal - valorDesconto));
  const totalPago = arredondar(pagamentos.reduce((acc, p) => acc + arredondar(p.valor), 0));
  
  const restante = isFidelidade ? 0 : Math.max(0, arredondar(valorFinal - totalPago));
  const troco = Math.max(0, arredondar(totalPago - valorFinal));

  const adicionarPagamento = useCallback((forma) => {
    setListaItensExpandida(false); 

    setPagamentos(prev => {
      if (forma === 'Fidelidade') return [{ id: Date.now(), forma: 'Fidelidade', valor: valorFinal }];
      
      let novosPagamentos = prev.filter(p => p.forma !== 'Fidelidade');
      let pagoAtual = arredondar(novosPagamentos.reduce((acc, p) => acc + arredondar(p.valor), 0));
      let falta = arredondar(valorFinal - pagoAtual);

      if (falta > 0 || novosPagamentos.length === 0) {
        const newId = Date.now();
        const novo = { id: newId, forma, valor: falta > 0 ? Number(falta.toFixed(2)) : 0 };
        
        setTimeout(() => { if(inputsRef.current[newId]) { inputsRef.current[newId].focus(); inputsRef.current[newId].select(); } }, 50);
        return [...novosPagamentos, novo];
      }
      return prev;
    });
  }, [valorFinal]);

  const atualizarValorPagamento = (id, novoValor) => { setPagamentos(prev => prev.map(p => p.id === id ? { ...p, valor: String(novoValor).replace(',', '.') } : p)); };
  const removerPagamento = (id) => { setPagamentos(prev => prev.filter(p => p.id !== id)); };

  const toggleModoDivisao = (dividir) => {
    setModoDivisao(dividir); setItensSelecionados([]); setPagamentos([]); setDesconto(''); setListaItensExpandida(dividir);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onCancelar(); return; }
      const tag = document.activeElement.tagName.toLowerCase();
      
      if (tag !== 'input' && tag !== 'select') {
        const keyMap = { '1': 'Dinheiro', '2': 'Pix', '3': 'Crédito', '4': 'Débito', '5': 'iFood', '6': 'Fidelidade' };
        if (keyMap[e.key]) {
          e.preventDefault(); setTeclaPressionada(e.key); setTimeout(() => setTeclaPressionada(null), 150);
          adicionarPagamento(keyMap[e.key]);
        }
        if (e.key.toLowerCase() === 'm') { 
          e.preventDefault(); const lastId = pagamentos[pagamentos.length - 1]?.id;
          if (lastId && inputsRef.current[lastId]) { inputsRef.current[lastId].focus(); inputsRef.current[lastId].select(); }
        }
      }
    };
    if (window.innerWidth >= 768) { window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }
  }, [onCancelar, adicionarPagamento, pagamentos]);

  const handleInputValorKeyDown = (e, pagId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const valDigitado = arredondar(e.target.value);
      const somaOutros = arredondar(pagamentos.filter(p => p.id !== pagId).reduce((acc, p) => acc + arredondar(p.valor), 0));
      if (arredondar(somaOutros + valDigitado) >= valorFinal) { setTimeout(() => { descontoRef.current?.focus(); descontoRef.current?.select(); }, 50); } else { e.target.blur(); }
    }
  };

  const handleConfirmar = async () => {
    if (precisaBairro && bairroSelecionado) { await supabase.from('comandas').update({ bairro_id: bairroSelecionado, taxa_entrega: taxaEntrega }).eq('id', comanda.id); }
    onConfirmar(valorFinal, pagamentos, itensSelecionados, modoDivisao, bairroSelecionado, taxaEntrega, isFidelidade);
  };

  const descontoInvalido = !isFidelidade && (valorDesconto > subtotal);
  const totalValido = totalPago >= arredondar(valorFinal - 0.01);
  const nadaSelecionado = modoDivisao && itensSelecionados.length === 0;

  const btnFinalizarDesabilitado = pagamentos.length === 0 || (!isFidelidade && !totalValido) || descontoInvalido || nadaSelecionado || (precisaBairro && !bairroSelecionado) || (isFidelidade && !temPontosParaResgate);

  const formas = [
    { nome: 'Dinheiro', key: '1', icon: Icons.Dinheiro }, { nome: 'Pix', key: '2', icon: Icons.Pix },
    { nome: 'Crédito', key: '3', icon: Icons.CartaoCredito }, { nome: 'Débito', key: '4', icon: Icons.CartaoDebito },
    { nome: 'iFood', key: '5', icon: Icons.iFood }, { nome: 'Fidelidade', key: '6', icon: Icons.Fidelidade }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      
      <div className={`w-full max-w-[900px] h-full max-h-[85vh] md:h-auto flex flex-col md:flex-row overflow-hidden rounded-2xl shadow-2xl border ${temaNoturno ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-black/5'}`}>
        
        {/* LADO ESQUERDO: PADS FÍSICOS E LANÇAMENTOS */}
        <div className="flex-[1.4] flex flex-col p-6 overflow-y-auto scrollbar-hide">
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-[18px] font-semibold tracking-tight ${temaNoturno ? 'text-white' : 'text-zinc-900'}`}>Pagamento</h2>
            <button onClick={onCancelar} className={`p-1.5 rounded-md transition-colors ${temaNoturno ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-black/5 text-zinc-500'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
          </div>
          
          <div className={`flex p-1 rounded-lg mb-6 border ${temaNoturno ? 'bg-white/[0.02] border-white/5' : 'bg-black/[0.02] border-black/5'}`}>
            <button onClick={() => toggleModoDivisao(false)} className={`flex-1 py-1.5 rounded-md text-[13px] font-medium transition-all ${!modoDivisao ? (temaNoturno ? 'bg-zinc-800 text-white shadow-sm' : 'bg-white text-zinc-900 shadow-sm') : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>Liquidar Total</button>
            <button onClick={() => toggleModoDivisao(true)} className={`flex-1 py-1.5 rounded-md text-[13px] font-medium transition-all ${modoDivisao ? (temaNoturno ? 'bg-zinc-800 text-white shadow-sm' : 'bg-white text-zinc-900 shadow-sm') : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>Dividir Itens</button>
          </div>

          {modoDivisao && (
            <div className={`mb-6 rounded-xl border overflow-hidden ${temaNoturno ? 'border-white/[0.06] bg-white/[0.01]' : 'border-black/[0.06] bg-black/[0.01]'}`}>
              <button onClick={() => setListaItensExpandida(!listaItensExpandida)} className="w-full flex items-center justify-between p-4 outline-none">
                <div className="flex items-center gap-3 text-left">
                  <div className={`flex flex-col`}>
                    <span className={`text-[12px] font-medium ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Itens: {itensSelecionados.length}</span>
                    <span className={`text-[14px] font-semibold ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>Subtotal: R$ {subtotalItens.toFixed(2)}</span>
                  </div>
                </div>
                <svg className={`w-4 h-4 transition-transform ${listaItensExpandida ? 'rotate-180' : ''} ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </button>

              {listaItensExpandida && (
                <div className={`p-4 max-h-48 overflow-y-auto scrollbar-hide border-t ${temaNoturno ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
                  <div className="flex flex-col gap-2">
                    {comanda.produtos.filter(p => !p.pago).map((p) => (
                      <label key={p.id} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors border ${itensSelecionados.includes(p.id) ? (temaNoturno ? 'bg-white/[0.06] border-white/20' : 'bg-black/[0.04] border-black/20') : 'border-transparent'}`}>
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={itensSelecionados.includes(p.id)} onChange={() => { setItensSelecionados(prev => prev.includes(p.id) ? prev.filter(i => i !== p.id) : [...prev, p.id]); setPagamentos([]); }} className="w-4 h-4 rounded" />
                          <span className={`text-[13px] font-medium ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>{p.nome}</span>
                        </div>
                        <span className={`text-[13px] font-semibold tabular-nums ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>R$ {p.preco.toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 shrink-0">
            {formas.map(f => {
              const isActive = pagamentos.some(p => p.forma === f.nome);
              const isPressed = teclaPressionada === f.key;
              return (
                <button
                  key={f.nome} onClick={() => adicionarPagamento(f.nome)}
                  className={`relative p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-100 select-none border group
                    ${temaNoturno ? 'bg-[#111] hover:border-white/20' : 'bg-white hover:border-black/15 shadow-sm'}
                    ${isActive ? (temaNoturno ? 'border-white text-white' : 'border-zinc-900 text-zinc-900 ring-1 ring-zinc-900') : (temaNoturno ? 'border-white/[0.06] text-zinc-400' : 'border-black/[0.06] text-zinc-600')}
                    ${isPressed ? 'scale-[0.97]' : 'active:scale-[0.98]'}
                  `}
                >
                  <div className="transition-transform group-hover:scale-105">{f.icon}</div>
                  <span className="text-[12px] font-medium tracking-tight">{f.nome}</span>
                  <div className={`absolute bottom-2 right-2 text-[10px] font-medium px-1.5 rounded opacity-40 ${temaNoturno ? 'bg-white/10' : 'bg-black/5'}`}>{f.key}</div>
                </button>
              )
            })}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide mt-6">
            {pagamentos.length > 0 && !isFidelidade && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <div className={`h-px w-full mb-6 ${temaNoturno ? 'bg-white/[0.06]' : 'bg-black/[0.06]'}`}></div>
                <div className="flex flex-col gap-3">
                  {pagamentos.map(pag => (
                    <div key={pag.id} className={`flex items-center gap-3 p-3 rounded-xl border ${temaNoturno ? 'bg-[#111] border-white/[0.06]' : 'bg-white border-black/[0.06] shadow-sm'}`}>
                      <span className={`flex-1 text-[13px] font-medium pl-1 ${temaNoturno ? 'text-zinc-300' : 'text-zinc-700'}`}>{pag.forma}</span>
                      <span className={`text-[13px] font-semibold ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>R$</span>
                      <input 
                         ref={el => inputsRef.current[pag.id] = el}
                         type="number" step="0.01" value={pag.valor} onChange={(e) => atualizarValorPagamento(pag.id, e.target.value)} onKeyDown={(e) => handleInputValorKeyDown(e, pag.id)}
                         className={`w-28 p-2 rounded-lg outline-none text-right font-semibold text-[14px] tabular-nums transition-all border focus:bg-white focus:ring-2 focus:ring-zinc-900/10 ${temaNoturno ? 'bg-white/[0.04] text-white border-transparent focus:bg-[#222] focus:ring-white/10' : 'bg-black/[0.03] text-zinc-900 border-transparent'}`}
                      />
                      <button onClick={() => removerPagamento(pag.id)} className={`p-2 rounded-lg transition-colors ${temaNoturno ? 'text-zinc-500 hover:text-red-400 hover:bg-white/5' : 'text-zinc-400 hover:text-red-500 hover:bg-black/5'}`}>
                         {Icons.Remover}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {isFidelidade && (
              <div className={`p-5 rounded-xl animate-in fade-in border mt-6 ${!clienteFidelizado || !temPontosParaResgate ? (temaNoturno ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-100') : (temaNoturno ? 'bg-white/[0.04] border-white/10' : 'bg-black/[0.03] border-black/10')}`}>
                 {!clienteFidelizado ? (
                   <p className={`text-[13px] font-medium text-center ${temaNoturno ? 'text-red-400' : 'text-red-600'}`}>Sem cliente vinculado.</p>
                 ) : !temPontosParaResgate ? (
                   <p className={`text-[13px] font-medium text-center ${temaNoturno ? 'text-red-400' : 'text-red-600'}`}>Saldo Insuficiente: {clienteFidelizado.pontos} pts.</p>
                 ) : (
                   <div className="text-center">
                     <p className={`text-[14px] font-semibold ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>Resgate ({clienteFidelizado.pontos} pts)</p>
                     <p className={`text-[12px] font-medium mt-1 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Valor debitado do programa de fidelidade.</p>
                   </div>
                 )}
              </div>
            )}
          </div>
        </div>

        {/* LADO DIREITO: RESUMO */}
        <div className={`flex-1 shrink-0 flex flex-col p-6 border-t md:border-t-0 md:border-l ${temaNoturno ? 'bg-[#111] border-white/[0.06]' : 'bg-[#FAFAFA] border-black/[0.06]'}`}>
           
           <div className="mb-6">
             <div className="flex justify-between items-end mb-2">
               <span className={`text-[12px] font-medium ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Status</span>
               <span className={`text-[13px] font-semibold tracking-tight ${restante <= 0 ? 'text-emerald-500' : (temaNoturno ? 'text-white' : 'text-zinc-900')}`}>
                 {restante <= 0 ? 'Liquidado' : `R$ ${restante.toFixed(2)}`}
               </span>
             </div>
             <div className={`w-full h-1.5 rounded-full overflow-hidden ${temaNoturno ? 'bg-white/10' : 'bg-black/10'}`}>
               <div className={`h-full transition-all duration-500 ease-in-out ${restante <= 0 ? 'bg-emerald-500' : (temaNoturno ? 'bg-zinc-400' : 'bg-zinc-600')}`} style={{width: `${Math.min(100, (totalPago / (valorFinal || 1)) * 100)}%`}}></div>
             </div>
           </div>

           <div className={`flex flex-col gap-3 text-[13px] font-medium ${temaNoturno ? 'text-zinc-400' : 'text-zinc-600'}`}>
              <div className="flex justify-between items-center py-1">
                <span>Subtotal Itens</span>
                <span className={`font-semibold tabular-nums ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>R$ {subtotalItens.toFixed(2)}</span>
              </div>

              {precisaBairro && (
                <select value={bairroSelecionado} onChange={(e) => setBairroSelecionado(e.target.value)} className={`w-full p-2.5 rounded-lg outline-none text-[13px] font-medium border ${temaNoturno ? 'bg-[#222] border-white/10 text-white' : 'bg-white border-black/10 text-zinc-900 shadow-sm'}`}>
                  <option value="">Adicionar Entrega</option>
                  {bairros.map(b => (
                    <option key={b.id} value={b.id}>{b.nome} (+ R$ {parseFloat(b.taxa).toFixed(2)})</option>
                  ))}
                </select>
              )}

              {taxaEntrega > 0 && (
                <div className="flex justify-between items-center py-1 text-indigo-500">
                  <span>Logística</span>
                  <span className="font-semibold tabular-nums">+ R$ {taxaEntrega.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-1 mt-1">
                <span>Desconto</span>
                <input 
                  ref={descontoRef} type="number" step="0.01" min="0" placeholder="0.00" value={desconto} onChange={e => setDesconto(e.target.value)}
                  onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); setTimeout(() => finalizarRef.current?.focus(), 50); } }}
                  className={`w-24 p-2 text-right rounded-lg outline-none font-semibold tabular-nums border ${descontoInvalido ? 'border-red-500 text-red-500 bg-red-50' : (temaNoturno ? 'bg-[#222] border-white/10 text-zinc-200' : 'bg-white border-black/10 text-zinc-800 shadow-sm')}`} 
                />
              </div>

              <div className={`w-full h-px my-3 ${temaNoturno ? 'bg-white/[0.06]' : 'bg-black/[0.06]'}`}></div>

              <div className="flex justify-between items-end">
                <span className={`text-[13px] font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Total</span>
                <span className={`text-3xl font-semibold tabular-nums tracking-tighter ${temaNoturno ? 'text-white' : 'text-zinc-900'}`}>
                  R$ {valorFinal.toFixed(2)}
                </span>
              </div>
              
              {troco > 0 && (
                <div className="flex justify-between items-center mt-3 py-1">
                  <span className="text-[13px] font-medium text-zinc-500">Troco</span>
                  <span className="text-xl font-semibold tabular-nums text-zinc-500">R$ {troco.toFixed(2)}</span>
                </div>
              )}
           </div>

           <div className="mt-auto pt-8 flex flex-col gap-3 shrink-0">
             <button
               ref={finalizarRef} onClick={handleConfirmar} disabled={btnFinalizarDesabilitado}
               className={`w-full py-3.5 rounded-xl font-semibold text-[14px] transition-colors flex items-center justify-center gap-2
                 ${btnFinalizarDesabilitado 
                   ? (temaNoturno ? 'bg-white/5 text-zinc-600' : 'bg-black/5 text-zinc-400')
                   : (temaNoturno ? 'bg-white text-zinc-900 hover:bg-zinc-200' : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm')}
               `}
             >
               Confirmar Pagamento
               {!btnFinalizarDesabilitado && <span className="text-[10px] opacity-60 font-medium px-1.5 border border-current rounded ml-1">ENTER</span>}
             </button>
             
             <button onClick={onCancelar} className={`w-full py-3 rounded-xl font-medium text-[13px] transition-colors ${temaNoturno ? 'text-zinc-400 hover:bg-white/5' : 'text-zinc-500 hover:bg-black/5'}`}>
               Cancelar
             </button>
           </div>
        </div>

      </div>
    </div>
  );
}