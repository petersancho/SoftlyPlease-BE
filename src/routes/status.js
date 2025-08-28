'use strict';
const express = require('express');
const router = express.Router();
const fetch = (...a) => import('node-fetch').then(({ default: f }) => f(...a));

router.get('/', async (req, res) => {
  const base = process.env.COMPUTE_URL;
  if (!base) {
    return res.status(503).json({
      ok: false,
      compute: 'unknown',
      reason: 'COMPUTE_URL not set',
      time: new Date().toISOString(),
    });
  }

  let versionUrl;
  try {
    versionUrl = new URL('./version', base).toString();
  } catch (e) {
    return res.status(503).json({
      ok: false,
      compute: 'unknown',
      reason: 'Invalid COMPUTE_URL',
      time: new Date().toISOString(),
    });
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 3000);

  try {
    const r = await fetch(versionUrl, { signal: controller.signal });
    let info = null;
    try { info = await r.json(); } catch {}
    return res.json({
      ok: true,
      compute: r.ok ? 'up' : 'down',
      version: info,
      time: new Date().toISOString(),
    });
  } catch (e) {
    return res.json({
      ok: true,
      compute: 'down',
      error: e.name || String(e),
      time: new Date().toISOString(),
    });
  } finally {
    clearTimeout(t);
  }
});

module.exports = router;