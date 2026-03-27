'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export default function TabFechamentoCaixa({ temaNoturno, sessao, caixaAtual, comandas, fetchData, mostrarAlerta, mostrarConfirmacao }) {
  const [abaInterna, setAbaInterna] = useState('atual'); 
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [bairros, setBairros] = useState([]);
  const [motoboyAtivo, setMotoboyAtivo] = useState(false);
  
  // Histórico e Filtro de Data
  const [historicoCaixas, setHistoricoCaixas] = useState([]);
  const [dataFiltro, setDataFiltro] = useState(new Date());
  
  const [valorInformadoDinheiro, setValorInformadoDinheiro] = useState('');
  const [valorInformadoCartao, setValorInformadoCartao] = useState('');
  const [valorInformadoPix, setValorInformadoPix] = useState('');

  const [movModal, setMovModal] = useState({ visivel: false, tipo: '', valor: '', descricao: '' });
  const [senhaModal, setSenhaModal] = useState({ visivel: false, senha: '' });
  
  const [mostrarEsperado, setMostrarEsperado] = useState(false);
  const [historicoLiberado, setHistoricoLiberado] = useState(false);
  
  const [acaoPendente, setAcaoPendente] = useState(null); 
  const [caixaEditando, setCaixaEditando] = useState(null);
  
  const [totalPagoMotoboysDia, setTotalPagoMotoboysDia] = useState(0);
  const [modalEdicao, setModalEdicao] = useState({ visivel: false, dinheiro: '', cartao: '', pix: '' });
  
  const [solicitouSenhaAuto, setSolicitouSenhaAuto] = useState(false);
  const [isConsolidating, setIsConsolidating] = useState(false);
  
  const parallaxRef = useRef(null);
  const isModalOpen = movModal.visivel || senhaModal.visivel || modalEdicao.visivel;

  const triggerPulse = (type = 'neutral') => {
    if (!parallaxRef.current) return;
    parallaxRef.current.setAttribute('data-pulse', type);
    setTimeout(() => {
      if (parallaxRef.current) parallaxRef.current.removeAttribute('data-pulse');
    }, 800);
  };

  useEffect(() => {
    let rafId = null;
    const handleMouseMove = (e) => {
      if (!parallaxRef.current || isModalOpen) return;
      
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const mx = (e.clientX / window.innerWidth) * 100;
        const my = (e.clientY / window.innerHeight) * 100;
        parallaxRef.current.style.setProperty('--mouse-x', `${mx}%`);
        parallaxRef.current.style.setProperty('--mouse-y', `${my}%`);
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isModalOpen]);

  const formatarDataSegura = (isoString) => {
    if (!isoString) return '---';
    return new Date(isoString).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
  };
  
  const formatarHora = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
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
    if (sessao?.empresa_id && caixaAtual?.id) {
      carregarDadosCaixaAtual();
    }
  }, [sessao?.empresa_id, caixaAtual?.id]);

  useEffect(() => {
    if (sessao?.empresa_id) {
      carregarHistorico();
    }
  }, [sessao?.empresa_id, dataFiltro, abaInterna]);

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
    const start = new Date(dataFiltro);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dataFiltro);
    end.setHours(23, 59, 59, 999);

    const { data: histData } = await supabase.from('caixas')
      .select('*')
      .eq('empresa_id', sessao.empresa_id)
      .in('status', ['fechado', 'estornado'])
      .gte('data_abertura', start.toISOString())
      .lte('data_abertura', end.toISOString())
      .order('data_fechamento', { ascending: false });
      
    if (histData) setHistoricoCaixas(histData);
  };

  const isHoje = new Date().setHours(0,0,0,0) === new Date(dataFiltro).setHours(0,0,0,0);
  
  const alterarData = (dias) => {
    const novaData = new Date(dataFiltro);
    novaData.setDate(novaData.getDate() + dias);
    if (novaData > new Date()) return;
    setDataFiltro(novaData);
  };

  const renderDataLabel = () => {
    if (isHoje) return 'Hoje';
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    if (ontem.setHours(0,0,0,0) === new Date(dataFiltro).setHours(0,0,0,0)) return 'Ontem';
    return dataFiltro.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace(' de ', ' ');
  };

  const toggleMotoboy = async () => {
    const novoStatus = !motoboyAtivo;
    await supabase.from('empresas').update({ motoboy_ativo: novoStatus }).eq('id', sessao.empresa_id);
    setMotoboyAtivo(novoStatus);
  };

  const handleSalvarMovimentacao = async () => {
    const val = parseFloat(movModal.valor.replace(',', '.'));
    if (isNaN(val) || val <= 0) return mostrarAlerta("Valor Inválido", "Informe um valor numérico válido e superior a zero.");
    if (!movModal.descricao.trim()) return mostrarAlerta("Campo Obrigatório", "A justificativa é obrigatória para a trilha de auditoria.");

    const payload = { caixa_id: caixaAtual.id, empresa_id: sessao.empresa_id, tipo: movModal.tipo, valor: val, descricao: movModal.descricao };
    const { data, error } = await supabase.from('caixa_movimentacoes').insert([payload]).select();
    if (data && data.length > 0 && !error) {
      triggerPulse('success');
      setMovimentacoes(prev => [...prev, ...data]);
      setMovModal({ visivel: false, tipo: '', valor: '', descricao: '' });
    } else {
      mostrarAlerta("Erro", "A transação não pôde ser registrada.");
    }
  };

  const excluirCaixaConfirmado = async () => {
    triggerPulse('neutral');
    const { error } = await supabase.from('caixas').update({ status: 'estornado', data_fechamento: new Date().toISOString() }).eq('id', caixaEditando.id).eq('empresa_id', sessao.empresa_id);
    if (!error) { 
      mostrarAlerta("Auditoria Concluída", "O fechamento foi estornado logicamente."); 
      carregarHistorico(); 
    } else { 
      mostrarAlerta("Erro de Permissão", "Você não tem acesso para realizar esta operação."); 
    }
  };

  const handleVerificarSenha = async () => {
    if (!senhaModal.senha) return;
    try {
      const { data: autorizado, error } = await supabase.rpc('verificar_credencial_critica', { p_empresa_id: sessao.empresa_id, p_senha: senhaModal.senha });
      
      if (error) throw error;

      if (autorizado) {
        setSenhaModal({ visivel: false, senha: '' });
        triggerPulse('success');
        
        if (acaoPendente === 'revelar') setMostrarEsperado(true);
        if (acaoPendente === 'historico') { setHistoricoLiberado(true); setAbaInterna('historico'); }
        if (acaoPendente === 'editar_fechamento') {
          const rel = caixaEditando?.relatorio_fechamento || {};
          setModalEdicao({ visivel: true, dinheiro: rel.informadoDinheiro || '', cartao: rel.informadoCartao || '', pix: rel.informadoPix || '' });
        }
        if (acaoPendente === 'excluir_fechamento') {
          mostrarConfirmacao('Estornar Fechamento', 'Esta ação invalidará o fechamento original e criará um registro de auditoria. Deseja prosseguir?', excluirCaixaConfirmado);
        }
      } else { 
        mostrarAlerta("Autorização Negada", "Credenciais de auditoria inválidas ou revogadas."); 
      }
    } catch(err) { 
      mostrarAlerta("Erro de Conexão", "Não foi possível validar a senha no momento."); 
      setSenhaModal({ visivel: false, senha: '' });
    }
  };

  const calcularPendenteMotoboy = () => {
    if (!comandas || comandas.length === 0) return 0;
    const dataCaixa = caixaAtual?.data_abertura?.substring(0, 10);
    const totalTaxas = comandas.filter(c => c.status === 'fechada' && (c.pagamentos?.some(p => p.data?.substring(0, 10) === dataCaixa) || c.data?.substring(0, 10) === dataCaixa)).reduce((acc, c) => {
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
    const payload = { caixa_id: caixaAtual.id, empresa_id: sessao.empresa_id, tipo: 'sangria', valor: pendenteMotoboy, descricao: 'Liquidação Logística Integrada' };
    const { data, error } = await supabase.from('caixa_movimentacoes').insert([payload]).select();
    if (data && !error) { 
      triggerPulse('success');
      setMovimentacoes(prev => [...prev, ...data]); 
      setTotalPagoMotoboysDia(prev => prev + pendenteMotoboy); 
    }
  };

  const abrirConfirmacaoMotoboy = () => mostrarConfirmacao('Autorização de Repasse', `Confirma a liquidação logística no valor de R$ ${pendenteMotoboy.toFixed(2)} aos parceiros?`, pagarMotoboysConfirmado);

  const pagamentosDoTurno = comandas.filter(c => c.status === 'fechada').flatMap(c => c.pagamentos || []).filter(p => p.data?.substring(0, 10) === caixaAtual?.data_abertura?.substring(0, 10));
  const totalSistemaDinheiro = pagamentosDoTurno.filter(p => p.forma === 'Dinheiro').reduce((acc, p) => acc + parseFloat(p.valor), 0);
  const totalSistemaCartao = pagamentosDoTurno.filter(p => p.forma === 'Cartão').reduce((acc, p) => acc + parseFloat(p.valor), 0);
  const totalSistemaPix = pagamentosDoTurno.filter(p => p.forma === 'Pix').reduce((acc, p) => acc + parseFloat(p.valor), 0);
  const totalSuprimentos = movimentacoes.filter(m => m.tipo === 'suprimento').reduce((acc, m) => acc + parseFloat(m.valor), 0);
  const totalSangrias = movimentacoes.filter(m => m.tipo === 'sangria').reduce((acc, m) => acc + parseFloat(m.valor), 0);
  const saldoInicial = parseFloat(caixaAtual?.saldo_inicial || 0);
  const saldoGavetaEsperado = saldoInicial + totalSistemaDinheiro + totalSuprimentos - totalSangrias;

  const encerrarCaixaConfirmado = async () => {
    setIsConsolidating(true);
    triggerPulse('success');

    const diferencaDinheiro = parseFloat(valorInformadoDinheiro || 0) - saldoGavetaEsperado;
    const relatorioFinal = {
      informadoDinheiro: parseFloat(valorInformadoDinheiro || 0), 
      informadoCartao: parseFloat(valorInformadoCartao || 0), 
      informadoPix: parseFloat(valorInformadoPix || 0), 
      esperadoDinheiro: saldoGavetaEsperado, 
      esperadoCartao: totalSistemaCartao, 
      esperadoPix: totalSistemaPix, 
      diferencaDinheiro: diferencaDinheiro, 
      suprimentos: totalSuprimentos, 
      sangrias: totalSangrias
    };
    
    const { error } = await supabase.from('caixas').update({ status: 'fechado', data_fechamento: new Date().toISOString(), relatorio_fechamento: relatorioFinal }).eq('id', caixaAtual.id).eq('empresa_id', sessao.empresa_id);
    if (error) { 
      setIsConsolidating(false); 
      return mostrarAlerta("Erro de Consistência", error.message); 
    }
    
    setIsConsolidating(false);
    mostrarAlerta("Turno Consolidado", "A escrituração foi processada com sucesso no diário geral.");
    setValorInformadoDinheiro(''); setValorInformadoCartao(''); setValorInformadoPix('');
    setMostrarEsperado(false); setHistoricoLiberado(false); setSolicitouSenhaAuto(true);
    
    setAcaoPendente('historico'); setSenhaModal({ visivel: true, senha: '' });
    fetchData(); 
  };

  const salvarEdicaoFechamento = async () => {
    const valDinheiro = parseFloat(modalEdicao.dinheiro || 0); const valCartao = parseFloat(modalEdicao.cartao || 0); const valPix = parseFloat(modalEdicao.pix || 0);
    const novoRelatorio = { ...caixaEditando.relatorio_fechamento, informadoDinheiro: valDinheiro, informadoCartao: valCartao, informadoPix: valPix, diferencaDinheiro: valDinheiro - (caixaEditando.relatorio_fechamento.esperadoDinheiro || 0) };
    const { error } = await supabase.from('caixas').update({ relatorio_fechamento: novoRelatorio }).eq('id', caixaEditando.id).eq('empresa_id', sessao.empresa_id);
    if (!error) { 
       triggerPulse('success');
       setModalEdicao({ visivel: false, dinheiro: '', cartao: '', pix: '' }); 
       carregarHistorico(); 
    }
  };

  const inputWrapperStyle = `relative flex items-center bg-transparent rounded-xl border transition-colors duration-300 overflow-hidden 
    ${temaNoturno ? 'border-white/[0.08] focus-within:border-white/20 hover:border-white/15 bg-black/20' : 'border-black/10 focus-within:border-black/30 hover:border-black/20 bg-white/50'}`;

  const inputStyle = `w-full bg-transparent outline-none py-3 pr-4 pl-12 text-[15px] font-medium tracking-tight transition-all duration-300 placeholder-opacity-20 
    ${temaNoturno ? 'text-white placeholder-white' : 'text-black placeholder-black'}`;

  const labelStyle = `text-[13px] font-medium tracking-wide mb-2 block ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`;

  const cardBaseStyle = `relative p-7 md:p-8 rounded-[24px] border transition-colors duration-500 overflow-hidden group w-full
    ${temaNoturno ? 'bg-[#09090B]/80 backdrop-blur-xl border-white/[0.05] shadow-lg' : 'bg-white/80 backdrop-blur-xl border-black/[0.04] shadow-sm'}`;

  return (
    <div ref={parallaxRef} className={`w-full min-h-screen relative font-sans pt-8 pb-20 overflow-hidden ${temaNoturno ? 'text-[#EDEDED]' : 'text-[#111111]'}`}>
      
      {/* PREMIUM LIGHTWEIGHT BACKGROUND ENGINE (Degradê Restaurado) */}
      <div className="fixed inset-0 z-[-1] pointer-events-none transition-all duration-1000 data-[pulse=neutral]:scale-[1.01] data-[pulse=success]:scale-[1.02] data-[pulse=success]:brightness-110">
        {temaNoturno ? (
          <div className="absolute inset-0 bg-zinc-950 transition-colors duration-700">
             <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] bg-indigo-900/10 mix-blend-screen transition-colors duration-1000" />
             <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[140px] bg-orange-900/5 mix-blend-screen transition-colors duration-1000" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-zinc-50 transition-colors duration-700">
             <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] bg-blue-500/5 mix-blend-multiply transition-colors duration-1000" />
             <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[140px] bg-orange-500/5 mix-blend-multiply transition-colors duration-1000" />
          </div>
        )}
      </div>

      <div className={`relative z-10 flex flex-col lg:flex-row gap-8 w-full max-w-full mx-auto px-6 lg:px-8 transition-all duration-400 ease-[cubic-bezier(0.25,1,0.5,1)] ${isModalOpen || isConsolidating ? 'scale-[0.99] opacity-70 blur-[4px]' : 'scale-100 opacity-100 blur-0'}`}>
        
        <nav className="shrink-0 lg:w-56 flex flex-col gap-2">
          <div className={`p-1.5 rounded-[16px] flex lg:flex-col gap-1 backdrop-blur-xl border transition-colors duration-300 ${temaNoturno ? 'bg-white/[0.02] border-white/[0.04]' : 'bg-black/[0.02] border-black/[0.04]'}`}>
            <button 
              onClick={() => setAbaInterna('atual')} 
              className={`w-full text-left px-4 py-3 rounded-xl text-[14px] font-medium transition-all duration-200 ease-out active:scale-[0.98] ${abaInterna === 'atual' ? (temaNoturno ? 'bg-white/[0.08] text-white shadow-sm ring-1 ring-white/[0.05]' : 'bg-white text-zinc-900 shadow-sm ring-1 ring-black/[0.05]') : (temaNoturno ? 'text-zinc-400 hover:text-white hover:bg-white/[0.03]' : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/[0.03]')}`}
            >
              Caixa Operacional
            </button>
            <button 
              onClick={() => { if (historicoLiberado) setAbaInterna('historico'); else { setAcaoPendente('historico'); setSenhaModal({ visivel: true, senha: '' }); } }} 
              className={`w-full text-left px-4 py-3 rounded-xl text-[14px] font-medium transition-all duration-200 ease-out active:scale-[0.98] ${abaInterna === 'historico' ? (temaNoturno ? 'bg-white/[0.08] text-white shadow-sm ring-1 ring-white/[0.05]' : 'bg-white text-zinc-900 shadow-sm ring-1 ring-black/[0.05]') : (temaNoturno ? 'text-zinc-400 hover:text-white hover:bg-white/[0.03]' : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/[0.03]')}`}
            >
              Trilha de Auditoria
            </button>
          </div>
        </nav>

        {/* TRANSIÇÃO BI-DIRECIONAL */}
        <main className="flex-1 min-w-0 grid grid-cols-1 grid-rows-1 relative w-full">
            
            {/* --- ABA: CAIXA OPERACIONAL --- */}
            <div className={`col-start-1 row-start-1 transition-all duration-400 ease-[cubic-bezier(0.25,1,0.5,1)] ${abaInterna === 'atual' ? 'opacity-100 translate-y-0 scale-100 z-10 pointer-events-auto relative' : 'opacity-0 translate-y-3 scale-[0.99] z-0 pointer-events-none absolute inset-0'}`}>
              {caixaAtual?.status === 'aberto' ? (
                <div className="flex flex-col gap-8 w-full">
                  
                  <div className="flex justify-end gap-3 mb-2 w-full">
                    <button onClick={() => { triggerPulse('neutral'); setMovModal({ visivel: true, tipo: 'suprimento', valor: '', descricao: '' }); }} 
                      className={`px-5 py-2.5 rounded-xl text-[13px] font-semibold tracking-wide transition-all duration-200 active:scale-[0.97] shadow-sm flex items-center gap-2 border ${temaNoturno ? 'bg-zinc-100 text-black border-transparent hover:bg-white' : 'bg-zinc-900 text-white border-transparent hover:bg-black'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                      Entrada Extra
                    </button>
                    <button onClick={() => { triggerPulse('neutral'); setMovModal({ visivel: true, tipo: 'sangria', valor: '', descricao: '' }); }} 
                      className={`px-5 py-2.5 rounded-xl text-[13px] font-semibold tracking-wide transition-all duration-200 active:scale-[0.97] shadow-sm flex items-center gap-2 border ${temaNoturno ? 'bg-[#18181B] text-white border-white/10 hover:bg-zinc-800' : 'bg-white text-zinc-900 border-black/10 hover:bg-zinc-50'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4"></path></svg>
                      Retirada (Sangria)
                    </button>
                  </div>

                  <section className={cardBaseStyle}>
                    <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out z-0" style={{ background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${temaNoturno ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}, transparent 40%)` }} />
                    <div className="relative z-10">
                      <div className="mb-8 border-b border-transparent">
                        <h2 className="text-[17px] font-semibold tracking-tight mb-1">Valores Informados</h2>
                        <p className={`text-[13px] ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Informe os valores contados fisicamente no fechamento.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className={labelStyle}>Dinheiro em Espécie</label>
                          <div className={inputWrapperStyle}>
                            <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-medium z-10 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>R$</span>
                            <input type="number" value={valorInformadoDinheiro} onChange={(e) => setValorInformadoDinheiro(e.target.value)} className={`${inputStyle} relative z-10`} placeholder="0,00" />
                          </div>
                        </div>
                        <div>
                          <label className={labelStyle}>Maquininhas (Cartão)</label>
                          <div className={inputWrapperStyle}>
                            <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-medium z-10 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>R$</span>
                            <input type="number" value={valorInformadoCartao} onChange={(e) => setValorInformadoCartao(e.target.value)} className={`${inputStyle} relative z-10`} placeholder="0,00" />
                          </div>
                        </div>
                        <div>
                          <label className={labelStyle}>Recebimentos via Pix</label>
                          <div className={inputWrapperStyle}>
                            <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-medium z-10 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>R$</span>
                            <input type="number" value={valorInformadoPix} onChange={(e) => setValorInformadoPix(e.target.value)} className={`${inputStyle} relative z-10`} placeholder="0,00" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className={cardBaseStyle}>
                    <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out z-0" style={{ background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${temaNoturno ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}, transparent 40%)` }} />
                    <div className="relative z-10">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h2 className="text-[17px] font-semibold tracking-tight mb-1">Apuração do Sistema</h2>
                          <p className={`text-[13px] ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Totais registrados automaticamente pelas vendas e operações.</p>
                        </div>
                        <button onClick={() => { triggerPulse('neutral'); if(mostrarEsperado) setMostrarEsperado(false); else { setAcaoPendente('revelar'); setSenhaModal({ visivel: true, senha: '' }); } }} 
                          className={`px-4 py-2 rounded-xl text-[12px] font-semibold transition-all duration-200 active:scale-[0.97] border shadow-sm ${temaNoturno ? 'bg-zinc-800 border-white/10 hover:bg-zinc-700 text-zinc-300 hover:text-white' : 'bg-white border-black/10 hover:bg-zinc-50 text-zinc-700 hover:text-black'}`}>
                          {mostrarEsperado ? 'Ocultar Valores' : 'Desbloquear Visualização'}
                        </button>
                      </div>
                      
                      <div className={`grid transition-all duration-400 ease-[cubic-bezier(0.25,1,0.5,1)] ${mostrarEsperado ? 'grid-rows-[1fr] opacity-100 mt-8 pt-8 border-t' : 'grid-rows-[0fr] opacity-0 mt-0 pt-0 border-t-0 pointer-events-none'} ${temaNoturno ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
                        <div className="overflow-hidden">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6">
                            <div className="col-span-2 md:col-span-4 mb-2">
                              <p className={labelStyle}>Saldo Esperado em Gaveta</p>
                              <p className={`text-[36px] font-medium tracking-tight leading-none font-mono ${temaNoturno ? 'text-white' : 'text-black'}`}>R$ {saldoGavetaEsperado.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className={labelStyle}>Fundo Inicial</p>
                              <p className={`text-[15px] font-medium tracking-tight font-mono ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>R$ {saldoInicial.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className={labelStyle}>Vendas em Dinheiro</p>
                              <p className="text-[15px] font-medium tracking-tight font-mono text-[#34C759]">+ R$ {totalSistemaDinheiro.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className={labelStyle}>Entradas Extras</p>
                              <p className="text-[15px] font-medium tracking-tight font-mono text-[#34C759]">+ R$ {totalSuprimentos.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className={labelStyle}>Sangrias / Acertos</p>
                              <p className="text-[15px] font-medium tracking-tight font-mono text-[#FF3B30]">- R$ {totalSangrias.toFixed(2)}</p>
                            </div>
                            <div className="col-span-2 pt-2 border-t border-transparent sm:border-t-0">
                              <p className={labelStyle}>Total Maquininhas</p>
                              <p className={`text-[17px] font-medium tracking-tight font-mono ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>R$ {totalSistemaCartao.toFixed(2)}</p>
                            </div>
                            <div className="col-span-2 pt-2 border-t border-transparent sm:border-t-0">
                              <p className={labelStyle}>Total Pix</p>
                              <p className={`text-[17px] font-medium tracking-tight font-mono ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>R$ {totalSistemaPix.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className={cardBaseStyle}>
                    <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out z-0" style={{ background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${temaNoturno ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}, transparent 40%)` }} />
                    <div className="relative z-10">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                        <div className="flex-1">
                          <h3 className="text-[17px] font-semibold tracking-tight mb-1">Acerto de Motoboys</h3>
                          <p className={`text-[13px] ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Controle automático de taxas de entrega pendentes.</p>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className={`text-[13px] font-medium ${motoboyAtivo ? (temaNoturno ? 'text-zinc-300' : 'text-zinc-700') : (temaNoturno ? 'text-zinc-500' : 'text-zinc-400')}`}>Motoboy Ativo</span>
                           <button onClick={() => { triggerPulse('neutral'); toggleMotoboy(); }} className={`w-11 h-6 rounded-full relative transition-colors duration-300 shrink-0 shadow-inner border ${motoboyAtivo ? (temaNoturno ? 'bg-zinc-200 border-transparent' : 'bg-zinc-900 border-transparent') : (temaNoturno ? 'bg-transparent border-white/20' : 'bg-transparent border-black/20')}`}>
                              <span className={`absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${temaNoturno ? (motoboyAtivo ? 'bg-zinc-900' : 'bg-zinc-400') : (motoboyAtivo ? 'bg-white' : 'bg-zinc-400')} ${motoboyAtivo ? 'translate-x-5' : 'translate-x-0'}`} />
                           </button>
                        </div>
                      </div>

                      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 rounded-[16px] transition-all duration-300 border ${motoboyAtivo ? (temaNoturno ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-black/[0.02] border-black/[0.05]') : (temaNoturno ? 'bg-transparent border-white/[0.05] opacity-50' : 'bg-transparent border-black/[0.05] opacity-50')} ${motoboyAtivo ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                         <div className="mb-4 sm:mb-0">
                            <p className={labelStyle}>Valor Pendente Hoje</p>
                            <p className={`text-[26px] font-medium tracking-tight font-mono ${temaNoturno ? 'text-white' : 'text-black'}`}>
                               R$ {pendenteMotoboy.toFixed(2)}
                            </p>
                         </div>
                         <button onClick={() => { triggerPulse('neutral'); abrirConfirmacaoMotoboy(); }} disabled={!motoboyAtivo || pendenteMotoboy <= 0} className={`w-full sm:w-auto px-6 py-3 rounded-xl text-[13px] font-semibold transition-all duration-200 active:scale-[0.97] border shadow-sm disabled:opacity-50 disabled:active:scale-100 ${temaNoturno ? 'bg-zinc-800 border-white/10 text-white hover:bg-zinc-700' : 'bg-white border-black/10 text-zinc-900 hover:bg-zinc-50'}`}>
                            Autorizar Pagamento
                         </button>
                      </div>
                    </div>
                  </section>

                  <div className="pt-2 pb-12 w-full">
                    <button onClick={() => mostrarConfirmacao('Fechar Caixa', 'Confirma o encerramento da sessão atual? O caixa passará a constar no histórico.', encerrarCaixaConfirmado)} 
                      disabled={isConsolidating}
                      className={`relative w-full py-4 rounded-[16px] text-[15px] font-semibold tracking-wide transition-all duration-200 active:scale-[0.98] shadow-md border disabled:opacity-80 disabled:active:scale-100 flex justify-center items-center gap-3 ${temaNoturno ? 'bg-zinc-100 text-black border-transparent hover:bg-white' : 'bg-zinc-900 text-white border-transparent hover:bg-black'}`}>
                      {isConsolidating ? (
                         <>
                           <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                           Fechando e Consolidando...
                         </>
                      ) : 'Confirmar e Fechar Caixa'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[50vh] w-full">
                  <div className="text-center">
                    <div className={`w-14 h-14 mx-auto mb-5 rounded-[16px] flex items-center justify-center border ${temaNoturno ? 'bg-white/[0.03] border-white/[0.08] text-zinc-500' : 'bg-black/[0.02] border-black/[0.05] text-zinc-400'}`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    </div>
                    <p className={`text-[15px] font-medium tracking-tight mb-1 ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>Caixa Fechado</p>
                    <p className={`text-[13px] ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Nenhuma sessão operacional aberta no momento.</p>
                  </div>
                </div>
              )}
            </div>

            {/* --- ABA: TRILHA DE AUDITORIA --- */}
            <div className={`col-start-1 row-start-1 transition-all duration-400 ease-[cubic-bezier(0.25,1,0.5,1)] w-full ${abaInterna === 'historico' ? 'opacity-100 translate-y-0 scale-100 z-10 pointer-events-auto relative' : 'opacity-0 translate-y-3 scale-[0.99] z-0 pointer-events-none absolute inset-0'}`}>
                
                {/* Header do Histórico com Navegação Premium de Data */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b pb-6 border-transparent">
                  <div>
                    <h2 className="text-[18px] font-semibold tracking-tight mb-1">Trilha de Auditoria</h2>
                    <p className={`text-[13px] ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Histórico financeiro e retificações.</p>
                  </div>
                  
                  <div className={`flex items-center p-1.5 rounded-xl border ${temaNoturno ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-black/[0.02] border-black/[0.06]'}`}>
                     <button onClick={() => alterarData(-1)} className={`p-2 rounded-lg transition-colors ${temaNoturno ? 'hover:bg-white/[0.08] text-zinc-400 hover:text-white' : 'hover:bg-black/[0.05] text-zinc-500 hover:text-black'}`}>
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                     </button>
                     <span className={`min-w-[120px] text-center text-[13px] font-semibold tracking-wide ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>
                       {renderDataLabel()}
                     </span>
                     <button onClick={() => alterarData(1)} disabled={isHoje} className={`p-2 rounded-lg transition-colors disabled:opacity-20 disabled:hover:bg-transparent ${temaNoturno ? 'hover:bg-white/[0.08] text-zinc-400 hover:text-white' : 'hover:bg-black/[0.05] text-zinc-500 hover:text-black'}`}>
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                     </button>
                  </div>
                </div>

                {historicoCaixas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[30vh] text-center border-t border-dashed pt-10 mt-2 opacity-60 w-full" style={{ borderColor: temaNoturno ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                    <p className={`text-[14px] font-medium ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Nenhum fechamento registrado nesta data.</p>
                  </div>
                ) : (
                  <div className="relative pt-2 pb-12 w-full">
                    <div className={`absolute top-6 bottom-12 left-[18px] md:left-[26px] w-[2px] rounded-full ${temaNoturno ? 'bg-white/[0.06]' : 'bg-black/[0.06]'}`} />

                    <div className="flex flex-col gap-6 relative z-10 w-full">
                      {historicoCaixas.map((caixa) => {
                        const isEstornado = caixa.status === 'estornado';
                        const isDiferenca = caixa.relatorio_fechamento?.diferencaDinheiro !== 0;
                        const diferenca = caixa.relatorio_fechamento?.diferencaDinheiro || 0;
                        
                        let corMarcador = temaNoturno ? 'bg-zinc-400 ring-white/[0.05]' : 'bg-zinc-500 ring-black/[0.05]';
                        if (isEstornado) corMarcador = 'bg-rose-500 ring-rose-500/20';
                        else if (isDiferenca) corMarcador = diferenca > 0 ? 'bg-emerald-500 ring-emerald-500/20' : 'bg-amber-500 ring-amber-500/20';

                        return (
                          <div key={caixa.id} className="relative pl-12 md:pl-16 group w-full">
                            
                            <div className={`absolute left-[13.5px] md:left-[21.5px] top-7 w-2.5 h-2.5 rounded-full ring-4 shadow-sm transition-transform duration-300 group-hover:scale-125 ${corMarcador}`} />

                            <div className={`relative p-6 md:p-8 rounded-[20px] transition-all duration-300 border shadow-sm hover:shadow-md overflow-hidden ${isEstornado ? (temaNoturno ? 'bg-rose-950/5 border-rose-500/10 opacity-70 grayscale-[50%]' : 'bg-rose-50/50 border-rose-200/50 opacity-70 grayscale-[50%]') : cardBaseStyle.replace('shadow-sm', '').replace('shadow-lg', '')}`}>
                              
                              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out z-0" style={{ background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${temaNoturno ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}, transparent 40%)` }} />

                              <div className="relative z-10 flex flex-col gap-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-transparent">
                                  <div>
                                     <div className="flex items-center gap-3 mb-1.5">
                                       <h3 className={`text-[15px] font-semibold tracking-tight ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>
                                          {isEstornado ? 'Caixa Estornado' : 'Fechamento de Caixa'}
                                       </h3>
                                       {isEstornado ? (
                                         <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${temaNoturno ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600'}`}>Anulado</span>
                                       ) : isDiferenca ? (
                                         <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${diferenca > 0 ? (temaNoturno ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (temaNoturno ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600')}`}>
                                           {diferenca > 0 ? 'Sobra de Dinheiro' : 'Falta de Dinheiro'}
                                         </span>
                                       ) : (
                                         <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${temaNoturno ? 'bg-white/10 text-zinc-300' : 'bg-black/5 text-zinc-600'}`}>Conciliado</span>
                                       )}
                                     </div>
                                     <p className={`text-[12.5px] flex items-center gap-2 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>
                                       <span>Aberto às {formatarHora(caixa.data_abertura)}</span>
                                       <span className="w-1 h-1 rounded-full bg-current opacity-30" />
                                       <span>Fechado às {formatarHora(caixa.data_fechamento)}</span>
                                     </p>
                                  </div>

                                  {!isEstornado && (
                                    <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                                      <button onClick={() => { triggerPulse('neutral'); setCaixaEditando(caixa); setAcaoPendente('editar_fechamento'); setSenhaModal({ visivel: true, senha: '' }); }} className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors border shadow-sm ${temaNoturno ? 'bg-zinc-800 border-white/10 text-zinc-300 hover:text-white hover:bg-zinc-700' : 'bg-white border-black/10 text-zinc-600 hover:text-black hover:bg-zinc-50'}`}>Editar Fechamento</button>
                                      <button onClick={() => { triggerPulse('neutral'); setCaixaEditando(caixa); setAcaoPendente('excluir_fechamento'); setSenhaModal({ visivel: true, senha: '' }); }} className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors border shadow-sm ${temaNoturno ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20' : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'}`}>Estornar Fechamento</button>
                                    </div>
                                  )}
                                </div>

                                <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 ${isEstornado ? 'opacity-50' : ''}`}>
                                   <div>
                                      <p className={labelStyle}>Dinheiro Informado</p>
                                      <p className={`text-[14px] font-medium tracking-tight font-mono ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>R$ {(caixa.relatorio_fechamento?.informadoDinheiro || 0).toFixed(2)}</p>
                                   </div>
                                   <div>
                                      <p className={labelStyle}>Total Digital</p>
                                      <p className={`text-[14px] font-medium tracking-tight font-mono ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>R$ {((caixa.relatorio_fechamento?.informadoCartao || 0) + (caixa.relatorio_fechamento?.informadoPix || 0)).toFixed(2)}</p>
                                   </div>
                                   <div className="col-span-2 sm:text-right">
                                      {isDiferenca && !isEstornado && (
                                         <>
                                           <p className={labelStyle}>Diferença (Dinheiro)</p>
                                           <p className={`text-[15px] font-medium tracking-tight font-mono ${diferenca > 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                                              {diferenca > 0 ? '+' : '-'} R$ {Math.abs(diferenca).toFixed(2)}
                                           </p>
                                         </>
                                      )}
                                   </div>
                                </div>

                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>
        </main>
      </div>

      {movModal.visivel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" onClick={() => setMovModal({ visivel: false, tipo: '', valor: '', descricao: '' })} />
          <div className={`relative w-full max-w-[420px] p-8 md:p-10 rounded-[24px] shadow-2xl animate-in zoom-in-[0.98] fade-in duration-200 ${temaNoturno ? 'bg-[#0A0A0C] border border-white/[0.08]' : 'bg-white border border-black/[0.05]'}`}>
            <h2 className="text-[18px] font-semibold tracking-tight mb-8">{movModal.tipo === 'sangria' ? 'Retirada (Sangria)' : 'Entrada Extra'}</h2>
            
            <div className="space-y-5 mb-8">
              <div>
                <label className={labelStyle}>Valor</label>
                <div className={inputWrapperStyle}>
                   <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>R$</span>
                   <input type="number" step="0.01" value={movModal.valor} onChange={e => setMovModal({...movModal, valor: e.target.value})} autoFocus className={inputStyle} placeholder="0,00" />
                </div>
              </div>
              <div>
                <label className={labelStyle}>Motivo / Justificativa</label>
                <div className={inputWrapperStyle}>
                   <input type="text" value={movModal.descricao} onChange={e => setMovModal({...movModal, descricao: e.target.value})} className={`${inputStyle} !pl-4`} placeholder="Obrigatório para o histórico" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setMovModal({ visivel: false, tipo: '', valor: '', descricao: '' })} className={`px-5 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${temaNoturno ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Cancelar</button>
              <button onClick={handleSalvarMovimentacao} className={`px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all active:scale-[0.97] shadow-sm border ${temaNoturno ? 'bg-zinc-100 text-black border-transparent hover:bg-white' : 'bg-zinc-900 text-white border-transparent hover:bg-black'}`}>Confirmar Registro</button>
            </div>
          </div>
        </div>
      )}

      {senhaModal.visivel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" onClick={() => setSenhaModal({ visivel: false, senha: '' })} />
          <div className={`relative w-full max-w-[420px] p-8 md:p-10 rounded-[24px] shadow-2xl animate-in zoom-in-[0.98] fade-in duration-200 ${temaNoturno ? 'bg-[#0A0A0C] border border-white/[0.08]' : 'bg-white border border-black/[0.05]'}`}>
            <h2 className="text-[18px] font-semibold tracking-tight mb-2">Autorização Gerencial</h2>
            <p className={`text-[13px] mb-8 ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Senha de administrador exigida para confirmar operação.</p>
            
            <div className="mb-8">
              <div className={inputWrapperStyle}>
                <input type="password" value={senhaModal.senha} onChange={e => setSenhaModal({...senhaModal, senha: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleVerificarSenha()} autoFocus className={`${inputStyle} !pl-4 tracking-[0.5em] font-bold text-center`} placeholder="••••••" />
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button onClick={() => setSenhaModal({ visivel: false, senha: '' })} className={`px-5 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${temaNoturno ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Cancelar</button>
              <button onClick={handleVerificarSenha} className={`px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all active:scale-[0.97] shadow-sm border ${temaNoturno ? 'bg-zinc-100 text-black border-transparent hover:bg-white' : 'bg-zinc-900 text-white border-transparent hover:bg-black'}`}>Autenticar</button>
            </div>
          </div>
        </div>
      )}

      {modalEdicao.visivel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" onClick={() => setModalEdicao({ visivel: false, dinheiro: '', cartao: '', pix: '' })} />
          <div className={`relative w-full max-w-[420px] p-8 md:p-10 rounded-[24px] shadow-2xl animate-in zoom-in-[0.98] fade-in duration-200 ${temaNoturno ? 'bg-[#0A0A0C] border border-white/[0.08]' : 'bg-white border border-black/[0.05]'}`}>
            <h2 className="text-[18px] font-semibold tracking-tight mb-2">Editar Valores de Fechamento</h2>
            <p className={`text-[13px] mb-8 ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Corrija a declaração física de um turno já encerrado.</p>
            
            <div className="space-y-5 mb-8">
              <div>
                <label className={labelStyle}>Dinheiro em Espécie</label>
                <div className={inputWrapperStyle}>
                   <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>R$</span>
                   <input type="number" value={modalEdicao.dinheiro} onChange={e => setModalEdicao({...modalEdicao, dinheiro: e.target.value})} className={inputStyle} />
                </div>
              </div>
              <div>
                <label className={labelStyle}>Maquininhas (Cartão)</label>
                <div className={inputWrapperStyle}>
                   <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>R$</span>
                   <input type="number" value={modalEdicao.cartao} onChange={e => setModalEdicao({...modalEdicao, cartao: e.target.value})} className={inputStyle} />
                </div>
              </div>
              <div>
                <label className={labelStyle}>Recebimentos via Pix</label>
                <div className={inputWrapperStyle}>
                   <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>R$</span>
                   <input type="number" value={modalEdicao.pix} onChange={e => setModalEdicao({...modalEdicao, pix: e.target.value})} className={inputStyle} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setModalEdicao({ visivel: false, dinheiro: '', cartao: '', pix: '' })} className={`px-5 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${temaNoturno ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Cancelar</button>
              <button onClick={salvarEdicaoFechamento} className={`px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all active:scale-[0.97] shadow-sm border ${temaNoturno ? 'bg-zinc-100 text-black border-transparent hover:bg-white' : 'bg-zinc-900 text-white border-transparent hover:bg-black'}`}>Salvar Edição</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}