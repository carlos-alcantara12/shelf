# Perfil de leitor do Shelf — especificação para aprovação

> **Status: Fases B (backend, `Backend/diagnostic/`, 54 testes) e C (frontend: `/diagnostico`, `/cadastro`) implementadas. As indicações de livros (Fase D) e a integração com as telas internas (Fase E) ainda não existem.**
> Decisões já tomadas: (1) o questionário vem **antes** de criar a conta; (2) os três níveis são **camadas de um banco único**; (3) as indicações vêm de **curadoria + regras**; (4) este documento é rascunhado por Claude e aprovado por Carlos.

---

## 1. Objetivo e princípios

Entender que tipo de leitor a pessoa é e o que ela provavelmente vai gostar de ler, para que a primeira tela depois do cadastro já tenha indicações úteis (o chamado "cold start").

1. **Perfil de leitor, não diagnóstico.** O texto da interface não deve sugerir avaliação clínica nem psicológica. É um retrato de gostos e hábitos.
2. **Honestidade sobre precisão.** Um questionário não descreve alguém "quase perfeitamente". Mostramos o *nível de detalhe* do perfil (básico, intermediário, completo), sem percentuais inventados, e dizemos o que ainda não sabemos. O perfil melhora com o uso real (o que a pessoa adiciona, avalia e abandona).
3. **Camadas, não questionários separados.** Nível 2 contém o nível 1; nível 3 contém o 2. Quem aprofunda depois responde só o que falta.
4. **Explicável.** Toda indicação diz o porquê ("porque você prefere ritmo lento e personagens complexos").
5. **Sem bloqueio.** Todas as perguntas aceitam "prefiro não responder", e há caminho para pular o diagnóstico e criar a conta direto.
6. **Privacidade (LGPD).** As respostas são dados pessoais. Aviso claro de uso, nada de dados sensíveis, e a pessoa pode apagar o perfil.

---

## 2. Fluxo de telas

```
Abertura ("/")
  ├─ Entrar ───────────────────────────► /entrar  (login; quem já tem conta)
  └─ Criar conta / Criar minha estante ─► /diagnostico
                                            1. escolha do nível (10 · 20 · 40)
                                            2. perguntas (uma por tela, em blocos de 10)
                                            3. resultado
                                            4. "Salvar meu perfil" ─► /cadastro ─► /biblioteca
```

- As respostas ficam no navegador (`localStorage`, chave `shelf:diagnostico`) até o cadastro. Se a pessoa sair no meio, **retoma de onde parou**.
- O botão "Criar conta" do login passa a levar a `/diagnostico`. O formulário de cadastro vira o passo final (`/cadastro`).
- Link discreto em todas as telas do diagnóstico: **"Pular e criar conta"**.
- Quem já tem conta pode fazer ou refazer o perfil depois (precisa de uma entrada no app; ver §10).

**Escolha do nível (tela 1)** — três cartões no estilo da abertura:

| Nível | Perguntas | Tempo | O que a pessoa recebe |
|---|---|---|---|
| Rápido | 10 | ~2 min | Tipo de leitor, 3 gêneros e 5 indicações |
| Intermediário | 20 | ~5 min | Perfil com traços secundários e 10 indicações em grupos |
| Completo | 40 | ~10 min | Relatório completo e 20 ou mais indicações com motivo |

O cartão do meio vem destacado, mas **"Rápido" pode ser aprofundado depois** com um botão "Responder mais 10".

**Mecânica das perguntas:** uma por tela, barra de progresso por bloco, botão voltar, resultado parcial entre blocos de 10 ("seu perfil até agora…"), teclado e leitor de tela totalmente suportados, sem limite de tempo.

---

## 3. Modelo do perfil

O perfil é um conjunto de eixos. Cada resposta soma pontos a um ou mais eixos.

### 3.1 Afinidade por gênero (0–100 cada)
`G1` Fantasia · `G2` Ficção científica · `G3` Romance · `G4` Mistério e suspense · `G5` Terror · `G6` Clássicos · `G7` História e biografias · `G8` Ciência e conhecimento · `G9` Desenvolvimento pessoal · `G10` Poesia e crônicas · `G11` Humor · `G12` Quadrinhos e graphic novels

### 3.2 Eixos de estilo (0–100, dois polos)
| Eixo | 0 | 100 |
|---|---|---|
| `S1` Ritmo | Contemplativo | Acelerado |
| `S2` Foco | Personagens | Trama |
| `S3` Tom | Leve | Sombrio |
| `S4` Complexidade | Acessível | Desafiador |
| `S5` Realidade | Realista | Imaginativo |
| `S6` Extensão | Curto | Longo |

### 3.3 Hábitos
`H1` Volume (livros por mês) · `H2` Constância (em ondas ↔ diária) · `H3` Formato (físico, e-book, áudio) · `H4` Leituras simultâneas · `H5` Persistência (abandona fácil ↔ termina sempre) · `H6` Exploração (fiel ao conhecido ↔ aventureiro) · `H7` Sociabilidade (solitária ↔ compartilha)

### 3.4 Motivação
`M1` Escapar · `M2` Aprender · `M3` Sentir · `M4` Relaxar · `M5` Desafiar-se · `M6` Pertencer e conversar

