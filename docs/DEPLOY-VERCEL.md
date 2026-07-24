# Deploying the Render API to Vercel

The standalone Express server (`server/src/index.mjs`) is **not** deployable to
Vercel as-is: Vercel is serverless (no long-running `app.listen()`), and full
`puppeteer` ships a Chromium far larger than the serverless bundle allows.

The `server/api/` folder solves this: each file is a Vercel serverless function
that reuses the shared render logic (`server/src/render.mjs`, `themes.mjs`,
`validate.mjs`) but launches Chromium through
[`@sparticuz/chromium`](https://github.com/Sparticuz/chromium) +
`puppeteer-core` — a brotli-compressed Chromium (~50MB) that fits the bundle and
unpacks into `/tmp` at runtime.

## Why the swap is needed

| | Standalone server | Vercel serverless |
|---|---|---|
| Process model | `app.listen()` runs forever | one function invocation per request |
| Browser | full `puppeteer` (bundled Chromium ~150MB) | `puppeteer-core` + `@sparticuz/chromium` (~50MB) |
| Entry | `server/src/index.mjs` | `server/api/render.mjs` (and `health`, `capabilities`) |
| Config | env vars | `vercel.json` (memory/duration) |

The render code itself is identical — `browser-local.mjs` vs
`browser-serverless.mjs` is the only difference, injected into
`renderMermaid({ browser })`.

## File layout (already in the repo)

```
server/
  vercel.json            # function memory + maxDuration
  api/
    render.mjs           # POST /api/render      (uses browser-serverless)
    capabilities.mjs     # GET  /api/capabilities
    health.mjs           # GET  /api/health
  src/
    render.mjs           # shared render engine (browser-agnostic)
    themes.mjs           # shared theme config
    validate.mjs         # shared request validation
    browser-serverless.mjs   # @sparticuz/chromium launcher
    browser-local.mjs        # full puppeteer launcher (server only)
```

## Deploy steps

1. **Push this branch** to your Git remote (already connected to Vercel, or
   import the repo at vercel.com/new).

2. **Set the Root Directory to `server`** in the Vercel project settings.
   Vercel then treats `server/api/*.mjs` as the functions and installs
   `server/package.json` (which lists `@sparticuz/chromium` and `puppeteer-core`
   as `optionalDependencies`).

3. **Skip downloading Chromium during install.** Add an env var so
   `puppeteer`'s postinstall (pulled in transitively) doesn't try to fetch a
   150MB browser in the build:

   ```
   PUPPETEER_SKIP_DOWNLOAD = true
   ```

   The serverless path never uses full `puppeteer`; only `@sparticuz/chromium`.

4. **(Optional) env vars:**
   - `CORS_ORIGIN` — lock the API to your site's origin instead of `*`.

5. **Deploy.** Then smoke-test:

   ```bash
   curl https://<your-project>.vercel.app/api/health
   curl -X POST https://<your-project>.vercel.app/api/render \
     -H "Content-Type: application/json" \
     -d '{"code":"graph TD\n A-->B","format":"png"}' -o out.png
   ```

## Plan limits & gotchas

- **Duration.** Chromium cold start is ~2–5s. `vercel.json` sets
  `maxDuration: 60`, but the **Hobby plan caps functions at ~10s** — big
  diagrams can exceed it. Use **Pro** for headroom.
- **Memory.** `vercel.json` requests `1024` MB for `api/render.mjs`; Chromium is
  memory-hungry. Lower memory risks OOM on complex diagrams.
- **Cold starts.** Each new instance re-launches Chromium. Within a warm
  instance the browser is reused (see `browser-serverless.mjs`).
- **Bundle size.** `@sparticuz/chromium` is designed to fit; do **not** add full
  `puppeteer` to the deployed function or the bundle will blow the limit.
- **Version pairing.** Keep `@sparticuz/chromium` and `puppeteer-core` on
  compatible majors. If Chromium fails to launch after an upgrade, realign them.
- **Edge runtime is not supported** — these must run on the Vercel **Node.js**
  runtime (Chromium needs full Node + filesystem).

## Alternatives if serverless limits bite

- **Render as a container** (Fly.io, Railway, Render.com, a VPS) using the
  standalone `server/` — no duration caps, warm browser always ready.
- **Vercel + external render service:** keep the SPA on Vercel, run the
  standalone server elsewhere, point the SPA at it.
- **Offload to a managed Mermaid renderer** (e.g. a Kroki instance) if you don't
  want to operate Chromium at all.

## Security

Same caveats as [API.md § Security](./API.md#security): no auth / rate limiting
out of the box. On a public Vercel URL, add authentication and a rate limiter
(e.g. Vercel Middleware, an API key check, or an upstream gateway) before real
use — a browser-render endpoint is an easy DoS target.
