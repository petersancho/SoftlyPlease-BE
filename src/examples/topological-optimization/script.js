/* eslint no-undef: "off", no-unused-vars: "off" */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Rhino3dmLoader } from 'three/examples/jsm/loaders/3DMLoader'
import rhino3dm from 'rhino3dm'

// set up loader for converting the results to threejs
const loader = new Rhino3dmLoader()
loader.setLibraryPath( 'https://unpkg.com/rhino3dm@8.0.0-beta/' )

const definition = 'Topological-Optimization'

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
    const response = await fetch( '/solve/topological-optimization', request )

    if(!response.ok) {
      throw new Error(response.statusText)
    }

    const responseJson = await response.json()

    // hide spinner
    showSpinner(false)

    // Load geometry in the scene
    loadScene(responseJson)

  } catch(error) {
    console.error(error)
    showSpinner(false)
  }
}

/**
 * Called when any slider changes
 */
function onSliderChange(){
  compute()
}

/**
 * Shows or hides the loading spinner
 */
function showSpinner( enable ){
  document.getElementById('loader').style.display = enable ? 'block' : 'none'
}

/**
 * Load a scene from rhino3dm result
 */
function loadScene( result ){

  doc = new rhino.File3dm()

  // set up loader for converting the results to threejs
  const loader = new Rhino3dmLoader()
  loader.setLibraryPath( 'https://unpkg.com/rhino3dm@8.0.0-beta/' )

  // load rhino doc
  const buffer = base64ToArrayBuffer(result.values[0].InnerTree['{0;0}'][0].data)
  loader.parse( buffer, function ( object ) {

      // clear objects from scene
      scene.children = scene.children.filter(child => child.userData.background)

      // add object to scene
      scene.add( object )
      object.rotation.x = -Math.PI/2

      // fit camera to object
      fitCameraToObject(object)

  } )
}

/**
 * base64 to buffer
 */
function base64ToArrayBuffer( base64 ) {
  const binaryString = window.atob( base64 )
  const len = binaryString.length
  const bytes = new Uint8Array( len )
  for ( let i = 0; i < len; i++ ) {
      bytes[i] = binaryString.charCodeAt( i )
  }
  return bytes.buffer
}

/**
 * Initialize the scene, camera and renderer
 */
function init(){
  scene = new THREE.Scene()
  scene.background = new THREE.Color(1,1,1)

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 1, 1000 )
  camera.position.x = 100
  camera.position.y = 100
  camera.position.z = 100

  const canvas = document.getElementById('canvas')
  controls = new THREE.OrbitControls( camera, canvas )

  renderer = new THREE.WebGLRenderer( { antialias: true } )
  renderer.setSize( window.innerWidth, window.innerHeight )
  canvas.appendChild( renderer.domElement )

  // add light
  const directionalLight = new THREE.DirectionalLight( 0xffffff )
  directionalLight.position.set( 0, 0, 2 )
  scene.add( directionalLight )

  // add background geometry
  const planeGeometry = new THREE.PlaneGeometry( 200, 200 )
  const planeMaterial = new THREE.MeshBasicMaterial( {color: 0xcccccc} )
  const plane = new THREE.Mesh( planeGeometry, planeMaterial )
  plane.rotation.x = -Math.PI/2
  plane.position.y = -50
  plane.userData.background = true
  scene.add( plane )

  animate()
}

/**
 * Animate the scene
 */
function animate(){
  requestAnimationFrame( animate )
  renderer.render( scene, camera )
}

/**
 * Fit camera to object
 */
function fitCameraToObject( object ){

  const box = new THREE.Box3().setFromObject( object )
  const size = box.getSize( new THREE.Vector3() )
  const center = box.getCenter( new THREE.Vector3() )

  const maxDim = Math.max( size.x, size.y, size.z )
  const fov = camera.fov * ( Math.PI / 180 )
  let cameraZ = Math.abs( maxDim / 2 / Math.tan( fov / 2 ) )

  cameraZ *= 2.5

  camera.position.z = cameraZ
  camera.position.x = center.x
  camera.position.y = center.y

  const minZ = box.min.z
  const cameraToFarEdge = ( minZ < 0 ) ? -minZ + cameraZ : cameraZ - minZ

  camera.far = cameraToFarEdge * 3
  camera.updateProjectionMatrix()

  if ( controls ) {

    controls.target.copy( center )
    controls.update()

  }

}
