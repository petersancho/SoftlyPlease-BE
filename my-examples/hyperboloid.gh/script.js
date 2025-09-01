import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Rhino3dmLoader } from 'three/examples/jsm/loaders/3DMLoader'
import rhino3dm from 'rhino3dm'

const loader = new Rhino3dmLoader()
loader.setLibraryPath('https://cdn.jsdelivr.net/npm/rhino3dm@8.17.0/')

let rhino
await (rhino3dm().then(m=>{ rhino = m }))

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
  const ids = ['move_a','move_b','elipse_x','elipse_y','twist_configurator_rings','configurator_height']
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
  const inputs = getInputs()
  const payload = { definition: 'Hyperboloid.ghx', inputs }
  const res = await fetch('/solve-hyperboloid', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
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
  try{ console.log('Hyperboloid ParamNames:', values.map(v=>({name:v.ParamName, count:Object.values(v.InnerTree||{}).reduce((a,b)=>a+(b?.length||0),0)}))) }catch{}
  for (const v of scenes){
    if (v.group){ v.scene.remove(v.group); disposeGroup(v.group); v.group = null }
    v.group = new THREE.Group(); v.scene.add(v.group)
  }

  const doc = rhino ? new rhino.File3dm() : null

  for (const out of values){
    const name = out.ParamName || ''
    const tree = out.InnerTree || {}
    for (const path in tree){
      for (const item of tree[path]||[]){
        try{
          const data = JSON.parse(item.data)
          // route to matching viewer(s)
          scenes.forEach((v,idx)=>{
            if (!viewers[idx].filter(name)) return
            if (data && data.encoded){
              try{
                const bytes = new Uint8Array(base64ToArrayBuffer(data.encoded))
                const doc3dm = rhino.File3dm.fromByteArray(bytes)
                if (doc3dm){
                  const objs = doc3dm.objects()
                  for (let i=0; i<objs.count; i++){
                    const ro = objs.get(i)
                    const geo = ro.geometry(); if (!geo) continue
                    addRhinoGeometryToGroup(geo, v.group)
                  }
                }
              }catch{}
            } else if (data && rhino){
              const rhObj = rhino.CommonObject.decode(data)
              if (rhObj){ addRhinoGeometryToGroup(rhObj, v.group) }
            }
          })
        }catch{}
      }
    }
  }

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

  // Fallback: if nothing visible yet, try alternate outputs
  const hasMesh = (()=>{ let ok=false; scenes[0].scene.traverse(o=>{ if(o.isMesh) ok=true }); return ok })()
  if (!hasMesh){
    try{
      const values2 = result.values || []
      const map = {}
      for (const entry of values2){ map[entry.ParamName] = entry.InnerTree || {} }
      const tryKeys = ['RH_OUT:hyperboloid','hyperboloid','RH_OUT:panels','panels','RH_OUT:positive','positive']
      for (const key of tryKeys){
        const tree = map[key]; if (!tree) continue
        for (const path in tree){
          for (const item of (tree[path]||[])){
            try{
              const data = JSON.parse(item.data)
              if (data.encoded){
                const bytes = new Uint8Array(base64ToArrayBuffer(data.encoded))
                const d = rhino.File3dm.fromByteArray(bytes)
                if (d){ const objs=d.objects(); for (let i=0;i<objs.count;i++){ const ro=objs.get(i); const geo=ro.geometry(); if(!geo) continue; if (geo.objectType === rhino.ObjectType.Brep){ const ms=meshArrayFromBrep(geo); for(let j=0;j<ms.length;j++){ scenes[0].group.add(rhinoMeshToThree(ms[j])) } } else if (geo.objectType === rhino.ObjectType.Mesh){ scenes[0].group.add(rhinoMeshToThree(geo)) } else if (geo.objectType === rhino.ObjectType.Curve){ try{ const nurbs=geo.toNurbsCurve(); const pts=nurbs.points(); const arr=[]; for (let k=0;k<pts.count;k++){ const p=pts.get(k).location; arr.push(new THREE.Vector3(p.x,p.y,p.z)) } const g=new THREE.BufferGeometry().setFromPoints(arr); const m=new THREE.LineBasicMaterial({ color:0x333333 }); scenes[0].group.add(new THREE.Line(g,m)) }catch{} } else if (geo.objectType === rhino.ObjectType.Point){ try{ const p=geo.location||geo; const sph=new THREE.Mesh(new THREE.SphereGeometry(0.5,12,8), new THREE.MeshStandardMaterial({ color:0x0070f3 })); sph.position.set(p.x,p.y,p.z); scenes[0].group.add(sph) }catch{} } } }
              } else {
                const obj = rhino.CommonObject.decode(data)
                if (obj){ if (obj instanceof rhino.Brep){ const ms=meshArrayFromBrep(obj); for(let j=0;j<ms.length;j++){ scenes[0].group.add(rhinoMeshToThree(ms[j])) } } else if (obj instanceof rhino.Mesh){ scenes[0].group.add(rhinoMeshToThree(obj)) } }
              }
            }catch{}
          }
        }
      }
      fitView(scenes[0])
    }catch{}
  }

  // Additionally, explicitly render Configurator + hyperboloid into viewer 1 from all branches
  try{
    const map = {}
    for (const entry of (result.values||[])) map[entry.ParamName] = entry.InnerTree||{}
    const renderKeyToViewer = (viewerIdx, key)=>{
      const tree = map[key]; if (!tree) return
      for (const path in tree){
        for (const item of (tree[path]||[])){
          try{
            const data = JSON.parse(item.data)
            if (data && data.encoded){
              const bytes = new Uint8Array(base64ToArrayBuffer(data.encoded))
              const file = rhino.File3dm.fromByteArray(bytes)
              if (file){
                const objs = file.objects()
                for (let i=0;i<objs.count;i++){
                  const ro = objs.get(i); const geo = ro.geometry(); if (!geo) continue
                  if (geo instanceof rhino.Brep){
                    const ms = meshArrayFromBrep(geo)
                    for (let j=0;j<ms.length;j++){ scenes[viewerIdx].group.add(rhinoMeshToThree(ms[j])) }
                  } else if (geo instanceof rhino.Mesh){ scenes[viewerIdx].group.add(rhinoMeshToThree(geo)) }
                }
              }
            } else {
              const obj = rhino.CommonObject.decode(data)
              if (obj){
                if (obj instanceof rhino.Brep){
                  const ms = meshArrayFromBrep(obj)
                  for (let j=0;j<ms.length;j++){ scenes[viewerIdx].group.add(rhinoMeshToThree(ms[j])) }
                } else if (obj instanceof rhino.Mesh){ scenes[viewerIdx].group.add(rhinoMeshToThree(obj)) }
              }
            }
          }catch{}
        }
      }
    }
    renderKeyToViewer(0, 'RH_OUT:Configurator')
    renderKeyToViewer(0, 'RH_OUT:hyperboloid')
    // Also try panels to ensure visible geometry appears
    renderKeyToViewer(0, 'RH_OUT:panels')
    fitView(scenes[0])
  }catch{}
}

