# Frontend Shelf

Interface do Shelf feita com React e Vite. A tela de entrada leva à área da biblioteca, onde a pessoa pode entrar ou criar uma conta, pesquisar livros do catálogo local e do Google Books e filtrar por gênero e categoria. Uma obra online só é importada para o catálogo do Shelf quando a pessoa a adiciona à própria estante ou a uma biblioteca compartilhada.

## Executar localmente

```powershell
npm install
npm run dev
```

Inicie também o backend Django com `python manage.py runserver 127.0.0.1:8001`; o servidor de desenvolvimento do Vite encaminha as chamadas `/api/` para esse endereço por padrão. Para usar outra porta, defina `VITE_API_PROXY_TARGET`. O Vite exibe no terminal o endereço local para abrir no navegador. Para gerar os arquivos de produção, execute `npm run build`.

As frases são escolhidas localmente e a última exibida fica salva no `localStorage`, evitando repetições consecutivas. A animação respeita a preferência do sistema por movimento reduzido.

## Estrutura do código

```
src/
  main.jsx            ponto de entrada
  app/                roteador (App.jsx), AuthContext, LibraryContext e AppLayout (moldura das telas logadas)
  pages/              uma pasta por rota: welcome, login, signup, diagnostic, library, catalog, progress, shared
  features/           componentes de domínio usados por mais de uma tela (ex.: BookDetailDialog)
  components/         componentes visuais reutilizáveis e animações; ui/ tem os primitivos
  design-system/      Button, Heading, Section e Container, baseados nos tokens
  styles/tokens.css   cores, tipografia, espaçamento, raios e sombras (tema escuro preparado)
  lib/                api.js (cliente único da API), storage.js e books.js (utilitários de livros)
  data/               dados estáticos
```

O alias `@` aponta para `src/` (`import { apiRequest } from "@/lib/api"`).

### Rotas

| Rota | Tela | Acesso |
|---|---|---|
| `/` | Abertura | pública |
| `/entrar` | Entrar (quem já tem conta) | pública |
| `/diagnostico` | Perfil de leitor: escolha do nível (10, 20 ou 40 perguntas) | pública |
| `/diagnostico/perguntas` | Perguntas, uma por tela, com resumo a cada 10 | pública |
| `/diagnostico/resultado` | Resultado do perfil | pública |
| `/cadastro` | Criar conta e salvar o perfil | pública |
| `/biblioteca` | Minha biblioteca (estante) | exige sessão |
| `/catalogo` | Explorar obras | exige sessão |
| `/progresso` | Progresso e sessões de leitura | exige sessão |
| `/compartilhadas` | Bibliotecas compartilhadas e correio | exige sessão |

Quem abre uma rota restrita sem sessão é levado para `/entrar`. O botão "Criar conta" da abertura e do login leva a `/diagnostico`; as respostas ficam no navegador (`localStorage`, chave `shelf:diagnostico`) até o cadastro, quando são enviadas ao servidor. Cada página é carregada sob demanda (`React.lazy`). Em produção o nginx já devolve `index.html` para qualquer rota (`try_files`).

### API

Toda chamada passa por `apiRequest` (`src/lib/api.js`): ela envia o token, renova-o uma única vez quando expira (mesmo com várias requisições simultâneas) e, se a renovação falhar, encerra a sessão e leva a pessoa para `/entrar`.

## Qualidade

```powershell
npm run lint          # ESLint (também roda no CI)
npm run format        # Prettier, aplica a formatação em src/
npm run format:check
```

Em desenvolvimento, `/dev/design` mostra os tokens e componentes do design system (não existe no build de produção).

