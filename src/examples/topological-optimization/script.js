/* eslint no-undef: "off", no-unused-vars: "off" */

import { RhinoCompute } from 'rhinocompute'

// set up loader for converting the results to threejs
const loader = new Rhino3dmLoader()
loader.setLibraryPath( 'https://unpkg.com/rhino3dm@8.0.0-beta2/' )

// reference the definition
const definitionName = 'topological-optimization.gh'

// Slider variables - will be initialized after DOM is ready
let thickness_slider, minr_slider, maxr_slider, square_slider, strutsize_slider
let segment_slider, links_slider, cubecorners_slider, smooth_slider

// Function to initialize sliders after DOM is ready
function initializeSliders() {
  console.log('🛠️ DEBUG: Initializing sliders...')

  thickness_slider = document.getElementById('thickness')
  minr_slider = document.getElementById('min_r')
  maxr_slider = document.getElementById('max_r')
  square_slider = document.getElementById('square')
  strutsize_slider = document.getElementById('strutsize')
  segment_slider = document.getElementById('segment')
  links_slider = document.getElementById('links')
  cubecorners_slider = document.getElementById('cubecorners')
  smooth_slider = document.getElementById('smooth')

  // Check if all sliders exist
  const sliders = [thickness_slider, minr_slider, maxr_slider, square_slider, strutsize_slider,
                  segment_slider, links_slider, cubecorners_slider, smooth_slider]

  const missingSliders = sliders.filter(slider => !slider)
  if (missingSliders.length > 0) {
    console.error('❌ ERROR: Missing sliders:', missingSliders.length, 'out of', sliders.length)
    sliders.forEach((slider, index) => {
      if (!slider) {
        const sliderNames = ['thickness', 'min_r', 'max_r', 'square', 'strutsize', 'segment', 'links', 'cubecorners', 'smooth']
        console.error('❌ ERROR: Missing slider:', sliderNames[index])
      }
    })
    return false
  }

  // Add event listeners to all sliders
  sliders.forEach(slider => {
    slider.addEventListener('mouseup', onSliderChange, false)
    slider.addEventListener('touchend', onSliderChange, false)
  })

  console.log('✅ DEBUG: All sliders initialized successfully')
  return true
}

// globals
let definition, doc
let scene, camera, renderer, controls
let rhino

