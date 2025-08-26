# 🔧 **SOFTLYPLEASE.COM BACKEND/FRONTEND FUNCTIONS GUIDE**
## **Current System Architecture & Function Reference**

**For your specific setup:**
- **Azure VM**: Rhino-Compute-SP (IP: 4.248.252.92)
- **Heroku AppServer**: softlyplease-appserver.herokuapp.com
- **Rhino Compute Port**: 6500
- **Auth Token**: [eyJSYXdPcGVuSWRUb2tlbiI6ICJleUpoYkdjaU9pSlNVekkxTmlJc0ltdHBaQ0k2SWpFaUxDSjBlWEFpT2lKS1YxUWlmUS5leUp6ZFdJaU9pSTFPVEV3TWpreE9EUTJOVEk1TURJMElpd2laVzFoYVd3aU9pSndaWFJsY21wellXNWphRzlBWjIxaGFXd3VZMjl0SWl3aVpXMWhhV3dmZG1WeWFXWnBaV1FpT25SeWRXVXNJbU52YlM1eWFHbHViek5rTG1GalkyOTFiblJ6TG1WdFlXbHNjeUk2V3lKd1pYUmxjbXB6WVc1amFHOUFaMjFoYVd3dVkyOXRJbDBzSW01aGJXVWlPaUpRWlhSbGNpQlhhVzVuYnlJc0lteHZZMkZzWlNJNkltVnVMV05oSWl3aWNHbGpkSFZ5WlNJNkltaDBkSEJ6T2k4dmQzZDNMbWR5WVhaaGRHRnlMbU52YlM5aGRtRjBZWEl2Tmpaall6bGtaVEkxT1RFNU9EZzNOakZpWm1JMll6VmtaV05qWkdFNE9HSV9aRDF5WlhSeWJ5SXNJbU52YlM1eWFHbHViek5rTG1GalkyOTFiblJ6TG0xbGJXSmxjbDluY205MWNITWlPbHQ3SW1sa0lqb2lOakExTlRFd09UUXlNREV5TWpFeE1pSXNJbTVoYldVaU9pSk5Ra1ZNWVdJaUxDSmtiMjFoYVc1eklqcGJYWDFkTENKamIyMHVjbWhwYm04elpDNWhZMk52ZFc1MGN5NWhaRzFwYmw5bmNtOTFjSE1pT2x0ZExDSmpiMjB1Y21ocGJtOHpaQzVoWTJOdmRXNTBjeTV2ZDI1bGNsOW5jbTkxY0hNaU9sdDdJbWxrSWpvaU5EYzRPVFF4TlRrek56Z3pOVEF3T0NJc0ltNWhiV1VpT2lKRGIyMXdkWFJsSUhSbFlXMGlMQ0prYjIxaGFXNXpJanBiWFgxZExDSmpiMjB1Y21ocGJtOHpaQzVoWTJOdmRXNTBjeTV6YVdRaU9pSnJVWEYxSzNaV2JuUXlhbTl0U1hkMWFVWTFSM2hTVURaVE1ITTVkVVJxWkU4dlUxZEJORU0zTDNkelBTSXNJbWx6Y3lJNkltaDBkSEJ6T2k4dllXTmpiM1Z1ZEhNdWNtaHBibTh6WkM1amIyMGlMQ0poZFdRaU9pSmpiRzkxWkY5NmIyOWZZMnhwWlc1MElpd2laWGh3SWpvek16TXhNRFE0TURVMExDSnBZWFFpT2pFM05UUXlORGd3TlRVc0ltRjFkR2hmZEdsdFpTSTZNVGMxTkRJME1qRXpOU3dpYm05dVkyVWlPaUphZWs4elR6bE5OM0k1V1ZKVFFWUnFPRzE0UWxkcFlrNXNlblJyZEVoamRIWlFSRTVoY2pocFUxcEllWGxwUzBaSE5sSllWalY0UjA1NWFWWjBhRk5sSWl3aVlYUmZhR0Z6YUNJNkltSjFjVzlMT1Y5bFR6ZG5aVEpPWDJaZmVteEdkV2M5UFNKOS5DN0hxcVp6MDhQYkRMSEdBVHJvcmhvVEVud2lfQ0ZIYmdrYUoxSXFIVkQ2b3hGU2dMLUZWUjlGNHJkQmFiU3VMU2p2b0IwOW56ZGo3TlE0U29jSVlGNjJheDhkQjZSRTNaTW1NclhyZ1J5SUlTUlh6dmlqdE5oN3BWU1ZwMnVLdUFoZEFJZFJwekpMRHducTRZWHE1MlcwZmdjVHVicWlOSDE5X3RhbU9CVkVKa1hKZTBKWDU0X09KWWdFN1FIbXotQllSU0ZESWlLLWljRkJKbVAzeFFsMzBNeFduZ0pOWk5mazBWOWJTMDFqaU9lNUNRVGNndHM5M1V4UlRwRGNJQXg1UklsNDlqdHN5cW5YUEJvR1NvRG13Rjg3Y1lsMDY3dnh1VW44a1ZPdkFPVEREbTlzb2ctZ3Y3elFoSEd1aTRhb0dQblB5LUFZaEhMWW1sQkxTeFEiLCAiUmF3T0F1dGgyVG9rZW4iOiAiZXlKaGJHY2lPaUpJVXpJMU5pSjkuZXlKaklqb3hMQ0p3SWpveExDSmlOalJwZGlJNkltSlNUV1IwVVVkMk4yZEdZVEpRWjJSVU5HVmpWM2M5UFNJc0ltSTJOR04wSWpvaVlYb3ZVRmRyWkc5NGJUWjJZMWh6YVRCYWEyYzRiVEV5WlZRMFZscHphbmRhYkN0bmNuTklPVXA1YmtkUE5VMTNWek41TlZNMVdIQnJiWE5NUWk5V1lsSXZkMWxwYTNKMldIQkdZMWR0ZFRkS1VXY3pLMlYyWkVkbFVWWmlXRFJpTkRkWVpFUlZWVkJwWXpnOUlpd2lhV0YwSWpveE56VTBNalE0TURVMWZRLjdBZmVzbGJRSXlxa0Y1VXhIampGUFpubjN4dWJqRHFDRF9Nb1VZWFZtaUUiLCAiU2NvcGUiOiBbImxpY2Vuc2VzIiwgInByb2ZpbGUiLCAiZ3JvdXBzIiwgImVtYWlsIiwgIm5vZXhwaXJlIiwgIm9wZW5pZCJdLCAiR3JvdXBJZCI6ICI0Nzg5NDE1OTM3ODM1MDA4In0=]

