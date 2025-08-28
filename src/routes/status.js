'use strict';
const express = require('express');
const router = express.Router();
const { COMPUTE_URL } = require('../config');

router.get('/', async (req, res) => {
  let compute = 'down';
  try {
    if (COMPUTE_URL) {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), 3000);
      const r = await fetch(new URL('version', COMPUTE_URL), { signal: ac.signal });
      clearTimeout(t);
      if (r.ok) compute = 'up';
    }
  } catch (_) {}
  res.json({ ok: true, compute, time: new Date().toISOString() });
});

module.exports = router;