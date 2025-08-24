const express = require('express')
const router = express.Router()
const compute = require('compute-rhino3d')
const {performance} = require('perf_hooks')
const crypto = require('crypto')

// Enhanced caching with TTL management
const NodeCache = require('node-cache')
const cache = new NodeCache({
  stdTTL: 3600,        // Default TTL: 1 hour
  checkperiod: 300,    // Check for expired keys every 5 minutes
  maxKeys: 10000,      // Maximum number of keys
  useClones: false,    // Don't clone objects for better performance
  deleteOnExpire: true,
  errorOnMissing: false
})

// Memcached configuration with connection pooling
const memjs = require('memjs')
let mc = null

// Enhanced Memcached configuration for production
if(process.env.MEMCACHIER_SERVERS !== undefined) {
  mc = memjs.Client.create(process.env.MEMCACHIER_SERVERS, {
    failover: true,        // Enable automatic failover
    timeout: 2,            // Increased timeout for complex computations
    keepAlive: true,       // Keep connections alive
    retries: 3,            // Retry failed operations
    retry_delay: 0.2,      // Delay between retries
    max_connections: 10,   // Connection pool size
    min_connections: 2     // Minimum connections to maintain
  })

  console.log('🚀 Memcached connected:', process.env.MEMCACHIER_SERVERS)
}

// Request queue for managing concurrent computations
class RequestQueue {
  constructor(maxConcurrent = 5) {
    this.queue = []
    this.processing = new Set()
    this.maxConcurrent = maxConcurrent
  }

  async add(requestId, fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ requestId, fn, resolve, reject })
      this.process()
    })
  }

  async process() {
    if (this.processing.size >= this.maxConcurrent || this.queue.length === 0) {
      return
    }

    const item = this.queue.shift()
    this.processing.add(item.requestId)

    try {
      const result = await item.fn()
      item.resolve(result)
    } catch (error) {
      item.reject(error)
    } finally {
      this.processing.delete(item.requestId)
      // Process next item
      setImmediate(() => this.process())
    }
  }

  getStats() {
    return {
      queueLength: this.queue.length,
      processingCount: this.processing.size,
      maxConcurrent: this.maxConcurrent
    }
  }
}

const requestQueue = new RequestQueue(
  process.env.MAX_CONCURRENT_COMPUTATIONS || 5
)

let definition = null

