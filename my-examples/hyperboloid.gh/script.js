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

// Ensure clearScene exists
function clearScene(scene){
  try{
    // keep lights/grid if present
    const keep = new Set()
    scene.children.forEach(ch=>{ if (ch.isLight || ch.type==='GridHelper') keep.add(ch) })
    for (let i=scene.children.length-1; i>=0; i--){ const ch=scene.children[i]; if (!keep.has(ch)) scene.remove(ch) }
  }catch{}
}

// Polyfill/fallback for createFromBrep per observed API
function createMeshesFromBrepCompat(brep){
  try{
    const MP = rhino?.MeshingParameters || {}
    const presets = [MP.default, MP.qualityRenderMesh, MP.fastRenderMesh, MP.coarse].filter(Boolean)
    for (const p of presets){
      // client-side meshing unavailable in this build; skip
    }
    // last resort: toMesh
    if (typeof brep?.toMesh === 'function'){
      // toMesh unavailable in this build; skip
    }
  }catch{}
  return []
}

const viewers = [
  { canvas: document.getElementById('viewA'), filter: (name)=> /^(RH_OUT:Configurator|RH_OUT:Configurator_Mesh|RH_OUT:points|RH_OUT:text_a|RH_OUT:text_b|RH_OUT:hyperboloid)$/i.test(name) },
  { canvas: document.getElementById('viewB'), filter: (name)=> /^(RH_OUT:positive|RH_OUT:positive_Mesh)$/i.test(name) },
  { canvas: document.getElementById('viewC'), filter: (name)=> /^(RH_OUT:panels|RH_OUT:panels_Mesh)$/i.test(name) },
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
  
  // Process all three viewers
  viewers.forEach((viewer, idx) => {
    const v = scenes[idx]
    clearScene(v.scene)
    if (v.group){ v.scene.remove(v.group); disposeGroup(v.group); v.group=null }
    v.group = new THREE.Group(); v.scene.add(v.group)
    
    // Find outputs that match this viewer's filter
    const relevantValues = values.filter(val => viewer.filter(val.ParamName))
    
    for (const value of relevantValues) {
      const items = flattenItems(value)
      console.log(`Viewer ${idx} - Processing ${value.ParamName}: ${items.length} items`)
      
      for (const item of items) {
        try {
          // Parse the data
          let data = item.data
          if (typeof data === 'string') {
            data = JSON.parse(data)
          }
          
          // Decode the geometry
          const geo = rhino.CommonObject.decode(data)
          if (!geo) continue
          
          // Add to scene based on geometry type
          addRhinoGeometryToGroup(geo, v.group)
        } catch (e) {
          console.error(`Failed to process ${value.ParamName}:`, e)
        }
      }
    }
    
    // Fit camera and render
    if (v.group.children.length > 0) {
      fitView(v)
    }
    v.renderer.render(v.scene, v.camera)
  })
  
  // Check if we have any meshed outputs (prefer these over raw geometry)
  const hasMeshedOutputs = values.some(v => v.ParamName.endsWith('_Mesh'))
  if (hasMeshedOutputs) {
    console.log('Using server-meshed outputs')
  }

  // Fallback: if no server mesh and no viewer processing worked, try wireframe
  const configuratorEntries = values.filter(v => v.ParamName === 'RH_OUT:Configurator')
  if (configuratorEntries.length && scenes[0].group.children.length === 0) {
    const flat = configuratorEntries.flatMap(e => flattenItems(e))
    if (flat.length) {
      try {
        const parsed = JSON.parse(flat[0].data)
        const brep = rhino.CommonObject.decode(parsed)
        if (brep && typeof brep.edges === 'function') {
          const v1 = scenes[0]
          const edges = brep.edges()
          const mat = new THREE.LineBasicMaterial({ color: 0x00ffff })
          
          for (let i = 0; i < edges.count; i++) {
            try {
              const edge = edges.get(i)
              const crv = edge.toNurbsCurve ? edge.toNurbsCurve() : edge
              if (!crv || !crv.points) continue
              const pts = crv.points()
              if (!pts || pts.count < 2) continue
              
              const linePoints = []
              for (let j = 0; j < pts.count; j++) {
                const p = pts.get(j)
                linePoints.push(new THREE.Vector3(p[0] || p.x, p[1] || p.y, p[2] || p.z))
              }
              
              const g = new THREE.BufferGeometry().setFromPoints(linePoints)
              v1.group.add(new THREE.Line(g, mat))
            } catch (e) {
              console.error('Edge processing error:', e)
            }
          }
          
          fitView(v1)
          v1.renderer.render(v1.scene, v1.camera)
        }
      } catch (e) {
        console.error('Wireframe fallback failed:', e)
      }
    }
  }
}

