/**
 * Vercel serverless function: GET /api/health
 * Liveness probe — no browser needed.
 */
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ status: 'ok', runtime: 'vercel', uptime: process.uptime() }));
}
