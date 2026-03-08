'use client'; // Necessário para usar estados no Next.js
import { useState } from 'react';

export default function PreComanda({ onFinalizarAbertura }) {
  const [etapa, setEtapa] = useState('inicio'); // inicio, data, valor
  const [valorCaixa, setValorCaixa] = useState('');
  const dataHoje = new Date().toLocaleDateString('pt-BR', { dateStyle: 'full' });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-8 shadow-2xl rounded-3xl">
      <img src="/img/logo.jpg" alt="Logo" className="w-24 h-24 rounded-full border-4 border-white -mt-20 shadow-lg" />

      {etapa === 'inicio' && (
        <div className="text-center animate-in fade-in duration-500">
          <h1 className="text-2xl text-purple-700 font-light mb-6">Bem-vindo ao Painel Bom a Bessa.</h1>
          <button 
            onClick={() => setEtapa('data')}
            className="bg-purple-600 text-white px-8 py-3 rounded-full hover:bg-purple-700 transition"
          >
            Abrir uma Sessão
          </button>
        </div>
      )}

      {etapa === 'data' && (
        <div className="text-center animate-in slide-in-from-right duration-500">
          <p className="text-xl text-purple-700 mb-2">A data do seu sistema é:</p>
          <p className="font-bold text-purple-900 mb-6">{dataHoje}</p>
          <button 
            onClick={() => setEtapa('valor')}
            className="bg-purple-600 text-white px-8 py-3 rounded-full hover:bg-purple-700 transition"
          >
            Parece correto
          </button>
        </div>
      )}

      {etapa === 'valor' && (
        <div className="text-center animate-in slide-in-from-right duration-500">
          <p className="text-xl text-purple-700 mb-4">Com quanto você abrirá o caixa hoje?</p>
          <input 
            type="number" 
            placeholder="R$ 0.00"
            className="border-2 border-purple-300 rounded-full p-3 text-center mb-6 focus:outline-none focus:border-purple-600"
            value={valorCaixa}
            onChange={(e) => setValorCaixa(e.target.value)}
          />
          <button 
            onClick={() => onFinalizarAbertura(valorCaixa)}
            className="bg-purple-600 text-white px-8 py-3 rounded-full hover:bg-purple-700 transition block mx-auto"
          >
            Abrir com esse valor
          </button>
        </div>
      )}
    </div>
  );
}