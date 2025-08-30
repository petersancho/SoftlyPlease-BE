const express = require('express')
const router = express.Router()
const { solve: computeSolve } = require('../services/compute')
const {performance} = require('perf_hooks')

const NodeCache = require('node-cache')
const DEFAULT_TTL = Number(process.env.CACHE_TTL_SECS || '60')
const cache = new NodeCache({ stdTTL: DEFAULT_TTL, checkperiod: Math.max(1, Math.floor(DEFAULT_TTL/5)) })

const memjs = require('memjs')
let mc = null

let definition = null

// In case you have a local memached server
// process.env.MEMCACHIER_SERVERS = '127.0.0.1:11211'
if(process.env.MEMCACHIER_SERVERS !== undefined) {
  mc = memjs.Client.create(process.env.MEMCACHIER_SERVERS, {
    username: process.env.MEMCACHIER_USERNAME,
    password: process.env.MEMCACHIER_PASSWORD,
    failover: true,
    timeout: 1,
    keepAlive: true,
    tls: true
  })
}

function stableInputs(inputs){
  const out = {}
  Object.keys(inputs || {}).sort().forEach(k => { out[k] = inputs[k] })
  return out
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
  definition = req.app.get('definitions').find(o => o.name === definitionName)
  if(!definition)
    throw new Error('Definition not found on server.')

  //replace definition data with object that includes definition hash
  res.locals.params.definition = definition

  next()

}

/**
 * Check cache
 * This middleware function checks if a cache value exist for a cache key
 */

function checkCache (req, res, next){

  const key = {}
  key.definition = { 'name': res.locals.params.definition.name, 'id': res.locals.params.definition.id }
  const rawInputs = res.locals.params.values!==undefined ? res.locals.params.values : res.locals.params.inputs
  key.inputs = stableInputs(rawInputs)
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
        if(err == null && val) {
          res.locals.cacheResult = val.toString()
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
      // Solve using compute with a hashed definition URL pointer for robustness
      const defObj = res.locals.params.definition
      const definitionName = defObj.name || defObj
      const inputs = res.locals.params.inputs || {}

      // Build absolute pointer URL that Compute will fetch directly
      const fullUrl = req.protocol + '://' + req.get('host')
      const defUrl = `${fullUrl}/definition/${defObj.id || defObj}`

      // Add debug logging in development
      if(process.env.NODE_ENV !== 'production') {
        console.log('Solving definition:', definitionName, 'with inputs:', inputs)
      }

      const result = await computeSolve(definitionName, inputs, defUrl)

      // Cache the result
      const resultString = JSON.stringify(result)
      if(mc !== null) {
        // set memcached with TTL
        const ttl = Number(process.env.MEMCACHE_TTL_SECS || process.env.CACHE_TTL_SECS || '60')
        mc.set(res.locals.cacheKey, resultString, {expires: ttl}, function(err){
          if(err) console.log('Memcached set error:', err)
        })
      } else {
        // set node-cache (uses stdTTL)
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
