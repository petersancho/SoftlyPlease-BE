import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Rhino3dmLoader } from 'three/examples/jsm/loaders/3DMLoader'
import rhino3dm from 'rhino3dm'

const loader = new Rhino3dmLoader()
loader.setLibraryPath('https://cdn.jsdelivr.net/npm/rhino3dm@8.17.0/')

let rhino
await (rhino3dm().then(m=>{ rhino = m }))
try{ console.log('rhino3dm ready:', typeof rhino?.CommonObject?.decode === 'function') }catch{}

let currentSolveAbort = null

// RHINO3DM capability diagnostics
async function diagnoseRhino3dm(){
  try{
    console.log('=== RHINO3DM DIAGNOSTIC START ===')
    console.log('1. rhino object exists:', !!rhino)
    console.log('2. rhino.Mesh exists:', !!rhino?.Mesh)
    console.log('3. rhino.Mesh.createFromBrep exists:', typeof rhino?.Mesh?.createFromBrep)
    console.log('4. rhino.MeshingParameters exists:', !!rhino?.MeshingParameters)
    try{ console.log('5. Available MeshingParameters:', rhino?.MeshingParameters ? Object.keys(rhino.MeshingParameters) : 'NONE') }catch{ console.log('5. Available MeshingParameters: UNKNOWN') }
    console.log('6. rhino.CommonObject.decode exists:', typeof rhino?.CommonObject?.decode)
    console.log('=== RHINO3DM DIAGNOSTIC END ===')
  }catch{}
}
await diagnoseRhino3dm()

const viewers = [
  { canvas: document.getElementById('viewA'), filter: (name)=> /^(RH_OUT:Configurator|RH_OUT:points|RH_OUT:text_a|RH_OUT:text_b|RH_OUT:hyperboloid)$/i.test(name) },
  { canvas: document.getElementById('viewB'), filter: (name)=> /^RH_OUT:positive$/i.test(name) },
  { canvas: document.getElementById('viewC'), filter: (name)=> /^RH_OUT:panels$/i.test(name) },
]

const scenes = viewers.map(v=>{
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('white')
  const camera = new THREE.PerspectiveCamera(45, v.canvas.clientWidth/Math.max(1,v.canvas.clientHeight), 0.1, 5000)
  camera.position.set(10,-12,10)
  const renderer = new THREE.WebGLRenderer({ antialias:true, canvas: v.canvas })
  renderer.setPixelRatio(devicePixelRatio)
  renderer.setSize(v.canvas.clientWidth, v.canvas.clientHeight, false)
  const controls = new OrbitControls(camera, renderer.domElement)
  scene.add(new THREE.HemisphereLight(0xffffff,0x888888,0.9))
  const dl = new THREE.DirectionalLight(0xffffff,1.0); dl.position.set(5,5,10); scene.add(dl)
  return { scene, camera, renderer, controls, group: null }
})

function animate(){
  requestAnimationFrame(animate)
  for (const v of scenes){ v.controls.update(); v.renderer.render(v.scene, v.camera) }
}
animate()

function getInputs(){
  // Viewer 1 (Configurator) inputs
  return {
    'RH_IN:move_a': Number(document.getElementById('move_a').value),
    'RH_IN:move_b': Number(document.getElementById('move_b').value),
    'RH_IN:elipse_x': Number(document.getElementById('elipse_x').value),
    'RH_IN:elipse_y': Number(document.getElementById('elipse_y').value),
    'RH_IN:twist_configurator_rings': Number(document.getElementById('twist_configurator_rings').value),
    'RH_IN:configurator_height': Number(document.getElementById('configurator_height').value),
    // include other inputs to keep contract: one solve updates all viewers
    'RH_IN:move_cone_a': (document.getElementById('move_cone_a') ? Number(document.getElementById('move_cone_a').value) : 0),
    'RH_IN:move_cone_b': (document.getElementById('move_cone_b') ? Number(document.getElementById('move_cone_b').value) : 0),
    'RH_IN:move_cone_c': (document.getElementById('move_cone_c') ? Number(document.getElementById('move_cone_c').value) : 0),
    'RH_IN:array_panels': (document.getElementById('array') ? Math.round(Number(document.getElementById('array').value)) : 20)
  }
}