### 3.5 Restrições
Lista do que a pessoa quer **evitar** (violência gráfica, finais tristes, linguagem antiga, livros longos etc.) e **idioma**. Funcionam como filtros: uma indicação que as viola é descartada, não só penalizada.

---

## 4. Tipos de leitor (8)

Nomes originais, usados só como rótulo. Cada tipo é um "centro" no espaço dos eixos; a pessoa recebe o mais próximo e, se houver um segundo muito perto, um traço secundário.

| Tipo | Retrato | Sinais fortes |
|---|---|---|
| **Explorador** | Curioso, varia muito de gênero e adora descobrir autores novos | `H6` alto, vários `G` médios, `S5` alto |
| **Imersivo** | Gosta de mundos grandes e longos, onde mora por semanas | `G1`/`G2`, `S6` alto, `M1` alto, `S2` baixo |
| **Estudioso** | Lê para entender; anota, compara, aprofunda | `G7`/`G8`, `M2` e `M5` altos, `S4` alto |
| **Contemplativo** | Lê devagar, saboreia a escrita, prefere o íntimo ao espetáculo | `S1` baixo, `G6`/`G10`, `S2` baixo, `M4` |
| **Maratonista** | Devora livros e séries, precisa de ritmo e reviravoltas | `H1` alto, `S1` alto, `S2` alto, `G4`/`G5` |
| **Sentimental** | Lê para sentir; as personagens importam mais que a trama | `M3` alto, `G3`, `S2` baixo, `S3` varia |
| **Curador** | Seletivo e fiel; relê, ama a estante e os clássicos | `H6` baixo, `G6`, formato físico, `H5` alto |
| **Pragmático** | Quer ideias aplicáveis, em livros curtos e objetivos | `G9`/`G8`, `S6` baixo, `S4` baixo, áudio ou e-book |

---

## 5. Banco de 40 perguntas

**Tipos:** `1` escolha única · `✔` checklist (marque os que se aplicam) · `★` escala de 1 a 5 ("discordo totalmente" → "concordo totalmente") · `3` escolha até 3 · `✎` texto livre opcional.
Toda pergunta tem a opção **"Prefiro não responder"**, que não conta na pontuação.

### Bloco 1 — O essencial (Q1–Q10) · nível 1

| # | Tipo | Pergunta | Opções | Mede |
|---|---|---|---|---|
| 1 | ✔ | Quais gêneros você costuma gostar de ler? (até 5) | Os 12 gêneros de §3.1 | `G1–G12` |
| 2 | 1 | Quantos livros você lê, em média, por mês? | Quase nenhum · 1 · 2 a 3 · 4 a 6 · 7 ou mais | `H1` |
| 3 | 1 | O que mais te atrai em um livro? | A trama · Os personagens · As ideias · O estilo da escrita | `S2`, `S4`, `M2` |
| 4 | ★ | "Prefiro histórias de ritmo rápido, que me prendem logo nas primeiras páginas." | — | `S1` |
| 5 | 1 | Que tom você procura com mais frequência? | Leve e divertido · Emocionante · Reflexivo · Sombrio e tenso | `S3`, `M3`, `M4` |
| 6 | 1 | Por que você lê, principalmente? | Escapar da rotina · Aprender · Sentir emoções · Relaxar · Me desafiar | `M1`–`M5` |
| 7 | 1 | Que tamanho de livro você prefere? | Até 200 páginas · 200 a 350 · 350 a 500 · 500 ou mais, sem problema | `S6` |
| 8 | ✔ | O que você prefere evitar? | Violência explícita · Romance muito previsível · Finais tristes · Linguagem antiga · Livros muito longos · Temas muito pesados · Terror | restrições |
| 9 | 1 | Em que formato você mais lê? | Físico · E-book · Audiolivro · Varia | `H3` |
| 10 | 1 | Quando um livro não te prende, o que você faz? | Insisto até o fim · Dou umas 50 páginas · Abandono sem culpa · Pulo trechos | `H5` |

### Bloco 2 — Gosto fino (Q11–Q20) · acrescenta o nível 2

| # | Tipo | Pergunta | Opções | Mede |
|---|---|---|---|---|
| 11 | ★ | "Gosto de mundos imaginários, com magia, tecnologia ou regras diferentes das nossas." | — | `S5`, `G1`, `G2` |
| 12 | ★ | "Gosto de livros baseados em fatos reais." | — | `S5` (baixo), `G7`, `G8` |
| 13 | 1 | Você prefere personagens… | Que mudam muito ao longo da história · Marcantes e firmes desde o início · Vários pontos de vista · Tanto faz | `S2` |
| 14 | 1 | Como você gosta de finais? | Fechados e satisfatórios · Abertos, que fazem pensar · Surpreendentes · Felizes | `S3`, `S4` |
| 15 | ★ | "Gosto de livros que me desafiam, com linguagem ou ideias complexas." | — | `S4`, `M5` |
| 16 | 1 | Que estilo de escrita você prefere? | Simples e direto · Poético e cuidadoso · Com humor e ironia · Detalhista e descritivo | `S4`, `G10`, `G11` |
| 17 | ✔ | Que temas te interessam? (até 5) | Amizade · Amor · Família · Poder e política · Guerra e história · Natureza · Mistérios do passado · Tecnologia e futuro · Espiritualidade · Autodescoberta · Sociedade e desigualdade · Viagem e aventura | temas (usados no ranking) |
| 18 | 1 | Séries ou volumes únicos? | Série longa · Trilogia ou duologia · Sempre únicos · Tanto faz | `S6`, `H4` |
| 19 | ★ | "Gosto de me surpreender com reviravoltas." | — | `S2`, `G4` |
| 20 | 1 | Qual destes começos te chamaria mais atenção? | Quatro trechos curtos **originais** (a escrever): fantasia épica · suspense · romance · ensaio de ideias | `G1`/`G4`/`G3`/`G8`, confere Q1 |

