/* eslint no-undef: "off", no-unused-vars: "off" */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Rhino3dmLoader } from 'three/examples/jsm/loaders/3DMLoader'
import rhino3dm from 'rhino3dm'

// set up loader for converting the results to threejs
const loader = new Rhino3dmLoader()
loader.setLibraryPath( 'https://unpkg.com/rhino3dm@8.0.0-beta3/' )

const definition = 'topological-optimization.gh'

// setup input change events
const tolerance_slider = document.getElementById( 'tolerance' )
tolerance_slider.addEventListener( 'mouseup', onSliderChange, false )
tolerance_slider.addEventListener( 'touchend', onSliderChange, false )
const round_slider = document.getElementById( 'round' )
round_slider.addEventListener( 'mouseup', onSliderChange, false )
round_slider.addEventListener( 'touchend', onSliderChange, false )
const pipe_width_slider = document.getElementById( 'pipe_width' )
pipe_width_slider.addEventListener( 'mouseup', onSliderChange, false )
pipe_width_slider.addEventListener( 'touchend', onSliderChange, false )
const segment_slider = document.getElementById( 'segment' )
segment_slider.addEventListener( 'mouseup', onSliderChange, false )
segment_slider.addEventListener( 'touchend', onSliderChange, false )
const cube_checkbox = document.getElementById( 'cube' )
cube_checkbox.addEventListener( 'change', onSliderChange, false )
const smooth_slider = document.getElementById( 'smooth' )
smooth_slider.addEventListener( 'mouseup', onSliderChange, false )
smooth_slider.addEventListener( 'touchend', onSliderChange, false )
const min_r_slider = document.getElementById( 'min_r' )
min_r_slider.addEventListener( 'mouseup', onSliderChange, false )
min_r_slider.addEventListener( 'touchend', onSliderChange, false )
const max_R_slider = document.getElementById( 'max_R' )
max_R_slider.addEventListener( 'mouseup', onSliderChange, false )
max_R_slider.addEventListener( 'touchend', onSliderChange, false )
const links_slider = document.getElementById( 'links' )
links_slider.addEventListener( 'mouseup', onSliderChange, false )
links_slider.addEventListener( 'touchend', onSliderChange, false )

let _threeMesh, _threeMaterial, doc
let scene, camera, renderer, controls

const rhino = await rhino3dm()
console.log('Loaded rhino3dm.')

init()
compute()

/**
 * Call appserver
 */
async function compute(){

  showSpinner(true)

  // initialise 'data' object that will be used by compute()
  const data = {
    definition: definition,
    inputs: {
      'tolerance':tolerance_slider.valueAsNumber,
      'round':round_slider.valueAsNumber,
      'pipe_width':pipe_width_slider.valueAsNumber,
      'segment':segment_slider.valueAsNumber,
      'cube':cube_checkbox.checked,
      'smooth':smooth_slider.valueAsNumber,
      'min_r':min_r_slider.valueAsNumber,
      'max_R':max_R_slider.valueAsNumber,
      'links':links_slider.valueAsNumber
    }
  }

  console.log(data.inputs)

  const request = {
    'method':'POST',
    'body': JSON.stringify(data),
    'headers': {'Content-Type': 'application/json'}
  }

  try {
    const response = await fetch('/solve', request)

    if(!response.ok)
      throw new Error(response.statusText)

    const responseJson = await response.json()

    // DEBUG: Log everything
    console.log('Full response:', responseJson)
    console.log('Response values:', responseJson.values)
    console.log('Values length:', responseJson.values ? responseJson.values.length : 'no values')

    if (!responseJson.values || responseJson.values.length === 0) {
      console.error('No values in response!')
      showSpinner(false)
      return
    }

    // Check if we have the expected structure
    const firstValue = responseJson.values[0]
    console.log('First value:', firstValue)
    console.log('InnerTree:', firstValue.InnerTree)

    if (!firstValue.InnerTree || !firstValue.InnerTree['{0}']) {
      console.error('Unexpected response structure! InnerTree or {0} missing')
      showSpinner(false)
      return
    }

    // process mesh
    const rhinoObject = decodeItem(firstValue.InnerTree['{0}'][0])
    console.log('Decoded rhino object:', rhinoObject)

    if (!rhinoObject) {
      console.error('Failed to decode rhino object!')
      showSpinner(false)
      return
    }

    let threeMesh = meshToThreejs(rhinoObject, new THREE.MeshBasicMaterial({vertexColors:true}))
    console.log('Three.js mesh:', threeMesh)

    if (!threeMesh) {
      console.error('Failed to create three.js mesh!')
      showSpinner(false)
      return
    }

    replaceCurrentMesh(threeMesh)

    // hide spinner
    showSpinner(false)

  } catch(error){
    console.error('Error in compute():', error)
    showSpinner(false)
  }
}

