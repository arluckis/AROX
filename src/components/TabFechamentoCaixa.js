'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TabFechamentoCaixa({ temaNoturno, sessao, caixaAtual, comandas, fetchData, mostrarAlerta, mostrarConfirmacao }) {
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
  
  const [mostrarEsperado, setMostrarEsperado] = useState(false);
  const [historicoLiberado, setHistoricoLiberado] = useState(false);
  const [acaoPendente, setAcaoPendente] = useState(null); 
  const [totalPagoMotoboysDia, setTotalPagoMotoboysDia] = useState(0);
  const [caixaEditando, setCaixaEditando] = useState(null);
  const [modalEdicao, setModalEdicao] = useState({ visivel: false, dinheiro: '', cartao: '', pix: '' });
  
  const [solicitouSenhaAuto, setSolicitouSenhaAuto] = useState(false);

  const formatarDataSegura = (isoString) => {
    if (!isoString) return '---';
    if (isoString.length === 10) {
      const [ano, mes, dia] = isoString.split('-');
      return `${dia}/${mes}/${ano}`;
    }
    return new Date(isoString).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  };

  useEffect(() => {
    if (caixaAtual?.status !== 'aberto' && abaInterna === 'atual' && !solicitouSenhaAuto) {
      setSolicitouSenhaAuto(true);
      if (!historicoLiberado) {
        setAcaoPendente('historico');
        setSenhaModal({ visivel: true, senha: '' });
      } else {
        setAbaInterna('historico');
      }
    }
  }, [caixaAtual?.status, abaInterna, historicoLiberado, solicitouSenhaAuto]);

  useEffect(() => {
    if (sessao?.empresa_id) {
      if (caixaAtual?.id) carregarDadosCaixaAtual();
      if (abaInterna === 'historico') carregarHistorico();
    }
  }, [sessao?.empresa_id, caixaAtual?.id, abaInterna]);

  const carregarDadosCaixaAtual = async () => {
    if (!caixaAtual?.id) return;
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
  };

  const carregarHistorico = async () => {
    const { data: histData } = await supabase.from('caixas')
      .select('*')
      .eq('empresa_id', sessao.empresa_id)
      .eq('status', 'fechado')
      .order('data_fechamento', { ascending: false })
      .limit(10);
    if (histData) setHistoricoCaixas(histData);
  };

  const toggleMotoboy = async () => {
    const novoStatus = !motoboyAtivo;
    await supabase.from('empresas').update({ motoboy_ativo: novoStatus }).eq('id', sessao.empresa_id);
    setMotoboyAtivo(novoStatus);
  };

  const handleSalvarMovimentacao = async () => {
    const val = parseFloat(movModal.valor.replace(',', '.'));
    if (isNaN(val) || val <= 0) return mostrarAlerta("Aviso", "Por favor, informe um valor numérico válido maior que zero.");
    if (!movModal.descricao.trim()) return mostrarAlerta("Aviso", "Por favor, informe o motivo ou descrição.");

    const payload = { caixa_id: caixaAtual.id, empresa_id: sessao.empresa_id, tipo: movModal.tipo, valor: val, descricao: movModal.descricao };
    const { data, error } = await supabase.from('caixa_movimentacoes').insert([payload]).select();
    if (data && data.length > 0 && !error) {
      setMovimentacoes(prev => [...prev, ...data]);
      setMovModal({ visivel: false, tipo: '', valor: '', descricao: '' });
    } else {
      mostrarAlerta("Erro", "Erro ao salvar no banco de dados.");
      carregarDadosCaixaAtual();
    }
  };

  const excluirCaixaConfirmado = async () => {
    const { error } = await supabase.from('caixas').delete().eq('id', caixaEditando.id);
    if (!error) { mostrarAlerta("Sucesso", "Fechamento de caixa excluído."); carregarHistorico(); }
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
      if (acaoPendente === 'excluir_fechamento') {
        mostrarConfirmacao('Atenção: Excluir Fechamento', 'Ação irreversível. Continuar?', excluirCaixaConfirmado);
      }
    } else { mostrarAlerta("Acesso Negado", "Senha incorreta ou sem permissão."); }
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
    const payload = { caixa_id: caixaAtual.id, empresa_id: sessao.empresa_id, tipo: 'sangria', valor: pendenteMotoboy, descricao: 'Pagamento Motoboys' };
    const { data, error } = await supabase.from('caixa_movimentacoes').insert([payload]).select();
    if (data && !error) { setMovimentacoes(prev => [...prev, ...data]); setTotalPagoMotoboysDia(prev => prev + pendenteMotoboy); }
  };

  const abrirConfirmacaoMotoboy = () => mostrarConfirmacao('Confirmar', `Repassar R$ ${pendenteMotoboy.toFixed(2)}?`, pagarMotoboysConfirmado);

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
    if (error) return mostrarAlerta("Erro", error.message);
    
    mostrarAlerta("Sucesso", "Turno encerrado!");
    setValorInformadoDinheiro(''); setValorInformadoCartao(''); setValorInformadoPix('');
    setMostrarEsperado(false); setHistoricoLiberado(false); setSolicitouSenhaAuto(true);
    setAcaoPendente('historico'); setSenhaModal({ visivel: true, senha: '' });
    fetchData(); 
  };

  const salvarEdicaoFechamento = async () => {
    const valDinheiro = parseFloat(modalEdicao.dinheiro || 0); const valCartao = parseFloat(modalEdicao.cartao || 0); const valPix = parseFloat(modalEdicao.pix || 0);
    const novoRelatorio = { ...caixaEditando.relatorio_fechamento, informadoDinheiro: valDinheiro, informadoCartao: valCartao, informadoPix: valPix, diferencaDinheiro: valDinheiro - (caixaEditando.relatorio_fechamento.esperadoDinheiro || 0) };
    const { error } = await supabase.from('caixas').update({ relatorio_fechamento: novoRelatorio }).eq('id', caixaEditando.id);
    if (!error) { setModalEdicao({ visivel: false, dinheiro: '', cartao: '', pix: '' }); carregarHistorico(); }
  };

  return (
    <div className="w-full animate-in slide-in-from-bottom-4 duration-500 px-2 lg:px-0 pb-10">
      
      {/* TÍTULO FUNDIDO AO HEADER */}
      <div className={`p-5 lg:p-6 pt-4 lg:pt-5 rounded-b-3xl shadow-sm border-x border-b border-t-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative transition-colors duration-500 mb-6 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`absolute top-0 left-6 right-6 border-t border-dashed ${temaNoturno ? 'border-gray-700' : 'border-gray-200'}`}></div>
          <div className="mt-2 md:mt-0">
            <h2 className={`text-xl font-black uppercase tracking-wide flex items-center gap-2 ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>
              {abaInterna === 'atual' ? 'Fechamento de Caixa' : 'Histórico de Fechamentos'}
            </h2>
            <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>
              {abaInterna === 'atual' ? (caixaAtual?.status === 'aberto' ? `Aberto em: ${formatarDataSegura(caixaAtual?.data_abertura)}` : 'Nenhum turno em andamento') : 'Registros passados consolidados'}
            </p>
          </div>
          
          {abaInterna === 'atual' && caixaAtual?.status === 'aberto' && (
            <div className="flex gap-2 w-full md:w-auto animate-in fade-in zoom-in-95 duration-300">
              <button onClick={() => setMovModal({ visivel: true, tipo: 'suprimento', valor: '', descricao: '' })} className="flex-1 md:flex-none px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-sm active:scale-95">+ Suprimento</button>
              <button onClick={() => setMovModal({ visivel: true, tipo: 'sangria', valor: '', descricao: '' })} className="flex-1 md:flex-none px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-sm active:scale-95">- Sangria</button>
            </div>
          )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
        
        {/* BARRA LATERAL (HORIZONTAL MOBILE / VERTICAL DESKTOP) */}
        <div className="shrink-0 lg:w-48 flex flex-col gap-4">
           <div className={`p-2 rounded-3xl shadow-sm border h-fit flex flex-row overflow-x-auto lg:flex-col gap-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <button onClick={() => setAbaInterna('atual')} className={`flex-1 whitespace-nowrap text-left px-4 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 ${abaInterna === 'atual' ? (temaNoturno ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-50 text-purple-700') : (temaNoturno ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50')}`}>
                Fechamento Ativo
              </button>
              <button onClick={() => { if (historicoLiberado) setAbaInterna('historico'); else { setAcaoPendente('historico'); setSenhaModal({ visivel: true, senha: '' }); } }} className={`flex-1 whitespace-nowrap text-left px-4 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-between active:scale-95 ${abaInterna === 'historico' ? (temaNoturno ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-50 text-purple-700') : (temaNoturno ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50')}`}>
                Histórico
              </button>
           </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col min-w-0 max-w-4xl">
            {abaInterna === 'atual' ? (
              caixaAtual?.status === 'aberto' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className={`mb-6 p-5 rounded-3xl border shadow-sm ${temaNoturno ? 'bg-gray-900/50 border-gray-700' : 'bg-blue-50/50 border-blue-100'}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className={`font-black flex items-center gap-2 uppercase tracking-widest text-[10px] ${temaNoturno ? 'text-blue-400' : 'text-blue-700'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path></svg> Gestão de Motoboys</h3>
                        <p className={`text-[10px] mt-1 font-bold uppercase tracking-widest ${temaNoturno ? 'text-gray-400' : 'text-gray-600'}`}>Controle de repasse financeiro de entregas.</p>
                      </div>
                      <button onClick={toggleMotoboy} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${motoboyAtivo ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-300 text-gray-600'}`}>{motoboyAtivo ? 'ATIVADO' : 'DESATIVADO'}</button>
                    </div>
                    {motoboyAtivo && (
                      <div className={`mt-5 p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-center gap-4 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-blue-200'}`}>
                        <div className="text-center sm:text-left">
                          <p className={`text-[10px] font-black uppercase tracking-widest ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Pendente de Pagamento</p>
                          <p className={`text-3xl font-black ${pendenteMotoboy > 0 ? (temaNoturno ? 'text-blue-400' : 'text-blue-600') : (temaNoturno ? 'text-gray-500' : 'text-gray-400')}`}>R$ {pendenteMotoboy.toFixed(2)}</p>
                        </div>
                        <button onClick={abrirConfirmacaoMotoboy} disabled={pendenteMotoboy <= 0} className={`px-5 py-3 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all w-full sm:w-auto active:scale-95 ${pendenteMotoboy > 0 ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' : (temaNoturno ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400')}`}>Confirmar Pagamento</button>
                      </div>
                    )}
                  </div>

                  <div className={`p-6 rounded-3xl border shadow-sm mb-6 ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <h3 className={`text-[10px] font-black uppercase tracking-widest mb-4 ${temaNoturno ? 'text-white' : 'text-gray-800'}`}>Conferência Cega</h3>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${temaNoturno ? 'text-gray-400' : 'text-gray-600'}`}>Conte a gaveta e digite os totais das maquinetas.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Dinheiro na Gaveta *</label>
                        <input type="number" placeholder="R$ 0,00" value={valorInformadoDinheiro} onChange={(e) => setValorInformadoDinheiro(e.target.value)} className={`w-full mt-1 p-3 rounded-xl border outline-none font-bold transition-colors focus:border-purple-500 ${temaNoturno ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Total Cartão</label>
                        <input type="number" placeholder="R$ 0,00" value={valorInformadoCartao} onChange={(e) => setValorInformadoCartao(e.target.value)} className={`w-full mt-1 p-3 rounded-xl border outline-none font-bold transition-colors focus:border-purple-500 ${temaNoturno ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Total Pix</label>
                        <input type="number" placeholder="R$ 0,00" value={valorInformadoPix} onChange={(e) => setValorInformadoPix(e.target.value)} className={`w-full mt-1 p-3 rounded-xl border outline-none font-bold transition-colors focus:border-purple-500 ${temaNoturno ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                      </div>
                    </div>
                  </div>

                  <div className={`p-5 rounded-3xl border mb-6 transition-all ${temaNoturno ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className={`font-black uppercase tracking-widest flex items-center gap-2 text-[10px] ${temaNoturno ? 'text-gray-300' : 'text-gray-700'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v1a3 3 0 106 0v-1m-6 0a3 3 0 006 0M9 17h6M9 12a3 3 0 116 0 3 3 0 01-6 0z"></path></svg> Relatório do Sistema</h3>
                        <p className={`text-[10px] font-bold mt-1 uppercase tracking-widest ${temaNoturno ? 'text-gray-500' : 'text-gray-500'}`}>Visualização financeira esperada</p>
                      </div>
                      <button onClick={() => { if(mostrarEsperado) setMostrarEsperado(false); else { setAcaoPendente('revelar'); setSenhaModal({ visivel: true, senha: '' }); } }} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 ${temaNoturno ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                        {mostrarEsperado ? 'Ocultar Valores' : 'Desbloquear Visualização'}
                      </button>
                    </div>
                    {mostrarEsperado && (
                      <div className={`mt-5 pt-5 border-t grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-300 ${temaNoturno ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className={`col-span-2 md:col-span-4 p-4 rounded-xl flex justify-between items-center ${temaNoturno ? 'bg-gray-900' : 'bg-gray-50'}`}>
                          <div><p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-1">Dinheiro Esperado na Gaveta</p><p className={`text-2xl font-black ${temaNoturno ? 'text-white' : 'text-gray-800'}`}>R$ {saldoGavetaEsperado.toFixed(2)}</p></div>
                        </div>
                        <div><p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Saldo Inicial</p><p className="font-black text-gray-400">R$ {saldoInicial.toFixed(2)}</p></div>
                        <div><p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Vendas (Dinheiro)</p><p className="font-black text-green-500">+ R$ {totalSistemaDinheiro.toFixed(2)}</p></div>
                        <div><p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Suprimentos</p><p className="font-black text-green-500">+ R$ {totalSuprimentos.toFixed(2)}</p></div>
                        <div><p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Sangrias</p><p className="font-black text-red-500">- R$ {totalSangrias.toFixed(2)}</p></div>
                        <div className="col-span-2 mt-2"><p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Total Cartão</p><p className={`font-black ${temaNoturno ? 'text-gray-300' : 'text-gray-700'}`}>R$ {totalSistemaCartao.toFixed(2)}</p></div>
                        <div className="col-span-2 mt-2"><p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Total Pix</p><p className={`font-black ${temaNoturno ? 'text-gray-300' : 'text-gray-700'}`}>R$ {totalSistemaPix.toFixed(2)}</p></div>
                      </div>
                    )}
                  </div>

                  <button onClick={() => mostrarConfirmacao('Encerrar Turno', 'Deseja encerrar o turno de caixa atual?', encerrarCaixaConfirmado)} className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg active:scale-95">Finalizar Turno e Fechar Caixa</button>
                </div>
              ) : (
                <div className={`p-10 text-center rounded-3xl border border-dashed flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300 ${temaNoturno ? 'border-gray-700 text-gray-500 bg-gray-800/50' : 'border-gray-300 text-gray-400 bg-gray-50'}`}>
                  <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  <p className="font-bold uppercase tracking-widest text-[10px] text-gray-600 dark:text-gray-300">O Caixa Atual está Fechado</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest mt-1 max-w-sm">Navegue até a aba "Comandas" para preencher as informações e abrir um novo turno.</p>
                </div>
              )
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                {historicoCaixas.length === 0 ? (
                  <div className={`p-8 text-center rounded-3xl border border-dashed ${temaNoturno ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-400'}`}>Nenhum caixa fechado encontrado.</div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {historicoCaixas.map((caixa) => {
                      const isDiferenca = caixa.relatorio_fechamento?.diferencaDinheiro !== 0;
                      const diferenca = caixa.relatorio_fechamento?.diferencaDinheiro || 0;
                      return (
                        <div key={caixa.id} className={`relative p-5 rounded-3xl border shadow-sm transition-all hover:-translate-y-1 ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="absolute top-4 right-4 flex gap-3 z-10">
                            <button onClick={() => { setCaixaEditando(caixa); setAcaoPendente('editar_fechamento'); setSenhaModal({ visivel: true, senha: '' }); }} className={`text-[10px] font-bold flex items-center gap-1 uppercase tracking-widest transition-all hover:underline ${temaNoturno ? 'text-blue-400' : 'text-blue-600'}`}>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg> Editar
                            </button>
                            <button onClick={() => { setCaixaEditando(caixa); setAcaoPendente('excluir_fechamento'); setSenhaModal({ visivel: true, senha: '' }); }} className={`text-[10px] font-bold flex items-center gap-1 uppercase tracking-widest transition-all hover:underline ${temaNoturno ? 'text-red-400' : 'text-red-600'}`}>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg> Excluir
                            </button>
                          </div>
                          <div className="flex flex-col sm:flex-row justify-between mb-4 border-b border-gray-200/20 pb-3 gap-4 pr-32">
                            <div className="flex flex-wrap gap-4">
                              <div><p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Abertura</p><p className={`font-black ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>{formatarDataSegura(caixa.data_abertura)}</p></div>
                              {caixa.data_fechamento && <div><p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Fechamento</p><p className={`font-black ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>{new Date(caixa.data_fechamento).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} às {new Date(caixa.data_fechamento).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}</p></div>}
                            </div>
                            <div className="sm:text-right">
                              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Status da Gaveta</p>
                              {isDiferenca ? <p className={`font-black uppercase tracking-wider ${diferenca > 0 ? 'text-green-500' : 'text-red-500'}`}>{diferenca > 0 ? `Sobrou R$ ${Math.abs(diferenca).toFixed(2)}` : `Faltou R$ ${Math.abs(diferenca).toFixed(2)}`}</p> : <p className="font-black text-blue-500 uppercase tracking-wider">Caixa Exato</p>}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                            <div className={`p-3 rounded-xl border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-gray-100/50 border-gray-200'}`}><p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Dinheiro</p><p className={`font-black ${temaNoturno ? 'text-white' : 'text-gray-800'}`}>R$ {(caixa.relatorio_fechamento?.informadoDinheiro || 0).toFixed(2)}</p></div>
                            <div className={`p-3 rounded-xl border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-gray-100/50 border-gray-200'}`}><p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Cartão</p><p className={`font-black ${temaNoturno ? 'text-white' : 'text-gray-800'}`}>R$ {(caixa.relatorio_fechamento?.informadoCartao || 0).toFixed(2)}</p></div>
                            <div className={`p-3 rounded-xl border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-gray-100/50 border-gray-200'}`}><p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Pix</p><p className={`font-black ${temaNoturno ? 'text-white' : 'text-gray-800'}`}>R$ {(caixa.relatorio_fechamento?.informadoPix || 0).toFixed(2)}</p></div>
                            <div className={`p-3 rounded-xl border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-gray-100/50 border-gray-200'}`}><p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Extra</p><p className="font-bold text-red-500 text-[10px]">San: R$ {(caixa.relatorio_fechamento?.sangrias || 0).toFixed(2)}</p><p className="font-bold text-green-500 text-[10px] mt-0.5">Sup: R$ {(caixa.relatorio_fechamento?.suprimentos || 0).toFixed(2)}</p></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
        </div>
      </div>

      {movModal.visivel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] animate-in fade-in duration-300">
          <div className={`rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col border animate-in zoom-in-95 duration-300 ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <h2 className={`text-xl font-black mb-4 uppercase tracking-wide ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>{movModal.tipo === 'sangria' ? 'Retirada de Dinheiro' : 'Entrada de Dinheiro'}</h2>
            <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest mb-1">Valor (R$)</label>
            <input type="number" step="0.01" className={`w-full p-3 rounded-xl border mb-4 outline-none font-bold text-lg transition-colors focus:border-purple-500 ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`} value={movModal.valor} onChange={e => setMovModal({...movModal, valor: e.target.value})} placeholder="0.00" autoFocus />
            <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest mb-1">Motivo</label>
            <input type="text" className={`w-full p-3 rounded-xl border mb-6 outline-none transition-colors focus:border-purple-500 ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`} value={movModal.descricao} onChange={e => setMovModal({...movModal, descricao: e.target.value})} />
            <div className="flex gap-3">
              <button onClick={() => setMovModal({ visivel: false, tipo: '', valor: '', descricao: '' })} className={`flex-1 p-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95 ${temaNoturno ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Cancelar</button>
              <button onClick={handleSalvarMovimentacao} className={`flex-1 p-3 rounded-xl font-bold uppercase tracking-widest text-[10px] text-white transition-all active:scale-95 ${movModal.tipo === 'sangria' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {senhaModal.visivel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] animate-in fade-in duration-300">
          <div className={`rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col border animate-in zoom-in-95 duration-300 ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <h2 className={`text-xl font-black mb-2 uppercase tracking-wide ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>Acesso Restrito</h2>
            <p className={`text-[10px] font-bold mb-4 uppercase tracking-widest ${temaNoturno ? 'text-gray-400' : 'text-gray-600'}`}>Ação permitida apenas para o dono. Digite sua senha.</p>
            <input type="password" autoFocus className={`w-full p-3 rounded-xl border mb-6 outline-none font-bold text-lg tracking-widest transition-colors focus:border-purple-500 ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`} value={senhaModal.senha} onChange={e => setSenhaModal({...senhaModal, senha: e.target.value})} placeholder="••••••" onKeyDown={e => e.key === 'Enter' && handleVerificarSenha()} />
            <div className="flex gap-3">
              <button onClick={() => setSenhaModal({ visivel: false, senha: '' })} className={`flex-1 p-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95 ${temaNoturno ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Voltar</button>
              <button onClick={handleVerificarSenha} className="flex-1 p-3 rounded-xl font-bold uppercase tracking-widest text-[10px] text-white bg-purple-600 hover:bg-purple-700 transition-all active:scale-95">Desbloquear</button>
            </div>
          </div>
        </div>
      )}

      {modalEdicao.visivel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] animate-in fade-in duration-300">
          <div className={`rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col border animate-in zoom-in-95 duration-300 ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <h2 className={`text-xl font-black mb-2 uppercase tracking-wide ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>Editar Apuração</h2>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${temaNoturno ? 'text-gray-400' : 'text-gray-600'}`}>Corrija os valores deste fechamento.</p>
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Dinheiro</label>
            <input type="number" className={`w-full p-2 rounded-xl border mb-3 outline-none font-bold transition-colors focus:border-blue-500 ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} value={modalEdicao.dinheiro} onChange={e => setModalEdicao({...modalEdicao, dinheiro: e.target.value})} />
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Cartão</label>
            <input type="number" className={`w-full p-2 rounded-xl border mb-3 outline-none font-bold transition-colors focus:border-blue-500 ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} value={modalEdicao.cartao} onChange={e => setModalEdicao({...modalEdicao, cartao: e.target.value})} />
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Pix</label>
            <input type="number" className={`w-full p-2 rounded-xl border mb-6 outline-none font-bold transition-colors focus:border-blue-500 ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} value={modalEdicao.pix} onChange={e => setModalEdicao({...modalEdicao, pix: e.target.value})} />
            <div className="flex gap-3">
              <button onClick={() => setModalEdicao({ visivel: false, dinheiro: '', cartao: '', pix: '' })} className={`flex-1 p-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95 ${temaNoturno ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Cancelar</button>
              <button onClick={salvarEdicaoFechamento} className="flex-1 p-3 rounded-xl font-bold uppercase tracking-widest text-[10px] text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg active:scale-95">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}