### Bloco 3 — Hábitos e contexto (Q21–Q30) · acrescenta o nível 3

| # | Tipo | Pergunta | Opções | Mede |
|---|---|---|---|---|
| 21 | 1 | Quando você costuma ler? | De manhã · À tarde · À noite, antes de dormir · Em deslocamentos · Nos fins de semana | `H2` |
| 22 | 1 | Por quanto tempo você lê de cada vez? | Até 15 min · 15 a 30 · 30 a 60 · Mais de 1 hora | `H1`, `H2` |
| 23 | 1 | Você lê um livro por vez? | Um por vez · Dois ou três juntos · Vários ao mesmo tempo | `H4` |
| 24 | ★ | "Leio todos os dias, mesmo que sejam poucas páginas." | — | `H2` |
| 25 | 1 | Qual é a sua meta de leitura? | Sem meta · 1 livro por mês · 1 por semana · Uma meta anual específica | `H1`; sugestão de meta |
| 26 | 1 | Como você escolhe o próximo livro? | Indicação de amigos · Resenhas e listas · Autor que já conheço · Capa e sinopse · Sugestão de loja ou app | `H6`, `H7` |
| 27 | 1 | Você relê livros? | Nunca · Às vezes, os favoritos · Com frequência | `H6` (baixo) |
| 28 | ★ | "Gosto de conversar sobre o que li, em clubes ou com amigos." | — | `H7`, `M6` |
| 29 | 1 | Onde você lê? | Em casa, em silêncio · Em movimento · Em locais públicos · Em qualquer lugar | contexto |
| 30 | 1 | Como você costuma conseguir seus livros? | Compro · Biblioteca · Empréstimo · Assinatura ou digital | disponibilidade das indicações |

### Bloco 4 — Nuances (Q31–Q40) · completa o nível 3

| # | Tipo | Pergunta | Opções | Mede |
|---|---|---|---|---|
| 31 | ★ | "Prefiro descobrir autores novos a reler os que já conheço." | — | `H6` |
| 32 | 1 | Em que idioma você lê? | Só português · Português e inglês · Também espanhol · Outros | filtro de idioma |
| 33 | 1 | Quando um livro te emociona muito, você… | Anota trechos · Indica a alguém · Procura mais do autor · Fica pensando nele | `M6`, `M3`, `H6` |
| 34 | ★ | "Gosto de livros que me fazem chorar ou sentir muito." | — | `M3`, `S2` (baixo) |
| 35 | ★ | "Gosto de livros que me deixam em tensão, com medo ou ansiedade." | — | `S3`, `G4`, `G5` |
| 36 | 1 | Que tipo de não ficção mais te atrai? | Ciência e natureza · História e política · Biografias e memórias · Psicologia e comportamento · Negócios e carreira · Nenhuma | `G7`, `G8`, `G9` |
| 37 | 1 | O que você quer ler agora? | Algo que me conforte · Algo que me desafie · Algo que me faça fugir · Algo que me ensine | `M4`, `M5`, `M1`, `M2` |
| 38 | 3 | Escolha até 3 palavras para o livro dos sonhos | Envolvente · Profundo · Leve · Surpreendente · Poético · Inteligente · Emocionante · Inspirador · Divertido · Sombrio · Épico · Íntimo | `S1`–`S4`, `M` |
| 39 | 1 | Qual é a sua relação com os clássicos? | Adoro · Respeito, mas evito · Tenho curiosidade · Prefiro contemporâneos | `G6`, `S4` |
| 40 | ✎ | Cite até 3 livros que marcaram você (opcional) | Texto livre | **não pontua**; evita indicar o que já leu e aponta a livros parecidos |

**Estimativas:** 10 perguntas ≈ 2–3 min, 20 ≈ 5–6 min, 40 ≈ 10–12 min.

---

## 6. Pontuação

Fica **no servidor** (uma única fonte de verdade) e é **determinística**: as mesmas respostas dão sempre o mesmo resultado.

1. Cada opção tem *efeitos*: pares `(eixo, peso)` com peso de −2 a +2 (estilo e motivação) ou 0 a +2 (gêneros).
2. Para cada eixo: `bruto = Σ pesos das respostas que o tocam` e `máximo = Σ maior peso possível dessas perguntas`.
   - Estilo, hábito e motivação: `nota = 50 + 50 × bruto / máximo` (0 a 100, com 50 neutro).
   - Gêneros: `nota = 100 × max(0, bruto) / máximo`.
