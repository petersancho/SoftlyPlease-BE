const express = require('express');
const router = express.Router();

// Client-side error logging endpoint
router.post('/', express.json(), (req, res) => {
  const logData = req.body;

  // Add server-side metadata
  const enrichedLog = {
    ...logData,
    server: {
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      url: req.originalUrl
    }
  };

  // Log to console with special prefix for easy filtering
  console.log('[CLIENT-LOG]', JSON.stringify(enrichedLog));

  // Return success response
  res.sendStatus(204);
});

// Optional: GET endpoint to check if logging is working
router.get('/', (req, res) => {
  res.json({
    status: 'Client logging endpoint is active',
    timestamp: new Date().toISOString(),
    instructions: 'POST JSON data to this endpoint to log client-side events'
  });
});

module.exports = router;
