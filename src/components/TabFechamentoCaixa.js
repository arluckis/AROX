'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TabFechamentoCaixa({ temaNoturno, sessao, caixaAtual, comandas, fetchData }) {
  const [abaInterna, setAbaInterna] = useState('atual'); 
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [bairros, setBairros] = useState([]);
  const [motoboyAtivo, setMotoboyAtivo] = useState(false);
  const [historicoCaixas, setHistoricoCaixas] = useState([]);
  
  const [valorInformadoDinheiro, setValorInformadoDinheiro] = useState('');
  const [valorInformadoCartao, setValorInformadoCartao] = useState('');
  const [valorInformadoPix, setValorInformadoPix] = useState('');

  const [movModal, setMovModal] = useState({ visivel: false, tipo: '', valor: '', descricao: '' });
  const [senhaModal, setSenhaModal] = useState({ visivel: false, senha: '' });
  const [modalAcao, setModalAcao] = useState({ visivel: false, titulo: '', mensagem: '', acao: null, corBotao: '' });
  
  const [mostrarEsperado, setMostrarEsperado] = useState(false);
  const [historicoLiberado, setHistoricoLiberado] = useState(false);
  const [acaoPendente, setAcaoPendente] = useState(null); 
  const [totalPagoMotoboysDia, setTotalPagoMotoboysDia] = useState(0);
  const [caixaEditando, setCaixaEditando] = useState(null);
  const [modalEdicao, setModalEdicao] = useState({ visivel: false, dinheiro: '', cartao: '', pix: '' });

  const formatarDataSegura = (isoString) => {
    if (!isoString) return '---';
    if (isoString.length === 10) {
      const [ano, mes, dia] = isoString.split('-');
      return `${dia}/${mes}/${ano}`;
    }
    return new Date(isoString).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  };

  useEffect(() => {
    if (sessao?.empresa_id && caixaAtual?.id) {
      carregarDadosCaixa();
    }
  }, [sessao?.empresa_id, caixaAtual?.id, abaInterna]);

  const carregarDadosCaixa = async () => {
    const { data: movData } = await supabase.from('caixa_movimentacoes').select('*').eq('caixa_id', caixaAtual.id);
    if (movData) setMovimentacoes(movData);

    const { data: empData } = await supabase.from('empresas').select('motoboy_ativo').eq('id', sessao.empresa_id).single();
    if (empData) setMotoboyAtivo(empData.motoboy_ativo);

    const { data: bairrosData } = await supabase.from('bairros_entrega').select('*').eq('empresa_id', sessao.empresa_id);
    if (bairrosData) setBairros(bairrosData);

    const dataCaixa = caixaAtual?.data_abertura?.substring(0, 10);
    if (dataCaixa) {
      const { data: caixasDoDia } = await supabase.from('caixas').select('id').eq('empresa_id', sessao.empresa_id).eq('data_abertura', dataCaixa);
      if (caixasDoDia && caixasDoDia.length > 0) {
        const ids = caixasDoDia.map(c => c.id);
        const { data: movsDia } = await supabase.from('caixa_movimentacoes').select('valor, descricao').eq('tipo', 'sangria').in('caixa_id', ids);
        if (movsDia) {
          const pagoHoje = movsDia.filter(m => m.descricao && m.descricao.includes('Motoboy')).reduce((acc, m) => acc + parseFloat(m.valor), 0);
          setTotalPagoMotoboysDia(pagoHoje);
        }
      }
    }

    if (abaInterna === 'historico') {
      // AQUÍ OCORRE A MÁGICA DA ORDENAÇÃO DE DATA/HORA EXATA NO HISTÓRICO DE CAIXAS
      const { data: histData } = await supabase.from('caixas')
        .select('*')
        .eq('empresa_id', sessao.empresa_id)
        .eq('status', 'fechado')
        .order('data_fechamento', { ascending: false })
        .limit(10);
      if (histData) setHistoricoCaixas(histData);
    }
  };

  const toggleMotoboy = async () => {
    const novoStatus = !motoboyAtivo;
    await supabase.from('empresas').update({ motoboy_ativo: novoStatus }).eq('id', sessao.empresa_id);
    setMotoboyAtivo(novoStatus);
  };

  const handleSalvarMovimentacao = async () => {
    const val = parseFloat(movModal.valor.replace(',', '.'));
    if (isNaN(val) || val <= 0) return alert('Por favor, informe um valor numérico válido maior que zero.');
    if (!movModal.descricao.trim()) return alert('Por favor, informe o motivo ou descrição.');

    const payload = {
      caixa_id: caixaAtual.id,
      empresa_id: sessao.empresa_id,
      tipo: movModal.tipo,
      valor: val,
      descricao: movModal.descricao
    };

    const { data, error } = await supabase.from('caixa_movimentacoes').insert([payload]).select();
    if (data && data.length > 0 && !error) {
      setMovimentacoes(prev => [...prev, ...data]);
      setMovModal({ visivel: false, tipo: '', valor: '', descricao: '' });
    } else {
      alert("Erro ao salvar no banco de dados.");
      carregarDadosCaixa();
    }
  };

  const handleVerificarSenha = async () => {
    if (!senhaModal.senha) return;
    const { data } = await supabase.from('usuarios').select('id').eq('empresa_id', sessao.empresa_id).eq('role', 'dono').eq('senha', senhaModal.senha);
    if (data && data.length > 0) {
      setSenhaModal({ visivel: false, senha: '' });
      if (acaoPendente === 'revelar') setMostrarEsperado(true);
      if (acaoPendente === 'historico') { setHistoricoLiberado(true); setAbaInterna('historico'); }
      if (acaoPendente === 'editar_fechamento') {
        const rel = caixaEditando.relatorio_fechamento || {};
        setModalEdicao({ visivel: true, dinheiro: rel.informadoDinheiro || '', cartao: rel.informadoCartao || '', pix: rel.informadoPix || '' });
      }
    } else { alert("Senha incorreta ou você não possui permissão de dono."); }
  };

  const calcularPendenteMotoboy = () => {
    if (!comandas || comandas.length === 0) return 0;
    const dataCaixa = caixaAtual?.data_abertura?.substring(0, 10);
    const totalTaxas = comandas
      .filter(c => c.status === 'fechada' && (c.pagamentos?.some(p => p.data?.substring(0, 10) === dataCaixa) || c.data?.substring(0, 10) === dataCaixa))
      .reduce((acc, c) => {
        let taxa = parseFloat(c.taxa_entrega || 0);
        if (taxa === 0 && c.bairro_id && bairros.length > 0) {
          const b = bairros.find(b => String(b.id) === String(c.bairro_id));
          if (b) taxa = parseFloat(b.taxa || 0);
        }
        return acc + taxa;
      }, 0);
    return Math.max(0, totalTaxas - totalPagoMotoboysDia);
  };
  
  const pendenteMotoboy = calcularPendenteMotoboy();

  const pagarMotoboysConfirmado = async () => {
    const payload = { caixa_id: caixaAtual.id, empresa_id: sessao.empresa_id, tipo: 'sangria', valor: pendenteMotoboy, descricao: 'Pagamento Motoboys (Entregas)' };
    const { data, error } = await supabase.from('caixa_movimentacoes').insert([payload]).select();
    if (data && !error) { setMovimentacoes(prev => [...prev, ...data]); setTotalPagoMotoboysDia(prev => prev + pendenteMotoboy); }
    else { carregarDadosCaixa(); }
    setModalAcao({ visivel: false });
  };

  const abrirConfirmacaoMotoboy = () => setModalAcao({ visivel: true, titulo: 'Confirmar Pagamento', mensagem: `Deseja registrar o repasse de R$ ${pendenteMotoboy.toFixed(2)} para os motoboys?`, acao: pagarMotoboysConfirmado, corBotao: 'bg-blue-600 hover:bg-blue-700' });

  const pagamentosDoTurno = comandas.filter(c => c.status === 'fechada').flatMap(c => c.pagamentos || []).filter(p => p.data?.substring(0, 10) === caixaAtual?.data_abertura?.substring(0, 10));
  const totalSistemaDinheiro = pagamentosDoTurno.filter(p => p.forma === 'Dinheiro').reduce((acc, p) => acc + parseFloat(p.valor), 0);
  const totalSistemaCartao = pagamentosDoTurno.filter(p => p.forma === 'Cartão').reduce((acc, p) => acc + parseFloat(p.valor), 0);
  const totalSistemaPix = pagamentosDoTurno.filter(p => p.forma === 'Pix').reduce((acc, p) => acc + parseFloat(p.valor), 0);

  const totalSuprimentos = movimentacoes.filter(m => m.tipo === 'suprimento').reduce((acc, m) => acc + parseFloat(m.valor), 0);
  const totalSangrias = movimentacoes.filter(m => m.tipo === 'sangria').reduce((acc, m) => acc + parseFloat(m.valor), 0);
  
  const saldoInicial = parseFloat(caixaAtual?.saldo_inicial || 0);
  const saldoGavetaEsperado = saldoInicial + totalSistemaDinheiro + totalSuprimentos - totalSangrias;

  const encerrarCaixaConfirmado = async () => {
    const diferencaDinheiro = parseFloat(valorInformadoDinheiro || 0) - saldoGavetaEsperado;
    const relatorioFinal = {
      informadoDinheiro: parseFloat(valorInformadoDinheiro || 0), informadoCartao: parseFloat(valorInformadoCartao || 0),
      informadoPix: parseFloat(valorInformadoPix || 0), esperadoDinheiro: saldoGavetaEsperado, esperadoCartao: totalSistemaCartao,
      esperadoPix: totalSistemaPix, diferencaDinheiro: diferencaDinheiro, suprimentos: totalSuprimentos, sangrias: totalSangrias
    };
    const { error } = await supabase.from('caixas').update({ status: 'fechado', data_fechamento: new Date().toISOString(), relatorio_fechamento: relatorioFinal }).eq('id', caixaAtual.id);
    if (error) return alert("❌ ERRO NO SUPABASE:\n\n" + error.message);
    
    alert("Turno encerrado com sucesso! Um novo caixa será aberto automaticamente.");
    setValorInformadoDinheiro(''); setValorInformadoCartao(''); setValorInformadoPix('');
    setModalAcao({ visivel: false }); setMostrarEsperado(false); fetchData(); 
  };

  const abrirConfirmacaoFechamento = () => setModalAcao({ visivel: true, titulo: 'Encerrar Turno', mensagem: 'Tem certeza que deseja encerrar o turno de caixa atual?', acao: encerrarCaixaConfirmado, corBotao: 'bg-purple-600 hover:bg-purple-700' });

  const salvarEdicaoFechamento = async () => {
    const valDinheiro = parseFloat(modalEdicao.dinheiro || 0);
    const valCartao = parseFloat(modalEdicao.cartao || 0);
    const valPix = parseFloat(modalEdicao.pix || 0);
    const novoRelatorio = { ...caixaEditando.relatorio_fechamento, informadoDinheiro: valDinheiro, informadoCartao: valCartao, informadoPix: valPix, diferencaDinheiro: valDinheiro - (caixaEditando.relatorio_fechamento.esperadoDinheiro || 0) };
    const { error } = await supabase.from('caixas').update({ relatorio_fechamento: novoRelatorio }).eq('id', caixaEditando.id);
    if (!error) { alert("Apuração atualizada com sucesso!"); setModalEdicao({ visivel: false, dinheiro: '', cartao: '', pix: '' }); carregarDadosCaixa(); }
    else { alert("Erro ao atualizar: " + error.message); }
  };

  return (
    <div className={`max-w-4xl mx-auto w-full animate-in slide-in-from-bottom-4 duration-500 p-4 rounded-3xl shadow-sm border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
      
      <div className="flex gap-4 mb-6 border-b border-gray-200/20 pb-2">
        <button onClick={() => setAbaInterna('atual')} className={`font-bold px-4 py-2 transition ${abaInterna === 'atual' ? (temaNoturno ? 'text-purple-400 border-b-2 border-purple-400' : 'text-purple-600 border-b-2 border-purple-600') : 'text-gray-500 hover:text-gray-400'}`}>Fechamento de Caixa</button>
        <button onClick={() => { if (historicoLiberado) setAbaInterna('historico'); else { setAcaoPendente('historico'); setSenhaModal({ visivel: true, senha: '' }); } }} className={`font-bold px-4 py-2 transition flex items-center gap-2 ${abaInterna === 'historico' ? (temaNoturno ? 'text-purple-400 border-b-2 border-purple-400' : 'text-purple-600 border-b-2 border-purple-600') : 'text-gray-500 hover:text-gray-400'}`}>Histórico de Fechamentos {!historicoLiberado && "🔒"}</button>
      </div>

      {abaInterna === 'atual' ? (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h2 className={`text-xl font-black ${temaNoturno ? 'text-white' : 'text-purple-900'}`}>Fechamento de Caixa</h2>
              <p className={`text-sm font-medium ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Aberto em: {formatarDataSegura(caixaAtual?.data_abertura)}</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button onClick={() => setMovModal({ visivel: true, tipo: 'suprimento', valor: '', descricao: '' })} className="flex-1 md:flex-none px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-sm transition shadow-sm">+ Suprimento</button>
              <button onClick={() => setMovModal({ visivel: true, tipo: 'sangria', valor: '', descricao: '' })} className="flex-1 md:flex-none px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition shadow-sm">- Sangria</button>
            </div>
          </div>

          <div className={`mb-6 p-5 rounded-2xl border ${temaNoturno ? 'bg-gray-900/50 border-gray-700' : 'bg-blue-50/50 border-blue-100'}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className={`font-black flex items-center gap-2 ${temaNoturno ? 'text-blue-400' : 'text-blue-700'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path></svg>Gestão de Motoboys</h3>
                <p className={`text-sm mt-1 ${temaNoturno ? 'text-gray-400' : 'text-gray-600'}`}>Controle do repasse de taxas de entrega.</p>
              </div>
              <button onClick={toggleMotoboy} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${motoboyAtivo ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-300 text-gray-600'}`}>{motoboyAtivo ? 'ATIVADO' : 'DESATIVADO'}</button>
            </div>
            {motoboyAtivo && (
              <div className={`mt-5 p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-center gap-4 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-blue-200'}`}>
                <div className="text-center sm:text-left">
                  <p className={`text-xs font-bold uppercase tracking-widest ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Pendente de Pagamento</p>
                  <p className={`text-3xl font-black ${pendenteMotoboy > 0 ? (temaNoturno ? 'text-blue-400' : 'text-blue-600') : (temaNoturno ? 'text-gray-500' : 'text-gray-400')}`}>R$ {pendenteMotoboy.toFixed(2)}</p>
                </div>
                <button onClick={abrirConfirmacaoMotoboy} disabled={pendenteMotoboy <= 0} className={`px-5 py-3 font-bold rounded-xl transition w-full sm:w-auto ${pendenteMotoboy > 0 ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' : (temaNoturno ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400')}`}>Confirmar Pagamento</button>
              </div>
            )}
          </div>

          <div className={`p-6 rounded-2xl border mb-6 ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <h3 className={`text-lg font-black mb-4 ${temaNoturno ? 'text-white' : 'text-gray-800'}`}>Conferência Cega</h3>
            <p className={`text-sm mb-4 ${temaNoturno ? 'text-gray-400' : 'text-gray-600'}`}>Conte o dinheiro da gaveta e digite os totais das maquinetas abaixo.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-500">Dinheiro na Gaveta *</label>
                <input type="number" placeholder="R$ 0,00" value={valorInformadoDinheiro} onChange={(e) => setValorInformadoDinheiro(e.target.value)} className={`w-full mt-1 p-3 rounded-xl border outline-none font-bold ${temaNoturno ? 'bg-gray-800 border-gray-600 text-white focus:border-purple-500' : 'bg-white border-gray-300 focus:border-purple-500'}`} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-500">Total Cartão (Maquineta)</label>
                <input type="number" placeholder="R$ 0,00" value={valorInformadoCartao} onChange={(e) => setValorInformadoCartao(e.target.value)} className={`w-full mt-1 p-3 rounded-xl border outline-none font-bold ${temaNoturno ? 'bg-gray-800 border-gray-600 text-white focus:border-purple-500' : 'bg-white border-gray-300 focus:border-purple-500'}`} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-500">Total Pix Conferido</label>
                <input type="number" placeholder="R$ 0,00" value={valorInformadoPix} onChange={(e) => setValorInformadoPix(e.target.value)} className={`w-full mt-1 p-3 rounded-xl border outline-none font-bold ${temaNoturno ? 'bg-gray-800 border-gray-600 text-white focus:border-purple-500' : 'bg-white border-gray-300 focus:border-purple-500'}`} />
              </div>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border mb-6 transition-all ${temaNoturno ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className={`font-black flex items-center gap-2 ${temaNoturno ? 'text-gray-300' : 'text-gray-700'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v1a3 3 0 106 0v-1m-6 0a3 3 0 006 0M9 17h6M9 12a3 3 0 116 0 3 3 0 01-6 0z"></path></svg>Relatório do Sistema</h3>
                <p className={`text-xs mt-1 ${temaNoturno ? 'text-gray-500' : 'text-gray-500'}`}>Visualização de entradas, saídas e saldo financeiro esperado.</p>
              </div>
              <button onClick={() => { if(mostrarEsperado) setMostrarEsperado(false); else { setAcaoPendente('revelar'); setSenhaModal({ visivel: true, senha: '' }); } }} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition ${temaNoturno ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                {mostrarEsperado ? <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg> Ocultar Valores</> : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> Desbloquear</>}
              </button>
            </div>
            {mostrarEsperado && (
              <div className={`mt-5 pt-5 border-t grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 ${temaNoturno ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className={`col-span-2 md:col-span-4 p-4 rounded-xl flex justify-between items-center ${temaNoturno ? 'bg-gray-900' : 'bg-gray-50'}`}>
                  <div><p className="text-xs uppercase font-bold text-gray-500 mb-1">Dinheiro Esperado na Gaveta</p><p className={`text-2xl font-black ${temaNoturno ? 'text-white' : 'text-gray-800'}`}>R$ {saldoGavetaEsperado.toFixed(2)}</p></div>
                </div>
                <div><p className="text-xs text-gray-500">Saldo Inicial</p><p className="font-bold text-gray-400">R$ {saldoInicial.toFixed(2)}</p></div>
                <div><p className="text-xs text-gray-500">Vendas (Dinheiro)</p><p className="font-bold text-green-500">+ R$ {totalSistemaDinheiro.toFixed(2)}</p></div>
                <div><p className="text-xs text-gray-500">Suprimentos</p><p className="font-bold text-green-500">+ R$ {totalSuprimentos.toFixed(2)}</p></div>
                <div><p className="text-xs text-gray-500">Sangrias</p><p className="font-bold text-red-500">- R$ {totalSangrias.toFixed(2)}</p></div>
                <div className="col-span-2 mt-2"><p className="text-xs text-gray-500">Total Cartão (Sistema)</p><p className={`font-bold ${temaNoturno ? 'text-gray-300' : 'text-gray-700'}`}>R$ {totalSistemaCartao.toFixed(2)}</p></div>
                <div className="col-span-2 mt-2"><p className="text-xs text-gray-500">Total Pix (Sistema)</p><p className={`font-bold ${temaNoturno ? 'text-gray-300' : 'text-gray-700'}`}>R$ {totalSistemaPix.toFixed(2)}</p></div>
              </div>
            )}
          </div>

          <button onClick={abrirConfirmacaoFechamento} className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-black text-lg rounded-xl transition shadow-lg">Finalizar Turno e Fechar Caixa</button>
        </>
      ) : (
        <div>
          <h2 className={`text-xl font-black mb-6 ${temaNoturno ? 'text-white' : 'text-purple-900'}`}>Últimos Fechamentos</h2>
          {historicoCaixas.length === 0 ? (
            <div className={`p-8 text-center rounded-2xl border border-dashed ${temaNoturno ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-400'}`}>Nenhum caixa fechado encontrado.</div>
          ) : (
            <div className="flex flex-col gap-4">
              {historicoCaixas.map((caixa) => {
                const isDiferenca = caixa.relatorio_fechamento?.diferencaDinheiro !== 0;
                const diferenca = caixa.relatorio_fechamento?.diferencaDinheiro || 0;
                return (
                  <div key={caixa.id} className={`relative p-5 rounded-2xl border ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <button onClick={() => { setCaixaEditando(caixa); setAcaoPendente('editar_fechamento'); setSenhaModal({ visivel: true, senha: '' }); }} className={`absolute top-4 right-4 text-[10px] font-bold flex items-center gap-1 uppercase tracking-widest transition hover:underline ${temaNoturno ? 'text-blue-400' : 'text-blue-600'}`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg> Editar
                    </button>
                    <div className="flex flex-col sm:flex-row justify-between mb-4 border-b border-gray-200/20 pb-3 gap-4 pr-16">
                      <div className="flex flex-wrap gap-4">
                        <div>
                          <p className="text-xs uppercase font-bold text-gray-500">Abertura</p>
                          <p className={`font-black ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>{formatarDataSegura(caixa.data_abertura)}</p>
                        </div>
                        {caixa.data_fechamento && (
                          <div>
                            <p className="text-xs uppercase font-bold text-gray-500">Fechamento</p>
                            <p className={`font-black ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>
                              {new Date(caixa.data_fechamento).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} às {new Date(caixa.data_fechamento).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="sm:text-right">
                        <p className="text-xs uppercase font-bold text-gray-500">Status da Gaveta</p>
                        {isDiferenca ? <p className={`font-black ${diferenca > 0 ? 'text-green-500' : 'text-red-500'}`}>{diferenca > 0 ? `Sobrou R$ ${Math.abs(diferenca).toFixed(2)}` : `Faltou R$ ${Math.abs(diferenca).toFixed(2)}`}</p> : <p className="font-black text-blue-500">Caixa Bateu Exato</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div className={`p-3 rounded-xl border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-gray-100/50 border-gray-200'}`}><p className="text-[10px] uppercase font-bold text-gray-500">Dinheiro Apurado</p><p className={`font-black ${temaNoturno ? 'text-white' : 'text-gray-800'}`}>R$ {(caixa.relatorio_fechamento?.informadoDinheiro || 0).toFixed(2)}</p><p className="text-[10px] text-gray-500 mt-1">Sistema: R$ {(caixa.relatorio_fechamento?.esperadoDinheiro || 0).toFixed(2)}</p></div>
                      <div className={`p-3 rounded-xl border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-gray-100/50 border-gray-200'}`}><p className="text-[10px] uppercase font-bold text-gray-500">Cartão Apurado</p><p className={`font-black ${temaNoturno ? 'text-white' : 'text-gray-800'}`}>R$ {(caixa.relatorio_fechamento?.informadoCartao || 0).toFixed(2)}</p>{caixa.relatorio_fechamento?.esperadoCartao !== undefined && <p className="text-[10px] text-gray-500 mt-1">Sistema: R$ {(caixa.relatorio_fechamento?.esperadoCartao || 0).toFixed(2)}</p>}</div>
                      <div className={`p-3 rounded-xl border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-gray-100/50 border-gray-200'}`}><p className="text-[10px] uppercase font-bold text-gray-500">Pix Apurado</p><p className={`font-black ${temaNoturno ? 'text-white' : 'text-gray-800'}`}>R$ {(caixa.relatorio_fechamento?.informadoPix || 0).toFixed(2)}</p>{caixa.relatorio_fechamento?.esperadoPix !== undefined && <p className="text-[10px] text-gray-500 mt-1">Sistema: R$ {(caixa.relatorio_fechamento?.esperadoPix || 0).toFixed(2)}</p>}</div>
                      <div className={`p-3 rounded-xl border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-gray-100/50 border-gray-200'}`}><p className="text-[10px] uppercase font-bold text-gray-500">Extra</p><p className="font-bold text-red-500 text-xs">San: R$ {(caixa.relatorio_fechamento?.sangrias || 0).toFixed(2)}</p><p className="font-bold text-green-500 text-xs mt-0.5">Sup: R$ {(caixa.relatorio_fechamento?.suprimentos || 0).toFixed(2)}</p></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {movModal.visivel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] animate-in fade-in">
          <div className={`rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col border ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <h2 className={`text-xl font-bold mb-4 ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>{movModal.tipo === 'sangria' ? 'Retirada de Dinheiro' : 'Entrada de Dinheiro'}</h2>
            <label className="text-xs font-bold uppercase text-gray-500 mb-1">Valor (R$)</label>
            <input type="number" step="0.01" className={`w-full p-3 rounded-xl border mb-4 outline-none font-bold text-lg ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white focus:border-purple-500' : 'bg-white border-gray-300 focus:border-purple-500'}`} value={movModal.valor} onChange={e => setMovModal({...movModal, valor: e.target.value})} placeholder="0.00" autoFocus />
            <label className="text-xs font-bold uppercase text-gray-500 mb-1">Motivo / Descrição</label>
            <input type="text" className={`w-full p-3 rounded-xl border mb-6 outline-none ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white focus:border-purple-500' : 'bg-white border-gray-300 focus:border-purple-500'}`} value={movModal.descricao} onChange={e => setMovModal({...movModal, descricao: e.target.value})} placeholder={movModal.tipo === 'sangria' ? "Ex: Pagamento Fornecedor" : "Ex: Troco inicial"} />
            <div className="flex gap-3">
              <button onClick={() => setMovModal({ visivel: false, tipo: '', valor: '', descricao: '' })} className={`flex-1 p-3 rounded-xl font-bold transition ${temaNoturno ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Cancelar</button>
              <button onClick={handleSalvarMovimentacao} className={`flex-1 p-3 rounded-xl font-bold text-white transition ${movModal.tipo === 'sangria' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {senhaModal.visivel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] animate-in fade-in">
          <div className={`rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col border ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <h2 className={`text-xl font-bold mb-2 ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>Acesso Restrito</h2>
            <p className={`text-sm mb-4 ${temaNoturno ? 'text-gray-400' : 'text-gray-600'}`}>Ação permitida apenas para o dono. Digite sua senha.</p>
            <input type="password" autoFocus className={`w-full p-3 rounded-xl border mb-6 outline-none font-bold text-lg tracking-widest ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white focus:border-purple-500' : 'bg-white border-gray-300 focus:border-purple-500'}`} value={senhaModal.senha} onChange={e => setSenhaModal({...senhaModal, senha: e.target.value})} placeholder="••••••" />
            <div className="flex gap-3">
              <button onClick={() => setSenhaModal({ visivel: false, senha: '' })} className={`flex-1 p-3 rounded-xl font-bold transition ${temaNoturno ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Voltar</button>
              <button onClick={handleVerificarSenha} className="flex-1 p-3 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 transition">Desbloquear</button>
            </div>
          </div>
        </div>
      )}

      {modalEdicao.visivel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] animate-in fade-in">
          <div className={`rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col border ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <h2 className={`text-xl font-bold mb-2 ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>Editar Apuração</h2>
            <p className={`text-xs mb-4 ${temaNoturno ? 'text-gray-400' : 'text-gray-600'}`}>Corrija os valores apurados pelo funcionário neste fechamento.</p>
            <label className="text-[10px] font-bold uppercase text-gray-500 mb-1">Dinheiro na Gaveta (R$)</label>
            <input type="number" className={`w-full p-2 rounded-xl border mb-3 outline-none font-bold ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 focus:border-blue-500'}`} value={modalEdicao.dinheiro} onChange={e => setModalEdicao({...modalEdicao, dinheiro: e.target.value})} />
            <label className="text-[10px] font-bold uppercase text-gray-500 mb-1">Cartão Apurado (R$)</label>
            <input type="number" className={`w-full p-2 rounded-xl border mb-3 outline-none font-bold ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 focus:border-blue-500'}`} value={modalEdicao.cartao} onChange={e => setModalEdicao({...modalEdicao, cartao: e.target.value})} />
            <label className="text-[10px] font-bold uppercase text-gray-500 mb-1">Pix Apurado (R$)</label>
            <input type="number" className={`w-full p-2 rounded-xl border mb-6 outline-none font-bold ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 focus:border-blue-500'}`} value={modalEdicao.pix} onChange={e => setModalEdicao({...modalEdicao, pix: e.target.value})} />
            <div className="flex gap-3">
              <button onClick={() => setModalEdicao({ visivel: false, dinheiro: '', cartao: '', pix: '' })} className={`flex-1 p-3 rounded-xl font-bold transition ${temaNoturno ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Cancelar</button>
              <button onClick={salvarEdicaoFechamento} className="flex-1 p-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-lg">Salvar Correção</button>
            </div>
          </div>
        </div>
      )}

      {modalAcao.visivel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] animate-in fade-in">
          <div className={`rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col border text-center ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${temaNoturno ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            <h2 className={`text-xl font-black mb-2 ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>{modalAcao.titulo}</h2>
            <p className={`text-sm mb-6 ${temaNoturno ? 'text-gray-400' : 'text-gray-600'}`}>{modalAcao.mensagem}</p>
            <div className="flex gap-3">
              <button onClick={() => setModalAcao({ visivel: false })} className={`flex-1 p-3 rounded-xl font-bold transition ${temaNoturno ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Cancelar</button>
              <button onClick={modalAcao.acao} className={`flex-1 p-3 rounded-xl font-bold text-white transition shadow-lg ${modalAcao.corBotao}`}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}