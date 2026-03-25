# Pokemon Fullstack

Aplicación fullstack de Pokémon construida con Next.js App Router y Supabase.

## Stack

- Next.js 15 + React 19
- Supabase (PostgreSQL + API)
- Tailwind CSS
- Axios

## Setup local

1. Instala dependencias:

```bash
npm install
```

2. Crea tu archivo de entorno:

```bash
cp .env.example .env
```

3. Completa `.env` con los valores del proyecto Supabase.

4. Ejecuta `supabase-schema.sql` en el SQL Editor de tu proyecto Supabase.
   Este script ahora también habilita RLS, ajusta privilegios mínimos, crea `profiles` y `favorites`, y añade un trigger para auto-habilitar RLS en futuras tablas creadas en `public`.

5. Levanta el proyecto:

```bash
npm run dev
```

6. Verifica salud y conexión:

- App: `http://localhost:3000`
- Health: `http://localhost:3000/api/health`
- Types: `http://localhost:3000/api/types`

## Variables de entorno

Requeridas:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `DIRECT_URL`
- `ADMIN_API_KEY`
- `ADMIN_SESSION_SECRET`

Nota:

- `ADMIN_API_KEY` protege endpoints admin y permite iniciar sesión admin server-side.
- `ADMIN_SESSION_SECRET` firma la cookie `httpOnly` de la sesión admin. Debe ser larga, aleatoria y distinta de otras llaves.
- Si hubo exposición previa de llaves o password DB, debes rotarlas en Supabase.

## API

### `GET /api/pokemons`

Parámetros:

- `page` (default `1`)
- `pageSize` (default `18`, max `100`)
- `search` (nombre parcial)
- `type` (tipo Pokémon)
- `sort` (`pokemonId_asc`, `pokemonId_desc`, `name_asc`, `name_desc`, `attack_asc`, `attack_desc`)
- `refresh=true` (requiere `x-admin-key`; no usa sesión por cookie y preserva Pokémon custom)

Respuesta:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 18,
    "total": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

### `POST /api/pokemons`

- Requiere una sesión admin válida por cookie `httpOnly` o header `x-admin-key: <ADMIN_API_KEY>`
- Valida payload server-side
- Códigos: `201`, `400`, `401`, `409`, `500`

### `DELETE /api/pokemons?id=<pokemonId>`

- Requiere una sesión admin válida por cookie `httpOnly` o header `x-admin-key: <ADMIN_API_KEY>`
- Solo elimina Pokémon custom
- Códigos: `200`, `400`, `401`, `403`, `404`, `500`

### `GET /api/admin/session`

- Devuelve el estado de la sesión admin actual

### `POST /api/admin/session`

- Recibe `{ "apiKey": "<ADMIN_API_KEY>" }`
- Si es válida, crea una sesión admin en cookie `httpOnly`
- Códigos: `200`, `400`, `401`, `429`

### `DELETE /api/admin/session`

- Cierra la sesión admin actual

### `GET /api/pokemons/[id]`

- Códigos: `200`, `400`, `404`, `500`

### `GET /api/types`

- Códigos: `200`, `500`

### `GET /api/health`

- Códigos: `200` (ok), `503` (degraded)

### `GET /api/favorites`

- Requiere sesión de usuario válida de Supabase Auth
- Soporta `?idsOnly=true` para devolver solo IDs
- Respuesta:

```json
{
  "favoriteIds": [25, 6],
  "favorites": []
}
```

### `POST /api/favorites`

- Requiere sesión de usuario válida
- Recibe `{ "pokemonId": 25 }`
- Códigos: `201`, `400`, `401`, `404`, `500`

### `GET /api/favorites/[pokemonId]`

- Requiere sesión de usuario válida
- Devuelve `{ "isFavorite": true }`

### `DELETE /api/favorites/[pokemonId]`

- Requiere sesión de usuario válida
- Elimina ese Pokémon de favoritos para el usuario autenticado

## Auth y favoritos

Rutas nuevas:

- `/login`
- `/register`
- `/favorites`

Notas:

- El registro usa Supabase Auth.
- Si tu proyecto tiene confirmación por email habilitada, el usuario deberá confirmar antes de iniciar sesión.
- Si la confirmación está deshabilitada en Supabase Auth, el login queda activo inmediatamente después del registro.
- Los favoritos se guardan por usuario en `public.favorites`.

## Supabase Keepalive

Este repositorio incluye un workflow programado para mitigar pausas por inactividad en Supabase Free.
No es una garantía contractual de uptime, pero reduce el riesgo de tener que "despertar" el proyecto manualmente.

Archivo:

- `.github/workflows/supabase-keepalive.yml`

Frecuencia:

- Diario, a las `03:17 UTC`
- También disponible con ejecución manual (`workflow_dispatch`)

### Configuración en GitHub

En tu repo: `Settings > Secrets and variables > Actions`, crea:

- `SUPABASE_URL` (ej: `https://<project-ref>.supabase.co`)
- `SUPABASE_ANON_KEY` (anon key, no service role)

### Qué hace el job

- Ejecuta `GET /rest/v1/types?select=id&limit=1` contra Supabase REST.
- Usa headers:
  - `apikey`
  - `Authorization: Bearer <anon_key>`
  - `Accept: application/json`
- Reintenta hasta 3 veces con backoff lineal:
  - intento 1 -> espera `15s`
  - intento 2 -> espera `30s`
  - intento 3 -> falla si no obtiene `HTTP 200`

### Verificación

1. Ve a `Actions > Supabase Keepalive`.
2. Ejecuta `Run workflow`.
3. Debe terminar en estado `green` con mensaje `Keepalive succeeded with HTTP 200.`

### Troubleshooting

- `401` o `403`: `SUPABASE_ANON_KEY` incorrecta o inválida.
- `404`: la tabla `types` no existe; ejecuta `supabase-schema.sql` en el SQL Editor de Supabase.
- `000` o timeout de red: fallo temporal de conectividad; el workflow ya reintenta automáticamente.

### Seguridad

- `supabase-schema.sql` habilita RLS en `public.pokemons` y `public.types`.
- `supabase-schema.sql` también deja `public.profiles` y `public.favorites` listas para autenticación de usuarios con políticas por dueño.
- `public.pokemons` queda bloqueada para acceso directo desde la Data API (`anon` y `authenticated`).
- `public.types` queda en solo lectura para `anon` y `authenticated`, únicamente para soportar lectura pública segura y el keepalive.
- El backend sigue funcionando porque `SUPABASE_SERVICE_ROLE_KEY` se usa solo server-side y bypassa RLS.
- Para evitar nuevas alertas de `RLS Disabled in Public`, el script instala un event trigger que auto-habilita RLS en nuevas tablas creadas en `public`.
- El workflow **no** usa `SUPABASE_SERVICE_ROLE_KEY`.
- Las claves se leen solo desde secretos de GitHub Actions.
- Se enmascaran valores sensibles en logs.

### Verificar Alertas de Supabase

Después de ejecutar `supabase-schema.sql`:

1. Ve a `Database > Security Advisor`.
2. Pulsa `Refresh`.
3. Confirma que desaparece `RLS Disabled in Public` para `public.pokemons` y `public.types`.

### Referencias

- Supabase Production Checklist:
  - https://supabase.com/docs/guides/deployment/going-into-prod
- Supabase Billing:
  - https://supabase.com/docs/guides/platform/billing-on-supabase

## Calidad

```bash
npm run lint
npm run build
```
