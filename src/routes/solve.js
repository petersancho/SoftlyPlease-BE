const express = require('express');
const router = express.Router();
router.use(express.json({ limit: '2mb' }));

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

    // For now, return a placeholder response
    // TODO: Implement actual Rhino Compute integration
    return res.json({
      message: 'Solve endpoint ready - configure COMPUTE_URL to enable Grasshopper solving',
      definition: def,
      inputs: inputs,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[solve] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

router.post('/', solveHandler);
router.post('/:definition', solveHandler);

module.exports = router;
