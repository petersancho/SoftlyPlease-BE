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
    const defName = String(req.body?.definition || 'Hyperboloid.ghx')
    const raw = Object.assign({}, req.body?.inputs || {})
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

    // Build DataTrees
    const trees = []
    for (const [key, value] of Object.entries(inputs)){
      const t = new compute.Grasshopper.DataTree(key)
      t.append([0], [value])
      trees.push(t)
    }
    // Evaluate using pointer URL to definition on this server (avoid bytes API mismatch)
    const defObj = req.app.get('definitions').find(o => o.name === defName)
    if (!defObj) return res.status(400).json({ error: 'Definition not found on server.' })
    const fullUrl = req.protocol + '://' + req.get('host')
    const defUrl = `${fullUrl}/definition/${defObj.id}`
    const response = await compute.Grasshopper.evaluateDefinition(defUrl, trees, false)
    const text = await response.text()
    if (!response.ok){
      return res.status(500).json({ error: text || (response.status + ' ' + response.statusText) })
    }
    const result = JSON.parse(text)
    return res.status(200).json(result)
  } catch (error){
    const detail = (error && error.message) ? String(error.message) : 'Internal Server Error'
    res.status(500).json({ error: detail })
  }
})

module.exports = router

