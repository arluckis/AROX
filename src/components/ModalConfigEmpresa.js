'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const CIDADES_POPULARES = [
  "Rio Branco, AC, BR", "Maceió, AL, BR", "Macapá, AP, BR", "Manaus, AM, BR",
  "Salvador, BA, BR", "Feira de Santana, BA, BR", "Fortaleza, CE, BR",
  "Brasília, DF, BR", "Vitória, ES, BR", "Vila Velha, ES, BR",
  "Goiânia, GO, BR", "São Luís, MA, BR", "Cuiabá, MT, BR",
  "Campo Grande, MS, BR", "Belo Horizonte, MG, BR", "Uberlândia, MG, BR",
  "Belém, PA, BR", "João Pessoa, PB, BR", "Campina Grande, PB, BR",
  "Curitiba, PR, BR", "Londrina, PR, BR", "Maringá, PR, BR",
  "Recife, PE, BR", "Jaboatão dos Guararapes, PE, BR", "Teresina, PI, BR",
  "Rio de Janeiro, RJ, BR", "Niterói, RJ, BR", "São Gonçalo, RJ, BR",
  "Natal, RN, BR", "Parnamirim, RN, BR", "Mossoró, RN, BR", "Caicó, RN, BR",
  "Porto Alegre, RS, BR", "Caxias do Sul, RS, BR", "Porto Velho, RO, BR",
  "Boa Vista, RR, BR", "Florianópolis, SC, BR", "Joinville, SC, BR",
  "São Paulo, SP, BR", "Campinas, SP, BR", "Guarulhos, SP, BR",
  "Aracaju, SE, BR", "Palmas, TO, BR"
];

