'use strict';
const express = require('express');
const router = express.Router();
const { computeStatus } = require('../lib/computeClient');

router.get('/', async (req, res) => {
  try {
    const status = await computeStatus();
    return res.json({
      ok: true,
      compute: status.up ? 'up' : 'down',
      code: status.code,
      error: status.error,
      time: new Date().toISOString(),
    });
  } catch (error) {
    // Status endpoint should never fail - always return JSON
    return res.json({
      ok: true,
      compute: 'down',
      error: error.message,
      time: new Date().toISOString(),
    });
  }
});

module.exports = router;