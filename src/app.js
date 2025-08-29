const createError = require('http-errors')
const express = require('express')
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

// Load normalized config and announce boot info
const { COMPUTE_URL, PUBLIC_APP_ORIGIN } = require('./config')

// Backward-compat: keep RHINO_COMPUTE_URL env if present but prefer COMPUTE_URL
if (!process.env.RHINO_COMPUTE_URL && COMPUTE_URL) process.env.RHINO_COMPUTE_URL = COMPUTE_URL

console.log('[boot]', { compute: process.env.RHINO_COMPUTE_URL || '(unset)', origin: PUBLIC_APP_ORIGIN })

// Routes for this app
app.use('/examples', express.static(path.join(process.cwd(), 'examples')))
app.use('/files', require('./middleware/static-files'))
app.use('/files', express.static(path.join(process.cwd(), 'files')))
app.get('/favicon.ico', (req, res) => res.status(200))
app.use('/status', require('./routes/status'))
app.use('/solve', require('./routes/solve'))
app.use('/definition', require('./routes/definition'))
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
})

module.exports = app
