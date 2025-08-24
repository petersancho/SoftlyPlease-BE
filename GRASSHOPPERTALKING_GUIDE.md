# Grasshopper Talking Guide: Adjacent Payload System

This guide is the most crucial documentation for frontend developers working with the SoftlyPlease Compute API. It explains the **Adjacent Payload System** - how Grasshopper definitions are encoded as base64 binary files and sent alongside input parameters to create the complete computational payload.

## Table of Contents

### 1. Understanding the Adjacent Payload System
### 2. How Definition Files Are Encoded
### 3. Input Parameter Encapsulation
### 4. Payload Construction Process
### 5. Frontend Implementation Requirements
### 6. API Communication Flow
### 7. Payload Structure Details
### 8. Error Handling for Payloads
### 9. Performance Optimization
### 10. Examples and Code Templates

---

## 1. Understanding the Adjacent Payload System

### 1.1 What is the Adjacent Payload System?

The **Adjacent Payload System** is the core mechanism by which Grasshopper definitions are sent to Rhino Compute for solving. Instead of just sending a definition name, the system:

1. **Encodes the Grasshopper definition** as a base64 binary file
2. **Creates an adjacent payload** containing both the definition and inputs
3. **Sends this complete package** to Rhino Compute for processing
4. **Receives computed results** back from the geometry engine

### 1.2 Why This System Exists

**Technical Necessity:**
- **No Shared File System**: Rhino Compute runs as a separate service
- **Network Boundaries**: Definition files must cross network boundaries
- **Security**: Direct file access is restricted for safety
- **Caching**: Definition content needs to be cacheable by hash

**Architecture Benefits:**
- **Stateless Processing**: Each request is self-contained
- **Scalability**: Multiple Rhino Compute instances can process independently
- **Version Control**: Definition versions are tied to content hashes
- **Audit Trail**: Complete request/response logging

### 1.3 System Components

```
Frontend Request → Definition Encoding → Payload Construction → API Call → Definition Serving → Rhino Compute → Results
```

**Key Components:**
- **Definition Registry**: Manages `.gh` files and their hashes
- **Base64 Encoder**: Converts binary definition to text
- **Payload Constructor**: Builds the adjacent payload structure
- **Definition Server**: Serves encoded definitions by hash
- **Rhino Compute**: Processes the payload and solves

---

## 2. How Definition Files Are Encoded

### 2.1 File Discovery Process

**Automatic File Scanning:**
```javascript
// From src/definitions.js
function registerDefinitions() {
  const files = fs.readdirSync(path.join(__dirname, 'files/'))
  const definitions = []

  files.forEach(file => {
    if (file.includes('.gh') || file.includes('.ghx')) {
      const fullPath = path.join(__dirname, 'files/' + file)
      const hash = md5File.sync(fullPath)  // MD5 hash of file content

      definitions.push({
        name: file,              // "TopoOpt.gh"
        id: hash,               // Unique identifier
        path: fullPath          // Absolute file path
      })
    }
  })

  return definitions
}
```

**Hash Generation:**
- **Algorithm**: MD5 (Message Digest 5)
- **Input**: Complete binary content of `.gh` file
- **Output**: 32-character hexadecimal string
- **Purpose**: Unique identification and caching

### 2.2 File Serving Mechanism

**Hash-Based File Access:**
```javascript
// From src/routes/definition.js
router.get('/:id', function(req, res, next) {
  let definition = req.app.get('definitions').find(o => o.id === req.params.id)

  if (!definition) {
    return res.status(404).json({ error: 'Definition not found' })
  }

  // Serve the file directly
  res.sendFile(definition.path, options, (error) => {
    if (error) console.log(error)
  })
})
```

**URL Structure:**
```
GET /definition/{32_character_md5_hash}
```

**Example:**
```
Definition: TopoOpt.gh
MD5 Hash: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
Access URL: http://localhost:3000/definition/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### 2.3 Base64 Encoding Process

**How the System Encodes Definitions:**
```javascript
// The system reads the .gh file as binary
const fs = require('fs')
const definitionBuffer = fs.readFileSync('src/files/TopoOpt.gh')

