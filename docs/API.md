# Mermaid Render API

Server-side rendering for Mermaid diagrams. Send Mermaid source, get an image
back (PNG / JPEG / WebP / SVG) — using the same 8 themes and quality/scale
options as the web app's live preview.

The render engine runs **real headless Chromium** because Mermaid v11 measures
text with `getBBox()` / `getComputedTextLength()` to lay diagrams out. A DOM
shim (jsdom) has no layout engine and produces collapsed, unusable SVG — this
was verified experimentally, which is why a browser is required.

Two deployment targets share the exact same render logic:

| Target | Entry | Browser engine | Use when |
|--------|-------|----------------|----------|
| **Standalone server** | `server/src/index.mjs` (Express) | full `puppeteer` (bundled Chromium) | VPS, container, local dev, long-running host |
| **Vercel serverless** | `server/api/*.mjs` | `puppeteer-core` + `@sparticuz/chromium` | Vercel / AWS Lambda |

See [DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md) for the serverless path.

---

## Endpoints

### `POST /api/render`

Render Mermaid code to an image.

**Request body** (`application/json`):

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `code` | string | **yes** | — | Mermaid source. Max 50,000 chars. |
| `theme` | string | no | `default` | One of the 8 themes (see below). |
| `format` | string | no | `png` | `png` \| `jpeg` \| `webp` \| `svg`. |
| `scale` | number | no | `2` | `1` \| `2` \| `4`. Raster resolution multiplier (ignored for `svg`). |
| `background` | string | no | `transparent` | `transparent`, `white`, or any CSS color. JPEG always gets an opaque background. |

**Query params:**

- `?encoding=base64` — return a JSON envelope with a `data:` URL instead of raw bytes.

**Responses:**

- `200` — raw image bytes with the matching `Content-Type`; headers `X-Image-Width` / `X-Image-Height` carry the pixel size. With `?encoding=base64`, a JSON body (see below).
- `400 ValidationError` — bad/missing fields; `details[]` explains.
- `422 MermaidSyntaxError` — `code` is not valid Mermaid; `message` has the parser error.
- `504 RenderTimeout` — render exceeded the timeout (standalone server only).
- `500 InternalError` — unexpected failure.

**Base64 envelope** (`?encoding=base64`):

```json
{
  "format": "png",
  "contentType": "image/png",
  "width": 570,
  "height": 732,
  "data": "data:image/png;base64,iVBORw0KGgo..."
}
```

### `GET /api/capabilities`

Returns supported themes, formats, scales, defaults, and `maxCodeLength`. Use
this to build a settings UI dynamically instead of hard-coding the lists.

```json
{
  "themes": ["default","neutral","dark","forest","cyberpunk","ocean","sunset","minimal"],
  "formats": ["svg","png","jpeg","webp"],
  "scales": [1,2,4],
  "defaults": { "theme": "default", "format": "png", "scale": 2, "background": "transparent" },
  "maxCodeLength": 50000
}
```

### `GET /api/health`

Liveness probe: `{ "status": "ok", "uptime": <seconds> }`.

---

## Themes

The API mirrors the web app's toolbar themes (ported from
`src/services/diagram/mermaid.service.ts`):

`default` · `neutral` · `dark` · `forest` · `cyberpunk` · `ocean` · `sunset` · `minimal`

Custom themes (`cyberpunk`, `ocean`, `sunset`, `minimal`) map to a Mermaid base
theme plus tuned `themeVariables`; the rest use Mermaid's built-ins (`default`
maps to `dark` to match the web preview).

## Quality / scale

`scale` controls raster resolution the same way the Export modal does:

- `1` — 1x (screen resolution)
- `2` — 2x (default, crisp on retina)
- `4` — 4x (print / high-DPI)

`svg` is resolution-independent, so `scale` has no effect on it.

---

## Examples

**cURL — PNG, dark theme, 2x, save to file:**

```bash
curl -X POST http://localhost:4001/api/render \
  -H "Content-Type: application/json" \
  -d '{"code":"flowchart TD\n A[Start]-->B{OK?}\n B-->|Yes|C[Ship]\n B-->|No|D[Fix]","theme":"dark","format":"png","scale":2}' \
  -o diagram.png
```

**cURL — SVG, forest theme:**

```bash
curl -X POST http://localhost:4001/api/render \
  -H "Content-Type: application/json" \
  -d '{"code":"sequenceDiagram\n Alice->>Bob: Hi","theme":"forest","format":"svg"}' \
  -o diagram.svg
```

**JavaScript (fetch) — base64 for an `<img>`:**

```js
const res = await fetch('http://localhost:4001/api/render?encoding=base64', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: 'graph LR\n A-->B', theme: 'ocean', format: 'webp' }),
});
const { data } = await res.json();      // data:image/webp;base64,...
document.querySelector('img').src = data;
```

**JavaScript (fetch) — raw bytes to a Blob:**

```js
const res = await fetch('http://localhost:4001/api/render', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: 'graph TD\n A-->B', format: 'png' }),
});
if (!res.ok) throw new Error((await res.json()).error);
const blob = await res.blob();
const url = URL.createObjectURL(blob);
```

---

## Running the standalone server

```bash
cd server
npm install          # downloads Chromium via puppeteer (~150MB)
npm start            # -> http://127.0.0.1:4001
```

Environment variables:

| Var | Default | Purpose |
|-----|---------|---------|
| `PORT` | `4001` | Listen port. |
| `HOST` | `127.0.0.1` | Bind address. |
| `RENDER_TIMEOUT_MS` | `30000` | Per-request render timeout. |
| `CORS_ORIGIN` | `*` | `Access-Control-Allow-Origin` value. |

---

## Security

This is a **minimal** service with **no authentication or rate limiting**. The
render endpoint drives a headless browser, which is CPU/memory-heavy and
therefore DoS-sensitive. Before exposing it publicly:

1. **Add authentication** (API key header / JWT / gateway auth).
2. **Add rate limiting** (per IP / per key).
3. **Keep the payload cap** (`maxCodeLength`, JSON body limit) — already enforced.
4. **Constrain resources** (container memory/CPU limits, concurrency cap).
5. Mermaid runs with `securityLevel: 'strict'` (no click handlers, sanitized
   HTML labels) — keep it that way; do not switch to `loose`.
6. On Vercel, prefer the Pro plan for the render function (Hobby caps duration
   at ~10s; Chromium cold start alone can be several seconds).
