'use client';

export default function ModalConfigEmpresa({
  temaNoturno,
  nomeEmpresaEdicao,
  setNomeEmpresaEdicao,
  logoEmpresaEdicao,
  setLogoEmpresaEdicao,
  salvarConfigEmpresa,
  setMostrarConfigEmpresa
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[70] backdrop-blur-sm">
      <div className={`rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className={`flex justify-between items-center mb-6 border-b pb-4 ${temaNoturno ? 'border-gray-700' : 'border-gray-100'}`}>
          <h2 className={`text-xl font-black flex items-center gap-2 ${temaNoturno ? 'text-white' : 'text-purple-900'}`}>Configurar Loja</h2>
          <button onClick={() => setMostrarConfigEmpresa(false)} className={`p-2 rounded-full font-bold transition ${temaNoturno ? 'bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200'}`}>✕</button>
        </div>
        <div className="flex flex-col gap-4 mb-6">
          <div>
            <label className={`text-xs font-bold uppercase tracking-widest mb-1 block ${temaNoturno ? 'text-gray-400' : 'text-gray-400'}`}>Nome do Estabelecimento</label>
            <input type="text" value={nomeEmpresaEdicao} onChange={e => setNomeEmpresaEdicao(e.target.value)} className={`w-full p-3 rounded-xl border outline-none text-sm font-medium focus:border-purple-500 transition ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
          </div>
          <div>
            <label className={`text-xs font-bold uppercase tracking-widest mb-1 block ${temaNoturno ? 'text-gray-400' : 'text-gray-400'}`}>Link da Logo (URL)</label>
            <input type="text" placeholder="Ex: https://i.imgur.com/sua-logo.png" value={logoEmpresaEdicao} onChange={e => setLogoEmpresaEdicao(e.target.value)} className={`w-full p-3 rounded-xl border outline-none text-sm font-medium focus:border-purple-500 transition ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
          </div>
          <div className="flex items-center justify-center mt-2">
            <img src={logoEmpresaEdicao || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} alt="Preview" className={`w-20 h-20 rounded-full border-4 object-cover shadow-sm ${temaNoturno ? 'border-gray-600 bg-gray-700' : 'border-purple-100 bg-purple-50'}`} onError={(e) => e.target.src='https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} />
          </div>
        </div>
        <button onClick={salvarConfigEmpresa} className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 transition shadow-sm">Salvar Alterações</button>
      </div>
    </div>
  );
}