# Plano: recomendações no catálogo (`/catalogo`)

Status: **proposta para aprovação, nada implementado.** A única mudança já feita é o layout dos resultados (seção 1).

## 1. Layout dos resultados (feito)

Os resultados mostram **3 livros por linha** (2 abaixo de 1100 px e 1 abaixo de 700 px) em `pages/catalog/catalog.css`. Para isso, a coluna lateral de sugestões foi para uma faixa abaixo da grade, também em 3 colunas, e o contêiner ficou com 1500 px.

A tela também perdeu texto. O cartão mostra capa, gênero, título, autor, nota, páginas e os dois botões. Saíram sinopse, fonte, link "ver registro", ano e contagem de leituras. A frase sobre a ordenação virou uma dica ao passar o mouse sobre a contagem de obras, e o subtítulo da página saiu.

## 2. Como a recomendação funciona hoje

`CatalogPage.jsx` pega o gênero do primeiro resultado que tiver um, espera 1,1 s e chama `GET /books/discover/?genre=…&page=2`. Tira os livros que já aparecem nos resultados e mostra os 3 primeiros em "Outros livros do mesmo gênero".

Problemas, na ordem do que mais pesa:

1. **Não é recomendação.** É a segunda página de uma lista de popularidade por gênero. Duas pessoas diferentes veem os mesmos livros.
2. **A qualidade é baixa.** Na captura aparecem "Guia de Filmes – Volume 4" e "Volume 2" e um livro sobre videogames, ao lado de ficção científica. O gênero vem de um assunto do Open Library em texto livre (`Imaginary wars and battles`), que não é um gênero.
3. **Faltam capas.** Os três itens aparecem sem capa, só com um quadrado em branco.
4. **Ignora quem a pessoa é.** Não olha o perfil de leitor, a biblioteca, as notas dadas nem as restrições (por exemplo, "livros longos").
5. **Sugere o que a pessoa já tem.** Só remove o que está nos resultados da tela; livros já na estante continuam aparecendo.
6. **Custa uma chamada externa por busca.** Cada busca dispara uma segunda consulta ao Google Books/Open Library, gasta a cota (`external_catalog`) e por isso precisa do atraso de 1,1 s.
7. **Não explica.** O princípio 4 do plano do perfil de leitor diz que toda indicação diz o porquê.

## 3. O que já existe e pode ser reaproveitado

A Fase D do perfil de leitor já entregou quase tudo o que falta:

- `Backend/diagnostic/catalog.py`: ~60 obras curadas, com peso por gênero, posição em 6 eixos de estilo, tipos de leitor e restrições que acionam;
- `Backend/diagnostic/recommend.py`: filtros de restrição e de livros já citados, pontuação (50% gênero, 35% estilo, bônus pelo tipo de leitor), no máximo 2 por gênero e **motivos escritos** para cada indicação;
- `Backend/diagnostic/covers.py` e `GET /api/diagnostic/books/<id>/cover/`: capa e dados pelo catálogo online, com cache de 7 dias;
- `ReaderProfile.result`: o perfil de quem tem conta, já calculado e salvo.

O limite é que o ranker só roda sobre as 60 obras e só na tela de resultado do questionário.

## 4. Proposta

### 4.1 Um endpoint só, no servidor

`GET /api/recommendations/?genre=…&book=…&limit=6` (autenticado). A tela deixa de montar a lista no navegador e faz **uma** chamada.

**Sinais usados, em camadas** (cada uma só entra se existir, então funciona para quem acabou de criar a conta):

| Camada | Sinal | Efeito |
|---|---|---|
| Contexto | gênero buscado ou livro aberto | candidatos do mesmo gênero ganham bônus |
| Perfil | `ReaderProfile.result` (gêneros, estilo, restrições, idioma) | o ranker da Fase D, sem mudança |
| Comportamento | livros lidos/avaliados com 4 e 5 estrelas, autores repetidos | bônus por gênero e autor; livros com nota baixa puxam seu gênero para baixo |
| Filtros | biblioteca, estantes compartilhadas, livros já citados, restrições | descartam, não penalizam |

