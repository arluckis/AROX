'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// HELPER: Garante precisão decimal exata (evita bugs de 0.3000000004 do JavaScript)
const arredondar = (valor) => Math.round((parseFloat(String(valor).replace(',', '.')) || 0) * 100) / 100;

export default function TabFechamentoCaixa({ temaNoturno, sessao, caixaAtual, comandas, fetchData, mostrarAlerta, mostrarConfirmacao }) {
  const [abaInterna, setAbaInterna] = useState('atual'); 
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [bairros, setBairros] = useState([]);
  const [motoboyAtivo, setMotoboyAtivo] = useState(false);
  
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

    // Soma apenas as sangrias feitas para motoboys neste exato turno (caixaAtual)
    const { data: movsDia } = await supabase.from('caixa_movimentacoes').select('valor, descricao').eq('tipo', 'sangria').eq('caixa_id', caixaAtual.id);
    if (movsDia) {
      const pagoHoje = arredondar(movsDia.filter(m => m.descricao && m.descricao.includes('Logística') || m.descricao.includes('Motoboy')).reduce((acc, m) => acc + arredondar(m.valor), 0));
      setTotalPagoMotoboysDia(pagoHoje);
    }
  };

  const carregarHistorico = async () => {
    const dataIso = dataFiltro.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

    const { data: histData } = await supabase.from('caixas')
      .select('*')
      .eq('empresa_id', sessao.empresa_id)
      .in('status', ['fechado', 'estornado'])
      .eq('data_abertura', dataIso)
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
    const val = arredondar(movModal.valor);
    if (isNaN(val) || val <= 0) return mostrarAlerta("Valor Inválido", "Informe um valor numérico válido e superior a zero.");
    if (!movModal.descricao.trim()) return mostrarAlerta("Campo Obrigatório", "A justificativa é obrigatória para a trilha de auditoria.");

    const payload = { caixa_id: caixaAtual.id, empresa_id: sessao.empresa_id, tipo: movModal.tipo, valor: val, descricao: movModal.descricao };
    const { data, error } = await supabase.from('caixa_movimentacoes').insert([payload]).select();
    if (data && data.length > 0 && !error) {
      setMovimentacoes(prev => [...prev, ...data]);
      setMovModal({ visivel: false, tipo: '', valor: '', descricao: '' });
    } else {
      mostrarAlerta("Erro", "A transação não pôde ser registrada.");
    }
  };

  const excluirCaixaConfirmado = async () => {
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

  // LÓGICA CORE CORRIGIDA: Filtra TUDO baseado no Timestamp Exato de abertura e fechamento (seja meia noite ou não)
  const getPagamentosDoTurno = () => {
    if (!comandas || !caixaAtual) return [];
    
    const timeAbertura = new Date(caixaAtual.data_abertura).getTime();
    const timeFechamento = caixaAtual.data_fechamento ? new Date(caixaAtual.data_fechamento).getTime() : Date.now() + 9999999;

    return comandas
      .flatMap(c => c.pagamentos || [])
      .filter(p => {
        // Se a comanda salva já possuir a dupla verificação (caixa_id) gravada
        if (p.caixa_id) return String(p.caixa_id) === String(caixaAtual.id);
        
        // Se não, fazemos a checagem temporal blindada
        if (!p.data) return false;
        const timePagamento = new Date(p.data).getTime();
        return timePagamento >= timeAbertura && timePagamento <= timeFechamento;
      });
  };

  const pagamentosDoTurno = getPagamentosDoTurno();

  const calcularPendenteMotoboy = () => {
    if (!comandas || comandas.length === 0 || !caixaAtual) return 0;
    
    const timeAbertura = new Date(caixaAtual.data_abertura).getTime();
    const timeFechamento = caixaAtual.data_fechamento ? new Date(caixaAtual.data_fechamento).getTime() : Date.now() + 9999999;

    const totalTaxas = comandas.filter(c => {
        if(c.status !== 'fechada') return false; 
        
        // Verifica se houve qualquer pagamento efetuado DENTRO da vida útil deste caixa
        const pagouNesteCaixa = (c.pagamentos || []).some(p => {
          if (p.caixa_id) return String(p.caixa_id) === String(caixaAtual.id);
          if (!p.data) return false;
          const timePagamento = new Date(p.data).getTime();
          return timePagamento >= timeAbertura && timePagamento <= timeFechamento;
        });

        return pagouNesteCaixa;
      }).reduce((acc, c) => {
        let taxa = arredondar(c.taxa_entrega || 0);
        if (taxa === 0 && c.bairro_id && bairros.length > 0) {
          const b = bairros.find(b => String(b.id) === String(c.bairro_id));
          if (b) taxa = arredondar(b.taxa || 0);
        }
        return acc + taxa;
      }, 0);

    return Math.max(0, arredondar(totalTaxas - totalPagoMotoboysDia));
  };
  const pendenteMotoboy = calcularPendenteMotoboy();

  const pagarMotoboysConfirmado = async () => {
    const payload = { caixa_id: caixaAtual.id, empresa_id: sessao.empresa_id, tipo: 'sangria', valor: pendenteMotoboy, descricao: 'Liquidação Logística Integrada' };
    const { data, error } = await supabase.from('caixa_movimentacoes').insert([payload]).select();
    if (data && !error) { 
      setMovimentacoes(prev => [...prev, ...data]); 
      setTotalPagoMotoboysDia(prev => arredondar(prev + pendenteMotoboy)); 
    }
  };

  const abrirConfirmacaoMotoboy = () => mostrarConfirmacao('Autorização de Repasse', `Confirma a liquidação logística no valor de R$ ${pendenteMotoboy.toFixed(2)} aos parceiros?`, pagarMotoboysConfirmado);

  const totalSistemaDinheiro = arredondar(pagamentosDoTurno.filter(p => p.forma === 'Dinheiro').reduce((acc, p) => acc + arredondar(p.valor), 0));
  const totalSistemaCartao = arredondar(pagamentosDoTurno.filter(p => p.forma === 'Cartão' || p.forma === 'Crédito' || p.forma === 'Débito').reduce((acc, p) => acc + arredondar(p.valor), 0));
  const totalSistemaPix = arredondar(pagamentosDoTurno.filter(p => p.forma === 'Pix').reduce((acc, p) => acc + arredondar(p.valor), 0));
  const totalSuprimentos = arredondar(movimentacoes.filter(m => m.tipo === 'suprimento').reduce((acc, m) => acc + arredondar(m.valor), 0));
  const totalSangrias = arredondar(movimentacoes.filter(m => m.tipo === 'sangria').reduce((acc, m) => acc + arredondar(m.valor), 0));
  const saldoInicial = arredondar(caixaAtual?.saldo_inicial || 0);
  
  const saldoGavetaEsperado = arredondar((saldoInicial + totalSistemaDinheiro + totalSuprimentos) - totalSangrias);

  const encerrarCaixaConfirmado = async () => {
    setIsConsolidating(true);

    const valInfoDinheiro = arredondar(valorInformadoDinheiro);
    const valInfoCartao = arredondar(valorInformadoCartao);
    const valInfoPix = arredondar(valorInformadoPix);

    const diferencaDinheiro = arredondar(valInfoDinheiro - saldoGavetaEsperado);
    
    const relatorioFinal = {
      informadoDinheiro: valInfoDinheiro, 
      informadoCartao: valInfoCartao, 
      informadoPix: valInfoPix, 
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
    const valDinheiro = arredondar(modalEdicao.dinheiro); 
    const valCartao = arredondar(modalEdicao.cartao); 
    const valPix = arredondar(modalEdicao.pix);

    const novoRelatorio = { 
      ...caixaEditando.relatorio_fechamento, 
      informadoDinheiro: valDinheiro, 
      informadoCartao: valCartao, 
      informadoPix: valPix, 
      diferencaDinheiro: arredondar(valDinheiro - (caixaEditando.relatorio_fechamento.esperadoDinheiro || 0)) 
    };
    
    const { error } = await supabase.from('caixas').update({ relatorio_fechamento: novoRelatorio }).eq('id', caixaEditando.id).eq('empresa_id', sessao.empresa_id);
    if (!error) { 
       setModalEdicao({ visivel: false, dinheiro: '', cartao: '', pix: '' }); 
       carregarHistorico(); 
    }
  };

  const bgPrincipal = temaNoturno ? 'bg-[#050505]' : 'bg-[#FAFAFA]';
  const textPrincipal = temaNoturno ? 'text-zinc-100' : 'text-zinc-900';
  const textSecundario = temaNoturno ? 'text-zinc-500' : 'text-zinc-500'; 
  const bordaDestaque = temaNoturno ? 'border-white/[0.08]' : 'border-black/[0.08]';
  
  const inputWrapperStyle = `relative flex items-center bg-transparent rounded-xl border transition-all duration-300 overflow-hidden 
    ${temaNoturno ? 'border-white/[0.08] focus-within:border-white/20 hover:border-white/15 bg-white/5' : 'border-black/10 focus-within:border-black/30 hover:border-black/20 bg-black/5'}`;

  const inputStyle = `w-full bg-transparent outline-none py-3 pr-4 pl-12 text-[15px] font-bold tracking-tight transition-all duration-300 placeholder-opacity-40 
    ${temaNoturno ? 'text-white placeholder-white' : 'text-black placeholder-black'}`;

  const labelStyle = `text-[10px] font-bold uppercase tracking-widest mb-2 block ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`;

  const cardBaseStyle = `relative p-6 md:p-8 rounded-[32px] border transition-colors overflow-hidden w-full arox-cinematic flex flex-col
    ${temaNoturno ? 'bg-[#0A0A0A] border-white/[0.04] shadow-md' : 'bg-white border-black/[0.04] shadow-sm'}`;

  const btnAROXPrimario = `px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 active:scale-95 border ${temaNoturno ? 'bg-zinc-100 text-black border-transparent hover:bg-white' : 'bg-zinc-900 text-white border-transparent hover:bg-black'}`;
  const btnAROXSecundario = `px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 active:scale-95 border ${temaNoturno ? 'bg-[#18181B] border-white/10 text-white hover:bg-zinc-800' : 'bg-white border-black/10 text-zinc-900 hover:bg-zinc-50'}`;
  
  const tabs = [{ id: 'atual', label: 'Ciclo Operacional' }, { id: 'historico', label: 'Trilha de Auditoria' }];

  return (
    <div className={`w-full min-h-screen relative font-sans pt-4 pb-20 overflow-hidden ${bgPrincipal} ${textPrincipal}`}>
      
      <style dangerouslySetInnerHTML={{__html: `
        .arox-cinematic { animation: arox-fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; transform: translateY(10px); }
        @keyframes arox-fade-up { 100% { opacity: 1; transform: translateY(0); } }
      `}} />

      <div className={`relative z-10 flex flex-col gap-6 w-full max-w-full mx-auto px-4 md:px-6 transition-all duration-400`}>
        
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 shrink-0 border-b mb-4 ${bordaDestaque}`}>
          <div className="flex flex-wrap items-center gap-4 md:gap-6">
            {tabs.map(tab => (
              <button 
                key={tab.id} 
                onMouseEnter={() => {
                  if (senhaModal.visivel) return;
                  if(tab.id === 'historico' && !historicoLiberado) {
                    setAcaoPendente('historico'); setSenhaModal({ visivel: true, senha: '' });
                  } else {
                    setAbaInterna(tab.id);
                  }
                }}
                onClick={() => {
                  if (senhaModal.visivel) return;
                  if(tab.id === 'historico' && !historicoLiberado) {
                    setAcaoPendente('historico'); setSenhaModal({ visivel: true, senha: '' });
                  } else {
                    setAbaInterna(tab.id);
                  }
                }} 
                className={`relative py-2.5 text-[11px] font-bold tracking-[0.05em] uppercase transition-colors duration-300 ${abaInterna === tab.id ? (temaNoturno ? 'text-white' : 'text-black') : `${textSecundario} hover:${textPrincipal}`}`}
              >
                {tab.label}
                {abaInterna === tab.id && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-emerald-500 shadow-[0_-1px_8px_rgba(16,185,129,0.4)]" />}
              </button>
            ))}
          </div>

          {abaInterna === 'atual' && caixaAtual?.status === 'aberto' && (
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto arox-cinematic" style={{animationDelay: '0ms'}}>
              <button onClick={() => { setMovModal({ visivel: true, tipo: 'suprimento', valor: '', descricao: '' }); }} className={`${btnAROXPrimario} flex-1 md:flex-none justify-center`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                Entrada Extra
              </button>
              <button onClick={() => { setMovModal({ visivel: true, tipo: 'sangria', valor: '', descricao: '' }); }} className={`${btnAROXSecundario} flex-1 md:flex-none justify-center`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4"></path></svg>
                Retirada (Sangria)
              </button>
            </div>
          )}
        </div>

        <main className="flex-1 min-w-0 w-full relative">
            
            <div className={`w-full ${abaInterna === 'atual' ? 'block' : 'hidden'}`}>
              {caixaAtual?.status === 'aberto' ? (
                <div className="flex flex-col gap-6 w-full">

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
                    
                    <section className={cardBaseStyle} style={{animationDelay: '50ms'}}>
                      <div className="relative z-10 h-full flex flex-col">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                          <div>
                            <h2 className="text-[20px] font-bold tracking-tight mb-1">Apuração do Sistema</h2>
                            <p className={`text-[12px] font-medium ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Totais registrados.</p>
                          </div>
                          <button onClick={() => { if(mostrarEsperado) setMostrarEsperado(false); else { setAcaoPendente('revelar'); setSenhaModal({ visivel: true, senha: '' }); } }} 
                            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 active:scale-[0.97] border shadow-sm ${temaNoturno ? 'bg-zinc-800 border-white/10 hover:bg-zinc-700 text-zinc-300 hover:text-white' : 'bg-white border-black/10 hover:bg-zinc-50 text-zinc-700 hover:text-black'}`}>
                            {mostrarEsperado ? 'Ocultar Valores' : 'Desbloquear'}
                          </button>
                        </div>
                        
                        <div className={`grid transition-all duration-400 ease-[cubic-bezier(0.25,1,0.5,1)] flex-1 ${mostrarEsperado ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
                          <div className="overflow-hidden">
                            <div className="grid grid-cols-2 gap-y-6 gap-x-6">
                              <div className="col-span-2 mb-2 pb-6 border-b border-dashed border-zinc-500/20">
                                <p className={labelStyle}>Saldo Esperado</p>
                                <p className={`text-[36px] font-bold tracking-tight leading-none tabular-nums ${temaNoturno ? 'text-white' : 'text-black'}`}>R$ {saldoGavetaEsperado.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className={labelStyle}>Fundo Inicial</p>
                                <p className={`text-[15px] font-bold tracking-tight tabular-nums ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>R$ {saldoInicial.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className={labelStyle}>Vendas (Dinheiro)</p>
                                <p className="text-[15px] font-bold tracking-tight tabular-nums text-emerald-500">+ R$ {totalSistemaDinheiro.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className={labelStyle}>Entradas Extras</p>
                                <p className="text-[15px] font-bold tracking-tight tabular-nums text-emerald-500">+ R$ {totalSuprimentos.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className={labelStyle}>Sangrias / Acertos</p>
                                <p className="text-[15px] font-bold tracking-tight tabular-nums text-rose-500">- R$ {totalSangrias.toFixed(2)}</p>
                              </div>
                              <div className="col-span-2 pt-6 border-t border-dashed border-zinc-500/20 grid grid-cols-2 gap-6">
                                <div>
                                  <p className={labelStyle}>Maquininhas</p>
                                  <p className={`text-[18px] font-bold tracking-tight tabular-nums ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>R$ {totalSistemaCartao.toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className={labelStyle}>Total Pix</p>
                                  <p className={`text-[18px] font-bold tracking-tight tabular-nums ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>R$ {totalSistemaPix.toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {!mostrarEsperado && (
                           <div className="flex-1 flex items-center justify-center py-12 opacity-50 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.02)_10px,rgba(0,0,0,0.02)_20px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.02)_10px,rgba(255,255,255,0.02)_20px)] rounded-xl mt-4">
                             <p className={`text-[12px] font-bold uppercase tracking-widest ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Visualização Bloqueada</p>
                           </div>
                        )}
                      </div>
                    </section>

                    <section className={cardBaseStyle} style={{animationDelay: '100ms'}}>
                      <div className="relative z-10 flex flex-col h-full">
                        <div className="mb-6 border-b border-transparent">
                          <h2 className="text-[20px] font-bold tracking-tight mb-1">Declaração Física</h2>
                          <p className={`text-[12px] font-medium ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Informe os valores reais contados.</p>
                        </div>
                        <div className="flex flex-col gap-6 flex-1 justify-center">
                          <div>
                            <label className={labelStyle}>Dinheiro em Espécie</label>
                            <div className={inputWrapperStyle}>
                              <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold z-10 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>R$</span>
                              <input type="number" value={valorInformadoDinheiro} onChange={(e) => setValorInformadoDinheiro(e.target.value)} className={`${inputStyle} relative z-10`} placeholder="0,00" />
                            </div>
                          </div>
                          <div>
                            <label className={labelStyle}>Maquininhas (Cartão)</label>
                            <div className={inputWrapperStyle}>
                              <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold z-10 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>R$</span>
                              <input type="number" value={valorInformadoCartao} onChange={(e) => setValorInformadoCartao(e.target.value)} className={`${inputStyle} relative z-10`} placeholder="0,00" />
                            </div>
                          </div>
                          <div>
                            <label className={labelStyle}>Recebimentos via Pix</label>
                            <div className={inputWrapperStyle}>
                              <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold z-10 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>R$</span>
                              <input type="number" value={valorInformadoPix} onChange={(e) => setValorInformadoPix(e.target.value)} className={`${inputStyle} relative z-10`} placeholder="0,00" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className={cardBaseStyle} style={{animationDelay: '150ms'}}>
                      <div className="relative z-10 flex flex-col h-full">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                          <div className="flex-1">
                            <h3 className="text-[20px] font-bold tracking-tight mb-1">Acerto de Motoboys</h3>
                            <p className={`text-[12px] font-medium ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Controle de taxas pendentes.</p>
                          </div>
                          <div className="flex items-center gap-3">
                             <button onClick={() => { toggleMotoboy(); }} className={`w-12 h-6 rounded-full relative transition-colors duration-300 shrink-0 shadow-inner border ${motoboyAtivo ? (temaNoturno ? 'bg-zinc-200 border-transparent' : 'bg-zinc-900 border-transparent') : (temaNoturno ? 'bg-transparent border-white/20' : 'bg-transparent border-black/20')}`}>
                                <span className={`absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${temaNoturno ? (motoboyAtivo ? 'bg-zinc-900' : 'bg-zinc-400') : (motoboyAtivo ? 'bg-white' : 'bg-zinc-400')} ${motoboyAtivo ? 'translate-x-6' : 'translate-x-0'}`} />
                             </button>
                          </div>
                        </div>

                        <div className={`flex flex-col items-center justify-center p-6 flex-1 rounded-[20px] transition-all duration-300 border ${motoboyAtivo ? (temaNoturno ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-black/[0.02] border-black/[0.05]') : (temaNoturno ? 'bg-transparent border-white/[0.05] opacity-50' : 'bg-transparent border-black/[0.05] opacity-50')} ${motoboyAtivo ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                           <div className="mb-6 text-center w-full">
                              <p className={labelStyle}>Valor Pendente Hoje</p>
                              <p className={`text-[36px] font-bold tracking-tight tabular-nums ${temaNoturno ? 'text-white' : 'text-black'}`}>
                                 R$ {pendenteMotoboy.toFixed(2)}
                              </p>
                           </div>
                           <button onClick={() => { abrirConfirmacaoMotoboy(); }} disabled={!motoboyAtivo || pendenteMotoboy <= 0} className={`w-full px-6 py-4 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 active:scale-[0.97] border shadow-sm disabled:opacity-50 disabled:active:scale-100 ${temaNoturno ? 'bg-zinc-800 border-white/10 text-white hover:bg-zinc-700' : 'bg-white border-black/10 text-zinc-900 hover:bg-zinc-50'}`}>
                              Autorizar Pagamento
                           </button>
                        </div>
                      </div>
                    </section>

                  </div>

                  <div className="pt-4 pb-12 w-full arox-cinematic" style={{animationDelay: '200ms'}}>
                    <button onClick={() => mostrarConfirmacao('Fechar Ciclo', 'Confirma o encerramento da sessão atual? O ciclo passará a constar no histórico.', encerrarCaixaConfirmado)} 
                      disabled={isConsolidating}
                      className={`relative w-full py-5 rounded-[20px] text-[13px] font-bold uppercase tracking-wider transition-all duration-200 active:scale-[0.98] shadow-md border disabled:opacity-80 disabled:active:scale-100 flex justify-center items-center gap-3 ${temaNoturno ? 'bg-zinc-100 text-black border-transparent hover:bg-white' : 'bg-zinc-900 text-white border-transparent hover:bg-black'}`}>
                      {isConsolidating ? (
                         <>
                           <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                           Fechando e Consolidando...
                         </>
                      ) : 'Confirmar e Fechar Ciclo'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[50vh] w-full">
                  <div className="text-center arox-cinematic">
                    <div className={`w-16 h-16 mx-auto mb-6 rounded-[20px] flex items-center justify-center border ${temaNoturno ? 'bg-white/[0.03] border-white/[0.08] text-zinc-500' : 'bg-black/[0.02] border-black/[0.05] text-zinc-400'}`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    </div>
                    <p className={`text-[18px] font-bold tracking-tight mb-1 ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>Ciclo Fechado</p>
                    <p className={`text-[13px] font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Nenhuma sessão operacional aberta no momento.</p>
                  </div>
                </div>
              )}
            </div>

            <div className={`w-full ${abaInterna === 'historico' ? 'block' : 'hidden'}`}>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b pb-4 border-transparent arox-cinematic" style={{animationDelay: '0ms'}}>
                  
                  <div className={`flex items-center p-1.5 rounded-xl border ${temaNoturno ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-black/[0.02] border-black/[0.06]'}`}>
                     <button onClick={() => alterarData(-1)} className={`p-2.5 rounded-lg transition-colors active:scale-95 ${temaNoturno ? 'hover:bg-white/[0.08] text-zinc-400 hover:text-white' : 'hover:bg-black/[0.05] text-zinc-500 hover:text-black'}`}>
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                     </button>
                     <span className={`min-w-[130px] text-center text-[12px] font-bold uppercase tracking-wider ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>
                       {renderDataLabel()}
                     </span>
                     <button onClick={() => alterarData(1)} disabled={isHoje} className={`p-2.5 rounded-lg transition-colors active:scale-95 disabled:opacity-20 disabled:hover:bg-transparent ${temaNoturno ? 'hover:bg-white/[0.08] text-zinc-400 hover:text-white' : 'hover:bg-black/[0.05] text-zinc-500 hover:text-black'}`}>
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                     </button>
                  </div>
                </div>

                {historicoCaixas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[30vh] text-center border-t border-dashed pt-10 mt-2 opacity-60 w-full arox-cinematic" style={{ borderColor: temaNoturno ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', animationDelay: '50ms' }}>
                    <p className={`text-[14px] font-bold ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Nenhum fechamento registrado nesta data.</p>
                  </div>
                ) : (
                  <div className="relative pt-2 pb-12 w-full">
                    <div className={`absolute top-6 bottom-12 left-[18px] md:left-[26px] w-[2px] rounded-full ${temaNoturno ? 'bg-white/[0.06]' : 'bg-black/[0.06]'}`} />

                    <div className="flex flex-col gap-6 relative z-10 w-full">
                      {historicoCaixas.map((caixa, index) => {
                        const isEstornado = caixa.status === 'estornado';
                        const isDiferenca = caixa.relatorio_fechamento?.diferencaDinheiro !== 0;
                        const diferenca = caixa.relatorio_fechamento?.diferencaDinheiro || 0;
                        
                        let corMarcador = temaNoturno ? 'bg-zinc-400 ring-white/[0.05]' : 'bg-zinc-500 ring-black/[0.05]';
                        if (isEstornado) corMarcador = 'bg-rose-500 ring-rose-500/20';
                        else if (isDiferenca) corMarcador = diferenca > 0 ? 'bg-emerald-500 ring-emerald-500/20' : 'bg-amber-500 ring-amber-500/20';

                        return (
                          <div key={caixa.id} className="relative pl-12 md:pl-16 group w-full arox-cinematic" style={{animationDelay: `${index * 50 + 50}ms`}}>
                            
                            <div className={`absolute left-[13.5px] md:left-[21.5px] top-7 w-2.5 h-2.5 rounded-full ring-4 shadow-sm transition-transform duration-300 group-hover:scale-125 ${corMarcador}`} />

                            <div className={`relative p-6 md:p-8 rounded-[24px] transition-all duration-300 border shadow-sm hover:shadow-md overflow-hidden ${isEstornado ? (temaNoturno ? 'bg-rose-950/5 border-rose-500/10 opacity-70 grayscale-[50%]' : 'bg-rose-50/50 border-rose-200/50 opacity-70 grayscale-[50%]') : cardBaseStyle.replace('arox-cinematic flex flex-col', '')}`}>
                              
                              <div className="relative z-10 flex flex-col gap-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-transparent">
                                  <div>
                                     <div className="flex items-center gap-3 mb-1.5">
                                       <h3 className={`text-[15px] font-bold tracking-tight ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>
                                          {isEstornado ? 'Ciclo Estornado' : 'Fechamento de Ciclo'}
                                       </h3>
                                       {isEstornado ? (
                                         <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest ${temaNoturno ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600'}`}>Anulado</span>
                                       ) : isDiferenca ? (
                                         <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest ${diferenca > 0 ? (temaNoturno ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (temaNoturno ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600')}`}>
                                           {diferenca > 0 ? 'Sobra de Dinheiro' : 'Falta de Dinheiro'}
                                         </span>
                                       ) : (
                                         <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest ${temaNoturno ? 'bg-white/10 text-zinc-300' : 'bg-black/5 text-zinc-600'}`}>Conciliado</span>
                                       )}
                                     </div>
                                     <p className={`text-[12px] flex items-center font-bold gap-2 opacity-60 ${temaNoturno ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                       <span>Aberto às {formatarHora(caixa.data_abertura)}</span>
                                       <span className="w-1 h-1 rounded-full bg-current opacity-30" />
                                       <span>Fechado às {formatarHora(caixa.data_fechamento)}</span>
                                     </p>
                                  </div>

                                  {!isEstornado && (
                                    <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                                      <button onClick={() => { setCaixaEditando(caixa); setAcaoPendente('editar_fechamento'); setSenhaModal({ visivel: true, senha: '' }); }} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors border shadow-sm ${temaNoturno ? 'bg-zinc-800 border-white/10 text-zinc-300 hover:text-white hover:bg-zinc-700' : 'bg-white border-black/10 text-zinc-600 hover:text-black hover:bg-zinc-50'}`}>Editar Fechamento</button>
                                      <button onClick={() => { setCaixaEditando(caixa); setAcaoPendente('excluir_fechamento'); setSenhaModal({ visivel: true, senha: '' }); }} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors border shadow-sm ${temaNoturno ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20' : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'}`}>Estornar Fechamento</button>
                                    </div>
                                  )}
                                </div>

                                <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 ${isEstornado ? 'opacity-50' : ''}`}>
                                   <div>
                                      <p className={labelStyle}>Dinheiro Informado</p>
                                      <p className={`text-[14px] font-bold tracking-tight tabular-nums ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>R$ {(caixa.relatorio_fechamento?.informadoDinheiro || 0).toFixed(2)}</p>
                                   </div>
                                   <div>
                                      <p className={labelStyle}>Total Digital</p>
                                      <p className={`text-[14px] font-bold tracking-tight tabular-nums ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>R$ {((caixa.relatorio_fechamento?.informadoCartao || 0) + (caixa.relatorio_fechamento?.informadoPix || 0)).toFixed(2)}</p>
                                   </div>
                                   <div className="col-span-2 sm:text-right">
                                      {isDiferenca && !isEstornado && (
                                         <>
                                           <p className={labelStyle}>Diferença (Dinheiro)</p>
                                           <p className={`text-[16px] font-bold tracking-tight tabular-nums ${diferenca > 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className={`absolute inset-0 transition-opacity duration-300 animate-in fade-in backdrop-blur-md ${temaNoturno ? 'bg-black/60' : 'bg-white/40'}`} onClick={() => setMovModal({ visivel: false, tipo: '', valor: '', descricao: '' })} />
          <div className={`relative w-full max-w-[420px] p-8 md:p-10 rounded-[32px] shadow-2xl animate-in zoom-in-[0.98] fade-in duration-200 border ${temaNoturno ? 'bg-[#0A0A0C] border-white/[0.08]' : 'bg-white/90 backdrop-blur-2xl border-black/[0.05]'}`}>
            <h2 className="text-[20px] font-bold tracking-tight mb-8">{movModal.tipo === 'sangria' ? 'Retirada (Sangria)' : 'Entrada Extra'}</h2>
            
            <div className="space-y-6 mb-8">
              <div>
                <label className={labelStyle}>Valor</label>
                <div className={inputWrapperStyle}>
                   <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>R$</span>
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
              <button onClick={() => setMovModal({ visivel: false, tipo: '', valor: '', descricao: '' })} className={`px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors border border-transparent ${temaNoturno ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-zinc-500 hover:text-black hover:bg-black/5'}`}>Cancelar</button>
              <button onClick={handleSalvarMovimentacao} className={btnAROXPrimario}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {senhaModal.visivel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className={`absolute inset-0 transition-opacity duration-300 animate-in fade-in backdrop-blur-md ${temaNoturno ? 'bg-black/60' : 'bg-white/40'}`} onClick={() => setSenhaModal({ visivel: false, senha: '' })} />
          <div className={`relative w-full max-w-[420px] p-8 md:p-10 rounded-[32px] shadow-2xl animate-in zoom-in-[0.98] fade-in duration-200 border ${temaNoturno ? 'bg-[#0A0A0C] border-white/[0.08]' : 'bg-white/90 backdrop-blur-2xl border-black/[0.05]'}`}>
            <h2 className="text-[20px] font-bold tracking-tight mb-2">Autorização Gerencial</h2>
            <p className={`text-[12px] mb-8 font-medium ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Senha de administrador exigida para confirmar operação.</p>
            
            <div className="mb-8">
              <div className={inputWrapperStyle}>
                <input type="password" value={senhaModal.senha} onChange={e => setSenhaModal({...senhaModal, senha: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleVerificarSenha()} autoFocus className={`${inputStyle} !pl-4 tracking-[0.5em] font-black text-center`} placeholder="••••••" />
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button onClick={() => setSenhaModal({ visivel: false, senha: '' })} className={`px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors border border-transparent ${temaNoturno ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-zinc-500 hover:text-black hover:bg-black/5'}`}>Cancelar</button>
              <button onClick={handleVerificarSenha} className={btnAROXPrimario}>Autenticar</button>
            </div>
          </div>
        </div>
      )}

      {modalEdicao.visivel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className={`absolute inset-0 transition-opacity duration-300 animate-in fade-in backdrop-blur-md ${temaNoturno ? 'bg-black/60' : 'bg-white/40'}`} onClick={() => setModalEdicao({ visivel: false, dinheiro: '', cartao: '', pix: '' })} />
          <div className={`relative w-full max-w-[420px] p-8 md:p-10 rounded-[32px] shadow-2xl animate-in zoom-in-[0.98] fade-in duration-200 border ${temaNoturno ? 'bg-[#0A0A0C] border-white/[0.08]' : 'bg-white/90 backdrop-blur-2xl border-black/[0.05]'}`}>
            <h2 className="text-[20px] font-bold tracking-tight mb-2">Editar Valores de Fechamento</h2>
            <p className={`text-[12px] mb-8 font-medium ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Corrija a declaração física de um turno já encerrado.</p>
            
            <div className="space-y-6 mb-8">
              <div>
                <label className={labelStyle}>Dinheiro em Espécie</label>
                <div className={inputWrapperStyle}>
                   <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>R$</span>
                   <input type="number" value={modalEdicao.dinheiro} onChange={e => setModalEdicao({...modalEdicao, dinheiro: e.target.value})} className={inputStyle} />
                </div>
              </div>
              <div>
                <label className={labelStyle}>Maquininhas (Cartão)</label>
                <div className={inputWrapperStyle}>
                   <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>R$</span>
                   <input type="number" value={modalEdicao.cartao} onChange={e => setModalEdicao({...modalEdicao, cartao: e.target.value})} className={inputStyle} />
                </div>
              </div>
              <div>
                <label className={labelStyle}>Recebimentos via Pix</label>
                <div className={inputWrapperStyle}>
                   <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>R$</span>
                   <input type="number" value={modalEdicao.pix} onChange={e => setModalEdicao({...modalEdicao, pix: e.target.value})} className={inputStyle} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setModalEdicao({ visivel: false, dinheiro: '', cartao: '', pix: '' })} className={`px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors border border-transparent ${temaNoturno ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-zinc-500 hover:text-black hover:bg-black/5'}`}>Cancelar</button>
              <button onClick={salvarEdicaoFechamento} className={btnAROXPrimario}>Salvar Edição</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}