// Converts to base64 string
const base64Definition = definitionBuffer.toString('base64')

// This base64 string is what gets sent to Rhino Compute
```

**Why Base64?**
- **Text Compatibility**: HTTP protocols work with text
- **Binary Preservation**: Maintains exact binary structure of `.gh` files
- **Network Safe**: No special character encoding issues
- **Standard Format**: Universally supported encoding scheme

---

## 3. Input Parameter Encapsulation

### 3.1 DataTree Structure Requirements

**Grasshopper DataTree Format:**
```javascript
// Parameters must be wrapped in arrays (DataTree structure)
// Single value
?width=1000
// Becomes: {0} → 1000

// Multiple values
?heights=1000&heights=2000&heights=3000
// Becomes: {0} → 1000, {1} → 2000, {2} → 2000

// POST with complex structure
{
  "definition": "TopoOpt.gh",
  "inputs": {
    "width": [1000, 1200, 800],      // Multiple widths
    "material": ["steel"],            // Single material
    "load": [5000]                    // Single load
  }
}
```

**DataTree Construction:**
```javascript
// From src/routes/solve.js
for (let [key, value] of Object.entries(res.locals.params.inputs)) {
  let param = new compute.Grasshopper.DataTree(key)
  param.append([0], Array.isArray(value) ? value : [value])
  trees.push(param)
}
```

### 3.2 Parameter Type Mapping

**Frontend to Grasshopper Type Conversion:**

| Frontend Input | Grasshopper Type | DataTree Structure | Example |
|----------------|------------------|--------------------|---------|
| `1000` | Number | `{0} → 1000` | `?length=1000` |
| `"steel"` | Text | `{0} → "steel"` | `?material=steel` |
| `true` | Boolean | `{0} → true` | `?enabled=true` |
| `[0,0,0]` | Point3d | `{0} → Point3d(0,0,0)` | `?point=0,0,0` |
| `[[0,0,0],[1,0,0]]` | Point3d List | `{0} → Point3d(0,0,0)`, `{1} → Point3d(1,0,0)` | `?points=0,0,0&points=1,0,0` |

### 3.3 Complex Parameter Handling

**Multi-Branch DataTrees:**
```javascript
// Multiple branches for one parameter
{
  "inputs": {
    "loads": [
      [1000, 2000, 3000],  // Branch 0: Three loads
      [500, 1500]          // Branch 1: Two loads
    ]
  }
}

// Becomes DataTree:
// Branch {0}: 1000, 2000, 3000
// Branch {1}: 500, 1500
```

**Mixed Data Types:**
```javascript
// Different parameter types in one request
{
  "inputs": {
    "name": ["Beam Analysis"],        // Text
    "width": [500],                   // Number
    "enabled": [true],                // Boolean
    "start_point": [[0, 0, 0]],       // Point3d
    "materials": ["steel", "wood"]    // Text List
  }
}
```

---

## 4. Payload Construction Process

### 4.1 Complete Request Flow

**Step-by-Step Process:**

```javascript
// 1. Frontend constructs the request
const requestPayload = {
  definition: "TopoOpt.gh",
  inputs: {
    width: [1000],
    height: [500],
    material: ["steel"]
  }
}

// 2. Backend processes the request
function collectParams(req, res, next) {
  res.locals.params = req.body  // POST request body

  // Find definition by name
  definition = req.app.get('definitions').find(o => o.name === res.locals.params.definition)
  res.locals.params.definition = definition

  next()
}

