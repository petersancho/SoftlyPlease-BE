const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const compute = require('compute-rhino3d')

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
    const response = await compute.Grasshopper.evaluateDefinition(defUrl, trees, false)
    const text = await response.text()
    // Treat Compute success as success even if status misreported; detect by JSON shape
    try{
      const parsed = JSON.parse(text)
      if (parsed && Array.isArray(parsed.values)){
        try{
          // Post-process: mesh Configurator Brep via Compute and attach as RH_OUT:ConfiguratorMesh
          const cfg = parsed.values.find(v => v.ParamName === 'RH_OUT:Configurator')
          if (cfg && cfg.InnerTree){
            // Find first item in first available branch
            const branches = Object.keys(cfg.InnerTree)
            if (branches.length){
              const items = cfg.InnerTree[branches[0]] || []
              const first = items[0]
              if (first && first.data){
                let brepJson = null
                try{ brepJson = JSON.parse(first.data) }catch{}
                if (brepJson){
                  try{
                    // Prefer qualityRenderMesh, then default
                    const mp = (compute.MeshingParameters && typeof compute.MeshingParameters.qualityRenderMesh === 'function')
                      ? compute.MeshingParameters.qualityRenderMesh()
                      : (typeof compute.MeshingParameters?.default === 'function' ? compute.MeshingParameters.default() : null)
                    if (compute.Mesh && typeof compute.Mesh.createFromBrep === 'function' && mp){
                      let meshes = await compute.Mesh.createFromBrep(brepJson, mp)
                      if (!Array.isArray(meshes) || meshes.length === 0){
                        try{
                          const mpFast = typeof compute.MeshingParameters.fastRenderMesh === 'function' ? compute.MeshingParameters.fastRenderMesh() : null
                          if (mpFast) meshes = await compute.Mesh.createFromBrep(brepJson, mpFast)
                        }catch{}
                      }
                      if (!Array.isArray(meshes) || meshes.length === 0){
                        try{
                          const mpDef = typeof compute.MeshingParameters.default === 'function' ? compute.MeshingParameters.default() : null
                          if (mpDef) meshes = await compute.Mesh.createFromBrep(brepJson, mpDef)
                        }catch{}
                      }
                      try{ console.log('[solve-hyperboloid] Configurator meshed: submeshes=' + (Array.isArray(meshes)? meshes.length : 0)) }catch{}
                      if (Array.isArray(meshes) && meshes.length){
                        const entry = {
                          ParamName: 'RH_OUT:ConfiguratorMesh',
                          InnerTree: {
                            '{0}': meshes.map(m => ({ type: 'Rhino.Geometry.Mesh', data: JSON.stringify(m) }))
                          }
                        }
                        parsed.values.push(entry)
                      }
                    }
                  }catch(e){ console.warn('[solve-hyperboloid] meshing failed:', e?.message||String(e)) }
                }
              }
            }
          }
        }catch(e){ console.warn('[solve-hyperboloid] post-process error:', e?.message||String(e)) }
        return res.status(200).json(parsed)
      }
    }catch{}
    if (!response.ok){
      return res.status(500).json({ error: text || (response.status + ' ' + response.statusText) })
    }
    // Fallback: forward text
    return res.status(200).send(text)
  } catch (error){
    const detail = (error && error.message) ? String(error.message) : 'Internal Server Error'
    res.status(500).json({ error: detail })
  }
})

module.exports = router

