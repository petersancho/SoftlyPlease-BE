/* eslint no-undef: "off", no-unused-vars: "off" */

// set up loader for converting the results to threejs
const loader = new Rhino3dmLoader()
loader.setLibraryPath( 'https://unpkg.com/rhino3dm@8.0.0-beta2/' )

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

let doc
let scene, camera, renderer, controls
let rhino

async function initializeRhino() {
  if (!rhino) {
    // Wait for rhino3dm to be available (loaded by script tag)
    if (typeof rhino3dm === 'undefined') {
      console.log('Waiting for rhino3dm to load...')
      await new Promise(resolve => {
        const checkRhino3dm = () => {
          if (typeof rhino3dm !== 'undefined') {
            resolve()
          } else {
            setTimeout(checkRhino3dm, 100)
          }
        }
        checkRhino3dm()
      })
    }
    rhino = await rhino3dm()
    console.log('Loaded rhino3dm successfully.')
  }
  return rhino
}



init()
compute()

/**
 * Call appserver
 */
async function compute(){
  try {
    // Initialize rhino3dm if not already done
    await initializeRhino()

    // construct url for GET /solve/definition.gh?name=value(&...)
    const url = new URL('/solve/' + definition, window.location.origin)
    url.searchParams.append('RH_IN:tolerance', tolerance_slider.valueAsNumber)
    url.searchParams.append('RH_IN:round', round_slider.valueAsNumber)
    url.searchParams.append('RH_IN:pipe_width', pipe_width_slider.valueAsNumber)
    url.searchParams.append('RH_IN:segment', segment_slider.valueAsNumber)
    url.searchParams.append('RH_IN:cube', cube_checkbox.checked)
    url.searchParams.append('RH_IN:smooth', smooth_slider.valueAsNumber)
    url.searchParams.append('RH_IN:min_r', min_r_slider.valueAsNumber)
    url.searchParams.append('RH_IN:max_R', max_R_slider.valueAsNumber)
    url.searchParams.append('RH_IN:links', links_slider.valueAsNumber)

    console.log('Request URL:', url.toString())

    const response = await fetch(url)

    if(!response.ok) {
      console.error('Response status:', response.status)
      console.error('Response headers:', Object.fromEntries(response.headers.entries()))
      const errorText = await response.text()
      console.error('Error response body:', errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
    }

    const responseText = await response.text()
    collectResults(responseText)

  } catch(error){
    console.error('Compute error:', error)
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
 * Parse response and render with Three.js
 */
function collectResults(responseText) {
  try {
    // Clear previous geometry from scene
    clearSceneGeometry()

    console.log('Response received, length:', responseText.length)

    // Try to parse as JSON first (typical Rhino Compute response)
    let responseData
    try {
      responseData = JSON.parse(responseText)
      console.log('Parsed JSON response:', responseData)
    } catch (jsonError) {
      // If JSON parsing fails, try as base64 encoded Rhino file
      console.log('Response is not JSON, trying as base64 Rhino file')
      const arr = _base64ToArrayBuffer(responseText)
      doc = rhino.File3dm.fromByteArray(arr)

      if (doc.objects().count < 1) {
        console.error('No rhino objects to load!')
        showSpinner(false)
        return
      }

      // Convert Rhino doc to Three.js and render
      renderRhinoDocToThreeJS(doc)
      return
    }

    // Handle JSON response (typical for Rhino Compute)
    if (responseData.values && Array.isArray(responseData.values)) {
      console.log('Processing Rhino Compute JSON response with', responseData.values.length, 'outputs')

      let totalObjects = 0

      // Process each output from the Grasshopper definition
      for (let i = 0; i < responseData.values.length; i++) {
        const output = responseData.values[i]
        if (output.InnerTree && Object.keys(output.InnerTree).length > 0) {
          console.log(`Processing output ${i}:`, output)

          // Process each branch in the data tree
          for (const path in output.InnerTree) {
            const branch = output.InnerTree[path]
            console.log(`Processing branch ${path} with ${branch.length} items`)

            for (let j = 0; j < branch.length; j++) {
              const item = branch[j]
              const rhinoObject = decodeRhinoObject(item)

              if (rhinoObject) {
                console.log(`Decoded Rhino object:`, rhinoObject)
                addRhinoObjectToScene(rhinoObject)
                totalObjects++
              }
            }
          }
        }
      }

    } else {
      console.warn('Unexpected response format:', responseData)
    }

    // Zoom to fit all geometry
    zoomCameraToSelection(camera, controls, scene.children)

    console.log('Three.js rendering complete')
    showSpinner(false)

  } catch (error) {
    console.error('Error in collectResults:', error)
    showSpinner(false)
  }
}

/**
 * Clear previous geometry from Three.js scene
 */
function clearSceneGeometry() {
  // Remove all File3dm objects and their children
  const objectsToRemove = []

  scene.traverse(child => {
    if (child.userData && child.userData.objectType === 'File3dm') {
      objectsToRemove.push(child)
    }
    // Also remove any geometry objects that might be direct children
    if (child.isMesh || child.isLine || child.isPoints) {
      if (!child.userData || child.userData.objectType !== 'light') {
        objectsToRemove.push(child)
      }
    }
  })

  objectsToRemove.forEach(obj => {
    scene.remove(obj)
    if (obj.geometry) obj.geometry.dispose()
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(mat => mat.dispose())
      } else {
        obj.material.dispose()
      }
    }
  })

  console.log('Cleared', objectsToRemove.length, 'objects from scene')
}

/**
 * Render Rhino File3dm to Three.js scene
 */
function renderRhinoDocToThreeJS(rhinoDoc) {
  console.log('Converting Rhino doc to Three.js, objects count:', rhinoDoc.objects().count)

  const loader = new Rhino3dmLoader()
  loader.setLibraryPath('https://unpkg.com/rhino3dm@8.0.0-beta2/')

  // Get the byte array from the Rhino doc
  const buffer = new Uint8Array(rhinoDoc.toByteArray()).buffer

  loader.parse(buffer, function (object) {
    console.log('Parsed Rhino object:', object)
    console.log('Object children count:', object.children.length)

    // Clear existing geometry
    clearSceneGeometry()

    // Add wireframe edges to meshes
    object.traverse(child => {
      if (child.isMesh) {
        console.log('Adding wireframe to mesh:', child)
        const edges = new THREE.EdgesGeometry(child.geometry)
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
          color: 0x000000,
          linewidth: 1
        }))
        child.add(line)

        // Set mesh material
        child.material = new THREE.MeshPhongMaterial({
          color: 0x888888,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide
        })
      }
    })

    // Mark object for identification
    object.userData.objectType = 'File3dm'

    // Add to scene
    scene.add(object)
    console.log('Added Rhino object to Three.js scene')

    // Zoom to fit
    zoomCameraToSelection(camera, controls, object.children)

  }, (error) => {
    console.error('Error parsing Rhino doc:', error)
    showSpinner(false)
  })
}