/**
* Attempt to decode data tree item to rhino geometry
*/
function decodeItem(item) {
  const data = JSON.parse(item.data)
  if (item.type === 'System.String') {
    // hack for draco meshes
    try {
        return rhino.DracoCompression.decompressBase64String(data)
    } catch {} // ignore errors (maybe the string was just a string...)
  } else if (typeof data === 'object') {
    return rhino.CommonObject.decode(data)
  }
  return null
}

function meshToThreejs (mesh, material) {
  console.log('Converting rhino mesh to three.js:', mesh)
  console.log('Mesh type:', typeof mesh)
  console.log('Mesh methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(mesh)))

  if (!mesh || typeof mesh.toThreejsJSON !== 'function') {
    console.error('Invalid mesh or missing toThreejsJSON method!')
    return null
  }

  try {
    const threejsJson = mesh.toThreejsJSON()
    console.log('Three.js JSON:', threejsJson)

    let loader = new THREE.BufferGeometryLoader()
    var geometry = loader.parse(threejsJson)
    console.log('Created geometry:', geometry)

    const threeMesh = new THREE.Mesh(geometry, material)
    console.log('Created three.js mesh:', threeMesh)
    return threeMesh
  } catch (error) {
    console.error('Error converting mesh:', error)
    return null
  }
}

function replaceCurrentMesh (threeMesh) {
  console.log('Replacing current mesh with:', threeMesh)
  console.log('Scene before:', scene.children.length, 'children')

  if (_threeMesh) {
    console.log('Removing previous mesh')
    scene.remove(_threeMesh)
    _threeMesh.geometry.dispose()
  }

  _threeMesh = threeMesh
  scene.add(_threeMesh)

  console.log('Scene after:', scene.children.length, 'children')
  console.log('Added mesh to scene:', _threeMesh)
}

/**
 * Called when a slider value changes in the UI. Collect all of the
 * slider values and call compute to solve for a new scene
 */
function onSliderChange () {
  // show spinner
  showSpinner(true)
  compute()
}

/**
 * Shows or hides the loading spinner
 */
 function showSpinner(enable) {
  if (enable)
    document.getElementById('loader').style.display = 'block'
  else
    document.getElementById('loader').style.display = 'none'
}

function init () {

  // Rhino models are z-up, so set this as the default
  THREE.Object3D.DefaultUp = new THREE.Vector3( 0, 0, 1 );

  scene = new THREE.Scene()
  scene.background = new THREE.Color(1,1,1)
  camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 1, 1000 )
  camera.position.x = 50
  camera.position.y = 50
  camera.position.z = 50

  // add a directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff)
  directionalLight.intensity = 2
  scene.add(directionalLight)

  const ambientLight = new THREE.AmbientLight()
  scene.add(ambientLight)

  renderer = new THREE.WebGLRenderer({antialias: true})
  renderer.setPixelRatio( window.devicePixelRatio )
  renderer.setSize( window.innerWidth, window.innerHeight )
  document.body.appendChild(renderer.domElement)

  controls = new OrbitControls( camera, renderer.domElement  )

  window.addEventListener( 'resize', onWindowResize, false )

  animate()

  // DEBUG: Basic scene setup
  console.log('Scene initialized:', scene)
  console.log('Camera initialized:', camera)
  console.log('Renderer initialized:', renderer)
  console.log('Controls initialized:', controls)
}

/**
 * Animate the scene
 */
function animate(){
  requestAnimationFrame( animate )
  renderer.render( scene, camera )
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize( window.innerWidth, window.innerHeight )
  animate()
}

/**
 * Helper function that behaves like rhino's "zoom to selection", but for three.js!
 */
 function zoomCameraToSelection( camera, controls, selection, fitOffset = 1.2 ) {

  const box = new THREE.Box3();

  for( const object of selection ) {
    if (object.isLight) continue
    box.expandByObject( object );
  }

  const size = box.getSize( new THREE.Vector3() );
  const center = box.getCenter( new THREE.Vector3() );

  const maxSize = Math.max( size.x, size.y, size.z );
  const fitHeightDistance = maxSize / ( 2 * Math.atan( Math.PI * camera.fov / 360 ) );
  const fitWidthDistance = fitHeightDistance / camera.aspect;
  const distance = fitOffset * Math.max( fitHeightDistance, fitWidthDistance );

  const direction = controls.target.clone()
    .sub( camera.position )
    .normalize()
    .multiplyScalar( distance );
  controls.maxDistance = distance * 10;
  controls.target.copy( center );

  camera.near = distance / 100;
  camera.far = distance * 100;
  camera.updateProjectionMatrix();
  camera.position.copy( controls.target ).sub(direction);

  controls.update();

}
