# Plano: tela do livro (diálogo "Sua obra")

Status: **opção B implementada em 2026-11-24** (decisões adotadas: salvamento automático das páginas, abas Leitura / Anotações / Sobre, "Retirar da estante" como link no rodapé da aba Sobre).

## 1. O que a tela é hoje

Diálogo aberto ao clicar numa lombada (`features/library/BookDetailDialog.jsx` + `features/reading/BookReadingPanel.jsx`). Agora tem a altura de uma capa (600 px): capa à esquerda e o conteúdo, que rola, à direita.

Conteúdo, de cima para baixo:
- **Cabeçalho:** "sua obra", título, autor e três etiquetas (gênero, páginas, situação).
- **Abas:** Ler | Sobre.
- **Aba Ler:** cronômetro com "Iniciar leitura" e meta do dia; Objetivos da sessão (tempo e páginas); Anotações da sessão (recolhido); Tarefas deste livro; e só no fim "Sua leitura" (páginas lidas, categoria, barra de progresso, "Salvar progresso").
- **Aba Sobre:** sinopse; avaliação (só libera depois de concluir); "Retirar da estante".

## 2. Problemas encontrados

1. **Rola demais:** só a aba Ler tem cerca de 1.100 px de conteúdo dentro de um painel de 600 px.
2. **O principal está no fim:** o progresso do livro (páginas, %) e a categoria ficam no último bloco, abaixo de objetivos, notas e tarefas. O cabeçalho não mostra progresso.
3. **Dois jeitos de registrar leitura:** cronômetro/objetivos da sessão e o formulário "Páginas lidas", em lugares separados, com o botão "Salvar progresso" à parte.
4. **Muitos campos expostos de uma vez:** metas, notas, tarefas e formulário competem pela atenção.
5. **Ações importantes escondidas:** avaliação e "Retirar da estante" só aparecem na aba Sobre; a situação do livro aparece como etiqueta, mas só se edita lá embaixo.
6. **Textos misturados:** minúsculas ("sua obra", "acompanhamento") e títulos em caixa normal convivem.

## 3. O que a pessoa precisa fazer aqui (por ordem de frequência)

1. Começar ou continuar a ler (cronômetro).
2. Ver e atualizar onde parou (páginas e %).
3. Mudar a situação (Desejos, Lendo, Já lidos).
4. Anotar e listar tarefas do livro.
5. Ler a sinopse e avaliar depois de terminar.
6. Retirar o livro da estante (raro, precisa de confirmação).

## 4. Opções de estrutura

**A. Painel único, sem abas, com seções recolhíveis**
- Cabeçalho com progresso e situação; cartão do cronômetro; seções "Objetivos", "Anotações", "Tarefas" e "Sobre" como acordeões.
- A favor: tudo numa tela, sem trocar de aba.
- Contra: acordeões abertos voltam a ficar longos; a sinopse e a avaliação ficam enterradas.

**B. Abas por intenção (recomendada): Leitura | Anotações | Sobre**
- **Cabeçalho fixo:** título, autor, gênero e uma linha de progresso "120 de 522 páginas · 23%" com a situação editável ali mesmo (seletor Desejos / Lendo / Já lidos).
- **Leitura:** cronômetro com "Iniciar leitura", meta do dia e, em uma linha só, as metas da sessão. Cabe em 600 px sem rolar.
- **Anotações:** anotações da sessão e tarefas do livro.
- **Sobre:** sinopse, avaliação (visível, com aviso quando ainda não dá para avaliar) e "Retirar da estante" como link discreto no rodapé, com confirmação no próprio lugar.
- **Progresso:** as páginas lidas ficam editáveis na linha de progresso do cabeçalho e salvam sozinhas ao sair do campo, sem o botão "Salvar progresso".
- A favor: o essencial sem rolagem; a ordem segue a frequência de uso; o modal fica no tamanho da capa.
- Contra: troca o nome e o conteúdo das abas atuais; exige mexer no salvamento do progresso.

**C. Trocar o modal por uma página do livro (`/livro/:id`)**
- Capa grande fixa à esquerda e conteúdo amplo à direita, com link compartilhável e voltar do navegador.
- A favor: espaço para tudo e para crescer (histórico de sessões, citações).
- Contra: maior mudança (rota nova, perda do efeito "retirar da estante"); foge do pedido de reduzir o tamanho.

## 5. Recomendação

Opção **B**. Ela resolve o excesso de rolagem, põe o progresso e a situação onde a pessoa procura, e mantém o modal compacto com a capa encaixada. A opção C fica como evolução futura.

## 6. Plano de implementação (cada fase com aprovação)

1. **Cabeçalho com progresso e situação editável**, mais o salvamento automático das páginas lidas.
2. **Abas Leitura | Anotações | Sobre**, redistribuindo os blocos de `BookReadingPanel` e de `BookDetailDialog` (cronômetro e metas de um lado; notas e tarefas do outro).
3. **Aba Sobre:** avaliação sempre visível e "Retirar da estante" no rodapé com confirmação.
4. **Celular:** abas em rolagem horizontal e capa pequena em cima, como hoje.
5. **Conferência:** portal em 1200 × 726 e 390 × 844, `lint`, `build`, e teste de foco e teclado (a armadilha de foco já existe no diálogo).

## 7. Decisões que dependem do usuário

1. Ficar com a opção B?
2. O progresso salva sozinho ao sair do campo, ou prefere manter um botão "Salvar"?
3. O nome das abas está bom (Leitura, Anotações, Sobre)?
4. "Retirar da estante" fica como link no rodapé da aba Sobre ou vai para um menu "⋯" no cabeçalho?
