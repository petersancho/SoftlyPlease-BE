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
tolerance_slider .addEventListener( 'mouseup', onSliderChange, false )
tolerance_slider .addEventListener( 'touchend', onSliderChange, false )
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

let doc
let scene, camera, renderer, controls

const rhino = await rhino3dm()
console.log('Loaded rhino3dm.')

init()
compute()

const downloadButton = document.getElementById("downloadButton")
downloadButton.onclick = download

/**
 * Call appserver
 */
async function compute(){

  // construct url for POST /solve
  const url = new URL('/solve', window.location.origin)

  const data = {
    definition: definition,
    inputs: {
      'RH_IN:tolerance': tolerance_slider.valueAsNumber,
      'RH_IN:round': round_slider.valueAsNumber,
      'RH_IN:pipe_width': pipe_width_slider.valueAsNumber,
      'RH_IN:segment': segment_slider.valueAsNumber,
      'RH_IN:cube': cube_checkbox.checked,
      'RH_IN:smooth': smooth_slider.valueAsNumber,
      'RH_IN:min_r': min_r_slider.valueAsNumber,
      'RH_IN:max_R': max_R_slider.valueAsNumber,
      'RH_IN:links': links_slider.valueAsNumber
    }
  }

  console.log('Sending data:', data)

  const request = {
    'method':'POST',
    'body': JSON.stringify(data),
    'headers': {'Content-Type': 'application/json'}
  }

  try {
    const response = await fetch(url, request)
    console.log('Response status:', response.status, response.statusText)

    if(!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, message: ${response.statusText}, body: ${errorText}`)
    }

    const responseJson = await response.json()
    console.log('Response received:', responseJson)
    console.log('Response type:', typeof responseJson)
    console.log('Response keys:', Object.keys(responseJson || {}))

    if (!responseJson) {
      console.error('Empty response')
      return
    }

    if (!responseJson.values) {
      console.error('No values in response. Available keys:', Object.keys(responseJson))
      return
    }

    if (responseJson.values.length === 0) {
      console.error('Empty values array')
      return
    }

    console.log('Values array length:', responseJson.values.length)
    console.log('First value:', responseJson.values[0])

    collectResults(responseJson)

  } catch(error) {
    console.error(error)
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

/**
 * This function is called when the download button is clicked
 */
function download () {
    // write rhino doc to "blob"
    const bytes = doc.toByteArray()
    const blob = new Blob([bytes], {type: "application/octect-stream"})

    // use "hidden link" trick to get the browser to download the blob
    const filename = definition.replace(/\.gh$/, '') + '.3dm'
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = filename
    link.click()
}

/**
 * Parse response
 */
function collectResults(responseJson) {
  console.log('Processing response in collectResults:', responseJson)

  // clear doc
  if (doc !== undefined)
    doc.delete()

  const values = responseJson.values
  console.log('Values array:', values)

  if (!values || values.length === 0) {
    console.error('No values to process')
    return
  }

  doc = new rhino.File3dm()
  let objectCount = 0

  // for each output (RH_OUT:*)...
  for ( let i = 0; i < values.length; i ++ ) {
    console.log(`Processing value ${i}:`, values[i])

    if (!values[i].InnerTree) {
      console.warn(`Value ${i} has no InnerTree`)
      continue
    }

    // ...iterate through data tree structure...
    for (const path in values[i].InnerTree) {
      console.log(`Processing path: ${path}`)
      const branch = values[i].InnerTree[path]

      // ...and for each branch...
      for( let j = 0; j < branch.length; j ++) {
        console.log(`Processing branch item ${j}:`, branch[j])

        // ...load rhino geometry into doc
        const rhinoObject = decodeItem(branch[j])
        console.log(`Decoded rhino object:`, rhinoObject)

        if (rhinoObject !== null) {
          doc.objects().add(rhinoObject, null)
          objectCount++
        }
      }
    }
  }

  console.log(`Added ${objectCount} objects to doc`)

  if (doc.objects().count < 1) {
    console.error('No rhino objects to load!')
    showSpinner(false)
    return
  }

    // load rhino doc into three.js scene
    const buffer = new Uint8Array(doc.toByteArray()).buffer
    loader.parse( buffer, function ( object )
    {
    console.log(object)

///////////////////////////////////////////////////////////////////////////
        // show mesh edges
        object.traverse(child => {
          if (child.isMesh) {
            const edges = new THREE.EdgesGeometry( child.geometry );
            const line = new THREE.LineSegments( edges, new THREE.LineBasicMaterial( { color: 0x000000 } ) )
            child.add( line )
          }
        }, false)
///////////////////////////////////////////////////////////////////////////

        // clear objects from scene. do this here to avoid blink
        scene.traverse(child => {
            if (!child.isLight) {
                scene.remove(child)
            }
        })

        // add object graph from rhino model to three.js scene
        scene.add( object )

        // hide spinner and enable download button
        showSpinner(false)
        downloadButton.disabled = false

        // zoom to extents
        zoomCameraToSelection(camera, controls, scene.children)

  }, (error)=>{console.error(error)})
}

/**
 * Called when a slider value changes in the UI. Collect all of the
 * slider values and call compute to solve for a new scene
 */
function onSliderChange () {
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

    // create a scene and a camera
    scene = new THREE.Scene()
    scene.background = new THREE.Color(1, 1, 1)
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000)
    camera.position.set(1, -1, 1) // like perspective view

    // very light grey for background, like rhino
    scene.background = new THREE.Color('whitesmoke')

    // create the renderer and add it to the html
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio( window.devicePixelRatio )
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    // add some controls to orbit the camera
    controls = new OrbitControls(camera, renderer.domElement)

    // add a directional light
    const directionalLight = new THREE.DirectionalLight( 0xffffff )
    directionalLight.intensity = 2
    scene.add( directionalLight )

    const ambientLight = new THREE.AmbientLight()
    scene.add( ambientLight )

    // handle changes in the window size
    window.addEventListener( 'resize', onWindowResize, false )

    animate()
}

/**
 * The animation loop!
 */
function animate() {
  requestAnimationFrame( animate )
  controls.update()
  renderer.render(scene, camera)
}

/**
 * Helper function for window resizes (resets the camera pov and renderer size)
  */
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