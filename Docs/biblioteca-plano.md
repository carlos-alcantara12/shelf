# Plano: Minha biblioteca (`/biblioteca`)

Status: **proposta para aprovação, nada implementado.** Escopo aberto pelo usuário em 2026-11-21 (organização e design da tela).

## 1. Como a tela está hoje

**Arquitetura**
- `pages/library/LibraryPage.jsx` (470 linhas) concentra tudo: filtros, arrastar e soltar, render da estante, um globo em SVG de ~30 linhas, e o painel lateral (progresso e leitura atual).
- `app/LibraryContext.jsx` guarda a lista de livros e o livro aberto; `features/library/BookDetailDialog.jsx` é o diálogo de detalhes.
- `app/AppLayout.jsx` traz o cabeçalho com a navegação (4 botões com SVG e `TextType` repetidos à mão).
- `src/styles.css` tem 2.785 linhas e quase 30 blocos de sobrescrita em cascata ("Final...", "Keep...", "Monochrome...", "Shared dark palette..."). Há três paletas empilhadas (madeira quente, monocromática lavanda, escuro). Nenhuma usa os tokens do `styles/tokens.css`.

**Problemas encontrados (confirmados no código e na tela)**
1. **Filtros não filtram.** Busca, gênero e abas "Todos / Desejos / Lendo / Já lidos" gravam estado, mas a lista vem de `fetchAllPages("/library/")` sem parâmetros. O backend já aceita `search` e `genre` (`views.py:290`).
2. **Contagens erradas.** "da seleção exibida" lê `entries`, que nunca é filtrada.
3. **Números ilegíveis.** A fonte serifada usa algarismos "old-style": `0 de 0 livros` aparece como "o de o livros".
4. **Cursor residual no menu.** O `TextType` deixa uma barra depois do texto: "Minha biblioteca|".
5. **Inconsistência visual.** Abertura, login e diagnóstico são papel claro e terracota; a biblioteca é escura com lavanda (aba ativa) e azulado (placeholder).
6. **Ordem de leitura confusa.** Título, busca, abas, estante e um painel lateral competem; "Adicionar livro" fica solto no alto da coluna lateral.
7. **Estado vazio fraco.** Só um ícone e um botão apagado, sem caminho para quem acabou de se cadastrar (ex.: o perfil de leitor).
8. **Acessibilidade.** Arrastar é o único jeito de reorganizar; falta alternativa por teclado. O botão "buscar" exige clique mesmo com abas que filtram na hora.

## 2. Fases propostas (cada uma com sua aprovação)

**Fase 1: corrigir o que está quebrado (sem mudar o visual)**
- Filtrar de verdade: busca e gênero por parâmetro da API (com debounce, sem botão obrigatório), status no cliente; contagens do painel calculadas sobre a lista completa, não sobre a seleção.
- Algarismos tabulares/lining nos números; remover o cursor residual do menu.
- Mensagens distintas para "estante vazia" e "nenhum livro corresponde".

**Fase 2: organização do código**
- Dividir `LibraryPage` em `features/library/`: `Bookshelf`, `BookSpine`, `useShelfDrag` (hook com a lógica de arrastar), `LibraryFilters`, `LibraryOverview`, `ShelfProps` (globo e luminárias).
- Extrair o menu do cabeçalho para um componente com lista de itens.
- Mover o CSS da biblioteca para `pages/library/library.css` com tokens, apagando os blocos mortos de `styles.css`.

**Fase 3: design alinhado à abertura**
- Paleta papel/terracota do sistema (decisão pendente: ver §3), tipografia dos tokens, componentes do design system (botões, abas).
- Hierarquia nova: cabeçalho da página com título, contagem e "Adicionar livro"; barra de busca e abas numa única linha; estante como foco; painel lateral compacto (progresso e leitura atual).
- Estado vazio com convite: explorar o catálogo e, se não houver perfil, "Descobrir meu perfil de leitor".
- Responsivo: painel lateral abaixo da estante em telas estreitas; estante com 3 a 4 livros por prateleira no celular (hoje fixo em 6).

**Fase 4: refinamentos**
- Reordenar por teclado (mover livro com setas no foco da lombada).
- Ordenação (título, autor, recentes) e visão em grade de capas como alternativa à estante.
- Estatísticas úteis no painel (meta anual, páginas lidas no mês) reaproveitando `/progresso`.

## 3. Decisões necessárias
1. **Tema:** migrar a biblioteca para papel claro com terracota, como o resto do redesign, ou manter o escuro e só limpar a paleta (retirando o lavanda)?
2. **Estante em madeira:** manter a estética de armário (madeira, globo, luminárias) ou simplificar para prateleiras limpas?
3. **Dados para verificar:** a conta aberta no portal tem 0 livros. Para validar a estante preciso de livros de teste; posso usar um backend isolado (porta 8002) com uma conta de teste, sem tocar no seu banco.
4. **Ordem:** começar pela Fase 1 (correções) e só depois decidir o visual?

## 4. Verificação
Cada fase é conferida no portal do Maestri (desktop 1200 px e celular 390 px), com `npm run lint`, `npm run build` e, na Fase 1, testes do backend se algum parâmetro de API mudar.