3. Eixo sem nenhuma pergunta respondida fica **desconhecido** (não é tratado como 50). Isso é o que o resultado lista como "ainda não sei".
4. **Tipo de leitor:** `distância = Σ peso × |nota − alvo| / Σ peso` sobre os eixos conhecidos do centro daquele tipo; `semelhança = 1 − distância/100`. Os eixos que **definem** o tipo têm peso 2 ou 3 (por exemplo, `M3` para o Sentimental e `H6` para o Curador); os demais têm peso 1. O maior vira o tipo principal; se o segundo estiver a menos de 0,05, vira traço secundário.
5. **Nível de detalhe** = parcela dos 30 eixos com ao menos **duas** perguntas de apoio respondidas: menos de 60%, Básico; menos de 80%, Intermediário; a partir daí, Completo. Os limiares foram calibrados com os leitores-modelo dos testes (nível 1 ≈ 50%, nível 2 ≈ 67%, nível 3 ≈ 97%). Não é exibido como percentual. *(A regra original, "eixos com ao menos uma resposta", classificava até o nível 1 como Completo, porque a pergunta 1 já toca os 12 gêneros.)*
6. **Consistência:** perguntas que se cruzam (Q1 × Q20, Q4 × Q38, Q15 × Q39) geram um aviso interno de baixa confiança; ele reduz o peso daquele eixo, sem mostrar erro à pessoa.

---

## 7. O que cada nível entrega

| | Rápido (10) | Intermediário (20) | Completo (40) |
|---|---|---|---|
| Tipo de leitor | Principal | Principal + traço secundário | Principal + secundário + descrição |
| Gêneros | Top 3 | Top 5 com intensidade | Mapa completo dos 12 |
| Estilo | — | Ritmo, foco e tom | Os 6 eixos com explicação |
| Hábitos e motivações | — | Resumo | Análise completa + sugestão de meta de leitura |
| Evitar | Aplicado em silêncio | Mostrado | Mostrado e explicado |
| Indicações | 5 rápidas | 10 em grupos: *para começar*, *para se desafiar*, *para relaxar* | 20 ou mais, com motivo, ordenadas por afinidade |
| "O que falta saber" | Sim, com convite para aprofundar | Sim | Só se houver respostas em branco |

**Exemplo de resultado no nível 1 (texto de exemplo, ainda sem implementação):**
> **Você é um(a) Contemplativo(a).** Prefere ritmo calmo, personagens profundos e escrita cuidadosa. Seus gêneros: Clássicos, Poesia e crônicas, Romance.
> *Ainda não sei:* seus hábitos de leitura e o que mais te move. *Responda mais 10 perguntas para refinar.*

---

## 8. Indicações: curadoria + regras

**Base curada.** Uma lista editorial de livros (proposta inicial: ~150, cerca de 12 por gênero), cada um com:

```
título · autor · ano · idioma(s) · páginas
gênero principal e secundário (G1–G12)
estilo: ritmo, foco, tom, complexidade, realidade, extensão (0–100)
temas (os 12 de Q17) · restrições que ele viola (violência, final triste, linguagem antiga…)
série? · tipo de entrada (porta de entrada, desafio, conforto)
```

Os metadados práticos (páginas, capa, sinopse) são confirmados pela API de livros que já existe; os de estilo e tema são **editoriais**, feitos à mão. Posso rascunhar essa lista em um segundo documento, depois que o questionário for aprovado.

**Ranking.** Para cada livro que passou nos filtros (restrições, idioma, já lido):

```
afinidade = 0,45 × gênero + 0,35 × estilo + 0,10 × motivação + 0,10 × prático
```
- *Gênero*: afinidade da pessoa com o gênero do livro.
- *Estilo*: `1 − média(|perfil − livro|)/100` nos eixos conhecidos.
- *Motivação*: quanto o tipo de entrada do livro combina com Q6/Q37.
- *Prático*: extensão (Q7) e formato (Q9) compatíveis.

**Diversificação:** no máximo 2 livros por autor e, nos tipos Explorador e Maratonista, ao menos 3 gêneros diferentes entre os 10 primeiros.
**Explicação:** gerada por modelo de texto a partir dos 2 eixos que mais pesaram na afinidade.
**Ação:** cada indicação tem "Adicionar à estante" (reaproveita a API de biblioteca, com status *Quero ler*).
**Complemento:** quando a base curada tiver poucos candidatos, completa-se pela busca por gênero do catálogo online (`/books/discover`).

---

## 9. Privacidade e segurança

- As respostas de gosto são dados pessoais, ainda que não sensíveis. Texto curto de aviso antes do início: o que é coletado, para que serve, e que pode ser apagado.
- Não perguntamos idade, gênero, localização nem nada identificável. Q8 ("temas muito pesados") é só um filtro, sem detalhes.
- O endpoint de cálculo para quem ainda não tem conta **não grava nada** e tem limite de requisições.
- A pessoa pode **apagar o perfil** a qualquer momento (e refazê-lo).
- Q40 (texto livre) é limitado a 3 títulos e 200 caracteres cada, e tratado como texto, nunca interpretado.

---

## 10. Impacto técnico (visão geral)

