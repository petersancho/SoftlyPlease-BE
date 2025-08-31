const express = require('express')
const router = express.Router()
const { solve: computeSolve } = require('../services/compute')
const {performance} = require('perf_hooks')
const crypto = require('crypto')
let rhinoModulePromise = null
function getRhino(){
  if (!rhinoModulePromise){
    try{
      const rhino3dm = require('rhino3dm')
      rhinoModulePromise = rhino3dm()
    }catch(err){
      console.error('Failed to load rhino3dm in Node:', err)
      rhinoModulePromise = Promise.resolve(null)
    }
  }
  return rhinoModulePromise
}

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
    // Replace large geometry payloads with hashes for cache key stability
    if (k === 'RH_IN:brep' || k === 'RH_in:Brep' || k === 'RH_IN:mesh' || k === 'RH_IN:brep_3dm'){
      try{
        const s = typeof v === 'string' ? v : JSON.stringify(v)
        const hash = crypto.createHash('md5').update(s).digest('hex')
        let tag = 'geomHash'
        if (k.endsWith(':brep')) tag = 'brepHash'
        if (k.endsWith(':mesh')) tag = 'meshHash'
        if (k.endsWith(':brep_3dm')) tag = 'brep3dmHash'
        out[tag] = hash
        return
      } catch {}
    }
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

  // detect uploaded brep presence and force skip cache (memcached truncates large JSON > 1MB)
  try{
    const inputs = res.locals.params.inputs || {}
    const hasUpload = !!(inputs['RH_IN:brep'] || inputs['RH_in:Brep'] || inputs['RH_IN:brep_3dm'])
    res.locals.hasUploadBrep = hasUpload
    if (hasUpload) res.locals.skipCache = true
  }catch{ res.locals.hasUploadBrep = false }

  let definitionName = res.locals.params.definition
  if (definitionName===undefined)
    definitionName = res.locals.params.pointer
  definition = req.app.get('definitions').find(o => o.name === definitionName)
  if(!definition)
    throw new Error('Definition not found on server.')

  // Force .gh when overriding Brep to align with updated file
  try{
    const hasUpload = res.locals.params && res.locals.params.inputs && (res.locals.params.inputs['RH_IN:brep'] || res.locals.params.inputs['RH_IN:brep_3dm'])
    if (hasUpload){
      if (definition.name.endsWith('.ghx')){
        const alt = req.app.get('definitions').find(o => o.name === definition.name.replace(/\.ghx$/i, '.gh'))
        if (alt){ definition = alt }
      }
    }
  }catch{}

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
    res.setHeader('X-Cache-Backend', 'node-cache')
    const result = cache.get(res.locals.cacheKey)
    res.locals.cacheResult = result !== undefined ? result : null
    next()
  } else {
    // use memcached
    //console.log('using memcached')
    res.setHeader('X-Cache-Backend', 'memcachier')
    if(mc !== null) {
      mc.get(res.locals.cacheKey, function(err, val) {
        if(err == null && val) {
          const text = val.toString()
          // validate JSON; if truncated/invalid, ignore cache
          try { JSON.parse(text); res.locals.cacheResult = text } catch { res.locals.cacheResult = null }
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
      const inputs = Object.assign({}, res.locals.params.inputs || {})

      // If client sent a raw .3dm base64 for the Brep, parse and encode on server
      if ((inputs['RH_IN:brep_3dm'] && !inputs['RH_IN:brep'] && !inputs['RH_in:Brep'])){
        try{
          const rhino = await getRhino()
          if (rhino){
            const base64 = inputs['RH_IN:brep_3dm']
            const bytes = Buffer.from(base64, 'base64')
            const doc = rhino.File3dm.fromByteArray(new Uint8Array(bytes))
            if (doc){
              let brep = null
              let mesh = null
              const tryCollect = (geo)=>{
                if (!geo) return false
                const type = geo.objectType
                if (!brep && type === rhino.ObjectType.Brep){
                  try{ if (geo.isSolid && geo.isSolid()) { brep = geo; return true } }catch{}
                  brep = geo; return true
                }
                if (!brep && type === rhino.ObjectType.Extrusion && geo.toBrep){
                  const b = geo.toBrep(true); if (b){ brep = b; return true }
                }
                if (!brep && type === rhino.ObjectType.Surface){
                  try{ const b = rhino.Brep.createFromSurface(geo); if (b){ brep = b; return true } }catch{}
                }
                if (!brep && type === rhino.ObjectType.SubD && geo.toBrep){
                  const b = geo.toBrep(true); if (b){ brep = b; return true }
                }
                if (!mesh && type === rhino.ObjectType.Mesh){ mesh = geo; return true }
                return false
              }
              const objects = doc.objects()
              for (let i=0; i<objects.count; i++){
                const obj = objects.get(i)
                const geo = obj.geometry()
                if (!geo) continue
                if (tryCollect(geo)) continue
                try{
                  if (geo.objectType === rhino.ObjectType.InstanceReference){
                    const idef = doc.getInstanceDefinitionGeometry(geo.parentIdefId)
                    if (idef){
                      for (let j=0; j<idef.count; j++){
                        const idefObj = idef.get(j)
                        if (idefObj && tryCollect(idefObj.geometry())) break
                      }
                    }
                  }
                }catch{}
              }
              if (!brep && mesh && rhino.Brep && typeof rhino.Brep.createFromMesh === 'function'){
                try{ brep = rhino.Brep.createFromMesh(mesh, true) || rhino.Brep.createFromMesh(mesh, false) }catch{}
              }
              if (brep){
                try{
                  const encoded = rhino.CommonObject && typeof rhino.CommonObject.encode === 'function'
                    ? rhino.CommonObject.encode(brep)
                    : (typeof brep.encode === 'function' ? brep.encode() : null)
                  if (encoded){
                    inputs['RH_IN:brep'] = encoded
                    delete inputs['RH_IN:brep_3dm']
                  }
                }catch(err){ console.error('Server encode Brep failed', err) }
              }
            }
          }
        }catch(err){
          console.error('Failed to parse RH_IN:brep_3dm', err)
        } finally {
          // Always remove the raw 3dm payload before compute call
          delete inputs['RH_IN:brep_3dm']
        }
      }

      // If client sent a RhinoJSON-encoded Brep, normalize by decoding and re-encoding with server rhino3dm (v7)
      if ((inputs['RH_IN:brep'] || inputs['RH_in:Brep'])){
        const keyName = inputs['RH_IN:brep'] ? 'RH_IN:brep' : 'RH_in:Brep'
        if (typeof inputs[keyName] === 'object' && inputs[keyName].type && inputs[keyName].data !== undefined){
        try{
          const rhino = await getRhino()
          if (rhino && rhino.CommonObject && typeof rhino.CommonObject.decode === 'function'){
            const decoded = rhino.CommonObject.decode(inputs[keyName])
            if (decoded){
              const reencoded = rhino.CommonObject.encode(decoded)
              if (reencoded && reencoded.type && reencoded.data !== undefined){
                inputs[keyName] = reencoded
              }
            }
          }
        }catch(err){ console.error('Server re-encode Brep failed', err) }
        }
      }

      // Normalize client-provided Brep payloads
      if (typeof inputs['RH_IN:brep'] === 'string'){
        inputs['RH_IN:brep'] = { type: 'Rhino.Geometry.Brep', data: inputs['RH_IN:brep'] }
      }
      if (inputs['RH_IN:brep'] && typeof inputs['RH_IN:brep'] === 'object' && inputs['RH_IN:brep'].data !== undefined && !inputs['RH_IN:brep'].type){
        inputs['RH_IN:brep'].type = 'Rhino.Geometry.Brep'
      }
      if (typeof inputs['RH_in:Brep'] === 'string'){
        inputs['RH_in:Brep'] = { type: 'Rhino.Geometry.Brep', data: inputs['RH_in:Brep'] }
      }
      if (inputs['RH_in:Brep'] && typeof inputs['RH_in:Brep'] === 'object' && inputs['RH_in:Brep'].data !== undefined && !inputs['RH_in:Brep'].type){
        inputs['RH_in:Brep'].type = 'Rhino.Geometry.Brep'
      }

      // Build absolute pointer URL that Compute will fetch directly
      const fullUrl = req.protocol + '://' + req.get('host')
      const defUrl = `${fullUrl}/definition/${defObj.id || defObj}`

      // Validate Brep payload shape (pre-flight)
      const brepKey = inputs['RH_IN:brep'] ? 'RH_IN:brep' : (inputs['RH_in:Brep'] ? 'RH_in:Brep' : null)
      if (brepKey){
        const b = inputs[brepKey]
        const type = b && b.type
        const data = b && b.data
        if (!(type && /Brep/i.test(String(type)) && typeof data === 'string' && data.length > 0)){
          const brepLen = (typeof data === 'string') ? data.length : -1
          return res.status(400).send({
            message: 'Invalid RH_IN:brep payload',
            details: { type, dataType: typeof data, dataLen: brepLen }
          })
        }
        // Strong validation: decode and ensure closed Brep
        try{
          const rhino = await getRhino()
          if (rhino && rhino.CommonObject && typeof rhino.CommonObject.decode === 'function'){
            const decoded = rhino.CommonObject.decode(b)
            if (!decoded || decoded.objectType !== rhino.ObjectType.Brep){
              return res.status(400).send({ message:'RH_IN:brep must be a Brep' })
            }
            try{
              const valid = (typeof decoded.isValid === 'function') ? decoded.isValid() : true
              const solid = (typeof decoded.isSolid === 'function') ? decoded.isSolid() : true
              if (!valid || !solid){
                return res.status(400).send({ message:'Brep must be valid and closed (solid)', details: { valid, solid } })
              }
            }catch{}
          }
        }catch{}
      }

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
    const msg = (error && error.message) ? String(error.message) : 'Internal Server Error'
    try{
      const defObj = res.locals && res.locals.params && res.locals.params.definition
      const definitionName = defObj && (defObj.name || defObj)
      const inputs = (res.locals && res.locals.params && res.locals.params.inputs) || {}
      const brep = inputs['RH_IN:brep']
      const info = {
        definition: definitionName,
        inputKeys: Object.keys(inputs||{}),
        brepType: brep && brep.type,
        brepDataLen: brep && typeof brep.data === 'string' ? brep.data.length : undefined
      }
      return res.status(500).send({ message: msg, info })
    }catch{
      return res.status(500).send({ message: msg })
    }
  }
}

// Collect middleware functions into a pipeline
const pipeline = [collectParams, checkCache, commonSolve]

// Handle different http methods
router.head('/:definition',pipeline) // do we need HEAD?
router.get('/:definition', pipeline)
router.post('/', pipeline)

module.exports = router
