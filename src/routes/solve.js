const express = require('express');
const router = express.Router();
router.use(express.json({ limit: '2mb' }));

const compute = require('../services/compute'); // must export solve(definition, inputs)

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

    const result = await compute.solve(def, inputs);
    return res.json(result);
  } catch (err) {
    const status =
      err.status ||
      err.statusCode ||
      (err.response && err.response.status) ||
      500;
    if (status >= 400 && status < 500) {
      return res.status(status).json({ error: err.message || 'Bad Request' });
    }
    return next(err);
  }
}

router.post('/', solveHandler);
router.post('/:definition', solveHandler);

module.exports = router;
