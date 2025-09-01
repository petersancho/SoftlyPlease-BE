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
  try{
    console.log('Hyperboloid ParamNames:', values.map(v=>({
      name: v.ParamName,
      branches: Object.keys(v.InnerTree||{}).length,
      countsByBranch: Object.entries(v.InnerTree||{}).map(([k,arr])=>({path:k,count:(arr||[]).length})),
      sampleType: (()=>{ try{ const it=(Object.values(v.InnerTree||{})[0]||[])[0]; return it?.type || (it?.data && typeof it.data); }catch{return null} })()
    })))
  }catch{}
  for (const v of scenes){
    if (v.group){ v.scene.remove(v.group); disposeGroup(v.group); v.group = null }
    v.group = new THREE.Group(); v.scene.add(v.group)
  }

  const doc = rhino ? new rhino.File3dm() : null

  for (const out of values){
    const name = out.ParamName || ''
    const tree = out.InnerTree || {}
    const paths = Object.keys(tree).sort()
    for (const path of paths){
      for (const item of (tree[path]||[])){
        try{
          // route to matching viewer(s)
          scenes.forEach((v,idx)=>{
            if (!viewers[idx].filter(name)) return
            addItemDataToGroup(item.data, v.group)
          })
        }catch{}
      }
    }
  }

  // Ensure Configurator specifically renders into Viewer 1 regardless of filters
  try{
    const cfg = (result.values||[]).find(e => (e.ParamName||'').toLowerCase() === 'rh_out:configurator')
    if (cfg){
      try{
        const firstBranch = Object.values(cfg.InnerTree||{})[0]||[]
        const firstItem = firstBranch[0]
        console.log('Configurator sample item:', {
          hasItem: !!firstItem,
          itemType: firstItem?.type,
          dataType: typeof firstItem?.data,
          dataHead: (typeof firstItem?.data==='string') ? String(firstItem.data).slice(0,80) : (firstItem?.data && typeof firstItem.data === 'object' ? Object.keys(firstItem.data) : null)
        })
        if (firstItem && typeof firstItem.data === 'string'){
          let arch = firstItem.data
          try{ arch = JSON.parse(arch) }catch{}
          if (typeof arch === 'string') { try{ arch = JSON.parse(arch) }catch{} }
          let geom = null
          try{ geom = rhino.CommonObject.decode(arch) }catch{}
          try{
            console.log('Configurator decoded typename:', geom?.constructor?.name, 'faces?', typeof geom?.faces === 'function', 'toBrep?', typeof geom?.toBrep === 'function')
          }catch{}
          // Brep meshing proof
          try{
            const isBrepLike = !!(geom && (geom?.constructor?.name === 'Brep' || typeof geom?.faces === 'function' || typeof geom?.toBrep === 'function'))
            if (isBrepLike){
              const facesCount = (()=>{ try{ const f=geom.faces?.(); return f?.count }catch{return undefined} })()
              try{ console.log('Brep faces count:', facesCount) }catch{}
              const brepObj = (geom?.constructor?.name === 'Brep' || typeof geom?.faces === 'function') ? geom : (typeof geom?.toBrep === 'function' ? geom.toBrep(true) : null)
              if (brepObj){
                const mArr = meshArrayFromBrep(brepObj)
                console.log('Configurator brep meshed:', true, 'len:', mArr.length)
                for (const m of mArr){ scenes[0].group.add(rhinoMeshToThree(m)) }
              }
            } else if (geom && typeof geom?.toNurbsCurve === 'function'){
              try{ const nurbs = geom.toNurbsCurve(); const pts=nurbs.points(); const arr=[]; for (let k=0;k<pts.count;k++){ const p=pts.get(k).location; arr.push(new THREE.Vector3(p.x,p.y,p.z)) } const g=new THREE.BufferGeometry().setFromPoints(arr); const lm=new THREE.LineBasicMaterial({ color:0x333333 }); scenes[0].group.add(new THREE.Line(g,lm)) }catch{}
            }
          }catch{}
        }
      }catch{}
      const tree = cfg.InnerTree || {}
      for (const path in tree){ for (const item of (tree[path]||[])) addItemDataToGroup(item.data, scenes[0].group) }
    }
  }catch{}

  // flush doc only for active viewer (manually mesh Breps)
  if (doc && doc.objects().count > 0){
    try{
      const objects = doc.objects()
      for (let i=0; i<objects.count; i++){
        const ro = objects.get(i)
        const geo = ro.geometry()
        if (!geo) continue
        if (geo.objectType === rhino.ObjectType.Brep){
          const meshes = meshArrayFromBrep(geo)
          for (let j=0; j<meshes.length; j++){ scenes[0].group.add(rhinoMeshToThree(meshes[j])) }
        } else if (geo.objectType === rhino.ObjectType.Mesh){
          scenes[0].group.add(rhinoMeshToThree(geo))
        } else if (geo.objectType === rhino.ObjectType.Curve){
          try{
            const nurbs = geo.toNurbsCurve(); const pts = nurbs.points(); const arr=[]
            for (let k=0;k<pts.count;k++){ const p=pts.get(k).location; arr.push(new THREE.Vector3(p.x,p.y,p.z)) }
            const g=new THREE.BufferGeometry().setFromPoints(arr); const m=new THREE.LineBasicMaterial({ color:0x333333 });
            scenes[0].group.add(new THREE.Line(g,m))
          }catch{}
        } else if (geo.objectType === rhino.ObjectType.Point){
          try{
            const p = geo.location || geo
            const sph = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), new THREE.MeshStandardMaterial({ color:0x0070f3 }))
            sph.position.set(p.x,p.y,p.z); scenes[0].group.add(sph)
          }catch{}
        }
      }
    }catch{}
  }

  // fit only active view
  fitView(scenes[0])
  try{ console.log('Configurator viewer stats:', viewerStats(scenes[0])) }catch{}

  // Fallback: if nothing visible yet, try alternate outputs (case-insensitive)
  const hasMesh = (()=>{ let ok=false; scenes[0].scene.traverse(o=>{ if(o.isMesh) ok=true }); return ok })()
  if (!hasMesh){
    try{
      const values2 = result.values || []
      const map = {}
      for (const entry of values2){ map[(entry.ParamName||'').toLowerCase()] = entry.InnerTree || {} }
      const tryKeys = ['rh_out:configurator','rh_out:hyperboloid','rh_out:panels','rh_out:positive']
      for (const key of tryKeys){
        const tree = map[key]; if (!tree) continue
        for (const path in tree){ for (const item of (tree[path]||[])) addItemDataToGroup(item.data, scenes[0].group) }
      }
      fitView(scenes[0])
    }catch{}
  }

  // Final fallback: render anything that looks like geometry from any output
  const hasMesh2 = (()=>{ let ok=false; scenes[0].scene.traverse(o=>{ if(o.isMesh) ok=true }); return ok })()
  if (!hasMesh2){
    try{
      for (const entry of (result.values||[])){
        const tree = entry.InnerTree || {}
        for (const path in tree){ for (const item of (tree[path]||[])) addItemDataToGroup(item.data, scenes[0].group) }
      }
      fitView(scenes[0])
    }catch{}
  }

  // Additionally, explicitly render Configurator + hyperboloid into viewer 1 from all branches
  try{
    const map = {}
    for (const entry of (result.values||[])) map[(entry.ParamName||'').toLowerCase()] = entry.InnerTree||{}
    const renderKeyToViewer = (viewerIdx, key)=>{
      const tree = map[(key||'').toLowerCase()]; if (!tree) return
      for (const path in tree){ for (const item of (tree[path]||[])) addItemDataToGroup(item.data, scenes[viewerIdx].group) }
    }
    renderKeyToViewer(0, 'RH_OUT:Configurator')
    renderKeyToViewer(0, 'RH_OUT:hyperboloid')
    // Also try panels to ensure visible geometry appears
    renderKeyToViewer(0, 'RH_OUT:panels')
    fitView(scenes[0])
  }catch{}
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
  const geometry = new THREE.BufferGeometry()
  const vertices = rMesh.vertices()
  const faces = rMesh.faces()
  const positions = []
  const addTri = (va,vb,vc)=>{ positions.push(va.x,va.y,va.z, vb.x,vb.y,vb.z, vc.x,vc.y,vc.z) }
  for (let i=0; i<faces.count; i++){
    const f = faces.get(i)
    const a = vertices.get(f.A ?? f.a), b = vertices.get(f.B ?? f.b), c = vertices.get(f.C ?? f.c)
    const isTri = (typeof f.isTriangle === 'boolean') ? f.isTriangle : (f.IsTriangle === true)
    if (isTri){
      addTri(a,b,c)
    } else {
      const d = vertices.get(f.D ?? f.d)
      addTri(a,b,c); addTri(a,c,d)
    }
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions,3))
  geometry.computeVertexNormals()
  const material = new THREE.MeshStandardMaterial({ color: 0x6b8cff, metalness:0.05, roughness:0.85, side: THREE.DoubleSide })
  return new THREE.Mesh(geometry, material)
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