---

## 📋 **TABLE OF CONTENTS**

### **1. SYSTEM OVERVIEW**
- 1.1 Architecture Overview
- 1.2 Technology Stack
- 1.3 Data Flow

### **2. BACKEND FUNCTIONS**
- 2.1 Core API Endpoints
- 2.2 Express.js Routes
- 2.3 Rhino Compute Integration
- 2.4 Caching System
- 2.5 Error Handling

### **3. FRONTEND FUNCTIONS**
- 3.1 Example Applications
- 3.2 Three.js Integration
- 3.3 API Communication
- 3.4 User Interface Components
- 3.5 Responsive Design

### **4. GRASSHOPPER DEFINITIONS**
- 4.1 Available Definitions
- 4.2 Input/Output Specifications
- 4.3 Example Usage

### **5. API REFERENCE**
- 5.1 REST Endpoints
- 5.2 Request/Response Formats
- 5.3 Authentication
- 5.4 Error Codes

### **6. CONFIGURATION**
- 6.1 Environment Variables
- 6.2 File Structure
- 6.3 Build Process

### **7. DEVELOPMENT WORKFLOW**
- 7.1 Adding New Examples
- 7.2 Testing Procedures
- 7.3 Deployment Process

---

## **1. SYSTEM OVERVIEW**