// 3. Definition path construction
function commonSolve(req, res, next) {
  let fullUrl = req.protocol + '://' + req.get('host')
  let definitionPath = `${fullUrl}/definition/${definition.id}`

  // 4. Parameter DataTree construction
  let trees = []
  for (let [key, value] of Object.entries(res.locals.params.inputs)) {
    let param = new compute.Grasshopper.DataTree(key)
    param.append([0], Array.isArray(value) ? value : [value])
    trees.push(param)
  }

  // 5. Call Rhino Compute with definition URL and parameters
  compute.Grasshopper.evaluateDefinition(definitionPath, trees, false)
    .then(response => {
      // Handle response
      const result = JSON.parse(response.text())
      delete result.pointer  // Remove internal pointer
      res.send(JSON.stringify(result))
    })
    .catch(error => next(error))
}
```

### 4.2 Definition URL Resolution

**How Definition URLs Are Built:**
```javascript
// The system constructs the definition URL dynamically
const definitionUrl = `${protocol}://${host}/definition/${definitionHash}`

// Example:
const definitionUrl = "http://localhost:3000/definition/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"

// Rhino Compute fetches this URL to get the definition file
// The file is served as binary content with base64 encoding capability
```

### 4.3 Adjacent Payload Structure

**What Gets Sent to Rhino Compute:**

```javascript
// The "adjacent payload" consists of two parts:

// Part 1: Definition File (served separately)
GET /definition/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
// Returns: Binary .gh file content

// Part 2: Input Parameters (DataTrees)
const inputTrees = [
  new Grasshopper.DataTree("width").append([0], [1000]),
  new Grasshopper.DataTree("height").append([0], [500]),
  new Grasshopper.DataTree("material").append([0], ["steel"])
]

// Part 3: Combined Call
compute.Grasshopper.evaluateDefinition(definitionUrl, inputTrees, false)
```

**Why "Adjacent" Payload?**
- **Definition**: Served from separate URL endpoint
- **Parameters**: Passed as separate DataTree objects
- **Combined**: Rhino Compute receives both simultaneously
- **Processed**: As a single computational unit

---

## 5. Frontend Implementation Requirements

### 5.1 Understanding the Abstraction Layer

**What Frontend Developers Need to Know:**

1. **Definition Discovery**: You don't need to handle file encoding
2. **Parameter Structure**: You only need to provide inputs in correct format
3. **URL Construction**: The backend handles definition URL construction
4. **Response Processing**: Results come back as JSON with `values` array

**Frontend Responsibility:**
```javascript
// Frontend only needs to:
const request = {
  definition: "TopoOpt.gh",        // Definition name (not file)
  inputs: {
    width: [1000],                // Parameters in DataTree format
    height: [500],
    material: ["steel"]
  }
}

// Send via POST
const response = await fetch('/solve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(request)
})

const result = await response.json()
// result.values contains the computed outputs
```

### 5.2 Parameter Format Requirements

**Critical Frontend Rules:**

```javascript
// ✅ CORRECT: All values must be arrays
{
  "inputs": {
    "width": [1000],              // Single value in array
    "heights": [1000, 2000, 3000], // Multiple values in array
    "material": ["steel"],        // Text in array
    "enabled": [true]             // Boolean in array
  }
}

// ❌ WRONG: Values not in arrays
{
  "inputs": {
    "width": 1000,                // Missing array wrapper
    "material": "steel"           // Missing array wrapper
  }
}
```

**Data Type Validation:**
```javascript
// Frontend validation function
function validateParameterFormat(params) {
  for (const [key, value] of Object.entries(params)) {
    if (!Array.isArray(value)) {
      throw new Error(`Parameter ${key} must be an array, got: ${typeof value}`)
    }

    if (value.length === 0) {
      throw new Error(`Parameter ${key} cannot be empty array`)
    }
  }
  return true
}
```

### 5.3 Error Handling for Payload Issues

**Common Payload Errors:**
```javascript
// Error: Definition not found
{
  "message": "Definition not found on server."
}

// Error: Parameter format invalid
{
  "message": "Invalid parameter type for input: width"
}

