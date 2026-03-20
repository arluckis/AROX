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

  // Cálculos em tempo real para o display
  const configAtual = opcoesPeso?.find(o => o.id === opcaoSelecionada);
  const peso = parseFloat(pesoGramas) || 0;
  const multiplicador = peso / 1000;
  const valorCalculado = configAtual ? (configAtual.preco * multiplicador) : 0;
  const isValido = peso > 0 && configAtual;

  const handleAdicionar = () => {
    if (!isValido) return;
    
    const custoFinal = (configAtual.custo || 0) * multiplicador;

    onAdicionar({
      nome: `Açaí no Peso - ${configAtual.nome} (${peso}g)`,
      preco: valorCalculado,
      custo: custoFinal
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] transition-opacity">
      <div className={`rounded-2xl p-0 w-full max-w-md shadow-2xl animate-in zoom-in-95 border overflow-hidden flex flex-col ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
        
        {/* Cabeçalho Profissional */}
        <div className={`px-6 py-4 border-b flex justify-between items-center ${temaNoturno ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${temaNoturno ? 'bg-gray-800 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14"/><path d="M5 19h14"/><path d="M5 5h14v4H5z"/>
              </svg>
            </div>
            <h2 className={`text-lg font-bold ${temaNoturno ? 'text-gray-100' : 'text-gray-800'}`}>
              Lançamento por Peso
            </h2>
          </div>
          <button onClick={onCancelar} className={`p-2 rounded-full transition-colors ${temaNoturno ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Seleção do Produto */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${temaNoturno ? 'text-gray-300' : 'text-gray-700'}`}>
              Tabela de Preço
            </label>
            <div className="relative">
              <select 
                value={opcaoSelecionada} 
                onChange={e => setOpcaoSelecionada(e.target.value)}
                className={`w-full p-3.5 appearance-none border rounded-xl outline-none font-medium transition-all focus:ring-2 focus:ring-purple-500 ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900 focus:bg-white'}`}
              >
                {opcoesPeso && opcoesPeso.length > 0 ? (
                  opcoesPeso.map(op => (
                    <option key={op.id} value={op.id}>{op.nome} — R$ {op.preco.toFixed(2)} /kg</option>
                  ))
                ) : (
                  <option value="">Nenhuma configuração encontrada</option>
                )}
              </select>
              {/* Ícone de seta customizado para o select */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>

          {/* Visor de Peso (Estilo Balança Digital) */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${temaNoturno ? 'text-gray-300' : 'text-gray-700'}`}>
              Peso Lido (Gramas)
            </label>
            <div className={`relative flex items-center border-2 rounded-xl transition-all focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 overflow-hidden ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <input 
                type="number" 
                autoFocus
                placeholder="0" 
                className={`w-full p-4 pl-6 outline-none text-4xl font-black tabular-nums bg-transparent ${temaNoturno ? 'text-white' : 'text-gray-900'}`} 
                value={pesoGramas} 
                onChange={e => setPesoGramas(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && isValido && handleAdicionar()}
              />
              <div className={`px-6 py-4 flex flex-col justify-center items-end border-l ${temaNoturno ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50'}`}>
                <span className={`text-sm font-bold uppercase tracking-wider ${temaNoturno ? 'text-purple-400' : 'text-purple-600'}`}>g</span>
                <span className={`text-[10px] whitespace-nowrap ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>gramas</span>
              </div>
            </div>
          </div>

          {/* Resumo de Cálculo em Tempo Real */}
          <div className={`rounded-xl p-4 flex justify-between items-center border ${temaNoturno ? 'bg-gray-800/80 border-gray-700/50' : 'bg-green-50/50 border-green-100'}`}>
            <div className="flex flex-col">
              <span className={`text-xs font-semibold uppercase tracking-wider mb-1 ${temaNoturno ? 'text-gray-500' : 'text-gray-500'}`}>Valor a Cobrar</span>
              {isValido ? (
                <span className={`text-sm font-medium ${temaNoturno ? 'text-gray-400' : 'text-gray-600'}`}>
                  {multiplicador.toFixed(3).replace('.', ',')} kg × R$ {configAtual?.preco.toFixed(2).replace('.', ',')}
                </span>
              ) : (
                <span className={`text-sm font-medium ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>
                  Aguardando peso...
                </span>
              )}
            </div>
            <div className={`text-2xl font-black ${temaNoturno ? 'text-green-400' : 'text-green-600'}`}>
              R$ {valorCalculado.toFixed(2).replace('.', ',')}
            </div>
          </div>
        </div>

        {/* Rodapé com Botões */}
        <div className={`px-6 py-4 border-t flex gap-3 ${temaNoturno ? 'border-gray-800 bg-gray-900/50' : 'border-gray-50 bg-gray-50/50'}`}>
          <button 
            onClick={onCancelar} 
            className={`px-5 py-3 rounded-xl font-semibold transition-colors flex-shrink-0 ${temaNoturno ? 'text-gray-300 hover:bg-gray-800 border border-gray-700' : 'text-gray-600 hover:bg-gray-200 border border-gray-300'}`}
          >
            Cancelar
          </button>
          
          <button 
            onClick={handleAdicionar} 
            disabled={!isValido}
            className={`flex-1 flex items-center justify-center gap-2 font-bold p-3 rounded-xl transition-all shadow-md
              ${isValido 
                ? (temaNoturno ? 'bg-purple-600 text-white hover:bg-purple-500 cursor-pointer' : 'bg-purple-600 text-white hover:bg-purple-700 cursor-pointer') 
                : (temaNoturno ? 'bg-gray-800 text-gray-500 cursor-not-allowed shadow-none' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none')
              }
            `}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Adicionar à Comanda
          </button>
        </div>

      </div>
    </div>
  );
}