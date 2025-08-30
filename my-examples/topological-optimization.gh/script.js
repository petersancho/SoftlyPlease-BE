import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Rhino3dmLoader } from 'three/examples/jsm/loaders/3DMLoader'
import rhino3dm from 'rhino3dm'

const canvas = document.getElementById('view')
const statusEl = document.getElementById('status')
const solveBtn = null

let scene, camera, renderer, controls
const rhinoLoader = new Rhino3dmLoader()
rhinoLoader.setLibraryPath('https://cdn.jsdelivr.net/npm/rhino3dm@8.17.0/')
let rhino

initRhino()

init()

function init(){
  scene = new THREE.Scene()
  scene.background = new THREE.Color('white')
  camera = new THREE.PerspectiveCamera(45, canvas.clientWidth/Math.max(1,canvas.clientHeight), 0.1, 5000)
  camera.position.set(10, -12, 10)
  renderer = new THREE.WebGLRenderer({ antialias:true, canvas })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)
  controls = new OrbitControls(camera, renderer.domElement)
  scene.add(new THREE.HemisphereLight(0xffffff, 0x888888, 1.0))
  const dl = new THREE.DirectionalLight(0xffffff, 0.8)
  dl.position.set(5,5,10)
  scene.add(dl)
  window.addEventListener('resize', ()=>{
    camera.aspect = canvas.clientWidth/Math.max(1,canvas.clientHeight)
    camera.updateProjectionMatrix()
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)
  })
  animate()
}

function animate(){
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

async function fileToBase64(file){
  if (!file) return null
  const buf = await file.arrayBuffer()
  let binary = ''
  const bytes = new Uint8Array(buf)
  const chunk = 0x8000
  for (let i=0; i<bytes.length; i+=chunk){
    const sub = bytes.subarray(i, i+chunk)
    binary += String.fromCharCode.apply(null, sub)
  }
  return btoa(binary)
}

function getInputs(){
  return {
    links: Number(document.getElementById('links').value),
    minr: Number(document.getElementById('minr').value),
    maxr: Number(document.getElementById('maxr').value),
    thickness: Number(document.getElementById('thickness').value),
    square: Number(document.getElementById('square').value),
    strutsize: Number(document.getElementById('strutsize').value),
    segment: Number(document.getElementById('segment').value),
    cubecorners: document.getElementById('cubecorners').checked,
    smooth: Number(document.getElementById('smooth').value)
  }
}

async function onSolve(){
  try{
    statusEl.textContent = 'Solving...'
    // collect inputs, base64 for brep
    const ins = getInputs()
    const payload = { definition: 'topological-optimization.gh', inputs: { ...ins } }
    if (ins.brep){
      payload.inputs.brep = await fileToBase64(ins.brep)
    }
    // POST to appserver
    const res = await fetch('/solve', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
    const txt = await res.text()
    if (!res.ok) throw new Error(txt || ('HTTP '+res.status))
    const json = JSON.parse(txt)
    renderResult(json)
    statusEl.textContent = 'Done'
  } catch(err){
    console.error(err)
    statusEl.textContent = 'Error: ' + (err.message||String(err))
  }
}

function renderResult(result){
  // clear scene (keep lights)
  const toRemove = []
  scene.traverse(obj=>{ if (obj.isMesh) toRemove.push(obj) })
  toRemove.forEach(o=>scene.remove(o))

  const values = result && result.values ? result.values : []
  if (values.length === 0) return

  // Prefer output whose ParamName mentions "mesh"; otherwise process all
  const outputs = values.filter(v => /mesh/i.test(v.ParamName || ''))
                  .concat(values.filter(v => !/mesh/i.test(v.ParamName || '')))

  // Build a single .3dm doc for RhinoJSON items, and also handle encoded .3dm blobs
  const doc = rhino ? new rhino.File3dm() : null
  let addedAny = false

  const addThreeObject = (object) => {
    object.traverse(child=>{
      if (child.isMesh){
        child.material = new THREE.MeshStandardMaterial({ color: 0x6b8cff, metalness:0.1, roughness:0.85 })
      }
    })
    scene.add(object)
    addedAny = true
  }

  for (const out of outputs){
    const tree = out.InnerTree || {}
    for (const path in tree){
      const branch = tree[path] || []
      for (const item of branch){
        try{
          const data = JSON.parse(item.data)
          if (data && typeof data === 'object' && data.encoded){
            // Encoded .3dm string
            const buffer = base64ToArrayBuffer(data.encoded)
            rhinoLoader.parse(buffer, addThreeObject)
          } else if (data && typeof data === 'object' && rhino){
            const rhinoObj = rhino.CommonObject.decode(data)
            if (rhinoObj && doc){
              doc.objects().add(rhinoObj, null)
            }
          }
        } catch { /* ignore non-JSON items */ }
      }
    }
  }

  // If we accumulated a doc, render it once
  if (doc && doc.objects().count > 0){
    const buffer = new Uint8Array(doc.toByteArray()).buffer
    rhinoLoader.parse(buffer, addThreeObject)
  }

  // Zoom to extents after a short tick to allow loader callbacks
  setTimeout(() => zoomToScene(), 150)
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

async function initRhino(){
  rhino = await rhino3dm()
}

// Dynamic solving: debounce sliders/checkboxes
const inputs = ['links','minr','maxr','thickness','square','strutsize','segment','cubecorners','smooth']
const debounced = debounce(onSolve, 350)
for (const id of inputs){
  const el = document.getElementById(id)
  if (!el) continue
  const evt = (el.type === 'checkbox') ? 'change' : 'input'
  el.addEventListener(evt, debounced)
}

// Auto-solve on first paint
onSolve()

function debounce(fn, delay){
  let t
  return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn.apply(null,args), delay) }
}

function zoomToScene(){
  const box = new THREE.Box3()
  scene.traverse(child => { if (child.isMesh) box.expandByObject(child) })
  if (!box.isEmpty()){
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const fitDist = maxDim / (2*Math.tan((Math.PI/180)*camera.fov*0.5))
    camera.near = Math.max(0.1, fitDist/100)
    camera.far  = fitDist*100
    camera.updateProjectionMatrix()
    const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize()
    camera.position.copy(center.clone().add(dir.multiplyScalar(fitDist*1.2)))
    controls.target.copy(center)
    controls.update()
  }
}

