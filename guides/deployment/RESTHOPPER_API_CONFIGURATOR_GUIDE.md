# Complete Resthopper/REST API/AppServer Configurator Guide

This comprehensive guide explains how to configure and integrate new Grasshopper definitions into the SoftlyPlease Compute system. It covers the complete workflow from definition creation to production deployment, including API configuration, testing, and best practices.

## Table of Contents

1. [System Overview](#system-overview)
2. [How the Current System Works](#how-the-current-system-works)
3. [Adding New Grasshopper Definitions](#adding-new-grasshopper-definitions)
4. [API Endpoint Configuration](#api-endpoint-configuration)
5. [Definition Registration and Discovery](#definition-registration-and-discovery)
6. [Parameter Configuration](#parameter-configuration)
7. [Testing New Definitions](#testing-new-definitions)
8. [Caching and Performance](#caching-and-performance)
9. [Error Handling](#error-handling)
10. [Security Considerations](#security-considerations)
11. [Advanced Configuration](#advanced-configuration)
12. [Deployment and Maintenance](#deployment-and-maintenance)
13. [Troubleshooting](#troubleshooting)
14. [Best Practices](#best-practices)
15. [Examples and Templates](#examples-and-templates)

## System Overview

The SoftlyPlease Compute system consists of:

### Architecture Components
- **Grasshopper Definitions**: `.gh` files containing parametric models
- **Node.js App Server**: Express.js REST API server
- **Rhino Compute**: Backend geometry computation engine
- **Resthopper**: REST API interface for Grasshopper definitions
- **File System**: Local storage for definition files

### Current API Endpoints
- `GET /` - Home page and definition list
- `GET /version` - System and Rhino Compute version info
- `GET /definition` - List all available definitions
- `GET /definition/:id` - Get specific definition file (by hash)
- `GET /solve/:definition` - Solve definition via GET request
- `POST /solve` - Solve definition via POST request
- `GET /view` - Interactive definition viewer

## How the Current System Works

### 1. Definition Registration (`src/definitions.js`)
```javascript
// Automatically discovers .gh files in assets/gh-definitions/
function registerDefinitions() {
  let files = getFilesSync(path.join(__dirname, 'files/'))
  let definitions = []
  files.forEach( file => {
    if(file.includes('.gh') || file.includes('.ghx')) {
      const fullPath = path.join(__dirname, 'files/' + file)
      const hash = md5File.sync(fullPath) // Creates unique ID

      definitions.push({
        name: file,
        id: hash,        // MD5 hash for URL
        path: fullPath   // Absolute file path
      })
    }
  })
  return definitions
}
```

### 2. Definition Serving (`src/routes/definition.js`)
```javascript
// Serves definition files by hash ID
router.get('/:id', function(req, res, next) {
  let definition = req.app.get('definitions').find(o => o.id === req.params.id)
  res.sendFile(definition.path, options)
})
```

### 3. Solving Definitions (`src/routes/solve.js`)
```javascript
// Core solving logic with caching
router.get('/:definition', pipeline)
router.post('/', pipeline)
```

### 4. Parameter Discovery (`src/definitions.js`)
```javascript
// Extracts input/output parameters from definition
async function getParams(definitionUrl) {
  const response = await compute.computeFetch('io', { 'pointer': definitionUrl })
  // Returns: { inputs, outputs, description, view }
}
```

## Adding New Grasshopper Definitions

### Step 1: Create Grasshopper Definition

#### Requirements for New Definitions
- **File Format**: `.gh` (Grasshopper 3D) or `.ghx` (legacy)
- **Location**: Must be placed in `assets/gh-definitions/` directory
- **Naming**: Use descriptive, URL-friendly names (e.g., `beam_generator.gh`)
- **Inputs/Outputs**: Clearly defined parameters for API access

#### Best Practices for Definition Creation
1. **Input Parameters**: Use simple data types (Number, Text, Boolean, Integer)
2. **Output Parameters**: Include clear naming and organization
3. **Documentation**: Add description components in Grasshopper
4. **Error Handling**: Include validation and error checking
5. **Performance**: Optimize for computation speed
6. **Units**: Specify units clearly in parameter names

#### Example Definition Structure
```
Input Parameters:
├── length (Number) - Beam length in meters
├── width (Number) - Beam width in mm
├── height (Number) - Beam height in mm
├── material (Text) - Material type
└── load (Number) - Applied load in kN

Output Parameters:
├── geometry (Geometry) - 3D beam geometry
├── volume (Number) - Calculated volume
├── weight (Number) - Calculated weight
└── stress (Number) - Maximum stress
```

### Step 2: Add Definition File

```bash
# Copy your .gh file to the definitions directory
cp my_new_definition.gh assets/gh-definitions/

# Verify file is in place
ls -la assets/gh-definitions/my_new_definition.gh
```

### Step 3: Automatic Registration

The system automatically detects new `.gh` files on server restart:

```bash
# Restart the Node.js server to register new definitions
npm restart

# Or if running locally:
# npm run start-rhino  # Start Rhino Compute first
# npm start           # Start Node.js app
```

### Step 4: Verify Registration

```bash
# Check if definition appears in the list
curl http://localhost:3000/

# Should include your new definition in the JSON response
# [{"name":"my_new_definition.gh"},...]
```

## API Endpoint Configuration

### Automatic Endpoints

Once added, your definition automatically gets these endpoints:

#### GET Request Format
```
GET /solve/my_new_definition.gh?length=5000&width=200&height=300&material=steel&load=10000
```

#### POST Request Format
```
POST /solve
Content-Type: application/json

{
  "definition": "my_new_definition.gh",
  "inputs": {
    "length": [5000],
    "width": [200],
    "height": [300],
    "material": ["steel"],
    "load": [10000]
  }
}
```

#### Definition File Access
```
GET /definition/{md5_hash}
```

### Parameter Types Supported

| Grasshopper Type | API Type | Example |
|-----------------|----------|---------|
| Number | number | `{"length": [5000]}` |
| Integer | integer | `{"count": [10]}` |
| Text | string | `{"material": ["steel"]}` |
| Boolean | boolean | `{"enabled": [true]}` |
| Point3d | array | `{"point": [[0,0,0]]}` |
| Vector3d | array | `{"vector": [[1,0,0]]}` |
| Geometry | geometry | Binary geometry data |

## Definition Registration and Discovery

### How Definitions Are Discovered

1. **File System Scan**: `src/definitions.js` scans `assets/gh-definitions/` directory
2. **Extension Filter**: Only `.gh` and `.ghx` files are processed
3. **Hash Generation**: MD5 hash created for unique identification
4. **Registration**: Definition objects stored in memory

### Definition Object Structure
```javascript
{
  name: "my_definition.gh",        // Original filename
  id: "a1b2c3d4e5f6...",          // MD5 hash for URL
  path: "/full/path/to/file.gh"    // Absolute file path
}
```

### Manual Definition Registration (Advanced)

If you need custom registration logic:

```javascript
// In src/definitions.js
function registerDefinitions() {
  let definitions = []

  // Custom definition
  definitions.push({
    name: "custom_definition.gh",
    id: "custom_id_123",
    path: "/custom/path/to/definition.gh",
    description: "Custom definition with special handling",
    category: "special"
  })

  // Add automatic definitions
  let autoDefinitions = registerAutomaticDefinitions()
  return [...definitions, ...autoDefinitions]
}
```

## Parameter Configuration

### Understanding Parameter Structure

When you call the `/io` endpoint, Resthopper returns:

```json
{
  "description": "Beam generator definition",
  "inputs": [
    {
      "name": "Length",
      "paramType": "Number",
      "default": [5000],
      "minimum": [1000],
      "maximum": [10000]
    },
    {
      "name": "Material",
      "paramType": "Text",
      "default": ["steel"],
      "options": ["steel", "wood", "concrete"]
    }
  ],
  "outputs": [
    {
      "name": "Geometry",
      "paramType": "Geometry"
    },
    {
      "name": "Volume",
      "paramType": "Number"
    }
  ],
  "view": false
}
```

### Parameter Validation

The system automatically validates parameters based on:
- **Type**: Must match expected Grasshopper type
- **Structure**: Must be arrays (Grasshopper DataTree format)
- **Required**: All inputs without defaults are required

### Custom Parameter Processing

If you need custom parameter processing:

```javascript
// In your solve route or middleware
function processCustomParameters(req, res, next) {
  const params = res.locals.params.inputs

  // Custom validation for specific definition
  if (definition.name === 'special_definition.gh') {
    // Add custom logic here
    if (params.length && params.length[0] < 1000) {
      return next(new Error('Length must be at least 1000mm'))
    }
  }

  next()
}
```

## Testing New Definitions

### 1. Basic Availability Test

```bash
# Test if definition is registered
curl http://localhost:3000/

# Should include your definition:
# [{"name":"my_new_definition.gh"},{"name":"existing.gh"},...]
```

### 2. Parameter Discovery Test

```bash
# Get definition parameters
curl "http://localhost:3000/solve/my_new_definition.gh"

# Returns parameter structure (no solving)
```

### 3. Simple Solve Test

```bash
# Test with GET request
curl "http://localhost:3000/solve/my_new_definition.gh?length=5000&width=200"

# Test with POST request
curl -X POST http://localhost:3000/solve \
  -H "Content-Type: application/json" \
  -d '{
    "definition": "my_new_definition.gh",
    "inputs": {
      "length": [5000],
      "width": [200],
      "height": [300]
    }
  }'
```

### 4. Interactive Testing

```bash
# Open interactive viewer
open http://localhost:3000/view

# Or test specific definition
open http://localhost:3000/view?definition=my_new_definition.gh
```

### 5. Performance Testing

```bash
# Test response time
time curl "http://localhost:3000/solve/my_new_definition.gh?param=value"

# Test with different parameter combinations
curl "http://localhost:3000/solve/my_new_definition.gh?param1=value1&param2=value2"
```

## Caching and Performance

### Built-in Caching System

The system includes multiple caching layers:

#### 1. Node Cache (Local)
```javascript
// In src/routes/solve.js
const cache = new NodeCache()

// Automatic caching of solve results
const key = JSON.stringify({
  definition: { name, id },
  inputs: params
})
const cached = cache.get(key)
```

#### 2. Memcached (Production)
```javascript
// Configure via environment variables
MEMCACHIER_SERVERS=your-memcached-server:11211

// Automatic failover and clustering support
```

### Cache Configuration

```javascript
// Default cache settings
const cache = new NodeCache({
  stdTTL: 3600,        // 1 hour default TTL
  checkperiod: 600,    // Check for expired keys every 10 minutes
  useClones: false     // Performance optimization
})
```

### Custom Caching Strategy

```javascript
// For definitions that need special caching
function getCacheKey(definition, params) {
  // Custom key generation logic
  if (definition.name === 'real_time_data.gh') {
    return null // Disable caching for real-time data
  }

  if (definition.name === 'heavy_computation.gh') {
    return `heavy_${JSON.stringify(params)}` // Custom key
  }

  return JSON.stringify({ definition, params }) // Default
}
```

## Error Handling

### Common Error Types

#### 1. Definition Not Found
```json
{
  "message": "Definition not found on server."
}
```

#### 2. Parameter Errors
```json
{
  "message": "Invalid parameter type for input: length"
}
```

#### 3. Compute Server Errors
```json
{
  "message": "Internal Server Error"
}
```

### Custom Error Handling

```javascript
// In src/routes/solve.js
function handleErrors(err, req, res, next) {
  console.error('Error solving definition:', err)

  // Custom error responses based on error type
  if (err.message.includes('Definition not found')) {
    return res.status(404).json({
      error: 'Definition not found',
      available_definitions: req.app.get('definitions').map(d => d.name)
    })
  }

  if (err.message.includes('parameter')) {
    return res.status(400).json({
      error: 'Parameter error',
      message: err.message
    })
  }

  // Default error
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Please try again later'
  })
}
```

### Error Monitoring

```javascript
// Add error tracking
app.use(function(err, req, res, next) {
  // Log to external service
  if (process.env.ERROR_TRACKING_URL) {
    fetch(process.env.ERROR_TRACKING_URL, {
      method: 'POST',
      body: JSON.stringify({
        error: err.message,
        stack: err.stack,
        definition: req.params.definition,
        timestamp: new Date()
      })
    })
  }

  next(err)
})
```

## Security Considerations

### API Security

#### 1. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit')

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
})

app.use('/solve/', limiter)
```

#### 2. Input Validation
```javascript
const validator = require('validator')

function validateInputs(req, res, next) {
  const inputs = res.locals.params.inputs

  for (const [key, value] of Object.entries(inputs)) {
    // Validate parameter names
    if (!validator.isAlphanumeric(key.replace('_', ''))) {
      return next(new Error(`Invalid parameter name: ${key}`))
    }

    // Validate parameter values based on type
    if (typeof value[0] === 'string' && value[0].length > 1000) {
      return next(new Error(`Parameter ${key} too long`))
    }
  }

  next()
}
```

#### 3. CORS Configuration
```javascript
// In src/app.js
app.use(cors({
  origin: [
    'https://your-domain.com',
    'https://www.your-domain.com',
    process.env.CORS_ORIGIN
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
```

### File Security

#### 1. Definition Access Control
```javascript
// Only allow access to registered definitions
router.get('/definition/:id', function(req, res, next) {
  const definition = req.app.get('definitions').find(o => o.id === req.params.id)

  if (!definition) {
    return res.status(404).json({ error: 'Definition not found' })
  }

  // Check if definition is public
  if (definition.private && !req.user) {
    return res.status(403).json({ error: 'Access denied' })
  }

  res.sendFile(definition.path, options)
})
```

#### 2. Upload Security (if adding file upload)
```javascript
const multer = require('multer')
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (!file.originalname.endsWith('.gh')) {
      return cb(new Error('Only .gh files allowed'))
    }
    cb(null, true)
  }
})
```

## Advanced Configuration

### Custom Solve Middleware

```javascript
// Create custom middleware for specific definitions
function customSolveMiddleware(req, res, next) {
  const definition = res.locals.params.definition

  if (definition.name === 'special_solver.gh') {
    // Custom preprocessing
    const inputs = res.locals.params.inputs

    // Modify inputs before solving
    inputs.custom_param = [calculateCustomValue(inputs)]

    // Set custom headers
    res.setHeader('X-Custom-Processing', 'true')
  }

  next()
}

// Add to solve pipeline
const pipeline = [computeParams, collectParams, checkCache, customSolveMiddleware, commonSolve]
```

### Definition Categories and Tags

```javascript
// Enhanced definition structure
function registerDefinitions() {
  return [
    {
      name: "beam_generator.gh",
      id: hash,
      path: fullPath,
      category: "structural",
      tags: ["beam", "steel", "analysis"],
      description: "Generates structural beam geometry",
      author: "SoftlyPlease Team",
      version: "1.0.0",
      inputs: ["length", "width", "height", "material"],
      outputs: ["geometry", "volume", "weight"]
    }
  ]
}
```

### Custom Response Formatting

```javascript
// Custom response formatter
function formatResponse(req, res, next) {
  const originalSend = res.send
  res.send = function(data) {
    const definition = req.params.definition || req.body.definition

    // Custom formatting for specific definitions
    if (definition === 'data_export.gh') {
      const parsed = JSON.parse(data)
      // Add metadata
      parsed.metadata = {
        generated: new Date(),
        definition: definition,
        server: req.headers.host
      }
      return originalSend.call(this, JSON.stringify(parsed))
    }

    originalSend.call(this, data)
  }
  next()
}
```

### Webhook Integration

```javascript
// Post-solve webhooks
function triggerWebhook(definition, result, inputs) {
  if (definition.webhook_url) {
    fetch(definition.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        definition: definition.name,
        result: result,
        inputs: inputs,
        timestamp: new Date()
      })
    })
  }
}
```

## Deployment and Maintenance

### Adding Definitions to Production

```bash
# 1. Add new definition file
cp new_definition.gh assets/gh-definitions/

# 2. Commit changes
git add assets/gh-definitions/new_definition.gh
git commit -m "Add new_definition.gh"

# 3. Deploy to production
git push heroku main

# 4. Verify on production
curl https://your-app.herokuapp.com/
```

### Definition Updates

```bash
# Update existing definition
cp updated_definition.gh assets/gh-definitions/existing_definition.gh

# The hash will change automatically, invalidating cache
git add assets/gh-definitions/existing_definition.gh
git commit -m "Update existing_definition.gh"
git push heroku main
```

### Definition Removal

```bash
# Remove definition file
rm assets/gh-definitions/old_definition.gh

# Update code if needed
git add -A
git commit -m "Remove old_definition.gh"
git push heroku main
```

### Monitoring Definition Usage

```javascript
// Add usage tracking
function trackUsage(req, res, next) {
  const definition = req.params.definition || req.body.definition

  // Log usage (could be to database, file, or external service)
  console.log(`Definition ${definition} used at ${new Date()}`)

  // Could increment usage counter
  if (global.usageStats) {
    global.usageStats[definition] = (global.usageStats[definition] || 0) + 1
  }

  next()
}
```

## Troubleshooting

### Definition Not Appearing

**Problem**: New definition doesn't show in the list
```bash
# Check if file exists
ls -la assets/gh-definitions/my_definition.gh

# Check file extension
file assets/gh-definitions/my_definition.gh

# Restart server
npm restart

# Check logs for errors
heroku logs --tail
```

### Parameter Errors

**Problem**: "Invalid parameter" errors
```bash
# Get parameter structure
curl "http://localhost:3000/solve/my_definition.gh"

# Check parameter names match exactly
# Check parameter types are correct
# Verify array format: {"param": [value]}
```

### Solving Errors

**Problem**: Definition fails to solve
```bash
# Check Rhino Compute is running
curl http://localhost:6500/version

# Check definition file is valid
# Test in Grasshopper directly
# Check for missing components
```

### Performance Issues

**Problem**: Slow response times
```bash
# Check cache is working
curl -H "Server-Timing: *" "http://localhost:3000/solve/..."

# Monitor memory usage
heroku ps:info web.1

# Check for memory leaks
```

### Connection Issues

**Problem**: Can't connect to Rhino Compute
```bash
# Check environment variables
heroku config

# Test connection
curl http://localhost:6500/version

# Check firewall settings
# Verify port accessibility
```

## Best Practices

### Definition Creation

#### 1. Naming Conventions
- Use lowercase with underscores: `beam_generator.gh`
- Be descriptive but concise
- Include version if needed: `beam_generator_v2.gh`

#### 2. Parameter Design
- Use clear, descriptive names
- Include units in parameter names: `length_mm`, `force_kn`
- Provide reasonable defaults
- Add minimum/maximum values where appropriate

#### 3. Documentation
- Add description components in Grasshopper
- Document all inputs and outputs
- Include usage examples
- Note any limitations or requirements

#### 4. Error Handling
- Add validation components in Grasshopper
- Handle edge cases gracefully
- Provide meaningful error messages

### API Usage

#### 1. Request Optimization
- Use POST for complex parameter sets
- Batch similar requests when possible
- Implement client-side caching
- Use compression for large payloads

#### 2. Error Handling
- Always check response status
- Handle network errors gracefully
- Implement retry logic for transient errors
- Log errors for debugging

#### 3. Security
- Validate all input parameters
- Use HTTPS in production
- Implement rate limiting
- Monitor for abuse

### System Administration

#### 1. Regular Maintenance
- Update dependencies regularly
- Monitor performance metrics
- Review error logs
- Test backup procedures

#### 2. Scaling
- Monitor usage patterns
- Scale dynos as needed
- Consider caching strategies
- Optimize database queries (if used)

## Examples and Templates

### Basic Definition Template

```javascript
// Example: Simple geometry generator
// Definition: geometry_generator.gh
// Inputs: size, type, count
// Outputs: geometry, area, volume

// API Usage:
GET /solve/geometry_generator.gh?size=1000&type=box&count=5
POST /solve {"definition": "geometry_generator.gh", "inputs": {"size": [1000], "type": ["box"], "count": [5]}}
```

### Advanced Definition with Validation

```javascript
// Definition: structural_analysis.gh
// Features: Input validation, multiple outputs, metadata

// API Usage:
POST /solve {
  "definition": "structural_analysis.gh",
  "inputs": {
    "material": ["steel"],
    "load_kn": [100],
    "span_m": [5.0],
    "section_type": ["i_beam"],
    "safety_factor": [1.5]
  }
}
```

### Real-time Data Integration

```javascript
// Definition: weather_responsive.gh
// Features: External data integration, time-based parameters

// API Usage:
POST /solve {
  "definition": "weather_responsive.gh",
  "inputs": {
    "location": ["New York"],
    "date": ["2024-01-15"],
    "temperature_c": [22.5],
    "humidity_percent": [65]
  }
}
```

### Batch Processing

```javascript
// Process multiple variations
const variations = [
  { length: 3000, width: 200 },
  { length: 4000, width: 250 },
  { length: 5000, width: 300 }
]

for (const params of variations) {
  const response = await fetch('/solve/my_definition.gh?' + new URLSearchParams(params))
  const result = await response.json()
  // Process result
}
```

## Quick Reference

### Common API Patterns

```bash
# List all definitions
curl http://localhost:3000/

# Get definition info
curl "http://localhost:3000/solve/my_definition.gh"

# Simple solve
curl "http://localhost:3000/solve/my_definition.gh?param1=value1&param2=value2"

# Complex solve
curl -X POST http://localhost:3000/solve \
  -H "Content-Type: application/json" \
  -d '{"definition": "my_definition.gh", "inputs": {"param1": [value1], "param2": [value2]}}'
```

### Environment Variables

```bash
# Required
RHINO_COMPUTE_URL=http://localhost:6500/
RHINO_COMPUTE_KEY=your_api_key
NODE_ENV=production

# Optional
CORS_ORIGIN=https://your-domain.com
MEMCACHIER_SERVERS=your-cache-server:11211
PORT=3000
```

### File Structure

```
src/
├── files/                    # Grasshopper definitions
│   ├── my_definition.gh
│   └── another_definition.gh
├── routes/
│   ├── definition.js        # Definition serving
│   └── solve.js            # Solving logic
├── definitions.js          # Definition registration
└── app.js                  # Main application
```

This guide provides everything needed to successfully add, configure, and maintain new Grasshopper definitions in the SoftlyPlease Compute system. Follow the steps carefully and refer to the troubleshooting section if you encounter issues.
