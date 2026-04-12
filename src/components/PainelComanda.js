'use client';
import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import SystemLoader from './SystemLoader';
import ErrorBoundary from './ui/ErrorBoundary';

// Importação Assíncrona dos Músicos + Skeleton Loaders
import { SkeletonCategorias, SkeletonGradeProdutos, SkeletonCarrinho } from './ui/Skeletons';

const BarraBusca = dynamic(() => import('./PainelComanda/BarraBusca'), { ssr: false });
const TabsMobile = dynamic(() => import('./PainelComanda/TabsMobile'), { ssr: false });

const BarraCategorias = dynamic(() => import('./PainelComanda/BarraCategorias'), { 
  ssr: false, 
  loading: () => <SkeletonCategorias /> 
});

const GradeProdutos = dynamic(() => import('./PainelComanda/GradeProdutos'), { 
  ssr: false, 
  loading: () => <SkeletonGradeProdutos abaDetalheMobile={'menu'} /> 
});

const ResumoCarrinho = dynamic(() => import('./PainelComanda/ResumoCarrinho'), { 
  ssr: false, 
  loading: () => <SkeletonCarrinho abaDetalheMobile={'resumo'} /> 
});

// Hooks Lógicos
import { useAtalhosTeclado } from '@/hooks/useAtalhosTeclado';
import { useMotorBusca } from '@/hooks/useMotorBusca';