### **1.1 Architecture Overview**
```
User Browser → Heroku AppServer → Azure VM Rhino Compute
     ↓              ↓                    ↓
   Frontend     Node.js Server     Geometry Engine
   (static)     (solves GH defs)   (port 6500)

Current URLs:
├── Frontend: https://softlyplease-appserver.herokuapp.com/
├── API Base: https://softlyplease-appserver.herokuapp.com/
└── Rhino Compute: http://4.248.252.92:6500/
```

### **1.2 Technology Stack**
**Backend:**
- Node.js 16.x + Express.js
- compute-rhino3d SDK
- Memcached (Heroku) + node-cache (local)
- CORS enabled
- HTTPS/SSL

**Frontend:**
- HTML5 + JavaScript (ES6 Modules)
- Three.js 0.156.1 (3D rendering)
- rhino3dm 8.0.0-beta (Rhino geometry)
- Responsive CSS Grid/Flexbox

**Compute Engine:**
- Rhino 7 + Grasshopper
- Windows Server (Azure VM)
- REST API with API key authentication

### **1.3 Data Flow**
```
1. User loads example HTML page
2. JavaScript initializes Three.js scene
3. User inputs parameters (width, height, etc.)
4. Frontend sends POST/GET to /solve/[definition]
5. Heroku forwards request to Azure VM
6. Rhino Compute processes Grasshopper definition
7. Results flow back: VM → Heroku → Frontend
8. rhino3dm.js loads geometry into Three.js scene
9. User sees interactive 3D model
```

---

## **2. BACKEND FUNCTIONS**

### **2.1 Core API Endpoints**

#### **GET / - List Definitions**
```javascript
// Function: Lists all available Grasshopper definitions
// Route: src/routes/index.js
app.get('/', async (req, res) => {
    const definitions = req.app.get('definitions');
    res.json(definitions.map(def => ({ name: def.name })));
});

// Example Response:
[
    {"name": "beam_mod.gh"},
    {"name": "dresser3.gh"},
    {"name": "delaunay.gh"},
    // ... 11 more definitions
]
```

#### **GET /definition/[name] - Definition Details**
```javascript
// Function: Returns HTML page with definition info
// Route: src/routes/definition.js
app.get('/definition/:definition(*)', (req, res) => {
    const definition = definitions.find(d => d.name === req.params.definition);
    if (!definition) return res.status(404).send('Definition not found');
    res.render('definition', { definition });
});
```

#### **GET/POST /solve/[definition] - Solve Definition**
```javascript
// Function: Solves Grasshopper definition with inputs
// Route: src/routes/solve.js
app.get('/solve/:definition(*)', computeParams, collectParams, checkCache, solveDefinition);
app.post('/solve/:definition(*)', computeParams, collectParams, checkCache, solveDefinition);

// Input Formats:
// GET: /solve/dresser3.gh?width=100&height=200&depth=50
// POST: { "inputs": {"width": 100, "height": 200, "depth": 50} }
```

#### **GET /version - Version Info**
```javascript
// Function: Returns system version and status
// Route: src/routes/version.js
app.get('/version', (req, res) => {
    res.json({
        version: require('../version').version,
        rhino_compute_url: process.env.RHINO_COMPUTE_URL,
        timestamp: new Date().toISOString()
    });
});
```

### **2.2 Express.js Routes**

#### **Route Structure:**
```
src/routes/
├── index.js      # Main routes (/, /?format=json)
├── solve.js      # Definition solving logic
├── definition.js # Definition metadata
├── template.js   # View templates (hbs)
└── version.js    # System info
```

#### **Middleware Stack:**
```javascript
// src/app.js - Main application setup
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(compression());
app.use('/examples', express.static(__dirname + '/examples'));
app.set('view engine', 'hbs');
```