// Setup RhinoCompute authentication
RhinoCompute.url = 'http://softlyplease.canadacentral.cloudapp.azure.com' // Use the configured Azure compute server
RhinoCompute.apiKey = process.env.RHINO_COMPUTE_KEY || 'eyJSYXdPcGVuSWRUb2tlbiI6ICJleUpoYkdjaU9pSlNVekkxTmlJc0ltdHBaQ0k2SWpFaUxDSjBlWEFpT2lKS1YxUWlmUS5leUp6ZFdJaU9pSTFPVEV3TWpreE9EUTJOVEk1TURJMElpd2laVzFoYVd3aU9pSndaWFJsY21wellXNWphRzlBWjIxaGFXd3VZMjl0SWl3aVpXMWhhV3dmZG1WeWFXWnBaV1FpT25SeWRXVXNJbU52YlM1eWFHbHViek5rTG1GalkyOTFiblJ6TG1WdFlXbHNjeUk2V3lKd1pYUmxjbXB6WVc1amFHOUFaMjFoYVd3dVkyOXRJbDBzSW01aGJXVWlPaUpRWlhSbGNpQlhhVzVuYnlJc0lteHZZMkZzWlNJNkltVnVMV05oSWl3aWNHbGpkSFZ5WlNJNkltaDBkSEJ6T2k4dmQzZDNMbWR5WVhaaGRHRnlMbU52YlM5aGRtRjBZWEl2Tmpaall6bGtaVEkxT1RFNU9EZzNOakZpWm1JMll6VmtaV05qWkdFNE9HSV9aRDF5WlhSeWJ5SXNJbU52YlM1eWFHbHViek5rTG1GalkyOTFiblJ6TG0xbGJXSmxjbDluY205MWNITWlPbHQ3SW1sa0lqb2lOakExTlRFd09UUXlNREV5TWpFeE1pSXNJbTVoYldVaU9pSk5Ra1ZNWVdJaUxDSmtiMjFoYVc1eklqcGJYWDFkTENKamIyMHVjbWhwYm04elpDNWhZMk52ZFc1MGN5NWhaRzFwYmw5bmNtOTFjSE1pT2x0ZExDSmpiMjB1Y21ocGJtOHpaQzVoWTJOdmRXNTBjeTV2ZDI1bGNsOW5jbTkxY0hNaU9sdDdJbWxrSWpvaU5EYzRPVFF4TlRrek56Z3pOVEF3T0NJc0ltNWhiV1VpT2lKRGIyMXdkWFJsSUhSbFlXMGlMQ0prYjIxaGFXNXpJanBiWFgxZExDSmpiMjB1Y21ocGJtOHpaQzVoWTJOdmRXNTBjeTV6YVdRaU9pSnJVWEYxSzNaV2JuUXlhbTl0U1hkMWFVWTFSM2hTVURaVE1ITTVkVVJxWkU4dlUxZEJORU0zTDNkelBTSXNJbWx6Y3lJNkltaDBkSEJ6T2k4dllXTmpiM1Z1ZEhNdWNtaHBibTh6WkM1amIyMGlMQ0poZFdRaU9pSmpiRzkxWkY5NmIyOWZZMnhwWlc1MElpd2laWGh3SWpvek16TXhNRFE0TURVMExDSnBZWFFpT2pFM05UUXlORGd3TlRVc0ltRjFkR2hmZEdsdFpTSTZNVGMxTkRJME1qRXpOU3dpYm05dVkyVWlPaUphZWs4elR6bE5OM0k1V1ZKVFFWUnFPRzE0UWxkcFlrNXNlblJyZEVoamRIWlFSRTVoY2pocFUxcEllWGxwUzBaSE5sSllWalY0UjA1NWFWWjBhRk5sSWl3aVlYUmZhR0Z6YUNJNkltSjFjVzlMT1Y5bFR6ZG5aVEpPWDJaZmVteEdkV2M5UFNKOS5DN0hxcVp6MDhQYkRMSEdBVHJvcmhvVEVud2lfQ0ZIYmdrYUoxSXFIVkQ2b3hGU2dMLUZWUjlGNHJkQmFiU3VMU2p2b0IwOW56Zgo3TlE0U29jSVlGNjJheDhkQjZSRTNaTW1NclhyZ1J5SUlTUlh6dmlqdE5oN3BWU1ZwMnVLdUFoZEFJZFJwekpMRHducTRZWHE1MlcwZmdjVHVicWlOSDE5X3RhbU9CVkVKa1hKZTBKWDU0X09KWWdFN1FIbXotQllSU0ZESWlLLWljRkJKbVAzeFFsMzBNeFduZ0pOWk5mazBWOWJTMDFqaU9lNUNRVGNndHM5M1V4UlRwRGNJQXg1UklsNDlqdHN5cW5YUEJvR1NvRG13Rjg3Y1lsMDY3dnh1VW44a1ZPdkFPVEREbTlzb2ctZ3Y3elFoSEd1aTRhb0dQblB5LUFZaEhMWW1sQkxTeFEiLCAiUmF3T0F1dGgyVG9rZW4iOiAiZXlKaGJHY2lPaUpJVXpJMU5pSjkuZXlKaklqb3hMQ0p3SWpveExDSmlOalJwZGlJNkltSlNUV1IwVVVkMk4yZEdZVEpRWjJSVU5HVmpWM2M5UFNJc0ltSTJOR04wSWpvaVlYb3ZVRmRyWkc5NGJUWjJZMWh6YVRCYWEyYzRiVEV5WlZRMFZscHphbmRhYkN0bmNuTklPVXA1YmtkUE5VMTNWek41TlZNMVdIQnJiWE5NUWk5V1lsSXZkMWxwYTNKMldIQkdZMWR0ZFRkS1VXY3pLMlYyWkVkbFVWWmlXRFJpTkRkWVpFUlZWVkJwWXpnOUlpd2lhV0YwSWpveE56VTBNalE0TURVMWZRLjdBZmVzbGJRSXlxa0Y1VXhIampGUFpubjN4dWJqRHFDRF9Nb1VZWFZtaUUiLCAiU2NvcGUiOiBbImxpY2Vuc2VzIiwgInByb2ZpbGUiLCAiZ3JvdXBzIiwgImVtYWlsIiwgIm5vZXhwaXJlIiwgIm9wZW5pZCJdLCAiR3JvdXBJZCI6ICI0Nzg5NDE1OTM3ODM1MDA4In0='

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

