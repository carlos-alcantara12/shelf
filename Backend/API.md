# API do Shelf

Esta documentação corresponde às rotas e aos serializers atuais do backend. A API usa JSON e termina todas as rotas com `/`. Em desenvolvimento, a URL base é `http://127.0.0.1:8000`; em produção, use o domínio HTTPS configurado.

## Autenticação

O cadastro e os endpoints de token são públicos. Os demais endpoints exigem JWT no cabeçalho:

```http
Authorization: Bearer <access>
Content-Type: application/json
```

### Consultar a conta autenticada

`GET /api/auth/me/` retorna o `username` da conta autenticada. A interface usa esse dado para identificar convites e pedidos recebidos.

### Criar conta

`POST /api/auth/register/`

```json
{
  "username": "ana",
  "email": "ana@example.com",
  "password": "Uma-senha-forte-123",
  "first_name": "Ana",
  "last_name": "Leitora"
}
```

`username`, `email` e `password` são obrigatórios; nome e sobrenome são opcionais. A senha precisa ter pelo menos oito caracteres e passar pelas validações de senha do Django. A resposta `201` contém o usuário criado, sem a senha.

### Obter tokens

`POST /api/auth/token/`

```json
{"username": "ana", "password": "Uma-senha-forte-123"}
```

A resposta `200` contém `access` e `refresh`. Use `access` nas chamadas autenticadas.

### Renovar token de acesso

`POST /api/auth/token/refresh/`

```json
{"refresh": "<refresh>"}
```

A resposta `200` contém um novo `access`.

Cadastro, obtenção e renovação de tokens são limitados a 10 requisições por minuto por cliente; exceder o limite retorna `429`.

## Saúde da aplicação

`GET /api/health/` não exige autenticação. A rota executa uma consulta simples ao banco e retorna `200` com `{"status":"ok","database":"ok"}` quando está disponível, ou `503` com estado não saudável quando a consulta falha. Use-a em verificações de disponibilidade, sem expor detalhes ou credenciais do banco.

## Permissões

| Recurso | Leitura | Criação | Edição e remoção |
|---|---|---|---|
| `/api/books/` | Usuário autenticado | Usuário autenticado | Administrador (`is_staff`) |
| `/api/books/discover/`, `/api/books/import/` | Usuário autenticado | Busca online e importação de metadados | Não aplicável |
| `/api/library/` | Apenas a própria biblioteca | Usuário autenticado; o dono é definido pelo token | Apenas o próprio registro |
| `/api/reviews/` | Apenas as próprias avaliações | Usuário autenticado; o dono é definido pelo token | Apenas a própria avaliação |
| `/api/trending/` | Usuário autenticado | Administrador (`is_staff`) | Administrador (`is_staff`) |
| `/api/shared-libraries/` | Participantes | Usuário autenticado cria; proprietário define o nome | Proprietário pode editar ou excluir |
| `/api/shared-books/` | Participantes | Participante adiciona livro | Quem adicionou pode remover |
| `/api/shared-reading/` | Apenas o próprio progresso, visível também na estante compartilhada | Criado automaticamente | Cada participante edita apenas o próprio progresso |
| `/api/shared-invitations/` | Remetente e destinatário | Proprietário envia convite | Destinatário aceita/recusa; remetente cancela convite pendente |
| `/api/shared-removal-requests/` | Solicitante e responsável pela decisão | Participante pede remoção de livro adicionado por outra pessoa | Quem adicionou aprova ou recusa |
| `/api/mailbox/` | Apenas o destinatário | Reúne cartas e notificações recebidas | A abertura é registrada nos recursos de origem |

### Busca e filtros

As listas do catálogo, da biblioteca pessoal e das estantes compartilhadas aceitam parâmetros de busca e filtros. `search` procura por título ou autor; `genre` procura pelo gênero; `status` filtra pelo status individual de leitura (`WANT_TO_READ`, `READING` ou `READ`).

```text
GET /api/books/?search=machado&genre=romance
GET /api/library/?search=dom&status=READ
GET /api/shared-books/?genre=ficção&status=READING
```

