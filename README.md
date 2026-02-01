# Banter & Brats — Local Dev DB Setup

## Quick start (SQLite fallback)
SQLite is the default for local/dev runs when Postgres is unavailable.

```bash
npm install
npm run dev
```

The server logs a fallback warning and `/health` reports `db=sqlite`.

## Optional Postgres via Docker
If you want Postgres locally:

```bash
docker compose up -d
```

Then set `DATABASE_URL` (see `.env.example`) and run:

```bash
npm run dev
```

`/health` will report `db=postgres` when the connection is live.

## Optional Redis for Horizontal Scaling
Redis enables Socket.IO to scale across multiple server instances. This is optional - the app works fine without it using the default in-memory adapter.

To enable Redis:

1. Add Redis to your environment (locally via Docker or cloud service)
2. Set the `REDIS_URL` environment variable:
   ```
   REDIS_URL=redis://localhost:6379
   ```
3. The server will automatically detect and use the Redis adapter

When Redis is unavailable, the server automatically falls back to the in-memory adapter with a warning message.

## Dev seed + smoke test

```bash
npm run dev:seed
npm run test:smoke
```
