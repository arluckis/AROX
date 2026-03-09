'use client';
import { useState, useEffect } from 'react';

export default function ModalPeso({ opcoesPeso, onAdicionar, onCancelar }) {
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

    // A MÁGICA AQUI: Organizando o nome para "Açaí no Peso - Nome (Gramas)"
    onAdicionar({
      nome: `Açaí no Peso - ${config.nome} (${peso}g)`,
      preco: valorFinal,
      custo: custoFinal
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
        <h2 className="text-xl font-black text-purple-800 mb-6 flex items-center gap-2">⚖️ Açaí no Peso</h2>
        
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tabela de Preço</label>
        <select 
          value={opcaoSelecionada} 
          onChange={e => setOpcaoSelecionada(e.target.value)}
          className="w-full p-3 border border-purple-200 rounded-xl outline-none focus:border-purple-500 bg-purple-50 text-purple-900 font-bold mb-4"
        >
          {opcoesPeso && opcoesPeso.length > 0 ? (
            opcoesPeso.map(op => (
              <option key={op.id} value={op.id}>{op.nome} - R$ {op.preco.toFixed(2)}/kg</option>
            ))
          ) : (
            <option value="">Nenhuma configuração encontrada</option>
          )}
        </select>

        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Peso Lido na Balança</label>
        <div className="relative mb-8">
          <input 
            type="number" 
            autoFocus
            placeholder="Ex: 450" 
            className="w-full p-4 border-2 border-purple-200 rounded-xl outline-none focus:border-purple-500 text-2xl font-black text-center" 
            value={pesoGramas} 
            onChange={e => setPesoGramas(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleAdicionar()}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">gramas</span>
        </div>

        <div className="flex gap-2">
          <button onClick={onCancelar} className="flex-1 bg-gray-100 text-gray-600 font-bold p-3 rounded-xl hover:bg-gray-200 transition">Cancelar</button>
          <button onClick={handleAdicionar} className="flex-[2] bg-purple-600 text-white font-bold p-3 rounded-xl hover:bg-purple-700 transition shadow-lg">Lançar Peso</button>
        </div>
      </div>
    </div>
  );
}