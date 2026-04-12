'use client';
import React from 'react';
import { supabase } from '@/lib/supabase';

const PremiumLoaderStyle = () => (
  <style dangerouslySetInnerHTML={{__html: `
    @keyframes progress-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
    .loader-line { position: relative; overflow: hidden; }
    .loader-line::after {
      content: ''; position: absolute; top: 0; left: 0; bottom: 0; width: 40%; border-radius: 9999px;
      animation: progress-shimmer 1.5s infinite cubic-bezier(0.4, 0, 0.2, 1);
    }
    .loader-light::after { background-color: #000000; }
    .loader-dark::after { background-color: #ffffff; }
  `}} />
);

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      isRestoring: false,
      statusAdmin: 'pendente', 
      previsaoRetorno: null    
    };
    this.radarInterval = null; // Nosso radar de tempo real
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, isRestoring: false };
  }

  async componentDidCatch(error, errorInfo) {
    const cacheKey = `arox_err_reported_${this.props.codigoErro}`;
    const jaNotificado = sessionStorage.getItem(cacheKey);

    if (!jaNotificado) {
      await this.enviarLogCriarStatus(error, errorInfo);
      sessionStorage.setItem(cacheKey, 'true');
    }
    
    // Busca o status atual imediatamente
    await this.verificarPainelAdmin();

    // Liga o Radar: Pergunta ao banco a cada 10 segundos se você já atualizou o status ou prazo
    this.radarInterval = setInterval(() => {
      this.verificarPainelAdmin();
    }, 10000);
  }

  componentWillUnmount() {
    // Desliga o radar se o cliente sair da tela ou a comanda for trocada
    if (this.radarInterval) clearInterval(this.radarInterval);
  }

  verificarPainelAdmin = async () => {
    try {
      const { data } = await supabase.from('status_erros').select('status, previsao_retorno').eq('codigo_erro', this.props.codigoErro).single();
      if (data) {
        this.setState({ statusAdmin: data.status, previsaoRetorno: data.previsao_retorno });
        
        // Se você marcou como resolvido no painel, desliga o radar para economizar internet
        if (data.status === 'resolvido' && this.radarInterval) {
          clearInterval(this.radarInterval);
        }
      }
    } catch (e) {}
  }

  enviarLogCriarStatus = async (error, errorInfo) => {
    try {
      await supabase.from('logs_sistema').insert([{
        codigo_erro: this.props.codigoErro, modulo: this.props.modulo,
        empresa_id: this.props.empresaId || null, mensagem: error.toString(), stack: errorInfo.componentStack
      }]);

      const { data } = await supabase.from('status_erros').select('codigo_erro').eq('codigo_erro', this.props.codigoErro).single();
      if (!data) {
        await supabase.from('status_erros').insert([{
          codigo_erro: this.props.codigoErro, modulo: this.props.modulo, status: 'pendente'
        }]);
      }
    } catch (e) { console.warn("Log offline:", this.props.codigoErro); }
  }

  tentarRestaurar = () => {
    this.setState({ isRestoring: true });
    setTimeout(() => { this.setState({ hasError: false, isRestoring: false }); }, 1800);
  }

  formatarData = (dataIso) => {
    if (!dataIso) return '';
    return new Date(dataIso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  render() {
    const layoutClasses = `${this.props.fallbackClassName || 'w-full h-full'} flex flex-col items-center justify-center p-6 md:p-10 transition-colors`;
    const themeClasses = this.props.temaNoturno ? 'bg-[#0A0A0A] border-white/[0.06] text-zinc-300' : 'bg-[#FAFAFA] border-black/[0.06] text-zinc-700';

    if (this.state.isRestoring) {
      return (
        <div className={`${layoutClasses} ${themeClasses}`}>
          <PremiumLoaderStyle />
          <div className="flex flex-col items-center max-w-[200px] w-full">
            <span className={`text-[10px] font-bold tracking-[0.2em] uppercase mb-4 opacity-60 ${this.props.temaNoturno ? 'text-white' : 'text-black'}`}>Restaurando Módulo</span>
            <div className={`w-full h-[2px] rounded-full loader-line ${this.props.temaNoturno ? 'bg-white/10 loader-dark' : 'bg-black/10 loader-light'}`}></div>
          </div>
        </div>
      );
    }

    if (this.state.hasError) {
      return (
        <div className={`${layoutClasses} ${themeClasses} relative overflow-hidden transition-all duration-700 ease-out`}>
          
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-5 transition-colors duration-500 ${this.state.statusAdmin === 'resolvido' ? 'bg-emerald-500/10' : (this.props.temaNoturno ? 'bg-white/5' : 'bg-black/5')}`}>
            {this.state.statusAdmin === 'resolvido' ? (
              <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-5 h-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            )}
          </div>
          
          <h3 className={`text-[15px] font-bold tracking-tight mb-2 ${this.props.temaNoturno ? 'text-white' : 'text-black'}`}>
            {this.state.statusAdmin === 'resolvido' ? 'Sistemas Operacionais' : 'Ops! Tropeçamos num fio.'}
          </h3>
          
          <p className="text-[13px] text-center opacity-60 max-w-[280px] mb-6 leading-relaxed">
            {this.state.statusAdmin === 'resolvido' 
              ? 'A nossa equipe de engenharia já lançou a correção para este módulo. Pode atualizar a página com segurança.'
              : 'Parece que algo saiu do lugar. Nossa engenharia já foi notificada silenciosamente e está trabalhando nisso.'}
          </p>
          
          <div className="flex items-center gap-4">
            {this.state.statusAdmin === 'resolvido' ? (
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 rounded-full text-[12px] font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-[0_2px_15px_rgba(16,185,129,0.3)] active:scale-[0.98] animate-in fade-in zoom-in-95 duration-500"
              >
                Atualizar Página (F5)
              </button>
            ) : this.state.previsaoRetorno ? (
              <div className={`px-5 py-2.5 rounded-full border text-[11px] font-semibold flex flex-col items-center cursor-not-allowed animate-in fade-in duration-500 ${this.props.temaNoturno ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`}>
                <span className="opacity-50 uppercase tracking-widest text-[9px]">Previsão de Correção</span>
                <span>{this.formatarData(this.state.previsaoRetorno)}</span>
              </div>
            ) : (
              <button 
                onClick={this.tentarRestaurar}
                className={`px-6 py-2.5 rounded-full text-[12px] font-bold transition-all active:scale-[0.98] ${this.props.temaNoturno ? 'bg-white text-black hover:bg-zinc-200 shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'bg-black text-white hover:bg-zinc-800 shadow-[0_2px_10px_rgba(0,0,0,0.1)]'}`}
              >
                Tentar Novamente
              </button>
            )}

            <span className="font-mono text-[10px] font-bold tracking-wider opacity-40">{this.props.codigoErro}</span>
          </div>
        </div>
      );
    }
    return this.props.children; 
  }
}