### **2.3 Rhino Compute Integration**

#### **SDK Configuration:**
```javascript
// src/routes/solve.js
const compute = require('compute-rhino3d');

// Environment variables set API connection
const computeParams = (req, res, next) => {
    compute.url = process.env.RHINO_COMPUTE_URL;        // http://4.248.252.92:6500/
    compute.apiKey = process.env.RHINO_COMPUTE_KEY;     // API authentication
    next();
};
```

#### **Solve Function:**
```javascript
const solveDefinition = async (req, res) => {
    try {
        const result = await compute.Grasshopper.evaluateDefinition(
            definition,  // Grasshopper definition object
            inputs,      // User parameters
            true         // Return geometry data
        );

        // Response includes geometry, computation time, caching info
        res.json({
            definition: req.locals.params.definition.name,
            inputs: req.locals.params.inputs,
            outputs: result,
            computation_time: performance.now() - startTime,
            cached: false
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
```

### **2.4 Caching System**

#### **Multi-Level Caching:**
```javascript
// 1. Memcached (Heroku addon)
if (process.env.MEMCACHIER_SERVERS) {
    mc = memjs.Client.create(process.env.MEMCACHIER_SERVERS);
}

// 2. Node-cache (local fallback)
const cache = new NodeCache();

// 3. Cache key generation
const key = JSON.stringify({
    definition: { name: def.name, id: def.id },
    inputs: req.locals.params.inputs
});
```

#### **Cache TTL Settings:**
```javascript
// Environment variables control cache duration
CACHE_DEFAULT_TTL=3600     // 1 hour
CACHE_BEAM_TTL=1800        // 30 minutes
CACHE_TOPOOPT_TTL=7200     // 2 hours
```

### **2.5 Error Handling**

#### **Global Error Handler:**
```javascript
// src/app.js
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: err.message,
        status: err.status
    });
});
```

#### **Definition-Specific Errors:**
```javascript
// Definition not found
if (!definition) {
    const error = new Error(`Definition '${definitionName}' not found on server.`);
    error.status = 404;
    throw error;
}

// Rhino Compute errors
if (result.error) {
    throw new Error(`Rhino Compute: ${result.error.message}`);
}
```

---

## **3. FRONTEND FUNCTIONS**

### **3.1 Example Applications**

#### **Main Examples Page:**
```javascript
// src/examples/index.html
// Lists all available examples with descriptions
const examples = [
    { name: 'dresser3', desc: 'Interactive 3D dresser design' },
    { name: 'delaunay', desc: 'Delaunay triangulation with point input' },
    { name: 'spikyThing', desc: 'SubD components with Draco compression' },
    // ... etc
];
```

#### **Individual Example Structure:**
```html
<!-- src/examples/dresser3.html -->
<body>
    <!-- Navigation -->
    <a href="../" class="nav-link">← Back to Examples</a>

    <!-- Parameters Panel -->
    <div class="parameters-panel">
        <h2>Design Parameters</h2>
        <input id="width" type="number" value="100" min="50" max="300">
        <input id="height" type="number" value="200" min="100" max="400">
        <button id="solve-btn">Generate 3D Model</button>
    </div>

    <!-- 3D Viewer -->
    <div id="viewer"></div>

    <!-- Status Display -->
    <div id="status" class="status info">Ready to generate</div>
</body>
```

### **3.2 Three.js Integration**

#### **Scene Setup:**
```javascript
// Initialize Three.js scene
let scene, camera, renderer, controls;

async function init() {
    // Scene and camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Renderer with shadows
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = true;

    // Orbit controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.castShadow = true;

    // Grid and helpers
    const gridHelper = new THREE.GridHelper(400, 20);
}
```

