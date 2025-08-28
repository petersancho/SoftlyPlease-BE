const express = require('express')
const router = express.Router()
const { solve: computeSolve } = require('../services/compute')
const { resolveDefinition } = require('../services/definition-resolver')
const {performance} = require('perf_hooks')

const NodeCache = require('node-cache')
const cache = new NodeCache()

const memjs = require('memjs')
let mc = null

let definition = null

// In case you have a local memached server
// process.env.MEMCACHIER_SERVERS = '127.0.0.1:11211'
if(process.env.MEMCACHIER_SERVERS !== undefined) {
  mc = memjs.Client.create(process.env.MEMCACHIER_SERVERS, {
    failover: true,  // default: false
    timeout: 1,      // default: 0.5 (seconds)
    keepAlive: true  // default: false
  })
}

// Compute parameters are now handled in the compute service

/**
 * Collect request parameters
 * This middleware function stores request parameters in the same manner no matter the request method
 */

function collectParams (req, res, next){
  res.locals.params = {}
  switch (req.method){
  case 'HEAD':
  case 'GET':
    res.locals.params.definition = req.params.definition
    res.locals.params.inputs = req.query
    break
  case 'POST':
    res.locals.params = req.body
    break
  default:
    next()
    break
  }

  let definitionName = res.locals.params.definition
  if (definitionName===undefined)
    definitionName = res.locals.params.pointer

  // Resolve definition using the definition resolver service
  const resolved = resolveDefinition(definitionName)
  if (!resolved) {
    throw new Error('Definition not found on server.')
  }

  // Build absolute URL for the definition from request headers
  const protocol = req.protocol
  const host = req.get('host')
  const definitionUrl = `${protocol}://${host}/files/${encodeURIComponent(resolved.rel)}`

  // Set the resolved definition data
  res.locals.params.definition = {
    name: resolved.rel,
    path: resolved.abs,
    url: definitionUrl
  }

  next()

}

/**
 * Check cache
 * This middleware function checks if a cache value exist for a cache key
 */

function checkCache (req, res, next){

  const key = {}
  key.definition = { 'name': res.locals.params.definition, 'id': 'temp' }
  key.inputs = res.locals.params.inputs
  if (res.locals.params.values!==undefined)
    key.inputs = res.locals.params.values
  res.locals.cacheKey = JSON.stringify(key)
  res.locals.cacheResult = null

  if(mc === null){
    // use node cache
    //console.log('using node-cache')
    const result = cache.get(res.locals.cacheKey)
    res.locals.cacheResult = result !== undefined ? result : null
    next()
  } else {
    // use memcached
    //console.log('using memcached')
    if(mc !== null) {
      mc.get(res.locals.cacheKey, function(err, val) {
        if(err == null) {
          res.locals.cacheResult = val
        }
        next()
      })
    }
  }
}

/**
 * Solve GH definition
 * This is the core "workhorse" function for the appserver. Client apps post
 * json data to the appserver at this endpoint and that json is passed on to
 * compute for solving with Grasshopper.
 */

async function commonSolve (req, res, next){
  const timePostStart = performance.now()

  // set general headers
  // what is the proper max-age, 31536000 = 1 year, 86400 = 1 day
  res.setHeader('Cache-Control', 'public, max-age=31536000')
  res.setHeader('Content-Type', 'application/json')

  try {
    if(res.locals.cacheResult !== null) {
      //send cached result
      const timespanPost = Math.round(performance.now() - timePostStart)
      res.setHeader('Server-Timing', `cacheHit;dur=${timespanPost}`)
      res.send(res.locals.cacheResult)
      return
    } else {
      // Call the compute service with the proper definition URL
      const definition = res.locals.params.definition
      const inputs = res.locals.params.inputs || {}

      // Add debug logging in development
      if(process.env.NODE_ENV !== 'production') {
        console.log('Solving definition:', definition.name, 'with inputs:', inputs, 'URL:', definition.url)
      }

      // Call compute service with definition name and URL
      const result = await computeSolve(definition.name, inputs, definition.url)

      // Cache the result
      const resultString = JSON.stringify(result)
      if(mc !== null) {
        //set memcached
        mc.set(res.locals.cacheKey, resultString, {expires:0}, function(err, val){
          if(err) console.log('Memcached set error:', err)
        })
      } else {
        //set node-cache
        cache.set(res.locals.cacheKey, resultString)
      }

      const timespanPost = Math.round(performance.now() - timePostStart)
      res.setHeader('Server-Timing', `solve;dur=${timespanPost}`)

      res.send(resultString)
    }
  } catch (error) {
    console.error('Solve error:', error)
    next(error)
  }
}

// Collect middleware functions into a pipeline
const pipeline = [collectParams, checkCache, commonSolve]

// Handle different http methods
router.head('/:definition',pipeline) // do we need HEAD?
router.get('/:definition', pipeline)
router.post('/', pipeline)

module.exports = router