/**
 * Decode Rhino object from Grasshopper data tree item
 */
function decodeRhinoObject(item) {
  try {
    const data = JSON.parse(item.data)
    if (item.type === 'System.String') {
      // Handle compressed meshes
      try {
        return rhino.DracoCompression.decompressBase64String(data)
      } catch {
        // Ignore errors for non-draco strings
      }
    } else if (typeof data === 'object') {
      return rhino.CommonObject.decode(data)
    }
  } catch (error) {
    console.warn('Failed to decode Rhino object:', error)
  }
  return null
}

/**
 * Add decoded Rhino object to Three.js scene
 */
function addRhinoObjectToScene(rhinoObject) {
  try {
    // Create a temporary Rhino doc to convert to Three.js
    const tempDoc = new rhino.File3dm()
    const objectId = tempDoc.objects().add(rhinoObject, null)

    if (objectId !== null) {
      const loader = new Rhino3dmLoader()
      loader.setLibraryPath('https://unpkg.com/rhino3dm@8.0.0-beta2/')

      const buffer = new Uint8Array(tempDoc.toByteArray()).buffer

      loader.parse(buffer, function (object) {
        // Style the object
        object.traverse(child => {
          if (child.isMesh) {
            // Add wireframe
            const edges = new THREE.EdgesGeometry(child.geometry)
            const wireframe = new THREE.LineSegments(edges,
              new THREE.LineBasicMaterial({ color: 0x000000 })
            )
            child.add(wireframe)

            // Set material
            child.material = new THREE.MeshPhongMaterial({
              color: Math.random() * 0xffffff,
              transparent: true,
              opacity: 0.7
            })
          }
        })

        object.userData.objectType = 'rhino-geometry'
        scene.add(object)
        console.log('Added geometry object to scene')
      })
    }

    tempDoc.delete()
  } catch (error) {
    console.error('Error adding Rhino object to scene:', error)
  }
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

