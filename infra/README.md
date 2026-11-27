# Infra do Shelf (Docker Compose)

Sobe a aplicação completa: PostgreSQL 16, backend Django (Gunicorn) e frontend (Nginx), com o frontend publicado em `http://localhost:8080`.

## Primeira execução

1. Copie `infra/.env.example` para `infra/.env` e troque `DJANGO_SECRET_KEY` (mínimo de 50 caracteres) e `POSTGRES_PASSWORD`.
2. Suba os serviços, a partir da raiz do repositório:

```powershell
docker compose -f infra/compose.yaml --env-file infra/.env up -d --build
```

3. Aplique as migrações (necessário na primeira vez e a cada atualização):

```powershell
docker compose -f infra/compose.yaml --env-file infra/.env run --rm backend python manage.py migrate
```

4. Opcional: crie um administrador com `docker compose ... run --rm backend python manage.py createsuperuser`.

## Comandos do dia a dia

```powershell
docker compose -f infra/compose.yaml --env-file infra/.env ps        # status
docker compose -f infra/compose.yaml --env-file infra/.env logs -f backend
docker compose -f infra/compose.yaml --env-file infra/.env stop      # para sem apagar dados
docker compose -f infra/compose.yaml --env-file infra/.env down      # remove containers (mantém o volume do banco)
```

## Portas e volumes

| Serviço | Porta no host | Observação |
|---|---|---|
| frontend | `8080` (`FRONTEND_HOST_PORT`) | Único ponto de entrada da aplicação |
| backend | `8000` (`BACKEND_HOST_PORT`) | Acesso direto à API, para depuração |
| postgres | `5433` (`POSTGRES_HOST_PORT`) | Porta 5433 evita conflito com o PostgreSQL de outros projetos |

Os dados ficam no volume `shelf_postgres_data`. `down -v` apaga esse volume e todos os dados.

## Produção

O compose é voltado a ambiente local em HTTP. Para produção, use `DJANGO_DEBUG=false`, HTTPS no proxy à frente do frontend e ative os valores de cookie seguro e redirecionamento (`DJANGO_SECURE_SSL_REDIRECT=true`, `DJANGO_SESSION_COOKIE_SECURE=true`, `DJANGO_CSRF_COOKIE_SECURE=true`), além de `DJANGO_DB_SSLMODE=require`. Detalhes em [Backend/README.md](../Backend/README.md).
