'use strict';
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  // Simple status endpoint that doesn't depend on external services
  return res.json({
    ok: true,
    compute: 'unknown',
    message: 'Status endpoint available - configure COMPUTE_URL for full functionality',
    time: new Date().toISOString(),
  });
});

module.exports = router;