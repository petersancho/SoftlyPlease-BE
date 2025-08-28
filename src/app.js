const createError = require('http-errors')
const express = require('express')
const compression = require('compression')
const logger = require('morgan')
const cors = require('cors')
const path = require('path')
const { paths, PUBLIC_APP_ORIGIN, COMPUTE_URL } = require('./config')

// create express web server app
const app = express()
app.set('trust proxy', true)

// Core middleware
app.disable('x-powered-by')
app.use(express.json({ limit: '2mb' }))

// --- Static mounts (serve site and assets) -------------------------------
// Serve homepage and assets at /
app.use(express.static(paths.public, { index: 'index.html', extensions: ['html'] }))

// Serve examples and GH files from repo root
app.use('/examples', express.static(paths.examples))
app.use('/files', require('./middleware/static-files'))
app.use('/files', express.static(paths.files))
app.use('/vendor', express.static(path.join(paths.public, 'vendor')))
app.use('/my-examples', express.static(path.join(process.cwd(), 'my-examples')))

// Helpful boot log (no secrets)
console.log('[boot]', { compute: COMPUTE_URL || '(unset)', origin: PUBLIC_APP_ORIGIN, files: paths.files })

// API routes
app.use('/solve', require('./routes/solve'))
app.use('/status', require('./routes/status'))
app.use('/status/definitions', require('./routes/status-defs'))

// --- SPA fallback (keep APIs intact) -------------------------------------
// Place this just before module.exports if you want unknown routes to load /index.html
app.get('*', (req, res, next) => {
  const p = req.path || '';
  if (p.startsWith('/solve') || p.startsWith('/status') || p.startsWith('/examples') || p.startsWith('/files') || p.startsWith('/definition') || p.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(paths.public, 'index.html'));
});

// Error middleware (JSON)
app.use((err, req, res, next) => {
  console.error('[error]', err)
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' })
})

module.exports = app