function bindOutputs(){
  const ids = [
    'move_a','move_b','elipse_x','elipse_y','twist_configurator_rings','configurator_height',
    'move_cone_a','move_cone_b','move_cone_c','array'
  ]
  const debounced = debounce(()=>onSolve(),150)
  for (const id of ids){
    const el = document.getElementById(id)
    if (!el) continue
    const out = document.getElementById(id+'Val')
    const evt = 'input'
    el.addEventListener(evt, ()=>{ if (out) out.textContent = String(el.value); debounced() })
    if (out) out.textContent = String(el.value)
  }
}
bindOutputs()

async function onSolve(){
  // cancel in-flight
  try{ if (currentSolveAbort){ currentSolveAbort.abort(); currentSolveAbort = null } }catch{}
  const inputs = getInputs()
  const payload = { definition: 'Hyperboloid.ghx', inputs }
  currentSolveAbort = new AbortController()
  const res = await fetch('/solve-hyperboloid', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload), signal: currentSolveAbort.signal }).catch(e=>{ if (e?.name === 'AbortError') return null; throw e })
  if (!res) return // aborted
  const text = await res.text()
  if (!res.ok) throw new Error(text||('HTTP '+res.status))
  const result = JSON.parse(text)
  renderResult(result)
}

function debounce(fn, delay){
  let t
  return (...args)=>{ clearTimeout(t); t = setTimeout(()=>fn.apply(null,args), delay) }
}

function renderResult(result){
  const values = Array.isArray(result.values) ? result.values : []
  // Group by exact ParamName
  const grouped = {}
  for (const v of values){ (grouped[v.ParamName] ||= []).push(v) }
  try{ console.log('Hyperboloid ParamNames:', Object.keys(grouped).map(k=>({ name:k, count: grouped[k].length }))) }catch{}

  // Clear scenes first
  scenes.forEach(v=>{ clearScene(v.scene); if (v.group){ v.scene.remove(v.group); disposeGroup(v.group); v.group=null } v.group=new THREE.Group(); v.scene.add(v.group) })

  // Viewer 1: Configurator (Brep) + hyperboloid (Curve)
  const cfgEntries = grouped['RH_OUT:Configurator'] || []
  const hypEntries = grouped['RH_OUT:hyperboloid'] || []
  const cfgItems = cfgEntries.flatMap(e=>flattenItems(e))
  const hypItems = hypEntries.flatMap(e=>flattenItems(e))
  const cfgMeshesAdded = addItemsPipeline(cfgItems, scenes[0].scene, 'Configurator')
  addItemsPipeline(hypItems, scenes[0].scene, 'Hyperboloid')
  fitView(scenes[0])
  try{ console.log('Configurator viewer stats:', viewerStats(scenes[0])) }catch{}

  // Viewer 2: positive (Brep)
  const posEntries = grouped['RH_OUT:positive'] || []
  const posItems = posEntries.flatMap(e=>flattenItems(e))
  addItemsPipeline(posItems, scenes[1].scene, 'Positive')
  fitView(scenes[1])

  // Viewer 3: panels (Breps list)
  const pnlEntries = grouped['RH_OUT:panels'] || []
  const pnlItems = pnlEntries.flatMap(e=>flattenItems(e))
  addItemsPipeline(pnlItems, scenes[2].scene, 'Panels')
  fitView(scenes[2])
}

function meshArrayFromBrep(brep){
  let meshes = rhino.Mesh.createFromBrep(brep, rhino.MeshingParameters.default)
  const out = []
  if (meshes){
    if (Array.isArray(meshes)){
      for (const m of meshes){ if (m) out.push(m) }
    } else {
      const n = (typeof meshes.length === 'number') ? meshes.length : (typeof meshes.count === 'number' ? meshes.count : 0)
      for (let i=0;i<n;i++){
        const m = (typeof meshes.get === 'function') ? meshes.get(i) : meshes[i]
        if (m) out.push(m)
      }
    }
  }
  if (out.length === 0){
    const presets = [rhino.MeshingParameters.smooth, rhino.MeshingParameters.coarse]
    for (const p of presets){
      try{
        const retry = rhino.Mesh.createFromBrep(brep, p)
        if (Array.isArray(retry)) { for (const m of retry){ if (m) out.push(m) } }
        else if (retry){
          const n2 = (typeof retry.length === 'number') ? retry.length : (typeof retry.count === 'number' ? retry.count : 0)
          for (let i=0;i<n2;i++){
            const mm = (typeof retry.get === 'function') ? retry.get(i) : retry[i]
            if (mm) out.push(mm)
          }
        }
        if (out.length) break
      }catch{}
    }
  }
  return out
}