#### **Geometry Loading:**
```javascript
// Load Rhino geometry into Three.js
async function displayGeometry(geometryData) {
    // Clear previous geometry
    scene.children = scene.children.filter(child =>
        child.type === 'AmbientLight' || child.type === 'DirectionalLight'
    );

    // Convert base64 to ArrayBuffer
    const geometryBuffer = Uint8Array.from(atob(geometryData), c => c.charCodeAt(0));

    // Parse with rhino3dm
    rhino3dmLoader.parse(geometryBuffer, function(object) {
        if (object && object.children) {
            object.children.forEach(child => {
                if (child.geometry) {
                    const material = new THREE.MeshLambertMaterial({
                        color: 0x8B4513,
                        transparent: true,
                        opacity: 0.9
                    });
                    const mesh = new THREE.Mesh(child.geometry, material);
                    scene.add(mesh);
                }
            });
        }
    });
}
```

### **3.3 API Communication**

#### **Dynamic API Configuration:**
```javascript
// Automatic environment detection
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://softlyplease-appserver.herokuapp.com';
```

#### **API Request Function:**
```javascript
async function generateModel() {
    const response = await fetch(`${API_BASE_URL}/solve/dresser3.gh`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            inputs: {
                width: width,
                height: height,
                depth: depth
            }
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    // Process result
    if (result.outputs && result.outputs.geometry) {
        await displayGeometry(result.outputs.geometry);
    }
}
```

### **3.4 User Interface Components**

#### **Parameter Controls:**
```javascript
// Dynamic input generation
function createParameterInput(name, label, value, min, max, step) {
    const div = document.createElement('div');
    div.className = 'parameter';
    div.innerHTML = `
        <label for="${name}">${label}</label>
        <input type="number" id="${name}" value="${value}"
               min="${min}" max="${max}" step="${step}">
    `;
    return div;
}
```

#### **Status Management:**
```javascript
function updateStatus(message, type = 'info') {
    const statusDiv = document.getElementById('status');
    statusDiv.className = `status ${type}`;
    statusDiv.textContent = message;
}

// Usage:
updateStatus('Sending request to server...', 'info');
updateStatus('Model generated successfully!', 'success');
updateStatus('Error: ' + error.message, 'error');
```

### **3.5 Responsive Design**

#### **CSS Grid Layout:**
```css
.main-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-top: 40px;
}

@media (max-width: 768px) {
    .main-content {
        grid-template-columns: 1fr;
    }
}
```

#### **Dynamic Sizing:**
```javascript
function resizeViewer() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', resizeViewer);
```

---

## **4. GRASSHOPPER DEFINITIONS**

### **4.1 Available Definitions**

| File | Description | Input Parameters |
|------|-------------|------------------|
| `beam_mod.gh` | Beam modification | length, width, height |
| `Bending_gridshell.gh` | Grid shell bending | points, forces |
| `BranchNodeRnd.gh` | Random branching nodes | seed, count, radius |
| `brep_union.gh` | BREP union operations | shapes, operation |
| `delaunay.gh` | Delaunay triangulation | points |
| `docString.gh` | Documentation strings | text, position |
| `dresser3.gh` | 3D dresser model | width, height, depth |
| `metaballTable.gh` | Metaball table geometry | points, radius |
| `QuadPanelAperture.gh` | Quad panel apertures | surface, pattern |
| `rnd_lattice.gh` | Random lattice structures | bounds, density |
| `rnd_node.gh` | Random node generation | count, spread |
| `SampleGHConvertTo3dm.gh` | 3DM conversion | geometry, format |
| `srf_kmeans.gh` | Surface K-means clustering | surface, clusters |
| `value_list.gh` | Value list operations | values, operation |

### **4.2 Input/Output Specifications**

#### **Input Format:**
```javascript
// All definitions accept JSON inputs
const inputs = {
    "width": 100,
    "height": 200,
    "depth": 50,
    "points": [[0,0,0], [10,0,0], [10,10,0]],
    "seed": 42,
    "count": 100
};
```

