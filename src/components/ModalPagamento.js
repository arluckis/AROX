'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// Ícones SVG Premium Exclusivos
const Icons = {
  Dinheiro: <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  Pix: <svg className="w-6 h-6 md:w-8 md:h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l8.5 8.5-8.5 8.5L3.5 11 12 2.5zm0 3.8l-4.7 4.7 4.7 4.7 4.7-4.7-4.7-4.7zm0 2.5a2.2 2.2 0 110 4.4 2.2 2.2 0 010-4.4z" /></svg>,
  CartaoCredito: <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  CartaoDebito: <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 8a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V8zM8 10h3v4H8zM14 14h2" /></svg>,
  iFood: <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
  Fidelidade: <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
  Remover: <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
};

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
  const taxaEntrega = bairroObj ? parseFloat(bairroObj.taxa) : 0;

  const clienteFidelizado = clientesFidelidade?.find(c => c.nome.toLowerCase() === comanda.nome.toLowerCase());
  const temPontosParaResgate = clienteFidelizado && clienteFidelizado.pontos >= metaFidelidade?.pontos_necessarios;
  const isFidelidade = pagamentos.some(p => p.forma === 'Fidelidade');

  const itensPendentes = comanda.produtos.filter(p => !p.pago);
  const totalPendente = itensPendentes.reduce((acc, p) => acc + p.preco, 0);
  
  const subtotalItens = modoDivisao 
    ? comanda.produtos.filter(p => itensSelecionados.includes(p.id)).reduce((acc, p) => acc + p.preco, 0)
    : totalPendente;

  const subtotal = subtotalItens + taxaEntrega;
  const valorDesconto = parseFloat(desconto) || 0;
  
  const valorFinal = isFidelidade ? 0 : Math.max(0, subtotal - valorDesconto);
  const totalPago = pagamentos.reduce((acc, p) => acc + parseFloat(p.valor || 0), 0);
  
  const restante = isFidelidade ? 0 : Math.max(0, valorFinal - totalPago);
  const troco = Math.max(0, totalPago - valorFinal);

  const adicionarPagamento = useCallback((forma) => {
    setListaItensExpandida(false); // Recolhe automaticamente a div de itens a pagar

    setPagamentos(prev => {
      if (forma === 'Fidelidade') {
        return [{ id: Date.now(), forma: 'Fidelidade', valor: valorFinal }];
      }
      
      let novosPagamentos = prev.filter(p => p.forma !== 'Fidelidade');
      let pagoAtual = novosPagamentos.reduce((acc, p) => acc + parseFloat(p.valor || 0), 0);
      let falta = valorFinal - pagoAtual;

      if (falta > 0 || novosPagamentos.length === 0) {
        const newId = Date.now();
        const novo = { id: newId, forma, valor: falta > 0 ? Number(falta.toFixed(2)) : 0 };
        
        setTimeout(() => {
          if(inputsRef.current[newId]) {
            inputsRef.current[newId].focus();
            inputsRef.current[newId].select();
          }
        }, 50);

        return [...novosPagamentos, novo];
      }
      return prev;
    });
  }, [valorFinal]);

  const atualizarValorPagamento = (id, novoValor) => {
    setPagamentos(prev => prev.map(p => p.id === id ? { ...p, valor: novoValor } : p));
  };

  const removerPagamento = (id) => {
    setPagamentos(prev => prev.filter(p => p.id !== id));
  };

  const toggleModoDivisao = (dividir) => {
    setModoDivisao(dividir);
    setItensSelecionados([]);
    setPagamentos([]); 
    setDesconto('');
    setListaItensExpandida(dividir); // Expande automaticamente ao ativar
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onCancelar(); return; }
      const tag = document.activeElement.tagName.toLowerCase();
      
      if (tag !== 'input' && tag !== 'select') {
        const keyMap = { '1': 'Dinheiro', '2': 'Pix', '3': 'Crédito', '4': 'Débito', '5': 'iFood', '6': 'Fidelidade' };
        if (keyMap[e.key]) {
          e.preventDefault();
          setTeclaPressionada(e.key);
          setTimeout(() => setTeclaPressionada(null), 150);
          adicionarPagamento(keyMap[e.key]);
        }
        if (e.key.toLowerCase() === 'm') { 
          e.preventDefault(); 
          const lastId = pagamentos[pagamentos.length - 1]?.id;
          if (lastId && inputsRef.current[lastId]) {
            inputsRef.current[lastId].focus();
            inputsRef.current[lastId].select();
          }
        }
      }
    };
    if (window.innerWidth >= 768) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [onCancelar, adicionarPagamento, pagamentos]);

  const handleInputValorKeyDown = (e, pagId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const valDigitado = parseFloat(e.target.value) || 0;
      const somaOutros = pagamentos.filter(p => p.id !== pagId).reduce((acc, p) => acc + parseFloat(p.valor||0), 0);
      
      if ((somaOutros + valDigitado) >= valorFinal) {
        setTimeout(() => {
          descontoRef.current?.focus();
          descontoRef.current?.select();
        }, 50);
      } else {
        e.target.blur();
      }
    }
  };

  const handleConfirmar = async () => {
    if (precisaBairro && bairroSelecionado) {
      await supabase.from('comandas').update({ 
        bairro_id: bairroSelecionado,
        taxa_entrega: taxaEntrega 
      }).eq('id', comanda.id);
    }
    onConfirmar(valorFinal, pagamentos, itensSelecionados, modoDivisao, bairroSelecionado, taxaEntrega, isFidelidade);
  };

  const descontoInvalido = !isFidelidade && (valorDesconto > subtotal);
  const totalValido = totalPago >= (valorFinal - 0.01);
  const nadaSelecionado = modoDivisao && itensSelecionados.length === 0;

  const btnFinalizarDesabilitado = 
     pagamentos.length === 0 || 
     (!isFidelidade && !totalValido) || 
     descontoInvalido || 
     nadaSelecionado || 
     (precisaBairro && !bairroSelecionado) ||
     (isFidelidade && !temPontosParaResgate);

  const formas = [
    { nome: 'Dinheiro', key: '1', icon: Icons.Dinheiro },
    { nome: 'Pix', key: '2', icon: Icons.Pix },
    { nome: 'Crédito', key: '3', icon: Icons.CartaoCredito },
    { nome: 'Débito', key: '4', icon: Icons.CartaoDebito },
    { nome: 'iFood', key: '5', icon: Icons.iFood },
    { nome: 'Fidelidade', key: '6', icon: Icons.Fidelidade }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center md:p-6 bg-white dark:bg-gray-950 md:bg-black/80 md:backdrop-blur-md animate-in fade-in duration-200">
      
      <div className={`w-full h-full md:h-auto md:max-h-[95vh] md:max-w-7xl flex flex-col md:flex-row overflow-hidden md:rounded-[2rem] shadow-2xl border-0 md:border ${temaNoturno ? 'bg-gray-900 md:border-gray-800' : 'bg-gray-50 md:border-gray-200'}`}>
        
        {/* LADO ESQUERDO (TOPO NO MOBILE): CONTROLE DE ITENS E TECLADO */}
        <div className={`flex-1 flex flex-col p-4 md:p-10 overflow-y-auto scrollbar-hide ${temaNoturno ? 'bg-gray-900' : 'bg-white'}`}>
          <div className="hidden md:flex justify-between items-center mb-8">
            <h2 className={`text-2xl font-black uppercase tracking-widest ${temaNoturno ? 'text-green-400' : 'text-green-600'}`}>Pagamento</h2>
          </div>
          
          <div className={`flex p-1.5 rounded-xl md:rounded-2xl mb-5 md:mb-8 border shrink-0 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200 shadow-inner'}`}>
            <button onClick={() => toggleModoDivisao(false)} className={`flex-1 py-3 md:py-4 rounded-lg md:rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all ${!modoDivisao ? (temaNoturno ? 'bg-gray-700 text-green-400 shadow-md' : 'bg-white text-green-600 shadow-md') : (temaNoturno ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')}`}>
              Cobrar Tudo
            </button>
            <button onClick={() => toggleModoDivisao(true)} className={`flex-1 py-3 md:py-4 rounded-lg md:rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all ${modoDivisao ? (temaNoturno ? 'bg-gray-700 text-green-400 shadow-md' : 'bg-white text-green-600 shadow-md') : (temaNoturno ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')}`}>
              Dividir Itens
            </button>
          </div>

          {/* ABA DIVIDIR ITENS (MENU EXPANSÍVEL / COLLAPSIBLE) */}
          {modoDivisao && (
            <div className={`mb-5 md:mb-8 rounded-2xl border flex flex-col shrink-0 transition-all shadow-sm ${temaNoturno ? 'bg-gray-800/40 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              
              {/* HEADER DO ACCORDION */}
              <button
                onClick={() => setListaItensExpandida(!listaItensExpandida)}
                className={`w-full flex items-center justify-between p-3 md:p-4 rounded-2xl transition-colors outline-none focus:ring-2 focus:ring-green-500/50 ${temaNoturno ? 'hover:bg-gray-800' : 'hover:bg-gray-100/80'} ${!listaItensExpandida && !temaNoturno ? 'bg-white' : ''} ${!listaItensExpandida && temaNoturno ? 'bg-gray-800' : ''}`}
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-inner ${temaNoturno ? 'bg-gray-900 text-green-400' : 'bg-white text-green-600'}`}>
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>
                      Itens a Pagar: {itensSelecionados.length}
                    </span>
                    <span className={`text-[11px] md:text-sm font-bold ${temaNoturno ? 'text-green-400' : 'text-green-600'}`}>
                      Subtotal: R$ {subtotalItens.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className={`p-1.5 md:p-2 rounded-full transition-transform duration-300 shadow-sm ${listaItensExpandida ? 'rotate-180' : ''} ${temaNoturno ? 'bg-gray-900 text-gray-400' : 'bg-white border border-gray-200 text-gray-500'}`}>
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </button>

              {/* CORPO DO ACCORDION */}
              {listaItensExpandida && (
                <div className={`p-3 md:p-5 border-t max-h-48 md:max-h-56 overflow-y-auto scrollbar-hide animate-in fade-in slide-in-from-top-2 ${temaNoturno ? 'border-gray-700 bg-gray-900/30 rounded-b-2xl' : 'border-gray-200 bg-white rounded-b-2xl'}`}>
                  <p className={`text-[10px] md:text-[11px] font-black uppercase tracking-wider mb-3 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Selecione o que será pago agora:</p>
                  <div className="flex flex-col gap-2">
                    {comanda.produtos.filter(p => !p.pago).map((p) => (
                      <label key={p.id} className={`flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl cursor-pointer transition-all border ${itensSelecionados.includes(p.id) ? (temaNoturno ? 'bg-green-900/20 border-green-500/50' : 'bg-green-50 border-green-300') : (temaNoturno ? 'bg-gray-800 border-transparent hover:border-gray-600' : 'bg-white border-gray-200 hover:border-gray-300')}`}>
                        <div className="flex items-center gap-3 md:gap-4">
                          <input type="checkbox" checked={itensSelecionados.includes(p.id)} onChange={() => {
                            setItensSelecionados(prev => prev.includes(p.id) ? prev.filter(i => i !== p.id) : [...prev, p.id]);
                            setPagamentos([]); 
                          }} className="w-5 h-5 accent-green-500 rounded cursor-pointer" />
                          <span className={`text-[11px] md:text-sm ${itensSelecionados.includes(p.id) ? (temaNoturno ? 'font-bold text-green-400' : 'font-bold text-green-700') : (temaNoturno ? 'text-gray-300' : 'text-gray-700')}`}>{p.nome}</span>
                        </div>
                        <span className={`text-[11px] md:text-sm font-bold ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>R$ {p.preco.toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 md:grid-cols-3 gap-3 md:gap-6 mb-5 md:mb-8 shrink-0">
            {formas.map(f => (
              <button
                key={f.nome}
                onClick={() => adicionarPagamento(f.nome)}
                className={`relative p-4 md:p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 md:gap-3 transition-all active:scale-95 overflow-hidden group 
                  ${teclaPressionada === f.key ? 'ring-4 ring-green-500/50 scale-95' : ''}
                  ${pagamentos.some(p => p.forma === f.nome) 
                    ? (temaNoturno ? 'border-green-500 bg-green-900/20 text-green-400' : 'border-green-500 bg-green-50 text-green-600') 
                    : (temaNoturno ? 'border-gray-700 bg-gray-800 hover:border-gray-500 text-gray-300' : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600 shadow-sm')}`}
              >
                {pagamentos.some(p => p.forma === f.nome) && (
                  <div className="absolute top-0 right-0 w-8 h-8 md:w-10 md:h-10 bg-green-500 rounded-bl-2xl flex items-center justify-center shadow-md">
                     <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
                <div className="transition-transform group-hover:scale-110">{f.icon}</div>
                <span className="text-[9px] md:text-[11px] font-black text-center uppercase tracking-wider">{f.nome}</span>
                <div className={`absolute bottom-2 left-2 md:bottom-3 md:left-3 text-[8px] md:text-[10px] font-black px-1.5 md:px-2 py-0.5 rounded shadow-sm border hidden md:block ${temaNoturno ? 'bg-gray-900 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>[{f.key}]</div>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {pagamentos.length > 0 && !isFidelidade && (
              <div className={`p-4 md:p-6 rounded-2xl border animate-in fade-in slide-in-from-top-2 ${temaNoturno ? 'bg-gray-800/40 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <h4 className={`text-[10px] md:text-[11px] font-black uppercase tracking-widest mb-4 md:mb-5 ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Formas Adicionadas</h4>
                
                {/* 2 COLUNAS FIXAS NO DESKTOP */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {pagamentos.map(pag => (
                    <div key={pag.id} className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl border shadow-sm ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                      <div className="flex-1 flex flex-col truncate">
                         <span className={`text-[10px] md:text-[11px] font-black uppercase tracking-wider truncate ${temaNoturno ? 'text-gray-200' : 'text-gray-800'}`}>{pag.forma}</span>
                      </div>
                      <span className={`text-xs md:text-sm font-bold ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>R$</span>
                      <input 
                         ref={el => inputsRef.current[pag.id] = el}
                         type="number" step="0.01" 
                         value={pag.valor} 
                         onChange={(e) => atualizarValorPagamento(pag.id, e.target.value)}
                         onKeyDown={(e) => handleInputValorKeyDown(e, pag.id)}
                         className={`w-24 md:w-28 p-2 md:p-2.5 rounded-lg md:rounded-xl outline-none text-right font-black text-sm md:text-base transition-all border focus:ring-2 focus:ring-green-500/50 ${temaNoturno ? 'bg-gray-800 text-green-400 border-gray-600 focus:border-green-500' : 'bg-gray-50 text-green-600 border-gray-300 focus:border-green-500'}`}
                      />
                      <button onClick={() => removerPagamento(pag.id)} className={`p-2 md:p-2.5 rounded-lg md:rounded-xl transition-colors active:scale-95 ${temaNoturno ? 'text-red-400 hover:bg-red-900/30' : 'text-red-500 hover:bg-red-50'}`}>
                         {Icons.Remover}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isFidelidade && (
              <div className={`p-4 md:p-8 rounded-2xl border animate-in fade-in slide-in-from-top-2 ${!clienteFidelizado || !temPontosParaResgate ? (temaNoturno ? 'bg-red-900/20 border-red-800/50' : 'bg-red-50 border-red-200') : (temaNoturno ? 'bg-green-900/20 border-green-800/50' : 'bg-green-50 border-green-200')}`}>
                 {!clienteFidelizado ? (
                   <p className={`text-[11px] md:text-xs font-bold text-center ${temaNoturno ? 'text-red-400' : 'text-red-600'}`}>⚠️ Comanda sem cliente Fidelidade vinculado.</p>
                 ) : !temPontosParaResgate ? (
                   <div className="text-center">
                     <p className={`text-[11px] md:text-xs font-bold ${temaNoturno ? 'text-red-400' : 'text-red-600'}`}>⚠️ {clienteFidelizado.nome} possui apenas {clienteFidelizado.pontos} pts.</p>
                   </div>
                 ) : (
                   <div className="text-center">
                     <p className={`text-xs md:text-sm font-black uppercase ${temaNoturno ? 'text-green-400' : 'text-green-600'}`}>⭐ {clienteFidelizado.pontos} pontos disponíveis!</p>
                     <p className={`text-[9px] md:text-[10px] uppercase font-bold mt-2 md:mt-3 ${temaNoturno ? 'text-green-300' : 'text-green-700'}`}>O valor será zerado e debitado da fidelidade.</p>
                   </div>
                 )}
              </div>
            )}
          </div>
        </div>

        {/* LADO DIREITO (RODAPÉ NO MOBILE): RESUMO E FINALIZAÇÃO */}
        <div className={`w-full md:w-[450px] shrink-0 flex flex-col p-4 md:p-10 border-t md:border-t-0 md:border-l ${temaNoturno ? 'bg-gradient-to-b from-gray-900 to-gray-950 border-gray-800' : 'bg-gradient-to-b from-gray-50 to-white border-gray-200 shadow-inner'}`}>
           
           <h3 className={`hidden md:block text-[11px] font-black uppercase tracking-widest mb-6 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Resumo da Comanda</h3>
           
           {/* Barra de Progresso (Desktop e Mobile) */}
           <div className="mb-4 md:mb-8">
             <div className="flex justify-between items-end mb-2 md:mb-3">
               <span className={`text-[10px] md:text-[11px] font-bold uppercase tracking-wider ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Progresso</span>
               <span className={`text-xs md:text-sm font-black ${restante <= 0 ? 'text-green-500' : (temaNoturno ? 'text-green-400' : 'text-green-600')}`}>
                 {restante <= 0 ? 'CONCLUÍDO' : `FALTA R$ ${restante.toFixed(2)}`}
               </span>
             </div>
             <div className={`w-full h-2 md:h-3 rounded-full overflow-hidden shadow-inner ${temaNoturno ? 'bg-gray-800' : 'bg-gray-200'}`}>
               <div className={`h-full transition-all duration-500 ease-out ${restante <= 0 ? 'bg-green-500' : 'bg-gradient-to-r from-green-400 to-green-500'}`} style={{width: `${Math.min(100, (totalPago / (valorFinal || 1)) * 100)}%`}}></div>
             </div>
           </div>

           {/* Valores do Resumo: Desktop */}
           <div className={`hidden md:flex flex-1 flex-col justify-center gap-6 text-sm font-medium ${temaNoturno ? 'text-gray-300' : 'text-gray-600'}`}>
              <div className="flex justify-between items-center">
                <span>Subtotal (Itens)</span>
                <span className="font-bold">R$ {subtotalItens.toFixed(2)}</span>
              </div>

              {precisaBairro && (
                <div className="flex flex-col gap-2 mt-1">
                  <select value={bairroSelecionado} onChange={(e) => setBairroSelecionado(e.target.value)} className={`w-full p-3 rounded-xl outline-none text-[11px] font-bold transition border ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white focus:border-green-500' : 'bg-white border-gray-300 focus:border-green-500 shadow-sm'}`}>
                    <option value="">-- Bairro de Entrega --</option>
                    {bairros.map(b => (
                      <option key={b.id} value={b.id}>{b.nome} (+ R$ {parseFloat(b.taxa).toFixed(2)})</option>
                    ))}
                  </select>
                </div>
              )}

              {taxaEntrega > 0 && (
                <div className="flex justify-between items-center text-blue-500 font-bold text-xs">
                  <span>Taxa de Entrega</span>
                  <span>+ R$ {taxaEntrega.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center mt-2">
                <span className="uppercase tracking-widest text-[10px] font-black">Desconto R$</span>
                <input 
                  ref={descontoRef}
                  type="number" step="0.01" min="0" placeholder="0.00"
                  value={desconto} onChange={e => setDesconto(e.target.value)}
                  onKeyDown={(e) => {
                    if(e.key === 'Enter') {
                      e.preventDefault();
                      setTimeout(() => finalizarRef.current?.focus(), 50);
                    }
                  }}
                  className={`w-32 p-3 text-right rounded-xl outline-none border transition-all font-bold text-sm focus:ring-2 focus:ring-green-500/50 ${descontoInvalido ? 'border-red-500 text-red-500' : (temaNoturno ? 'bg-gray-800 border-gray-700 text-green-400 focus:border-green-500' : 'bg-white border-gray-300 text-green-600 focus:border-green-500 shadow-sm')}`} 
                />
              </div>

              <hr className={`my-2 border-dashed ${temaNoturno ? 'border-gray-800' : 'border-gray-300'}`}/>

              <div className="flex justify-between items-end">
                <span className={`uppercase tracking-widest text-[11px] font-black ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Total Final</span>
                <span className={`text-2xl font-black ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>R$ {valorFinal.toFixed(2)}</span>
              </div>
              
              {troco > 0 && (
                <div className="flex justify-between items-center mt-2 p-5 rounded-2xl border animate-in fade-in slide-in-from-bottom-2 bg-green-500/10 border-green-500/30">
                  <span className="uppercase tracking-widest text-[11px] font-black text-green-600 dark:text-green-400">Troco</span>
                  <span className="text-xl font-black text-green-600 dark:text-green-400">R$ {troco.toFixed(2)}</span>
                </div>
              )}
           </div>

           {/* Valores do Resumo: Mobile */}
           <div className="flex md:hidden flex-col gap-3 mb-4">
             <div className={`flex justify-between items-center p-4 rounded-xl shadow-sm border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                <div className="flex flex-col">
                   <span className={`text-[10px] font-black uppercase tracking-widest ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Total</span>
                   <span className={`text-base font-black ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>R$ {valorFinal.toFixed(2)}</span>
                </div>
                <div className="flex flex-col text-right">
                   <span className={`text-[10px] font-black uppercase tracking-widest ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Pago</span>
                   <span className="text-base font-black text-green-600 dark:text-green-400">R$ {totalPago.toFixed(2)}</span>
                </div>
             </div>
             {troco > 0 && (
               <div className="flex justify-between items-center p-3 rounded-xl border bg-green-500/10 border-green-500/30">
                 <span className="uppercase tracking-widest text-[10px] font-black text-green-600 dark:text-green-400">Troco</span>
                 <span className="text-sm font-black text-green-600 dark:text-green-400">R$ {troco.toFixed(2)}</span>
               </div>
             )}
           </div>

           {/* Botões (Desktop e Mobile) */}
           <div className="mt-auto md:mt-8 flex flex-col gap-3 md:gap-4 shrink-0">
             <button
               ref={finalizarRef}
               onClick={handleConfirmar}
               disabled={btnFinalizarDesabilitado}
               className={`w-full py-4 md:py-6 rounded-xl md:rounded-2xl font-black text-[11px] md:text-xs uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1.5 relative overflow-hidden group
                 ${btnFinalizarDesabilitado 
                   ? (temaNoturno ? 'bg-gray-800 text-gray-600 border border-gray-700' : 'bg-gray-200 text-gray-400')
                   : 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg md:hover:shadow-[0_8px_25px_rgba(34,197,94,0.4)] transform md:hover:-translate-y-1 active:scale-95 active:translate-y-0'}
               `}
             >
               {!btnFinalizarDesabilitado && <div className="absolute inset-0 bg-white/20 w-full h-full transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out hidden md:block"></div>}
               <span className="flex items-center gap-2">
                 <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                 Finalizar Pagamento
               </span>
               {!btnFinalizarDesabilitado && <span className="text-[9px] opacity-70 font-bold hidden md:inline">[ENTER]</span>}
             </button>
             
             <button onClick={onCancelar} className={`w-full py-3.5 md:py-4 rounded-xl md:rounded-2xl border-2 font-bold text-[10px] md:text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${temaNoturno ? 'border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-white' : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
               Voltar <span className="text-[9px] opacity-70 border px-1.5 py-0.5 rounded shadow-sm border-current hidden md:inline">[ESC]</span>
             </button>
           </div>
        </div>

      </div>
    </div>
  );
}