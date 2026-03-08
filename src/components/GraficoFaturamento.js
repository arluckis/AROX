'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function GraficoFaturamento({ comandas }) {
  // Agrupa os pagamentos por data e calcula faturamento e lucro
  const dadosPorData = {};

  comandas.forEach(comanda => {
    // Calcula o custo total dos produtos PÁGOS nesta comanda
    const custoComanda = comanda.produtos
      .filter(p => p.pago)
      .reduce((acc, p) => acc + (p.custo || 0), 0);
    
    // Proporção do custo (simplificado para bater com os pagamentos)
    comanda.pagamentos.forEach(pag => {
      const data = pag.data;
      if (!dadosPorData[data]) {
        dadosPorData[data] = { data, faturamento: 0, lucro: 0, custoAcumulado: 0 };
      }
      dadosPorData[data].faturamento += pag.valor;
      // Para fins de gráfico diário simplificado, subtraímos o custo total da comanda do faturamento
      dadosPorData[data].custoAcumulado += custoComanda; 
    });
  });

  // Monta o array final e calcula o lucro real do dia
  const dadosGrafico = Object.values(dadosPorData).map(d => ({
    dia: d.data.split('-').reverse().slice(0, 2).join('/'), // Formata para DD/MM
    Faturamento: parseFloat(d.faturamento.toFixed(2)),
    Lucro: parseFloat((d.faturamento - d.custoAcumulado).toFixed(2))
  })).sort((a, b) => a.dia.localeCompare(b.dia)); // Ordena por data

  return (
    <div className="h-80 w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
      <h3 className="text-gray-400 text-sm font-bold uppercase mb-6 text-center">Faturamento vs Lucro Bruto</h3>
      {dadosGrafico.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dadosGrafico} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(val) => `R$${val}`} />
            <Tooltip cursor={{fill: '#f3e8ff'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Bar dataKey="Faturamento" fill="#a855f7" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Lucro" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-gray-300 italic">Sem vendas registradas para gerar o gráfico.</div>
      )}
    </div>
  );
}