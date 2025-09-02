const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const compute = require('compute-rhino3d')
const crypto = require('crypto')
const NodeCache = require('node-cache')
const memjs = require('memjs')

// Cache backends (node-cache + memcached)
const DEFAULT_TTL = Number(process.env.CACHE_TTL_SECS || '60')
const nodeCache = new NodeCache({ stdTTL: DEFAULT_TTL, checkperiod: Math.max(1, Math.floor(DEFAULT_TTL/5)) })
let mc = null
if(process.env.MEMCACHIER_SERVERS !== undefined) {
  mc = memjs.Client.create(process.env.MEMCACHIER_SERVERS, {
    username: process.env.MEMCACHIER_USERNAME,
    password: process.env.MEMCACHIER_PASSWORD,
  })
}
const inflight = new Map()

function parseExcludeList(defName){
  const raw = process.env.CACHE_EXCLUDE_KEYS
  if (!raw) return []
  const map = {}
  try{ Object.assign(map, JSON.parse(raw)) }catch{}
  const key = defName && map[defName]
  return Array.isArray(key) ? key : (Array.isArray(map['*']) ? map['*'] : [])
}
function parseRounding(defName){
  let map = {}
  const raw = process.env.CACHE_ROUNDING
  if (raw){ try { map = JSON.parse(raw) } catch {} }
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
    if (k === 'RH_IN:brep' || k === 'RH_in:Brep' || k === 'RH_IN:mesh' || k === 'RH_IN:brep_3dm'){
      try{ const s = typeof v === 'string' ? v : JSON.stringify(v); const hash = crypto.createHash('md5').update(s).digest('hex'); let tag = 'geomHash'; if (k.endsWith(':brep')) tag = 'brepHash'; if (k.endsWith(':mesh')) tag = 'meshHash'; if (k.endsWith(':brep_3dm')) tag = 'brep3dmHash'; out[tag] = hash; return }catch{}
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

// Cache GHX bytes in-memory
let hyperboloidBytes = null
function getHyperboloidBytesLocal(){
  if (hyperboloidBytes) return hyperboloidBytes
  const p = path.resolve(process.cwd(), 'files', 'Hyperboloid.ghx')
  const xml = fs.readFileSync(p, 'utf8')
  hyperboloidBytes = new Uint8Array(Buffer.from(xml, 'utf8')).buffer
  return hyperboloidBytes
}

router.post('/', async (req, res) => {
  try{
    const defNameRaw = req.body?.definition
    try { console.log('[solve-hyperboloid] def typeof:', typeof defNameRaw, ' body:', JSON.stringify(req.body).slice(0,100)) } catch {}
    const defName = 'Hyperboloid.ghx' // ignore provided definition operationally
    const raw = Object.assign({}, req.body?.inputs || {})
    if (raw && typeof raw !== 'object'){
      return res.status(400).json({ error: 'inputs must be an object of RH_IN:* -> number' })
    }
    // Strict whitelist, coerce and clamp
    const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))
    const toNum = (v) => (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v))
      ? (v.includes('.') ? Number.parseFloat(v) : Number.parseInt(v, 10))
      : Number(v)
    const inputs = {}
    const pushDouble = (k, lo, hi) => { if (raw[k] !== undefined) inputs[k] = clamp(toNum(raw[k]), lo, hi) }
    const pushInt = (k, lo, hi) => { if (raw[k] !== undefined) inputs[k] = Math.round(clamp(toNum(raw[k]), lo, hi)) }
    pushDouble('RH_IN:move_a', -20, 20)
    pushDouble('RH_IN:move_b', -20, 20)
    pushDouble('RH_IN:elipse_x', 0.1, 50)
    pushDouble('RH_IN:elipse_y', 0.1, 50)
    pushDouble('RH_IN:twist_configurator_rings', -360, 360)
    pushDouble('RH_IN:configurator_height', 1, 200)
    pushDouble('RH_IN:move_cone_a', -20, 20)
    pushDouble('RH_IN:move_cone_b', -20, 20)
    pushDouble('RH_IN:move_cone_c', -20, 20)
    pushDouble('RH_IN:move_cone_d', -20, 20)
    // alias support
    if (raw['RH_IN:array'] !== undefined && raw['RH_IN:array_panels'] === undefined) raw['RH_IN:array_panels'] = raw['RH_IN:array']
    pushInt('RH_IN:array_panels', 1, 200)

    // Init compute client
    compute.url = process.env.COMPUTE_URL || process.env.RHINO_COMPUTE_URL
    compute.apiKey = process.env.COMPUTE_KEY || process.env.RHINO_COMPUTE_KEY
    try{ console.log('[solve-hyperboloid] compute.url:', compute.url, ' apiKeyPresent:', !!compute.apiKey) }catch{}

    // Build DataTrees
    const trees = []
    for (const [key, value] of Object.entries(inputs)){
      const t = new compute.Grasshopper.DataTree(key)
      t.append([0], [value])
      trees.push(t)
    }
    // Evaluate using server pointer URL (string) to satisfy compute API signature
    const defObj = req.app.get('definitions').find(o => o.name === defName)
    if (!defObj) return res.status(400).json({ error: 'Definition not found on server.' })
    const fullUrl = req.protocol + '://' + req.get('host')
    const defUrl = `${fullUrl}/definition/${defObj.id}`
    try{ console.log('[solve-hyperboloid] defUrl:', defUrl) }catch{}

    // ---- Cache check and coalescing ----
    const defNameForKey = defObj.name
    const cacheKeyObj = { definition:{ name:defNameForKey, id:defObj.id }, inputs: stableInputs(inputs, defNameForKey) }
    const cacheKey = JSON.stringify(cacheKeyObj)
    res.setHeader('X-Cache-Backend', mc ? 'memcachier' : 'node-cache')
    const nocache = (req.query?.nocache==='1' || req.body?.nocache===true)
    if (!nocache){
      if (mc){
        try{
          const cached = await new Promise(resolve => mc.get(cacheKey, (err,val)=> resolve(err==null && val ? val.toString() : null)))
          if (cached){ res.setHeader('X-Cache-Status','HIT'); return res.status(200).send(cached) }
        }catch{}
      } else {
        const cached = nodeCache.get(cacheKey)
        if (cached !== undefined){ res.setHeader('X-Cache-Status','HIT'); return res.status(200).send(cached) }
      }
    }

    if (inflight.has(cacheKey)){
      try{ const cachedText = await inflight.get(cacheKey); res.setHeader('X-Cache-Status','HIT-INF'); return res.status(200).send(cachedText) }catch(e){ return res.status(500).json({ error: e?.message||'Compute error' }) }
    }

    const promise = (async ()=>{
      const response = await compute.Grasshopper.evaluateDefinition(defUrl, trees, false)
      const text = await response.text()
      return text
    })()
    inflight.set(cacheKey, promise)
    let text
    try{ text = await promise } finally { inflight.delete(cacheKey) }
    // Treat Compute success as success even if status misreported; detect by JSON shape
    try{
      const parsed = JSON.parse(text)
      if (parsed && Array.isArray(parsed.values)){
        try{
          // Helper to mesh a Brep JSON and append as Mesh output
          async function meshAndAppend(brepJson, outName){
            const mpPrimary = (compute.MeshingParameters && typeof compute.MeshingParameters.qualityRenderMesh === 'function')
              ? compute.MeshingParameters.qualityRenderMesh()
              : (typeof compute.MeshingParameters?.default === 'function' ? compute.MeshingParameters.default() : null)
            if (!mpPrimary || !(compute.Mesh && typeof compute.Mesh.createFromBrep === 'function')) return
            let meshes = await compute.Mesh.createFromBrep(brepJson, mpPrimary)
            if (!Array.isArray(meshes) || meshes.length === 0){
              try{ const mpFast = typeof compute.MeshingParameters.fastRenderMesh === 'function' ? compute.MeshingParameters.fastRenderMesh() : null; if (mpFast) meshes = await compute.Mesh.createFromBrep(brepJson, mpFast) }catch{}
            }
            if (!Array.isArray(meshes) || meshes.length === 0){
              try{ const mpDef = typeof compute.MeshingParameters.default === 'function' ? compute.MeshingParameters.default() : null; if (mpDef) meshes = await compute.Mesh.createFromBrep(brepJson, mpDef) }catch{}
            }
            if (Array.isArray(meshes) && meshes.length){
              parsed.values.push({ ParamName: outName, InnerTree: { '{0}': meshes.map(m => ({ type: 'Rhino.Geometry.Mesh', data: JSON.stringify(m) })) } })
            }
          }
          // Mesh Configurator: all items across all branches
          const cfg = parsed.values.find(v => v.ParamName === 'RH_OUT:Configurator')
          if (cfg && cfg.InnerTree){
            const branches = Object.keys(cfg.InnerTree)
            for (const br of branches){
              const items = cfg.InnerTree[br] || []
              for (const it of items){ try{ await meshAndAppend(JSON.parse(it.data), 'RH_OUT:ConfiguratorMesh') }catch{} }
            }
          }
          // Mesh Positive
          const pos = parsed.values.find(v => v.ParamName === 'RH_OUT:positive')
          if (pos && pos.InnerTree){
            const branches = Object.keys(pos.InnerTree)
            for (const b of branches){
              const items = pos.InnerTree[b] || []
              for (const it of items){ try{ const j = JSON.parse(it.data); await meshAndAppend(j, 'RH_OUT:positiveMesh') }catch{} }
            }
          }
          // Mesh Panels
          const pans = parsed.values.find(v => v.ParamName === 'RH_OUT:panels')
          if (pans && pans.InnerTree){
            const branches = Object.keys(pans.InnerTree)
            for (const b of branches){
              const items = pans.InnerTree[b] || []
              for (const it of items){ try{ const j = JSON.parse(it.data); await meshAndAppend(j, 'RH_OUT:panelsMesh') }catch{} }
            }
          }
        }catch(e){ console.warn('[solve-hyperboloid] post-process error:', e?.message||String(e)) }
        const body = JSON.stringify(parsed)
        if (!nocache){
          if (mc){ try{ const ttl = Number(process.env.MEMCACHE_TTL_SECS || process.env.CACHE_TTL_SECS || DEFAULT_TTL); await new Promise(resolve => mc.set(cacheKey, body, { expires: ttl }, ()=> resolve())) }catch{} }
          else { nodeCache.set(cacheKey, body, Number(process.env.CACHE_TTL_SECS || DEFAULT_TTL)) }
        }
        res.setHeader('X-Cache-Set', '1')
        return res.status(200).send(body)
      }
    }catch{}
    if (!response.ok){
      return res.status(500).json({ error: text || (response.status + ' ' + response.statusText) })
    }
    // Fallback: forward text (also cache raw if possible)
    if (!nocache){
      if (mc){ try{ const ttl = Number(process.env.MEMCACHE_TTL_SECS || process.env.CACHE_TTL_SECS || DEFAULT_TTL); await new Promise(resolve => mc.set(cacheKey, text, { expires: ttl }, ()=> resolve())) }catch{} }
      else { nodeCache.set(cacheKey, text, Number(process.env.CACHE_TTL_SECS || DEFAULT_TTL)) }
    }
    res.setHeader('X-Cache-Set', '1')
    return res.status(200).send(text)
  } catch (error){
    const detail = (error && error.message) ? String(error.message) : 'Internal Server Error'
    res.status(500).json({ error: detail })
  }
})

module.exports = router

