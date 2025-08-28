const createError = require('http-errors')
const express = require('express')
const compression = require('compression')
const logger = require('morgan')
const cors = require('cors')
const path = require('path')

// create express web server app
const app = express()
app.set('trust proxy', true)

// Serve static files from public directory
app.use(express.static(path.join(process.cwd(), 'public')))

// Serve examples, files, and my-examples
app.use('/examples', express.static(path.join(process.cwd(), 'examples')))
app.use('/files', require('./middleware/static-files'))
app.use('/files', express.static(path.join(process.cwd(), 'files')))
app.use('/vendor', express.static(path.join(process.cwd(), 'public', 'vendor')))
app.use('/my-examples', express.static(path.join(process.cwd(), 'my-examples')))

// log requests to the terminal when running in a local debug setup
if(process.env.NODE_ENV !== 'production')
  app.use(logger('dev'))

app.use(express.json({limit: '10mb'}))
app.use(express.urlencoded({ extended: false }))
app.use(cors())
app.use(compression())

// Define URL for our compute server
// - For local debugging on the same computer, rhino.compute.exe is
//   typically running at http://localhost:6001/
// - For a production environment it is good to use an environment variable
//   named COMPUTE_URL to define where the compute server is located
// - And just in case, you can pass an address as a command line arg

const argIndex = process.argv.indexOf('--computeUrl')
if (argIndex > -1)
  process.env.COMPUTE_URL = process.argv[argIndex + 1]
if (!process.env.COMPUTE_URL)
  process.env.COMPUTE_URL = 'http://localhost:6001/' // default if nothing else exists

console.log('COMPUTE_URL: ' + process.env.COMPUTE_URL)

app.set('view engine', 'hbs');
app.set('views', './src/views')

// Routes for this app
app.get('/favicon.ico', (req, res) => res.status(200))
app.use('/definition', require('./routes/definition'))
app.use('/solve', require('./routes/solve'))
app.use('/status', require('./routes/status'))
app.use('/status/definitions', require('./routes/status-defs'))
app.use('/view', require('./routes/template'))
app.use('/version', require('./routes/version'))
app.use('/', require('./routes/index'))



// ref: https://github.com/expressjs/express/issues/3589
// remove line when express@^4.17
express.static.mime.types["wasm"] = "application/wasm";

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404))
})

// error handler
app.use(function(err, req, res, next) {
  // Log server errors to stderr
  console.error('[error]', err);

  // Always respond with JSON
  const errorResponse = { error: err.message || 'Internal Server Error' };
  if (req.app.get('env') === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(err.status || 500).json(errorResponse);
})

module.exports = app
