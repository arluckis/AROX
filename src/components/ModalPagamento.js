'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ModalPagamento({ comanda, onConfirmar, onCancelar, temaNoturno, clientesFidelidade, metaFidelidade }) {
  const [desconto, setDesconto] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [valorRecebido, setValorRecebido] = useState('');
  const [modoDivisao, setModoDivisao] = useState(false);
  const [itensSelecionados, setItensSelecionados] = useState([]); // AGORA GUARDA O ID DO PRODUTO

  const [precisaBairro, setPrecisaBairro] = useState(false);
  const [bairros, setBairros] = useState([]);
  const [bairroSelecionado, setBairroSelecionado] = useState('');

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
  const isFidelidade = formaPagamento === 'Fidelidade';

  const handleConfirmar = async () => {
    if (precisaBairro && bairroSelecionado) {
      await supabase.from('comandas').update({ 
        bairro_id: bairroSelecionado,
        taxa_entrega: taxaEntrega 
      }).eq('id', comanda.id);
    }
    onConfirmar(valorFinal, formaPagamento, itensSelecionados, modoDivisao, bairroSelecionado, taxaEntrega, isFidelidade);
  };

  const itensPendentes = comanda.produtos.filter(p => !p.pago);
  const totalPendente = itensPendentes.reduce((acc, p) => acc + p.preco, 0);
  
  // CÁLCULO SEGURO USANDO O ID DO PRODUTO
  const subtotalItens = modoDivisao 
    ? comanda.produtos.filter(p => itensSelecionados.includes(p.id)).reduce((acc, p) => acc + p.preco, 0)
    : totalPendente;

  const subtotal = subtotalItens + taxaEntrega;
  const valorDesconto = parseFloat(desconto) || 0;
  
  const valorFinal = isFidelidade ? 0 : (subtotal - valorDesconto);
  
  const descontoInvalido = !isFidelidade && (valorDesconto > subtotal);
  const recebido = parseFloat(valorRecebido) || 0;
  const troco = recebido - valorFinal;
  const dinheiroInsuficiente = formaPagamento === 'Dinheiro' && recebido > 0 && recebido < valorFinal;
  const nadaSelecionado = modoDivisao && itensSelecionados.length === 0;

  const btnFinalizarDesabilitado = 
     !formaPagamento || 
     descontoInvalido || 
     dinheiroInsuficiente || 
     (formaPagamento === 'Dinheiro' && recebido === 0) || 
     nadaSelecionado || 
     (precisaBairro && !bairroSelecionado) ||
     (isFidelidade && !temPontosParaResgate);

  // FUNÇÃO SEGURA USANDO ID
  const toggleItem = (id) => {
    if (itensSelecionados.includes(id)) setItensSelecionados(itensSelecionados.filter(i => i !== id));
    else setItensSelecionados([...itensSelecionados, id]);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
      <div className={`rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] border ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
        <h2 className={`text-xl font-black mb-4 text-center uppercase tracking-widest ${temaNoturno ? 'text-green-400' : 'text-green-700'}`}>Fechamento</h2>
        
        <div className={`flex p-1 rounded-xl mb-6 border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-transparent'}`}>
          <button onClick={() => setModoDivisao(false)} className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition ${!modoDivisao ? (temaNoturno ? 'bg-gray-700 text-green-400 shadow-sm' : 'bg-white text-green-700 shadow-sm') : (temaNoturno ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500')}`}>
            Cobrar Restante
          </button>
          <button onClick={() => { setModoDivisao(true); setItensSelecionados([]); }} className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition ${modoDivisao ? (temaNoturno ? 'bg-gray-700 text-green-400 shadow-sm' : 'bg-white text-green-700 shadow-sm') : (temaNoturno ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500')}`}>
            Dividir Itens
          </button>
        </div>

        <div className="overflow-y-auto flex-1 pr-2 mb-4 scrollbar-hide">
          {modoDivisao && (
            <div className={`mb-6 p-4 rounded-xl border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
              <p className={`text-[10px] font-black uppercase tracking-wider mb-3 ${temaNoturno ? 'text-gray-400' : 'text-gray-400'}`}>Selecione o que será pago agora:</p>
              <div className="flex flex-col gap-2">
                {comanda.produtos.map((p) => {
                  if (p.pago) return null;
                  return (
                    <label key={p.id} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${temaNoturno ? 'hover:bg-gray-700' : 'hover:bg-white'}`}>
                      <div className="flex items-center gap-3">
                        {/* Agora passamos e checamos o p.id */}
                        <input type="checkbox" checked={itensSelecionados.includes(p.id)} onChange={() => toggleItem(p.id)} className="w-5 h-5 accent-green-600 rounded" />
                        <span className={`text-sm ${itensSelecionados.includes(p.id) ? (temaNoturno ? 'font-bold text-green-400' : 'font-bold text-green-700') : (temaNoturno ? 'text-gray-300' : 'text-gray-600')}`}>{p.nome}</span>
                      </div>
                      <span className={`text-sm font-medium ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>R$ {p.preco.toFixed(2)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {['Dinheiro', 'Pix', 'Cartão', 'iFood', 'Fidelidade'].map(forma => (
              <button key={forma} onClick={() => { setFormaPagamento(forma); if (forma !== 'Dinheiro') setValorRecebido(''); }} className={`p-2 rounded-xl border-2 font-bold text-xs transition ${formaPagamento === forma ? (forma === 'Fidelidade' ? 'border-purple-500 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : (temaNoturno ? 'border-green-500 bg-green-900/20 text-green-400' : 'border-green-500 bg-green-50 text-green-700')) : (temaNoturno ? 'border-gray-700 text-gray-400 hover:border-gray-500' : 'border-gray-200 text-gray-500 hover:border-gray-300')} ${forma === 'Fidelidade' ? 'col-span-2 sm:col-span-1' : ''}`}>
                {forma}
              </button>
            ))}
          </div>

          {isFidelidade && (
            <div className={`mb-4 p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 ${!clienteFidelizado || !temPontosParaResgate ? (temaNoturno ? 'bg-red-900/20 border-red-800/50' : 'bg-red-50 border-red-200') : (temaNoturno ? 'bg-purple-900/20 border-purple-800/50' : 'bg-purple-50 border-purple-200')}`}>
               {!clienteFidelizado ? (
                 <p className={`text-xs font-bold text-center ${temaNoturno ? 'text-red-400' : 'text-red-600'}`}>⚠️ O nome desta comanda ("{comanda.nome}") não pertence a nenhum cliente cadastrado na Fidelidade.</p>
               ) : !temPontosParaResgate ? (
                 <div className="text-center">
                   <p className={`text-xs font-bold ${temaNoturno ? 'text-red-400' : 'text-red-600'}`}>⚠️ {clienteFidelizado.nome} possui apenas {clienteFidelizado.pontos} pts.</p>
                   <p className={`text-[10px] uppercase font-black mt-1 ${temaNoturno ? 'text-red-500' : 'text-red-800'}`}>Faltam {(metaFidelidade.pontos_necessarios - clienteFidelizado.pontos)} pontos para resgate.</p>
                 </div>
               ) : (
                 <div className="text-center">
                   <p className={`text-xs font-bold ${temaNoturno ? 'text-purple-400' : 'text-purple-700'}`}>⭐ {clienteFidelizado.nome} tem {clienteFidelizado.pontos} pontos disponíveis!</p>
                   <p className={`text-[10px] uppercase font-black mt-1 ${temaNoturno ? 'text-purple-300' : 'text-purple-900'}`}>O valor da comanda será zerado e {metaFidelidade.pontos_necessarios} pontos serão debitados.</p>
                 </div>
               )}
            </div>
          )}

          {precisaBairro && (
            <div className={`flex flex-col gap-2 p-3 rounded-xl mb-4 border ${temaNoturno ? 'bg-blue-900/10 border-blue-800/50' : 'bg-blue-50 border-blue-200'}`}>
              <label className={`text-[10px] font-black uppercase tracking-wider ${temaNoturno ? 'text-blue-400' : 'text-blue-700'}`}>🚚 Bairro da Entrega:</label>
              <select value={bairroSelecionado} onChange={(e) => setBairroSelecionado(e.target.value)} className={`w-full p-2 rounded-lg outline-none text-xs font-bold transition border ${temaNoturno ? 'bg-gray-900 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 focus:border-blue-500'}`}>
                <option value="">-- Selecione o Bairro --</option>
                {bairros.map(b => (
                  <option key={b.id} value={b.id}>{b.nome} (Taxa: R$ {parseFloat(b.taxa).toFixed(2)})</option>
                ))}
              </select>
            </div>
          )}

          {taxaEntrega > 0 && !isFidelidade && (
            <div className={`flex items-center justify-between p-3 rounded-xl mb-4 border ${temaNoturno ? 'bg-blue-900/20 border-blue-800/50' : 'bg-blue-50 border-blue-100'}`}>
              <span className={`text-sm font-bold ${temaNoturno ? 'text-blue-400' : 'text-blue-700'}`}>Taxa de Entrega:</span>
              <span className={`text-sm font-bold ${temaNoturno ? 'text-blue-400' : 'text-blue-700'}`}>+ R$ {taxaEntrega.toFixed(2)}</span>
            </div>
          )}

          {!isFidelidade && (
            <div className={`flex items-center justify-between p-3 rounded-xl mb-4 border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
              <span className={`text-xs font-bold uppercase tracking-wider ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Desconto (R$):</span>
              <input type="number" placeholder="0.00" className={`w-24 text-right p-2 rounded-lg outline-none text-sm font-bold transition border ${descontoInvalido ? 'border-red-500 text-red-500 bg-red-50 dark:bg-red-900/20' : (temaNoturno ? 'bg-gray-900 border-gray-600 text-white focus:border-green-500' : 'bg-white border-gray-300 focus:border-green-500')}`} value={desconto} onChange={(e) => setDesconto(e.target.value)} />
            </div>
          )}

          {formaPagamento === 'Dinheiro' && !isFidelidade && (
            <div className={`mb-4 p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 ${temaNoturno ? 'bg-green-900/10 border-green-800/50' : 'bg-green-50 border-green-200'}`}>
              <label className={`text-[10px] uppercase font-black mb-2 block tracking-widest ${temaNoturno ? 'text-green-400' : 'text-green-800'}`}>Recebido do Cliente (R$)</label>
              <input type="number" placeholder="Ex: 50.00" className={`w-full text-lg p-3 border-2 rounded-xl outline-none font-bold transition ${dinheiroInsuficiente ? 'border-red-400 text-red-600 dark:bg-red-900/20' : (temaNoturno ? 'bg-gray-900 border-green-700/50 text-white focus:border-green-500' : 'bg-white border-green-300 focus:border-green-600')}`} value={valorRecebido} onChange={(e) => setValorRecebido(e.target.value)} />
              {recebido > valorFinal && !descontoInvalido && (
                <div className={`mt-3 flex justify-between items-center border-t pt-3 ${temaNoturno ? 'border-green-800/50' : 'border-green-200'}`}>
                  <span className={`font-bold uppercase text-[10px] tracking-widest ${temaNoturno ? 'text-green-400/80' : 'text-green-800'}`}>Troco a devolver:</span>
                  <span className={`text-xl font-black ${temaNoturno ? 'text-green-400' : 'text-green-700'}`}>R$ {troco.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={`p-4 rounded-xl mb-4 flex justify-between items-center border ${temaNoturno ? 'bg-gray-950 border-gray-800' : 'bg-gray-900 border-transparent'}`}>
          <div className="flex flex-col">
            <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Total a cobrar:</span>
            {modoDivisao && <span className="text-gray-500 text-[10px]">{itensSelecionados.length} itens selecionados</span>}
          </div>
          <span className={`text-2xl font-black ${descontoInvalido ? 'text-red-500' : 'text-green-400'}`}>R$ {valorFinal.toFixed(2)}</span>
        </div>

        <div className="flex gap-3">
          <button onClick={onCancelar} className={`flex-1 p-3 rounded-xl border-2 font-bold text-xs uppercase tracking-widest transition ${temaNoturno ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>Voltar</button>
          <button 
            onClick={handleConfirmar}
            disabled={btnFinalizarDesabilitado}
            className={`flex-1 p-3 rounded-xl font-black text-xs uppercase tracking-widest transition ${temaNoturno ? 'bg-green-600 text-white hover:bg-green-500 disabled:bg-gray-800 disabled:text-gray-500' : 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500'}`}
          >
            Finalizar
          </button>
        </div>
      </div>
    </div>
  );
}