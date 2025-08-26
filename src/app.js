const createError = require('http-errors')
const express = require('express')
const compression = require('compression')
const logger = require('morgan')
const cors = require('cors')

// Load McNeel AppServer configuration
const config = require('../config')

// create express web server app
const app = express()

// log requests to the terminal when running in a local debug setup
if(config.server.env !== 'production')
  app.use(logger('dev'))

app.use(express.json({limit: '10mb'}))
app.use(express.urlencoded({ extended: false }))

// Configure CORS with McNeel standards
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials
}))

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
// McNeel Rhino Compute AppServer Configuration
// Set RHINO_COMPUTE_URL to point to your Rhino Compute server
// For local development: http://localhost:6500/
// For VM deployment: http://your-vm-ip:6500/
if (!process.env.RHINO_COMPUTE_URL)
  process.env.RHINO_COMPUTE_URL = config.rhino.url

if (!process.env.RHINO_COMPUTE_APIKEY)
  process.env.RHINO_COMPUTE_APIKEY = config.rhino.apiKey

console.log('=== McNeel Rhino Compute AppServer Configuration ===')
console.log('RHINO_COMPUTE_URL:', process.env.RHINO_COMPUTE_URL)
console.log('RHINO_COMPUTE_APIKEY:', process.env.RHINO_COMPUTE_APIKEY ? '***configured***' : 'not set')
console.log('Server Port:', config.server.port)
console.log('Environment:', config.server.env)
console.log('===================================================')

app.set('view engine', 'hbs')
app.set('views', './src/views')

// Register Handlebars helpers
const hbs = require('hbs')
hbs.registerHelper('replace', function(str, oldStr, newStr) {
  return str.replace(oldStr, newStr)
})

// Routes for this app
app.use('/examples', express.static(__dirname + '/examples'))
app.use('/', express.static(__dirname + '/../frontend'))
app.get('/favicon.ico', (req, res) => res.status(200))
app.use('/definition', require('./routes/definition'))
app.use('/solve', require('./routes/solve'))
app.use('/view', require('./routes/template'))
app.use('/version', require('./routes/version'))
app.use('/', require('./routes/index'))

// ref: https://github.com/expressjs/express/issues/3589
// remove line when express@^4.17
express.static.mime.types['wasm'] = 'application/wasm'

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
  const data = { message: err.message }
  if (req.app.get('env') === 'development')
  {
    data.stack = err.stack
  }
  // send the error
  res.status(err.status || 500).send(data)
})

module.exports = app
