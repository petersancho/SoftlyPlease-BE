import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Rhino3dmLoader } from 'three/examples/jsm/loaders/3DMLoader'
import rhino3dm from 'rhino3dm'

const loader = new Rhino3dmLoader()
loader.setLibraryPath('https://cdn.jsdelivr.net/npm/rhino3dm@8.17.0/')

let rhino
await (rhino3dm().then(m=>{ rhino = m }))

const viewers = [
  { canvas: document.getElementById('viewA'), filter: (name)=> /^RH_OUT:Configurator$/i.test(name) },
  { canvas: document.getElementById('viewB'), filter: (name)=> /^$/i.test(name) },
  { canvas: document.getElementById('viewC'), filter: (name)=> /^$/i.test(name) },
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
  // Step 1: focus on the first RH_IN only
  return {
    'RH_IN:move_a': Number(document.getElementById('move_a').value)
  }
}

function bindOutputs(){
  const ids = ['move_a']
  for (const id of ids){
    const el = document.getElementById(id)
    const out = document.getElementById(id+'Val')
    const evt = 'input'
    el.addEventListener(evt, ()=>{ if (out) out.textContent = String(el.value); onSolve() })
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

function renderResult(result){
  const values = Array.isArray(result.values) ? result.values : []
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
              // Prefer manual decode+meshing for Breps to avoid 3DMLoader missing mesh error
              try{
                const bytes = new Uint8Array(base64ToArrayBuffer(data.encoded))
                const doc3dm = rhino.File3dm.fromByteArray(bytes)
                if (doc3dm){
                  const objs = doc3dm.objects()
                  for (let i=0; i<objs.count; i++){
                    const ro = objs.get(i)
                    const geo = ro.geometry()
                    if (!geo) continue
                    if (geo instanceof rhino.Brep){
                      const meshes = rhino.Mesh.createFromBrep(geo, rhino.MeshingParameters.default)
                      if (meshes){ for (let j=0;j<meshes.length;j++){ v.group.add(rhinoMeshToThree(meshes.get(j))) } }
                    } else if (geo instanceof rhino.Mesh){
                      v.group.add(rhinoMeshToThree(geo))
                    }
                  }
                }
              }catch{}
            } else if (data && rhino){
              const rhObj = rhino.CommonObject.decode(data)
              if (rhObj){
                if (isRhinoMesh(rhObj)){
                  v.group.add(rhinoMeshToThree(rhObj))
                } else if (doc){
                  doc.objects().add(rhObj, null)
                }
              }
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
        if (geo instanceof rhino.Brep){
          const meshes = rhino.Mesh.createFromBrep(geo, rhino.MeshingParameters.default)
          if (meshes){ for (let j=0; j<meshes.length; j++){ scenes[0].group.add(rhinoMeshToThree(meshes.get(j))) } }
        } else if (geo instanceof rhino.Mesh){
          scenes[0].group.add(rhinoMeshToThree(geo))
        }
      }
    }catch{}
  }

  // fit only active view
  fitView(scenes[0])
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
  const addTri = (a,b,c)=>{ positions.push(a[0],a[1],a[2], b[0],b[1],b[2], c[0],c[1],c[2]) }
  for (let i=0; i<faces.count; i++){
    const f = faces.get(i)
    const a = vertices.get(f.A), b = vertices.get(f.B), c = vertices.get(f.C)
    const d = f.IsTriangle ? null : vertices.get(f.D)
    addTri(a,b,c); if (d) addTri(a,c,d)
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions,3))
  geometry.computeVertexNormals()
  return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x6b8cff, metalness:0.05, roughness:0.85 }))
}

// initial solve
onSolve().catch(console.error)

