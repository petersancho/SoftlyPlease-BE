const express = require('express')
const router = express.Router()
const { solve: computeSolve } = require('../services/compute')
const {performance} = require('perf_hooks')

const NodeCache = require('node-cache')
const DEFAULT_TTL = Number(process.env.CACHE_TTL_SECS || '60')
const cache = new NodeCache({ stdTTL: DEFAULT_TTL, checkperiod: Math.max(1, Math.floor(DEFAULT_TTL/5)) })

const memjs = require('memjs')
let mc = null
const inflight = new Map()

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

function sanitizeDefName(name){
  return String(name || '').toUpperCase().replace(/[^A-Z0-9]+/g, '_')
}

function getPerDefEnv(prefix, defName){
  const key = `${prefix}_${sanitizeDefName(defName)}`
  return process.env[key]
}

function parseExcludeList(defName){
  const v = getPerDefEnv('CACHE_EXCLUDE', defName) || process.env.CACHE_EXCLUDE || ''
  return v.split(',').map(s=>s.trim()).filter(Boolean)
}

function parseRounding(defName){
  let map = {}
  const raw = getPerDefEnv('CACHE_ROUND', defName) || process.env.CACHE_ROUND || ''
  if (raw){
    try { map = JSON.parse(raw) } catch {}
  }
  const defDecimals = Number(process.env.CACHE_ROUND_DEFAULT_DECIMALS || '3')
  return { map, defDecimals }
}

function stableInputs(inputs, defName){
  const excluded = new Set(parseExcludeList(defName))
  const { map: roundMap, defDecimals } = parseRounding(defName)
  const out = {}
  Object.keys(inputs || {}).sort().forEach(k => {
    if (excluded.has(k)) return
    let v = inputs[k]
    if (typeof v === 'number' && isFinite(v)){
      const decimals = typeof roundMap[k] === 'number' ? roundMap[k] : defDecimals
      const factor = Math.pow(10, Math.max(0, decimals))
      v = Math.round(v * factor) / factor
    }
    out[k] = v
  })
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

  // allow clients to bypass cache for testing or freshness
  const p = res.locals.params
  const nocacheTop = p && (p.nocache === 1 || p.nocache === '1' || p.nocache === true || p.nocache === 'true')
  const nocacheInput = p && p.inputs && (p.inputs.nocache === 1 || p.inputs.nocache === '1' || p.inputs.nocache === true || p.inputs.nocache === 'true')
  res.locals.skipCache = !!(nocacheTop || nocacheInput)

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
  key.inputs = stableInputs(rawInputs, res.locals.params.definition.name)
  res.locals.cacheKey = JSON.stringify(key)
  res.locals.cacheResult = null

  if (res.locals.skipCache) {
    return next()
  }

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

      // inflight coalescing
      const existing = inflight.get(res.locals.cacheKey)
      if (existing){
        const result = await existing
        const resultString = JSON.stringify(result)
        const timespanPost = Math.round(performance.now() - timePostStart)
        res.setHeader('Server-Timing', `solveInflight;dur=${timespanPost}`)
        return res.send(resultString)
      }

      const promise = (async ()=>{
        const r = await computeSolve(definitionName, inputs, defUrl)
        return r
      })()
      inflight.set(res.locals.cacheKey, promise)

      let result
      try {
        result = await promise
      } finally {
        inflight.delete(res.locals.cacheKey)
      }

      // Cache the result (unless bypassed)
      const resultString = JSON.stringify(result)
      if (!res.locals.skipCache) {
        if(mc !== null) {
          // set memcached with TTL
          const defTTL = getPerDefEnv('MEMCACHE_TTL_SECS', definitionName) || getPerDefEnv('CACHE_TTL_SECS', definitionName)
          const ttl = Number(defTTL || process.env.MEMCACHE_TTL_SECS || process.env.CACHE_TTL_SECS || DEFAULT_TTL)
          mc.set(res.locals.cacheKey, resultString, {expires: ttl}, function(err){
            if(err) console.log('Memcached set error:', err)
          })
        } else {
          // set node-cache (uses per-set TTL)
          const defTTL = getPerDefEnv('CACHE_TTL_SECS', definitionName)
          const ttl = Number(defTTL || DEFAULT_TTL)
          cache.set(res.locals.cacheKey, resultString, ttl)
        }
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
