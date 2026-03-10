'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDelivery({ empresaId, temaNoturno, onFechar }) {
  const [bairros, setBairros] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para o formulário individual
  const [nome, setNome] = useState('');
  const [taxa, setTaxa] = useState('');
  const [editandoId, setEditandoId] = useState(null);

  // Estados para a adição em massa
  const [modoMassa, setModoMassa] = useState(false);
  const [textoMassa, setTextoMassa] = useState('');

  useEffect(() => {
    carregarBairros();
  }, []);

  const carregarBairros = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('bairros_entrega')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('nome');
    if (!error && data) setBairros(data);
    setIsLoading(false);
  };

  const salvarBairro = async (e) => {
    if (e) e.preventDefault();
    if (!nome.trim() || taxa === '') return alert("Preencha o nome e a taxa do bairro.");

    const valorTaxa = parseFloat(taxa.toString().replace(',', '.'));

    if (editandoId) {
      await supabase.from('bairros_entrega').update({ nome, taxa: valorTaxa }).eq('id', editandoId);
      setEditandoId(null);
    } else {
      await supabase.from('bairros_entrega').insert([{ empresa_id: empresaId, nome, taxa: valorTaxa }]);
    }
    
    setNome('');
    setTaxa('');
    document.getElementById('input-nome-bairro')?.focus();
    carregarBairros();
  };

  const editarBairro = (bairro) => {
    setModoMassa(false);
    setEditandoId(bairro.id);
    setNome(bairro.nome);
    setTaxa(bairro.taxa.toString());
    document.getElementById('input-nome-bairro')?.focus();
  };

  const excluirBairro = async (id, nomeBairro) => {
    if (confirm(`Tem certeza que deseja excluir o bairro "${nomeBairro}"?`)) {
      await supabase.from('bairros_entrega').delete().eq('id', id);
      carregarBairros();
    }
  };

  const processarEmMassa = async () => {
    if (!textoMassa.trim()) return alert("Cole a lista de bairros primeiro.");
    
    const linhas = textoMassa.split('\n');
    const novosBairros = [];

    linhas.forEach(linha => {
      const partes = linha.split(/[-;,]/);
      if (partes.length >= 2) {
        const nomeParte = partes[0].trim();
        const taxaParte = parseFloat(partes[1].replace(/[^\d.,]/g, '').replace(',', '.'));
        
        if (nomeParte && !isNaN(taxaParte)) {
          novosBairros.push({ empresa_id: empresaId, nome: nomeParte, taxa: taxaParte });
        }
      }
    });

    if (novosBairros.length === 0) {
      return alert("Nenhum bairro válido encontrado. Siga o formato: Nome do Bairro - 5,00");
    }

    if (confirm(`Encontrados ${novosBairros.length} bairros. Deseja importá-los?`)) {
      setIsLoading(true);
      await supabase.from('bairros_entrega').insert(novosBairros);
      setTextoMassa('');
      setModoMassa(false);
      carregarBairros();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className={`w-full max-w-3xl flex flex-col max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden border ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
        
        {/* Cabeçalho */}
        <div className={`p-6 border-b flex justify-between items-center ${temaNoturno ? 'border-gray-800' : 'border-gray-100'}`}>
          <div>
            <h2 className={`text-2xl font-black tracking-tight flex items-center gap-2 ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path></svg>
              Taxas de Entrega
            </h2>
            <p className={`text-sm font-medium mt-1 ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Gerencie os bairros e valores para Delivery</p>
          </div>
          <button onClick={onFechar} className={`p-2 rounded-full transition ${temaNoturno ? 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          
          {/* Abas de Adição */}
          <div className="flex gap-2 mb-6">
            <button onClick={() => { setModoMassa(false); setEditandoId(null); setNome(''); setTaxa(''); }} className={`px-4 py-2 text-sm font-bold flex items-center gap-2 rounded-xl transition ${!modoMassa ? (temaNoturno ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700') : (temaNoturno ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-700')}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Adição Individual
            </button>
            <button onClick={() => { setModoMassa(true); setEditandoId(null); }} className={`px-4 py-2 text-sm font-bold flex items-center gap-2 rounded-xl transition ${modoMassa ? (temaNoturno ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700') : (temaNoturno ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-700')}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
              Adição em Massa (Rápida)
            </button>
          </div>

          {/* Área de Formulário */}
          <div className={`p-5 rounded-2xl mb-8 border ${temaNoturno ? 'bg-gray-800/50 border-gray-700' : 'bg-blue-50/50 border-blue-100'}`}>
            {!modoMassa ? (
              <form onSubmit={salvarBairro} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className={`text-xs font-bold uppercase tracking-widest mb-2 block ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Nome do Bairro</label>
                  <input id="input-nome-bairro" type="text" placeholder="Ex: Centro" value={nome} onChange={(e) => setNome(e.target.value)} className={`w-full p-3 rounded-xl border outline-none font-bold transition ${temaNoturno ? 'bg-gray-900 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 focus:border-blue-500'}`} />
                </div>
                <div className="w-full md:w-32">
                  <label className={`text-xs font-bold uppercase tracking-widest mb-2 block ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Taxa (R$)</label>
                  <input type="number" step="0.01" placeholder="5.00" value={taxa} onChange={(e) => setTaxa(e.target.value)} className={`w-full p-3 rounded-xl border outline-none font-bold transition ${temaNoturno ? 'bg-gray-900 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 focus:border-blue-500'}`} />
                </div>
                <button type="submit" className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-sm">
                  {editandoId ? 'Atualizar' : 'Salvar'}
                </button>
                {editandoId && (
                  <button type="button" onClick={() => { setEditandoId(null); setNome(''); setTaxa(''); }} className={`px-4 py-3 font-bold rounded-xl transition ${temaNoturno ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                    Cancelar
                  </button>
                )}
              </form>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <label className={`text-xs font-bold uppercase tracking-widest mb-2 block ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Cole sua lista abaixo (Bairro - Valor)</label>
                  <p className={`text-xs mb-2 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Exemplo:<br/>Centro - 5,00<br/>Zona Norte - 10,00</p>
                  <textarea rows="5" placeholder="Cole aqui..." value={textoMassa} onChange={(e) => setTextoMassa(e.target.value)} className={`w-full p-3 rounded-xl border outline-none text-sm transition ${temaNoturno ? 'bg-gray-900 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 focus:border-blue-500'}`}></textarea>
                </div>
                <button onClick={processarEmMassa} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-sm">
                  Importar Bairros
                </button>
              </div>
            )}
          </div>

          {/* Lista de Bairros */}
          <div>
            <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Bairros Cadastrados ({bairros.length})</h3>
            
            {isLoading ? (
              <div className="text-center py-8 font-bold text-gray-400 animate-pulse">Carregando bairros...</div>
            ) : bairros.length === 0 ? (
              <div className={`text-center py-12 rounded-2xl border border-dashed ${temaNoturno ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-400'}`}>
                Nenhum bairro cadastrado.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {bairros.map(b => (
                  <div key={b.id} className={`flex items-center justify-between p-4 rounded-xl border transition hover:shadow-sm ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div>
                      <p className={`font-bold ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>{b.nome}</p>
                      <p className={`text-sm font-bold ${temaNoturno ? 'text-blue-400' : 'text-blue-600'}`}>R$ {parseFloat(b.taxa).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => editarBairro(b)} className={`p-2 rounded-lg transition ${temaNoturno ? 'bg-gray-700 text-gray-300 hover:text-white' : 'bg-gray-100 text-gray-600 hover:text-gray-900'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                      </button>
                      <button onClick={() => excluirBairro(b.id, b.nome)} className={`p-2 rounded-lg transition ${temaNoturno ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}