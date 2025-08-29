'use strict';
const express = require('express');
const https = require('https');
const http = require('http');
const { COMPUTE_URL, RHINO_COMPUTE_KEY } = require('../config');
const router = express.Router();

async function probe(url, path){
  const u = new URL(url);
  const lib = u.protocol === 'https:' ? https : http;
  const opts = {
    hostname: u.hostname,
    port: u.port || (u.protocol === 'https:' ? 443 : 80),
    path,
    method: 'GET',
    timeout: 4000,
    headers: RHINO_COMPUTE_KEY ? { 'Authorization': `Bearer ${RHINO_COMPUTE_KEY}` } : {}
  };
  return new Promise(resolve=>{
    const rq = lib.request(opts, rs=>{
      resolve({ code: rs.statusCode || 0 });
    });
    rq.on('error', e => resolve({ error: e.message }));
    rq.on('timeout', () => { rq.destroy(); resolve({ error: 'timeout' }); });
    rq.end();
  });
}

router.get('/', async (req,res) => {
  let status = 'down', message = 'Compute URL not configured';
  if (COMPUTE_URL) {
    // prefer /health, then fallback to /
    let r = await probe(COMPUTE_URL, '/health');
    if (r.error || (r.code && r.code !== 200)) {
      const fallback = await probe(COMPUTE_URL, '/');
      if (!fallback.error && fallback.code >= 200 && fallback.code < 400) {
        status = 'up'; message = `root ${fallback.code}`;
      } else {
        status = 'down'; message = fallback.error ? fallback.error : `health ${r.code}`;
      }
    } else {
      status = 'up'; message = 'health 200';
    }
  }
  res.json({ ok: true, serverTime: new Date().toISOString(), compute: { url: COMPUTE_URL || null, status, message, hasKey: !!RHINO_COMPUTE_KEY } });
});

module.exports = router;