'use client';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';

export default function TabAnalises({
  temaNoturno,
  filtroTempo,
  setFiltroTempo,
  getHoje,
  getMesAtual,
  getAnoAtual,
  dadosTipos,
  dadosTags
}) {
  return (
    <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
       <div className={`p-5 lg:p-6 pt-4 lg:pt-5 rounded-b-3xl shadow-sm border-x border-b border-t-0 flex flex-col md:flex-row justify-between items-center gap-4 relative transition-colors duration-500 mb-6 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className={`absolute top-0 left-6 right-6 border-t border-dashed ${temaNoturno ? 'border-gray-700' : 'border-gray-200'}`}></div>
        <div className={`flex p-1 rounded-xl w-full md:w-auto border z-10 ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
  {['dia', '7 dias', 'mes', 'ano'].map(t => <button key={t} onClick={() => setFiltroTempo({...filtroTempo, tipo: t, valor: t==='dia'||t==='7 dias'?getHoje():t==='mes'?getMesAtual():getAnoAtual()})} className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold uppercase transition ${filtroTempo.tipo === t ? (temaNoturno ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-900 text-white shadow-sm') : (temaNoturno ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-purple-700')}`}>{t}</button>)}
</div>
        <div className="flex gap-2 w-full md:w-auto z-10">
          {filtroTempo.tipo === 'dia' && <input type="date" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className={`p-2 border rounded-xl outline-none text-sm font-bold w-full focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white color-scheme-dark' : 'bg-gray-50 border-gray-200'}`} />}
          {filtroTempo.tipo === 'mes' && <input type="month" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className={`p-2 border rounded-xl outline-none text-sm font-bold w-full focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white color-scheme-dark' : 'bg-gray-50 border-gray-200'}`} />}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-6 rounded-3xl shadow-sm border h-80 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <h3 className={`text-sm font-bold uppercase mb-4 text-center ${temaNoturno ? 'text-white' : 'text-purple-900'}`}>Origem Real do Pedido</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosTipos} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={temaNoturno ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="nome" tickLine={false} axisLine={false} tick={{fill: temaNoturno ? '#9ca3af' : '#6b7280', fontSize: 12, fontWeight: 'bold'}} />
              <YAxis hide />
              <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: temaNoturno ? '#1f2937' : '#ffffff', color: temaNoturno ? '#ffffff' : '#000000', borderRadius: '12px', border: 'none' }} />
              <Bar dataKey="qtd" fill="#fcd34d" radius={[8, 8, 0, 0]} barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className={`p-6 rounded-3xl shadow-sm border h-80 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <h3 className={`text-sm font-bold uppercase mb-4 text-center ${temaNoturno ? 'text-white' : 'text-purple-900'}`}>Comportamento (Tags)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosTags} layout="vertical" margin={{ top: 0, right: 10, left: 30, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="nome" type="category" axisLine={false} tickLine={false} tick={{fill: temaNoturno ? '#9ca3af' : '#6b7280', fontSize: 11, fontWeight: 'bold'}} />
              <RechartsTooltip cursor={{fill: temaNoturno ? '#374151' : '#f3f4f6'}} contentStyle={{ backgroundColor: temaNoturno ? '#1f2937' : '#ffffff', color: temaNoturno ? '#ffffff' : '#000000', borderRadius: '12px', border: 'none' }} />
              <Bar dataKey="qtd" fill={temaNoturno ? '#a855f7' : '#9333ea'} radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}