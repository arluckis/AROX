// src/components/ModalConfigEmpresa.js
'use client';
import { useState } from 'react';

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
  alterarSenhaConta
}) {
  // Controle de Abas no Mobile
  const [abaMobile, setAbaMobile] = useState('identidade'); // 'identidade' | 'seguranca'

  // Estados da Senha
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenhas, setMostrarSenhas] = useState(false);

  // Validações
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

  // Plano
  const nomePlano = planoUsuario?.nome?.toLowerCase() || 'free';
  const isPremium = nomePlano.includes('premium') || nomePlano.includes('pro') || nomePlano.includes('anual') || nomePlano.includes('mensal') || nomePlano.includes('semestral');
  const nomePlanoDisplay = planoUsuario?.nome ? (planoUsuario.nome.charAt(0).toUpperCase() + planoUsuario.nome.slice(1)) : 'Starter Plan';

  const formatarData = (dataString) => {
    if (!dataString) return 'Acesso Vitalício';
    return new Date(dataString).toLocaleDateString('pt-BR');
  };

  const handleSalvarSenha = () => {
    if (!senhaValida) return;
    if (alterarSenhaConta) alterarSenhaConta(senhaAtual, novaSenha);
    setSenhaAtual(''); setNovaSenha(''); setConfirmarSenha('');
  };

  return (
    <div className="fixed inset-0 flex flex-col sm:items-center justify-start sm:justify-center p-0 sm:p-6 z-[70] overflow-hidden">
      
      {/* OVERLAY COM BLUR SUAVE */}
      <div 
        className="absolute inset-0 bg-black/60 sm:bg-black/40 backdrop-blur-sm sm:backdrop-blur-md transition-opacity duration-300"
        onClick={() => setMostrarConfigEmpresa(false)}
      ></div>

      {/* CONTAINER PRINCIPAL */}
      <div className={`relative w-full h-full sm:h-auto sm:max-h-[90vh] max-w-4xl flex flex-col sm:rounded-2xl shadow-2xl animate-in sm:zoom-in-95 slide-in-from-bottom-full sm:slide-in-from-bottom-0 duration-300 overflow-hidden z-10 transition-colors ${temaNoturno ? 'bg-[#111318] sm:border border-white/5' : 'bg-white sm:border border-zinc-200'}`}>
        
        {/* HEADER COMPACTO E ELEGANTE */}
        <div className={`flex justify-between items-center px-5 py-4 border-b shrink-0 ${temaNoturno ? 'border-white/5 bg-[#161a20]/80' : 'border-zinc-200 bg-zinc-50/80'} backdrop-blur-xl`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${temaNoturno ? 'bg-white/5 border-white/10 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-600 shadow-sm'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </div>
            <div>
              <h2 className={`text-[15px] font-semibold tracking-tight leading-none ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>Ajustes do Sistema</h2>
              <p className={`text-[11px] font-medium mt-1 ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Workspace e configurações de conta</p>
            </div>
          </div>
          <button onClick={() => setMostrarConfigEmpresa(false)} className={`p-2 rounded-lg transition-all active:scale-95 ${temaNoturno ? 'bg-transparent text-zinc-400 hover:bg-white/5 hover:text-white' : 'bg-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* NAVEGAÇÃO MOBILE FIXA */}
        <div className={`sm:hidden flex border-b shrink-0 ${temaNoturno ? 'border-white/5 bg-[#111318]' : 'border-zinc-200 bg-white'}`}>
          <button onClick={() => setAbaMobile('identidade')} className={`flex-1 py-3.5 text-[11px] font-semibold uppercase tracking-wider transition-colors relative ${abaMobile === 'identidade' ? (temaNoturno ? 'text-zinc-100' : 'text-zinc-900') : (temaNoturno ? 'text-zinc-500' : 'text-zinc-400')}`}>
            Identidade
            {abaMobile === 'identidade' && <span className={`absolute bottom-0 left-0 w-full h-[2px] rounded-t-full ${temaNoturno ? 'bg-white' : 'bg-zinc-900'}`}></span>}
          </button>
          <button onClick={() => setAbaMobile('seguranca')} className={`flex-1 py-3.5 text-[11px] font-semibold uppercase tracking-wider transition-colors relative ${abaMobile === 'seguranca' ? (temaNoturno ? 'text-zinc-100' : 'text-zinc-900') : (temaNoturno ? 'text-zinc-500' : 'text-zinc-400')}`}>
            Conta & Segurança
            {abaMobile === 'seguranca' && <span className={`absolute bottom-0 left-0 w-full h-[2px] rounded-t-full ${temaNoturno ? 'bg-white' : 'bg-zinc-900'}`}></span>}
          </button>
        </div>

        {/* ÁREA DE SCROLL (GRID DESKTOP) */}
        <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col sm:flex-row relative">
          
          {/* COLUNA 1: IDENTIDADE */}
          <div className={`p-5 sm:p-8 flex-col gap-6 sm:w-1/2 sm:border-r ${abaMobile === 'identidade' ? 'flex' : 'hidden sm:flex'} ${temaNoturno ? 'border-white/5' : 'border-zinc-200'}`}>
            
            <div className="space-y-1 mb-2">
              <h3 className={`text-[13px] font-semibold tracking-tight ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>Identidade Visual</h3>
              <p className={`text-xs ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Informações exibidas publicamente e nos recibos.</p>
            </div>

            <div className="space-y-4">
              <div className="group">
                <label className={`text-[11px] font-semibold tracking-wide mb-1.5 block ${temaNoturno ? 'text-zinc-400' : 'text-zinc-600'}`}>Nome do Estabelecimento</label>
                <input type="text" value={nomeEmpresaEdicao} onChange={e => setNomeEmpresaEdicao(e.target.value)} className={`w-full px-3.5 py-2.5 rounded-lg border outline-none text-[13px] font-medium transition-all shadow-sm focus:ring-2 focus:ring-offset-0 ${temaNoturno ? 'bg-[#161a20] border-white/10 focus:border-white/20 focus:ring-white/5 text-white' : 'bg-white border-zinc-200 focus:border-zinc-300 focus:ring-zinc-100 text-zinc-900'}`} />
              </div>

              <div className="group">
                <label className={`text-[11px] font-semibold tracking-wide mb-1.5 block ${temaNoturno ? 'text-zinc-400' : 'text-zinc-600'}`}>Nome do Gestor (Responsável)</label>
                <input type="text" value={nomeUsuarioEdicao} onChange={e => setNomeUsuarioEdicao(e.target.value)} className={`w-full px-3.5 py-2.5 rounded-lg border outline-none text-[13px] font-medium transition-all shadow-sm focus:ring-2 focus:ring-offset-0 ${temaNoturno ? 'bg-[#161a20] border-white/10 focus:border-white/20 focus:ring-white/5 text-white' : 'bg-white border-zinc-200 focus:border-zinc-300 focus:ring-zinc-100 text-zinc-900'}`} />
              </div>

              <div className="group">
                <label className={`text-[11px] font-semibold tracking-wide mb-1.5 block ${temaNoturno ? 'text-zinc-400' : 'text-zinc-600'}`}>Logotipo (URL da Imagem)</label>
                <div className="flex gap-3 items-center">
                  <div className={`w-12 h-12 rounded-lg border shrink-0 overflow-hidden flex items-center justify-center p-0.5 shadow-sm ${temaNoturno ? 'border-white/10 bg-[#161a20]' : 'border-zinc-200 bg-white'}`}>
                    <img src={logoEmpresaEdicao || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} alt="Preview" className="w-full h-full object-cover rounded-md" onError={(e) => e.target.src='https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} />
                  </div>
                  <input type="text" placeholder="https://..." value={logoEmpresaEdicao} onChange={e => setLogoEmpresaEdicao(e.target.value)} className={`w-full px-3.5 py-2.5 rounded-lg border outline-none text-[13px] font-medium transition-all shadow-sm focus:ring-2 focus:ring-offset-0 ${temaNoturno ? 'bg-[#161a20] border-white/10 focus:border-white/20 focus:ring-white/5 text-white' : 'bg-white border-zinc-200 focus:border-zinc-300 focus:ring-zinc-100 text-zinc-900'}`} />
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6 pb-2 sm:pb-0">
              <button onClick={salvarConfigEmpresa} className={`w-full py-3 sm:py-2.5 rounded-xl sm:rounded-lg text-[13px] font-semibold transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 ${temaNoturno ? 'bg-zinc-100 text-zinc-900 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}>
                Salvar Alterações
              </button>
            </div>
          </div>

          {/* COLUNA 2: PLANO E SEGURANÇA */}
          <div className={`p-5 sm:p-8 flex-col gap-6 sm:w-1/2 ${abaMobile === 'seguranca' ? 'flex' : 'hidden sm:flex'} ${temaNoturno ? 'bg-[#111318]' : 'bg-zinc-50/50'}`}>
            
            {/* Bloco do Plano */}
            <div>
              <div className="space-y-1 mb-3">
                <h3 className={`text-[13px] font-semibold tracking-tight ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>Assinatura Ativa</h3>
              </div>

              <div className={`p-4 rounded-xl border flex flex-col gap-3 shadow-sm ${temaNoturno ? 'bg-[#161a20] border-white/5' : 'bg-white border-zinc-200'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-semibold uppercase tracking-widest mb-1 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Plano Vigente</span>
                    <span className={`text-[15px] font-semibold tracking-tight ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>{nomePlanoDisplay}</span>
                  </div>
                  <div className={`px-2 py-1 rounded border text-[10px] font-semibold uppercase tracking-widest ${isPremium ? (temaNoturno ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200') : (temaNoturno ? 'bg-white/5 text-zinc-400 border-white/10' : 'bg-zinc-100 text-zinc-600 border-zinc-200')}`}>
                    {isPremium ? 'Ativo' : 'Básico'}
                  </div>
                </div>
                {isPremium && (
                  <div className={`pt-3 border-t text-[11px] font-medium flex items-center justify-between ${temaNoturno ? 'border-white/5 text-zinc-400' : 'border-zinc-100 text-zinc-500'}`}>
                    <span>Válido até:</span>
                    <span>{formatarData(planoUsuario?.validade)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bloco de Segurança */}
            <div className="mt-2 pb-6 sm:pb-0">
              <div className="space-y-1 mb-3">
                <h3 className={`text-[13px] font-semibold tracking-tight ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>Segurança da Conta</h3>
              </div>
              
              <div className="space-y-3">
                <input type={mostrarSenhas ? "text" : "password"} placeholder="Senha Atual" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} className={`w-full px-3.5 py-2.5 rounded-lg border outline-none text-[13px] font-medium transition-all shadow-sm focus:ring-2 focus:ring-offset-0 ${temaNoturno ? 'bg-[#161a20] border-white/10 focus:border-white/20 focus:ring-white/5 text-white placeholder-zinc-500' : 'bg-white border-zinc-200 focus:border-zinc-300 focus:ring-zinc-100 text-zinc-900 placeholder-zinc-400'}`} />
                
                <div className="grid grid-cols-1 gap-3">
                  <input type={mostrarSenhas ? "text" : "password"} placeholder="Nova Senha" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} className={`w-full px-3.5 py-2.5 rounded-lg border outline-none text-[13px] font-medium transition-all shadow-sm focus:ring-2 focus:ring-offset-0 ${temaNoturno ? 'bg-[#161a20] border-white/10 focus:border-white/20 focus:ring-white/5 text-white placeholder-zinc-500' : 'bg-white border-zinc-200 focus:border-zinc-300 focus:ring-zinc-100 text-zinc-900 placeholder-zinc-400'}`} />
                  <input type={mostrarSenhas ? "text" : "password"} placeholder="Confirmar Nova Senha" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} className={`w-full px-3.5 py-2.5 rounded-lg border outline-none text-[13px] font-medium transition-all shadow-sm focus:ring-2 focus:ring-offset-0 ${novaSenha && confirmarSenha && novaSenha !== confirmarSenha ? 'border-rose-500/50 focus:border-rose-500/50 focus:ring-rose-500/10' : (temaNoturno ? 'border-white/10 focus:border-white/20 focus:ring-white/5' : 'border-zinc-200 focus:border-zinc-300 focus:ring-zinc-100')} ${temaNoturno ? 'bg-[#161a20] text-white placeholder-zinc-500' : 'bg-white text-zinc-900 placeholder-zinc-400'}`} />
                </div>
                
                {/* Validações e Progress */}
                {novaSenha.length > 0 && (
                  <div className="flex flex-col gap-2 pt-2 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center mb-0.5">
                       <span className={`text-[10px] font-semibold uppercase tracking-widest ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Força da Senha</span>
                    </div>
                    
                    <div className={`h-1 w-full rounded-full overflow-hidden ${temaNoturno ? 'bg-white/5' : 'bg-zinc-100'}`}>
                       <div className={`h-full transition-all duration-500 ease-out ${corAtual}`} style={{ width: `${(forcaSenha / 4) * 100}%` }}></div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mt-1">
                      {regrasSenha.map(regra => (
                        <div key={regra.id} className="flex items-center gap-1.5">
                          <svg className={`w-3 h-3 transition-colors duration-300 ${regra.valido ? 'text-emerald-500' : (temaNoturno ? 'text-zinc-600' : 'text-zinc-300')}`} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                          <span className={`text-[10px] font-medium transition-colors duration-300 ${regra.valido ? (temaNoturno ? 'text-zinc-300' : 'text-zinc-700') : (temaNoturno ? 'text-zinc-600' : 'text-zinc-400')}`}>{regra.texto}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <button disabled={!senhaValida || !senhaAtual} onClick={handleSalvarSenha} className={`w-full py-3 sm:py-2.5 rounded-xl sm:rounded-lg text-[13px] font-semibold mt-4 transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 ${senhaValida && senhaAtual ? (temaNoturno ? 'bg-white text-zinc-900 hover:bg-zinc-200' : 'bg-zinc-900 text-white hover:bg-zinc-800 cursor-pointer') : (temaNoturno ? 'bg-white/5 text-zinc-500 cursor-not-allowed' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed')}`}>
                Atualizar Credenciais
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}