export default function ModalConfigEmpresa({
  temaNoturno,
  nomeEmpresaEdicao,
  setNomeEmpresaEdicao,
  logoEmpresaEdicao,
  setLogoEmpresaEdicao,
  nomeUsuarioEdicao,
  setNomeUsuarioEdicao,
  planoUsuario,
  salvarConfigEmpresa,
  setMostrarConfigEmpresa,
  alterarSenhaConta,
  deletarWorkspace // Nova Prop via Backend-First
}) {
  const [abaMobile, setAbaMobile] = useState('identidade'); 

  // Estados Senha
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenhas, setMostrarSenhas] = useState(false);

  // Estados Delecao (Danger Zone)
  const [confirmacaoDelete, setConfirmacaoDelete] = useState('');

  // Estados Operação
  const [localizacao, setLocalizacao] = useState('');
  const [sugestoesLocalizacao, setSugestoesLocalizacao] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [horarioAbertura, setHorarioAbertura] = useState('');
  const [horarioFechamento, setHorarioFechamento] = useState('');
  const [isCarregandoOperacao, setIsCarregandoOperacao] = useState(true);

  useEffect(() => {
    const buscarOperacao = async () => {
      try {
        const sessionData = localStorage.getItem('bessa_session');
        if (!sessionData) return;
        const sessao = JSON.parse(sessionData);
        if (!sessao?.empresa_id) return;

        const { data, error } = await supabase
          .from('empresas')
          .select('localizacao, horario_abertura, horario_fechamento')
          .eq('id', sessao.empresa_id)
          .single();

        if (data && !error) {
          setLocalizacao(data.localizacao || '');
          setHorarioAbertura(data.horario_abertura ? data.horario_abertura.substring(0, 5) : '08:00');
          setHorarioFechamento(data.horario_fechamento ? data.horario_fechamento.substring(0, 5) : '23:00');
        }
      } catch (err) {
        console.error("Erro ao buscar dados operacionais.");
      } finally {
        setIsCarregandoOperacao(false);
      }
    };
    buscarOperacao();
  }, []);

  const handleLocalizacaoChange = (e) => {
    const val = e.target.value;
    setLocalizacao(val);

    if (val.trim().length > 1) {
      const query = val.toLowerCase().trim();
      const startsWith = CIDADES_POPULARES.filter(c => c.toLowerCase().startsWith(query));
      const includes = CIDADES_POPULARES.filter(c => c.toLowerCase().includes(query) && !c.toLowerCase().startsWith(query));
      
      setSugestoesLocalizacao([...startsWith, ...includes].slice(0, 5));
      setMostrarSugestoes(true);
    } else {
      setMostrarSugestoes(false);
    }
  };

  const selecionarSugestao = (cidade) => {
    setLocalizacao(cidade);
    setMostrarSugestoes(false);
  };

  const normalizarLocalizacao = (str) => {
    if (!str) return '';
    let limpa = str.trim().replace(/\s+/g, ' ');
    if (limpa.toUpperCase().endsWith(', BR')) return limpa; 
    const match = limpa.match(/^(.+?)[-,\s]+([a-zA-Z]{2})$/);
    if (match) {
      const cidade = match[1].trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      const uf = match[2].toUpperCase();
      return `${cidade}, ${uf}, BR`;
    }
    return limpa;
  };

  const handleSalvarGeral = async () => {
    try {
      const sessionData = localStorage.getItem('bessa_session');
      if (sessionData) {
        const sessao = JSON.parse(sessionData);
        if (sessao?.empresa_id) {
          const localizacaoFinal = normalizarLocalizacao(localizacao);
          setLocalizacao(localizacaoFinal); 
          await supabase.from('empresas').update({
            localizacao: localizacaoFinal, horario_abertura: horarioAbertura, horario_fechamento: horarioFechamento
          }).eq('id', sessao.empresa_id);
        }
      }
    } catch (err) { }
    salvarConfigEmpresa(); 
  };

  const formatarData = (dataStr) => {
    if (!dataStr) return 'Não registrada';
    const d = new Date(dataStr);
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
  };

  const regrasSenha = [
    { id: 'tamanho', texto: 'Mín. 8 caracteres', valido: novaSenha.length >= 8 },
    { id: 'maiuscula', texto: 'Maiúscula e Minúscula', valido: /[a-z]/.test(novaSenha) && /[A-Z]/.test(novaSenha) },
    { id: 'numero', texto: 'Pelo menos 1 número', valido: /[0-9]/.test(novaSenha) },
    { id: 'especial', texto: 'Caractere especial', valido: /[^A-Za-z0-9]/.test(novaSenha) },
  ];

  const forcaSenha = regrasSenha.filter(r => r.valido).length;
  const coresProgress = ['bg-rose-500', 'bg-rose-500', 'bg-amber-500', 'bg-emerald-400', 'bg-emerald-500'];
  const corAtual = coresProgress[forcaSenha];
  const senhaValida = forcaSenha === 4 && novaSenha === confirmarSenha && novaSenha.length > 0;

  const nomePlano = planoUsuario?.nome?.toLowerCase() || 'free';
  const isPremium = nomePlano.includes('premium') || nomePlano.includes('pro') || nomePlano.includes('anual') || nomePlano.includes('mensal');
  const nomePlanoDisplay = planoUsuario?.nome ? (planoUsuario.nome.charAt(0).toUpperCase() + planoUsuario.nome.slice(1)) : 'Starter Plan';

  const confirmarDeleteBloqueado = confirmacaoDelete !== 'DELETAR-AROX';

  return (
    <div className="fixed inset-0 flex flex-col sm:items-center justify-start sm:justify-center p-0 sm:p-6 z-[120] overflow-hidden">
      <div className="absolute inset-0 bg-black/60 sm:bg-black/50 backdrop-blur-sm sm:backdrop-blur-md transition-opacity duration-300" onClick={() => setMostrarConfigEmpresa(false)}></div>

      <div className={`relative w-full h-full sm:h-auto sm:max-h-[90vh] max-w-5xl flex flex-col sm:rounded-2xl shadow-2xl animate-in sm:zoom-in-95 slide-in-from-bottom-full sm:slide-in-from-bottom-0 duration-300 overflow-hidden z-10 transition-colors ${temaNoturno ? 'bg-[#111111] sm:border border-white/5' : 'bg-[#FAFAFA] sm:border border-zinc-200'}`}>
        
        {/* HEADER */}
        <div className={`flex justify-between items-center px-6 py-5 border-b shrink-0 ${temaNoturno ? 'border-white/[0.06] bg-[#0A0A0A]/80' : 'border-zinc-200 bg-white/80'} backdrop-blur-xl`}>
          <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-lg border shadow-sm ${temaNoturno ? 'bg-white/5 border-white/10 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </div>
            <div>
              <h2 className={`text-[16px] font-semibold tracking-tight leading-none ${temaNoturno ? 'text-white' : 'text-zinc-900'}`}>Workspace</h2>
              <p className={`text-[12px] font-medium mt-1.5 ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Ajustes e inteligência da plataforma</p>
            </div>
          </div>
          <button onClick={() => setMostrarConfigEmpresa(false)} className={`p-2 rounded-md transition-all active:scale-95 outline-none ${temaNoturno ? 'bg-transparent text-zinc-400 hover:bg-white/[0.08] hover:text-white' : 'bg-transparent text-zinc-500 hover:bg-black/[0.04] hover:text-zinc-900'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* NAVEGAÇÃO MOBILE */}
        <div className={`sm:hidden flex border-b shrink-0 px-2 ${temaNoturno ? 'border-white/5 bg-[#0A0A0A]' : 'border-zinc-200 bg-white'}`}>
          <button onClick={() => setAbaMobile('identidade')} className={`flex-1 py-3.5 text-[11px] font-semibold uppercase tracking-widest transition-colors relative ${abaMobile === 'identidade' ? (temaNoturno ? 'text-white' : 'text-zinc-900') : (temaNoturno ? 'text-zinc-500' : 'text-zinc-400')}`}>
            Geral
            {abaMobile === 'identidade' && <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-t-full ${temaNoturno ? 'bg-white' : 'bg-zinc-900'}`}></span>}
          </button>
          <button onClick={() => setAbaMobile('operacao')} className={`flex-1 py-3.5 text-[11px] font-semibold uppercase tracking-widest transition-colors relative ${abaMobile === 'operacao' ? (temaNoturno ? 'text-white' : 'text-zinc-900') : (temaNoturno ? 'text-zinc-500' : 'text-zinc-400')}`}>
            Operação
            {abaMobile === 'operacao' && <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-t-full ${temaNoturno ? 'bg-white' : 'bg-zinc-900'}`}></span>}
          </button>
          <button onClick={() => setAbaMobile('seguranca')} className={`flex-1 py-3.5 text-[11px] font-semibold uppercase tracking-widest transition-colors relative ${abaMobile === 'seguranca' ? (temaNoturno ? 'text-white' : 'text-zinc-900') : (temaNoturno ? 'text-zinc-500' : 'text-zinc-400')}`}>
            Acesso
            {abaMobile === 'seguranca' && <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-t-full ${temaNoturno ? 'bg-white' : 'bg-zinc-900'}`}></span>}
          </button>
        </div>

        {/* ÁREA DE CONTEÚDO */}
        <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col sm:flex-row relative">
          
          {/* COLUNA 1: IDENTIDADE */}
          <div className={`p-6 sm:p-8 flex-col gap-6 sm:w-1/3 sm:border-r ${abaMobile === 'identidade' ? 'flex' : 'hidden sm:flex'} ${temaNoturno ? 'border-white/[0.06] bg-[#111111]' : 'border-zinc-200 bg-white'}`}>
            <div className="space-y-1 mb-2">
              <h3 className={`text-[14px] font-semibold tracking-tight ${temaNoturno ? 'text-white' : 'text-zinc-900'}`}>Identidade Visual</h3>
              <p className={`text-[12px] ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Informações da sua marca</p>
            </div>
            <div className="space-y-5">
              <div className="group">
                <label className={`text-[11px] font-semibold tracking-wide mb-1.5 block uppercase ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Nome do Estabelecimento</label>
                <input type="text" value={nomeEmpresaEdicao} onChange={e => setNomeEmpresaEdicao(e.target.value)} className={`w-full px-3.5 py-2.5 rounded-lg border outline-none text-[13px] font-semibold transition-all shadow-sm focus:ring-1 focus:ring-offset-0 ${temaNoturno ? 'bg-white/[0.02] border-white/10 focus:border-white/20 focus:ring-white/20 text-white' : 'bg-black/[0.02] border-zinc-200 focus:border-zinc-300 focus:ring-zinc-200 text-zinc-900'}`} />
              </div>
              <div className="group">
                <label className={`text-[11px] font-semibold tracking-wide mb-1.5 block uppercase ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Gestor Responsável</label>
                <input type="text" value={nomeUsuarioEdicao} onChange={e => setNomeUsuarioEdicao(e.target.value)} className={`w-full px-3.5 py-2.5 rounded-lg border outline-none text-[13px] font-semibold transition-all shadow-sm focus:ring-1 focus:ring-offset-0 ${temaNoturno ? 'bg-white/[0.02] border-white/10 focus:border-white/20 focus:ring-white/20 text-white' : 'bg-black/[0.02] border-zinc-200 focus:border-zinc-300 focus:ring-zinc-200 text-zinc-900'}`} />
              </div>
              <div className="group">
                <label className={`text-[11px] font-semibold tracking-wide mb-1.5 block uppercase ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Logotipo (URL)</label>
                <div className="flex gap-3 items-center">
                  <div className={`w-11 h-11 rounded-lg border shrink-0 overflow-hidden flex items-center justify-center p-0.5 shadow-sm ${temaNoturno ? 'border-white/10 bg-[#161a20]' : 'border-zinc-200 bg-white'}`}>
                    <img src={logoEmpresaEdicao || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} alt="Preview" className="w-full h-full object-cover rounded-md" onError={(e) => e.target.src='https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} />
                  </div>
                  <input type="text" placeholder="https://..." value={logoEmpresaEdicao} onChange={e => setLogoEmpresaEdicao(e.target.value)} className={`w-full px-3.5 py-2.5 rounded-lg border outline-none text-[13px] font-semibold transition-all shadow-sm focus:ring-1 focus:ring-offset-0 ${temaNoturno ? 'bg-white/[0.02] border-white/10 focus:border-white/20 focus:ring-white/20 text-white' : 'bg-black/[0.02] border-zinc-200 focus:border-zinc-300 focus:ring-zinc-200 text-zinc-900'}`} />
                </div>
              </div>
            </div>
          </div>

          {/* COLUNA 2: OPERACIONAL */}
          <div className={`p-6 sm:p-8 flex-col gap-6 sm:w-1/3 sm:border-r ${abaMobile === 'operacao' ? 'flex' : 'hidden sm:flex'} ${temaNoturno ? 'border-white/[0.06] bg-[#111111]' : 'border-zinc-200 bg-white'}`}>
            <div className="space-y-1 mb-2">
              <h3 className={`text-[14px] font-semibold tracking-tight ${temaNoturno ? 'text-white' : 'text-zinc-900'}`}>Parâmetros Operacionais</h3>
              <p className={`text-[12px] ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Inteligência de clima e alertas</p>
            </div>
            
            {isCarregandoOperacao ? (
              <div className={`animate-pulse h-10 w-full rounded-md ${temaNoturno ? 'bg-white/5' : 'bg-black/5'}`}></div>
            ) : (
              <div className="space-y-5">
                <div className="group relative">
                  <label className={`text-[11px] font-semibold tracking-wide mb-1.5 block uppercase ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Localização (Clima)</label>
                  <input 
                    type="text" placeholder="Ex: Parnamirim, RN, BR" value={localizacao} onChange={handleLocalizacaoChange}
                    onFocus={() => { if(localizacao.trim().length > 1) setMostrarSugestoes(true); }} onBlur={() => setTimeout(() => setMostrarSugestoes(false), 200)}
                    className={`w-full px-3.5 py-2.5 rounded-lg border outline-none text-[13px] font-semibold transition-all shadow-sm focus:ring-1 focus:ring-offset-0 ${temaNoturno ? 'bg-white/[0.02] border-white/10 focus:border-white/20 focus:ring-white/20 text-white placeholder-zinc-600' : 'bg-black/[0.02] border-zinc-200 focus:border-zinc-300 focus:ring-zinc-200 text-zinc-900 placeholder-zinc-400'}`} 
                  />
                  {mostrarSugestoes && sugestoesLocalizacao.length > 0 && (
                    <ul className={`absolute left-0 right-0 z-50 mt-1.5 py-1.5 rounded-xl border shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-48 overflow-y-auto scrollbar-hide ${temaNoturno ? 'bg-[#1A1A1A] border-white/10' : 'bg-white border-zinc-200'}`}>
                      {sugestoesLocalizacao.map((sugestao, idx) => (
                        <li key={idx} onClick={() => selecionarSugestao(sugestao)} className={`px-3.5 py-2 text-[13px] font-medium cursor-pointer transition-colors flex items-center gap-2 ${temaNoturno ? 'text-zinc-300 hover:bg-white/5 hover:text-white' : 'text-zinc-700 hover:bg-black/5 hover:text-zinc-900'}`}>
                          <svg className={`w-3.5 h-3.5 opacity-50 ${temaNoturno ? 'text-white' : 'text-black'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                          {sugestao}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className={`text-[10px] mt-1.5 leading-relaxed ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Selecione uma cidade para melhorar as métricas de previsão no Header.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className={`text-[11px] font-semibold tracking-wide mb-1.5 block uppercase ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Abertura</label>
                    <input type="time" value={horarioAbertura} onChange={e => setHorarioAbertura(e.target.value)} className={`w-full px-3.5 py-2.5 rounded-lg border outline-none text-[13px] font-semibold transition-all shadow-sm focus:ring-1 focus:ring-offset-0 ${temaNoturno ? 'bg-white/[0.02] border-white/10 focus:border-white/20 focus:ring-white/20 text-white' : 'bg-black/[0.02] border-zinc-200 focus:border-zinc-300 focus:ring-zinc-200 text-zinc-900'}`} />
                  </div>
                  <div className="group">
                    <label className={`text-[11px] font-semibold tracking-wide mb-1.5 block uppercase ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Fechamento</label>
                    <input type="time" value={horarioFechamento} onChange={e => setHorarioFechamento(e.target.value)} className={`w-full px-3.5 py-2.5 rounded-lg border outline-none text-[13px] font-semibold transition-all shadow-sm focus:ring-1 focus:ring-offset-0 ${temaNoturno ? 'bg-white/[0.02] border-white/10 focus:border-white/20 focus:ring-white/20 text-white' : 'bg-black/[0.02] border-zinc-200 focus:border-zinc-300 focus:ring-zinc-200 text-zinc-900'}`} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* COLUNA 3: PLANO E SEGURANÇA (COM ZONA DE PERIGO) */}
          <div className={`p-6 sm:p-8 flex-col gap-6 sm:w-1/3 ${abaMobile === 'seguranca' ? 'flex' : 'hidden sm:flex'} ${temaNoturno ? 'bg-[#0A0A0A]' : 'bg-[#FAFAFA]'}`}>
            
            <div>
              <div className={`p-4 rounded-xl border flex flex-col gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${temaNoturno ? 'bg-gradient-to-br from-zinc-900 to-[#0A0A0A] border-white/[0.08]' : 'bg-gradient-to-br from-white to-zinc-50 border-zinc-200/80 shadow-sm'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Assinatura Ativa</span>
                    <span className={`text-[15px] font-semibold tracking-tight ${temaNoturno ? 'text-white' : 'text-zinc-900'}`}>{nomePlanoDisplay}</span>
                  </div>
                  <div className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${isPremium ? (temaNoturno ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200') : (temaNoturno ? 'bg-white/5 text-zinc-400 border-white/10' : 'bg-zinc-100 text-zinc-600 border-zinc-200')}`}>
                    {isPremium ? 'Premium' : 'Básico'}
                  </div>
                </div>
                <div className={`pt-3 border-t mt-1 flex flex-col gap-0.5 ${temaNoturno ? 'border-white/5' : 'border-zinc-200'}`}>
                   <span className={`text-[10px] font-bold uppercase tracking-widest ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Membro Desde</span>
                   <span className={`text-[12px] font-mono font-medium ${temaNoturno ? 'text-zinc-300' : 'text-zinc-700'}`}>{formatarData(planoUsuario?.criado_em)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className={`text-[14px] font-semibold tracking-tight mb-2 ${temaNoturno ? 'text-white' : 'text-zinc-900'}`}>Credenciais</h3>
              <input type={mostrarSenhas ? "text" : "password"} placeholder="Senha Atual" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} className={`w-full px-3.5 py-2.5 rounded-lg border outline-none text-[13px] font-semibold transition-all shadow-sm focus:ring-1 focus:ring-offset-0 ${temaNoturno ? 'bg-white/[0.02] border-white/10 focus:border-white/20 focus:ring-white/20 text-white placeholder-zinc-600' : 'bg-black/[0.02] border-zinc-200 focus:border-zinc-300 focus:ring-zinc-200 text-zinc-900 placeholder-zinc-400'}`} />
              <div className="grid grid-cols-1 gap-3">
                <input type={mostrarSenhas ? "text" : "password"} placeholder="Nova Senha" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} className={`w-full px-3.5 py-2.5 rounded-lg border outline-none text-[13px] font-semibold transition-all shadow-sm focus:ring-1 focus:ring-offset-0 ${temaNoturno ? 'bg-white/[0.02] border-white/10 focus:border-white/20 focus:ring-white/20 text-white placeholder-zinc-600' : 'bg-black/[0.02] border-zinc-200 focus:border-zinc-300 focus:ring-zinc-200 text-zinc-900 placeholder-zinc-400'}`} />
                <input type={mostrarSenhas ? "text" : "password"} placeholder="Confirmar Nova" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} className={`w-full px-3.5 py-2.5 rounded-lg border outline-none text-[13px] font-semibold transition-all shadow-sm focus:ring-1 focus:ring-offset-0 ${novaSenha && confirmarSenha && novaSenha !== confirmarSenha ? 'border-rose-500/50 focus:border-rose-500/50' : (temaNoturno ? 'border-white/10 focus:border-white/20' : 'border-zinc-200 focus:border-zinc-300')} ${temaNoturno ? 'bg-white/[0.02] text-white placeholder-zinc-600' : 'bg-black/[0.02] text-zinc-900 placeholder-zinc-400'}`} />
              </div>
              
              <button disabled={!senhaValida || !senhaAtual} onClick={() => alterarSenhaConta(senhaAtual, novaSenha)} className={`w-full py-2.5 rounded-lg text-[13px] font-bold mt-2 transition-all shadow-sm outline-none flex items-center justify-center gap-2 ${senhaValida && senhaAtual ? (temaNoturno ? 'bg-white text-zinc-900 hover:bg-zinc-200 active:scale-[0.98]' : 'bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98]') : (temaNoturno ? 'bg-white/5 text-zinc-500 cursor-not-allowed' : 'bg-black/5 text-zinc-400 cursor-not-allowed')}`}>
                Atualizar Senha
              </button>
            </div>

            {/* ZONA DE PERIGO (Exclusão Real) */}
            <div className={`mt-4 pt-6 border-t ${temaNoturno ? 'border-rose-900/30' : 'border-rose-200'}`}>
              <h3 className="text-[14px] font-semibold tracking-tight text-rose-500 mb-1">Zona de Perigo</h3>
              <p className={`text-[11px] leading-relaxed mb-4 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>A deleção apaga permanentemente todos os seus dados, usuários e histórico. Esta ação <span className="font-bold underline">não pode ser desfeita</span>.</p>
              
              <div className="flex flex-col gap-2">
                <input 
                  type="text" 
                  placeholder="Digite DELETAR-AROX" 
                  value={confirmacaoDelete} 
                  onChange={e => setConfirmacaoDelete(e.target.value)} 
                  className={`w-full px-3.5 py-2.5 rounded-lg border outline-none text-[12px] font-mono font-semibold transition-all focus:ring-1 focus:ring-offset-0 ${temaNoturno ? 'bg-rose-500/5 border-rose-500/20 focus:border-rose-500 text-rose-300 placeholder-rose-900' : 'bg-rose-50 border-rose-200 focus:border-rose-400 text-rose-900 placeholder-rose-300'}`} 
                />
                <button 
                  disabled={confirmarDeleteBloqueado} 
                  onClick={deletarWorkspace} 
                  className={`w-full py-2.5 rounded-lg text-[13px] font-bold transition-all shadow-sm outline-none flex items-center justify-center gap-2 ${confirmarDeleteBloqueado ? (temaNoturno ? 'bg-white/5 text-zinc-600 cursor-not-allowed' : 'bg-black/5 text-zinc-400 cursor-not-allowed') : 'bg-rose-600 hover:bg-rose-700 text-white active:scale-[0.98]'}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Deletar Permanentemente
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER FIXO */}
        <div className={`p-5 sm:p-6 border-t shrink-0 flex justify-end ${temaNoturno ? 'border-white/[0.06] bg-[#0A0A0A]/80' : 'border-zinc-200 bg-white/80'} backdrop-blur-xl`}>
          <button onClick={handleSalvarGeral} className={`w-full sm:w-auto px-8 py-2.5 rounded-lg text-[13px] font-bold transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 outline-none ${temaNoturno ? 'bg-white text-zinc-900 hover:bg-zinc-200 shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-md'}`}>
            Salvar Workspace
          </button>
        </div>

      </div>
    </div>
  );
}