// Load the .gh definition file
async function loadDefinition() {
  try {
    console.log('🐛 DEBUG: Loading Grasshopper definition from:', definitionName)
    let url = definitionName
    let res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Failed to load definition: ${res.status} ${res.statusText}`)
    }
    let buffer = await res.arrayBuffer()
    definition = new Uint8Array(buffer)
    console.log('✅ DEBUG: Definition loaded successfully:', definitionName, 'Size:', definition.length, 'bytes')

    // Test connection to Rhino Compute server
    await testRhinoConnection()
  } catch (error) {
    console.error('❌ ERROR loading definition:', error)
    alert('Failed to load Grasshopper definition: ' + error.message)
  }
}

// Test basic connection to Rhino Compute server
async function testRhinoConnection() {
  try {
    console.log('🐛 DEBUG: Testing Rhino Compute server connection...')
    const testUrl = RhinoCompute.url + '/io'

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RhinoCompute.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('🐛 DEBUG: Server test response status:', response.status)
    console.log('🐛 DEBUG: Server test response headers:', Object.fromEntries(response.headers.entries()))

    if (response.status === 401) {
      console.warn('⚠️ WARNING: Server returns 401 Unauthorized - API key may be invalid')
      alert('Warning: Server authentication failed. API key may be expired or invalid.')
    } else if (response.status === 200) {
      console.log('✅ DEBUG: Server connection test successful')
    } else {
      console.warn('⚠️ WARNING: Server returned unexpected status:', response.status)
    }
  } catch (error) {
    console.error('❌ ERROR: Cannot connect to Rhino Compute server:', error)
    alert('Cannot connect to Rhino Compute server. Check network connection and server status.')
  }
}

init()
loadDefinition()

/**
 * Call RhinoCompute
 */
async function compute(){
  try {
    // Ensure sliders are initialized
    if (!thickness_slider) {
      console.log('🛠️ DEBUG: Sliders not initialized in compute(), initializing now...')
      if (!initializeSliders()) {
        console.error('❌ ERROR: Failed to initialize sliders in compute()')
        alert('Sliders not properly initialized. Please refresh the page.')
        showSpinner(false)
        return
      }
    }

    // format data - using "RH_IN:" prefixes to match Grasshopper group names
    // Create a simple box geometry for RH_IN:brep parameter
    console.log('🐛 DEBUG: Creating test geometry for RH_IN:brep...')
    const box = new rhino.Box([0, 0, 0], [10, 10, 10])
    const brep = box.toBrep(true)
    const brepJson = JSON.stringify(brep.encode())

    let param1 = new RhinoCompute.Grasshopper.DataTree('RH_IN:brep')
    param1.append([0], [brepJson])

    let param2 = new RhinoCompute.Grasshopper.DataTree('RH_IN:links')
    param2.append([0], [links_slider.valueAsNumber])

    let param3 = new RhinoCompute.Grasshopper.DataTree('RH_IN:minr')
    param3.append([0], [minr_slider.valueAsNumber])

    let param4 = new RhinoCompute.Grasshopper.DataTree('RH_IN:maxr')
    param4.append([0], [maxr_slider.valueAsNumber])

    let param5 = new RhinoCompute.Grasshopper.DataTree('RH_IN:thickness')
    param5.append([0], [thickness_slider.valueAsNumber])

    let param6 = new RhinoCompute.Grasshopper.DataTree('RH_IN:square')
    param6.append([0], [square_slider.valueAsNumber])

    let param7 = new RhinoCompute.Grasshopper.DataTree('RH_IN:strutsize')
    param7.append([0], [strutsize_slider.valueAsNumber])

    let param8 = new RhinoCompute.Grasshopper.DataTree('RH_IN:segment')
    param8.append([0], [segment_slider.valueAsNumber])

    let param9 = new RhinoCompute.Grasshopper.DataTree('RH_IN:cubecorners')
    param9.append([0], [cubecorners_slider.valueAsNumber])

    let param10 = new RhinoCompute.Grasshopper.DataTree('RH_IN:smooth')
    param10.append([0], [smooth_slider.valueAsNumber])

    // Add all params to an array
    let trees = []
    trees.push(param1)
    trees.push(param2)
    trees.push(param3)
    trees.push(param4)
    trees.push(param5)
    trees.push(param6)
    trees.push(param7)
    trees.push(param8)
    trees.push(param9)
    trees.push(param10)

    console.log('🐛 DEBUG: Starting RhinoCompute request...')
    console.log('🐛 DEBUG: RhinoCompute.url:', RhinoCompute.url)
    console.log('🐛 DEBUG: RhinoCompute.apiKey length:', RhinoCompute.apiKey ? RhinoCompute.apiKey.length : 'undefined')
    console.log('🐛 DEBUG: Trees count:', trees.length)
    console.log('🐛 DEBUG: Parameters:', ['brep', 'links', 'minr', 'maxr', 'thickness', 'square', 'strutsize', 'segment', 'cubecorners', 'smooth'])
    console.log('🐛 DEBUG: Parameter values:', {
      brep: '10x10x10 box geometry',
      links: links_slider.valueAsNumber,
      minr: minr_slider.valueAsNumber,
      maxr: maxr_slider.valueAsNumber,
      thickness: thickness_slider.valueAsNumber,
      square: square_slider.valueAsNumber,
      strutsize: strutsize_slider.valueAsNumber,
      segment: segment_slider.valueAsNumber,
      cubecorners: cubecorners_slider.valueAsNumber,
      smooth: smooth_slider.valueAsNumber
    });

    // Call RhinoCompute
    console.log('🐛 DEBUG: Calling RhinoCompute.Grasshopper.evaluateDefinition...')
    console.log('🐛 DEBUG: Definition loaded?', !!definition)
    console.log('🐛 DEBUG: Definition byte length:', definition ? definition.byteLength : 'undefined')

    const res = await RhinoCompute.Grasshopper.evaluateDefinition(definition, trees)

    console.log('✅ DEBUG: RhinoCompute response received successfully:', res);
    console.log('✅ DEBUG: Response type:', typeof res);
    console.log('✅ DEBUG: Response keys:', res ? Object.keys(res) : 'null');
    console.log('✅ DEBUG: Response is null?', res === null);
    console.log('✅ DEBUG: Response is undefined?', res === undefined);

    if (res === null || res === undefined) {
      console.error('❌ ERROR: RhinoCompute returned null/undefined response');
      alert('RhinoCompute returned no response. Check server logs and Grasshopper definition.');
      showSpinner(false);
      return;
    }

    collectResults(res)

  } catch (error) {
    console.error('❌ ERROR in compute():', error)
    console.error('❌ ERROR message:', error.message)
    console.error('❌ ERROR stack:', error.stack)
    showSpinner(false)

    // More detailed error information
    if (error.message.includes('CORS')) {
      alert('CORS Error: The Rhino Compute server is blocking your request. This is a server configuration issue.')
    } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      alert('Authentication Error: Invalid API key or server not accepting credentials.')
    } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
      alert('Network Error: Cannot connect to Rhino Compute server. Check if the server is running.')
    } else {
      alert('Error: ' + error.message)
    }
  }
}

function onChange() {
  // show spinner
  document.getElementById('loader').style.display = 'block'
  compute()
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

    console.log('🐛 DEBUG: collectResults called with responseText:', responseText)
    console.log('🐛 DEBUG: responseText type:', typeof responseText)
    console.log('🐛 DEBUG: responseText length:', responseText ? responseText.length : 'undefined')
    console.log('🐛 DEBUG: responseText is null?', responseText === null)
    console.log('🐛 DEBUG: responseText is undefined?', responseText === undefined)

    if (!responseText || responseText.length === 0) {
      console.error('❌ ERROR: Empty or null responseText received')
      alert('Empty response from Rhino Compute server.')
      showSpinner(false)
      return
    }

    // Try to parse as JSON first (typical Rhino Compute response)
    let responseData
    try {
      responseData = JSON.parse(responseText)
      console.log('✅ DEBUG: Successfully parsed JSON response:', responseData)
      console.log('✅ DEBUG: Response data type:', typeof responseData)
      console.log('✅ DEBUG: Response data keys:', responseData ? Object.keys(responseData) : 'null')
    } catch (jsonError) {
      // If JSON parsing fails, try as base64 encoded Rhino file
      console.log('🐛 DEBUG: Response is not JSON, trying as base64 Rhino file')
      console.log('🐛 DEBUG: JSON parse error:', jsonError.message)

      try {
        const arr = _base64ToArrayBuffer(responseText)
        console.log('✅ DEBUG: Base64 decoded successfully, array length:', arr.byteLength)

        doc = rhino.File3dm.fromByteArray(arr)
        console.log('✅ DEBUG: Rhino doc created, objects count:', doc.objects().count)

        if (doc.objects().count < 1) {
          console.error('❌ ERROR: No rhino objects to load!')
          alert('No geometry objects found in Rhino Compute response.')
          showSpinner(false)
          return
        }

        // Convert Rhino doc to Three.js and render
        renderRhinoDocToThreeJS(doc)
        return
      } catch (base64Error) {
        console.error('❌ ERROR: Failed to parse as base64 Rhino file:', base64Error)
        alert('Failed to parse Rhino Compute response as JSON or base64.')
        showSpinner(false)
        return
      }
    }

    // Handle JSON response (typical for Rhino Compute)
    if (responseData.values && Array.isArray(responseData.values)) {
      console.log('🐛 DEBUG: Processing Rhino Compute JSON response with', responseData.values.length, 'outputs')
      console.log('🐛 DEBUG: Full response data:', responseData)

      let totalObjects = 0

      // Process each output from the Grasshopper definition
      for (let i = 0; i < responseData.values.length; i++) {
        const output = responseData.values[i]
        console.log(`🐛 DEBUG: Processing output ${i}:`, output)
        console.log(`🐛 DEBUG: Output has InnerTree?`, !!output.InnerTree)
        console.log(`🐛 DEBUG: InnerTree keys:`, output.InnerTree ? Object.keys(output.InnerTree) : 'none')

        if (output.InnerTree && Object.keys(output.InnerTree).length > 0) {
          // Process each branch in the data tree
          for (const path in output.InnerTree) {
            const branch = output.InnerTree[path]
            console.log(`🐛 DEBUG: Processing branch ${path} with ${branch.length} items`)
            console.log(`🐛 DEBUG: Branch data:`, branch)

            for (let j = 0; j < branch.length; j++) {
              const item = branch[j]
              console.log(`🐛 DEBUG: Processing item ${j}:`, item)
              console.log(`🐛 DEBUG: Item type:`, item.type)
              console.log(`🐛 DEBUG: Item data:`, item.data)

              const rhinoObject = decodeRhinoObject(item)
              console.log(`🐛 DEBUG: decodeRhinoObject result:`, rhinoObject)

              if (rhinoObject) {
                console.log(`✅ DEBUG: Decoded Rhino object successfully:`, rhinoObject)
                addRhinoObjectToScene(rhinoObject)
                totalObjects++
              } else {
                console.warn(`⚠️ WARNING: Failed to decode Rhino object for item ${j}`)
              }
            }
          }
        } else {
          console.warn(`⚠️ WARNING: Output ${i} has no InnerTree or empty InnerTree`)
        }
      }

      console.log(`✅ DEBUG: Total objects processed: ${totalObjects}`)

    } else {
      console.warn('⚠️ WARNING: Unexpected response format:', responseData)
      console.warn('⚠️ WARNING: Expected responseData.values to be an array')
    }

    // Check scene after processing
    console.log('🐛 DEBUG: Scene children count after processing:', scene.children.length)
    console.log('🐛 DEBUG: Scene children:', scene.children.map(child => ({
      type: child.type,
      name: child.name,
      isMesh: child.isMesh,
      isLine: child.isLine,
      isPoints: child.isPoints
    })))

    // Zoom to fit all geometry
    zoomCameraToSelection(camera, controls, scene.children)

    console.log('✅ DEBUG: Three.js rendering complete')
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
    console.log('🐛 DEBUG: addRhinoObjectToScene called with:', rhinoObject)
    console.log('🐛 DEBUG: Rhino object type:', rhinoObject.constructor.name)

    // Create a temporary Rhino doc to convert to Three.js
    const tempDoc = new rhino.File3dm()
    console.log('✅ DEBUG: Created temporary Rhino doc')

    const objectId = tempDoc.objects().add(rhinoObject, null)
    console.log('✅ DEBUG: Added object to temp doc, objectId:', objectId)

    if (objectId !== null) {
      const loader = new Rhino3dmLoader()
      loader.setLibraryPath('https://unpkg.com/rhino3dm@8.0.0-beta2/')
      console.log('✅ DEBUG: Created Rhino3dmLoader')

      const buffer = new Uint8Array(tempDoc.toByteArray()).buffer
      console.log('✅ DEBUG: Created buffer from temp doc, byte length:', buffer.byteLength)

      loader.parse(buffer, function (object) {
        console.log('✅ DEBUG: Rhino3dmLoader.parse callback called')
        console.log('✅ DEBUG: Parsed Three.js object:', object)
        console.log('✅ DEBUG: Object type:', object.type)
        console.log('✅ DEBUG: Object children count:', object.children.length)

        let meshCount = 0
        let lineCount = 0
        let pointsCount = 0

        // Style the object
        object.traverse(child => {
          console.log('🐛 DEBUG: Traversing child:', child.type, child.name)

          if (child.isMesh) {
            meshCount++
            console.log('✅ DEBUG: Found mesh, adding wireframe and material')

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
          } else if (child.isLine) {
            lineCount++
            console.log('✅ DEBUG: Found line object')
          } else if (child.isPoints) {
            pointsCount++
            console.log('✅ DEBUG: Found points object')
          }
        })

        console.log(`✅ DEBUG: Object contains: ${meshCount} meshes, ${lineCount} lines, ${pointsCount} points`)

        object.userData.objectType = 'rhino-geometry'
        scene.add(object)

        console.log('✅ DEBUG: Added geometry object to scene')
        console.log('✅ DEBUG: Scene children count after adding:', scene.children.length)

        // Force a render
        renderer.render(scene, camera)
        console.log('✅ DEBUG: Forced render completed')
      })
    } else {
      console.warn('⚠️ WARNING: Failed to add rhinoObject to temp doc')
    }

    tempDoc.delete()
    console.log('✅ DEBUG: Cleaned up temp doc')
  } catch (error) {
    console.error('❌ ERROR: Error adding Rhino object to scene:', error)
    console.error('❌ ERROR: Error stack:', error.stack)
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

// Test function accessible from browser console and HTML button
window.testCompute = function() {
  console.log('🧪 TEST: testCompute() called manually - BUTTON WORKING!')

  // Add immediate visual feedback
  const testButton = document.querySelector('button[onclick*="testCompute"]')
  if (testButton) {
    testButton.textContent = 'Testing...'
    testButton.style.background = '#28a745'
    setTimeout(() => {
      testButton.textContent = 'Test Compute'
      testButton.style.background = '#007bff'
    }, 2000)
  }

  // Check if RhinoCompute is loaded
  console.log('🧪 TEST: RhinoCompute object:', window.RhinoCompute)
  console.log('🧪 TEST: RhinoCompute.url:', window.RhinoCompute?.url)
  console.log('🧪 TEST: RhinoCompute.apiKey:', window.RhinoCompute?.apiKey ? '***' + window.RhinoCompute.apiKey.slice(-4) : 'undefined')

  // Check if required modules are loaded
  console.log('🧪 TEST: THREE object:', window.THREE)
  console.log('🧪 TEST: rhino object:', window.rhino)

  // Check definition loading
  console.log('🧪 TEST: definition variable:', definition)
  console.log('🧪 TEST: definitionName:', definitionName)

  // Ensure sliders are initialized
  if (!thickness_slider) {
    console.log('🧪 TEST: Sliders not initialized yet, initializing now...')
    if (!initializeSliders()) {
      alert('Failed to initialize sliders. Please refresh the page.')
      return
    }
  }

  console.log('🧪 TEST: Current slider values:')
  console.log('  - thickness:', thickness_slider?.valueAsNumber || 'slider not found')
  console.log('  - minr:', minr_slider?.valueAsNumber || 'slider not found')
  console.log('  - maxr:', maxr_slider?.valueAsNumber || 'slider not found')
  console.log('  - square:', square_slider?.valueAsNumber || 'slider not found')
  console.log('  - strutsize:', strutsize_slider?.valueAsNumber || 'slider not found')
  console.log('  - segment:', segment_slider?.valueAsNumber || 'slider not found')
  console.log('  - links:', links_slider?.valueAsNumber || 'slider not found')
  console.log('  - cubecorners:', cubecorners_slider?.valueAsNumber || 'slider not found')
  console.log('  - smooth:', smooth_slider?.valueAsNumber || 'slider not found')

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

  // Initialize sliders after DOM is ready
  if (!initializeSliders()) {
    console.error('❌ ERROR: Failed to initialize sliders')
  }

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

