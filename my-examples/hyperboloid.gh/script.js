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
  { canvas: document.getElementById('viewA'), filter: (name)=> /^(RH_OUT:ConfiguratorMesh|RH_OUT:Configurator|RH_OUT:points|RH_OUT:point|RH_OUT:text_a|RH_OUT:text_b|RH_OUT:hyperboloid)$/i.test(name), color: 0x0080ff }, // blue
  { canvas: document.getElementById('viewB'), filter: (name)=> /^(RH_OUT:positiveMesh|RH_OUT:positive)$/i.test(name), color: 0xffff00 }, // yellow
  { canvas: document.getElementById('viewC'), filter: (name)=> /^(RH_OUT:panelsMesh|RH_OUT:panels)$/i.test(name), color: 0xff69b4 }, // pink
]

const scenes = viewers.map(v=>{
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('white')
  const camera = new THREE.PerspectiveCamera(45, v.canvas.clientWidth/Math.max(1,v.canvas.clientHeight), 0.1, 5000)
  camera.position.set(10,-12,10)
  const renderer = new THREE.WebGLRenderer({ antialias:true, canvas: v.canvas })
  renderer.setPixelRatio(devicePixelRatio)
  renderer.setSize(v.canvas.clientWidth, v.canvas.clientHeight, false)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  const controls = new OrbitControls(camera, renderer.domElement)
  scene.add(new THREE.HemisphereLight(0xffffff,0x888888,0.8))
  const dl = new THREE.DirectionalLight(0xffffff,1.2); dl.position.set(5,5,10); scene.add(dl)
  const fill = new THREE.DirectionalLight(0xffffff,0.4); fill.position.set(-5,-3,6); scene.add(fill)
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
    'RH_IN:move_cone_d': (document.getElementById('move_cone_d') ? Number(document.getElementById('move_cone_d').value) : 0),
    'RH_IN:array_panels': (document.getElementById('array_panels') ? Math.round(Number(document.getElementById('array_panels').value)) : 5)
  }
}

