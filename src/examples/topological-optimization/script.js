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
const thickness_slider = document.getElementById( 'thickness' )
thickness_slider.addEventListener( 'mouseup', onSliderChange, false )
thickness_slider.addEventListener( 'touchend', onSliderChange, false )
const min_r_slider = document.getElementById( 'min_r' )
min_r_slider.addEventListener( 'mouseup', onSliderChange, false )
min_r_slider.addEventListener( 'touchend', onSliderChange, false )
const square_slider = document.getElementById( 'square' )
square_slider.addEventListener( 'mouseup', onSliderChange, false )
square_slider.addEventListener( 'touchend', onSliderChange, false )
const strutsize_slider = document.getElementById( 'strutsize' )
strutsize_slider.addEventListener( 'mouseup', onSliderChange, false )
strutsize_slider.addEventListener( 'touchend', onSliderChange, false )
const segment_slider = document.getElementById( 'segment' )
segment_slider.addEventListener( 'mouseup', onSliderChange, false )
segment_slider.addEventListener( 'touchend', onSliderChange, false )
const links_slider = document.getElementById( 'links' )
links_slider.addEventListener( 'mouseup', onSliderChange, false )
links_slider.addEventListener( 'touchend', onSliderChange, false )
const cubecorners_slider = document.getElementById( 'cubecorners' )
cubecorners_slider.addEventListener( 'mouseup', onSliderChange, false )
cubecorners_slider.addEventListener( 'touchend', onSliderChange, false )
const smooth_slider = document.getElementById( 'smooth' )
smooth_slider.addEventListener( 'mouseup', onSliderChange, false )
smooth_slider.addEventListener( 'touchend', onSliderChange, false )
const max_r_slider = document.getElementById( 'max_r' )
max_r_slider.addEventListener( 'mouseup', onSliderChange, false )
max_r_slider.addEventListener( 'touchend', onSliderChange, false )

let doc
let scene, camera, renderer, controls

const rhino = await rhino3dm()
console.log('Loaded rhino3dm.')

init()
compute()

/**
 * Call appserver
 */
async function compute(){

  // construct url for GET /solve/definition.gh?name=value(&...)
  const url = new URL('/solve/' + definition, window.location.origin)
  url.searchParams.append('thickness', thickness_slider.valueAsNumber)
  url.searchParams.append('min_r', min_r_slider.valueAsNumber)
  url.searchParams.append('square', square_slider.valueAsNumber)
  url.searchParams.append('strutsize', strutsize_slider.valueAsNumber)
  url.searchParams.append('segment', segment_slider.valueAsNumber)
  url.searchParams.append('links', links_slider.valueAsNumber)
  url.searchParams.append('cubecorners', cubecorners_slider.valueAsNumber)
  url.searchParams.append('smooth', smooth_slider.valueAsNumber)
  url.searchParams.append('max_r', max_r_slider.valueAsNumber)
  console.log(url.toString())

  try {
    const response = await fetch(url)

    if(!response.ok) {
      console.error('Response status:', response.status)
      console.error('Response headers:', Object.fromEntries(response.headers.entries()))
      const errorText = await response.text()
      console.error('Error response body:', errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
    }

    const responseJson = await response.json()
    collectResults(responseJson)

  } catch(error){
    console.error(error)
  }
}


// from https://stackoverflow.com/a/21797381
function _base64ToArrayBuffer(base64) {
  var binary_string = window.atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Parse response
 */
function collectResults(responseJson) {

  // clear doc
  if (doc !== undefined)
    doc.delete()

  console.log('Response:', responseJson)

  // Extract the base64 data from the JSON response
  const values = responseJson.values
  if (!values || values.length === 0) {
    console.error('No values in response!')
    showSpinner(false)
    return
  }

  // Find the mesh parameter (usually the first one)
  const meshData = values.find(v => v.ParamName === 'mesh')
  if (!meshData) {
    console.error('No mesh data found!')
    showSpinner(false)
    return
  }

  // Get the first item from the inner tree
  const innerTree = meshData.InnerTree
  const key = Object.keys(innerTree)[0]
  if (!key || !innerTree[key] || innerTree[key].length === 0) {
    console.error('No mesh data in inner tree!')
    showSpinner(false)
    return
  }

  const str = innerTree[key][0].data
  const arr = _base64ToArrayBuffer(str)
  doc = rhino.File3dm.fromByteArray(arr)

  if (doc.objects().count < 1) {
    console.error('No rhino objects to load!')
    showSpinner(false)
    return
  }

  // set up loader for converting the results to threejs
  const loader = new Rhino3dmLoader()
  loader.setLibraryPath('https://unpkg.com/rhino3dm@8.0.0-beta3/')

  // const lineMat = new THREE.LineBasicMaterial({color: new THREE.Color('black')});
  // load rhino doc into three.js scene
  loader.parse(arr, function (object) {
    console.log(object)

    scene.traverse(child => {
      if (child.userData.hasOwnProperty('objectType') && child.userData.objectType === 'File3dm') {
        scene.remove(child)
      }
    })

    object.traverse(child => {
      if (child.isMesh) {
        const edges = new THREE.EdgesGeometry( child.geometry );
        const line = new THREE.LineSegments( edges, new THREE.LineBasicMaterial( { color: 0x000000 } ) )
        child.add( line )
      }
    }, false)

    // zoom to extents
    zoomCameraToSelection(camera, controls, object.children)

    // add object graph from rhino model to three.js scene
    scene.add(object)

    // hide spinner
    showSpinner(false)

  }, (error)=>{console.error(error)})
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

// BOILERPLATE //

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
}

function animate () {
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

