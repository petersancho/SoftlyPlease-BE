import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Rhino3dmLoader } from 'three/examples/jsm/loaders/3DMLoader'
import rhino3dm from 'rhino3dm'

/* eslint no-undef: "off", no-unused-vars: "off" */

const loader = new Rhino3dmLoader()
loader.setLibraryPath( 'https://unpkg.com/rhino3dm@8.0.0-beta3/' )

const definition = 'BranchNodeRnd.gh'

// setup input change events
const count_slider = document.getElementById( 'count' )
count_slider.addEventListener( 'mouseup', onSliderChange, false )
count_slider.addEventListener( 'touchend', onSliderChange, false )
const radius_slider = document.getElementById( 'radius' )
radius_slider.addEventListener( 'mouseup', onSliderChange, false )
radius_slider.addEventListener( 'touchend', onSliderChange, false )
const length_slider = document.getElementById( 'length' )
length_slider.addEventListener( 'mouseup', onSliderChange, false )
length_slider.addEventListener( 'touchend', onSliderChange, false )

// load the rhino3dm library
let doc

const rhino = await rhino3dm()
console.log('Loaded rhino3dm.')

init()
updateConnectionStatus('🔄 Connecting...', 'orange')
compute()



let _threeMesh, _threeMaterial

/**
 * Call appserver
 */
async function compute(){
  let t0 = performance.now()
  const timeComputeStart = t0

  // collect data from inputs
  let data = {}
  data.definition = definition  
  data.inputs = {
    'Count': count_slider.valueAsNumber,
    'Radius': radius_slider.valueAsNumber,
    'Length': length_slider.valueAsNumber
  }

  console.log(data.inputs)

  const request = {
    'method':'POST',
    'body': JSON.stringify(data),
    'headers': {'Content-Type': 'application/json'}
  }

  let headers = null

  try {
    updateConnectionStatus('🔄 Processing...', 'orange')

    const response = await fetch('/solve', request)

    if(!response.ok)
      throw new Error(response.statusText)

    headers = response.headers.get('server-timing')
    const responseJson = await response.json()

    collectResults(responseJson)

    // Request finished. Do processing here.
    let t1 = performance.now()
    const computeSolveTime = t1 - timeComputeStart
    t0 = t1

    // hide spinner
    showSpinner(false)

    updateConnectionStatus('✅ Connected - Ready', 'green')

    t1 = performance.now()
    const decodeMeshTime = t1 - t0
    t0 = t1
    t1 = performance.now()
    const rebuildSceneTime = t1 - t0

    console.log(`  ${Math.round(computeSolveTime)} ms: appserver request`)

  } catch(error) {
    console.error('Solve request failed:', error)

    // Hide spinner and show error message
    showSpinner(false)

    // Update connection status
    updateConnectionStatus('❌ Connection Failed', 'red')

    // Show user-friendly error message
    showErrorMessage(getErrorMessage(error))

    // Try to retry after a delay if it's a network error
    if (isNetworkError(error)) {
      console.log('Network error detected, will retry in 5 seconds...')
      updateConnectionStatus('🔄 Retrying...', 'orange')
      setTimeout(() => {
        console.log('Retrying...')
        showErrorMessage('Retrying connection...')
        compute()
      }, 5000)
    }
  }
  
}

