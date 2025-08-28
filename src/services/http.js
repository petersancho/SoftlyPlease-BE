const fetch = (...a)=>import('node-fetch').then(({default:fetch})=>fetch(...a));

async function fetchRetry(url, opts={}, retries=2, backoff=400) {
  let err;
  for (let i=0;i<=retries;i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(()=>ctrl.abort(), opts.timeout || 10000);
      const res = await fetch(url, { ...opts, signal: ctrl.signal });
      clearTimeout(t);
      if (res.ok) return res;
      if (![500,502,503,504].includes(res.status)) return res;
      err = new Error(`HTTP ${res.status}`);
    } catch (e) { err = e; }
    await new Promise(r=>setTimeout(r, backoff*Math.pow(2,i)));
  }
  throw err;
}

module.exports = { fetchRetry };