// Error: Definition file corrupted
{
  "message": "Failed to parse Grasshopper definition"
}
```

**Frontend Error Handling:**
```javascript
async function solveDefinition(definitionName, inputs) {
  try {
    // Validate parameter format
    validateParameterFormat(inputs)

    const response = await fetch('/solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        definition: definitionName,
        inputs: inputs
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    const result = await response.json()
    return result

  } catch (error) {
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Cannot connect to server')
    }

    // Handle validation errors
    if (error.message.includes('must be an array')) {
      throw new Error('Parameter format error: ' + error.message)
    }

    // Re-throw API errors
    throw error
  }
}
```

### 5.4 Caching and Performance

**Definition Caching:**
```javascript
// Definitions are cached by the backend automatically
// Cache key includes: definition name + input parameters + definition hash

// Frontend doesn't need to handle caching, but can implement:
const cache = new Map()

async function cachedSolve(definitionName, inputs) {
  const cacheKey = `${definitionName}:${JSON.stringify(inputs)}`

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)
  }

  const result = await solveDefinition(definitionName, inputs)
  cache.set(cacheKey, result)

  return result
}
```

**Progressive Loading:**
```javascript
// Show results as they become available
async function solveWithProgress(definitionName, inputs) {
  setLoading(true)
  setProgress(0)

  try {
    // Start computation
    const result = await solveDefinition(definitionName, inputs)

    // Update UI with results
    setProgress(100)
    setResults(result.values)

  } catch (error) {
    setError(error.message)
  } finally {
    setLoading(false)
  }
}
```

---

## 6. API Communication Flow

### 6.1 Complete Request/Response Cycle

**Step 1: Frontend Request**
```javascript
// User clicks "Compute" button
const inputs = {
  width: [1000],
  height: [500],
  material: ["steel"]
}

const response = await fetch('/solve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    definition: "TopoOpt.gh",
    inputs: inputs
  })
})
```

**Step 2: Backend Processing**
```javascript
// 1. Parse request
const { definition: definitionName, inputs } = req.body

// 2. Find definition
const definition = req.app.get('definitions').find(o => o.name === definitionName)

// 3. Build definition URL
const definitionUrl = `${req.protocol}://${req.get('host')}/definition/${definition.id}`

// 4. Convert inputs to DataTrees
const trees = []
for (const [key, value] of Object.entries(inputs)) {
  const param = new compute.Grasshopper.DataTree(key)
  param.append([0], value)  // value is already an array
  trees.push(param)
}

// 5. Send to Rhino Compute
const result = await compute.Grasshopper.evaluateDefinition(definitionUrl, trees, false)
```

**Step 3: Rhino Compute Processing**
```javascript
// Rhino Compute:
// 1. Fetches definition from definitionUrl
// 2. Loads the .gh file (base64 decoded)
// 3. Opens Grasshopper definition
// 4. Sets input parameters from DataTrees
// 5. Runs the definition
// 6. Collects output parameters
// 7. Returns results as JSON
```

**Step 4: Response to Frontend**
```javascript
// Backend receives result and processes it
const result = await response.text()
const parsed = JSON.parse(result)
delete parsed.pointer  // Remove internal Rhino Compute pointer

// Send clean result to frontend
res.json({
  values: parsed.values  // Array of output values
})
```

### 6.2 Real-time Updates Implementation

**Debounced Parameter Updates:**
```javascript
class RealTimeConfigurator {
  constructor(definitionName) {
    this.definitionName = definitionName
    this.updateTimeout = null
    this.currentInputs = {}
    this.isComputing = false
  }

  // Called when any parameter changes
  onParameterChange(paramName, value) {
    // Update current inputs
    this.currentInputs[paramName] = [value]

    // Debounce the computation
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout)
    }

    this.updateTimeout = setTimeout(() => {
      this.compute()
    }, 500) // 500ms debounce
  }

  async compute() {
    if (this.isComputing) return

    this.isComputing = true
    this.showLoading()

    try {
      const result = await this.solveDefinition(this.currentInputs)
      this.updateResults(result.values)
      this.hideLoading()

    } catch (error) {
      this.showError(error.message)
    } finally {
      this.isComputing = false
    }
  }

  async solveDefinition(inputs) {
    const response = await fetch('/solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        definition: this.definitionName,
        inputs: inputs
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message)
    }

    return await response.json()
  }
}
```

### 6.3 Batch Processing

**Multiple Variations:**
```javascript
async function computeBatch(variations) {
  const promises = variations.map(variation => {
    return fetch('/solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        definition: "TopoOpt.gh",
        inputs: variation
      })
    }).then(response => response.json())
  })

  const results = await Promise.all(promises)
  return results.map(result => result.values)
}