#### **Output Format:**
```javascript
// Standard response format
{
    "definition": "dresser3.gh",
    "inputs": {"width": 100, "height": 200, "depth": 50},
    "outputs": {
        "geometry": "base64EncodedRhinoGeometry",
        "mesh": "dracoCompressedMeshData"
    },
    "computation_time": 1250,
    "cached": false
}
```

### **4.3 Example Usage**

#### **dresser3.gh Example:**
```javascript
// Frontend usage
const inputs = {
    width: 120,    // cm
    height: 180,   // cm
    depth: 45      // cm
};

const response = await fetch('/solve/dresser3.gh', {
    method: 'POST',
    body: JSON.stringify({ inputs })
});
```

---

## **5. API REFERENCE**

### **5.1 REST Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all definitions (JSON) |
| GET | `/?format=json` | Same as above |
| GET | `/definition/[name]` | HTML page with definition info |
| GET | `/solve/[definition]?[params]` | Solve with query parameters |
| POST | `/solve/[definition]` | Solve with JSON body |
| GET | `/version` | System version and status |
| GET | `/examples/` | Static examples directory |

### **5.2 Request/Response Formats**

#### **GET Request:**
```bash
curl "https://softlyplease-appserver.herokuapp.com/solve/dresser3.gh?width=100&height=200&depth=50"
```

#### **POST Request:**
```bash
curl -X POST https://softlyplease-appserver.herokuapp.com/solve/dresser3.gh \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"width":100,"height":200,"depth":50}}'
```

#### **Response Format:**
```json
{
  "definition": "dresser3.gh",
  "inputs": {
    "width": 100,
    "height": 200,
    "depth": 50
  },
  "outputs": {
    "geometry": "base64EncodedRhinoGeometryData...",
    "mesh": "DracoCompressedMeshData..."
  },
  "computation_time": 1250,
  "cached": false
}
```

### **5.3 Authentication**
```javascript
// API key automatically included in headers
// No manual authentication required for frontend
const headers = {
    'Content-Type': 'application/json'
    // API key handled server-side
};
```

### **5.4 Error Codes**

| Code | Description | Example |
|------|-------------|---------|
| 200 | Success | Normal operation |
| 404 | Definition not found | `{"error": "Definition 'xyz.gh' not found"}` |
| 500 | Server error | `{"error": "Rhino Compute connection failed"}` |
| 503 | Service unavailable | Temporary service issues |

---

## **6. CONFIGURATION**

### **6.1 Environment Variables**

#### **Heroku Configuration:**
```bash
# Required for production
RHINO_COMPUTE_URL=http://4.248.252.92:6500/
RHINO_COMPUTE_APIKEY=p2robot-13a6-48f3-b24e-2025computeX
NODE_ENV=production

# Optional optimizations
WEB_CONCURRENCY=2
MAX_CONCURRENT_COMPUTATIONS=5
CACHE_DEFAULT_TTL=3600
```

#### **Development Configuration:**
```bash
# For local development
RHINO_COMPUTE_URL=http://localhost:6500/
NODE_ENV=development
```

### **6.2 File Structure**
```
src/
├── app.js                 # Main Express app
├── bin/www               # Server startup
├── routes/
│   ├── index.js          # Definition listing
│   ├── solve.js          # Main solving logic
│   └── ...
├── examples/             # Frontend examples
│   ├── index.html        # Examples menu
│   ├── dresser3.html     # 3D dresser example
│   └── ...
├── files/                # Grasshopper definitions
│   ├── dresser3.gh       # .gh files
│   └── ...
└── views/                # Handlebars templates
   ├── list.hbs          # Definition list
   └── definition.hbs    # Single definition
```

### **6.3 Build Process**
```bash
# Development
npm install
npm start

# Production deployment
git add .
git commit -m "Deploy updates"
git push heroku main

# Heroku build process
# 1. Install Node.js 16.x
# 2. npm install dependencies
# 3. npm run build (if needed)
# 4. Start web process
```

