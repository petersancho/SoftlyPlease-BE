/* eslint no-undef: "off", no-unused-vars: "off" */
/**
 * ULTRA-SIMPLE DEMO MODE - No external dependencies that can fail
 * This creates a basic 3D scene immediately using only Three.js global
 */

// Global variables
let scene, camera, renderer
let animationId

// Initialize immediately when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  init()
  createSimpleDemo()
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

function init() {
  updateLoadingStatus('Starting 3D demo...')

  // Create scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a1a)

  // Create camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.set(5, 5, 5)

  // Create renderer
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  // Add to DOM
  const container = document.querySelector('#container') || document.body
  container.appendChild(renderer.domElement)

  // Add lights
  const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 10, 5)
  directionalLight.castShadow = true
  scene.add(directionalLight)

  // Simple orbit controls (basic implementation)
  setupSimpleControls()

  // Handle window resize
  window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })

  animate()
  updateLoadingStatus('✅ 3D Demo Ready!')
  setTimeout(() => hideLoadingStatus(), 2000)
}

function setupSimpleControls() {
  let isDragging = false
  let previousMousePosition = { x: 0, y: 0 }

  renderer.domElement.addEventListener('mousedown', function(e) {
    isDragging = true
    previousMousePosition = { x: e.clientX, y: e.clientY }
  })

  renderer.domElement.addEventListener('mousemove', function(e) {
    if (!isDragging) return

    const deltaX = e.clientX - previousMousePosition.x
    const deltaY = e.clientY - previousMousePosition.y

    // Rotate camera around scene
    const radius = Math.sqrt(camera.position.x ** 2 + camera.position.y ** 2 + camera.position.z ** 2)
    let theta = Math.atan2(camera.position.x, camera.position.z)
    let phi = Math.acos(camera.position.y / radius)

    theta -= deltaX * 0.01
    phi += deltaY * 0.01
    phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi))

    camera.position.x = radius * Math.sin(phi) * Math.sin(theta)
    camera.position.y = radius * Math.cos(phi)
    camera.position.z = radius * Math.sin(phi) * Math.cos(theta)

    camera.lookAt(0, 0, 0)
    previousMousePosition = { x: e.clientX, y: e.clientY }
  })

  renderer.domElement.addEventListener('mouseup', function() {
    isDragging = false
  })

  // Mouse wheel zoom
  renderer.domElement.addEventListener('wheel', function(e) {
    e.preventDefault()
    const zoomSpeed = 0.1
    const radius = Math.sqrt(camera.position.x ** 2 + camera.position.y ** 2 + camera.position.z ** 2)
    const newRadius = Math.max(2, Math.min(20, radius + e.deltaY * zoomSpeed * 0.01))

    const ratio = newRadius / radius
    camera.position.multiplyScalar(ratio)
  })
}

function createSimpleDemo() {
  updateLoadingStatus('Creating 3D structure...')

  // Create a simple parametric structure
  const group = new THREE.Group()

  // Get slider values
  const thickness = (document.getElementById('thickness')?.value || 50) / 100
  const segments = Math.min(6, Math.max(3, parseInt(document.getElementById('segment')?.value) || 4))

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < segments; j++) {
      for (let k = 0; k < segments; k++) {
        if ((i + j + k) % 2 === 0) {
          // Create cube
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

          // Add connecting lines/struts
          if (i < segments - 1 && (i + j + k) % 3 === 0) {
            const strutGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5)
            const strutMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 })
            const strut = new THREE.Mesh(strutGeometry, strutMaterial)
            strut.position.set(
              (i - segments/2) * 1.5 + 0.75,
              (j - segments/2) * 1.5,
              (k - segments/2) * 1.5
            )
            strut.rotation.z = Math.PI / 2
            group.add(strut)
          }
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

  updateLoadingStatus(`✅ Created ${group.children.length} objects!`)
  setTimeout(() => hideLoadingStatus(), 2000)

  // Make sliders interactive
  setupSliderListeners(group)
}

function setupSliderListeners(originalGroup) {
  const sliders = ['thickness', 'segment', 'links', 'min_r', 'max_r', 'square', 'strutsize', 'cubecorners', 'smooth']

  sliders.forEach(sliderId => {
    const slider = document.getElementById(sliderId)
    if (slider) {
      slider.addEventListener('input', function() {
        updateLoadingStatus('Updating...')

        // Remove old structure
        scene.children.forEach(child => {
          if (child.type === 'Group') {
            scene.remove(child)
          }
        })

        // Create new structure
        createSimpleDemo()
      })
    }
  })
}

function animate() {
  animationId = requestAnimationFrame(animate)
  renderer.render(scene, camera)
}
