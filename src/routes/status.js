'use strict';
const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { COMPUTE_URL, RHINO_COMPUTE_KEY } = require('../config');

router.get('/', async (req, res) => {
  const computeUrl = COMPUTE_URL || process.env.RHINO_COMPUTE_URL;
  const computeKey = RHINO_COMPUTE_KEY || process.env.RHINO_COMPUTE_KEY;

  let computeStatus = 'unknown';
  let computeMessage = 'Compute URL not configured';

  if (computeUrl) {
    // Probe /health first, then fallback to root/version
    const probes = ['health', 'version', ''];
    for (const p of probes) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const headers = {}
        if (computeKey) headers['Authorization'] = `Bearer ${computeKey}`;
        const url = `${computeUrl.replace(/\/$/, '')}/${p}`;
        const resp = await fetch(url, { method: 'GET', signal: controller.signal, headers });
        clearTimeout(timeoutId);
        if (resp.status >= 200 && resp.status < 400) {
          computeStatus = 'up';
          computeMessage = `Compute responded ${resp.status} to /${p}`;
          break;
        }
        if (resp.status === 404 && p === 'health') {
          // try next probe
          continue;
        }
        // non-2xx/3xx -> consider down but record message
        computeStatus = 'down';
        computeMessage = `Compute probe ${p} returned ${resp.status}`;
        break;
      } catch (err) {
        if (err.name === 'AbortError') {
          computeStatus = 'down';
          computeMessage = 'Compute connection timeout';
        } else {
          computeStatus = 'error';
          computeMessage = `Compute unreachable: ${err.message}`;
        }
        // continue trying other probes only when timeout/404; otherwise break
        if (computeStatus !== 'down') break;
      }
    }
  }

  return res.json({
    ok: true,
    serverTime: new Date().toISOString(),
    compute: {
      url: computeUrl || null,
      status: computeStatus,
      message: computeMessage,
      hasKey: !!computeKey
    }
  });
});

module.exports = router;