Os parâmetros podem ser combinados. Os resultados continuam paginados e respeitam as permissões de cada rota: a biblioteca pessoal mostra apenas os livros do usuário autenticado; na estante compartilhada, o filtro de status usa o progresso do próprio participante.

As rotas de biblioteca e avaliações não aceitam `user_id` no corpo. Um usuário não pode consultar ou alterar registros de outra pessoa.

## Recursos

As listas são paginadas com até 20 itens por página. A resposta inclui `count`, `next`, `previous` e `results`; use `?page=2` para avançar.
Criações bem-sucedidas retornam `201`, consultas e atualizações retornam `200`, e exclusões bem-sucedidas retornam `204`.

### Livros

| Método | Rota | Ação |
|---|---|---|
| `GET` | `/api/books/` | Lista livros do catálogo |
| `POST` | `/api/books/` | Cadastra um livro |
| `GET` | `/api/books/discover/?search=...` | Busca no catálogo do Shelf e no Google Books |
| `POST` | `/api/books/import/` | Importa metadados de uma obra escolhida |
| `GET` | `/api/books/{id}/` | Consulta um livro |
| `PUT`, `PATCH` | `/api/books/{id}/` | Atualiza um livro (administrador) |
| `DELETE` | `/api/books/{id}/` | Remove um livro (administrador) |

Exemplo de criação:

```json
{
  "title": "Duna",
  "author": "Frank Herbert",
  "synopsis": "Uma aventura no planeta Arrakis.",
  "genre": "Ficção científica",
  "total_pages": 412,
  "cover_url": "https://example.com/duna.jpg",
  "publication_date": "1965-08-01"
}
```

`title` e `author` são obrigatórios. `synopsis`, `genre`, `total_pages`, `cover_url` e `publication_date` são opcionais. `total_pages`, quando informado, deve ser maior que zero. A data usa `AAAA-MM-DD`. O catálogo rejeita livros com título e autor iguais, sem diferenciar maiúsculas de minúsculas.

A resposta de livro inclui `id`, esses campos e `created_at` em formato ISO 8601.

A busca online recebe `search`, `genre` e `page`. Ela consulta os livros locais e o Google Books; quando a chave do Google não está configurada ou não há resultados, usa o Open Library como alternativa. Resultados duplicados são combinados por título e autor. Configure `GOOGLE_BOOKS_API_KEY` no backend para ativar a fonte principal; a chave nunca é enviada ao navegador. A rota de busca apenas consulta os catálogos: não grava resultados no banco.