**Backend (Django)**
- Banco de perguntas versionado (`question_bank_version`) em arquivo no repositório.
- Modelo `ReaderProfile` (usuário, nível, respostas em JSON, notas por eixo, tipo principal e secundário, versão do banco, datas).
- Endpoints:
  - `GET /api/diagnostic/questions/?level=1|2|3` (público)
  - `POST /api/diagnostic/evaluate/` (público, com limite; calcula sem gravar)
  - `POST /api/diagnostic/profile/` (autenticado; grava)
  - `GET /api/diagnostic/profile/` e `PATCH` (aprofundar com mais respostas)
  - `DELETE /api/diagnostic/profile/`
- Testes: pontuação, determinismo, casos de referência por tipo de leitor, filtros de restrição.

**Frontend (React)**
- Rotas: `/diagnostico`, `/diagnostico/perguntas`, `/diagnostico/resultado`, `/cadastro`.
- Pasta `pages/diagnostic/`, mesmo visual pastel da abertura e do login.
- A tela de login deixa de ter o modo "Criar conta": o link leva a `/diagnostico`.

**Fora do escopo atual (precisa de autorização)**: a entrada para o perfil e as indicações depois do login ("Para você" na biblioteca ou uma tela "Meu perfil") mexe em telas internas.

---

## 11. Como saberemos se está funcionando

| Métrica | Pergunta que responde |
|---|---|
| Conclusão por nível, tempo por pergunta, abandono por pergunta | As 40 perguntas cansam? Quais são problemáticas? |
| Conversão do resultado para cadastro | O resultado vale a conta? |
| % de indicações adicionadas à estante | As indicações têm aderência? |
| Nota média das indicações lidas | Combinam de verdade com a pessoa? |
| % que aprofunda de 10 para 20 ou 40 | A promessa das camadas funciona? |
| Retenção em 7 e 30 dias de quem fez o perfil vs. quem pulou | O diagnóstico traz valor real? |

As métricas só podem ser coletadas de forma agregada e anônima, com o aviso de §9.

---

## 12. Riscos

| Risco | Mitigação |
|---|---|
| Cansaço nas 40 perguntas | Uma por tela, blocos de 10 com resultado parcial, salvar e retomar |
| Prometer precisão demais | Linguagem honesta, "nível de detalhe", lista do que falta |
| Base curada pequena ou enviesada | Começar com ~150 livros revisados, medir aderência, ampliar |
| Indicações ruins para quem escolhe poucos gêneros | Completar pela busca por gênero e pedir mais respostas |
| Estereótipos nos tipos de leitor | Tipos são rótulos de gosto, nunca de pessoa; sempre com traço secundário |
| Cadastro perdido após o resultado | Resultado visível mesmo sem conta; convite claro para salvar |
| Chave do Google Books ausente | A base curada funciona sem a API |

---

## 13. Plano proposto (cada fase só começa com seu "ok")

| Fase | Entrega |
|---|---|
| **A** | Revisão deste documento (perguntas, tipos de leitor, pontuação, textos) |
| **B** | Backend: banco de perguntas, pontuação, modelo e endpoints, com testes |
| **C** | Frontend: `/diagnostico` (escolha de nível e perguntas) e `/cadastro` |
| **D** | Resultado e indicações: base curada (~150 livros), ranking e explicações |
| **E** | Integração: botões da abertura e do login; entrega do perfil ao criar a conta; (opcional) "Para você" nas telas internas |

---

## 14. Pontos a aprovar

1. **Os 8 tipos de leitor** (nomes e retratos) estão certos? Algum falta ou sobra?
2. **As 40 perguntas:** redação, ordem e opções. Quais trocar, cortar ou acrescentar?
3. Q8 (temas pesados) e Q40 (livros que marcaram) ficam ou saem?
4. **Linguagem:** "Perfil de leitor" no lugar de "diagnóstico" em toda a interface?
5. **Resultado antes do cadastro:** mostrar o resultado completo e depois pedir a conta, ou só um resumo e liberar o resto após o cadastro?
6. **Base curada:** posso rascunhar a lista de ~150 livros (Fase D) já agora, ou só depois da Fase C?
7. **Telas internas:** autoriza incluir "Para você" na biblioteca na Fase E, ou fica só no resultado do diagnóstico?

---

## 15. Resultado da Fase B (backend)

**O que foi construído:** banco de 40 perguntas com pesos (`diagnostic/questions.py`), eixos e tipos de leitor (`axes.py`), validação (`bank.py`), pontuação (`scoring.py`), modelo `ReaderProfile` (migração 0015), 3 endpoints (ver `Backend/API.md`) e 49 testes.

**Precisão medida com 8 leitores-modelo idealizados (um por tipo):**

| Nível | Tipo principal certo | Observação |
|---|---|---|
| 1 (10 perguntas) | 5 de 8 | Estudioso, Sentimental e Pragmático se confundem com tipos próximos |
| 2 (20 perguntas) | 6 de 8 | Os outros 2 aparecem como traço secundário |
| 3 (40 perguntas) | 8 de 8 | |

A precisão **cresce com o nível**, como previsto. Mas atenção: são leitores-modelo escritos por nós, mais "puros" que gente de verdade. Os números reais só virão com uso (ver §11).