function meshArrayFromBrep(brep){
  const meshes = rhino.Mesh.createFromBrep(brep, rhino.MeshingParameters.default)
  const out = []
  if (!meshes) return out
  if (Array.isArray(meshes)) return meshes
  const n = (typeof meshes.length === 'number') ? meshes.length : (typeof meshes.count === 'number' ? meshes.count : 0)
  for (let i=0;i<n;i++){
    const m = (typeof meshes.get === 'function') ? meshes.get(i) : meshes[i]
    if (m) out.push(m)
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
    const t = geo.objectType
    if (t === rhino.ObjectType.Brep){
      const meshes = meshArrayFromBrep(geo)
      for (let j=0;j<meshes.length;j++){ group.add(rhinoMeshToThree(meshes[j])) }
      return
    }
    if (t === rhino.ObjectType.Mesh){ group.add(rhinoMeshToThree(geo)); return }
    if (t === rhino.ObjectType.Curve){
      try{ const nurbs = geo.toNurbsCurve(); const pts=nurbs.points(); const arr=[]; for (let k=0;k<pts.count;k++){ const p=pts.get(k).location; arr.push(new THREE.Vector3(p.x,p.y,p.z)) } const g=new THREE.BufferGeometry().setFromPoints(arr); const m=new THREE.LineBasicMaterial({ color:0x333333 }); group.add(new THREE.Line(g,m)) }catch{}
      return
    }
    if (t === rhino.ObjectType.Point){
      try{ const p=geo.location||geo; const sph=new THREE.Mesh(new THREE.SphereGeometry(0.5,12,8), new THREE.MeshStandardMaterial({ color:0x0070f3 })); sph.position.set(p.x,p.y,p.z); group.add(sph) }catch{}
      return
    }
  }catch{}
}

// initial solve
onSolve().catch(console.error)

