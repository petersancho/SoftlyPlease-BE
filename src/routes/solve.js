const express = require('express');
const router = express.Router();
router.use(express.json({ limit: '2mb' }));

const { solveWithCompute } = require('../lib/computeClient');

function normalizeDefinition(d) {
  if (!d) return null;
  const clean = String(d).replace(/\//g, '').split('/').pop();
  return /\.(gh|ghx)$/i.test(clean) ? clean : `${clean}.gh`;
}

async function solveHandler(req, res, next) {
  try {
    const def = normalizeDefinition((req.body && req.body.definition) || req.params.definition);
    const inputs = (req.body && req.body.inputs) || {};
    if (!def) return res.status(400).json({ error: 'Missing "definition"' });

    // Use the new compute client
    const result = await solveWithCompute(def, inputs);
    return res.json(result);
  } catch (err) {
    const status =
      err.status ||
      err.statusCode ||
      (err.response && err.response.status) ||
      500;

    // Forward 4xx errors from Compute as-is
    if (status >= 400 && status < 500) {
      return res.status(status).json({ error: err.message || 'Bad Request' });
    }

    // Log 5xx errors but don't expose internal details
    console.error('[solve] Compute error:', err);
    return next(err);
  }
}

router.post('/', solveHandler);
router.post('/:definition', solveHandler);

module.exports = router;