function bindOutputs(){
  const ids = [
    'move_a','move_b','elipse_x','elipse_y','twist_configurator_rings','configurator_height',
    'move_cone_a','move_cone_b','move_cone_c','move_cone_d','array_panels'
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
  // Prefer RH_OUT:ConfiguratorMesh (server meshed)
  const meshEntries = values.filter(v => v.ParamName === 'RH_OUT:ConfiguratorMesh')
  if (meshEntries.length){
    try{
      const v1 = scenes[0]
      clearScene(v1.scene)
      if (v1.group){ v1.scene.remove(v1.group); disposeGroup(v1.group); v1.group=null }
      v1.group = new THREE.Group(); v1.scene.add(v1.group)

      const flatMeshItems = meshEntries.flatMap(e => flattenItems(e))
      console.log('Configurator meshes from server:', flatMeshItems.length)

      let childBefore = v1.scene.children.length
      for (const it of flatMeshItems){
        try{
          const meshJson = JSON.parse(it.data)
          const rhMesh = rhino.CommonObject.decode(meshJson)
          if (!rhMesh) continue
          // count triangles for log
          let tri = 0; try{ const faces = rhMesh.faces(); for (let i=0;i<faces.count;i++){ const f=faces.get(i); tri += (f[2] !== f[3]) ? 2 : 1 } }catch{}
          const threeMesh = convertRhinoMeshToThree(rhMesh, 0x6b8cff)
          if (threeMesh){ v1.group.add(threeMesh); console.log('Added mesh triangles:', tri) }
        }catch{}
      }
      // Add hyperboloid curve + points alongside meshes
      try{ const hypEntries = values.filter(v => v.ParamName === 'RH_OUT:hyperboloid'); const hyps = hypEntries.flatMap(e => flattenItems(e)); for (const it of hyps){ addItemDataToGroup(it.data, v1.group) } }catch{}
      try{ const ptEntries = values.filter(v => v.ParamName === 'RH_OUT:points' || v.ParamName === 'RH_OUT:point'); const pts = ptEntries.flatMap(e => flattenItems(e)); for (const it of pts){ addItemDataToGroup(it.data, v1.group) } }catch{}

      // Color viewer A meshes (blue), fit and render
      try{ v1.group.traverse(o=>{ if (o.isMesh && o.material){ o.material.color = new THREE.Color(viewers[0].color) } }) }catch{}
      // Fit and render
      fitView(v1)
      v1.renderer.render(v1.scene, v1.camera)
      console.log('v1 scene children:', v1.scene.children.length, '(was', childBefore, ')')
    }catch(e){ console.warn('ConfiguratorMesh render error:', e?.message||String(e)) }
  }
  if (!meshEntries.length){
    // Fall back to direct Brep or Mesh output
    try{
      const configuratorEntries = values.filter(v => v.ParamName === 'RH_OUT:Configurator')
      const flat = configuratorEntries.flatMap(e => flattenItems(e))
      if (flat.length){
        let parsed
        try{ parsed = JSON.parse(flat[0].data) }catch{}
        let obj
        try{ obj = rhino.CommonObject.decode(parsed) }catch{}
        const v1 = scenes[0]
        clearScene(v1.scene)
        if (v1.group){ v1.scene.remove(v1.group); disposeGroup(v1.group); v1.group=null }
        v1.group = new THREE.Group(); v1.scene.add(v1.group)
        if (obj){
          // If already a Mesh, add directly; else use geometry fallback
          if (obj && obj.vertices && obj.faces){
            const meshThree = convertRhinoMeshToThree(obj, viewers[0].color)
            if (meshThree) v1.group.add(meshThree)
          } else {
            addRhinoGeometryToGroup(obj, v1.group)
          }
        }
        // Add hyperboloid curve + points
        try{ const hypEntries = values.filter(v => v.ParamName === 'RH_OUT:hyperboloid'); const hyps = hypEntries.flatMap(e => flattenItems(e)); for (const it of hyps){ addItemDataToGroup(it.data, v1.group) } }catch{}
        try{ const ptEntries = values.filter(v => v.ParamName === 'RH_OUT:points' || v.ParamName === 'RH_OUT:point'); const pts = ptEntries.flatMap(e => flattenItems(e)); for (const it of pts){ addItemDataToGroup(it.data, v1.group) } }catch{}
        fitView(v1)
        v1.renderer.render(v1.scene, v1.camera)
      }
    }catch{}
  }
  // Render Positive (Viewer B) in yellow
  try{
    const posMesh = values.filter(v => v.ParamName === 'RH_OUT:positiveMesh')
    const posEntries = posMesh.length ? posMesh : values.filter(v => v.ParamName === 'RH_OUT:positive')
    const vB = scenes[1]
    if (vB){
      clearScene(vB.scene)
      if (vB.group){ vB.scene.remove(vB.group); disposeGroup(vB.group); vB.group=null }
      vB.group = new THREE.Group(); vB.scene.add(vB.group)
      const posItems = posEntries.flatMap(e => flattenItems(e))
      for (const it of posItems){ addItemDataToGroup(it.data, vB.group) }
      try{ vB.group.traverse(o=>{ if (o.isMesh && o.material){ o.material.color = new THREE.Color(viewers[1].color) } }) }catch{}
      if (posItems.length){ fitView(vB); vB.renderer.render(vB.scene, vB.camera) }
    }
  }catch(e){ console.warn('Positive render error:', e?.message||String(e)) }

  // Render Panels (Viewer C) in pink
  try{
    const panMesh = values.filter(v => v.ParamName === 'RH_OUT:panelsMesh')
    const panEntries = panMesh.length ? panMesh : values.filter(v => v.ParamName === 'RH_OUT:panels')
    const vC = scenes[2]
    if (vC){
      clearScene(vC.scene)
      if (vC.group){ vC.scene.remove(vC.group); disposeGroup(vC.group); vC.group=null }
      vC.group = new THREE.Group(); vC.scene.add(vC.group)
      const panItems = panEntries.flatMap(e => flattenItems(e))
      for (const it of panItems){ addItemDataToGroup(it.data, vC.group) }
      try{ vC.group.traverse(o=>{ if (o.isMesh && o.material){ o.material.color = new THREE.Color(viewers[2].color) } }) }catch{}
      if (panItems.length){ fitView(vC); vC.renderer.render(vC.scene, vC.camera) }
    }
  }catch(e){ console.warn('Panels render error:', e?.message||String(e)) }
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

function rhinoMeshToThree(rMesh, colorHex){
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
  const material = new THREE.MeshStandardMaterial({ color: (colorHex ?? 0x6b8cff), metalness:0.05, roughness:0.85, side: THREE.DoubleSide, wireframe:false })
  return new THREE.Mesh(geometry, material)
}

// Convert rhino3dm Mesh to THREE.Mesh with diagnostics
function convertRhinoMeshToThree(rMesh, colorHex){
  try{
    return rhinoMeshToThree(rMesh, colorHex)
  }catch(e){
    try{ console.error('convertRhinoMeshToThree failed:', e?.message||String(e)) }catch{}
    return null
  }
}

// Robustly convert a rhino3dm point/control point to THREE.Vector3
function pointToVector3(p){
  const src = (p && p.location) ? p.location : p
  const x = (src && (src.x ?? src.X ?? src[0])) ?? 0
  const y = (src && (src.y ?? src.Y ?? src[1])) ?? 0
  const z = (src && (src.z ?? src.Z ?? src[2])) ?? 0
  return new THREE.Vector3(x,y,z)
}

// Ultimate Brep meshing pipeline with multiple strategies and detailed logs
// client-side meshing disabled
function processBrep(){ return 0 }

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
                for (let k=0;k<pts.count;k++){ const p=pts.get(k); arr.push(pointToVector3(p)) }
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
      const three = convertRhinoMeshToThree(geom, 0x6b8cff)
      if (three){ scene.add(three); totalMeshCount++ }
      continue
    }
    // Extrusion/SubD
    if (typeof geom?.toBrep === 'function'){
      console.log(`${label}[${i}] EXTRUSION/SUBD DETECTED - Converting to Brep`)
      try{ const b = geom.toBrep(true); if (b){ const meshes = meshArrayFromBrep(b); console.log(`${label}[${i}] toBrep meshed:`, { isArray:Array.isArray(meshes), length: meshes.length }); for (const m of meshes){ const three = convertRhinoMeshToThree(m, 0x6b8cff); if (three){ scene.add(three); totalMeshCount++ } } } }catch(e){ console.error(`${label}[${i}] toBrep meshing failed:`, e) }
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