**Pontos de atenção para a sua revisão:**
1. **Gêneros com pouca evidência:** `G12` (Quadrinhos) só é medido pela pergunta 1. Sugestão: uma segunda pergunta ou opção que o toque.
2. **Alvos dos tipos** (`axes.py`) são o ponto mais sensível: foram calibrados com os 8 leitores-modelo e devem ser revisados com dados reais.
3. **As 4 opções da pergunta 20** usam frases de apoio originais (escritas para o teste), a revisar editorialmente.
4. **Tipos que se parecem:** Curador e Contemplativo, Imersivo e Explorador aparecem juntos com frequência; por isso o traço secundário.

---

## 16. Resultado da Fase C (frontend) e ajustes no backend

**Ajustes feitos no backend antes do frontend**
- **Quadrinhos (`G12`)** ganhou uma segunda fonte de evidência: a pergunta 16 passou a ter a opção "Visual, com imagens e quadros". Agora todos os eixos têm pelo menos 2 perguntas de apoio (e há teste que garante).
- **Mínimo de opções** nas listas (`min_choices`): as perguntas 1, 17 e 38 exigem ao menos 1; a 8 ("o que evitar") aceita lista vazia. O servidor valida e informa o mínimo à interface.
- **Texto do tipo de leitor:** cada tipo agora tem `description` e `reading_tip`, usados no relatório.

**Telas (todas públicas, pastel, com a terracota padrão do sistema)**

| Rota | O que faz |
|---|---|
| `/diagnostico` | Três cartões (Rápido, Intermediário recomendado, Completo), aviso de privacidade e retomada de um perfil em andamento |
| `/diagnostico/perguntas` | Uma pergunta por tela; checklist, escolha única, escala 1–5, "escolha até 3" e texto livre; "Prefiro não responder"; resumo do perfil ao fim de cada bloco de 10; progresso salvo (retoma de onde parou) |
| `/diagnostico/resultado` | Relatório: tipo (e traço secundário), descrição, dica de leitura, barras de gêneros, espectros de estilo, motivações, hábitos, o que evitar e "ainda não sei"; só mostra eixos com 2 ou mais perguntas de apoio |
| `/cadastro` | Cria a conta e envia o perfil ao servidor; se o envio falhar, a conta já existe e a pessoa pode tentar de novo sem perder as respostas |

**Mudanças em telas existentes:** o login deixou de ter o modo "Criar conta" (agora o link leva a `/diagnostico`); a abertura separa "Entrar" (`/entrar`) de "Criar conta" e "Criar minha estante" (`/diagnostico`).

**Decisões que valem para a Fase D:** o nível 1 só promete tipo, gêneros e o que evitar; as indicações de livros só entram na interface quando existirem, para não prometer o que ainda não há.

---

## 17. Estudo do 12 Axes e proposta adaptada

Estudo feito ao vivo (landing, escolha de profundidade, questionário, resultado, celular). O 12 Axes é um teste de ideologia política; o domínio é outro, mas o problema de produto é o mesmo que o nosso: um questionário longo, em camadas, que precisa terminar e entregar um retrato convincente.

### 17.1 Como o questionário é construído

| Aspecto | O que o 12 Axes faz |
|---|---|
| **Stack** | Aplicação de página única com Vite, um único pacote de JS e CSS próprio com tokens (`--green-500`, `--canvas`, `--radius-lg`…). Sem Tailwind; classes no estilo `question-card`, `answer-button`, `quiz-progress-segs`. Sora nos títulos, Poppins no texto |
| **Profundidades** | Três versões com **perguntas por eixo**: curta (36 = 3 por eixo), completa (60 = 5) e extrema (240 = 20). Cada eixo tem um banco de ~20 perguntas; a versão só escolhe quantas sortear |
| **Ordem** | As perguntas dos eixos vêm **misturadas** (`comercio_15`, `controle_10`, `economia_11`…), nunca em blocos temáticos |
| **Resposta** | Uma escala fixa de 5 pontos com rótulos por extenso (Concordo totalmente → Discordo totalmente) em **linhas largas**, com faixa de cor e ícone semânticos (verde/check, cinza/traço, vermelho/x) |
| **Apoio** | Botão **Entenda** abre um quadro "Se você concorda / Se você discorda" com exemplos reais e um "Vale lembrar" que delimita o que a pergunta mede; termos técnicos no enunciado são sublinhados e explicam sob demanda |
| **Controle** | Voltar; **Trocar** (substitui a pergunta por outra do mesmo tema); interruptor **Avançar ao responder**; Reiniciar; modo escuro |
| **Progresso** | "Pergunta 7 de 36 · 14% concluído" e uma barra segmentada (um segmento por eixo) com `role="progressbar"` |
| **Estado salvo** | Um único `localStorage` versionado: `variant`, `questionIds`, `answers` (como `AGREE`, `NEUTRAL`…), `stage` (quiz → escolha de arquétipo → resultado), `index`, `v` e `savedAt`. O resultado final fica em outra chave, de modo que a página `/results` sobrevive a recarregar |
| **Resultado** | Rota própria (`/results`); refazer e **editar respostas** a partir dele. Os 12 valores vão na **própria URL** (`/results?est=73.8&rep=60&pod=20.8…`), então o link reproduz o resultado sem servidor e sobrevive a recarregar |
| **Acessibilidade** | `radiogroup`/`radio`, `progressbar`, `switch`, termos do glossário como `button` com `aria-expanded` |

### 17.2 Como o design é construído