---

## **7. DEVELOPMENT WORKFLOW**

### **7.1 Adding New Examples**

#### **Step 1: Create HTML File**
```html
<!-- src/examples/newExample.html -->
<!DOCTYPE html>
<html>
<head>
    <title>New Example</title>
    <!-- Include standard imports -->
    <script async src="https://unpkg.com/es-module-shims@1.8.0/dist/es-module-shims.js"></script>
    <script type="importmap">
        {
            "imports": {
                "three": "https://unpkg.com/three@0.156.1/build/three.module.js",
                "rhino3dm": "https://unpkg.com/rhino3dm@8.0.0-beta/rhino3dm.module.js"
            }
        }
    </script>
</head>
<body>
    <!-- Your UI here -->
    <script type="module">
        // Your JavaScript here
    </script>
</body>
</html>
```

#### **Step 2: Update Examples Index**
```html
<!-- Add to src/examples/index.html -->
<tr>
    <td><a href="./newExample.html">newExample</a></td>
    <td>Description of your new example.</td>
</tr>
```

#### **Step 3: Add Grasshopper Definition**
```bash
# Place .gh file in src/files/
cp newDefinition.gh src/files/
```

### **7.2 Testing Procedures**

#### **Unit Testing:**
```bash
# Test API endpoints
curl -s https://softlyplease-appserver.herokuapp.com/ | jq .
curl -s "https://softlyplease-appserver.herokuapp.com/?format=json" | jq .

# Test specific definition
curl -s "https://softlyplease-appserver.herokuapp.com/solve/dresser3.gh?width=100" | jq .
```

#### **Integration Testing:**
```javascript
// Test full workflow
async function testWorkflow() {
    // 1. Load examples page
    const examples = await fetch('/examples/');
    console.log('Examples page loaded');

    // 2. Test API
    const definitions = await fetch('/').then(r => r.json());
    console.log(`Found ${definitions.length} definitions`);

    // 3. Test solve
    const result = await fetch('/solve/dresser3.gh?width=100')
        .then(r => r.json());
    console.log('Solve result:', result);
}
```

### **7.3 Deployment Process**

#### **Standard Deployment:**
```bash
# 1. Make changes
edit src/examples/newExample.html

# 2. Test locally
npm start
# Visit http://localhost:3000/examples/newExample.html

# 3. Commit and deploy
git add .
git commit -m "Add new example for X feature"
git push heroku main

# 4. Verify deployment
curl -s https://softlyplease-appserver.herokuapp.com/examples/newExample.html
```

#### **Emergency Rollback:**
```bash
# Check recent releases
heroku releases --app softlyplease-appserver

# Rollback to previous version
heroku rollback v194 --app softlyplease-appserver
```

---

## **📞 QUICK REFERENCE**

### **Most Used Functions:**

#### **Backend:**
```javascript
// Check system status
curl https://softlyplease-appserver.herokuapp.com/version

// List definitions
curl https://softlyplease-appserver.herokuapp.com/

// Solve definition
curl "https://softlyplease-appserver.herokuapp.com/solve/dresser3.gh?width=100"
```

#### **Frontend:**
```javascript
// Initialize Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

// Load Rhino geometry
rhino3dmLoader.parse(geometryBuffer, callback);

// Make API request
const response = await fetch('/solve/dresser3.gh', {
    method: 'POST',
    body: JSON.stringify({ inputs })
});
```

### **Current System Status:**
- ✅ **14 Grasshopper definitions** available
- ✅ **7 Interactive examples** deployed
- ✅ **Heroku AppServer** running (v195)
- ✅ **Azure VM Rhino Compute** operational
- ✅ **Full API pipeline** working
- ✅ **Caching system** active
- ✅ **SSL/HTTPS** enabled

**This guide documents all backend and frontend functions for your current softlyplease.com setup.** ��
