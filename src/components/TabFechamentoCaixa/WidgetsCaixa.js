'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const renderIOSInput = (value, onChange, onEnter, temaNoturno) => (
  <div className={`relative flex items-center justify-center bg-transparent rounded-[18px] border transition-all duration-300 shadow-inner h-14 w-full ${temaNoturno ? 'border-white/10 focus-within:border-white/30 bg-white/[0.02]' : 'border-black/10 focus-within:border-black/30 bg-black/[0.02]'}`}>
    <input 
      type="password" 
      autoComplete="new-password" 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      onKeyDown={(e) => e.key === 'Enter' && onEnter()} 
      className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10" 
      autoFocus 
    />
    <div className="flex items-center gap-2.5 pointer-events-none z-0">
      {value.length === 0 ? (
        <span className={`text-[20px] tracking-[0.4em] font-black ${temaNoturno ? 'text-zinc-700' : 'text-zinc-300'}`}>••••••</span>
      ) : (
        Array.from({ length: value.length }).map((_, i) => (
          <motion.span 
            key={i} 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className={`w-3 h-3 rounded-full ${temaNoturno ? 'bg-white' : 'bg-black'}`} 
          />
        ))
      )}
    </div>
  </div>
);

const labelStyle = (tema) => `text-[10px] font-bold uppercase tracking-widest mb-2 block ${tema ? 'text-zinc-500' : 'text-zinc-500'}`;
const inputWrapperStyle = (tema) => `relative flex items-center bg-transparent rounded-xl border transition-all duration-300 overflow-hidden ${tema ? 'border-white/[0.08] focus-within:border-white/20 hover:border-white/15 bg-white/5' : 'border-black/10 focus-within:border-black/30 hover:border-black/20 bg-black/5'}`;
const inputStyle = (tema) => `w-full bg-transparent outline-none py-3 pr-4 pl-12 text-[15px] font-bold tracking-tight transition-all duration-300 placeholder-opacity-40 ${tema ? 'text-white placeholder-white' : 'text-black placeholder-black'}`;
const cardBaseStyle = (tema) => `relative p-6 md:p-8 rounded-[32px] border transition-colors overflow-hidden w-full flex flex-col h-full ${tema ? 'bg-[#0A0A0A] border-white/[0.04] shadow-md' : 'bg-white border-black/[0.04] shadow-sm'}`;

const fadeInVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
};

