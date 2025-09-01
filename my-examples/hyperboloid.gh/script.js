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
  return {
    'RH_IN:move_a': Number(document.getElementById('move_a').value),
    'RH_IN:move_b': Number(document.getElementById('move_b').value),
    'RH_IN:elipse_x': Number(document.getElementById('elipse_x').value),
    'RH_IN:elipse_y': Number(document.getElementById('elipse_y').value),
    'RH_IN:twist_configurator_rings': Number(document.getElementById('twist_configurator_rings').value),
    'RH_IN:configurator_height': Number(document.getElementById('configurator_height').value),
    'RH_IN:move_cone_a': Number(document.getElementById('move_cone_a').value),
    'RH_IN:move_cone_b': Number(document.getElementById('move_cone_b').value),
    'RH_IN:move_cone_c': Number(document.getElementById('move_cone_c').value),
    'RH_IN:array_panels': Number(document.getElementById('array').value)
  }
}

function bindOutputs(){
  const ids = ['move_a','move_b','elipse_x','elipse_y','twist_configurator_rings','configurator_height','move_cone_a','move_cone_b','move_cone_c','array']
  for (const id of ids){
    const el = document.getElementById(id)
    const out = document.getElementById(id+'Val')
    const evt = 'input'
    el.addEventListener(evt, ()=>{ out.textContent = String(el.value); onSolve() })
    out.textContent = String(el.value)
  }
}
bindOutputs()

async function onSolve(){
  const inputs = getInputs()
  const payload = { definition: 'hyperboloid.gh', inputs }
  const res = await fetch('/solve', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
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
              const buffer = base64ToArrayBuffer(data.encoded)
              loader.parse(buffer, (obj)=>{ v.group.add(obj) })
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

  // flush doc to each viewer if any non-mesh objects accumulated
  if (doc && doc.objects().count > 0){
    const buffer = new Uint8Array(doc.toByteArray()).buffer
    scenes.forEach(v=> loader.parse(buffer, (obj)=>{ v.group.add(obj) }))
  }

  // fit each view
  scenes.forEach(v=> fitView(v))
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

