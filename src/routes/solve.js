const express = require('express');
const router = express.Router();
const computeService = require('../services/compute');

// Canonical: POST /solve/ with body { definition: "Name.gh|.ghx", inputs: {...} }
async function solveHandler(req, res, next) {
  try {
    const { definition, inputs } = req.body || {};
    if (!definition) {
      return res.status(400).json({ error: 'Missing "definition"' });
    }
    const result = await computeService.solve(definition, inputs || {});
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