function meshArrayFromBrep(brep){
  const out = []
  try{
    const primary = createMeshesFromBrepCompat(brep)
    if (Array.isArray(primary)) for (const m of primary){ if (m) out.push(m) }
  }catch{}
  if (out.length === 0){
    const MP = rhino?.MeshingParameters || {}
    const presets = [MP.qualityRenderMesh, MP.coarse].filter(Boolean)
    for (const p of presets){
      try{
        const retry = [] // no client-side meshing
        if (Array.isArray(retry)) { for (const m of retry){ if (m) out.push(m) } }
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
// client-side meshing disabled
function processBrep(){ return 0 }

function addRhinoGeometryToGroup(geo, group){
  try{
    if (!geo) return
    const ctor = geo?.constructor?.name
    console.log(`Processing geometry type: ${ctor}`)
    
    // Check if it's a Mesh first (most common for server-meshed geometry)
    if (ctor === 'Mesh' || (geo?.vertices && geo?.faces && typeof geo.vertices === 'function')) {
      const threeMesh = convertRhinoMeshToThree(geo)
      if (threeMesh) {
        group.add(threeMesh)
        console.log('Added mesh to scene')
      }
      return
    }
    
    // Check if it's a Brep
    if (ctor === 'Brep' || typeof geo?.faces === 'function') {
      // Since client-side meshing is not available, render as wireframe
      try {
        const edges = geo.edges()
        if (edges && edges.count > 0) {
          const mat = new THREE.LineBasicMaterial({ color: 0x00aaff })
          for (let i = 0; i < edges.count; i++) {
            try {
              const edge = edges.get(i)
              const crv = edge.toNurbsCurve ? edge.toNurbsCurve() : edge
              if (!crv || !crv.points) continue
              
              const pts = crv.points()
              const arr = []
              for (let k = 0; k < pts.count; k++) {
                const p = pts.get(k)
                const loc = p.location || p
                arr.push(new THREE.Vector3(loc.x || loc[0], loc.y || loc[1], loc.z || loc[2]))
              }
              
              if (arr.length >= 2) {
                const g = new THREE.BufferGeometry().setFromPoints(arr)
                group.add(new THREE.Line(g, mat))
              }
            } catch (e) {
              console.error('Edge rendering error:', e)
            }
          }
          console.log('Added Brep as wireframe')
        }
      } catch (e) {
        console.error('Brep wireframe rendering failed:', e)
      }
      return
    }
    
    // Check if it's a Curve
    if (ctor === 'NurbsCurve' || typeof geo?.toNurbsCurve === 'function') {
      try {
        const nurbs = geo.toNurbsCurve ? geo.toNurbsCurve() : geo
        const pts = nurbs.points()
        const arr = []
        for (let k = 0; k < pts.count; k++) {
          const p = pts.get(k)
          const loc = p.location || p
          arr.push(new THREE.Vector3(loc.x || loc[0], loc.y || loc[1], loc.z || loc[2]))
        }
        if (arr.length >= 2) {
          const g = new THREE.BufferGeometry().setFromPoints(arr)
          const m = new THREE.LineBasicMaterial({ color: 0x333333 })
          group.add(new THREE.Line(g, m))
          console.log('Added curve')
        }
      } catch (e) {
        console.error('Curve rendering error:', e)
      }
      return
    }
    
    // Check if it's a Point
    if (ctor === 'Point' || ctor === 'Point3d' || geo?.location) {
      try {
        const p = geo.location || geo
        const sph = new THREE.Mesh(
          new THREE.SphereGeometry(0.5, 12, 8),
          new THREE.MeshStandardMaterial({ color: 0x0070f3 })
        )
        sph.position.set(p.x || p[0], p.y || p[1], p.z || p[2])
        group.add(sph)
        console.log('Added point')
      } catch (e) {
        console.error('Point rendering error:', e)
      }
      return
    }
    
    // Handle Extrusion/SubD by converting to Brep
    if (typeof geo?.toBrep === 'function') {
      try {
        const b = geo.toBrep(true)
        if (b) {
          console.log('Converting Extrusion/SubD to Brep')
          return addRhinoGeometryToGroup(b, group)
        }
      } catch (e) {
        console.error('toBrep conversion error:', e)
      }
    }
    
    console.log('Unhandled geometry type:', ctor)
  } catch (e) {
    console.error('addRhinoGeometryToGroup error:', e)
  }
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