function computeParams (req, res, next){
  compute.url = process.env.RHINO_COMPUTE_URL
  compute.apiKey = process.env.RHINO_COMPUTE_KEY
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
 * Enhanced cache checking with performance optimizations
 * This middleware function checks if a cache value exists for a cache key
 */

function checkCache (req, res, next){
  const timeStart = performance.now()

  // Generate optimized cache key
  const keyData = {
    definition: res.locals.params.definition.name,
    id: res.locals.params.definition.id,
    inputs: res.locals.params.inputs,
    values: res.locals.params.values
  }

  // Use faster hash-based key generation
  const keyString = JSON.stringify(keyData)
  const cacheKey = crypto.createHash('md5').update(keyString).digest('hex')

  res.locals.cacheKey = cacheKey
  res.locals.cacheResult = null

  if(mc === null){
    // Enhanced node-cache with TTL management
    try {
      const result = cache.get(cacheKey)
      if (result !== undefined) {
        res.locals.cacheResult = result

        // Update cache statistics
        if (!res.locals.cacheStats) res.locals.cacheStats = {}
        res.locals.cacheStats.cacheHit = true
        res.locals.cacheStats.cacheTime = performance.now() - timeStart

        console.log(`✅ Cache hit for ${res.locals.params.definition.name}: ${Math.round(res.locals.cacheStats.cacheTime)}ms`)
      } else {
        console.log(`❌ Cache miss for ${res.locals.params.definition.name}`)
      }
      next()
    } catch (error) {
      console.error('Node-cache error:', error.message)
      next()
    }
  } else {
    // Enhanced memcached with error handling
    if(mc !== null) {
      mc.get(cacheKey, function(err, val) {
        if(err === null && val !== null) {
          res.locals.cacheResult = val

          // Update cache statistics
          if (!res.locals.cacheStats) res.locals.cacheStats = {}
          res.locals.cacheStats.cacheHit = true
          res.locals.cacheStats.cacheTime = performance.now() - timeStart

          console.log(`✅ Memcached hit for ${res.locals.params.definition.name}: ${Math.round(res.locals.cacheStats.cacheTime)}ms`)
        } else if (err) {
          console.error('Memcached error:', err.message)
        } else {
          console.log(`❌ Memcached miss for ${res.locals.params.definition.name}`)
        }
        next()
      })
    } else {
      next()
    }
  }
}

/**
 * Enhanced solve function with request queuing and performance optimizations
 * This is the core "workhorse" function for the appserver with advanced performance features
 */

async function commonSolve (req, res, next){
  const timePostStart = performance.now()

  // Set performance headers
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('X-Powered-By', 'SoftlyPlease-Compute/2.0')

  // Handle cache hits immediately
  if(res.locals.cacheResult !== null) {
    const timespanPost = Math.round(performance.now() - timePostStart)
    res.setHeader('Server-Timing', `cacheHit;dur=${timespanPost}`)
    res.setHeader('X-Cache', 'HIT')

    // Parse and validate cached result
    try {
      const result = typeof res.locals.cacheResult === 'string'
        ? JSON.parse(res.locals.cacheResult)
        : res.locals.cacheResult

      console.log(`🚀 Cache hit for ${res.locals.params.definition.name} in ${timespanPost}ms`)
      return res.json(result)
    } catch (error) {
      console.error('Cache result parsing error:', error.message)
      // Continue to computation if cache is corrupted
    }
  }

  // Generate unique request ID for queuing
  const requestId = crypto.randomUUID()
  res.setHeader('X-Request-ID', requestId)

  console.log(`🔄 Queueing computation for ${res.locals.params.definition.name} (ID: ${requestId})`)

  // Queue the computation
  requestQueue.add(requestId, async () => {
    return performComputation(req, res, timePostStart, requestId)
  }).then(result => {
    // Result already sent in performComputation
  }).catch(error => {
    console.error(`❌ Computation failed for ${requestId}:`, error.message)
    next(error)
  })
}

async function performComputation(req, res, timePostStart, requestId) {
  const computationStart = performance.now()

  try {
    // Enhanced parameter building with validation
    const trees = buildParameterTrees(res.locals.params)
    if (trees.length === 0) {
      throw new Error('No valid parameters provided')
    }

    // Build definition URL with validation
    const fullUrl = `${req.protocol}://${req.get('host')}`
    const definitionPath = `${fullUrl}/definition/${res.locals.params.definition.id}`

    console.log(`🔧 Starting computation for ${res.locals.params.definition.name} (ID: ${requestId})`)

    // Call internal Rhino Compute endpoint
    const computeStart = performance.now()

    // Convert DataTree objects to simple format for our endpoint
    const simplifiedInputs = {}
    trees.forEach((tree, index) => {
      const paramName = Object.keys(res.locals.params.inputs)[index] || `input_${index}`
      simplifiedInputs[paramName] = tree.data || tree
    })

    const response = await fetch(`${req.protocol}://${req.get('host')}/grasshopper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        definition: res.locals.params.definition.name,
        inputs: simplifiedInputs
      })
    })

    if(!response.ok) {
      throw new Error(`Rhino Compute error: ${response.status} ${response.statusText}`)
    }

    const result = await response.text()
    const computeEnd = performance.now()

    // Parse and validate result
    const parsedResult = JSON.parse(result)
    if (parsedResult.pointer) {
      delete parsedResult.pointer // Remove internal pointer
    }

    // Cache the result with intelligent TTL
    const cacheTTL = determineCacheTTL(res.locals.params.definition.name, trees)
    await cacheResult(res.locals.cacheKey, parsedResult, cacheTTL)

    // Calculate performance metrics
    const totalTime = Math.round(performance.now() - timePostStart)
    const computeTime = Math.round(computeEnd - computeStart)
    const setupTime = Math.round(computeStart - computationStart)

    // Set performance headers
    res.setHeader('Server-Timing', `setup;dur=${setupTime}, compute;dur=${computeTime}, total;dur=${totalTime}`)
    res.setHeader('X-Cache', 'MISS')
    res.setHeader('X-Compute-Time', `${computeTime}ms`)

    console.log(`✅ Computation complete for ${res.locals.params.definition.name} in ${totalTime}ms (compute: ${computeTime}ms)`)

    // Send result
    res.json(parsedResult)

  } catch (error) {
    console.error(`❌ Computation error for ${requestId}:`, error.message)

    // Enhanced error response
    const errorResponse = {
      error: {
        message: error.message,
        type: error.constructor.name,
        requestId: requestId,
        definition: res.locals.params.definition.name
      },
      timestamp: new Date().toISOString()
    }

    res.status(500).json(errorResponse)
  }
}

function buildParameterTrees(params) {
  const trees = []

  // Build DataTrees from inputs
  if(params.inputs !== undefined) {
    for (let [key, value] of Object.entries(params.inputs)) {
      if (!Array.isArray(value)) {
        console.warn(`Parameter ${key} is not an array, wrapping:`, value)
        value = [value]
      }

      if (value.length > 0) {
        let param = new compute.Grasshopper.DataTree(key)
        param.append([0], value)
        trees.push(param)
      }
    }
  }

  // Build DataTrees from values (legacy support)
  if(params.values !== undefined && Array.isArray(params.values)) {
    for (let index = 0; index < params.values.length; index++) {
      let param = new compute.Grasshopper.DataTree(`value_${index}`)
      param.append([0], [params.values[index]])
      trees.push(param)
    }
  }

  return trees
}

function determineCacheTTL(definitionName, trees) {
  // Base TTL
  let ttl = 3600 // 1 hour

  // Adjust based on definition type
  if (definitionName.includes('TopoOpt')) {
    ttl = 7200 // 2 hours for topology optimization
  } else if (definitionName.includes('Analysis')) {
    ttl = 1800 // 30 minutes for analysis
  }

  // Adjust based on parameter complexity
  const parameterCount = trees.length
  if (parameterCount > 10) {
    ttl *= 2 // Longer cache for complex parameter sets
  }

  return ttl
}

async function cacheResult(cacheKey, result, ttl = 3600) {
  const cacheValue = JSON.stringify(result)

  try {
    if(mc !== null) {
      // Memcached with enhanced error handling
      await new Promise((resolve, reject) => {
        mc.set(cacheKey, cacheValue, { expires: ttl }, (err, val) => {
          if (err) {
            console.error('Memcached set error:', err.message)
            reject(err)
          } else {
            resolve(val)
          }
        })
      })
      console.log(`💾 Cached result in Memcached with TTL: ${ttl}s`)
    } else {
      // Node-cache
      cache.set(cacheKey, cacheValue, ttl)
      console.log(`💾 Cached result in Node-cache with TTL: ${ttl}s`)
    }
  } catch (error) {
    console.error('Caching error:', error.message)
    // Continue without caching - don't fail the request
  }
}

// Collect middleware functions into a pipeline
const pipeline = [computeParams, collectParams, checkCache, commonSolve]

// Handle different http methods
router.head('/:definition',pipeline) // do we need HEAD?
router.get('/:definition', pipeline)
router.post('/', pipeline)

module.exports = router
