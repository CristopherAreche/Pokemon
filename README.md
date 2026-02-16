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

Opcional para usar creación/borrado desde el frontend en local:

- `NEXT_PUBLIC_ADMIN_API_KEY`

Nota:

- `ADMIN_API_KEY` protege endpoints de escritura.
- Si usas `NEXT_PUBLIC_ADMIN_API_KEY`, esa key queda expuesta al cliente. Es solo solución temporal para entorno local/admin.
- Si hubo exposición previa de llaves o password DB, debes rotarlas en Supabase.

## API

### `GET /api/pokemons`

Parámetros:

- `page` (default `1`)
- `pageSize` (default `18`, max `100`)
- `search` (nombre parcial)
- `type` (tipo Pokémon)
- `sort` (`pokemonId_asc`, `pokemonId_desc`, `name_asc`, `name_desc`, `attack_asc`, `attack_desc`)
- `refresh=true` (requiere `x-admin-key`)

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

- Requiere header `x-admin-key: <ADMIN_API_KEY>`
- Valida payload server-side
- Códigos: `201`, `400`, `401`, `409`, `500`

### `DELETE /api/pokemons?id=<pokemonId>`

- Requiere header `x-admin-key: <ADMIN_API_KEY>`
- Solo elimina Pokémon custom
- Códigos: `200`, `400`, `401`, `403`, `404`, `500`

### `GET /api/pokemons/[id]`

- Códigos: `200`, `400`, `404`, `500`

### `GET /api/types`

- Códigos: `200`, `500`

### `GET /api/health`

- Códigos: `200` (ok), `503` (degraded)

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

- El workflow **no** usa `SUPABASE_SERVICE_ROLE_KEY`.
- Las claves se leen solo desde secretos de GitHub Actions.
- Se enmascaran valores sensibles en logs.

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