// Usage
const variations = [
  { width: [1000], height: [500], material: ["steel"] },
  { width: [1200], height: [600], material: ["titanium"] },
  { width: [800], height: [400], material: ["aluminum"] }
]

const batchResults = await computeBatch(variations)
```

---

## 7. Payload Structure Details

### 7.1 Complete Payload Anatomy

**Request Payload Structure:**
```javascript
{
  "definition": "TopoOpt.gh",        // String: Definition filename
  "inputs": {                        // Object: Input parameters
    "width": [1000],                // Array: Single value
    "heights": [1000, 2000, 3000],  // Array: Multiple values
    "material": ["steel"],          // Array: Text value
    "enabled": [true],              // Array: Boolean value
    "point": [[0, 0, 0]],           // Array: Point3d (x,y,z)
    "vectors": [[1,0,0], [0,1,0]]   // Array: Multiple vectors
  },
  "values": [                        // Optional: Direct DataTree values
    [1000, 2000, 3000],            // Branch 0
    [500, 1500]                    // Branch 1
  ]
}
```

**Response Payload Structure:**
```javascript
{
  "values": [                        // Array of output values
    ["geometry_data"],              // Output 1: Geometry
    [0.85],                        // Output 2: Efficiency ratio
    [2450.5],                      // Output 3: Weight
    ["analysis_complete"]          // Output 4: Status message
  ]
}
```

### 7.2 DataTree Branching

**Understanding Branches:**
```javascript
// Frontend sends:
{
  "inputs": {
    "loads": [1000, 2000, 3000]  // Single branch with 3 values
  }
}

// Grasshopper receives:
// DataTree "loads":
// {0;0} → 1000
// {0;1} → 2000
// {0;2} → 3000

// Frontend sends:
{
  "inputs": {
    "loads": [[1000, 2000], [500]]  // Two branches
  }
}

// Grasshopper receives:
// DataTree "loads":
// {0;0} → 1000, {0;1} → 2000
// {1;0} → 500
```

**Complex Branching:**
```javascript
// Multiple parameters with different branching
{
  "inputs": {
    "widths": [1000, 1200, 800],        // 3 values, 1 branch
    "heights": [[500, 600], [400]],     // 2 branches, different sizes
    "materials": ["steel"],             // 1 value, 1 branch
    "factors": [[1.0, 1.2, 1.5], [0.8]] // 2 branches, 3+1 values
  }
}
```

### 7.3 Parameter Type Validation

**Frontend Type Checking:**
```javascript
function validateParameterTypes(inputs) {
  const typeValidators = {
    'Number': (value) => typeof value === 'number' && !isNaN(value),
    'Text': (value) => typeof value === 'string',
    'Boolean': (value) => typeof value === 'boolean',
    'Point3d': (value) => Array.isArray(value) && value.length === 3,
    'Vector3d': (value) => Array.isArray(value) && value.length === 3
  }

  for (const [paramName, values] of Object.entries(inputs)) {
    // Assume parameter type is known from definition discovery
    const expectedType = getParameterType(paramName)

    for (const value of values) {
      if (!typeValidators[expectedType](value)) {
        throw new Error(`Parameter ${paramName}: expected ${expectedType}, got ${typeof value}`)
      }
    }
  }

  return true
}
```

---

## 8. Error Handling for Payloads

### 8.1 Payload Construction Errors

**Common Issues:**
```javascript
// Issue 1: Missing array wrappers
{
  "inputs": {
    "width": 1000,        // ❌ Should be [1000]
    "material": "steel"   // ❌ Should be ["steel"]
  }
}

// Issue 2: Empty arrays
{
  "inputs": {
    "width": [],          // ❌ Empty array
    "material": ["steel"] // ✅ Valid
  }
}

