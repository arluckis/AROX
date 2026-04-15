import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

const arredondar = (valor) => Math.round((parseFloat(String(valor).replace(',', '.')) || 0) * 100) / 100;

export function useFechamentoCaixa({ sessao, caixaAtual, comandas, fetchData, mostrarAlerta, mostrarConfirmacao }) {
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
  const [senhaHistorico, setSenhaHistorico] = useState(''); 
  const [senhaApuracao, setSenhaApuracao] = useState(''); 
  
  const [mostrarEsperado, setMostrarEsperado] = useState(false);
  const [historicoLiberado, setHistoricoLiberado] = useState(false);
  const [acaoPendente, setAcaoPendente] = useState(null); 
  const [caixaEditando, setCaixaEditando] = useState(null);
  const [totalPagoMotoboysDia, setTotalPagoMotoboysDia] = useState(0);
  const [modalEdicao, setModalEdicao] = useState({ visivel: false, dinheiro: '', cartao: '', pix: '' });
  
  const [solicitouSenhaAuto, setSolicitouSenhaAuto] = useState(false);
  const [isConsolidating, setIsConsolidating] = useState(false);
  const [extratoExpandido, setExtratoExpandido] = useState(false);
  const [buscaExtrato, setBuscaExtrato] = useState('');

  const formatarHora = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    if (caixaAtual?.status !== 'aberto' && abaInterna === 'atual' && !solicitouSenhaAuto) {
      setSolicitouSenhaAuto(true); setAbaInterna('historico');
    }
  }, [caixaAtual?.status, abaInterna, solicitouSenhaAuto]);

  useEffect(() => { if (sessao?.empresa_id && caixaAtual?.id) carregarDadosCaixaAtual(); }, [sessao?.empresa_id, caixaAtual?.id]);
  useEffect(() => { if (sessao?.empresa_id) carregarHistorico(); }, [sessao?.empresa_id, dataFiltro, abaInterna]);

  const carregarDadosCaixaAtual = async () => {
    if (!caixaAtual?.id) return;
    const { data: movData } = await supabase.from('caixa_movimentacoes').select('*').eq('caixa_id', caixaAtual.id);
    if (movData) setMovimentacoes(movData);
    const { data: empData } = await supabase.from('empresas').select('motoboy_ativo').eq('id', sessao.empresa_id).single();
    if (empData) setMotoboyAtivo(empData.motoboy_ativo);
    const { data: bairrosData } = await supabase.from('bairros_entrega').select('*').eq('empresa_id', sessao.empresa_id);
    if (bairrosData) setBairros(bairrosData);
    const { data: movsDia } = await supabase.from('caixa_movimentacoes').select('valor, descricao').eq('tipo', 'sangria').eq('caixa_id', caixaAtual.id);
    if (movsDia) {
      const pagoHoje = arredondar(movsDia.filter(m => m.descricao && (m.descricao.includes('Logística') || m.descricao.includes('Motoboy'))).reduce((acc, m) => acc + arredondar(m.valor), 0));
      setTotalPagoMotoboysDia(pagoHoje);
    }
  };

  const carregarHistorico = async () => {
    const dataIso = dataFiltro.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    const { data: histData } = await supabase.from('caixas').select('*').eq('empresa_id', sessao.empresa_id).in('status', ['fechado', 'estornado']).eq('data_abertura', dataIso).order('data_fechamento', { ascending: false });
    if (histData) setHistoricoCaixas(histData);
  };

  const isHoje = new Date().setHours(0,0,0,0) === new Date(dataFiltro).setHours(0,0,0,0);
  const alterarData = (dias) => { const novaData = new Date(dataFiltro); novaData.setDate(novaData.getDate() + dias); if (novaData > new Date()) return; setDataFiltro(novaData); };
  const renderDataLabel = () => {
    if (isHoje) return 'Hoje';
    const ontem = new Date(); ontem.setDate(ontem.getDate() - 1);
    if (ontem.setHours(0,0,0,0) === new Date(dataFiltro).setHours(0,0,0,0)) return 'Ontem';
    return dataFiltro.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace(' de ', ' ');
  };

  const toggleMotoboy = async () => { const novoStatus = !motoboyAtivo; await supabase.from('empresas').update({ motoboy_ativo: novoStatus }).eq('id', sessao.empresa_id); setMotoboyAtivo(novoStatus); };

  const handleSalvarMovimentacao = async () => {
    const val = arredondar(movModal.valor);
    if (isNaN(val) || val <= 0) return mostrarAlerta("Valor Inválido", "Informe um valor numérico válido e superior a zero.");
    if (!movModal.descricao.trim()) return mostrarAlerta("Campo Obrigatório", "A justificativa é obrigatória.");
    const payload = { caixa_id: caixaAtual.id, empresa_id: sessao.empresa_id, tipo: movModal.tipo, valor: val, descricao: movModal.descricao };
    const { data, error } = await supabase.from('caixa_movimentacoes').insert([payload]).select();
    if (data && data.length > 0 && !error) { setMovimentacoes(prev => [...prev, ...data]); setMovModal({ visivel: false, tipo: '', valor: '', descricao: '' }); } 
    else mostrarAlerta("Erro", "A transação não pôde ser registrada.");
  };

  const excluirCaixaConfirmado = async () => {
    const { error } = await supabase.from('caixas').update({ status: 'estornado', data_fechamento: new Date().toISOString() }).eq('id', caixaEditando.id).eq('empresa_id', sessao.empresa_id);
    if (!error) { mostrarAlerta("Auditoria", "Fechamento estornado."); carregarHistorico(); } 
    else mostrarAlerta("Erro", "Permissão negada.");
  };

  const checkSenha = async (senha) => {
    const { data, error } = await supabase.rpc('verificar_credencial_critica', { p_empresa_id: sessao.empresa_id, p_senha: senha });
    if (error) throw error; return data;
  };

  const handleVerificarSenhaHistorico = async () => {
    if (!senhaHistorico) return;
    try { if (await checkSenha(senhaHistorico)) { setHistoricoLiberado(true); setSenhaHistorico(''); } else mostrarAlerta("Negado", "Credencial gerencial obrigatória."); } catch(err) { mostrarAlerta("Erro", "Erro de conexão."); }
  };

  const handleVerificarSenhaApuracao = async () => {
    if (!senhaApuracao) return;
    try { if (await checkSenha(senhaApuracao)) { setMostrarEsperado(true); setSenhaApuracao(''); } else mostrarAlerta("Negado", "Credencial gerencial obrigatória."); } catch(err) { mostrarAlerta("Erro", "Erro de conexão."); }
  };

  const handleVerificarSenha = async () => {
    if (!senhaModal.senha) return;
    try {
      if (await checkSenha(senhaModal.senha)) {
        setSenhaModal({ visivel: false, senha: '' });
        if (acaoPendente === 'editar_fechamento') { const rel = caixaEditando?.relatorio_fechamento || {}; setModalEdicao({ visivel: true, dinheiro: rel.informadoDinheiro || '', cartao: rel.informadoCartao || '', pix: rel.informadoPix || '' }); }
        if (acaoPendente === 'excluir_fechamento') mostrarConfirmacao('Estornar', 'Deseja prosseguir?', excluirCaixaConfirmado);
      } else { mostrarAlerta("Negado", "Credencial gerencial obrigatória."); }
    } catch(err) { mostrarAlerta("Erro", "Erro de conexão."); setSenhaModal({ visivel: false, senha: '' }); }
  };

  const getPagamentosDoTurno = () => {
    if (!comandas || !caixaAtual) return [];
    const timeAbertura = new Date(caixaAtual.data_abertura).getTime();
    const timeFechamento = caixaAtual.data_fechamento ? new Date(caixaAtual.data_fechamento).getTime() : Date.now() + 9999999;
    return comandas.flatMap(c => c.pagamentos || []).filter(p => {
        if (p.caixa_id) return String(p.caixa_id) === String(caixaAtual.id);
        if (!p.data) return false;
        const timePagamento = new Date(p.data).getTime();
        return timePagamento >= timeAbertura && timePagamento <= timeFechamento;
    });
  };

  const comandasDoTurno = useMemo(() => {
    if (!comandas || !caixaAtual) return [];
    return comandas.filter(c => c.data === caixaAtual.data_abertura || String(c.caixa_id) === String(caixaAtual.id)).map(c => {
       const subtotal = (c.produtos || []).reduce((sum, p) => sum + (Number(p.preco) || 0), 0);
       const taxa = Number(c.taxa_entrega) || 0; const desconto = Number(c.desconto) || 0;
       const totalDevido = arredondar(subtotal + taxa - desconto);
       const totalPago = arredondar((c.pagamentos || []).reduce((sum, p) => sum + (Number(p.valor) || 0), 0));
       const diferenca = arredondar(totalPago - totalDevido);
       const troco = diferenca > 0 ? diferenca : 0; const pendente = diferenca < 0 ? Math.abs(diferenca) : 0;
       let statusFinanceiro = pendente === 0 ? 'PAGO' : (totalPago > 0 ? 'PARCIAL' : 'PENDENTE');
       return { ...c, totalDevido, totalPago, troco, pendente, statusFinanceiro };
    }).sort((a, b) => {
       if (a.pendente > 0 && b.pendente === 0) return -1; if (a.pendente === 0 && b.pendente > 0) return 1;
       return b.totalDevido - a.totalDevido;
    });
  }, [comandas, caixaAtual]);

  const totaisDossie = useMemo(() => comandasDoTurno.reduce((acc, c) => ({ devido: acc.devido + c.totalDevido, pago: acc.pago + c.totalPago, troco: acc.troco + c.troco, pendente: acc.pendente + c.pendente }), { devido: 0, pago: 0, troco: 0, pendente: 0 }), [comandasDoTurno]);
  const comandasExtratoFiltradas = useMemo(() => {
    if (!buscaExtrato.trim()) return comandasDoTurno;
    const q = buscaExtrato.toLowerCase(); return comandasDoTurno.filter(c => (c.nome || '').toLowerCase().includes(q) || (c.tipo || '').toLowerCase().includes(q));
  }, [comandasDoTurno, buscaExtrato]);

  const pagamentosDoTurno = getPagamentosDoTurno();

  const calcularPendenteMotoboy = () => {
    if (!comandas || comandas.length === 0 || !caixaAtual) return 0;
    const timeAbertura = new Date(caixaAtual.data_abertura).getTime(); const timeFechamento = caixaAtual.data_fechamento ? new Date(caixaAtual.data_fechamento).getTime() : Date.now() + 9999999;
    const totalTaxas = comandas.filter(c => c.status === 'fechada' && (c.pagamentos || []).some(p => (p.caixa_id && String(p.caixa_id) === String(caixaAtual.id)) || (p.data && new Date(p.data).getTime() >= timeAbertura && new Date(p.data).getTime() <= timeFechamento))).reduce((acc, c) => {
        let taxa = arredondar(c.taxa_entrega || 0);
        if (taxa === 0 && c.bairro_id && bairros.length > 0) { const b = bairros.find(b => String(b.id) === String(c.bairro_id)); if (b) taxa = arredondar(b.taxa || 0); }
        return acc + taxa;
    }, 0);
    return Math.max(0, arredondar(totalTaxas - totalPagoMotoboysDia));
  };
  
  const pendenteMotoboy = calcularPendenteMotoboy();
  const pagarMotoboysConfirmado = async () => {
    const payload = { caixa_id: caixaAtual.id, empresa_id: sessao.empresa_id, tipo: 'sangria', valor: pendenteMotoboy, descricao: 'Liquidação Logística Integrada' };
    const { data, error } = await supabase.from('caixa_movimentacoes').insert([payload]).select();
    if (data && !error) { setMovimentacoes(prev => [...prev, ...data]); setTotalPagoMotoboysDia(prev => arredondar(prev + pendenteMotoboy)); }
  };
  const abrirConfirmacaoMotoboy = () => mostrarConfirmacao('Autorização', `Confirma a liquidação logística de R$ ${pendenteMotoboy.toFixed(2)}?`, pagarMotoboysConfirmado);

  const totalSistemaDinheiro = arredondar(pagamentosDoTurno.filter(p => p.forma === 'Dinheiro').reduce((acc, p) => acc + arredondar(p.valor), 0));
  const totalSistemaCartao = arredondar(pagamentosDoTurno.filter(p => p.forma === 'Cartão' || p.forma === 'Crédito' || p.forma === 'Débito').reduce((acc, p) => acc + arredondar(p.valor), 0));
  const totalSistemaPix = arredondar(pagamentosDoTurno.filter(p => p.forma === 'Pix').reduce((acc, p) => acc + arredondar(p.valor), 0));
  const totalSuprimentos = arredondar(movimentacoes.filter(m => m.tipo === 'suprimento').reduce((acc, m) => acc + arredondar(m.valor), 0));
  const totalSangrias = arredondar(movimentacoes.filter(m => m.tipo === 'sangria').reduce((acc, m) => acc + arredondar(m.valor), 0));
  const saldoInicial = arredondar(caixaAtual?.saldo_inicial || 0);
  const saldoGavetaEsperado = arredondar((saldoInicial + totalSistemaDinheiro + totalSuprimentos) - totalSangrias);

  const encerrarCaixaConfirmado = async () => {
    setIsConsolidating(true);
    const valInfoDinheiro = arredondar(valorInformadoDinheiro); const valInfoCartao = arredondar(valorInformadoCartao); const valInfoPix = arredondar(valorInformadoPix);
    const relatorioFinal = {
      informadoDinheiro: valInfoDinheiro, informadoCartao: valInfoCartao, informadoPix: valInfoPix, 
      esperadoDinheiro: saldoGavetaEsperado, esperadoCartao: totalSistemaCartao, esperadoPix: totalSistemaPix, 
      diferencaDinheiro: arredondar(valInfoDinheiro - saldoGavetaEsperado), suprimentos: totalSuprimentos, sangrias: totalSangrias
    };
    
    const { error } = await supabase.from('caixas').update({ status: 'fechado', data_fechamento: new Date().toISOString(), relatorio_fechamento: relatorioFinal }).eq('id', caixaAtual.id).eq('empresa_id', sessao.empresa_id);
    setIsConsolidating(false);
    if (error) return mostrarAlerta("Erro", error.message); 
    
    setValorInformadoDinheiro(''); setValorInformadoCartao(''); setValorInformadoPix('');
    setMostrarEsperado(false); setHistoricoLiberado(false); setSolicitouSenhaAuto(true); setAbaInterna('historico');
    fetchData(); 
  };

  const salvarEdicaoFechamento = async () => {
    const valDinheiro = arredondar(modalEdicao.dinheiro); const valCartao = arredondar(modalEdicao.cartao); const valPix = arredondar(modalEdicao.pix);
    const novoRelatorio = { ...caixaEditando.relatorio_fechamento, informadoDinheiro: valDinheiro, informadoCartao: valCartao, informadoPix: valPix, diferencaDinheiro: arredondar(valDinheiro - (caixaEditando.relatorio_fechamento.esperadoDinheiro || 0)) };
    const { error } = await supabase.from('caixas').update({ relatorio_fechamento: novoRelatorio }).eq('id', caixaEditando.id).eq('empresa_id', sessao.empresa_id);
    if (!error) { setModalEdicao({ visivel: false, dinheiro: '', cartao: '', pix: '' }); carregarHistorico(); }
  };

  return {
    abaInterna, setAbaInterna, movimentacoes, motoboyAtivo, historicoCaixas, dataFiltro,
    valorInformadoDinheiro, setValorInformadoDinheiro, valorInformadoCartao, setValorInformadoCartao, valorInformadoPix, setValorInformadoPix,
    movModal, setMovModal, senhaModal, setSenhaModal, senhaHistorico, setSenhaHistorico, senhaApuracao, setSenhaApuracao,
    mostrarEsperado, setMostrarEsperado, historicoLiberado, acaoPendente, setAcaoPendente, caixaEditando, setCaixaEditando,
    modalEdicao, setModalEdicao, isConsolidating, extratoExpandido, setExtratoExpandido, buscaExtrato, setBuscaExtrato,
    formatarHora, alterarData, renderDataLabel, isHoje, toggleMotoboy, handleSalvarMovimentacao, handleVerificarSenhaHistorico, handleVerificarSenhaApuracao, handleVerificarSenha,
    comandasDoTurno, totaisDossie, comandasExtratoFiltradas, pendenteMotoboy, abrirConfirmacaoMotoboy,
    totalSistemaDinheiro, totalSistemaCartao, totalSistemaPix, totalSuprimentos, totalSangrias, saldoInicial, saldoGavetaEsperado,
    encerrarCaixaConfirmado, salvarEdicaoFechamento, mostrarConfirmacao
  };
}