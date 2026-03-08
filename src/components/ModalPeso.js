'use client';
import { useState } from 'react';

export default function ModalPeso({ opcoesPeso, onAdicionar, onCancelar }) {
  const [peso, setPeso] = useState('');
  const [precoKg, setPrecoKg] = useState(opcoesPeso.length > 0 ? opcoesPeso[0].preco : 0);

  const total = peso ? (parseFloat(peso) / 1000 * precoKg).toFixed(2) : "0.00";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
        <h2 className="text-2xl font-bold text-purple-700 mb-6">Peso do Açaí</h2>
        
        <select 
          className="w-full p-3 rounded-xl border border-purple-200 mb-4 outline-none font-bold text-purple-800"
          onChange={(e) => setPrecoKg(parseFloat(e.target.value))}
        >
          {opcoesPeso.map(op => (
            <option key={op.id} value={op.preco}>{op.nome} - R$ {op.preco.toFixed(2)}/kg</option>
          ))}
        </select>

        <input 
          type="number"
          placeholder="Ex: 500 (gramas)"
          className="w-full text-3xl p-4 border-2 border-purple-500 rounded-2xl text-center mb-4 outline-none focus:bg-purple-50"
          value={peso}
          onChange={(e) => setPeso(e.target.value)}
          autoFocus
        />

        <p className="text-xl font-bold text-green-600 mb-6">Total: R$ {total}</p>

        <div className="flex gap-4">
          <button onClick={onCancelar} className="flex-1 p-4 rounded-2xl border border-purple-200 text-purple-700 font-bold hover:bg-purple-50 transition">Cancelar</button>
          <button 
            onClick={() => onAdicionar({ nome: `Açaí Peso (${peso}g)`, preco: parseFloat(total), custo: 0 })} // Custo do peso pode ser adicionado depois se quiser
            disabled={!peso || peso <= 0}
            className="flex-1 p-4 rounded-2xl bg-purple-600 text-white font-bold disabled:opacity-50 hover:bg-purple-700 transition"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}