// Issue 3: Type mismatches
{
  "inputs": {
    "width": ["1000"],    // ❌ String instead of number
    "enabled": ["yes"]    // ❌ String instead of boolean
  }
}
```

**Validation Function:**
```javascript
function validatePayload(payload) {
  // Check definition exists
  if (!payload.definition || typeof payload.definition !== 'string') {
    throw new Error('Definition name is required and must be a string')
  }

  // Check inputs object exists
  if (!payload.inputs || typeof payload.inputs !== 'object') {
    throw new Error('Inputs must be an object')
  }

  // Validate each parameter
  for (const [paramName, values] of Object.entries(payload.inputs)) {
    if (!Array.isArray(values)) {
      throw new Error(`Parameter ${paramName} must be an array`)
    }

    if (values.length === 0) {
      throw new Error(`Parameter ${paramName} cannot be empty`)
    }

    // Type validation would go here
    validateParameterValues(paramName, values)
  }

  return true
}
```

### 8.2 Network Error Handling

**Connection Issues:**
```javascript
async function solveWithRetry(definitionName, inputs, maxRetries = 3) {
  let lastError

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          definition: definitionName,
          inputs: inputs
        }),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || `HTTP ${response.status}`)
      }

      return await response.json()

    } catch (error) {
      lastError = error

      if (attempt === maxRetries) {
        throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`)
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
}
```

### 8.3 Definition-Specific Errors

**Handling Definition Errors:**
```javascript
// Different definitions may have different error patterns
const errorHandlers = {
  'TopoOpt.gh': (error) => {
    if (error.message.includes('convergence')) {
      return 'Optimization did not converge. Try adjusting parameters.'
    }
    if (error.message.includes('material')) {
      return 'Invalid material properties. Check material selection.'
    }
    return error.message
  },

  'BeamAnalysis.gh': (error) => {
    if (error.message.includes('stress')) {
      return 'Stress analysis failed. Check load conditions.'
    }
    if (error.message.includes('geometry')) {
      return 'Invalid beam geometry. Check dimensions.'
    }
    return error.message
  }
}

function handleDefinitionError(definitionName, error) {
  const handler = errorHandlers[definitionName]
  if (handler) {
    return handler(error)
  }
  return error.message
}
```

---

## 9. Performance Optimization

### 9.1 Payload Size Optimization

**Reducing Payload Size:**
```javascript
// Use efficient data types
{
  "inputs": {
    "count": [10],              // Integer instead of [10.0]
    "enabled": [true],          // Boolean instead of ["true"]
    "point": [[0, 0, 0]]        // Direct array instead of nested
  }
}

// Compress large data
function compressPayload(payload) {
  // Remove unnecessary whitespace
  return JSON.stringify(payload, null, 0)
}

// Use binary formats for large geometry (if supported)
function encodeGeometryAsBinary(geometryData) {
  // Convert geometry to efficient binary format
  const buffer = new ArrayBuffer(geometryData.length * 8)
  const view = new Float64Array(buffer)
  geometryData.forEach((point, index) => {
    view[index * 3] = point.x
    view[index * 3 + 1] = point.y
    view[index * 3 + 2] = point.z
  })
  return buffer
}
```

### 9.2 Caching Strategies

**Client-Side Caching:**
```javascript
class PayloadCache {
  constructor(maxSize = 100) {
    this.cache = new Map()
    this.maxSize = maxSize
  }

  generateKey(definitionName, inputs) {
    return `${definitionName}:${JSON.stringify(inputs)}`
  }

  get(definitionName, inputs) {
    const key = this.generateKey(definitionName, inputs)
    return this.cache.get(key)
  }

  set(definitionName, inputs, result) {
    const key = this.generateKey(definitionName, inputs)

    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now()
    })
  }

  clear() {
    this.cache.clear()
  }
}

// Usage
const cache = new PayloadCache()

async function cachedSolve(definitionName, inputs) {
  let result = cache.get(definitionName, inputs)

  if (!result) {
    result = await solveDefinition(definitionName, inputs)
    cache.set(definitionName, inputs, result)
  }

  return result
}
```

### 9.3 Progressive Loading

**Streaming Results:**
```javascript
// For long-running computations, show partial results
function handleProgressiveResults(definitionName, inputs) {
  return new Promise((resolve, reject) => {
    const eventSource = new EventSource(`/solve/stream/${definitionName}`)

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'progress') {
        updateProgress(data.progress, data.message)
      } else if (data.type === 'partial') {
        updatePartialResults(data.results)
      } else if (data.type === 'complete') {
        updateFinalResults(data.results)
        eventSource.close()
        resolve(data.results)
      }
    }

    eventSource.onerror = (error) => {
      eventSource.close()
      reject(error)
    }

    // Start the computation
    fetch('/solve/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        definition: definitionName,
        inputs: inputs
      })
    })
  })
}
```

---

## 10. Examples and Code Templates

### 10.1 Complete React Configurator

**TopoOptConfigurator.jsx:**
```jsx
import React, { useState, useEffect, useCallback } from 'react'
import ParameterSlider from './ParameterSlider'
import GeometryViewer from './GeometryViewer'
import MetricsDisplay from './MetricsDisplay'

function TopoOptConfigurator() {
  const [parameters, setParameters] = useState([])
  const [currentValues, setCurrentValues] = useState({})
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load definition parameters
  useEffect(() => {
    loadParameters()
  }, [])

  const loadParameters = async () => {
    try {
      const response = await fetch('/TopoOpt.gh')
      const data = await response.json()

      setParameters(data.inputs || [])
      setCurrentValues(
        Object.fromEntries(
          (data.inputs || []).map(param => [
            param.name,
            param.default || ['']
          ])
        )
      )
    } catch (err) {
      setError(err.message)
    }
  }

  // Debounced solve function
  const solveDebounced = useCallback(
    _.debounce(async (inputs) => {
      if (loading) return

      setLoading(true)
      setError(null)

      try {
        // Validate payload format
        validatePayloadFormat(inputs)

        const response = await fetch('/solve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            definition: 'TopoOpt.gh',
            inputs: inputs
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || `HTTP ${response.status}`)
        }

        const result = await response.json()
        setResults(result.values)

      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }, 500),
    [loading]
  )

  const handleParameterChange = (paramName, value) => {
    const newValues = {
      ...currentValues,
      [paramName]: [value]
    }
    setCurrentValues(newValues)
    solveDebounced(newValues)
  }

  return (
    <div className="topoopt-configurator">
      <div className="configurator-header">
        <h1>Topology Optimization Configurator</h1>
        <p>Design optimized structures using advanced computational methods</p>
      </div>

      <div className="configurator-layout">
        <div className="parameters-panel">
          <h2>Parameters</h2>
          {parameters.map(param => (
            <ParameterSlider
              key={param.name}
              parameter={param}
              value={currentValues[param.name]?.[0]}
              onChange={(value) => handleParameterChange(param.name, value)}
            />
          ))}
        </div>

        <div className="results-panel">
          <div className="viewer-section">
            <h2>3D Preview</h2>
            <GeometryViewer
              geometry={results?.[0]}
              loading={loading}
            />
          </div>

          <div className="metrics-section">
            <h2>Performance Metrics</h2>
            <MetricsDisplay
              results={results}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
    </div>
  )
}

export default TopoOptConfigurator
```

### 10.2 Payload Validation Utility

**validation.js:**
```javascript
// Parameter format validation
export function validatePayloadFormat(inputs) {
  for (const [key, value] of Object.entries(inputs)) {
    if (!Array.isArray(value)) {
      throw new Error(`Parameter ${key} must be an array, got: ${typeof value}`)
    }

    if (value.length === 0) {
      throw new Error(`Parameter ${key} cannot be empty array`)
    }

    // Type validation
    validateParameterTypes(key, value)
  }
  return true
}

function validateParameterTypes(paramName, values) {
  // This would be definition-specific
  const paramTypes = {
    width: 'Number',
    height: 'Number',
    material: 'Text',
    enabled: 'Boolean',
    load: 'Number'
  }

  const expectedType = paramTypes[paramName]
  if (!expectedType) return true // Unknown parameter, skip validation

  const typeValidators = {
    'Number': (v) => typeof v === 'number' && !isNaN(v),
    'Text': (v) => typeof v === 'string',
    'Boolean': (v) => typeof v === 'boolean'
  }

  const validator = typeValidators[expectedType]
  if (!validator) return true

  for (const value of values) {
    if (!validator(value)) {
      throw new Error(`Parameter ${paramName}: expected ${expectedType}, got ${typeof value}`)
    }
  }
}

// Definition-specific payload construction
export function buildPayload(definitionName, inputs) {
  // Validate format
  validatePayloadFormat(inputs)

  // Ensure all values are in arrays (DataTree format)
  const formattedInputs = {}
  for (const [key, value] of Object.entries(inputs)) {
    formattedInputs[key] = Array.isArray(value) ? value : [value]
  }

  return {
    definition: definitionName,
    inputs: formattedInputs
  }
}
```

### 10.3 API Service with Payload Handling

**api.js:**
```javascript
class APIService {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL
    this.cache = new Map()
  }

  async solve(definitionName, inputs) {
    // Build and validate payload
    const payload = buildPayload(definitionName, inputs)

    // Check cache first
    const cacheKey = `${definitionName}:${JSON.stringify(payload.inputs)}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      const response = await fetch(`${this.baseURL}/solve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || `HTTP ${response.status}`)
      }

      const result = await response.json()

      // Cache the result
      this.cache.set(cacheKey, result)

      return result

    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  }

  async getDefinitionInfo(definitionName) {
    try {
      const response = await fetch(`${this.baseURL}/${definitionName}`)
      return await response.json()
    } catch (error) {
      console.error('Failed to get definition info:', error)
      throw error
    }
  }

  clearCache() {
    this.cache.clear()
  }
}

export default new APIService()
```

### 10.4 Advanced Error Handling

**ErrorBoundary.jsx:**
```jsx
import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log error to external service
    console.error('Configurator Error:', error, errorInfo)

    // Could send to error tracking service
    // logError(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
```

### 10.5 Performance Monitoring

**PerformanceTracker.js:**
```javascript
class PerformanceTracker {
  constructor() {
    this.metrics = []
  }

  startTimer(label) {
    this.metrics.push({
      label,
      start: performance.now()
    })
  }

  endTimer(label) {
    const metric = this.metrics.find(m => m.label === label)
    if (metric) {
      metric.end = performance.now()
      metric.duration = metric.end - metric.start
      console.log(`${label}: ${metric.duration.toFixed(2)}ms`)
    }
  }

  getMetrics() {
    return this.metrics.filter(m => m.duration)
  }

  clear() {
    this.metrics = []
  }
}

// Usage in configurator
const tracker = new PerformanceTracker()

async function solveWithTracking(definitionName, inputs) {
  tracker.startTimer('payload-validation')
  validatePayloadFormat(inputs)
  tracker.endTimer('payload-validation')

  tracker.startTimer('api-call')
  const result = await solveDefinition(definitionName, inputs)
  tracker.endTimer('api-call')

  tracker.startTimer('result-processing')
  processResults(result.values)
  tracker.endTimer('result-processing')

  console.table(tracker.getMetrics())
  tracker.clear()

  return result
}
```

---

This comprehensive guide explains the critical **Adjacent Payload System** that powers the SoftlyPlease Compute API. Frontend developers must understand that:

1. **Grasshopper definitions are sent as base64-encoded binary files**
2. **Input parameters are encapsulated within DataTree structures**
3. **The payload consists of both definition and parameters**
4. **All values must be wrapped in arrays for proper DataTree construction**
5. **Error handling is crucial for payload validation**

The guide provides complete examples of how to construct payloads, handle errors, implement caching, and create responsive configurator interfaces. This is the foundation that enables the real-time topology optimization interface for softlyplease.com.
