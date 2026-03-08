'use client';
import { useState } from 'react';

export default function ModalPagamento({ comanda, onConfirmar, onCancelar }) {
  const [desconto, setDesconto] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [valorRecebido, setValorRecebido] = useState('');
  const [modoDivisao, setModoDivisao] = useState(false);
  const [itensSelecionados, setItensSelecionados] = useState([]);

  // Filtra apenas os itens que AINDA NÃO FORAM PAGOS para calcular o total
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        <h2 className="text-2xl font-bold text-green-700 mb-4 text-center">Fechamento</h2>
        
        <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
          <button onClick={() => setModoDivisao(false)} className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${!modoDivisao ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}>
            Cobrar Restante
          </button>
          <button onClick={() => setModoDivisao(true)} className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${modoDivisao ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}>
            Dividir Itens
          </button>
        </div>

        <div className="overflow-y-auto flex-1 pr-2 mb-4">
          {modoDivisao && (
            <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Selecione o que será pago agora:</p>
              <div className="flex flex-col gap-2">
                {/* Mapeia TODOS os itens, mas só renderiza os que não foram pagos */}
                {comanda.produtos.map((p, index) => {
                  if (p.pago) return null; // Esconde os já pagos da tela de divisão
                  return (
                    <label key={index} className="flex items-center justify-between p-2 hover:bg-white rounded-lg cursor-pointer transition">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          checked={itensSelecionados.includes(index)}
                          onChange={() => toggleItem(index)}
                          className="w-5 h-5 accent-green-600 rounded"
                        />
                        <span className={`text-sm ${itensSelecionados.includes(index) ? 'font-bold text-green-700' : 'text-gray-600'}`}>{p.nome}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-500">R$ {p.preco.toFixed(2)}</span>
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
                className={`p-3 rounded-xl border-2 font-bold text-sm transition ${formaPagamento === forma ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-green-300'}`}
              >
                {forma}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl mb-4 border border-gray-100">
            <span className="text-sm font-bold text-gray-600">Desconto (R$):</span>
            <input type="number" placeholder="0.00" className={`w-24 text-right p-2 border rounded-lg outline-none text-sm ${descontoInvalido ? 'border-red-500 text-red-500 bg-red-50' : 'border-gray-300 focus:border-green-500'}`} value={desconto} onChange={(e) => setDesconto(e.target.value)} />
          </div>

          {formaPagamento === 'Dinheiro' && (
            <div className="mb-4 bg-green-50 p-4 rounded-xl border border-green-200 animate-in fade-in slide-in-from-top-2">
              <label className="text-sm font-bold text-green-800 mb-2 block">Recebido do Cliente (R$)</label>
              <input type="number" placeholder="Ex: 50.00" className={`w-full text-lg p-3 border-2 rounded-xl outline-none ${dinheiroInsuficiente ? 'border-red-400 text-red-600' : 'border-green-300 focus:border-green-600'}`} value={valorRecebido} onChange={(e) => setValorRecebido(e.target.value)} />
              {recebido > valorFinal && !descontoInvalido && (
                <div className="mt-3 flex justify-between items-center border-t border-green-200 pt-3">
                  <span className="text-green-800 font-bold uppercase text-xs">Troco a devolver:</span>
                  <span className="text-xl font-black text-green-700">R$ {troco.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-gray-900 p-4 rounded-xl mb-4 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-gray-400 font-medium text-xs">Total a cobrar agora:</span>
            {modoDivisao && <span className="text-gray-500 text-[10px]">{itensSelecionados.length} itens selecionados</span>}
          </div>
          <span className={`text-2xl font-black ${descontoInvalido ? 'text-red-500' : 'text-green-400'}`}>R$ {valorFinal > 0 ? valorFinal.toFixed(2) : '0.00'}</span>
        </div>

        <div className="flex gap-3">
          <button onClick={onCancelar} className="flex-1 p-3 rounded-xl border-2 border-gray-200 text-gray-500 font-bold hover:bg-gray-50 transition">Voltar</button>
          <button 
            onClick={() => onConfirmar(valorFinal, formaPagamento, itensSelecionados, modoDivisao)}
            disabled={!formaPagamento || descontoInvalido || dinheiroInsuficiente || (formaPagamento === 'Dinheiro' && recebido === 0) || nadaSelecionado}
            className="flex-1 p-3 rounded-xl bg-green-600 text-white font-bold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-700 transition"
          >
            Finalizar
          </button>
        </div>
      </div>
    </div>
  );
}