'use strict';
const express = require('express');
const router = express.Router();
const { COMPUTE_URL } = require('../config');

router.get('/', async (req, res) => {
  console.log('[status] Request received, COMPUTE_URL:', COMPUTE_URL);
  let compute = 'down';
  try {
    if (COMPUTE_URL) {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), 3000);
      const r = await fetch(new URL('version', COMPUTE_URL), { signal: ac.signal });
      clearTimeout(t);
      if (r.ok) compute = 'up';
    }
  } catch (error) {
    console.log('[status] Compute check error:', error.message);
  }
  console.log('[status] Responding with:', { ok: true, compute, time: new Date().toISOString() });
  res.json({ ok: true, compute, time: new Date().toISOString() });
});

module.exports = router;