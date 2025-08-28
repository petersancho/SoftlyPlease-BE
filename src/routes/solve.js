const express = require('express');
const router = express.Router();
const computeService = require('../services/compute');
const { resolveDefinition } = require('../services/definition-resolver');

// Canonical: POST /solve/ with body { definition: "Name.gh|.ghx", inputs: {...} }
async function solveHandler(req, res, next) {
  try {
    const { definition, inputs } = req.body || {};
    if (!definition) {
      return res.status(400).json({ error: 'Missing "definition"' });
    }

    // Validate definition exists in /files
    const resolved = resolveDefinition(definition);
    if (!resolved) {
      return res.status(404).json({ error: `Definition not found in /files: ${definition}` });
    }

    // Use the definition hash to construct proper URL for Rhino Compute
    const PUBLIC_BASE = (process.env.PUBLIC_APP_ORIGIN || 'https://www.softlyplease.com').replace(/\/+$/,'');
    const defUrl = `${PUBLIC_BASE}/definition/${resolved.id}`;

    const result = await computeService.solve(resolved.rel, inputs || {}, defUrl);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// Compatibility shim: POST /solve/:definition accepts { inputs } and coerces :definition to .gh if extension absent
router.post('/:definition', (req, res, next) => {
  const base = req.params.definition || '';
  const def = base.endsWith('.gh') || base.endsWith('.ghx') ? base : `${base}.gh`;
  req.body = { definition: def, inputs: (req.body && req.body.inputs) || {} };
  return solveHandler(req, res, next);
});

// Main solve endpoint
router.post('/', solveHandler);

module.exports = router;