- **Paleta de papel:** fundo `#F4F1E8` (quase o nosso `#F5EFE6`), verde profundo como cor principal e vinho como contraponto; superfícies em creme com bordas finas e sombras muito suaves.
- **Escala:** título enorme com o trecho-chave em outra cor ("velocidade ou **precisão?**"), subtítulo curto em cinza, botão escuro em pílula.
- **Escolha de profundidade:** três cartões com um **número grande** de perguntas, tempo estimado e "Profundidade" em três pontinhos; o do meio, escuro e com selo "Recomendada". Enquadra a escolha como dilema (**velocidade ou precisão**), o que torna a escolha mais fácil.
- **Cartão de pergunta:** barra escura no topo, **numeração translúcida gigante** ao fundo ("07"), um *chip* com o eixo medido (ícone colorido + nome) e o chip "Entenda".
- **Resultado:** cartão principal tingido pela família do resultado com um **anel de porcentagem**, citação de destaque, **12 controles deslizantes** (cada eixo com sua cor, preenchidos a partir do centro, com chip do polo ativo e polo oposto esmaecido), "**O que te distingue**" (posição mais incomum e mais comum, com a estatística da população e a "tensão interna" entre dois traços), listas de correspondências, **livros recomendados** (cartão com % de compatibilidade, foto do autor e botão de compra, o primeiro destacado), **cartão de resultado compartilhável com QR** e um **sumário lateral fixo** ("Nesta página") com destaque da seção atual, mais uma barra de progresso de rolagem no cabeçalho.
- **Celular:** coluna única, cabeçalho enxuto, sumário lateral some, sliders empilhados.

### 17.3 O que adotamos, adaptamos e não copiamos

| | Item | Decisão |
|---|---|---|
| ✅ Adotar | Escala de 5 pontos em linhas largas com rótulos e cor semântica | Substitui nossos 5 círculos numerados, que não dizem o que cada número significa |
| ✅ Adotar | Interruptor "Avançar ao responder" | Só nas perguntas de escolha única e de escala; ligado por padrão, lembrado no navegador |
| ✅ Adotar | Chip do tema + numeração translúcida + barra segmentada | Nossos blocos viram os segmentos |
| ✅ Adotar | "Entenda" com "Se você concorda / Se você discorda" | Para as 9 perguntas de escala, que são as mais ambíguas |
| ✅ Adotar | Estado versionado com `savedAt`, `stage` e resultado persistido | Expira o rascunho em 30 dias; o resultado sobrevive a recarregar |
| ✅ Adotar | Editar respostas a partir do resultado | Tela de revisão com todas as perguntas e respostas |
| ✅ Adotar | Sliders por eixo com chip do polo ativo, sumário lateral e barra de rolagem | No resultado do nível 2 e 3 |
| ✅ Adotar | Cartões de profundidade com número grande, tempo, pontinhos e cartão do meio escuro | Reforça o que já temos |
| 🔄 Adaptar | "O que te distingue" | Sem estatística de população (não temos usuários), usamos **traço mais marcante**, **traço mais equilibrado** e **tensão interna** (duas características que raramente andam juntas, por uma tabela de regras) |
| 🔄 Adaptar | Anel de "% match" | Não mostramos porcentagem para o tipo (evita falsa precisão); a porcentagem entra nas **indicações de livros** (Fase D), como "afinidade" |
| 🔄 Adaptar | Cores por eixo | Paleta quente própria, **sem azul** (ver 17.4), para combinar com o sistema |
| 🔄 Adaptar | Perguntas misturadas entre eixos | Nosso banco já é misturado por bloco; dentro de cada bloco a ordem pode ser embaralhada de forma estável (mesma ordem para a mesma pessoa) |
| 🔄 Adaptar | Livros recomendados com botão de compra | Botão **Adicionar à estante** (Fase D); loja/afiliado é decisão sua |
| ⏳ Depois | "Trocar pergunta" | Exige um banco com alternativas por eixo; hoje cada eixo é medido por poucas perguntas. "Prefiro não responder" cobre o caso por enquanto |
| ⛔ Não copiar | Resultado codificado na URL | Nossos dados são pessoais; o link não carrega respostas. O resultado fica no navegador e, para quem tem conta, no servidor |
| ⏳ Depois | Cartão compartilhável com QR | Possível após a Fase D; só compartilha o que a pessoa escolher |
| ⛔ Não copiar | "Análise completa" bloqueada, modo de 240 perguntas, "100% de precisão" | Nada de paywall sem decisão sua; teto de 40 perguntas por cansaço; promessa de precisão incompatível com o §1 |
| ⛔ Não copiar | Conteúdo político | Só o padrão de produto |

**Onde o nosso desenho já é melhor:** as camadas do 12 Axes são sorteios independentes (36, 60 e 240), então quem faz a curta e quer a completa refaz tudo; as nossas camadas **contêm** as anteriores e a pessoa aprofunda respondendo só o que falta.

### 17.4 Paleta proposta para os eixos (sem azul)

