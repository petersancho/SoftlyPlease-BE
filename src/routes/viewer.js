const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
  const definitions = req.app.get('definitions') || []

  // Get the definition parameter if provided
  const definitionParam = req.query.definition || 'TopoOpt.gh'
  const selectedDefinition = definitions.find(d => d.name === definitionParam) || definitions[0]

  const viewerHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>McNeel GH Examples - 3D Viewer</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: 'Times New Roman', serif;
                background-image:
                    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
                background-size: 20px 20px;
                background-color: #000000;
                color: #ffffff;
                height: 100vh;
                overflow: hidden;
            }
            .viewer-container {
                display: flex;
                height: 100vh;
            }
            .sidebar {
                width: 350px;
                background: #1a1a1a;
                padding: 20px;
                border-right: 1px solid #333;
                overflow-y: auto;
            }
            .viewer-main {
                flex: 1;
                position: relative;
            }
            .back-link {
                position: fixed;
                top: 20px;
                left: 20px;
                background: rgba(255, 255, 255, 0.1);
                color: #ffffff;
                padding: 10px 20px;
                border-radius: 25px;
                text-decoration: none;
                font-weight: 500;
                z-index: 1000;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .header h1 {
                font-size: 2rem;
                margin-bottom: 10px;
                color: #ffffff;
            }
            .header p {
                color: #cccccc;
                font-size: 0.9rem;
            }
            #viewer {
                width: 100%;
                height: 100%;
                background: #000000;
            }
            .viewer-overlay {
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                padding: 15px;
                border-radius: 8px;
                color: #ffffff;
                font-size: 0.9rem;
                z-index: 100;
            }
            .btn {
                background: linear-gradient(45deg, #ff6b9d, #4ecdc4);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                margin: 10px 0;
                width: 100%;
                transition: all 0.3s ease;
            }
            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(255, 107, 157, 0.3);
                background: linear-gradient(45deg, #ffe66d, #ff6b9d);
            }
        </style>
    </head>
    <body>
        <a href="/" class="back-link">← Back to Home</a>
        <div class="viewer-container">
            <div class="sidebar">
                <div class="header">
                    <h1>🧩 McNeel GH Examples</h1>
                    <p>Interactive Grasshopper definition viewer</p>
                    <p><strong>Current:</strong> ${definitionParam}</p>
                </div>

                <div style="margin: 20px 0;">
                    <select id="definitionSelect" style="width: 100%; padding: 10px; background: #2a2a2a; color: #ffffff; border: 1px solid #444; border-radius: 4px;">
                        ${definitions.map(def => `
                            <option value="${def.name}" ${def.name === definitionParam ? 'selected' : ''}>
                                ${def.name.replace('.gh', '')}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <button id="computeBtn" class="btn">🚀 Generate Geometry</button>
                <button id="resetViewBtn" class="btn" style="background: #444; margin-top: 10px;">🔄 Reset View</button>

                <div style="margin-top: 20px; padding: 15px; background: #2a2a2a; border-radius: 8px;">
                    <h3 style="color: #ffffff; margin-bottom: 10px;">📤 Export</h3>
                    <button id="exportOBJ" class="btn" style="background: #444; font-size: 0.9rem;">📄 OBJ</button>
                    <button id="exportSTL" class="btn" style="background: #444; font-size: 0.9rem;">🏗️ STL</button>
                    <button id="exportJSON" class="btn" style="background: #444; font-size: 0.9rem;">📊 JSON</button>
                </div>
            </div>

            <div class="viewer-main">
                <div id="viewer"></div>
                <div class="viewer-overlay">
                    <h4>🎮 Controls</h4>
                    <p><strong>Rotate:</strong> Left click + drag</p>
                    <p><strong>Zoom:</strong> Mouse wheel</p>
                    <p><strong>Pan:</strong> Right click + drag</p>
                </div>
            </div>
        </div>

        <script>
            class GeometryViewer {
                constructor(containerId) {
                    this.container = document.getElementById(containerId);
                    this.scene = null;
                    this.camera = null;
                    this.renderer = null;
                    this.controls = null;
                    this.currentGeometry = null;
                    this.init();
                }

                init() {
                    this.scene = new THREE.Scene();
                    this.scene.background = new THREE.Color(0x000000);

                    this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
                    this.camera.position.set(10, 10, 10);

                    this.renderer = new THREE.WebGLRenderer({ antialias: true });
                    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
                    this.container.appendChild(this.renderer.domElement);

                    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
                    this.setupLighting();
                    this.addGridHelper();
                    this.animate();

                    window.addEventListener('resize', () => this.onWindowResize());
                }

                setupLighting() {
                    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
                    this.scene.add(ambientLight);

                    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
                    directionalLight.position.set(10, 10, 5);
                    this.scene.add(directionalLight);
                }

                addGridHelper() {
                    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
                    this.scene.add(gridHelper);
                    const axesHelper = new THREE.AxesHelper(5);
                    this.scene.add(axesHelper);
                }

                createSampleGeometry() {
                    const geometry = new THREE.BoxGeometry(3, 3, 3);
                    const material = new THREE.MeshLambertMaterial({ color: 0x666666 });
                    const cube = new THREE.Mesh(geometry, material);
                    this.scene.add(cube);
                    this.currentGeometry = cube;
                }

                animate() {
                    requestAnimationFrame(() => this.animate());
                    this.controls.update();
                    this.renderer.render(this.scene, this.camera);
                }

                onWindowResize() {
                    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
                    this.camera.updateProjectionMatrix();
                    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
                }
            }

            let viewer = null;
            let currentDefinition = '${definitionParam}';

            document.addEventListener('DOMContentLoaded', function() {
                viewer = new GeometryViewer('viewer');
                viewer.createSampleGeometry();

                document.getElementById('definitionSelect').addEventListener('change', function(e) {
                    currentDefinition = e.target.value;
                    console.log('Selected definition:', currentDefinition);
                });

                document.getElementById('computeBtn').addEventListener('click', function() {
                    console.log('Computing geometry for:', currentDefinition);
                    alert('Geometry computation would happen here for: ' + currentDefinition);
                });

                document.getElementById('resetViewBtn').addEventListener('click', function() {
                    if (viewer) {
                        viewer.camera.position.set(10, 10, 10);
                        viewer.controls.target.set(0, 0, 0);
                        viewer.controls.update();
                    }
                });

                document.getElementById('exportOBJ').addEventListener('click', () => alert('OBJ export not implemented'));
                document.getElementById('exportSTL').addEventListener('click', () => alert('STL export not implemented'));
                document.getElementById('exportJSON').addEventListener('click', () => alert('JSON export not implemented'));
            });
        </script>
    </body>
</html>`

  res.send(viewerHtml)
})

module.exports = router
