const createError = require('http-errors')
const express = require('express')
<<<<<<< HEAD
const path = require('path')
const compression = require('compression')
const logger = require('morgan')
const cors = require('cors')

// create express web server app
const app = express()

// log requests to the terminal when running in a local debug setup
if(process.env.NODE_ENV !== 'production')
  app.use(logger('dev'))

app.use(express.json({limit: '10mb'}))
app.use(express.urlencoded({ extended: false }))
app.use(cors())
app.use(compression())

// Serve static files from public/ at root
app.use(express.static(path.join(process.cwd(), 'public'), { index: 'index.html', extensions: ['html'] }))

// Define URL for our compute server
// - For local debugging on the same computer, rhino.compute.exe is
//   typically running at http://localhost:5000/ (compute.geometry.exe) or http://localhost:6500/ (rhino.compute.exe)
// - For production environment, use RHINO_COMPUTE_URL environment variable

if (!process.env.RHINO_COMPUTE_URL) {
  process.env.RHINO_COMPUTE_URL = process.env.NODE_ENV === 'production'
    ? 'https://softlyplease.canadacentral.cloudapp.azure.com:443'
    : 'http://localhost:6500/'
}

console.log('RHINO_COMPUTE_URL: ' + process.env.RHINO_COMPUTE_URL)

app.set('view engine', 'hbs');
app.set('views', './src/views')

// Routes for this app
app.use('/examples', express.static(path.join(process.cwd(), 'examples')))
app.use('/files', express.static(path.join(process.cwd(), 'files')))
app.get('/favicon.ico', (req, res) => res.status(200))
app.use('/definition', require('./routes/definition'))
app.use('/solve', require('./routes/solve'))
app.use('/view', require('./routes/template'))
app.use('/version', require('./routes/version'))
app.use('/', require('./routes/index'))

// SPA fallback - serve index.html for unknown routes (except API routes)
app.get('*', (req, res, next) => {
  // Skip API routes and known static paths
  if (req.path.startsWith('/solve') ||
      req.path.startsWith('/status') ||
      req.path.startsWith('/examples') ||
      req.path.startsWith('/files') ||
      req.path.startsWith('/definition') ||
      req.path.startsWith('/api')) {
    return next()
  }
  // Serve index.html for all other routes
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'))
})

// ref: https://github.com/expressjs/express/issues/3589
// remove line when express@^4.17
express.static.mime.types["wasm"] = "application/wasm";

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404))
})

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  console.error(err)
  res.locals.error = req.app.get('env') === 'development' ? err : {}
  data = { message: err.message }
  if (req.app.get('env') === 'development')
  {
    data.stack = err.stack
  }
  // send the error
  res.status(err.status || 500).send(data)
=======
const compression = require('compression')
const logger = require('morgan')
const cors = require('cors')
const path = require('path')
const { paths, PUBLIC_APP_ORIGIN, COMPUTE_URL } = require('./config')

// create express web server app
const app = express()
app.set('trust proxy', true)

// Force rebuild marker: updated at 2024-01-28 18:45 UTC

// Core middleware
app.disable('x-powered-by')
app.use(express.json({ limit: '2mb' }))

// API routes (must come before static files to avoid SPA fallback interference)
// Status routes must come BEFORE solve routes to avoid /solve/status conflicts
app.use('/status', require('./routes/status'))
// app.use('/status/definitions', require('./routes/status-defs'))  // Temporarily disabled
app.use('/solve', require('./routes/solve'))

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

// --- SPA fallback ------------------------------------------------------
// Catch-all handler: serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(paths.public, 'index.html'));
});

// Error middleware (JSON)
app.use((err, req, res, next) => {
  console.error('[error]', err)
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' })
>>>>>>> c41033c05d4751a82a5fe6faa753e5cfe35f0d1d
})

module.exports = app
