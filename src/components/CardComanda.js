'use client';

export default function CardComanda({ comanda, onClick }) {
  // Definimos cores baseadas no tipo da comanda (igual você fazia no CSS)
  const styles = {
    'Balcão': 'border-purple-500 text-purple-600',
    'Delivery': 'border-orange-500 text-orange-600',
    'Retirada': 'border-blue-500 text-blue-600'
  };

  return (
    <div 
      onClick={onClick}
      className={`w-32 h-44 bg-white shadow-md rounded-2xl flex flex-col justify-between p-4 cursor-pointer hover:scale-105 transition-transform border-t-4 ${styles[comanda.tipo] || 'border-gray-300'}`}
    >
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{comanda.tipo}</p>
      <h3 className="text-lg font-bold leading-tight">{comanda.nome}</h3>
    </div>
  );
}