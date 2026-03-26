'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export default function Header({
  comandaAtiva, setIdSelecionado, setMenuMobileAberto, temaNoturno,
  abaAtiva, fetchData, sessao
}) {
  const [editandoNome, setEditandoNome] = useState(false);
  const [tempNome, setTempNome] = useState('');
  
  const [dadosOperacionais, setDadosOperacionais] = useState({ abertura: null, fechamento: null, local: '' });
  const [linhaDoTempo, setLinhaDoTempo] = useState([]);
  
  const [insights, setInsights] = useState([]);
  const [caixaAberto, setCaixaAberto] = useState(false);
  const [expedienteEncerrado, setExpedienteEncerrado] = useState(false);
  const [alertaFechamento, setAlertaFechamento] = useState(false);

  const [mensagensAtivas, setMensagensAtivas] = useState([]);
  const [indiceMensagem, setIndiceMensagem] = useState(0);

  const carregarConfiguracoes = useCallback(async () => {
    if (!sessao?.empresa_id) return;
    try {
      const { data } = await supabase
        .from('empresas')
        .select('horario_abertura, horario_fechamento, localizacao')
        .eq('id', sessao.empresa_id)
        .single();
      
      if (data) {
        setDadosOperacionais({
          abertura: data.horario_abertura,
          fechamento: data.horario_fechamento,
          local: data.localizacao
        });
        if (data.localizacao) {
          processarInteligencia(data.localizacao, data.horario_abertura, data.horario_fechamento);
        }
      }
    } catch (err) {}
  }, [sessao?.empresa_id]);

  const checarStatusCaixa = useCallback(async () => {
    if (!sessao?.empresa_id) return;
    try {
      const { data, error } = await supabase
        .from('caixas')
        .select('id')
        .eq('empresa_id', sessao.empresa_id)
        .eq('status', 'aberto')
        .limit(1);
      
      if (!error) setCaixaAberto(data && data.length > 0);
    } catch (err) {}
  }, [sessao?.empresa_id]);

  const verificarCicloOperacional = useCallback(() => {
    if (!dadosOperacionais.fechamento || !dadosOperacionais.abertura) return;

    const agora = new Date();
    const currentMin = agora.getHours() * 60 + agora.getMinutes();

    const [hF, mF] = dadosOperacionais.fechamento.split(':').map(Number);
    const [hA, mA] = dadosOperacionais.abertura.split(':').map(Number);

    const fechoMin = hF * 60 + (mF || 0);
    const abroMin = hA * 60 + (mA || 0);
    const cruzaMadrugada = fechoMin < abroMin;

    let isAberto = false;
    let minParaFechar = null;

    if (cruzaMadrugada) {
      if (currentMin >= abroMin) { 
        isAberto = true; minParaFechar = (fechoMin + 24 * 60) - currentMin;
      } else if (currentMin <= fechoMin) { 
        isAberto = true; minParaFechar = fechoMin - currentMin;
      }
    } else {
      if (currentMin >= abroMin && currentMin <= fechoMin) {
        isAberto = true; minParaFechar = fechoMin - currentMin;
      }
    }

    setExpedienteEncerrado(!isAberto);
    setAlertaFechamento(isAberto && minParaFechar <= 10 && minParaFechar > 0);
  }, [dadosOperacionais]);

  const processarInteligencia = async (cidade, abertura, fechamento) => {
    const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    if (!API_KEY || !cidade) return;

    try {
      const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cidade)}&units=metric&lang=pt_br&appid=${API_KEY}`);
      const data = await res.json();

      if (data.list && data.list.length > 0) {
        const agora = new Date();
        const horaAtual = agora.getHours();
        
        let hInicio = abertura ? parseInt(abertura.split(':')[0]) : 17;
        let hFim = fechamento ? parseInt(fechamento.split(':')[0]) : 23;
        const cruzaMadrugada = hFim < hInicio;
        
        let horaStartRender = horaAtual;
        const noTurnoNormal = !cruzaMadrugada && horaAtual >= hInicio && horaAtual <= hFim;
        const noTurnoMadrugada = cruzaMadrugada && (horaAtual >= hInicio || horaAtual <= hFim);
        
        if (!noTurnoNormal && !noTurnoMadrugada) horaStartRender = hInicio;

        const proximasHoras = [];
        let hPointer = horaStartRender;
        for (let i = 0; i < 4; i++) { 
          proximasHoras.push(hPointer);
          if (hPointer === hFim) break;
          hPointer = hPointer === 23 ? 0 : hPointer + 1;
        }

        const timelineFiltrada = proximasHoras.map(hora => {
          const alvoTimestamp = new Date(agora);
          alvoTimestamp.setHours(hora, 0, 0, 0);
          if (hora < horaAtual) alvoTimestamp.setDate(alvoTimestamp.getDate() + 1);

          const maisProximo = data.list.reduce((prev, curr) => 
            (Math.abs(curr.dt * 1000 - alvoTimestamp.getTime()) < Math.abs(prev.dt * 1000 - alvoTimestamp.getTime()) ? curr : prev)
          );

          const cond = maisProximo.weather[0].main.toLowerCase();
          return {
            horaStr: `${hora}h`,
            temp: Math.round(maisProximo.main.temp),
            condicao: cond,
            isRain: cond.includes('rain') || cond.includes('drizzle') || cond.includes('thunderstorm'),
            isCurrent: hora === horaAtual
          };
        });

        setLinhaDoTempo(timelineFiltrada);

        const novosInsights = [];
        const chuvaFutura = timelineFiltrada.find(t => t.isRain && !t.isCurrent);
        const chuvaAgora = timelineFiltrada.find(t => t.isRain && t.isCurrent);
        const calorExtremo = timelineFiltrada.some(t => t.temp >= 32);
        const ehPicoNoturno = horaAtual >= 19 && horaAtual <= 21;
        
        let faltaPouco = (!cruzaMadrugada && (hFim - horaAtual === 1)) || (cruzaMadrugada && (horaAtual < hFim) && (hFim - horaAtual === 1));

        if (chuvaAgora) {
          novosInsights.push("Chuva detectada: provável aumento no tempo de permanência.");
        } else if (chuvaFutura) {
          novosInsights.push(`Previsão de instabilidade às ${chuvaFutura.horaStr}: fluxo pode se concentrar nesta janela.`);
        } 
        
        if (ehPicoNoturno && !faltaPouco) {
          novosInsights.push("Janela de pico ativa: alta densidade operacional esperada.");
        } else if (faltaPouco) {
          novosInsights.push("Turno na reta final: expectativa de desaceleração.");
        } else if (!chuvaAgora && !chuvaFutura && !ehPicoNoturno) {
          novosInsights.push("Período de estabilidade operacional.");
        }

        if (calorExtremo) novosInsights.push("Clima atípico: possíveis variações de consumo no salão.");

        setInsights(novosInsights);
      }
    } catch (err) {
      setInsights(["Sincronizando timeline operacional..."]);
    }
  };

  useEffect(() => {
    carregarConfiguracoes();
    checarStatusCaixa();
  }, [carregarConfiguracoes, checarStatusCaixa]);

  useEffect(() => {
    verificarCicloOperacional();
    const monitorTempo = setInterval(verificarCicloOperacional, 30000); 
    const monitorCaixa = setInterval(checarStatusCaixa, 60000); 
    return () => { clearInterval(monitorTempo); clearInterval(monitorCaixa); };
  }, [verificarCicloOperacional, checarStatusCaixa]);

  useEffect(() => {
    const fila = [];
    if (expedienteEncerrado && caixaAberto) {
      fila.push({ id: 'critico-caixa', tipo: 'critico', icone: 'alerta', texto: 'Pendência crítica: Caixa aberto fora do expediente' });
    }
    if (alertaFechamento) {
      fila.push({ id: 'warn-fecha', tipo: 'alerta', icone: 'relogio', texto: 'Fechamento operacional em 10 minutos' });
    }
    insights.forEach((ins, idx) => {
      fila.push({ id: `ins-${idx}`, tipo: 'insight', icone: 'raio', texto: ins });
    });

    setMensagensAtivas(fila);
  }, [expedienteEncerrado, caixaAberto, alertaFechamento, insights]);

  useEffect(() => {
    if (mensagensAtivas.length <= 1) {
      setIndiceMensagem(0);
      return;
    }
    const interval = setInterval(() => {
      setIndiceMensagem(curr => (curr + 1) % mensagensAtivas.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [mensagensAtivas.length]);


  const salvarNome = async () => {
    if (!tempNome || !tempNome.trim() || tempNome === comandaAtiva?.nome) {
      setEditandoNome(false); return;
    }
    const { error } = await supabase.from('comandas').update({ nome: tempNome }).eq('id', comandaAtiva?.id);
    if (!error && fetchData) await fetchData();
    setEditandoNome(false);
  };

  const alternarTipoComanda = async () => {
    if (!comandaAtiva) return;
    const novoTipo = comandaAtiva?.tipo === 'Balcão' ? 'Delivery' : 'Balcão';
    const { error } = await supabase.from('comandas').update({ tipo: novoTipo }).eq('id', comandaAtiva?.id);
    if (!error && fetchData) await fetchData();
  };

  const mapAbaTitulo = { comandas: 'Terminal', fechadas: 'Histórico', faturamento: 'Métricas', caixa: 'Caixa', fidelidade: 'Clientes' };

  const renderIconeBanner = (iconeName) => {
    if (iconeName === 'alerta') return <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0"></div>;
    if (iconeName === 'relogio') return <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0"></div>;
    return <svg className="w-3.5 h-3.5 opacity-60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
  };

  const renderClimaIcon = (condicao, temaNoturno, isCurrent) => {
    let classes = `w-[14px] h-[14px] shrink-0 transition-colors duration-300 ${isCurrent ? (temaNoturno ? 'text-zinc-100' : 'text-zinc-900') : (temaNoturno ? 'text-zinc-500' : 'text-zinc-400')}`;
    if (condicao.includes('rain') || condicao.includes('drizzle')) return <svg className={classes} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 22v-2m-4 2v-2m8 2v-2" /></svg>;
    if (condicao.includes('cloud')) return <svg className={classes} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" /></svg>;
    return <svg className={classes} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="5" strokeLinecap="round" strokeLinejoin="round" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>;
  };

  return (
    <header className={`flex items-center justify-between px-6 h-[68px] shrink-0 border-b sticky top-0 z-40 transition-colors duration-500 backdrop-blur-2xl ${temaNoturno ? 'bg-[#09090B]/70 border-white/[0.05]' : 'bg-white/80 border-black/[0.05]'}`}>
      
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button onClick={() => setMenuMobileAberto(true)} className={`xl:hidden p-1.5 -ml-1.5 rounded-md transition duration-200 active:scale-95 outline-none ${temaNoturno ? 'text-zinc-400 hover:bg-white/10 hover:text-white' : 'text-zinc-600 hover:bg-black/5 hover:text-zinc-900'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>

        {comandaAtiva ? (
          <button onClick={() => { setIdSelecionado(null); setEditandoNome(false); }} className={`group flex items-center gap-2 px-1.5 py-1 -ml-1.5 rounded-md transition-all duration-200 text-[13px] font-medium tracking-tight outline-none ${temaNoturno ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-900'}`}>
            <svg className={`w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-x-1 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            <span className="hidden sm:inline">Retornar</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-1.5 h-1.5 rounded-full ${temaNoturno ? 'bg-white/30' : 'bg-black/30'}`}></div>
            <h1 className={`font-medium text-[15px] tracking-tight ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>
              {mapAbaTitulo[abaAtiva] || 'Visão Geral'}
            </h1>
          </div>
        )}
      </div>

      <div className="flex justify-center items-center flex-[2] min-w-0 px-4 h-full relative">
        {comandaAtiva ? (
          <div className={`flex items-center justify-between p-[3px] rounded-xl border transition-all duration-300 w-full max-w-[340px] shadow-sm ${temaNoturno ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-black/[0.02] border-black/[0.06]'}`}>
            <div className="flex-1 relative min-w-0">
              {editandoNome ? (
                <input 
                  autoFocus
                  className={`w-full text-[13px] font-medium tracking-tight px-3 py-1.5 rounded-[8px] outline-none transition-all ${temaNoturno ? 'bg-white/10 text-white' : 'bg-black/[0.05] text-zinc-900'}`}
                  value={tempNome} onChange={e => setTempNome(e.target.value)} onBlur={salvarNome} onKeyDown={e => e.key === 'Enter' && salvarNome()}
                />
              ) : (
                <div onClick={() => { setTempNome(comandaAtiva?.nome || ''); setEditandoNome(true); }} className={`w-full px-3 py-1.5 rounded-[8px] cursor-text transition-colors flex items-center gap-2 overflow-hidden ${temaNoturno ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.04]'}`}>
                  <span className={`text-[13px] font-medium tracking-tight truncate ${temaNoturno ? 'text-zinc-200' : 'text-zinc-900'}`}>{comandaAtiva?.nome || 'Sem identificação'}</span>
                  <svg className="w-3 h-3 shrink-0 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                </div>
              )}
            </div>
            <div className={`w-[1px] h-4 mx-1.5 ${temaNoturno ? 'bg-white/10' : 'bg-black/[0.08]'}`}></div>
            <button onClick={alternarTipoComanda} className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-medium tracking-tight transition-all active:scale-[0.97] ${comandaAtiva?.tipo === 'Delivery' ? (temaNoturno ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-700 border border-indigo-100') : (temaNoturno ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/5')}`}>
              {comandaAtiva?.tipo}
            </button>
          </div>
        ) : (abaAtiva !== 'faturamento' && mensagensAtivas.length > 0) ? (
          <div className="relative w-full max-w-[380px] h-[32px] flex justify-center items-center">
            {mensagensAtivas.map((msg, i) => {
              const isAct = i === indiceMensagem;
              
              let styleClasses = temaNoturno ? 'bg-white/[0.04] border-white/[0.06] text-zinc-300' : 'bg-white border-black/[0.06] text-zinc-700 shadow-sm';
              if (msg.tipo === 'critico') styleClasses = temaNoturno ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700';
              if (msg.tipo === 'alerta') styleClasses = temaNoturno ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700';

              return (
                <div 
                  key={msg.id}
                  className={`absolute flex items-center gap-2.5 px-4 py-1.5 rounded-full border transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]
                    ${isAct ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-2 scale-[0.98] pointer-events-none'}
                    ${styleClasses}
                  `}
                >
                  {renderIconeBanner(msg.icone)}
                  <span className="text-[12px] font-medium tracking-tight whitespace-nowrap">
                    {msg.texto}
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
      
      <div className="flex-1 flex justify-end min-w-0">
        {linhaDoTempo.length > 0 && !comandaAtiva && (
          <div className={`hidden md:flex items-center p-[3px] rounded-full border transition-all duration-300 ${temaNoturno ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-black/[0.02] border-black/[0.05] shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]'}`}>
            {linhaDoTempo.map((item, index) => (
              <div 
                key={index} 
                className={`flex items-center gap-1.5 px-3 py-1.5 min-w-[54px] rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  item.isCurrent 
                    ? (temaNoturno ? 'bg-white/[0.1] shadow-sm' : 'bg-white shadow-sm ring-1 ring-black/[0.05]') 
                    : `opacity-${Math.max(40, 90 - (index * 20))} hover:opacity-100 ${temaNoturno ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.04]'}`
                }`}
                title={item.condicao}
              >
                <span className={`text-[10px] uppercase font-semibold tracking-wide ${item.isCurrent ? (temaNoturno ? 'text-zinc-200' : 'text-zinc-800') : (temaNoturno ? 'text-zinc-500' : 'text-zinc-500')}`}>
                  {item.horaStr}
                </span>
                <div className="flex items-center gap-1">
                  {renderClimaIcon(item.condicao, temaNoturno, item.isCurrent)}
                  <span className={`text-[11px] font-semibold tracking-tight ${item.isCurrent ? (temaNoturno ? 'text-white' : 'text-zinc-900') : (temaNoturno ? 'text-zinc-500' : 'text-zinc-500')}`}>
                    {item.temp}°
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
    </header>
  );
}