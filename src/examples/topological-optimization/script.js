/* eslint no-undef: "off", no-unused-vars: "off" */
/**
 * Rhino Compute Grasshopper Solver - Real topological optimization
 * Uses the rhino.geometry REST API to solve Grasshopper definitions
 */

// Global variables
let scene, camera, renderer, controls
let rhino3dm = null
let isRhinoComputeWorking = false

// Definition name
const definition = 'topological-optimization.gh'

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  init()
  testRhinoCompute()
})

// Add loading status indicator
function updateLoadingStatus(message) {
  let statusElement = document.getElementById('loading-status')
  if (!statusElement) {
    statusElement = document.createElement('div')
    statusElement.id = 'loading-status'
    statusElement.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 12px;
      z-index: 1000;
      max-width: 300px;
    `
    document.body.appendChild(statusElement)
  }
  statusElement.textContent = message
  console.log(message)
}

function hideLoadingStatus() {
  const statusElement = document.getElementById('loading-status')
  if (statusElement) {
    statusElement.remove()
  }
}

// Test if rhino compute is working
async function testRhinoCompute() {
  updateLoadingStatus('Testing rhino compute connection...')

  try {
    const response = await fetch('/solve/' + definition + '?thickness=0.5&min_r=0.1&square=0.5&strutsize=0.2&segment=8&links=4&cubecorners=0.3&smooth=0.7&max_r=0.8')

    if (response.ok) {
      const data = await response.text()
      if (data && data.length > 100) { // Probably got real data
        isRhinoComputeWorking = true
        updateLoadingStatus('✅ Rhino compute working!')
        compute() // Start with real computation
        return
      }
    }
  } catch (error) {
    console.warn('Rhino compute test failed:', error)
  }

  // If we get here, rhino compute is not working
  isRhinoComputeWorking = false
  updateLoadingStatus('🔄 Using demo mode (rhino compute unavailable)')
  setTimeout(() => {
    createDemoMode()
    hideLoadingStatus()
  }, 1000)
}

function init() {
  updateLoadingStatus('Initializing 3D scene...')

  // Rhino models are z-up, so set this as the default
  THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1)

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a1a)

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000)
  camera.position.set(50, 50, 50)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true

  const container = document.querySelector('#container') || document.body
  container.appendChild(renderer.domElement)

  // Add lights
  const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 10, 5)
  directionalLight.castShadow = true
  scene.add(directionalLight)

  // Orbit controls
  controls = new THREE.OrbitControls(camera, renderer.domElement)

  window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })

  animate()
  updateLoadingStatus('3D scene initialized')
}

// Main compute function
async function compute() {
  if (!isRhinoComputeWorking) {
    createDemoMode()
    return
  }

  try {
    updateLoadingStatus('Solving Grasshopper definition...')

    // Get slider values
    const params = {
      thickness: parseFloat(document.getElementById('thickness')?.value || 50) / 100,
      min_r: parseFloat(document.getElementById('min_r')?.value || 10) / 100,
      square: parseFloat(document.getElementById('square')?.value || 50) / 100,
      strutsize: parseFloat(document.getElementById('strutsize')?.value || 10) / 10,
      segment: parseInt(document.getElementById('segment')?.value || 6),
      links: parseInt(document.getElementById('links')?.value || 4),
      cubecorners: parseInt(document.getElementById('cubecorners')?.value || 0),
      smooth: parseFloat(document.getElementById('smooth')?.value || 50) / 10,
      max_r: parseFloat(document.getElementById('max_r')?.value || 500)
    }

    // Build URL with parameters
    const url = new URL('/solve/' + definition, window.location.origin)
    Object.keys(params).forEach(key => {
      url.searchParams.append(key, params[key])
    })

    console.log('Solving with params:', params)

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const responseText = await response.text()
    console.log('Raw response:', responseText.substring(0, 200) + '...')

    // Process the rhino compute response
    await collectResults(responseText)

  } catch (error) {
    console.error('Compute error:', error)
    updateLoadingStatus('❌ Compute failed, switching to demo mode')
    isRhinoComputeWorking = false
    setTimeout(() => createDemoMode(), 1000)
  }
}

// Process rhino compute results
async function collectResults(responseText) {
  try {
    // Clear previous objects
    scene.traverse(child => {
      if (Object.prototype.hasOwnProperty.call(child.userData, 'objectType') && child.userData.objectType === 'File3dm') {
        scene.remove(child)
      }
    })

    updateLoadingStatus('Processing rhino geometry...')

    // The response is base64 encoded rhino file
    const arr = base64ToArrayBuffer(responseText)

    // Load rhino3dm if not already loaded
    if (!rhino3dm) {
      rhino3dm = await import('https://unpkg.com/rhino3dm@8.0.0-beta/rhino3dm.module.js')
    }

    const doc = rhino3dm.File3dm.fromByteArray(arr)

    if (doc.objects().count < 1) {
      console.warn('No rhino objects to load')
      updateLoadingStatus('⚠️ No geometry in response')
      return
    }

    console.log(`Loading ${doc.objects().count} rhino objects`)

    // Convert rhino objects to Three.js
    const rhinoObjects = []
    for (let i = 0; i < doc.objects().count; i++) {
      const rhinoObject = doc.objects().get(i)
      if (rhinoObject.geometry) {
        rhinoObjects.push(rhinoObject.geometry)
      }
    }

    // Create Three.js meshes from rhino geometry
    const threeObjects = rhinoObjects.map((rhinoGeometry, index) => {
      if (rhinoGeometry.type === 'Mesh') {
        const threeGeometry = rhinoMeshToThreeMesh(rhinoGeometry)
        const material = new THREE.MeshLambertMaterial({
          color: new THREE.Color().setHSL(index / rhinoObjects.length, 0.7, 0.5),
          transparent: true,
          opacity: 0.8
        })
        const mesh = new THREE.Mesh(threeGeometry, material)
        mesh.castShadow = true
        mesh.receiveShadow = true
        return mesh
      }
      return null
    }).filter(obj => obj !== null)

    // Add to scene
    threeObjects.forEach(obj => scene.add(obj))

    // Zoom to fit
    if (threeObjects.length > 0) {
      zoomCameraToSelection(camera, controls, threeObjects)
    }

    updateLoadingStatus(`✅ Loaded ${threeObjects.length} meshes!`)
    setTimeout(() => hideLoadingStatus(), 2000)

    // Setup slider listeners
    setupSliderListeners()

  } catch (error) {
    console.error('Error processing rhino results:', error)
    updateLoadingStatus('❌ Error processing geometry')
    throw error
  }
}

// Convert rhino mesh to Three.js mesh
function rhinoMeshToThreeMesh(rhinoMesh) {
  const threeGeometry = new THREE.BufferGeometry()

  // Get vertices
  const vertices = []
  const rhinoVertices = rhinoMesh.vertices()
  for (let i = 0; i < rhinoVertices.count; i++) {
    const vertex = rhinoVertices.get(i)
    vertices.push(vertex.x, vertex.y, vertex.z)
  }

  // Get faces
  const indices = []
  const rhinoFaces = rhinoMesh.faces()
  for (let i = 0; i < rhinoFaces.count; i++) {
    const face = rhinoFaces.get(i)
    if (face.length === 3) {
      indices.push(face[0], face[1], face[2])
    } else if (face.length === 4) {
      // Convert quad to triangles
      indices.push(face[0], face[1], face[2])
      indices.push(face[0], face[2], face[3])
    }
  }

  threeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  threeGeometry.setIndex(indices)
  threeGeometry.computeVertexNormals()

  return threeGeometry
}

// Demo mode for when rhino compute is not working
function createDemoMode() {
  updateLoadingStatus('Creating demo structure...')

  // Clear previous objects
  scene.traverse(child => {
    if (Object.prototype.hasOwnProperty.call(child.userData, 'objectType') && child.userData.objectType === 'File3dm') {
      scene.remove(child)
    }
  })

  const group = new THREE.Group()

  // Get slider values
  const thickness = (document.getElementById('thickness')?.value || 50) / 100
  const segments = Math.min(6, Math.max(3, parseInt(document.getElementById('segment')?.value) || 4))

  // Create parametric structure
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < segments; j++) {
      for (let k = 0; k < segments; k++) {
        if ((i + j + k) % 2 === 0) {
          const geometry = new THREE.BoxGeometry(0.5 + thickness, 0.5 + thickness, 0.5 + thickness)
          const material = new THREE.MeshLambertMaterial({
            color: new THREE.Color().setHSL((i + j + k) / (segments * 3), 0.7, 0.5),
            transparent: true,
            opacity: 0.8
          })

          const cube = new THREE.Mesh(geometry, material)
          cube.position.set(
            (i - segments/2) * 1.5,
            (j - segments/2) * 1.5,
            (k - segments/2) * 1.5
          )
          cube.castShadow = true
          cube.receiveShadow = true
          group.add(cube)
        }
      }
    }
  }

  scene.add(group)

  // Add ground plane
  const groundGeometry = new THREE.PlaneGeometry(20, 20)
  const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x333333, transparent: true, opacity: 0.3 })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  updateLoadingStatus(`✅ Demo: ${group.children.length} objects created`)
  setTimeout(() => hideLoadingStatus(), 2000)

  setupSliderListeners()
}

// Setup slider event listeners
function setupSliderListeners() {
  const sliders = ['thickness', 'segment', 'links', 'min_r', 'max_r', 'square', 'strutsize', 'cubecorners', 'smooth']

  sliders.forEach(sliderId => {
    const slider = document.getElementById(sliderId)
    if (slider) {
      slider.addEventListener('input', function() {
        updateLoadingStatus('Updating...')
        compute()
      })
    }
  })
}

// Utility functions
function base64ToArrayBuffer(base64) {
  const binary_string = window.atob(base64)
  const len = binary_string.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i)
  }
  return bytes.buffer
}

function zoomCameraToSelection(camera, controls, selection, fitOffset = 1.2) {
  const box = new THREE.Box3()

  for (const object of selection) {
    if (object.isLight) continue
    box.expandByObject(object)
  }

  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())

  const maxSize = Math.max(size.x, size.y, size.z)
  const fitHeightDistance = maxSize / (2 * Math.atan(Math.PI * camera.fov / 360))
  const fitWidthDistance = fitHeightDistance / camera.aspect
  const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance)

  const direction = controls.target.clone()
    .sub(camera.position)
    .normalize()
    .multiplyScalar(distance)
  controls.maxDistance = distance * 10
  controls.target.copy(center)

  camera.near = distance / 100
  camera.far = distance * 100
  camera.updateProjectionMatrix()
  camera.position.copy(controls.target).sub(direction)

  controls.update()
}

function animate() {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}
