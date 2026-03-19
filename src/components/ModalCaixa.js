'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ModalCaixa({ 
  temaNoturno, 
  caixaAtual, 
  setCaixaAtual, 
  sessao, 
  onFechar,
  comandasDoCaixa // Passaremos as comandas do caixa atual para calcular o resumo
}) {
  const [carregando, setCarregando] = useState(false);

  // Calcula resumo caso esteja fechando o caixa
  const faturamentoTotal = comandasDoCaixa?.flatMap(c => c.pagamentos).reduce((acc, p) => acc + p.valor, 0) || 0;
  
  // PREPARAÇÃO FUTURA: Cálculo do motoboy
  const entregasDelivery = comandasDoCaixa?.filter(c => c.tipo === 'Delivery') || [];
  // const valorDevidoMotoboy = entregasDelivery.reduce((acc, c) => acc + (c.taxa_entrega || 0), 0);

  const abrirCaixa = async () => {
    setCarregando(true);
    const novoCaixa = {
      empresa_id: sessao.empresa_id,
      data_abertura: new Date().toISOString(),
      status: 'aberto'
    };

    const { data, error } = await supabase.from('caixas').insert([novoCaixa]).select().single();
    if (!error && data) {
      setCaixaAtual(data);
      onFechar();
    } else {
      alert('Erro ao abrir o caixa.');
    }
    setCarregando(false);
  };

  const fecharCaixa = async () => {
    // Verifica se há comandas em aberto antes de fechar
    const comandasAbertas = comandasDoCaixa.filter(c => c.status === 'aberta');
    if (comandasAbertas.length > 0) {
      alert(`Você ainda tem ${comandasAbertas.length} comanda(s) em aberto. Feche-as antes de encerrar o caixa.`);
      return;
    }

    if (!confirm('Deseja realmente fechar o caixa? Esta ação não pode ser desfeita.')) return;

    setCarregando(true);
    const { error } = await supabase
      .from('caixas')
      .update({ 
        status: 'fechado', 
        data_fechamento: new Date().toISOString(),
        faturamento_total: faturamentoTotal
      })
      .eq('id', caixaAtual.id);

    if (!error) {
      setCaixaAtual(null); // Força a tela de abrir caixa novamente
      onFechar(); // Pode redirecionar para relatórios se desejar
    } else {
      alert('Erro ao fechar o caixa.');
    }
    setCarregando(false);
  };

  const isAberto = caixaAtual && caixaAtual.status === 'aberto';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`w-full max-w-md p-6 rounded-3xl shadow-2xl border ${temaNoturno ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
        <h2 className="text-2xl font-black mb-6 text-center">
          {isAberto ? 'Fechamento de Caixa' : 'Caixa Fechado'}
        </h2>

        {!isAberto ? (
          <div className="text-center">
            <p className={`mb-6 text-sm ${temaNoturno ? 'text-gray-400' : 'text-gray-600'}`}>
              Para começar a lançar comandas, você precisa abrir o caixa do dia/turno.
            </p>
            <button 
              onClick={abrirCaixa} 
              disabled={carregando}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl transition disabled:opacity-50"
            >
              {carregando ? 'Abrindo...' : 'Abrir Caixa Agora'}
            </button>
          </div>
        ) : (
          <div>
            <div className={`p-4 rounded-xl mb-6 ${temaNoturno ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <h3 className="text-xs font-bold uppercase mb-2 text-gray-500">Resumo do Turno</h3>
              <div className="flex justify-between items-center border-b border-gray-500/20 py-2">
                <span>Comandas Atendidas:</span>
                <span className="font-bold">{comandasDoCaixa.length}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-500/20 py-2">
                <span>Faturamento:</span>
                <span className="font-bold text-green-500">R$ {faturamentoTotal.toFixed(2)}</span>
              </div>
              
              {/* ESPAÇO PREPARADO PARA O MOTOBOY FUTURAMENTE */}
              <div className="flex justify-between items-center py-2 opacity-50">
                <span>A Pagar Motoboy (Em Breve):</span>
                <span className="font-bold text-red-400">R$ 0.00</span> 
                {/* <span className="font-bold text-red-400">R$ {valorDevidoMotoboy.toFixed(2)}</span> */}
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={onFechar} 
                className={`flex-1 py-3 rounded-xl font-bold transition ${temaNoturno ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Voltar
              </button>
              <button 
                onClick={fecharCaixa} 
                disabled={carregando}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
              >
                {carregando ? 'Fechando...' : 'Encerrar Turno'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}