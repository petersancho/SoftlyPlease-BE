"use strict";
const express = require('express');
const router = express.Router();
const cache = require('../services/cache');
const { solve } = require('../services/compute');

router.post('/', handler);
router.post('/:definition', handler);

function norm(def){ if (!def) return null; const s = String(def).split('/').pop(); return /\.(gh|ghx)$/i.test(s) ? s : (s + '.gh'); }

async function handler(req, res) {
  try {
    const def = norm(req.params.definition || req.body?.definition);
    const inputs = req.body?.inputs || {};
    if (!def) return res.status(400).json({ error: 'Missing "definition"' });

    const key = cache.generateKey(def, inputs);
    const cached = await cache.get(key);
    if (cached) {
      res.setHeader('Server-Timing', 'cache;desc="hit"');
      return res.type('application/json').send(cached);
    }

    const result = await solve(def, inputs);
    const body = JSON.stringify(result);
    cache.set(key, body).catch(()=>{});
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.type('application/json').send(body);
  } catch (e) {
    const status = Number.isInteger(e.status) ? e.status : 500;
    const out = { error: e.message || 'Internal Server Error' };
    if (e.body && status >= 400 && status < 500) out.details = e.body.slice(0,500);
    return res.status(status).json(out);
  }
}

module.exports = router;
