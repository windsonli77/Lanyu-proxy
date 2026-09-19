const TARGET = 'https://peuiapbcfpdlfbcdvuh.supabase.co';
const SKIP_REQ = new Set(['host','origin','referer','connection','content-length','transfer-encoding','accept-encoding']);
const SKIP_RES = new Set(['connection','transfer-encoding','content-encoding','keep-alive']);

async function readBody(req) {
  if (['GET','HEAD'].includes(req.method || '')) return undefined;
  const chunks = [];
  for await (const c of req) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
  return Buffer.concat(chunks);
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    return res.status(204).end();
  }

  const target = TARGET + (req.url || '/');

  const headers = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (SKIP_REQ.has(k.toLowerCase())) continue;
    if (typeof v === 'string') headers[k] = v;
    else if (Array.isArray(v)) headers[k] = v.join(', ');
  }

  try {
    const body = await readBody(req);
    const response = await fetch(target, { method: req.method, headers, body });
    const buf = Buffer.from(await response.arrayBuffer());

    for (const [k, v] of response.headers.entries()) {
      if (!SKIP_RES.has(k.toLowerCase())) res.setHeader(k, v);
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', '*');
    res.setHeader('Content-Length', buf.length);
    return res.status(response.status).end(buf);
  } catch (e) {
    return res.status(502).json({ error: String((e && e.message) || e) });
  }
};
