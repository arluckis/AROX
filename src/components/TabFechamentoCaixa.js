'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TabFechamentoCaixa({ temaNoturno, sessao, caixaAtual, comandas, fetchData }) {
  const [abaInterna, setAbaInterna] = useState('atual'); // 'atual' ou 'historico'
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [bairros, setBairros] = useState([]);
  const [motoboyAtivo, setMotoboyAtivo] = useState(false);
  const [historicoCaixas, setHistoricoCaixas] = useState([]);
  
  const [valorInformadoDinheiro, setValorInformadoDinheiro] = useState('');
  const [valorInformadoCartao, setValorInformadoCartao] = useState('');
  const [valorInformadoPix, setValorInformadoPix] = useState('');

  useEffect(() => {
    if (sessao?.empresa_id && caixaAtual?.id) {
      carregarDadosCaixa();
    }
  }, [sessao, caixaAtual, abaInterna]);

  const carregarDadosCaixa = async () => {
    const { data: movData } = await supabase.from('caixa_movimentacoes').select('*').eq('caixa_id', caixaAtual.id);
    if (movData) setMovimentacoes(movData);

    const { data: empData } = await supabase.from('empresas').select('motoboy_ativo').eq('id', sessao.empresa_id).single();
    if (empData) setMotoboyAtivo(empData.motoboy_ativo);

    const { data: bairrosData } = await supabase.from('bairros_entrega').select('*').eq('empresa_id', sessao.empresa_id);
    if (bairrosData) setBairros(bairrosData);

    if (abaInterna === 'historico') {
      const { data: histData } = await supabase.from('caixas')
        .select('*')
        .eq('empresa_id', sessao.empresa_id)
        .eq('status', 'fechado')
        .order('id', { ascending: false })
        .limit(10);
      if (histData) setHistoricoCaixas(histData);
    }
  };

  const toggleMotoboy = async () => {
    const novoStatus = !motoboyAtivo;
    await supabase.from('empresas').update({ motoboy_ativo: novoStatus }).eq('id', sessao.empresa_id);
    setMotoboyAtivo(novoStatus);
  };

  const registrarMovimentacao = async (tipo, valorAutomatico = null, descricaoAutomatica = null) => {
    let valorFinal = valorAutomatico;
    let descFinal = descricaoAutomatica;

    if (!valorAutomatico) {
      const valor = prompt(`Digite o valor para ${tipo === 'sangria' ? 'Retirar (Sangria)' : 'Adicionar (Suprimento)'}:`);
      if (!valor || isNaN(valor.replace(',', '.'))) return;
      valorFinal = parseFloat(valor.replace(',', '.'));
      descFinal = prompt(`Motivo da ${tipo}:`, tipo === 'sangria' ? 'Pagamento Fornecedor' : 'Troco') || '';
    }
    
    const payload = {
      caixa_id: caixaAtual.id,
      empresa_id: sessao.empresa_id,
      tipo: tipo,
      valor: valorFinal,
      descricao: descFinal
    };

    const { data, error } = await supabase.from('caixa_movimentacoes').insert([payload]).select();
    if (data && data.length > 0 && !error) {
      setMovimentacoes(prev => [...prev, ...data]);
    } else {
      carregarDadosCaixa();
    }
  };

  // --- Lógica Automática do Motoboy ---
  const calcularPendenteMotoboy = () => {
    if (!comandas || comandas.length === 0) return 0;
    
    const dataCaixa = caixaAtual?.data_abertura?.substring(0, 10);

    const totalTaxas = comandas
      .filter(c => {
         const isMesmoDia = c.data && caixaAtual?.data_abertura && c.data.substring(0,10) === dataCaixa;
         return isMesmoDia && c.status === 'fechada';
      })
      .reduce((acc, c) => {
        let taxa = parseFloat(c.taxa_entrega || 0);
        if (taxa === 0 && c.bairro_id && bairros.length > 0) {
          const b = bairros.find(b => b.id === c.bairro_id);
          if (b) taxa = parseFloat(b.taxa || 0);
        }
        return acc + taxa;
      }, 0);
      
    const totalJaPago = movimentacoes
      .filter(m => m.tipo === 'sangria' && m.descricao && m.descricao.includes('Motoboy'))
      .reduce((acc, m) => acc + parseFloat(m.valor), 0);
      
    return Math.max(0, totalTaxas - totalJaPago);
  };
  
  const pendenteMotoboy = calcularPendenteMotoboy();

  const pagarMotoboys = async () => {
    if (confirm(`Registrar pagamento de R$ ${pendenteMotoboy.toFixed(2)} para os motoboys? (Isto fará uma retirada automática no fluxo de caixa).`)) {
      await registrarMovimentacao('sangria', pendenteMotoboy, 'Pagamento Motoboys (Entregas)');
      alert('Pagamento registrado com sucesso!');
    }
  };

  const entradasVendasDinheiro = comandas
    .filter(c => c.data?.substring(0, 10) === caixaAtual?.data_abertura?.substring(0, 10) && c.status === 'fechada')
    .flatMap(c => c.pagamentos)
    .filter(p => p.forma === 'Dinheiro')
    .reduce((acc, p) => acc + parseFloat(p.valor), 0);

  const totalSuprimentos = movimentacoes.filter(m => m.tipo === 'suprimento').reduce((acc, m) => acc + parseFloat(m.valor), 0);
  const totalSangrias = movimentacoes.filter(m => m.tipo === 'sangria').reduce((acc, m) => acc + parseFloat(m.valor), 0);
  
  const saldoInicial = parseFloat(caixaAtual?.saldo_inicial || 0);
  const saldoGavetaEsperado = saldoInicial + entradasVendasDinheiro + totalSuprimentos - totalSangrias;

  const encerrarCaixa = async () => {
    if (confirm("Atenção: Tem certeza que deseja encerrar o turno de caixa atual?")) {
      const diferencaDinheiro = parseFloat(valorInformadoDinheiro || 0) - saldoGavetaEsperado;
      
      const relatorioFinal = {
        informadoDinheiro: parseFloat(valorInformadoDinheiro || 0),
        informadoCartao: parseFloat(valorInformadoCartao || 0),
        informadoPix: parseFloat(valorInformadoPix || 0),
        esperadoDinheiro: saldoGavetaEsperado,
        diferencaDinheiro: diferencaDinheiro,
        suprimentos: totalSuprimentos,
        sangrias: totalSangrias
      };

      // Adicionamos a captura de ERRO aqui
      const { error } = await supabase.from('caixas').update({ 
        status: 'fechado', 
        data_fechamento: new Date().toISOString(),
        relatorio_fechamento: relatorioFinal
      }).eq('id', caixaAtual.id);
      
      if (error) {
        alert("ERRO AO FECHAR NO BANCO DE DADOS:\n\n" + error.message + "\n\nVocê esqueceu de criar a coluna 'relatorio_fechamento' (tipo JSONB) na tabela 'caixas'?");
        return; // Pára a execução aqui para não fingir sucesso
      }
      
      alert("Caixa encerrado com sucesso! Um novo caixa será aberto.");
      setValorInformadoDinheiro('');
      setValorInformadoCartao('');
      setValorInformadoPix('');
      fetchData(); 
    }
  };

  return (
    <div className={`max-w-4xl mx-auto w-full animate-in slide-in-from-bottom-4 duration-500 p-4 rounded-3xl shadow-sm border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
      
      <div className="flex gap-4 mb-6 border-b border-gray-200/20 pb-2">
        <button 
          onClick={() => setAbaInterna('atual')} 
          className={`font-bold px-4 py-2 transition ${abaInterna === 'atual' ? (temaNoturno ? 'text-purple-400 border-b-2 border-purple-400' : 'text-purple-600 border-b-2 border-purple-600') : 'text-gray-500 hover:text-gray-400'}`}>
          Fechamento de Caixa
        </button>
        <button 
          onClick={() => setAbaInterna('historico')} 
          className={`font-bold px-4 py-2 transition ${abaInterna === 'historico' ? (temaNoturno ? 'text-purple-400 border-b-2 border-purple-400' : 'text-purple-600 border-b-2 border-purple-600') : 'text-gray-500 hover:text-gray-400'}`}>
          Histórico de Fechamentos
        </button>
      </div>

      {abaInterna === 'atual' ? (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h2 className={`text-xl font-black ${temaNoturno ? 'text-white' : 'text-purple-900'}`}>Fechamento de Caixa</h2>
              <p className={`text-sm font-medium ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Aberto em: {caixaAtual?.data_abertura?.split('-').reverse().join('/')}</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button onClick={() => registrarMovimentacao('suprimento')} className="flex-1 md:flex-none px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-sm transition shadow-sm">+ Suprimento</button>
              <button onClick={() => registrarMovimentacao('sangria')} className="flex-1 md:flex-none px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition shadow-sm">- Sangria</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className={`p-4 rounded-2xl border ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <p className="text-xs uppercase font-bold text-gray-500">Saldo Inicial</p>
              <p className="text-xl font-black text-gray-400">R$ {saldoInicial.toFixed(2)}</p>
            </div>
            <div className={`p-4 rounded-2xl border ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <p className="text-xs uppercase font-bold text-gray-500">Vendas (Dinheiro)</p>
              <p className="text-xl font-black text-green-500">+ R$ {entradasVendasDinheiro.toFixed(2)}</p>
            </div>
            <div className={`p-4 rounded-2xl border ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <p className="text-xs uppercase font-bold text-gray-500">Movimentações Extras</p>
              <p className="text-sm font-bold text-green-500">Suprimentos: + R$ {totalSuprimentos.toFixed(2)}</p>
              <p className="text-sm font-bold text-red-500">Sangrias: - R$ {totalSangrias.toFixed(2)}</p>
            </div>
          </div>

          <div className={`mb-8 p-5 rounded-2xl border ${temaNoturno ? 'bg-gray-900/50 border-gray-700' : 'bg-blue-50/50 border-blue-100'}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className={`font-black flex items-center gap-2 ${temaNoturno ? 'text-blue-400' : 'text-blue-700'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path></svg>
                  Gestão de Motoboys
                </h3>
                <p className={`text-sm mt-1 ${temaNoturno ? 'text-gray-400' : 'text-gray-600'}`}>Controle do repasse de taxas de entrega.</p>
              </div>
              <button onClick={toggleMotoboy} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${motoboyAtivo ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-300 text-gray-600'}`}>
                {motoboyAtivo ? 'ATIVADO' : 'DESATIVADO'}
              </button>
            </div>

            {motoboyAtivo && (
              <div className={`mt-5 p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-center gap-4 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-blue-200'}`}>
                <div className="text-center sm:text-left">
                  <p className={`text-xs font-bold uppercase tracking-widest ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Pendente de Pagamento</p>
                  <p className={`text-3xl font-black ${pendenteMotoboy > 0 ? (temaNoturno ? 'text-blue-400' : 'text-blue-600') : (temaNoturno ? 'text-gray-500' : 'text-gray-400')}`}>
                    R$ {pendenteMotoboy.toFixed(2)}
                  </p>
                </div>
                <button 
                  onClick={pagarMotoboys} 
                  disabled={pendenteMotoboy <= 0}
                  className={`px-5 py-3 font-bold rounded-xl transition w-full sm:w-auto ${pendenteMotoboy > 0 ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' : (temaNoturno ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400')}`}
                >
                  Confirmar Pagamento
                </button>
              </div>
            )}
          </div>

          <div className={`p-6 rounded-2xl border ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <h3 className={`text-lg font-black mb-4 ${temaNoturno ? 'text-white' : 'text-gray-800'}`}>Conferência Cega</h3>
            <p className={`text-sm mb-4 ${temaNoturno ? 'text-gray-400' : 'text-gray-600'}`}>Conte o dinheiro da gaveta e digite abaixo.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="text-xs font-bold uppercase text-gray-500">Dinheiro na Gaveta *</label>
                <input type="number" placeholder="R$ 0,00" value={valorInformadoDinheiro} onChange={(e) => setValorInformadoDinheiro(e.target.value)} className={`w-full mt-1 p-3 rounded-xl border outline-none font-bold ${temaNoturno ? 'bg-gray-800 border-gray-600 text-white focus:border-purple-500' : 'bg-white border-gray-300 focus:border-purple-500'}`} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-500">Máquina Cartão</label>
                <input type="number" placeholder="R$ 0,00" value={valorInformadoCartao} onChange={(e) => setValorInformadoCartao(e.target.value)} className={`w-full mt-1 p-3 rounded-xl border outline-none font-bold ${temaNoturno ? 'bg-gray-800 border-gray-600 text-white focus:border-purple-500' : 'bg-white border-gray-300 focus:border-purple-500'}`} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-500">Comprovantes Pix</label>
                <input type="number" placeholder="R$ 0,00" value={valorInformadoPix} onChange={(e) => setValorInformadoPix(e.target.value)} className={`w-full mt-1 p-3 rounded-xl border outline-none font-bold ${temaNoturno ? 'bg-gray-800 border-gray-600 text-white focus:border-purple-500' : 'bg-white border-gray-300 focus:border-purple-500'}`} />
              </div>
            </div>

            <div className="flex flex-col mb-6 gap-1">
              <p className="text-sm font-bold text-gray-500">Dinheiro Esperado em Sistema: R$ {saldoGavetaEsperado.toFixed(2)}</p>
            </div>

            <button onClick={encerrarCaixa} className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-black text-lg rounded-xl transition shadow-lg">
              Finalizar Turno e Fechar Caixa
            </button>
          </div>
        </>
      ) : (
        <div>
          <h2 className={`text-xl font-black mb-6 ${temaNoturno ? 'text-white' : 'text-purple-900'}`}>Últimos Fechamentos</h2>
          
          {historicoCaixas.length === 0 ? (
            <div className={`p-8 text-center rounded-2xl border border-dashed ${temaNoturno ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-400'}`}>
              Nenhum caixa fechado encontrado.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {historicoCaixas.map((caixa) => {
                const isDiferenca = caixa.relatorio_fechamento?.diferencaDinheiro !== 0;
                const diferenca = caixa.relatorio_fechamento?.diferencaDinheiro || 0;

                return (
                  <div key={caixa.id} className={`p-5 rounded-2xl border ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex flex-col sm:flex-row justify-between mb-4 border-b border-gray-200/20 pb-3 gap-2">
                      <div>
                        <p className="text-xs uppercase font-bold text-gray-500">Data de Operação</p>
                        <p className={`font-black ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>{caixa.data_abertura?.split('-').reverse().join('/')}</p>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-xs uppercase font-bold text-gray-500">Status da Gaveta</p>
                        {isDiferenca ? (
                           <p className={`font-black ${diferenca > 0 ? 'text-green-500' : 'text-red-500'}`}>
                             {diferenca > 0 ? `Sobrou R$ ${Math.abs(diferenca).toFixed(2)}` : `Faltou R$ ${Math.abs(diferenca).toFixed(2)}`}
                           </p>
                        ) : (
                           <p className="font-black text-blue-500">Caixa Bateu Exato</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Dinheiro Apurado</p>
                        <p className={`font-bold ${temaNoturno ? 'text-gray-300' : 'text-gray-700'}`}>R$ {(caixa.relatorio_fechamento?.informadoDinheiro || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Dinheiro Sistema</p>
                        <p className={`font-bold ${temaNoturno ? 'text-gray-300' : 'text-gray-700'}`}>R$ {(caixa.relatorio_fechamento?.esperadoDinheiro || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Sangrias Realizadas</p>
                        <p className={`font-bold text-red-500`}>R$ {(caixa.relatorio_fechamento?.sangrias || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Pix e Cartão</p>
                        <p className={`font-bold ${temaNoturno ? 'text-gray-300' : 'text-gray-700'}`}>
                          R$ {((caixa.relatorio_fechamento?.informadoPix || 0) + (caixa.relatorio_fechamento?.informadoCartao || 0)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}