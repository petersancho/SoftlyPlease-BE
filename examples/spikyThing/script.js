import rhino3dm from 'https://cdn.jsdelivr.net/npm/rhino3dm@8.17.0/rhino3dm.module.js'
/* global THREE */

const loader = window.__rhino3dmLoader
const definition = 'BranchNodeRnd.gh'

// UI
const count_slider = document.getElementById('count')
const radius_slider = document.getElementById('radius')
const length_slider = document.getElementById('length')
for (const el of [count_slider, radius_slider, length_slider]) {
  el.addEventListener('mouseup', onChange, false)
  el.addEventListener('touchend', onChange, false)
}

// Rhino init and first compute
let doc
const rhino = await rhino3dm()
init()
compute()

async function compute () {
  const data = { definition, inputs: {
    Count: count_slider.valueAsNumber,
    Radius: radius_slider.valueAsNumber,
    Length: length_slider.valueAsNumber
  } }
  try {
    const res = await fetch('/solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error(await res.text())
    const json = await res.json()
    collect(json)
  } catch (e) {
    console.error(e)
  }
}

function collect (responseJson) {
  const values = responseJson.values
  if (doc) doc.delete()
  doc = new rhino.File3dm()

  for (let i = 0; i < values.length; i++) {
    for (const path in values[i].InnerTree) {
      for (const item of values[i].InnerTree[path]) {
        const data = JSON.parse(item.data)
        if (item.type === 'System.String') {
          try { doc.objects().add(rhino.DracoCompression.decompressBase64String(data), null) } catch {}
        } else if (typeof data === 'object') {
          const obj = rhino.CommonObject.decode(data)
          if (obj) doc.objects().add(obj, null)
        }
      }
    }
  }

  if (doc.objects().count < 1) { console.error('No objects'); show(false); return }

  const buffer = new Uint8Array(doc.toByteArray()).buffer
  loader.parse(buffer, (object) => {
    object.traverse(child => { if (child.material) child.material = new THREE.MeshBasicMaterial({ vertexColors: true }) })
    // clear scene except lights
    scene.traverse(child => { if (!child.isLight) scene.remove(child) })
    scene.add(object)
    show(false)
  }, (err) => console.error(err))
}

function show (on) { document.getElementById('loader').style.display = on ? 'block' : 'none' }
function onChange () { show(true); compute() }

// three.js boilerplate
let scene, camera, renderer, controls
function init () {
  THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1)
  scene = new THREE.Scene()
  scene.background = new THREE.Color(1, 1, 1)
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000)
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)
  controls = new THREE.OrbitControls(camera, renderer.domElement)
  camera.position.z = 50
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })
  ;(function animate () { requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera) })()
}
