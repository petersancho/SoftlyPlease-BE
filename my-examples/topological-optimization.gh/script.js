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
let currentSolve = { controller: null, seq: 0 }
let resultGroup = null

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
    links: Math.round(Number(document.getElementById('links').value)),
    minr: Number(document.getElementById('minr').value),
    maxr: Number(document.getElementById('maxr').value),
    thickness: Math.round(Number(document.getElementById('thickness').value)),
    square: Math.round(Number(document.getElementById('square').value)),
    strutsize: Number(document.getElementById('strutsize').value),
    segment: Math.round(Number(document.getElementById('segment').value)),
    cubecorners: Number(document.getElementById('cubecorners').checked),
    smooth: Number(document.getElementById('smooth').value)
  }
}

async function onSolve(){
  // cancel any in-flight request
  if (currentSolve.controller) {
    currentSolve.controller.abort()
  }
  const controller = new AbortController()
  const seq = ++currentSolve.seq
  currentSolve.controller = controller

  try{
    const t0 = performance.now()
    statusEl.textContent = 'Solving...'
    const ins = getInputs()
    // Ensure booleans/numbers are typed as expected by GH
    const inputs = { ...ins }
    // Be liberal in what we send: include common aliases to match GH input names
    inputs['Thickness'] = inputs.thickness
    inputs['RH_IN:thickness'] = inputs.thickness
    const payload = { definition: 'topological-optimization.gh', inputs }

    const res = await fetch('/solve', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    })
    const txt = await res.text()
    if (seq !== currentSolve.seq) return // outdated
    if (!res.ok) throw new Error(txt || ('HTTP '+res.status))
    const json = JSON.parse(txt)
    renderResult(json, seq)
    const dt = Math.round(performance.now() - t0)
    statusEl.textContent = `Done (${dt} ms)`
  } catch(err){
    if (err.name === 'AbortError') return
    console.error(err)
    statusEl.textContent = 'Error: ' + (err.message||String(err))
  }
}

function renderResult(result, seq){
  // ignore stale results
  if (seq !== currentSolve.seq) return

  // remove and dispose previous group
  if (resultGroup){
    scene.remove(resultGroup)
    resultGroup.traverse(child=>{
      if (child.geometry) child.geometry.dispose()
      if (child.material){
        if (Array.isArray(child.material)) child.material.forEach(m=>m.dispose())
        else child.material.dispose()
      }
    })
    resultGroup = null
  }
  resultGroup = new THREE.Group()
  scene.add(resultGroup)

  const values = result && result.values ? result.values : []
  if (values.length === 0) return

  // Prefer output whose ParamName mentions "mesh"; otherwise process all
  const outputs = values.filter(v => /mesh/i.test(v.ParamName || ''))
                  .concat(values.filter(v => !/mesh/i.test(v.ParamName || '')))

  // Build a single .3dm doc for RhinoJSON items, and also handle encoded .3dm blobs
  const doc = rhino ? new rhino.File3dm() : null
  let addedAny = false

  const addThreeObject = (object) => {
    // ignore late callbacks from older solves
    if (seq !== currentSolve.seq) return
    object.traverse(child=>{
      if (child.isMesh){
        child.material = new THREE.MeshStandardMaterial({ color: 0x6b8cff, metalness:0.1, roughness:0.85 })
      }
    })
    resultGroup.add(object)
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

  if (doc && doc.objects().count > 0){
    const buffer = new Uint8Array(doc.toByteArray()).buffer
    rhinoLoader.parse(buffer, addThreeObject)
  }

  setTimeout(() => { if (seq === currentSolve.seq) zoomToScene() }, 150)
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
const debounced = debounce(onSolve, 250, { leading:true, trailing:true })
for (const id of inputs){
  const el = document.getElementById(id)
  if (!el) continue
  const evt = (el.type === 'checkbox') ? 'change' : 'input'
  el.addEventListener(evt, debounced)
  // output label binding
  const out = document.getElementById(id+'Val')
  if (out){
    const update = ()=>{ out.textContent = (el.type==='checkbox') ? String(el.checked) : String(el.value) }
    el.addEventListener(evt, update)
    update()
  }
}

// Auto-solve on first paint
onSolve()

function debounce(fn, delay, opts={}){
  let t, leadingCalled = false
  return (...args)=>{
    if (opts.leading && !t && !leadingCalled){
      leadingCalled = true
      fn.apply(null,args)
    }
    clearTimeout(t)
    t=setTimeout(()=>{ leadingCalled = false; if (opts.trailing !== false) fn.apply(null,args) }, delay)
  }
}

function zoomToScene(){
  const box = new THREE.Box3()
  if (resultGroup) box.expandByObject(resultGroup)
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