export default function PainelComanda({
  temaNoturno, comandaAtiva, abaDetalheMobile, setAbaDetalheMobile,
  filtroCategoriaCardapio, setFiltroCategoriaCardapio, menuCategorias,
  adicionarProdutoNaComanda, excluirGrupoProdutos, setMostrarModalPeso,
  tagsGlobais, toggleTag, editarProduto, excluirProduto,
  setMostrarModalPagamento, encerrarMesa, setIdSelecionado,
  alterarNomeComanda, adicionarClienteComanda, alternarTipoComanda, modalAberto
}) {
  
  const inputBuscaRef = useRef(null);

  const categoriasSeguras = Array.isArray(menuCategorias) ? menuCategorias : [];
  const produtosSeguros = Array.isArray(comandaAtiva?.produtos) ? comandaAtiva.produtos : [];
  const categoriaSelecionada = categoriasSeguras.find(c => c.id === filtroCategoriaCardapio) || categoriasSeguras[0];

  useEffect(() => {
    const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (inputBuscaRef.current && !modalAberto && !isMobile) inputBuscaRef.current.focus();
  }, [comandaAtiva?.id, modalAberto]);

  const { filtroTexto, setFiltroTexto, itensFiltrados, handleBuscaKeyDown } = useMotorBusca({
    categoriasSeguras, categoriaSelecionada, adicionarProdutoNaComanda,
    setFiltroCategoriaCardapio, filtroCategoriaCardapio
  });

  useAtalhosTeclado({
    modalAberto, produtosSeguros, comandaAtiva, setMostrarModalPeso,
    setMostrarModalPagamento, encerrarMesa, setIdSelecionado,
    alternarTipoComanda, inputBuscaRef
  });

  if (!comandaAtiva) return (
    <div className={`flex flex-col flex-1 items-center justify-center w-full h-[calc(100vh-64px)] ${temaNoturno ? 'bg-[#0A0A0A]' : 'bg-[#FAFAFA]'}`}>
      <SystemLoader variant="section" text="Aguardando inicialização..." />
    </div>
  );

  return (
    <div className={`flex flex-col w-full flex-1 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out ${temaNoturno ? 'bg-[#0A0A0A]' : 'bg-[#FAFAFA]'}`}>
      
      {/* 1. Busca - Mantém a altura e borda inferior */}
      <ErrorBoundary 
        key={`busca-${comandaAtiva?.id || 'vazio'}`} 
        modulo="Busca" codigoErro="ERR-BUSCA-101" temaNoturno={temaNoturno} empresaId={comandaAtiva?.empresa_id}
        fallbackClassName="w-full shrink-0 border-b min-h-[64px]"
      >
        <BarraBusca 
          temaNoturno={temaNoturno} inputBuscaRef={inputBuscaRef}
          filtroTexto={filtroTexto} setFiltroTexto={setFiltroTexto} handleBuscaKeyDown={handleBuscaKeyDown}
        />
      </ErrorBoundary>

      {/* 2. Categorias - Mantém a altura e borda inferior */}
      <ErrorBoundary 
        key={`cat-${comandaAtiva?.id || 'vazio'}`} 
        modulo="Categorias" codigoErro="ERR-CATEG-202" temaNoturno={temaNoturno} empresaId={comandaAtiva?.empresa_id}
        fallbackClassName="w-full shrink-0 border-b min-h-[56px]"
      >
        <BarraCategorias 
          temaNoturno={temaNoturno} categoriasSeguras={categoriasSeguras}
          categoriaSelecionada={categoriaSelecionada} setFiltroCategoriaCardapio={setFiltroCategoriaCardapio}
          setFiltroTexto={setFiltroTexto}
        />
      </ErrorBoundary>
      
      <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-transparent">
        
        {/* 3. Tabs Mobile - Mantém as margens e bordas do mobile */}
        <ErrorBoundary 
          key={`tabs-${comandaAtiva?.id || 'vazio'}`} 
          modulo="Tabs Mobile" codigoErro="ERR-TABS-505" temaNoturno={temaNoturno} empresaId={comandaAtiva?.empresa_id}
          fallbackClassName="md:hidden flex mx-4 mt-4 rounded-lg shrink-0 border min-h-[42px]"
        >
          <TabsMobile 
            temaNoturno={temaNoturno} abaDetalheMobile={abaDetalheMobile}
            setAbaDetalheMobile={setAbaDetalheMobile} qtdProdutos={produtosSeguros.filter(p=>p.id).length}
          />
        </ErrorBoundary>
        
        {/* 4. Grade de Produtos - Trava 65% a 70% da tela com borda direita */}
        <ErrorBoundary 
          key={`cardapio-${comandaAtiva?.id || 'vazio'}`} 
          modulo="Grade de Produtos" codigoErro="ERR-PRODS-303" temaNoturno={temaNoturno} empresaId={comandaAtiva?.empresa_id}
          fallbackClassName={`w-full md:w-[65%] lg:w-[70%] h-full border-r ${abaDetalheMobile === 'menu' ? 'flex' : 'hidden md:flex'}`}
        >
          <GradeProdutos 
            temaNoturno={temaNoturno} abaDetalheMobile={abaDetalheMobile}
            setMostrarModalPeso={setMostrarModalPeso} filtroTexto={filtroTexto}
            categoriaSelecionada={categoriaSelecionada} itensFiltrados={itensFiltrados}
            adicionarProdutoNaComanda={adicionarProdutoNaComanda}
          />
        </ErrorBoundary>
          
        {/* 5. Carrinho - Trava 35% a 30% da tela */}
        <ErrorBoundary 
          key={`carrinho-${comandaAtiva?.id || 'vazio'}`} 
          modulo="Resumo Financeiro" codigoErro="ERR-CARR-404" temaNoturno={temaNoturno} empresaId={comandaAtiva?.empresa_id}
          fallbackClassName={`w-full md:w-[35%] lg:w-[30%] h-full ${abaDetalheMobile === 'resumo' ? 'flex' : 'hidden md:flex'}`}
        >
          <ResumoCarrinho 
            temaNoturno={temaNoturno} abaDetalheMobile={abaDetalheMobile}
            produtosSeguros={produtosSeguros} comandaAtiva={comandaAtiva}
            excluirProduto={excluirProduto} adicionarProdutoNaComanda={adicionarProdutoNaComanda}
            excluirGrupoProdutos={excluirGrupoProdutos} editarProduto={editarProduto}
            setMostrarModalPagamento={setMostrarModalPagamento} encerrarMesa={encerrarMesa}
          />
        </ErrorBoundary>
        
      </div>
    </div>
  );
}