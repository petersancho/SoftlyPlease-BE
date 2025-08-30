import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Rhino3dmLoader } from 'three/examples/jsm/loaders/3DMLoader'
import rhino3dm from 'rhino3dm'

const canvas = document.getElementById('view')
const statusEl = document.getElementById('status')
const solveBtn = document.getElementById('solveBtn')

let scene, camera, renderer, controls
const rhinoLoader = new Rhino3dmLoader()
rhinoLoader.setLibraryPath('https://cdn.jsdelivr.net/npm/rhino3dm@8.17.0/')
let rhino

initRhino()

init()
solveBtn.addEventListener('click', onSolve)

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
    square: document.getElementById('square').checked,
    strutsize: Number(document.getElementById('strutsize').value),
    segment: Number(document.getElementById('segment').value),
    cubecorners: document.getElementById('cubecorners').checked,
    smooth: document.getElementById('smooth').checked
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
  // Expect RH_OUT:mesh (first output)
  const tree = values[0].InnerTree
  for (const path in tree){
    const branch = tree[path]
    for (const item of branch){
      try{
        const data = JSON.parse(item.data)
        // Support both encoded 3dm strings and RhinoJSON
        if (data.encoded){
          const buffer = base64ToArrayBuffer(data.encoded)
          rhinoLoader.parse(buffer, object=>{
            object.traverse(child=>{
              if (child.isMesh){
                child.material = new THREE.MeshStandardMaterial({ color: 0x8888ff, metalness:0.05, roughness:0.8 })
              }
            })
            scene.add(object)
          })
        } else if (typeof data === 'object') {
          if (!rhino) return
          const rhinoObj = rhino.CommonObject.decode(data)
          if (rhinoObj){
            const buffer = new Uint8Array(rhinoObj.toByteArray()).buffer
            rhinoLoader.parse(buffer, object=>{
              object.traverse(child=>{
                if (child.isMesh){
                  child.material = new THREE.MeshStandardMaterial({ color: 0x8888ff, metalness:0.05, roughness:0.8 })
                }
              })
              scene.add(object)
            })
          }
        }
      } catch(e){ /* ignore non-geometry items */ }
    }
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

function debounce(fn, delay){
  let t
  return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn.apply(null,args), delay) }
}