| Eixo | Cor | Eixo | Cor |
|---|---|---|---|
| Ritmo `S1` | âmbar `#d99a3d` | Volume `H1` | terracota `#98543f` |
| Foco `S2` | ameixa `#7d4a6b` | Constância `H2` | sálvia `#59694f` |
| Tom `S3` | vinho `#7a2f3a` | Leituras simultâneas `H4` | argila `#a8725a` |
| Complexidade `S4` | floresta `#2f6f4f` | Persistência `H5` | rosa-antigo `#b5546a` |
| Realidade `S5` | oliva `#8a8a3c` | Exploração `H6` | ocre `#b07a2a` |
| Extensão `S6` | cobre `#a05a2c` | Sociabilidade `H7` | verde-musgo `#4a6b4f` |

Viram tokens `--axis-*` em `tokens.css`; cada um tem versão clara (fundo do chip) e escura (texto/traço).

### 17.5 Proposta adaptada, por pacote

**Pacote A: perguntas** (frontend, mais conteúdo no backend)
1. Escala em linhas largas: 5 linhas com rótulo, ícone e faixa colorida (terracota para discordo, sálvia para concordo, cinza para neutro).
2. Cartão da pergunta com barra no topo, numeração translúcida, chip do tema (nome do eixo/grupo, ícone e cor) e barra de progresso segmentada por bloco.
3. Interruptor "Avançar ao responder" (escolha única e escala).
4. "Entenda" nas 9 perguntas de escala (conteúdo: o que é concordar, o que é discordar, "vale lembrar"). O backend passa a enviar `explain` e `topic` por pergunta.
5. Estado: `savedAt`, `stage`, expiração em 30 dias, resultado persistido em chave própria e tela "Revisar respostas".

**Pacote B: resultado**
1. Cartão principal (tipo, traço secundário, descrição, dica) no estilo do cartão tingido.
2. Sliders por eixo com preenchimento a partir do centro, cor própria, chip do polo ativo e polo oposto esmaecido (substituem os pontinhos atuais).
3. Bloco "O que te distingue": traço mais marcante, traço mais equilibrado e tensão interna (cálculo no servidor, com testes).
4. Sumário lateral fixo com destaque da seção atual (só no desktop) e barra de progresso de rolagem no cabeçalho.

**Pacote C: escolha do nível e abertura**
1. Cartões de nível com número grande, tempo, "Profundidade" em pontinhos, cartão do meio escuro e a pergunta "velocidade ou precisão?".
2. Na abertura, uma seção "Descubra seu perfil de leitor" com um **cartão de resultado de exemplo** (como o carrossel do 12 Axes) levando a `/diagnostico`.

**Pacote D: depois**
Livros recomendados com afinidade e "Adicionar à estante", cartão compartilhável, "Trocar pergunta" e modo escuro opcional no questionário (os tokens já estão prontos).

### 17.6 Impacto técnico dos pacotes A e B

- Backend: campos `topic` (grupo, rótulo, chave de ícone) e `explain` nas perguntas; `signature` (traço mais marcante, mais equilibrado, tensão) no resultado; tabela de tensões e testes.
- Frontend: componentes de escala em linhas, cartão de pergunta, barra segmentada, modal "Entenda", revisão de respostas, sliders de eixo, sumário lateral; tokens `--axis-*`.
- Sem mudanças no modelo de dados.

## 18. Implementação dos pacotes A, B e C (sem compras)

- **A (perguntas):** escala em linhas largas com cor semântica, cartão com número e chip de tema, progresso segmentado, "Avançar ao responder", diálogo "Entenda" (9 perguntas de escala), rascunho com validade de 30 dias, resultado em cache e tela `/diagnostico/revisar`.
- **B (resultado):** cartão de abertura, sliders por eixo com tokens `--axis-*`, bloco "O que te distingue" (`signature` calculado no servidor, com testes), sumário lateral e barra de rolagem.
- **C:** cartões de nível ("velocidade ou precisão?") e seção "Descubra seu perfil de leitor" na abertura, com resultado de exemplo.
- **Fora de escopo por decisão do usuário:** qualquer recurso de compra (botão de loja, afiliados, análise paga). O pacote D (livros indicados, cartão compartilhável, "Trocar pergunta") fica para a Fase D.

## 19. Fase D: indicações de leitura (implementada)

- **Catálogo curado:** cerca de 60 obras com peso por gênero, posição nos 6 eixos de estilo, tipos de leitor que costumam gostar, restrições que acionam e uma frase sobre o livro (`Backend/diagnostic/catalog.py`).
- **Regras:** exclui restrições e livros já citados; pontua 50% por gênero, 35% por estilo (só eixos com 2 respostas) e bônus pelo tipo de leitor; indica 3 livros, um de cada gênero quando possível. Cada indicação traz até 3 motivos escritos a partir dos pontos de encaixe.
- **Resultado:** a seção "Livros para o seu perfil" aparece logo depois do cartão do tipo de leitor, com capa, sinopse curta, "Por que combina com você" e "Salvar nos desejos" (quem não tem conta vê "Criar conta para salvar").
- **Capas:** buscadas uma a uma no catálogo online (Open Library), com cache e novas tentativas; sem capa, aparece uma capa gerada com título e autor.
- **Fora de escopo:** qualquer recurso de compra.
- **Layout:** as 3 indicações ficam lado a lado, com a capa em destaque; o resultado usa a largura de 1360 px. "O que te move" virou cartões com anel de porcentagem, "O que você prefere evitar" explica cada restrição e "Ainda não sei" virou um cartão de "retrato X% pronto" com o botão para responder mais perguntas.