function fitView(v){
  const box = new THREE.Box3()
  if (v.group) box.expandByObject(v.group)
  if (!box.isEmpty()){
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const halfFovY = (v.camera.fov*Math.PI/180)*0.5
    const halfFovX = Math.atan(Math.tan(halfFovY)*v.camera.aspect)
    const distY = (size.y*0.5)/Math.tan(halfFovY)
    const distX = (size.x*0.5)/Math.tan(halfFovX)
    const dist = Math.max(distX, distY) * 2.0
    v.camera.near = Math.max(0.1, dist/100)
    v.camera.far  = dist*100
    v.camera.updateProjectionMatrix()
    const dir = new THREE.Vector3().subVectors(v.camera.position, v.controls.target).normalize()
    v.camera.position.copy(center.clone().add(dir.multiplyScalar(dist)))
    v.controls.target.copy(center)
    v.controls.update()
  }
}

function viewerStats(v){
  let meshCount = 0
  try{ v.scene.traverse(o=>{ if (o.isMesh) meshCount++ }) }catch{}
  const box = new THREE.Box3()
  if (v.group) box.expandByObject(v.group)
  const size = box.getSize(new THREE.Vector3())
  return { meshCount, hasMeshes: meshCount>0, bbox:{ x:size.x||0, y:size.y||0, z:size.z||0 } }
}

function base64ToArrayBuffer(base64) {
  const binary_string = atob(base64)
  const len = binary_string.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i)
  }
  return bytes.buffer
}

function disposeGroup(group){
  group.traverse(child=>{
    if (child.geometry) child.geometry.dispose()
    if (child.material){
      if (Array.isArray(child.material)) child.material.forEach(m=>m.dispose())
      else child.material.dispose()
    }
  })
}

function isRhinoMesh(obj){
  return obj && typeof obj.faces === 'object' && typeof obj.vertices === 'object'
}