/**
 * Parse response
 */
 function collectResults(responseJson) {

  const values = responseJson.values

  // clear doc
  if( doc !== undefined)
      doc.delete()

  //console.log(values)
  doc = new rhino.File3dm()

  // for each output (RH_OUT:*)...
  for ( let i = 0; i < values.length; i ++ ) {
    // ...iterate through data tree structure...
    for (const path in values[i].InnerTree) {
      const branch = values[i].InnerTree[path]
      // ...and for each branch...
      for( let j = 0; j < branch.length; j ++) {
        // ...load rhino geometry into doc
        const rhinoObject = decodeItem(branch[j])
        if (rhinoObject !== null) {
          doc.objects().add(rhinoObject, null)
        }
      }
    }
  }

  if (doc.objects().count < 1) {
    console.error('No rhino objects to load!')
    showSpinner(false)
    return
  }

  // load rhino doc into three.js scene
  const buffer = new Uint8Array(doc.toByteArray()).buffer
  loader.parse( buffer, function ( object ) 
  {
      // debug 
      
      object.traverse(child => {
        console.log(child)
        if (child.material)
          child.material = new THREE.MeshBasicMaterial( { vertexColors: true})
      }, false)
      

      // clear objects from scene. do this here to avoid blink
      scene.traverse(child => {
          if (!child.isLight && child.name !== 'context') {
              scene.remove(child)
          }
      })

      // add object graph from rhino model to three.js scene
      scene.add( object )

      // hide spinner and enable download button
      showSpinner(false)
      //downloadButton.disabled = false

      // zoom to extents
      //zoomCameraToSelection(camera, controls, scene.children)
  }, (error) => {
    console.error(error)
  }) 
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

/**
 * Updates connection status indicator
 */
function updateConnectionStatus(message, color = 'black') {
  const statusElement = document.getElementById('connection-status')
  if (statusElement) {
    statusElement.textContent = message
    statusElement.style.color = color
  }
}

/**
 * Shows error message to user
 */
function showErrorMessage(message) {
  // Remove any existing error message
  const existingError = document.getElementById('error-message')
  if (existingError) {
    existingError.remove()
  }

  // Create error message element
  const errorDiv = document.createElement('div')
  errorDiv.id = 'error-message'
  errorDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #ff4444;
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    z-index: 1000;
    font-family: Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  `
  errorDiv.textContent = message

  document.body.appendChild(errorDiv)

  // Auto-hide after 10 seconds
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.remove()
    }
  }, 10000)
}

/**
 * Gets user-friendly error message
 */
function getErrorMessage(error) {
  if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
    return 'Connection timeout - Rhino Compute server is not responding. Retrying...'
  } else if (error.message.includes('fetch')) {
    return 'Network error - Unable to connect to Rhino Compute server'
  } else if (error.message.includes('404')) {
    return 'Definition not found - BranchNodeRnd.gh may not be available'
  } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
    return 'Authentication error - API key may be invalid'
  } else if (error.message.includes('500')) {
    return 'Server error - Rhino Compute server encountered an internal error'
  } else {
    return `Error: ${error.message || 'Unknown error occurred'}`
  }
}

/**
 * Checks if error is network-related and worth retrying
 */
function isNetworkError(error) {
  const message = error.message.toLowerCase()
  return message.includes('timeout') ||
         message.includes('etimedout') ||
         message.includes('enotfound') ||
         message.includes('econnrefused') ||
         message.includes('network') ||
         message.includes('fetch')
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

/**
 * Called when a slider value changes in the UI. Collect all of the
 * slider values and call compute to solve for a new scene
 */
function onSliderChange () {
  // show spinner
  showSpinner(true)
  compute()
}

// BOILERPLATE //

var scene, camera, renderer, controls

function init () {
  // Rhino models are z-up, so set this as the default
  THREE.Object3D.DefaultUp = new THREE.Vector3( 0, 0, 1 );

  scene = new THREE.Scene()
  scene.background = new THREE.Color(1,1,1)
  camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 1, 1000 )

  renderer = new THREE.WebGLRenderer({antialias: true})
  renderer.setPixelRatio( window.devicePixelRatio )
  renderer.setSize( window.innerWidth, window.innerHeight )
  document.body.appendChild(renderer.domElement)

  controls = new OrbitControls( camera, renderer.domElement  )

  camera.position.z = 50

  window.addEventListener( 'resize', onWindowResize, false )

  animate()
}

function animate () {
  requestAnimationFrame( animate )
  controls.update()
  renderer.render( scene, camera )
}
  
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize( window.innerWidth, window.innerHeight )
  animate()
}