**Candidatos:** primeiro o catálogo curado; depois os livros do banco local (`Book`) com gênero normalizado; só se ainda faltar, uma busca externa **com cache de 24 h por gênero**, não por busca.

Sem perfil, a lista vem do contexto e da popularidade, exatamente como hoje, mas com os filtros de qualidade abaixo.

### 4.2 Qualidade dos candidatos externos

- **Normalizar o gênero** para os 12 do perfil (G1 a G12) com uma tabela de assuntos do Open Library e do Google Books para esses gêneros. O rótulo no cartão passa a ser "Ficção científica", não `Imaginary wars and battles`.
- **Descartar ruído:** títulos com "guia", "volume", "box", "coletânea", "resumo" ou "study guide"; obras com menos de 80 páginas; obras sem capa.
- **Uma obra por série**, para não aparecerem dois volumes do mesmo guia.

Isso melhora também os resultados da busca por gênero, não só a lateral.

### 4.3 Apresentação

- Título "Para você" quando há perfil e "Outros livros de *Ficção científica*" quando não há.
- Cada item mostra **um motivo** ("Ritmo rápido, como você prefere"), reaproveitando `_reasons` da Fase D, mais o botão de salvar nos desejos que já existe.
- Capa com a mesma regra dos resultados: se falhar, aparece uma capa gerada com título e autor, nunca um quadrado vazio.
- Botão **"Não tenho interesse"**, que tira o livro da lista e evita que ele volte.

### 4.4 Persistência mínima

Uma tabela `RecommendationFeedback` (usuário, obra, ação: `dismissed` ou `added`, data) para o "não tenho interesse" e para medir se funciona. Os números do plano do perfil servem: % de indicações adicionadas à estante e nota média das lidas.

## 5. Onde colocar na tela

| Opção | Vantagem | Desvantagem |
|---|---|---|
| **A. Coluna lateral** (usada antes) | fica à vista ao rolar | tira 340 px da grade; em 1440 px sobram 2 colunas |
| **B. Faixa horizontal abaixo dos resultados** (hoje) | a grade usa a largura toda e cabem 3 colunas | quem não rola não vê |
| **C. Faixa horizontal entre a busca e os resultados** | aparece antes de buscar, serve de ponto de partida | empurra os resultados para baixo |

Recomendo manter **B** e acrescentar **C quando houver perfil**: a faixa "Para você" abre a tela mesmo antes de qualquer busca, que hoje é uma tela vazia ("Busque um livro").

## 6. Ordem de trabalho

1. **Qualidade dos candidatos:** normalizar gêneros e filtrar ruído em `external_books.py`. Corrige o que aparece hoje sem mudar a tela. Com testes.
2. **Endpoint** `GET /api/recommendations/`, com filtros pela biblioteca e cache por gênero. Elimina a chamada extra por busca. Com testes.
3. **Frontend:** trocar o `useEffect` de `CatalogPage` por uma chamada ao endpoint e mostrar o motivo.
4. **Perfil e comportamento:** usar `ReaderProfile` e as notas na pontuação.
5. **Feedback:** "não tenho interesse" e métricas.

Os passos 1 a 3 já entregam recomendações melhores para todo mundo. O 4 e o 5 dependem de a pessoa ter feito o questionário.

## 7. Decisões que dependem de você

1. **Posição:** manter a faixa abaixo dos resultados (B) ou levá-la para cima, antes dos resultados (C)?
2. **Sem perfil:** mostrar só o contexto e a popularidade, ou convidar a pessoa a fazer o questionário dentro do próprio painel?
3. **Tamanho da base curada:** 60 obras cobrem poucos gêneros. Vale ampliar para ~150, como no plano original, antes do passo 4?
4. **Fonte externa:** manter Google Books como principal (exige a chave `GOOGLE_BOOKS_API_KEY`) ou assumir o Open Library, que não precisa de chave, mas tem mais ruído?
