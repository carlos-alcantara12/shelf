# Shelf — sua estante digital

**Shelf** é uma aplicação web para organizar livros e acompanhar a vida de leitura: biblioteca pessoal, progresso por páginas, sessões de leitura com timer, avaliações e um perfil de leitor que ajuda a descobrir o que ler a seguir. A interface é inspirada em uma estante física de madeira.

> O app Django continua se chamando `Backend`; o produto, o repositório e os textos da interface usam o nome **Shelf**.

[![Quality checks](https://github.com/carlos-alcantara12/shelf/actions/workflows/quality.yml/badge.svg)](https://github.com/carlos-alcantara12/shelf/actions/workflows/quality.yml)

---

## O problema que o Shelf resolve

Quem lê com frequência acaba espalhando a vida de leitura por vários lugares: uma lista de desejos num app, as páginas lidas numa anotação, as notas e opiniões na memória, as recomendações em conversas e redes sociais. Isso gera quatro dificuldades:

1. **Falta de um lugar só.** Não existe uma visão única do que está na fila, do que está em andamento e do que já foi lido.
2. **Falta de constância.** Sem registrar quanto e quando lê, a pessoa não percebe se o hábito está pegando e perde a motivação para continuar.
3. **Dificuldade de escolher o próximo livro.** As indicações costumam ser genéricas e ignoram o jeito de ler de cada pessoa (ritmo, gêneros, tamanho de livro preferido).
4. **Ler em grupo é desorganizado.** Dois ou mais leitores que querem ler os mesmos livros não têm onde manter uma estante em comum sem misturar o progresso de cada um.

### Como o Shelf responde

| Dificuldade | O que o Shelf oferece |
|---|---|
| Sem lugar único | Estante pessoal com os status **Quero ler / Lendo / Lido**, busca e filtros |
| Sem constância | Cronômetro, meta diária, objetivos e tarefas dentro de cada livro, e a evolução por semana, mês e ano |
| Escolha do próximo livro | Questionário de perfil de leitor, com indicações que explicam o motivo de cada uma |
| Leitura em grupo | A API de bibliotecas compartilhadas (convites, progresso individual) está pronta; a tela foi retirada do frontend por enquanto |

---

## O que já funciona

| Área | Situação |
|---|---|
| **Abertura e login** | Tela de entrada animada, frase literária variável, login com JWT e renovação automática do token |
| **Perfil de leitor** | Questionário em 3 níveis (10, 20 ou 40 perguntas) antes do cadastro, com resultado explicado, livros indicados com o motivo de cada um (catálogo curado de ~60 obras) e perfil salvo na conta |
| **Biblioteca pessoal** | Estante interativa, status **Quero ler / Lendo / Lido**, progresso por páginas, reordenação por arrastar e soltar, busca e filtros |
| **Catálogo** | Busca no catálogo local e em fontes online (Google Books, com fallback para Open Library); a obra só é importada quando entra em uma estante |
| **Leitura** | No diálogo de cada livro (aba **Ler**): cronômetro, meta diária, objetivos da sessão e tarefas do livro |
| **Progresso** | Evolução da leitura por semana, mês e ano, com navegação entre períodos |
| **Compartilhadas** | Só na API: bibliotecas em conjunto, convites, correio interno e pedidos de remoção. A tela foi retirada do frontend |
| **Avaliações** | Nota de 1 a 5 e comentário opcional em livros lidos |
| **Tendências** | Lista de destaques administrada pelo Django Admin |
| **Produção** | Dockerfiles, PostgreSQL com SSL, health check, limite de tentativas de login, script de backup e CI |

**Ainda não existe:** tela de bibliotecas compartilhadas no frontend (a API existe), indicações personalizadas dentro do catálogo (hoje a lateral só mostra obras do mesmo gênero; veja o [plano](Docs/recomendacoes-catalogo-plano.md)), tendências calculadas automaticamente e uma licença de distribuição.

## Como rodar

Você precisa de **Python 3.12+** e **Node 22+**. Abra dois terminais na raiz do projeto.

**Backend** (porta `8001`, a que o Vite usa por padrão):

```powershell
cd Backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:DJANGO_DEBUG = "true"
python manage.py migrate
python manage.py createsuperuser   # opcional: acesso ao /admin/
python manage.py runserver 127.0.0.1:8001
```

**Frontend:**

```powershell
cd Frontend_react
npm install
npm run dev
```

O Vite mostra no terminal o endereço para abrir no navegador e encaminha `/api/` para o backend. Para usar outra porta, defina `VITE_API_PROXY_TARGET`. No Bash, troque a ativação por `source .venv/bin/activate` e o `$env:` por `export`.

Detalhes de variáveis de ambiente, Google Books, produção e Docker estão em [Backend/README.md](Backend/README.md) e [Frontend_react/README.md](Frontend_react/README.md).

## Testes e qualidade

```powershell
# Backend: 103 testes (autenticação, isolamento de dados, regras de leitura, compartilhadas, perfil de leitor)
cd Backend; $env:DJANGO_DEBUG = "true"; python manage.py test Backend.tests

# Frontend
cd Frontend_react; npm run lint; npm run build
```

O workflow [`quality.yml`](.github/workflows/quality.yml) roda checagem do Django, verificação de migrações, testes do backend, lint e build do frontend a cada push e pull request.

## Estrutura do repositório

```text
.
├── Backend/                  # API Django + Django REST Framework
│   ├── config/               # settings, urls, wsgi/asgi
│   ├── diagnostic/           # banco de perguntas e pontuação do perfil de leitor
│   ├── migrations/
│   ├── tests/
│   ├── scripts/              # seed local e backup PostgreSQL
│   ├── models.py, serializers.py, views.py, urls.py, external_books.py
│   ├── API.md                # referência completa dos endpoints
│   └── README.md             # execução local, produção e Docker
├── Frontend_react/           # React 19 + Vite
│   └── src/
│       ├── app/              # roteador, contextos de sessão e biblioteca, layout
│       ├── pages/            # uma pasta por rota (welcome, login, diagnostic, library, ...)
│       ├── features/         # componentes de domínio (estante, catálogo, progresso)
│       ├── components/       # componentes visuais e animações
│       ├── design-system/    # Button, Heading, Section, Container
│       ├── styles/           # tokens de cor, tipografia e espaçamento
│       └── lib/              # cliente da API, utilitários
├── Docs/                     # especificações e planos (ver Docs/README.md)
├── .github/workflows/        # CI
└── skils/                    # skills de apoio ao desenvolvimento (submódulo)
```

## Arquitetura em resumo

- **Backend:** os *models* guardam os dados e suas regras, os *serializers* validam entrada e saída, as *views* definem operações e permissões, e `urls.py` mapeia a API sob `/api/`. Todos os endpoints exigem autenticação, exceto cadastro, login, health check e o questionário público do perfil de leitor.
- **Frontend:** `apiRequest` (`src/lib/api.js`) é o cliente único: envia o token, renova-o uma só vez quando expira e leva a pessoa para `/entrar` se a sessão acabar. Cada página é carregada sob demanda.
- **Dados:** SQLite em desenvolvimento; PostgreSQL com SSL obrigatório em produção.

### Rotas do frontend

| Rota | Tela | Acesso |
|---|---|---|
| `/` | Abertura | pública |
| `/entrar` | Login | pública |
| `/diagnostico` · `/diagnostico/perguntas` · `/diagnostico/resultado` | Perfil de leitor | pública |
| `/cadastro` | Criar conta e salvar o perfil | pública |
| `/biblioteca` | Minha biblioteca (estante) | exige sessão |
| `/catalogo` | Explorar obras | exige sessão |
| `/progresso` | Evolução semanal, mensal e anual | exige sessão |

### API

A referência completa, com exemplos de requisição e resposta, está em [Backend/API.md](Backend/API.md). Os grupos principais:

| Prefixo | Finalidade |
|---|---|
| `/api/auth/` | Cadastro, login (JWT), renovação do token, usuário atual |
| `/api/books/` | Catálogo, descoberta online e importação |
| `/api/library/` | Biblioteca pessoal (status, páginas lidas, ordem) |
| `/api/reviews/` | Avaliações |
| `/api/reading-sessions/`, `/api/reading-goal/`, `/api/reading-tasks/`, `/api/reading-stats/` | Timer, metas, tarefas e estatísticas |
| `/api/shared-*`, `/api/mailbox/` | Bibliotecas compartilhadas, convites, remoções e correio interno |
| `/api/diagnostic/` | Perguntas, avaliação e perfil de leitor |
| `/api/trending/`, `/api/health/` | Tendências e saúde do serviço |

## Regras de negócio principais

- Cada pessoa vê e altera apenas a própria biblioteca, avaliações e sessões; o catálogo de obras é compartilhado e não permite duplicar título + autor.
- As páginas lidas não passam do total da obra; para marcar **Lido**, o total precisa estar cadastrado e igual às páginas lidas.
- Só livros marcados como lidos podem ser avaliados, e há no máximo uma avaliação por pessoa e livro.
- Em bibliotecas compartilhadas, quem adicionou um livro pode removê-lo; outro participante envia um pedido interno que a pessoa responsável aprova ou recusa. O progresso individual é preservado.
- Remover um livro da própria biblioteca não apaga a obra do catálogo nem afeta outras pessoas.
- Editar ou remover obras do catálogo e manter as tendências é restrito a administradores.

A especificação original está em [Docs/especificacao-tecnica.md](Docs/especificacao-tecnica.md).

## Documentação

| Documento | Conteúdo |
|---|---|
| [Backend/API.md](Backend/API.md) | Referência da API |
| [Backend/README.md](Backend/README.md) | Execução local, testes, produção e Docker |
| [Frontend_react/README.md](Frontend_react/README.md) | Estrutura do código, rotas e qualidade |
| [Docs/README.md](Docs/README.md) | Índice das especificações e planos |

## Próximos passos

1. Recomendações no catálogo com o perfil de leitor e o motivo de cada indicação ([plano](Docs/recomendacoes-catalogo-plano.md)).
2. Integrar o perfil às telas internas e permitir refazê-lo depois do cadastro (Fase E).
3. Reorganizar a tela de biblioteca ([plano](Docs/biblioteca-plano.md)).
4. Concluir a publicação: domínio, TLS, segredos no provedor, monitoramento e backups com teste de restauração.

## Licença

Nenhuma licença foi definida ainda. Enquanto não houver uma, todos os direitos ficam reservados à autoria do projeto; escolha e adicione um arquivo `LICENSE` antes de publicá-lo como software aberto.
