<<<<<<< HEAD
const express = require('express')
const router = express.Router()
const { solve: computeSolve } = require('../services/compute')
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
      //solve using the new compute service
      const definitionName = res.locals.params.definition.name || res.locals.params.definition
      const inputs = res.locals.params.inputs || {}

      // Add debug logging in development
      if(process.env.NODE_ENV !== 'production') {
        console.log('Solving definition:', definitionName, 'with inputs:', inputs)
      }

      const result = await computeSolve(definitionName, inputs)

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
=======
const express = require('express');
const router = express.Router();
router.use(express.json({ limit: '2mb' }));

function normalizeDefinition(d) {
  if (!d) return null;
  const clean = String(d).replace(/\//g, '').split('/').pop();
  return /\.(gh|ghx)$/i.test(clean) ? clean : `${clean}.gh`;
}

async function solveHandler(req, res, next) {
  try {
    const def = normalizeDefinition((req.body && req.body.definition) || req.params.definition);
    const inputs = (req.body && req.body.inputs) || {};
    if (!def) return res.status(400).json({ error: 'Missing "definition"' });

    // For now, return a placeholder response
    // TODO: Implement actual Rhino Compute integration
    return res.json({
      message: 'Solve endpoint ready - configure COMPUTE_URL to enable Grasshopper solving',
      definition: def,
      inputs: inputs,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[solve] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

router.post('/', solveHandler);
router.post('/:definition', solveHandler);

module.exports = router;
>>>>>>> c41033c05d4751a82a5fe6faa753e5cfe35f0d1d
