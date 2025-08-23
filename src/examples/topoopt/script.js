import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Rhino3dmLoader } from 'three/examples/jsm/loaders/3DMLoader'
import rhino3dm from 'rhino3dm'

const definitionName = 'TopoOpt.gh'

let scene, camera, renderer, controls
let doc

const rhino = await rhino3dm()
console.log('Loaded rhino3dm.')

init()

document.getElementById('solve').onclick = () => compute()
document.getElementById('reset').onclick = () => { controls.reset() }

async function compute() {
  showSpinner(true)
  setStatus('Solving…')

  const params = getParams()
  const url = new URL(`/solve/${definitionName}`, window.location.origin)
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, String(v)))

  try {
    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    const json = await res.json()
    collectResults(json)
    setStatus('Complete')
  } catch (err) {
    console.error(err)
    setStatus('Error: ' + err.message)
  } finally {
    showSpinner(false)
  }
}

function getParams() {
  return {
    'links': parseInt(document.getElementById('links').value, 10),
    'spacing': parseFloat(document.getElementById('spacing').value),
    'tolerance': parseFloat(document.getElementById('tolerance').value),
    'round': parseInt(document.getElementById('round').value, 10),
    'pipe width': parseFloat(document.getElementById('pipe width').value),
    'segment': parseInt(document.getElementById('segment').value, 10),
    'cube': parseInt(document.getElementById('cube').value, 10),
    'smooth': parseInt(document.getElementById('smooth').value, 10)
  }
}

function collectResults(responseJson) {
  const values = responseJson.values

  if (doc) doc.delete()
  doc = new rhino.File3dm()

  for (let i = 0; i < values.length; i++) {
    for (const path in values[i].InnerTree) {
      const branch = values[i].InnerTree[path]
      for (let j = 0; j < branch.length; j++) {
        const rhinoObject = decodeItem(branch[j])
        if (rhinoObject !== null) doc.objects().add(rhinoObject, null)
      }
    }
  }

  if (doc.objects().count < 1) {
    console.error('No rhino objects to load!')
    return
  }

  const loader = new Rhino3dmLoader()
  loader.setLibraryPath('https://unpkg.com/rhino3dm@8.0.0-beta/')

  const buffer = new Uint8Array(doc.toByteArray()).buffer
  loader.parse(buffer, function (object) {
    // clear non-lights
    scene.traverse(child => { if (!child.isLight && child !== controls) scene.remove(child) })
    object.traverse(child => { if (child.material) child.material.wireframe = true })
    scene.add(object)
    zoomCameraToSelection(camera, controls, scene.children)
  }, (error) => console.error(error))
}

function decodeItem(item) {
  const data = JSON.parse(item.data)
  if (item.type === 'System.String') {
    try { return rhino.DracoCompression.decompressBase64String(data) } catch {}
  } else if (typeof data === 'object') {
    return rhino.CommonObject.decode(data)
  }
  return null
}

function init() {
  THREE.Object3D.DefaultUp = new THREE.Vector3(0,0,1)
  scene = new THREE.Scene()
  scene.background = new THREE.Color('whitesmoke')

  camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 1, 2000)
  camera.position.set(40,-40,30)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)

  scene.add(new THREE.DirectionalLight(0xffffff, 2))
  scene.add(new THREE.AmbientLight())

  window.addEventListener('resize', onWindowResize, false)
  animate()
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

function animate() {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

function zoomCameraToSelection(camera, controls, selection, fitOffset = 1.2) {
  const box = new THREE.Box3()
  for (const object of selection) { if (object.isLight) continue; box.expandByObject(object) }
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  const maxSize = Math.max(size.x, size.y, size.z)
  const fitHeightDistance = maxSize / (2 * Math.atan(Math.PI * camera.fov / 360))
  const fitWidthDistance = fitHeightDistance / camera.aspect
  const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance)
  const direction = controls.target.clone().sub(camera.position).normalize().multiplyScalar(distance)
  controls.maxDistance = distance * 10
  controls.target.copy(center)
  camera.near = distance / 100
  camera.far = distance * 100
  camera.updateProjectionMatrix()
  camera.position.copy(controls.target).sub(direction)
  controls.update()
}

function showSpinner(enable){ document.getElementById('loader').style.display = enable ? 'block' : 'none' }
function setStatus(msg){ document.getElementById('status').textContent = msg }


