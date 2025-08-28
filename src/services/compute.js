const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

function buildUrl(base, path) {
  const u = new URL(path, base);
  return u.toString();
}

exports.solve = async (definition, inputs) => {
  const base = process.env.COMPUTE_URL;
  if (!base) {
    const e = new Error('COMPUTE_URL not set');
    e.status = 503;
    throw e;
  }

  const url = buildUrl(base, './grasshopper/solve');
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.RHINO_COMPUTE_KEY) headers.Authorization = `Bearer ${process.env.RHINO_COMPUTE_KEY}`;

  const payload = { definition, inputs };
  const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });

  if (!r.ok) {
    let detail;
    try { detail = await r.text(); } catch { detail = ''; }
    const e = new Error(`Compute ${r.status} ${r.statusText}${detail ? `: ${detail.slice(0,200)}` : ''}`);
    e.status = r.status;
    throw e;
  }

  return r.json();
};
