'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ModalCaixa({ 
  temaNoturno, 
  caixaAtual, 
  setCaixaAtual, 
  sessao, 
  onFechar,
  comandasDoCaixa = []
}) {
  const [carregando, setCarregando] = useState(false);
  const [suprimentoInicial, setSuprimentoInicial] = useState('');
  const [dataAtual, setDataAtual] = useState('');

  // Define a data no client-side para evitar erros de hidratação (hydration mismatch)
  useEffect(() => {
    setDataAtual(new Date().toLocaleDateString('pt-BR'));
  }, []);

  // Calcula resumo caso esteja fechando o caixa
  const faturamentoTotal = comandasDoCaixa?.flatMap(c => c.pagamentos || []).reduce((acc, p) => acc + (p.valor || 0), 0) || 0;
  
  // PREPARAÇÃO FUTURA: Cálculo do motoboy (se aplicável ao negócio)
  const entregasDelivery = comandasDoCaixa?.filter(c => c.tipo === 'Delivery') || [];

  const abrirCaixa = async () => {
    setCarregando(true);
    
    // Converte o valor digitado para número, tratando vírgulas
    const valorSuprimento = parseFloat(suprimentoInicial.replace(',', '.')) || 0;

    const novoCaixa = {
      empresa_id: sessao.empresa_id,
      data_abertura: new Date().toISOString(),
      status: 'aberto',
      suprimento_inicial: valorSuprimento // Adicionamos o campo para salvar no banco
    };

    const { data, error } = await supabase.from('caixas').insert([novoCaixa]).select().single();
    if (!error && data) {
      setCaixaAtual(data);
      onFechar();
    } else {
      alert('Erro ao abrir o caixa. Verifique sua conexão.');
    }
    setCarregando(false);
  };

  const fecharCaixa = async () => {
    // Verifica se há operações em aberto antes de fechar (usando nomenclatura versátil)
    const operacoesAbertas = comandasDoCaixa.filter(c => c.status === 'aberta');
    if (operacoesAbertas.length > 0) {
      alert(`Você ainda tem ${operacoesAbertas.length} venda(s)/atendimento(s) em aberto. Finalize-os antes de encerrar o caixa.`);
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
      setCaixaAtual(null);
      onFechar();
    } else {
      alert('Erro ao fechar o caixa.');
    }
    setCarregando(false);
  };

  const isAberto = caixaAtual && caixaAtual.status === 'aberto';

  // Ícones SVG inline para manter o visual premium sem dependências extras
  const WalletIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="mb-1">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5m-4 0h4M17 12a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 transition-all duration-300">
      <div className={`w-full max-w-md p-8 rounded-[2rem] shadow-2xl border relative overflow-hidden ${temaNoturno ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100 text-gray-900'}`}>
        
        {/* Efeito de brilho de fundo (Glow) */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-2 text-center tracking-tight flex flex-col items-center gap-2">
            {!isAberto && <div className={`p-4 rounded-full ${temaNoturno ? 'bg-gradient-to-br from-amber-400/20 to-yellow-600/20 text-amber-400' : 'bg-gradient-to-br from-amber-100 to-yellow-200 text-amber-600'} shadow-inner mb-2`}><WalletIcon /></div>}
            {isAberto ? 'Fechamento de Caixa' : 'Abertura de Caixa'}
          </h2>

          {!isAberto ? (
            <div className="flex flex-col gap-6 mt-6">
              
              <div className="flex items-center justify-center gap-2 text-sm font-medium tracking-wide opacity-80 mb-2">
                <CalendarIcon />
                <span>Iniciando operações: <strong className="text-amber-500">{dataAtual}</strong></span>
              </div>

              {/* Input Premium para Suprimento Inicial */}
              <div className="flex flex-col gap-2 relative">
                <label className={`text-xs font-bold uppercase tracking-widest ml-1 ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>
                  Suprimento Inicial (Troco)
                </label>
                
                <div className={`relative flex items-center rounded-2xl overflow-hidden border-2 transition-all duration-300 focus-within:shadow-[0_0_15px_rgba(245,158,11,0.3)] ${temaNoturno ? 'bg-gray-800 border-gray-700 focus-within:border-amber-500' : 'bg-gray-50 border-gray-200 focus-within:border-amber-400'}`}>
                  <span className={`pl-5 font-black text-xl ${temaNoturno ? 'text-amber-500' : 'text-amber-600'}`}>R$</span>
                  <input 
                    type="number" 
                    placeholder="0,00"
                    value={suprimentoInicial}
                    onChange={(e) => setSuprimentoInicial(e.target.value)}
                    className={`w-full py-5 px-3 text-2xl font-black bg-transparent outline-none ${temaNoturno ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-300'}`}
                  />
                </div>
                
                <p className={`text-[11px] leading-relaxed mt-1 flex items-start gap-1.5 ${temaNoturno ? 'text-gray-500' : 'text-gray-500'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0 text-amber-500">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                  </svg>
                  Valor em espécie disponível no gaveteiro antes de iniciar as vendas do dia. Essencial para controle de troco e auditoria de caixa.
                </p>
              </div>

              <div className="flex gap-3 mt-4">
                <button 
                  onClick={onFechar} 
                  className={`px-6 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all ${temaNoturno ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900'}`}
                >
                  Cancelar
                </button>
                <button 
                  onClick={abrirCaixa} 
                  disabled={carregando}
                  className="flex-1 bg-gradient-to-r from-yellow-500 via-amber-500 to-amber-600 hover:from-yellow-400 hover:via-amber-400 hover:to-amber-500 text-white font-black py-4 rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 uppercase tracking-widest text-sm active:scale-95"
                >
                  {carregando ? 'Iniciando...' : 'Abrir Operação'}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <div className={`p-5 rounded-2xl mb-6 shadow-inner ${temaNoturno ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-100'}`}>
                <h3 className="text-xs font-black uppercase tracking-widest mb-4 text-center opacity-50">Resumo da Operação</h3>
                
                {/* Alterado "Comandas" para "Atendimentos / Vendas" para maior versatilidade */}
                <div className="flex justify-between items-center border-b border-gray-500/20 py-3">
                  <span className="text-sm">Atendimentos / Vendas:</span>
                  <span className="font-black text-lg">{comandasDoCaixa.length}</span>
                </div>
                
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm">Faturamento Total:</span>
                  <span className="font-black text-xl text-green-500">R$ {faturamentoTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={onFechar} 
                  className={`flex-1 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all ${temaNoturno ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                >
                  Voltar ao Painel
                </button>
                <button 
                  onClick={fecharCaixa} 
                  disabled={carregando}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 uppercase tracking-widest text-sm active:scale-95"
                >
                  {carregando ? 'Fechando...' : 'Encerrar Caixa'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}