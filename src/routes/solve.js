const express = require('express')
const router = express.Router()
const compute = require('compute-rhino3d')
const {performance} = require('perf_hooks')
const config = require('../../config/config')

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

function computeParams (req, res, next){
  // Use configuration from config.js
  let baseUrl = config.rhino.url

  // Ensure URL ends with slash for proper concatenation
  if (!baseUrl.endsWith('/')) {
    baseUrl += '/'
  }

  compute.url = baseUrl
  const apiKey = config.rhino.apiKey

  // Set the API key and auth token
  compute.apiKey = apiKey
  compute.authToken = apiKey

  console.log('Compute config - URL:', compute.url)
  console.log('Using API Key from Heroku config vars')
  console.log('API Key length:', apiKey.length, 'chars')
  next()
}

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
    res.locals.params.definition = req.body.definition
    res.locals.params.inputs = req.body.inputs || {}
    break
  default:
    next()
    break
  }

  let definitionName = res.locals.params.definition
  if (definitionName===undefined)
    definitionName = res.locals.params.pointer

  definition = req.app.get('definitions').find(o => o.name === definitionName)
  if(!definition) {
    const error = new Error(`Definition '${definitionName}' not found on server.`)
    error.status = 404
    throw error
  }

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

function commonSolve (req, res, next){
  const timePostStart = performance.now()

  // set general headers
  res.setHeader('Cache-Control', 'public, max-age=31536000')
  res.setHeader('Content-Type', 'application/json')

  if(res.locals.cacheResult !== null) {
    const timespanPost = Math.round(performance.now() - timePostStart)
    res.setHeader('Server-Timing', `cacheHit;dur=${timespanPost}`)
    res.send(res.locals.cacheResult)
    return
  } else {
    //solve
    let trees = []
    if(res.locals.params.inputs !== undefined && Object.keys(res.locals.params.inputs).length > 0) {
      for (let [key, value] of Object.entries(res.locals.params.inputs)) {
        let param = new compute.Grasshopper.DataTree(key)
        param.append([0], Array.isArray(value) ? value : [value])
        trees.push(param)
      }
    }
    if(res.locals.params.values !== undefined) {
      for (let index=0; index<res.locals.params.values.length; index++) {
        let param = new compute.Grasshopper.DataTree('')
        param.data = res.locals.params.values[index]
        trees.push(param)
      }
    }

    // If no inputs provided, add a minimal default input to prevent compute errors
    if(trees.length === 0) {
      let param = new compute.Grasshopper.DataTree('default')
      param.append([0], [1])
      trees.push(param)
    }

    const timePreComputeServerCall = performance.now()

    // Load the definition file content directly instead of using URL
    const fs = require('fs')
    let definitionBuffer

    try {
      const definitionContent = fs.readFileSync(definition.path)
      definitionBuffer = new Uint8Array(definitionContent)
      console.log(`Loaded definition file: ${definition.name} (${definitionContent.length} bytes)`)
    } catch (error) {
      console.error('Error loading definition file:', error)
      throw new Error(`Failed to load definition file: ${definition.name}`)
    }

    // call compute server with definition content directly
    compute.Grasshopper.evaluateDefinition(definitionBuffer, trees).then( (response) => {

      if(!response.ok) {
        const errorMsg = `Compute server error: ${response.status} ${response.statusText}`
        console.error(errorMsg)
        throw new Error(errorMsg)
      }

      return response.text()

    }).then( (result) => {
      // Cache the result
      if(mc !== null) {
        mc.set(res.locals.cacheKey, result, {expires:0})
      } else {
        cache.set(res.locals.cacheKey, result)
      }

      const r = JSON.parse(result)
      delete r.pointer
      res.send(JSON.stringify(r))
    }).catch( (error) => {
      console.error('Solve error:', error)
      next(error)
    })
  }
}

// Collect middleware functions into a pipeline
const pipeline = [computeParams, collectParams, checkCache, commonSolve]

// Handle different http methods
router.head('/:definition',pipeline) // do we need HEAD?
router.get('/:definition', pipeline)
router.post('/', pipeline)

module.exports = router
