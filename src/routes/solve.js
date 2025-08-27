const express = require('express')
const router = express.Router()
const compute = require('compute-rhino3d')
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

function computeParams (req, res, next){
  compute.url = process.env.RHINO_COMPUTE_URL || 'http://4.248.252.92:80/'
  // Try RHINO_COMPUTE_KEY first (user preference), then fall back to APIKEY
  compute.authToken = process.env.RHINO_COMPUTE_KEY || process.env.RHINO_COMPUTE_APIKEY || 'eyJSYXdPcGVuSWRUb2tlbiI6ICJleUpoYkdjaU9pSlNVekkxTmlJc0ltdHBaQ0k2SWpFaUxDSjBlWAFpT2lKS1YxUWlmUS5leUp6ZFdJaU9pSTFPVEV3TWpreE9EUTJOVEk1TURJMElpd2laVzFoYVd3aU9pSndaWFJsY21wellXNWphRzlBWjIxaGFXd3VZMjl0SWl3aVpXMWhhV3dmZG1WeWFXWnBaV1FpT25SeWRXVXNJbU52YlM1eWFHbHViek5rTG1GalkyOTFiblJ6TG1WdFlXbHNjeUk2V3lKd1pYUmxjbXB6WVc1amFHOUFaMjFoYVd3dVkyOXRJbDBzSW01aGJXVWlPaUpRWlhSbGNpQlhhVzVuYnlJc0lteHZZMkZzWlNJNkltVnVMV05oSWl3aWNHbGpkSFZ5WlNJNkltaDBkSEJ6T2k4dmQzZDNMbWR5WVhaaGRHRnlMbU52YlM5aGRtRjBZWEl2Tmpaall6bGtaVEkxT1RFNU9EZzNOakZpWm1JMll6VmtaV05qWkdFNE9HSV9aRDF5WlhSeWJ5SXNJbU52YlM1eWFHbHViek5rTG1GalkyOTFiblJ6TG0xbGJXSmxjbDluY205MWNITWlPbHQ3SW1sa0lqb2lOakExTlRFd09UUXlNREV5TWpFeE1pSXNJbTVoYldVaU9pSk5Ra1ZNWVdJaUxDSmtiMjFoYVc1eklqcGJYWDFkTENKamIyMHVjbWhwYm04elpDNWhZMk52ZFc1MGN5NWhaRzFwYmw5bmNtOTFjSE1pT2x0ZExDSmpiMjB1Y21ocGJtOHpaQzVoWTJOdmRXNTBjeTV2ZDI1bGNsOW5jbTkxY0hNaU9sdDdJbWxrSWpvaU5EYzRPVFF4TlRrek56Z3pOVEF3T0NJc0ltNWhiV1VpT2lKRGIyMXdkWFJsSUhSbFlXMGlMQ0prYjIxaGFXNXpJanBiWFgxZExDSmpiMjB1Y21ocGJtOHpaQzVoWTJOdmRXNTBjeTV6YVdRaU9pSnJVWEYxSzNaV2JuUXlhbTl0U1hkMWFVWTFSM2hTVURaVE1ITTVkVVJxWkU4dlUxZEJORU0zTDNkelBTSXNJbWx6Y3lJNkltaDBkSEJ6T2k4dllXTmpiM1Z1ZEhNdWNtaHBibTh6WkM1amIyMGlMQ0poZFdRaU9pSmpiRzkxWkY5NmIyOWZZMnhwWlc1MElpd2laWGh3SWpvek16TXhNRFE0TURVMExDSnBZWFFpT2pFM05UUXlORGd3TlRVc0ltRjFkR2hmZEdsdFpTSTZNVGMxTkRJME1qRXpOU3dpYm05dVkyVWlPaUphZWs4elR6bE5OM0k1V1ZKVFFWUnFPRzE0UWxkcFlrNXNlblJyZEVoamRIWlFSRTVoY2pocFUxcEllWGxwUzBaSE5sSllWalY0UjA1NWFWWjBhRk5sSWl3aVlYUmZhR0Z6YUNJNkltSjFjVzlMT1Y5bFR6ZG5aVEpPWDJaZmVteEdkV2M5UFNKOS5DN0hxcVp6MDhQYkRMSEdBVHJvcmhvVEVud2lfQ0ZIYmdrYUoxSXFIVkQ2b3hGU2dMLUZWUjlGNHJkQmFiU3VMU2p2b0IwOW56Zgo3TlE0U29jSVlGNjJheDhkQjZSRTNaTW1NclhyZ1J5SUlTUlh6dmlqdE5oN3BWU1ZwMnVLdUFoZEFJZFJpekpMRHducTRZWHE1MlcwZmdjVHVicWlOSDE5X3RhbU9CVkVKa1hKZTBKWDU0X09KWWdFN1FIbXotQllSU0ZESWlLLWljRkJKbVAzeFFsMzBNeFduZ0pOWk5mazBWOWJTMDFqaU9lNUNRVGNndHM5M1V4UlRwRGNJQXg1UklsNDlqdHN5cW5YUEJvR1NvRG13Rjg3Y1lsMDY3dnh1VW44a1ZPdkFPVEREbTlzb2ctZ3Y3elFoSEd1aTRhb0dQblB5LUFZaEhMWW1sQkxTeFEiLCAiUmF3T0F1dGgyVG9rZW4iOiAiZXlKaGJHY2lPaUpJVXpJMU5pSjkuZXlKaklqb3hMQ0p3SWpveExDSmlOalJwZGlJNkltSlNTV1IwVVVkMk4yZEdZVEpRWjJSVU5HVmpWM2M5UFNJc0ltSTJOR04wSWpvaVlYb3ZVRmRyWkc5NGJUWjJZMWh6YVRCYWEyYzRiVEV5WlZRMFZscHphbmRhYkN0bmNuTklPVXA1YmtkUE5VMTNWek41TlZNMVdIQnJiWE5NUWk5V1lsSXZkMWxwYTNKMldIQkdZMWR0ZFRkS1VXY3pLMlYyWkVkbFVWWmlXRFJpTkRkWVpFUlZWVkJwWXpnOUlpd2lhV0YwSWpveE56VTBNalE0TURVMWZRLjdBZmVzbGJRSXlxa0Y1VXhIampGUFpubjN4dWJqRHFDRF9Nb1VZWFZtaUUiLCAiU2NvcGUiOiBbImxpY2Vuc2VzIiwgInByb2ZpbGUiLCAiZ3JvdXBzIiwgImVtYWlsIiwgIm5vZXhwaXJlIiwgIm9wZW5pZCJdLCAiR3JvdXBJZCI6ICI0Nzg5NDE1OTM3ODM1MDA4In0='
  console.log('Compute config - URL:', compute.url, 'Auth Token length:', compute.authToken ? compute.authToken.length : 'null')
  console.log('Environment variables:')
  console.log('- RHINO_COMPUTE_KEY:', process.env.RHINO_COMPUTE_KEY ? 'SET (' + process.env.RHINO_COMPUTE_KEY.length + ' chars)' : 'NOT SET')
  console.log('- RHINO_COMPUTE_APIKEY:', process.env.RHINO_COMPUTE_APIKEY ? 'SET (' + process.env.RHINO_COMPUTE_APIKEY.length + ' chars)' : 'NOT SET')
  console.log('- Final authToken:', compute.authToken ? 'SET (' + compute.authToken.length + ' chars)' : 'NOT SET')
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

    let fullUrl = req.protocol + '://' + req.get('host')
    let definitionPath = `${fullUrl}/definition/${definition.id}`
    const timePreComputeServerCall = performance.now()

    // call compute server
    compute.Grasshopper.evaluateDefinition(definitionPath, trees, false).then( (response) => {

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
