'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function GraficoFaturamento({ comandas, temaNoturno }) {
  const dadosPorData = {};

  comandas.forEach(comanda => {
    const custoComanda = comanda.produtos
      .filter(p => p.pago)
      .reduce((acc, p) => acc + (p.custo || 0), 0);
    
    comanda.pagamentos.forEach(pag => {
      const data = pag.data;
      if (!dadosPorData[data]) {
        dadosPorData[data] = { data, faturamento: 0, lucro: 0, custoAcumulado: 0 };
      }
      dadosPorData[data].faturamento += pag.valor;
      dadosPorData[data].custoAcumulado += custoComanda; 
    });
  });

  const dadosGrafico = Object.values(dadosPorData).map(d => ({
    dia: d.data.split('-').reverse().slice(0, 2).join('/'), 
    Faturamento: parseFloat(d.faturamento.toFixed(2)),
    Lucro: parseFloat((d.faturamento - d.custoAcumulado).toFixed(2))
  })).sort((a, b) => a.dia.localeCompare(b.dia));

  return (
    <div className={`h-80 w-full p-6 rounded-3xl shadow-sm border transition-colors duration-500 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
      <h3 className={`text-sm font-bold uppercase mb-6 text-center ${temaNoturno ? 'text-gray-200' : 'text-gray-800'}`}>Faturamento vs Lucro Bruto</h3>
      {dadosGrafico.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dadosGrafico} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={temaNoturno ? '#374151' : '#f3f4f6'} />
            <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{fill: temaNoturno ? '#9ca3af' : '#9ca3af', fontSize: 12, fontWeight: 'bold'}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: temaNoturno ? '#9ca3af' : '#9ca3af', fontSize: 12, fontWeight: 'bold'}} tickFormatter={(val) => `R$${val}`} />
            <Tooltip 
              cursor={{fill: temaNoturno ? '#374151' : '#f3e8ff'}} 
              contentStyle={{
                backgroundColor: temaNoturno ? '#1f2937' : '#fff', 
                color: temaNoturno ? '#f3f4f6' : '#111827', 
                borderRadius: '16px', 
                border: temaNoturno ? '1px solid #4b5563' : 'none', 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }} 
            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: temaNoturno ? '#9ca3af' : '#4b5563' }} />
            <Bar dataKey="Faturamento" fill={temaNoturno ? '#8b5cf6' : '#a855f7'} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Lucro" fill={temaNoturno ? '#34d399' : '#10b981'} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className={`h-full flex items-center justify-center italic text-sm font-bold ${temaNoturno ? 'text-gray-600' : 'text-gray-300'}`}>Sem vendas registradas para gerar o gráfico.</div>
      )}
    </div>
  );
}