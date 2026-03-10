'use client';
import { useState, useEffect } from 'react';

export default function ModalPeso({ opcoesPeso, onAdicionar, onCancelar, temaNoturno }) {
  const [pesoGramas, setPesoGramas] = useState('');
  const [opcaoSelecionada, setOpcaoSelecionada] = useState('');

  useEffect(() => {
    if (opcoesPeso && opcoesPeso.length > 0) {
      setOpcaoSelecionada(opcoesPeso[0].id);
    }
  }, [opcoesPeso]);

  const handleAdicionar = () => {
    const peso = parseFloat(pesoGramas);
    if (!peso || peso <= 0) return alert('Digite um peso válido em gramas.');
    
    const config = opcoesPeso.find(o => o.id === opcaoSelecionada);
    if (!config) return alert('Selecione uma opção de preço.');

    const multiplicador = peso / 1000;
    const valorFinal = config.preco * multiplicador;
    const custoFinal = (config.custo || 0) * multiplicador;

    onAdicionar({
      nome: `Açaí no Peso - ${config.nome} (${peso}g)`,
      preco: valorFinal,
      custo: custoFinal
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
      <div className={`rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 border ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
        <h2 className={`text-xl font-black mb-6 flex items-center gap-2 ${temaNoturno ? 'text-purple-400' : 'text-purple-800'}`}>⚖️ Açaí no Peso</h2>
        
        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Tabela de Preço</label>
        <select 
          value={opcaoSelecionada} 
          onChange={e => setOpcaoSelecionada(e.target.value)}
          className={`w-full p-3 border rounded-xl outline-none font-bold mb-4 transition ${temaNoturno ? 'bg-gray-800 border-gray-700 text-gray-200 focus:border-purple-500' : 'bg-purple-50 border-purple-200 text-purple-900 focus:border-purple-500'}`}
        >
          {opcoesPeso && opcoesPeso.length > 0 ? (
            opcoesPeso.map(op => (
              <option key={op.id} value={op.id}>{op.nome} - R$ {op.preco.toFixed(2)}/kg</option>
            ))
          ) : (
            <option value="">Nenhuma configuração encontrada</option>
          )}
        </select>

        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Peso Lido na Balança</label>
        <div className="relative mb-8">
          <input 
            type="number" 
            autoFocus
            placeholder="Ex: 450" 
            className={`w-full p-4 border-2 rounded-xl outline-none focus:border-purple-500 text-2xl font-black text-center transition ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-purple-200 text-gray-900'}`} 
            value={pesoGramas} 
            onChange={e => setPesoGramas(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleAdicionar()}
          />
          <span className={`absolute right-4 top-1/2 -translate-y-1/2 font-bold ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>gramas</span>
        </div>

        <div className="flex gap-2">
          <button onClick={onCancelar} className={`flex-1 font-bold p-3 rounded-xl transition ${temaNoturno ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Cancelar</button>
          <button onClick={handleAdicionar} className={`flex-[2] text-white font-bold p-3 rounded-xl transition shadow-lg ${temaNoturno ? 'bg-purple-600 hover:bg-purple-500' : 'bg-purple-600 hover:bg-purple-700'}`}>Lançar Peso</button>
        </div>
      </div>
    </div>
  );
}