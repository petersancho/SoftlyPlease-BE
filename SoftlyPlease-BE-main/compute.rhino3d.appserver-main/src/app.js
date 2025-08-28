const createError = require('http-errors')
const express = require('express')
const compression = require('compression')
const logger = require('morgan')
const cors = require('cors')

// create express web server app
const app = express()

// Add startup logging to help debug
console.log('🚀 Starting Rhino Compute AppServer...')
console.log('📁 Current working directory:', process.cwd())
console.log('🌍 Environment:', process.env.NODE_ENV || 'development')

// log requests to the terminal when running in a local debug setup
if(process.env.NODE_ENV !== 'production')
  app.use(logger('dev'))

app.use(express.json({limit: '10mb'}))
app.use(express.urlencoded({ extended: false }))
app.use(cors())
app.use(compression())

// Define URL for our compute server
// - For local debugging on the same computer, rhino.compute.exe is
//   typically running at http://localhost:5000/ (compute.geometry.exe) or http://localhost:6500/ (rhino.compute.exe)
// - For a production environment it is good to use an environment variable
//   named RHINO_COMPUTE_URL to define where the compute server is located
// - And just in case, you can pass an address as a command line arg

const argIndex = process.argv.indexOf('--computeUrl')
if (argIndex > -1)
  process.env.RHINO_COMPUTE_URL = process.argv[argIndex + 1]
if (!process.env.RHINO_COMPUTE_URL)
  process.env.RHINO_COMPUTE_URL = 'http://localhost:6500/' // default if nothing else exists

console.log('RHINO_COMPUTE_URL: ' + process.env.RHINO_COMPUTE_URL)

app.set('view engine', 'hbs');
app.set('views', __dirname + '/views')

// Routes for this app
app.use('/examples', express.static(__dirname + '/examples'))
app.use('/rhino3dm', express.static(__dirname + '/../public/rhino3dm'))
app.get('/favicon.ico', (req, res) => res.status(200))
app.use('/definition', require('./routes/definition'))
app.use('/solve', require('./routes/solve'))
app.use('/view', require('./routes/template'))
app.use('/version', require('./routes/version'))
app.use('/mcneel-examples', require('./routes/mcneel-examples'))

// Add health endpoint for basic service health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Rhino Compute AppServer',
    timestamp: new Date().toISOString(),
    version: require('../package.json').version,
    environment: process.env.NODE_ENV || 'development'
  })
})

// Add status endpoint to test compute server connectivity
app.get('/status', async (req, res) => {
  const config = require('../config/config')
  const compute = require('compute-rhino3d')

  try {
    compute.url = config.rhino.url
    if (!compute.url.endsWith('/')) {
      compute.url += '/'
    }
    compute.apiKey = config.rhino.apiKey

    console.log('Testing compute server connectivity...')
    console.log('Compute URL:', compute.url)
    console.log('API Key set:', !!compute.apiKey)

    // Try to get version info from compute server
    const response = await compute.computeFetch('version', {}, false)

    if (response.ok) {
      const version = await response.text()
      res.json({
        status: 'CONNECTED',
        message: 'Rhino Compute Server is reachable',
        version: version,
        url: compute.url,
        timestamp: new Date().toISOString()
      })
    } else {
      res.status(503).json({
        status: 'ERROR',
        message: `Compute server responded with status ${response.status}`,
        url: compute.url,
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('Compute server connectivity test failed:', error)
    res.status(503).json({
      status: 'ERROR',
      message: error.message,
      code: error.code,
      url: config.rhino.url,
      timestamp: new Date().toISOString()
    })
  }
})
app.use('/my-examples', require('./routes/my-examples'))
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