function rhinoMeshToThree(rMesh){
  const verts = rMesh.vertices()
  const faces = rMesh.faces()
  const vertexCount = verts.count || 0
  const positions = new Float32Array(vertexCount * 3)
  for (let i=0; i<vertexCount; i++){
    const v = verts.get(i)
    const x = (v && (v[0] ?? v.x)) ?? 0
    const y = (v && (v[1] ?? v.y)) ?? 0
    const z = (v && (v[2] ?? v.z)) ?? 0
    const o = i*3; positions[o]=x; positions[o+1]=y; positions[o+2]=z
  }
  const indices = []
  const faceCount = faces.count || 0
  for (let i=0; i<faceCount; i++){
    const f = faces.get(i)
    const a = f.a ?? f.A ?? f[0]
    const b = f.b ?? f.B ?? f[1]
    const c = f.c ?? f.C ?? f[2]
    const d = f.d ?? f.D ?? f[3]
    const isTri = (typeof f.isTriangle === 'boolean') ? f.isTriangle : (typeof f.IsTriangle === 'boolean' ? f.IsTriangle : (d === undefined || d === c))
    if (isTri){
      indices.push(a,b,c)
    } else {
      indices.push(a,b,c, a,c,d)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions,3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  const material = new THREE.MeshStandardMaterial({ color: 0x6b8cff, metalness:0.05, roughness:0.85, side: THREE.DoubleSide })
  return new THREE.Mesh(geometry, material)
}

// Convert rhino3dm Mesh to THREE.Mesh with diagnostics
function convertRhinoMeshToThree(rMesh){
  try{
    return rhinoMeshToThree(rMesh)
  }catch(e){
    try{ console.error('convertRhinoMeshToThree failed:', e?.message||String(e)) }catch{}
    return null
  }
}

// Ultimate Brep meshing pipeline with multiple strategies and detailed logs
function processBrep(geom, scene, label){
  console.log(`[${label}] STARTING BREP PROCESSING`)
  if (!rhino || !rhino.Mesh || !rhino.Mesh.createFromBrep){
    console.error(`[${label}] CRITICAL: rhino3dm not initialized properly`)
    return 0
  }
  // Build strategy list based on available MeshingParameters keys
  const mp = rhino.MeshingParameters || {}
  const candidates = []
  if (mp.Default) candidates.push(mp.Default)
  if (mp.default) candidates.push(mp.default)
  if (mp.QualityRenderMesh) candidates.push(mp.QualityRenderMesh)
  if (mp.smooth) candidates.push(mp.smooth)
  if (mp.Coarse) candidates.push(mp.Coarse)
  if (mp.coarse) candidates.push(mp.coarse)
  try{ const custom = new rhino.MeshingParameters(0.5,0.3); if (custom) candidates.push(custom) }catch{}
  let meshes = []
  for (let i=0;i<candidates.length;i++){
    try{
      console.log(`[${label}] Trying meshing strategy ${i+1}`)
      const res = rhino.Mesh.createFromBrep(geom, candidates[i])
      if (Array.isArray(res) && res.length>0){ meshes = res; console.log(`[${label}] Success with strategy ${i+1}: ${res.length} meshes`); break }
    }catch(e){ console.warn(`[${label}] Strategy ${i+1} failed:`, e?.message||String(e)) }
  }
  if (!Array.isArray(meshes) || meshes.length===0){
    console.error(`[${label}] ALL MESHING STRATEGIES FAILED!`)
    // last resort
    try{ if (typeof geom.toMesh === 'function'){ const m = geom.toMesh(); if (m) meshes=[m]; console.log(`[${label}] Direct toMesh conversion ${meshes.length? 'succeeded':''}`) } }catch(e){ console.error(`[${label}] Direct conversion failed:`, e?.message||String(e)) }
    if (!Array.isArray(meshes) || meshes.length===0){ console.error(`[${label}] UNABLE TO MESH BREP`); return 0 }
  }
  let added = 0
  for (const m of meshes){ const three = convertRhinoMeshToThree(m); if (three){ scene.add(three); added++; console.log(`[${label}] Mesh added to scene`) } }
  return added
}

function addRhinoGeometryToGroup(geo, group){
  try{
    if (!geo) return
    const ctor = geo?.constructor?.name
    const isBrep = (ctor === 'Brep') || (typeof geo?.faces === 'function') || (typeof geo?.toBrep === 'function' && !geo?.toNurbsCurve)
    const isMesh = (ctor === 'Mesh') || (geo?.vertices && geo?.faces)
    const isCurve = (typeof geo?.toNurbsCurve === 'function')
    const isExtrusionOrSubD = (typeof geo?.toBrep === 'function' && !isBrep && !isCurve)

    if (isBrep){
      const meshes = meshArrayFromBrep(geo)
      try{ console.log('Configurator brep meshed:', Array.isArray(meshes), 'len:', (Array.isArray(meshes)? meshes.length : 0)) }catch{}
      if (Array.isArray(meshes) && meshes.length){
        for (const m of meshes){ group.add(rhinoMeshToThree(m)) }
      } else {
        // fallback to edge wireframe
        try{
          const edges = geo.edges ? geo.edges() : null
          if (edges && typeof edges.count === 'number'){
            const mat = new THREE.LineBasicMaterial({ color:0x333333 })
            for (let i=0;i<edges.count;i++){
              try{
                const crv = edges.get(i).toNurbsCurve()
                if (!crv) continue
                const pts = crv.points(); const arr=[]
                for (let k=0;k<pts.count;k++){ const p=pts.get(k).location; arr.push(new THREE.Vector3(p.x,p.y,p.z)) }
                const g=new THREE.BufferGeometry().setFromPoints(arr)
                group.add(new THREE.Line(g, mat))
              }catch{}
            }
          }
        }catch{}
      }
      return
    }

    if (isExtrusionOrSubD){
      try{ const b = geo.toBrep(true); if (b) return addRhinoGeometryToGroup(b, group) }catch{}
    }

    if (isMesh){ group.add(rhinoMeshToThree(geo)); return }

    if (isCurve){
      try{ const nurbs = geo.toNurbsCurve(); const pts=nurbs.points(); const arr=[]; for (let k=0;k<pts.count;k++){ const p=pts.get(k).location; arr.push(new THREE.Vector3(p.x,p.y,p.z)) } const g=new THREE.BufferGeometry().setFromPoints(arr); const m=new THREE.LineBasicMaterial({ color:0x333333 }); group.add(new THREE.Line(g,m)) }catch{}
      return
    }

    // Points
    if (ctor === 'Point' || ctor === 'Point3d'){
      try{ const p=geo.location||geo; const sph=new THREE.Mesh(new THREE.SphereGeometry(0.5,12,8), new THREE.MeshStandardMaterial({ color:0x0070f3 })); sph.position.set(p.x,p.y,p.z); group.add(sph) }catch{}
      return
    }
  }catch{}
}

// Flatten InnerTree entries into a single array (sorted by path)
function flattenItems(entry){
  const flat = []
  const tree = entry.InnerTree || {}
  Object.keys(tree).sort().forEach(path=>{ const arr = tree[path]||[]; for (const it of arr) flat.push(it) })
  return flat
}

// Diagnostic rendering pipeline per ParamName items list
function addItemsPipeline(items, scene, label){
  console.log(`\n=== ${label} RENDERING PIPELINE START ===`)
  let totalMeshCount = 0
  for (let i=0; i<(items?.length||0); i++){
    const item = items[i]
    console.log(`${label}[${i}] Processing item:`, { hasData: !!item?.data, dataType: typeof item?.data, dataLength: item?.data?.length })
    // Parse JSON (double-encoded guard)
    let parsed
    try{ parsed = JSON.parse(item.data); if (typeof parsed === 'string'){ try{ parsed = JSON.parse(parsed) }catch{} } console.log(`${label}[${i}] JSON parsed successfully`) }catch(e){ console.error(`${label}[${i}] JSON parse failed:`, e); continue }
    // Decode
    let geom
    try{ geom = rhino.CommonObject.decode(parsed); console.log(`${label}[${i}] Decoded to:`, { constructor: geom?.constructor?.name, hasFaces: typeof geom?.faces === 'function', hasToBrep: typeof geom?.toBrep === 'function', hasToNurbsCurve: typeof geom?.toNurbsCurve === 'function' }) }catch(e){ console.error(`${label}[${i}] Decode failed:`, e); continue }
    const ctor = geom?.constructor?.name || 'Unknown'
    // Brep
    if (ctor === 'Brep' || typeof geom?.faces === 'function' || (typeof geom?.toBrep === 'function' && !geom?.toNurbsCurve)){
      console.log(`${label}[${i}] BREP DETECTED - Starting mesh process`)
      try{ const fc=geom.faces?.()?.count; console.log(`${label}[${i}] Brep has ${fc} faces`) }catch{}
      const added = processBrep(geom, scene, `${label}[${i}]`)
      console.log(`${label}[${i}] PROCESSING COMPLETE: ${added} meshes`)
      totalMeshCount += added
      continue
    }
    // Curve (NurbsCurve)
    if (ctor === 'NurbsCurve' || typeof geom?.toNurbsCurve === 'function'){
      console.log(`${label}[${i}] CURVE DETECTED - Rendering as line`)
      try{ const crv = geom.toNurbsCurve ? geom.toNurbsCurve() : geom; const pts = crv.points(); if (pts && pts.count>0){ const arr=[]; for (let j=0;j<pts.count;j++){ const p=pts.get(j); const x=p[0]??p.x, y=p[1]??p.y, z=p[2]??p.z; arr.push(new THREE.Vector3(x,y,z)) } const g=new THREE.BufferGeometry().setFromPoints(arr); const l=new THREE.Line(g, new THREE.LineBasicMaterial({ color:0x333333 })); scene.add(l); console.log(`${label}[${i}] Curve added as line with ${pts.count} points`) } }catch(e){ console.error(`${label}[${i}] Curve rendering failed:`, e) }
      continue
    }
    // Mesh direct
    if (ctor === 'Mesh' || (geom?.vertices && geom?.faces)){
      console.log(`${label}[${i}] MESH DETECTED - Adding directly`)
      const three = convertRhinoMeshToThree(geom)
      if (three){ scene.add(three); totalMeshCount++ }
      continue
    }
    // Extrusion/SubD
    if (typeof geom?.toBrep === 'function'){
      console.log(`${label}[${i}] EXTRUSION/SUBD DETECTED - Converting to Brep`)
      try{ const b = geom.toBrep(true); if (b){ const meshes = meshArrayFromBrep(b); console.log(`${label}[${i}] toBrep meshed:`, { isArray:Array.isArray(meshes), length: meshes.length }); for (const m of meshes){ const three = convertRhinoMeshToThree(m); if (three){ scene.add(three); totalMeshCount++ } } } }catch(e){ console.error(`${label}[${i}] toBrep meshing failed:`, e) }
      continue
    }
    console.log(`${label}[${i}] Unhandled type: ${ctor}`)
  }
  console.log(`=== ${label} RENDERING COMPLETE: ${totalMeshCount} meshes ===\n`)
  return totalMeshCount
}

function addItemDataToGroup(rawData, group){
  if (!rawData) return
  try{
    // Some Compute outputs nest JSON strings twice
    let data = rawData
    // First parse
    if (typeof data === 'string'){
      try{ data = JSON.parse(data) }catch{ /* leave as-is */ }
    }
    // If still a stringified JSON, parse again
    if (typeof data === 'string'){
      try{ data = JSON.parse(data) }catch{ /* leave as-is */ }
    }
    // Preferred: decode Rhino CommonObject JSON directly (handles Brep/Curve/Mesh or File3dm)
    if (data && typeof data === 'object'){
      try{
        const rhObj = rhino.CommonObject.decode(data)
        if (rhObj){
          try{ console.log('Configurator decoded typename:', rhObj?.constructor?.name, 'faces?', typeof rhObj?.faces === 'function', 'toBrep?', typeof rhObj?.toBrep === 'function') }catch{}
          if (typeof rhObj.objects === 'function'){
            try{
              const objs = rhObj.objects();
              for (let i=0;i<objs.count;i++){
                const ro = objs.get(i); const geo = ro.geometry(); if (!geo) continue
                addRhinoGeometryToGroup(geo, group)
              }
              return
            }catch{}
          }
          addRhinoGeometryToGroup(rhObj, group)
          return
        }
      }catch{}
    }
    // If still a long string, try decoding as base64 .3dm
    if (typeof data === 'string' && data.length > 500){
      try{
        const bytes = Uint8Array.from(atob(data), c=>c.charCodeAt(0))
        const file = rhino.File3dm.fromByteArray(bytes)
        if (file){
          const objs = file.objects()
          for (let i=0;i<objs.count;i++){
            const ro = objs.get(i); const geo = ro.geometry(); if (!geo) continue
            addRhinoGeometryToGroup(geo, group)
          }
          return
        }
      }catch{}
    }
    // Rhino archive JSON case: { version, archive3dm, opennurbs, data: base64 }
    if (data && typeof data === 'object' && typeof data.archive3dm !== 'undefined' && typeof data.data === 'string'){
      try{
        const bytes = Uint8Array.from(atob(data.data), c=>c.charCodeAt(0))
        const file = rhino.File3dm.fromByteArray(bytes)
        if (file){
          const objs = file.objects()
          try{ console.log('Configurator 3dm objects:', objs.count) }catch{}
          for (let i=0;i<objs.count;i++){
            const ro = objs.get(i); const geo = ro.geometry(); if (!geo) continue
            addRhinoGeometryToGroup(geo, group)
          }
          return
        }
        // Fallback: let Rhino3dmLoader try to parse anything else
        try{ loader.parse(bytes.buffer, obj=>{ try{ group.add(obj) }catch{} }) }catch{}
      }catch{}
    }
    // Nested inner data string case (e.g., { data: '{...}' })
    if (data && typeof data === 'object' && typeof data.data === 'string'){
      let inner = data.data
      try{ inner = JSON.parse(inner) }catch{}
      if (inner && typeof inner === 'object'){
        if (typeof inner.archive3dm !== 'undefined' && typeof inner.data === 'string'){
          try{
            const bytes = Uint8Array.from(atob(inner.data), c=>c.charCodeAt(0))
            const file = rhino.File3dm.fromByteArray(bytes)
            if (file){
              const objs = file.objects();
              try{ console.log('Configurator inner 3dm objects:', objs.count) }catch{}
              for (let i=0;i<objs.count;i++){
                const ro = objs.get(i); const geo = ro.geometry(); if (!geo) continue
                addRhinoGeometryToGroup(geo, group)
              }
              return
            }
            // Fallback: Rhino3dmLoader parse
            try{ loader.parse(bytes.buffer, obj=>{ try{ group.add(obj) }catch{} }) }catch{}
          }catch{}
        } else {
          try{ const rhObj = rhino.CommonObject.decode(inner); if (rhObj) { addRhinoGeometryToGroup(rhObj, group); return } }catch{}
        }
      }
      if (typeof inner === 'string' && inner.length > 500){
        try{
          const bytes = Uint8Array.from(atob(inner), c=>c.charCodeAt(0))
          const file = rhino.File3dm.fromByteArray(bytes)
          if (file){
            const objs = file.objects();
            for (let i=0;i<objs.count;i++){
              const ro = objs.get(i); const geo = ro.geometry(); if (!geo) continue
              addRhinoGeometryToGroup(geo, group)
            }
            return
          }
        }catch{}
      }
    }
    // Rhino archive JSON case: { version, archive3dm, opennurbs, data: base64 }
    if (data && typeof data === 'object' && typeof data.archive3dm !== 'undefined' && typeof data.data === 'string'){
      try{
        const bytes = Uint8Array.from(atob(data.data), c=>c.charCodeAt(0))
        const file = rhino.File3dm.fromByteArray(bytes)
        if (file){
          const objs = file.objects()
          for (let i=0;i<objs.count;i++){
            const ro = objs.get(i); const geo = ro.geometry(); if (!geo) continue
            addRhinoGeometryToGroup(geo, group)
          }
          return
        }
      }catch{}
    }
    // Nested inner data string case
    if (data && typeof data === 'object' && typeof data.data === 'string'){
      let inner = data.data
      try{ inner = JSON.parse(inner) }catch{}
      if (inner && typeof inner === 'object'){
        if (typeof inner.archive3dm !== 'undefined' && typeof inner.data === 'string'){
          try{
            const bytes = Uint8Array.from(atob(inner.data), c=>c.charCodeAt(0))
            const file = rhino.File3dm.fromByteArray(bytes)
            if (file){
              const objs = file.objects();
              for (let i=0;i<objs.count;i++){
                const ro = objs.get(i); const geo = ro.geometry(); if (!geo) continue
                addRhinoGeometryToGroup(geo, group)
              }
              return
            }
          }catch{}
        } else {
          try{ const rhObj = rhino.CommonObject.decode(inner); if (rhObj) { addRhinoGeometryToGroup(rhObj, group); return } }catch{}
        }
      }
      if (typeof inner === 'string' && inner.length > 500){
        try{
          const bytes = Uint8Array.from(atob(inner), c=>c.charCodeAt(0))
          const file = rhino.File3dm.fromByteArray(bytes)
          if (file){
            const objs = file.objects();
            for (let i=0;i<objs.count;i++){
              const ro = objs.get(i); const geo = ro.geometry(); if (!geo) continue
              addRhinoGeometryToGroup(geo, group)
            }
            return
          }
        }catch{}
      }
    }
    if (data && data.encoded){
      const bytes = new Uint8Array(base64ToArrayBuffer(data.encoded))
      const file = rhino.File3dm.fromByteArray(bytes)
      if (file){
        const objs = file.objects()
        for (let i=0;i<objs.count;i++){
          const ro = objs.get(i); const geo = ro.geometry(); if (!geo) continue
          addRhinoGeometryToGroup(geo, group)
        }
      }
      return
    }
    if (data && rhino){
      try{ const rhObj = rhino.CommonObject.decode(data); if (rhObj) addRhinoGeometryToGroup(rhObj, group) }catch{}
      return
    }
  }catch{}
}

// initial solve
onSolve().catch(console.error)

