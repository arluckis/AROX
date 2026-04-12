import { useState, useMemo } from 'react';

export function useMotorBusca({
  categoriasSeguras,
  categoriaSelecionada,
  adicionarProdutoNaComanda,
  setFiltroCategoriaCardapio,
  filtroCategoriaCardapio
}) {
  const [filtroTexto, setFiltroTexto] = useState('');

  const itensFiltrados = useMemo(() => {
    if (!filtroTexto) return categoriaSelecionada?.itens || [];
    const busca = filtroTexto.toLowerCase();
    const termoBuscaReal = busca.includes('*') ? busca.split('*')[1].trim() : busca;
    if (!termoBuscaReal) return categoriaSelecionada?.itens || [];

    return categoriasSeguras.flatMap(c => c.itens || []).filter(p => 
      p.nome.toLowerCase().includes(termoBuscaReal) || 
      (p.codigo && String(p.codigo).toLowerCase().includes(termoBuscaReal))
    );
  }, [categoriasSeguras, categoriaSelecionada, filtroTexto]);

  const handleBuscaKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!filtroTexto.trim()) return;

      let qtd = 1;
      let busca = filtroTexto.trim().toLowerCase();
      
      if (busca.includes('*')) {
        const parts = busca.split('*');
        qtd = parseInt(parts[0]) || 1;
        busca = parts[1].trim();
      }

      if (!busca) return;

      let produtoEncontrado = null;
      let idCategoriaDoProduto = null;

      for (const cat of categoriasSeguras) {
        if (cat.itens) {
          produtoEncontrado = cat.itens.find(p => String(p.id) === busca || (p.codigo && String(p.codigo).toLowerCase() === busca));
          if (produtoEncontrado) { idCategoriaDoProduto = cat.id; break; }
        }
      }

      if (!produtoEncontrado && itensFiltrados.length > 0) {
        produtoEncontrado = itensFiltrados[0];
        const catEncontrada = categoriasSeguras.find(c => c.itens?.some(i => i.id === produtoEncontrado.id));
        if (catEncontrada) idCategoriaDoProduto = catEncontrada.id;
      }

      if (produtoEncontrado) {
        adicionarProdutoNaComanda(produtoEncontrado, qtd);
        setFiltroTexto('');
        if (idCategoriaDoProduto && idCategoriaDoProduto !== filtroCategoriaCardapio) {
          setFiltroCategoriaCardapio(idCategoriaDoProduto);
        }
      }
    }
  };

  return {
    filtroTexto,
    setFiltroTexto,
    itensFiltrados,
    handleBuscaKeyDown
  };
}