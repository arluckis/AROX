Guia de Contexto Técnico - Comandas Bom a Bessa
Arquitetura do Sistema
Framework: Next.js (App Router).

Interface e Estilização: Tailwind CSS e Lucide React para iconografia.

Backend e Persistência: Supabase (PostgreSQL e Supabase Auth).

Instância do Cliente: Centralizada em src/lib/supabase.js.

Definição da Estrutura de Dados (Supabase)
Tabela comandas: Armazena os registros principais dos pedidos (id, numero, status, mesa, cliente, total, empresa_id).

Tabela itens_comanda: Detalha os produtos vinculados a cada comanda (id, comanda_id, produto_id, quantidade, preco_unitario, observacoes).

Tabela produtos: Cadastro de itens comercializáveis (id, nome, preco, categoria, codigo_barras, empresa_id).

Tabela caixas: Registro de operações financeiras, controle de abertura e fechamento vinculado ao usuario_id.

Regras de Negócio Fundamentais
Isolamento de Dados (Multi-tenancy): Todos os registros são vinculados a um empresa_id. É mandatório filtrar todas as consultas e operações de escrita por este identificador para garantir a segregação de dados entre clientes.

Operações por Peso: Itens comercializados por quilograma são processados via ModalPeso.js, garantindo a precisão no cálculo de produtos fracionados.

Ciclo de Vida da Comanda: Os estados permitidos para o campo status são estritamente: 'aberta', 'fechada' e 'cancelada'.

Sistema de Fidelidade: Implementado em TabFidelidade.js, responsável pela gestão de pontuação e benefícios aos clientes recorrentes.

Padrões de Desenvolvimento e Clean Code
Componentização: Uso obrigatório de Componentes Funcionais e Arrow Functions.

Gestão de Estado: Utilização padronizada de Hooks nativos (useState, useEffect).

Evolução Arquitetural: Atualmente, as chamadas ao banco de dados estão nos componentes, mas o objetivo é a migração progressiva dessa lógica para camadas isoladas em /services ou Hooks customizados para melhor manutenibilidade.