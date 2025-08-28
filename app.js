const express = require('express');
const path = require('path');
const createError = require('http-errors');
const compression = require('compression');
const logger = require('morgan');
const cors = require('cors');

const app = express();
app.set('trust proxy', true);

// Core middleware
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));

// API routes (must come before static files to avoid SPA fallback interference)
// Status routes must come BEFORE solve routes to avoid /solve/status conflicts
app.use('/status', require('./src/routes/status'));
// app.use('/status/definitions', require('./src/routes/status-defs'))  // Temporarily disabled
app.use('/solve', require('./src/routes/solve'));

// Static: public/
app.use(express.static(path.join(process.cwd(), 'public'), { index: 'index.html', extensions: ['html'] }));

// Static: examples/, vendor/, my-examples/
app.use('/examples', express.static(path.join(process.cwd(), 'examples')));

// Static: files/ with header tweaks for .gh/.ghx
app.use('/files', require('./src/middleware/static-files'));
app.use('/files', express.static(path.join(process.cwd(), 'files')));

app.use('/vendor', express.static(path.join(process.cwd(), 'public', 'vendor')));
app.use('/my-examples', express.static(path.join(process.cwd(), 'my-examples')));

// Helpful boot log (no secrets)
console.log('[boot]', {
  compute: process.env.COMPUTE_URL || '(unset)',
  origin: process.env.PUBLIC_APP_ORIGIN || 'https://www.softlyplease.com',
  files: path.join(process.cwd(), 'files')
});

// SPA fallback - catch-all handler: serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// Error middleware (JSON)
app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Export for Heroku (don't start server manually)
module.exports = app;