Quando a pessoa escolhe uma obra online, o frontend envia `POST /api/books/import/`. Para Google Books, o corpo contém `{"provider":"google_books","source_id":"ID_DO_VOLUME"}`; para Open Library, contém `provider`, `source_id` e os metadados normalizados do resultado. O backend valida e cria ou reutiliza o registro local. Em seguida, o frontend adiciona esse `book_id` à biblioteca pessoal ou compartilhada. Isso elimina o cadastro manual prévio; os metadados só entram no banco depois da escolha, pois o progresso e as estantes do Shelf precisam referenciar uma obra local. As fontes são as APIs de [Google Books](https://developers.google.com/books/docs/v1/using) e [Open Library](https://openlibrary.org/dev/docs/api/search).

### Progresso de leitura

`GET /api/reading-stats/` retorna os avanços registrados pela pessoa autenticada, agrupados por dia (últimos 7 dias), semana (últimas 8 semanas) e mês (últimos 6 meses). Cada período contém `label`, `pages` (páginas avançadas), `books` (obras concluídas) e `minutes` (tempo cronometrado). O histórico começa a ser registrado a partir da aplicação das migrações; atividades anteriores não podem ser reconstruídas a partir do progresso atual.

Com `?period=week|month|year&offset=0` (0 = período atual, -1 = anterior, até -600), retorna um período fechado: `title`, `start`, `end`, `is_current`, `buckets` (7 dias, os dias do mês ou 12 meses, cada um com `label`, `pages`, `books`, `minutes`) e `totals`. Período ou `offset` inválido retorna 400.

O timer usa `GET /api/reading-sessions/` para consultar uma sessão ativa, `POST /api/reading-sessions/start/` para iniciar e `POST /api/reading-sessions/stop/` para encerrar. `start` aceita `book` (código de um livro da própria biblioteca; opcional), devolvido na sessão. Só pode haver uma sessão ativa por usuário. As tarefas de `/api/reading-tasks/` aceitam `book` no corpo e o filtro `?book=<id>`. `GET /api/reading-goal/` consulta a meta diária; `PATCH /api/reading-goal/` atualiza `target_minutes` (inteiro entre 1 e 1440; padrão de 30 minutos). As sessões encerradas compõem o total de minutos dos gráficos.

Exemplo de resposta:

```json
{
  "daily": [{"label": "17/10", "pages": 24, "books": 0}],
  "weekly": [{"label": "12/10", "pages": 130, "books": 1}],
  "monthly": [{"label": "10/2026", "pages": 250, "books": 2}]
}
```

### Biblioteca pessoal

| Método | Rota | Ação |
|---|---|---|
| `GET` | `/api/library/` | Lista os livros da pessoa autenticada |
| `POST` | `/api/library/` | Adiciona um livro à biblioteca |
| `GET` | `/api/library/{id}/` | Consulta um item próprio |
| `PUT`, `PATCH` | `/api/library/{id}/` | Atualiza o status de um item próprio |
| `DELETE` | `/api/library/{id}/` | Remove o item da biblioteca |

Exemplo de criação:

```json
{"book_id": 12, "status": "WANT_TO_READ"}
```

`book_id` deve referenciar um livro existente. `status` aceita `WANT_TO_READ` (Quero ler), `READING` (Lendo) ou `READ` (Lido). `pages_read` é o número de páginas já lidas pelo usuário e começa em `0`; ele não pode ultrapassar `total_pages` quando o total estiver cadastrado. Para usar o status `READ`, o livro precisa ter total de páginas cadastrado e `pages_read` deve ser igual a esse total. O mesmo livro não pode aparecer duas vezes na biblioteca da mesma pessoa. Um livro com avaliação não pode ser movido para outra categoria; excluir o item também exclui sua avaliação, mas mantém o livro no catálogo.

Exemplo de atualização do progresso:

```json
{"status": "READING", "pages_read": 120}
```

A resposta inclui `id`, `status`, `pages_read`, `added_at` e o objeto `book` do catálogo.

### Bibliotecas compartilhadas

`POST /api/shared-libraries/` cria uma biblioteca. A pessoa autenticada torna-se proprietária e primeira participante:

```json
{"name": "Nossa estante"}
```

`GET /api/shared-libraries/` lista as bibliotecas das quais a pessoa participa. A resposta contém `id`, nome, usuário proprietário, nomes dos participantes e data de criação. Participantes podem consultar a biblioteca; somente o proprietário pode alterar seu nome ou excluí-la.

### Convites internos

`GET /api/shared-invitations/` lista os convites enviados e recebidos pela pessoa autenticada. Essa lista serve de caixa de entrada do convite no site; não é enviado e-mail externo.

`GET /api/mailbox/` reúne convites e pedidos de remoção recebidos em uma única caixa de entrada, ordenados do mais recente ao mais antigo. Cada item informa seu tipo, remetente, assunto, conteúdo, status, data de abertura e ações disponíveis. A resposta também inclui `unread_count` para exibir a quantidade de cartas ainda não abertas. A caixa retorna apenas itens recebidos pelo usuário autenticado.

O proprietário convida uma conta Shelf pelo nome de usuário:

`POST /api/shared-invitations/`

```json
{"shared_library_id": 3, "recipient_username": "bia"}
```

O convite começa como `PENDING`. Para registrar a abertura da carta, o destinatário chama `POST /api/shared-invitations/{id}/open/`; a resposta inclui `opened_at`. O destinatário pode responder por `POST /api/shared-invitations/{id}/accept/` ou `/decline/`. O remetente pode cancelar um convite ainda pendente com `DELETE /api/shared-invitations/{id}/`. Convites duplicados pendentes para a mesma biblioteca e pessoa são bloqueados.

Ao aceitar, a pessoa passa a ser participante e ganha registros individuais de leitura para os livros que já estão na estante compartilhada. O proprietário e o destinatário aparecem como participantes da biblioteca.

### Livros e progresso na biblioteca compartilhada

`GET /api/shared-books/` lista os livros das bibliotecas compartilhadas da pessoa. Para adicionar um livro já existente no catálogo:

`POST /api/shared-books/`

```json
{"shared_library_id": 3, "book_id": 12}
```

Cada livro fica associado a quem o adicionou. Os participantes recebem um estado pessoal para o livro, contendo categoria e páginas lidas. O estado inicial é herdado da biblioteca pessoal ou de outro registro compartilhado da mesma obra, se houver; caso contrário, começa em `WANT_TO_READ`, com zero páginas lidas. Remover o livro da estante não apaga esses estados pessoais nem as avaliações.

`GET /api/shared-reading/` lista os estados de leitura próprios; `GET /api/shared-reading/{id}/` consulta um estado e `PATCH /api/shared-reading/{id}/` atualiza a categoria ou as páginas lidas. A resposta da estante compartilhada também inclui o progresso de cada participante. O status `READ` mantém as mesmas validações de total de páginas da biblioteca pessoal.

Quem adicionou o livro pode removê-lo diretamente com `DELETE /api/shared-books/{id}/`. Para pedir que outra pessoa remova a obra, um participante envia:

`POST /api/shared-removal-requests/`

```json
{"shared_book_id": 12}
```

A solicitação aparece como notificação interna para quem adicionou o livro. `GET /api/shared-removal-requests/` lista pedidos enviados e recebidos; cada registro inclui livro, biblioteca, solicitante, responsável e status. A pessoa responsável registra a abertura com `POST /api/shared-removal-requests/{id}/open/` e pode responder com `POST /api/shared-removal-requests/{id}/approve/` ou `/deny/`. Ao aprovar, a obra é removida da estante; ao recusar, ela permanece. Solicitações pendentes duplicadas para a mesma obra são bloqueadas. O histórico individual de progresso permanece disponível em `/api/shared-reading/` após a remoção.

### Avaliações

| Método | Rota | Ação |
|---|---|---|
| `GET` | `/api/reviews/` | Lista as avaliações da pessoa autenticada |
| `POST` | `/api/reviews/` | Avalia um livro lido |
| `GET` | `/api/reviews/{id}/` | Consulta uma avaliação própria |
| `PUT`, `PATCH` | `/api/reviews/{id}/` | Atualiza uma avaliação própria |
| `DELETE` | `/api/reviews/{id}/` | Remove uma avaliação própria |

Exemplo:

```json
{"book_id": 12, "rating": 5, "comment": "Uma leitura excelente."}
```

`book_id` e `rating` são obrigatórios na criação; `comment` é opcional. `rating` aceita um inteiro de `1` a `5`. Só é permitido avaliar livros com status `READ` (Lido), e cada pessoa pode ter uma avaliação por livro. A resposta inclui o objeto `book` com os dados do catálogo.

A resposta também inclui `id` e `reviewed_at` em formato ISO 8601.

### Tendências

| Método | Rota | Ação |
|---|---|---|
| `GET` | `/api/trending/` | Lista os destaques definidos pela administração |
| `GET` | `/api/trending/{id}/` | Consulta um destaque |
| `POST` | `/api/trending/` | Adiciona um destaque (administrador) |
| `PUT`, `PATCH` | `/api/trending/{id}/` | Atualiza posição ou livro (administrador) |
| `DELETE` | `/api/trending/{id}/` | Remove um destaque (administrador) |

Exemplo de criação administrativa:

```json
{"book_id": 12, "position": 1}
```

Cada livro pode aparecer uma vez na lista de tendências. Para adicionar um destaque à categoria Quero ler, crie uma entrada em `/api/library/` com `status: "WANT_TO_READ"`.

### Perfil de leitor (diagnóstico)

Questionário de 40 perguntas em camadas: o **nível 1** usa as perguntas 1 a 10, o **nível 2** as 1 a 20 e o **nível 3** todas. Os endpoints públicos servem quem ainda não tem conta; o perfil salvo exige autenticação. O banco de perguntas e a pontuação ficam no servidor (`Backend/diagnostic/`); a especificação completa está em `Docs/perfil-de-leitor.md`.

| Método | Rota | Acesso | Ação |
|---|---|---|---|
| `GET` | `/api/diagnostic/questions/?level=1\|2\|3` | Público | Perguntas do nível, em blocos de 10 (padrão: nível 3) |
| `POST` | `/api/diagnostic/evaluate/` | Público, 30/min | Calcula o perfil **sem gravar nada** |
| `GET` | `/api/diagnostic/profile/` | Autenticado | Perfil salvo, recalculado com o banco de perguntas atual (404 se não houver) |
| `PUT` | `/api/diagnostic/profile/` | Autenticado | Cria (201) ou substitui (200) o perfil com o conjunto de respostas |
| `PATCH` | `/api/diagnostic/profile/` | Autenticado | Aprofunda: junta novas respostas às existentes e pode subir o nível |
| `DELETE` | `/api/diagnostic/profile/` | Autenticado | Apaga o perfil (204, mesmo que não exista) |

Corpo de `evaluate` e `PUT`/`PATCH`:

```json
{
  "level": 1,
  "answers": {"q01": ["g1", "g4"], "q02": "dois_tres", "q04": 5, "q08": [], "q40": ["Dom Casmurro"]}
}
```

- Tipos de resposta: `single` (id da opção), `checklist` e `pick3` (lista de ids; `max_choices` limita), `scale` (inteiro de 1 a 5) e `text` (lista de até 3 títulos de até 200 caracteres, opcional).
- `null` ou ausência significa "prefiro não responder"; não conta na pontuação.
- Perguntas fora do nível informado são rejeitadas, e todos os erros voltam de uma vez em `{"answers": {"q02": "..."}}`.
- No `PATCH`, o nível não pode diminuir.

Resposta (resumo): `level`, `answered`, `complete`, `detail` (`basico`, `intermediario` ou `completo`), `archetype` e `secondary_archetype` (`id`, `label`, `summary`, `description`, `reading_tip`, `similarity`), `genres` e `top_genres`, `style`, `habits`, `motivations` (notas de 0 a 100 por eixo), `restrictions`, `languages`, `traits`, `themes`, `known_books`, `signature` (`strongest`, `balanced` e `tension`, calculados só com eixos de pelo menos duas respostas; cada um pode ser `null`), `unknown_axes` (eixos ainda sem resposta) e `warnings` (conflitos entre respostas).

## Respostas de erro

| HTTP | Significado comum |
|---|---|
| `400` | Campo inválido, regra de negócio violada ou duplicidade |
| `401` | Token ausente, inválido ou expirado |
| `403` | Usuário sem permissão administrativa |
| `404` | Recurso inexistente ou que não pertence à pessoa autenticada |

Erros de validação retornam JSON com os campos que precisam ser corrigidos, por exemplo:

```json
{"rating": ["mensagem informando que a nota deve estar entre 1 e 5"]}
```

Duplicidades conhecidas retornam mensagens nos campos `title`, `book` ou `book_id`, `username` e `email` (a chave da biblioteca pode variar entre validação do modelo e colisão no banco). Erros `401` e `403` não incluem detalhes de validação.

Nas perguntas devolvidas por `GET /api/diagnostic/questions/`, cada uma traz `topic` (`label`, `icon`, `color`) e, nas de escala, `explain` (`agree`, `disagree`, `note`) usado pelo botão "Entenda".

### Indicações de leitura

- `POST /api/diagnostic/recommendations/` (aberto, mesmo corpo de `evaluate`): devolve `archetype` e 3 `items` (de gêneros diferentes) do catálogo curado (`Backend/diagnostic/catalog.py`, cerca de 60 obras). Cada item traz `id`, `title`, `author`, `year`, `blurb`, `genre`, `reasons` (por que combina com o perfil) e `traits`. Livros que acionam uma restrição da pessoa ou que ela já citou na Q40 ficam de fora, e cada um vem de um gênero diferente quando possível. A resposta é determinística e não consulta a internet.
- `GET /api/diagnostic/books/<id>/cover/` (aberto): `{ "cover_url", "book" }`, com a capa e os dados da obra no catálogo online (o mesmo formato da busca do catálogo, pronto para `POST /api/books/import/`). Fica em cache por 7 dias; se o catálogo online falhar, devolve `cover_url` vazio e `book: null`.
