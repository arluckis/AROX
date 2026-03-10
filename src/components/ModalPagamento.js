'use client';
import { useState } from 'react';

export default function ModalPagamento({ comanda, onConfirmar, onCancelar, temaNoturno }) {
  const [desconto, setDesconto] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [valorRecebido, setValorRecebido] = useState('');
  const [modoDivisao, setModoDivisao] = useState(false);
  const [itensSelecionados, setItensSelecionados] = useState([]);

  const itensPendentes = comanda.produtos.filter(p => !p.pago);
  const totalPendente = itensPendentes.reduce((acc, p) => acc + p.preco, 0);
  
  const subtotal = modoDivisao 
    ? itensSelecionados.reduce((acc, index) => acc + comanda.produtos[index].preco, 0)
    : totalPendente;

  const valorDesconto = parseFloat(desconto) || 0;
  const valorFinal = subtotal - valorDesconto;
  
  const descontoInvalido = valorDesconto > subtotal;
  const recebido = parseFloat(valorRecebido) || 0;
  const troco = recebido - valorFinal;
  const dinheiroInsuficiente = formaPagamento === 'Dinheiro' && recebido > 0 && recebido < valorFinal;
  const nadaSelecionado = modoDivisao && itensSelecionados.length === 0;

  const toggleItem = (index) => {
    if (itensSelecionados.includes(index)) {
      setItensSelecionados(itensSelecionados.filter(i => i !== index));
    } else {
      setItensSelecionados([...itensSelecionados, index]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
      <div className={`rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] border ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
        <h2 className={`text-2xl font-bold mb-4 text-center ${temaNoturno ? 'text-green-400' : 'text-green-700'}`}>Fechamento</h2>
        
        <div className={`flex p-1 rounded-xl mb-6 border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-transparent'}`}>
          <button onClick={() => setModoDivisao(false)} className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${!modoDivisao ? (temaNoturno ? 'bg-gray-700 text-green-400 shadow-sm' : 'bg-white text-green-700 shadow-sm') : (temaNoturno ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500')}`}>
            Cobrar Restante
          </button>
          <button onClick={() => setModoDivisao(true)} className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${modoDivisao ? (temaNoturno ? 'bg-gray-700 text-green-400 shadow-sm' : 'bg-white text-green-700 shadow-sm') : (temaNoturno ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500')}`}>
            Dividir Itens
          </button>
        </div>

        <div className="overflow-y-auto flex-1 pr-2 mb-4 scrollbar-hide">
          {modoDivisao && (
            <div className={`mb-6 p-4 rounded-xl border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${temaNoturno ? 'text-gray-400' : 'text-gray-400'}`}>Selecione o que será pago agora:</p>
              <div className="flex flex-col gap-2">
                {comanda.produtos.map((p, index) => {
                  if (p.pago) return null;
                  return (
                    <label key={index} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${temaNoturno ? 'hover:bg-gray-700' : 'hover:bg-white'}`}>
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          checked={itensSelecionados.includes(index)}
                          onChange={() => toggleItem(index)}
                          className="w-5 h-5 accent-green-600 rounded"
                        />
                        <span className={`text-sm ${itensSelecionados.includes(index) ? (temaNoturno ? 'font-bold text-green-400' : 'font-bold text-green-700') : (temaNoturno ? 'text-gray-300' : 'text-gray-600')}`}>{p.nome}</span>
                      </div>
                      <span className={`text-sm font-medium ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>R$ {p.preco.toFixed(2)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-4">
            {['Dinheiro', 'Pix', 'Cartão', 'iFood'].map(forma => (
              <button 
                key={forma}
                onClick={() => { setFormaPagamento(forma); if (forma !== 'Dinheiro') setValorRecebido(''); }}
                className={`p-3 rounded-xl border-2 font-bold text-sm transition ${formaPagamento === forma ? (temaNoturno ? 'border-green-500 bg-green-900/20 text-green-400' : 'border-green-500 bg-green-50 text-green-700') : (temaNoturno ? 'border-gray-700 text-gray-400 hover:border-green-500/50' : 'border-gray-200 text-gray-500 hover:border-green-300')}`}
              >
                {forma}
              </button>
            ))}
          </div>

          <div className={`flex items-center justify-between p-3 rounded-xl mb-4 border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
            <span className={`text-sm font-bold ${temaNoturno ? 'text-gray-300' : 'text-gray-600'}`}>Desconto (R$):</span>
            <input type="number" placeholder="0.00" className={`w-24 text-right p-2 rounded-lg outline-none text-sm transition border ${descontoInvalido ? 'border-red-500 text-red-500 bg-red-50 dark:bg-red-900/20' : (temaNoturno ? 'bg-gray-900 border-gray-600 text-white focus:border-green-500' : 'bg-white border-gray-300 focus:border-green-500')}`} value={desconto} onChange={(e) => setDesconto(e.target.value)} />
          </div>

          {formaPagamento === 'Dinheiro' && (
            <div className={`mb-4 p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 ${temaNoturno ? 'bg-green-900/10 border-green-800/50' : 'bg-green-50 border-green-200'}`}>
              <label className={`text-sm font-bold mb-2 block ${temaNoturno ? 'text-green-400' : 'text-green-800'}`}>Recebido do Cliente (R$)</label>
              <input type="number" placeholder="Ex: 50.00" className={`w-full text-lg p-3 border-2 rounded-xl outline-none transition ${dinheiroInsuficiente ? 'border-red-400 text-red-600 dark:bg-red-900/20' : (temaNoturno ? 'bg-gray-900 border-green-700/50 text-white focus:border-green-500' : 'bg-white border-green-300 focus:border-green-600')}`} value={valorRecebido} onChange={(e) => setValorRecebido(e.target.value)} />
              {recebido > valorFinal && !descontoInvalido && (
                <div className={`mt-3 flex justify-between items-center border-t pt-3 ${temaNoturno ? 'border-green-800/50' : 'border-green-200'}`}>
                  <span className={`font-bold uppercase text-xs ${temaNoturno ? 'text-green-400/80' : 'text-green-800'}`}>Troco a devolver:</span>
                  <span className={`text-xl font-black ${temaNoturno ? 'text-green-400' : 'text-green-700'}`}>R$ {troco.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={`p-4 rounded-xl mb-4 flex justify-between items-center border ${temaNoturno ? 'bg-gray-950 border-gray-800' : 'bg-gray-900 border-transparent'}`}>
          <div className="flex flex-col">
            <span className="text-gray-400 font-medium text-xs">Total a cobrar agora:</span>
            {modoDivisao && <span className="text-gray-500 text-[10px]">{itensSelecionados.length} itens selecionados</span>}
          </div>
          <span className={`text-2xl font-black ${descontoInvalido ? 'text-red-500' : 'text-green-400'}`}>R$ {valorFinal > 0 ? valorFinal.toFixed(2) : '0.00'}</span>
        </div>

        <div className="flex gap-3">
          <button onClick={onCancelar} className={`flex-1 p-3 rounded-xl border-2 font-bold transition ${temaNoturno ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>Voltar</button>
          <button 
            onClick={() => onConfirmar(valorFinal, formaPagamento, itensSelecionados, modoDivisao)}
            disabled={!formaPagamento || descontoInvalido || dinheiroInsuficiente || (formaPagamento === 'Dinheiro' && recebido === 0) || nadaSelecionado}
            className={`flex-1 p-3 rounded-xl font-bold transition ${temaNoturno ? 'bg-green-600 text-white hover:bg-green-500 disabled:bg-gray-800 disabled:text-gray-500' : 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500'}`}
          >
            Finalizar
          </button>
        </div>
      </div>
    </div>
  );
}