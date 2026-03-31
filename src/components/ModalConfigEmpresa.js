'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AdminProdutos from './AdminProdutos';
import AdminDelivery from './AdminDelivery';
import ModalConfigTags from './ModalConfigTags';

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

export default function ModalConfigEmpresa(props) {
  const {
    temaNoturno, sessao, setMostrarConfigEmpresa, tagsGlobais, setTagsGlobais,
    nomeEmpresaEdicao, setNomeEmpresaEdicao, logoEmpresaEdicao, setLogoEmpresaEdicao,
    nomeUsuarioEdicao, setNomeUsuarioEdicao, planoUsuario, salvarConfigEmpresa, alterarSenhaConta, deletarWorkspace
  } = props;

  const [abaPrincipal, setAbaPrincipal] = useState('workspace'); 
  
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenhas, setMostrarSenhas] = useState(false);
  const [localizacao, setLocalizacao] = useState('');
  const [sugestoesLocalizacao, setSugestoesLocalizacao] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [horarioAbertura, setHorarioAbertura] = useState('');
  const [horarioFechamento, setHorarioFechamento] = useState('');
  const [isCarregandoOperacao, setIsCarregandoOperacao] = useState(true);

  const ID_EMPRESA_REAL = sessao?.empresa_id;

  useEffect(() => {
    const buscarOperacao = async () => {
      try {
        if (!ID_EMPRESA_REAL) return;
        const { data, error } = await supabase.from('empresas').select('localizacao, horario_abertura, horario_fechamento').eq('id', ID_EMPRESA_REAL).single();
        if (data && !error) {
          setLocalizacao(data.localizacao || '');
          setHorarioAbertura(data.horario_abertura ? data.horario_abertura.substring(0, 5) : '08:00');
          setHorarioFechamento(data.horario_fechamento ? data.horario_fechamento.substring(0, 5) : '23:00');
        }
      } catch (err) {
      } finally {
        setIsCarregandoOperacao(false);
      }
    };
    if (abaPrincipal === 'workspace') buscarOperacao();
  }, [abaPrincipal, ID_EMPRESA_REAL]);

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

  const selecionarSugestao = (sugestao) => {
    setLocalizacao(sugestao);
    setMostrarSugestoes(false);
  };

  const handleSalvarGeral = async () => {
    try {
      if (ID_EMPRESA_REAL) {
        const localizacaoFinal = normalizarLocalizacao(localizacao);
        setLocalizacao(localizacaoFinal); 
        await supabase.from('empresas').update({
          localizacao: localizacaoFinal, horario_abertura: horarioAbertura, horario_fechamento: horarioFechamento
        }).eq('id', ID_EMPRESA_REAL);
      }
    } catch (err) { }
    if(salvarConfigEmpresa) salvarConfigEmpresa(); 
  };

  const regrasSenha = [
    { id: 'tamanho', texto: 'Mín. 8 caracteres', valido: novaSenha.length >= 8 },
    { id: 'maiuscula', texto: 'Maiúscula e Minúscula', valido: /[a-z]/.test(novaSenha) && /[A-Z]/.test(novaSenha) },
    { id: 'numero', texto: 'Pelo menos 1 número', valido: /[0-9]/.test(novaSenha) },
    { id: 'especial', texto: 'Caractere especial', valido: /[^A-Za-z0-9]/.test(novaSenha) },
  ];
  const forcaSenha = regrasSenha.filter(r => r.valido).length;
  const senhaValida = forcaSenha === 4 && novaSenha === confirmarSenha && novaSenha.length > 0;

  const nomePlano = planoUsuario?.nome?.toLowerCase() || 'free';
  const isPremium = nomePlano.includes('premium') || nomePlano.includes('pro') || nomePlano.includes('anual') || nomePlano.includes('mensal');
  const nomePlanoDisplay = planoUsuario?.nome ? (planoUsuario.nome.charAt(0).toUpperCase() + planoUsuario.nome.slice(1)) : 'Starter Plan';

  const labelArox = `text-[10px] font-bold uppercase tracking-widest block mb-2 ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`;
  const inputArox = `w-full px-4 py-3 rounded-[12px] border outline-none text-[13px] font-semibold transition-all shadow-inner focus:ring-1 focus:ring-offset-0 ${temaNoturno ? 'bg-white/[0.03] border-white/10 focus:border-white/30 focus:ring-white/20 text-white placeholder-zinc-600' : 'bg-black/[0.02] border-zinc-200 focus:border-zinc-400 focus:ring-zinc-200 text-zinc-900 placeholder-zinc-400'}`;
  const cardPanel = `p-6 sm:p-8 rounded-[24px] border ${temaNoturno ? 'bg-[#0E0E10] border-white/[0.06] shadow-md' : 'bg-white border-zinc-200 shadow-sm'} flex flex-col gap-6 w-full relative overflow-hidden`;

  return (
    <div className={`fixed inset-0 z-[120] flex flex-col animate-in fade-in duration-300 ${temaNoturno ? 'bg-[#050505] text-zinc-100' : 'bg-[#FAFAFA] text-zinc-900'}`}>
      
      {/* HEADER NAVEGAÇÃO SUPERIOR */}
      <header className={`h-[68px] border-b shrink-0 flex items-center justify-between px-4 sm:px-8 ${temaNoturno ? 'bg-[#0A0A0A]/80 border-white/[0.06]' : 'bg-white/80 border-zinc-200'} backdrop-blur-xl`}>
        <div className="flex items-center gap-6 sm:gap-10 w-full">
          <div className="hidden sm:flex items-center gap-3 shrink-0 mr-4">
            <div className={`p-2 rounded-lg border shadow-sm ${temaNoturno ? 'bg-white/5 border-white/10 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <h2 className="text-[16px] font-semibold tracking-tight leading-none">Ajustes do Sistema</h2>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide w-full sm:w-auto pb-1 sm:pb-0 pt-1 sm:pt-0">
            {[
              { id: 'workspace', label: 'Workspace' },
              { id: 'catalogo', label: 'Catálogo' },
              { id: 'delivery', label: 'Delivery' },
              { id: 'tags', label: 'Tags' }
            ].map(tab => (
              <button 
                key={tab.id} onClick={() => setAbaPrincipal(tab.id)}
                className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors shrink-0 ${abaPrincipal === tab.id ? (temaNoturno ? 'bg-white/10 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]' : 'bg-zinc-900 text-white shadow-sm') : (temaNoturno ? 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5' : 'text-zinc-500 hover:text-zinc-700 hover:bg-black/5')}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        <button onClick={() => setMostrarConfigEmpresa(false)} className={`p-2 rounded-md transition-all active:scale-95 outline-none shrink-0 ml-4 ${temaNoturno ? 'bg-transparent text-zinc-400 hover:bg-white/[0.08] hover:text-white' : 'bg-transparent text-zinc-500 hover:bg-black/[0.04] hover:text-zinc-900'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </header>

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto w-full relative scrollbar-hide px-4 sm:px-8 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto w-full">
        {/* ABA: WORKSPACE */}
        {abaPrincipal === 'workspace' && (
          <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 w-full">
            
            <div className="flex flex-col w-full lg:w-2/3 gap-6 sm:gap-8">
              {/* BRANDING CARD */}
              <div className={cardPanel}>
                  <div className="space-y-1 border-b pb-4" style={{borderColor: temaNoturno ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}}>
                    <h3 className="text-[16px] font-bold tracking-tight">Identidade Visual</h3>
                    <p className={`text-[12px] font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Informações e estética da sua marca.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
                    <div className="w-full">
                      <label className={labelArox}>Nome do Estabelecimento</label>
                      <input type="text" value={nomeEmpresaEdicao} onChange={e => setNomeEmpresaEdicao(e.target.value)} className={inputArox} />
                    </div>
                    <div className="w-full">
                      <label className={labelArox}>Gestor Responsável</label>
                      <input type="text" value={nomeUsuarioEdicao} onChange={e => setNomeUsuarioEdicao(e.target.value)} className={inputArox} />
                    </div>
                    <div className="sm:col-span-2 w-full">
                      <label className={labelArox}>Logotipo (URL)</label>
                      <div className="flex gap-4 items-center w-full">
                        <div className={`w-14 h-14 rounded-xl border shrink-0 overflow-hidden flex items-center justify-center p-0.5 shadow-sm ${temaNoturno ? 'border-white/10 bg-[#161a20]' : 'border-zinc-200 bg-white'}`}>
                          <img src={logoEmpresaEdicao || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} alt="Preview" className="w-full h-full object-cover rounded-[10px]" onError={(e) => e.target.src='https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} />
                        </div>
                        <input type="text" placeholder="https://..." value={logoEmpresaEdicao} onChange={e => setLogoEmpresaEdicao(e.target.value)} className={inputArox} />
                      </div>
                    </div>
                  </div>
              </div>

              {/* OPERAÇÃO CARD */}
              <div className={cardPanel}>
                  <div className="space-y-1 border-b pb-4" style={{borderColor: temaNoturno ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}}>
                    <h3 className="text-[16px] font-bold tracking-tight">Parâmetros Operacionais</h3>
                    <p className={`text-[12px] font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Inteligência de clima e alertas de caixa.</p>
                  </div>
                  
                  {isCarregandoOperacao ? (
                    <div className={`animate-pulse h-12 w-full rounded-xl ${temaNoturno ? 'bg-white/5' : 'bg-black/5'}`}></div>
                  ) : (
                    <div className="flex flex-col gap-5 w-full">
                      <div className="w-full relative">
                        <label className={labelArox}>Localização Estratégica</label>
                        <input 
                          type="text" placeholder="Ex: Parnamirim, RN, BR" value={localizacao} onChange={handleLocalizacaoChange}
                          onFocus={() => { if(localizacao.trim().length > 1) setMostrarSugestoes(true); }} onBlur={() => setTimeout(() => setMostrarSugestoes(false), 200)}
                          className={inputArox} 
                        />
                        {mostrarSugestoes && sugestoesLocalizacao.length > 0 && (
                          <ul className={`absolute left-0 right-0 z-50 mt-2 py-2 rounded-[16px] border shadow-2xl overflow-hidden max-h-56 overflow-y-auto scrollbar-hide backdrop-blur-3xl ${temaNoturno ? 'bg-[#18181b]/95 border-white/10' : 'bg-white/95 border-zinc-200'}`}>
                            {sugestoesLocalizacao.map((sugestao, idx) => (
                              <li key={idx} onClick={() => selecionarSugestao(sugestao)} className={`px-4 py-2.5 text-[13px] font-semibold cursor-pointer transition-colors flex items-center gap-3 ${temaNoturno ? 'text-zinc-200 hover:bg-white/10' : 'text-zinc-800 hover:bg-black/5'}`}>
                                <svg className={`w-4 h-4 opacity-50 ${temaNoturno ? 'text-white' : 'text-black'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                                {sugestao}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-5 w-full">
                        <div className="w-full">
                          <label className={labelArox}>Horário de Abertura</label>
                          <input type="time" value={horarioAbertura} onChange={e => setHorarioAbertura(e.target.value)} className={inputArox} />
                        </div>
                        <div className="w-full">
                          <label className={labelArox}>Horário de Fechamento</label>
                          <input type="time" value={horarioFechamento} onChange={e => setHorarioFechamento(e.target.value)} className={inputArox} />
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* BARRA LATERAL (PLANOS E SEGURANÇA) */}
            <div className="flex flex-col w-full lg:w-1/3 gap-6 sm:gap-8 shrink-0">
                <div className={`p-6 sm:p-8 rounded-[24px] border shadow-sm relative overflow-hidden flex flex-col gap-4 ${temaNoturno ? 'bg-gradient-to-br from-[#121418] to-[#0A0A0A] border-white/10' : 'bg-gradient-to-br from-zinc-50 to-white border-zinc-200'}`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[40px] rounded-full"></div>
                  
                  <div className="flex flex-col relative z-10">
                    <span className={labelArox}>Plano e Licença</span>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[20px] font-black tracking-tight">{nomePlanoDisplay}</span>
                      <div className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${isPremium ? (temaNoturno ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-indigo-100 text-indigo-700 border border-indigo-200') : (temaNoturno ? 'bg-white/10 text-zinc-400 border border-white/10' : 'bg-zinc-200 text-zinc-700 border border-zinc-300')}`}>
                        {isPremium ? 'Ativo' : 'Básico'}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`pt-4 border-t flex flex-col gap-1 relative z-10 ${temaNoturno ? 'border-white/10' : 'border-zinc-200'}`}>
                    <span className={labelArox}>Ativação do Ambiente</span>
                    <span className={`text-[13px] font-semibold ${temaNoturno ? 'text-zinc-300' : 'text-zinc-700'}`}>{planoUsuario?.criado_em ? new Intl.DateTimeFormat('pt-BR').format(new Date(planoUsuario.criado_em)) : 'Não registrada'}</span>
                  </div>
                </div>

                <div className={cardPanel}>
                  <div className="space-y-1 border-b pb-4" style={{borderColor: temaNoturno ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}}>
                    <h3 className="text-[16px] font-bold tracking-tight">Segurança</h3>
                    <p className={`text-[12px] font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Atualize sua credencial de acesso.</p>
                  </div>

                  <div className="flex flex-col gap-4 w-full">
                    <input type={mostrarSenhas ? "text" : "password"} placeholder="Senha Atual" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} className={inputArox} />
                    <input type={mostrarSenhas ? "text" : "password"} placeholder="Nova Senha" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} className={inputArox} />
                    <input type={mostrarSenhas ? "text" : "password"} placeholder="Confirmar Nova" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} className={inputArox} />
                    
                    <button disabled={!senhaValida || !senhaAtual} onClick={() => alterarSenhaConta(senhaAtual, novaSenha)} className={`w-full py-3.5 rounded-xl text-[12px] uppercase tracking-wider font-bold mt-2 transition-all shadow-sm outline-none flex items-center justify-center gap-2 ${senhaValida && senhaAtual ? (temaNoturno ? 'bg-white text-zinc-900 hover:bg-zinc-200 active:scale-[0.98]' : 'bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98]') : (temaNoturno ? 'bg-white/5 text-zinc-600 cursor-not-allowed border border-white/10' : 'bg-black/5 text-zinc-400 cursor-not-allowed border border-black/10')}`}>
                      Atualizar Senha
                    </button>
                  </div>
                </div>
            </div>
            
          </div>
        )}

        {abaPrincipal === 'catalogo' && (
           <AdminProdutos empresaId={ID_EMPRESA_REAL} temaNoturno={temaNoturno} {...props} />
        )}

        {abaPrincipal === 'delivery' && (
           <AdminDelivery empresaId={ID_EMPRESA_REAL} temaNoturno={temaNoturno} {...props} />
        )}

        {abaPrincipal === 'tags' && (
           <ModalConfigTags sessao={sessao} tagsGlobais={tagsGlobais} setTagsGlobais={setTagsGlobais} temaNoturno={temaNoturno} {...props} />
        )}

        </div>
      </main>

      {/* FOOTER SALVAR GERAL */}
      {abaPrincipal === 'workspace' && (
        <div className={`h-[80px] border-t shrink-0 flex items-center justify-end px-4 sm:px-8 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] ${temaNoturno ? 'border-white/[0.06] bg-[#0A0A0A]/90' : 'border-zinc-200 bg-white/90'} backdrop-blur-xl z-20 absolute bottom-0 w-full`}>
          <button onClick={handleSalvarGeral} className={`w-full sm:w-auto px-10 py-3.5 rounded-xl text-[13px] font-bold uppercase tracking-wider transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-2 outline-none ${temaNoturno ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-zinc-900 text-white hover:bg-black'}`}>
            Salvar Modificações
          </button>
        </div>
      )}
    </div>
  );
}