// 1. APURAÇÃO DO SISTEMA
export const ApuracaoSistema = ({ 
  temaNoturno, mostrarEsperado, setMostrarEsperado, 
  saldoGavetaEsperado = 0, saldoInicial = 0, totalSistemaDinheiro = 0, 
  totalSuprimentos = 0, totalSangrias = 0, totalSistemaCartao = 0, totalSistemaPix = 0, 
  senhaApuracao, setSenhaApuracao, handleVerificarSenhaApuracao, setExtratoExpandido 
}) => {
  return (
    <motion.section 
      variants={fadeInVariants} 
      initial="hidden" 
      animate="visible" 
      className={cardBaseStyle(temaNoturno)}
    >
      <div className="relative z-10 h-full flex flex-col">
        <motion.div layout className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <motion.h2 layout="position" className="text-[20px] font-bold tracking-tight mb-1">Apuração do Sistema</motion.h2>
            <motion.p layout="position" className={`text-[12px] font-medium ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Totais registrados.</motion.p>
          </div>
          <AnimatePresence>
            {mostrarEsperado && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setMostrarEsperado(false)} 
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors active:scale-[0.97] border shadow-sm ${temaNoturno ? 'bg-zinc-800 border-white/10 hover:bg-zinc-700 text-zinc-300 hover:text-white' : 'bg-white border-black/10 hover:bg-zinc-50 text-zinc-700 hover:text-black'}`}
              >
                Ocultar Valores
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
        
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <AnimatePresence mode="popLayout">
            {mostrarEsperado ? (
              <motion.div 
                key="valores"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 flex flex-col"
              >
                <div className="grid grid-cols-2 gap-y-6 gap-x-6">
                  <div className="col-span-2 mb-2 pb-6 border-b border-dashed border-zinc-500/20">
                    <p className={labelStyle(temaNoturno)}>Saldo Esperado</p>
                    <p className={`text-[36px] font-bold tracking-tight leading-none tabular-nums ${temaNoturno ? 'text-white' : 'text-black'}`}>R$ {saldoGavetaEsperado.toFixed(2)}</p>
                  </div>
                  <div><p className={labelStyle(temaNoturno)}>Fundo Inicial</p><p className={`text-[15px] font-bold tracking-tight tabular-nums ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>R$ {saldoInicial.toFixed(2)}</p></div>
                  <div><p className={labelStyle(temaNoturno)}>Vendas (Dinheiro)</p><p className="text-[15px] font-bold tracking-tight tabular-nums text-emerald-500">+ R$ {totalSistemaDinheiro.toFixed(2)}</p></div>
                  <div><p className={labelStyle(temaNoturno)}>Entradas Extras</p><p className="text-[15px] font-bold tracking-tight tabular-nums text-emerald-500">+ R$ {totalSuprimentos.toFixed(2)}</p></div>
                  <div><p className={labelStyle(temaNoturno)}>Sangrias / Acertos</p><p className="text-[15px] font-bold tracking-tight tabular-nums text-rose-500">- R$ {totalSangrias.toFixed(2)}</p></div>
                  <div className="col-span-2 pt-6 border-t border-dashed border-zinc-500/20 grid grid-cols-2 gap-6">
                    <div><p className={labelStyle(temaNoturno)}>Maquininhas</p><p className={`text-[18px] font-bold tracking-tight tabular-nums ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>R$ {totalSistemaCartao.toFixed(2)}</p></div>
                    <div><p className={labelStyle(temaNoturno)}>Total Pix</p><p className={`text-[18px] font-bold tracking-tight tabular-nums ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>R$ {totalSistemaPix.toFixed(2)}</p></div>
                  </div>
                </div>
                <div className="mt-auto pt-6 w-full">
                    <button onClick={() => setExtratoExpandido(true)} className={`w-full py-3.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 active:scale-[0.98] border shadow-sm flex justify-center items-center gap-3 ${temaNoturno ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-black/5 border-black/10 text-zinc-900 hover:bg-black/10'}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                      Abrir Dossiê de Auditoria
                    </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="senha"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col items-center justify-center py-4"
              >
                <div className={`w-14 h-14 mb-5 rounded-full flex items-center justify-center border shadow-sm ${temaNoturno ? 'bg-[#18181b]/50 border-white/10 text-zinc-300' : 'bg-white/50 border-black/10 text-zinc-700'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                </div>
                <p className={`text-[12px] mb-6 font-medium text-center px-4 ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Validar senha de acesso para revelar os valores esperados deste ciclo.</p>
                <div className="w-full max-w-[260px] space-y-4">
                  {renderIOSInput(senhaApuracao, setSenhaApuracao, handleVerificarSenhaApuracao, temaNoturno)}
                  <button onClick={handleVerificarSenhaApuracao} className={`w-full py-3.5 rounded-[16px] text-[11px] font-bold uppercase tracking-widest transition-all duration-200 active:scale-[0.98] shadow-md border flex justify-center items-center gap-3 ${temaNoturno ? 'bg-zinc-100 text-black border-transparent hover:bg-white' : 'bg-zinc-900 text-white border-transparent hover:bg-black'}`}>Validar senha</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
};


// 2. DECLARAÇÃO FÍSICA
export const DeclaracaoFisica = ({ temaNoturno, valorInformadoDinheiro, setValorInformadoDinheiro, valorInformadoCartao, setValorInformadoCartao, valorInformadoPix, setValorInformadoPix }) => (
  <motion.section 
    variants={fadeInVariants} 
    initial="hidden" 
    animate="visible" 
    transition={{ delay: 0.1 }}
    className={cardBaseStyle(temaNoturno)}
  >
    <div className="relative z-10 flex flex-col h-full">
      <div className="mb-6 border-b border-transparent"><h2 className="text-[20px] font-bold tracking-tight mb-1">Declaração Física</h2><p className={`text-[12px] font-medium ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Informe os valores contados.</p></div>
      <div className="flex flex-col gap-6 flex-1 justify-center">
        <div>
          <label className={labelStyle(temaNoturno)}>Dinheiro em Espécie</label>
          <div className={inputWrapperStyle(temaNoturno)}>
            <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold z-10 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>R$</span>
            <input type="number" value={valorInformadoDinheiro} onChange={(e) => setValorInformadoDinheiro(e.target.value)} className={`${inputStyle(temaNoturno)} relative z-10`} placeholder="0,00" />
          </div>
        </div>
        <div>
          <label className={labelStyle(temaNoturno)}>Maquininhas (Cartão)</label>
          <div className={inputWrapperStyle(temaNoturno)}>
            <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold z-10 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>R$</span>
            <input type="number" value={valorInformadoCartao} onChange={(e) => setValorInformadoCartao(e.target.value)} className={`${inputStyle(temaNoturno)} relative z-10`} placeholder="0,00" />
          </div>
        </div>
        <div>
          <label className={labelStyle(temaNoturno)}>Recebimentos via Pix</label>
          <div className={inputWrapperStyle(temaNoturno)}>
            <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold z-10 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>R$</span>
            <input type="number" value={valorInformadoPix} onChange={(e) => setValorInformadoPix(e.target.value)} className={`${inputStyle(temaNoturno)} relative z-10`} placeholder="0,00" />
          </div>
        </div>
      </div>
    </div>
  </motion.section>
);


// 3. ACERTO DE MOTOBOYS
export const AcertoMotoboys = ({ temaNoturno, motoboyAtivo, toggleMotoboy, pendenteMotoboy = 0, abrirConfirmacaoMotoboy }) => {
  return (
    <motion.section 
      variants={fadeInVariants} 
      initial="hidden" 
      animate="visible" 
      transition={{ delay: 0.15 }}
      className={cardBaseStyle(temaNoturno)}
    >
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
          <div className="flex-1"><h3 className="text-[20px] font-bold tracking-tight mb-1">Acerto de Motoboys</h3><p className={`text-[12px] font-medium ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Controle logístico.</p></div>
          <div className="flex items-center gap-3">
              <button 
                onClick={toggleMotoboy} 
                className={`w-12 h-6 rounded-full relative transition-colors duration-300 shrink-0 shadow-inner border ${motoboyAtivo ? (temaNoturno ? 'bg-zinc-200 border-transparent' : 'bg-zinc-900 border-transparent') : (temaNoturno ? 'bg-transparent border-white/20' : 'bg-transparent border-black/20')}`}
              >
                <motion.span 
                  layout 
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className={`absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-sm ${temaNoturno ? (motoboyAtivo ? 'bg-zinc-900' : 'bg-zinc-400') : (motoboyAtivo ? 'bg-white' : 'bg-zinc-400')}`} 
                  style={{ x: motoboyAtivo ? 24 : 0 }}
                />
              </button>
          </div>
        </div>
        <motion.div 
          animate={{ opacity: motoboyAtivo ? 1 : 0.5, borderColor: motoboyAtivo ? (temaNoturno ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)') : (temaNoturno ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'), backgroundColor: motoboyAtivo ? (temaNoturno ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)') : 'transparent' }}
          className={`flex flex-col items-center justify-center p-6 flex-1 rounded-[20px] transition-colors duration-300 border ${motoboyAtivo ? 'pointer-events-auto' : 'pointer-events-none'}`}
        >
            <div className="mb-6 text-center w-full">
              <p className={labelStyle(temaNoturno)}>Valor Pendente Hoje</p>
              <p className={`text-[36px] font-bold tracking-tight tabular-nums ${temaNoturno ? 'text-white' : 'text-black'}`}>R$ {(pendenteMotoboy || 0).toFixed(2)}</p>
            </div>
            <button onClick={abrirConfirmacaoMotoboy} disabled={!motoboyAtivo || pendenteMotoboy <= 0} className={`w-full px-6 py-4 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 active:scale-[0.97] border shadow-sm disabled:opacity-50 disabled:active:scale-100 ${temaNoturno ? 'bg-zinc-800 border-white/10 text-white hover:bg-zinc-700' : 'bg-white border-black/10 text-zinc-900 hover:bg-zinc-50'}`}>Autorizar Pagamento</button>
        </motion.div>
      </div>
    </motion.section>
  );
};