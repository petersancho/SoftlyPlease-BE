# Complete Node.js Server Guide for SoftlyPlease.com Frontend Development

This comprehensive guide integrates all existing setups and guides to help you build the frontend for softlyplease.com with the TopoOpt.gh configurator. It covers Node.js server setup, Heroku deployment, API integration, and complete frontend development workflow.

## Table of Contents

### 1. System Architecture Overview
### 2. Quick Start Setup
### 3. Node.js Backend Configuration
### 4. Heroku Deployment Integration
### 5. API Integration Guide
### 6. TopoOpt.gh Configurator Integration
### 7. Frontend Development Workflow
### 8. UI/UX Design Considerations
### 9. Testing and Debugging
### 10. Production Deployment
### 11. Monitoring and Maintenance
### 12. Troubleshooting Guide
### 13. API Reference
### 14. Examples and Templates

---

## 1. System Architecture Overview

### 1.1 Complete System Stack

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Node.js API    │    │  Rhino Compute  │
│   React/Vue     │◄──►│   Express.js     │◄──►│  Grasshopper    │
│   www.softly-   │    │   Port 3000      │    │   Port 6500     │
│   please.com    │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Heroku        │    │   Definitions     │    │   TopoOpt.gh   │
│   Deployment    │    │   Directory       │    │   Configurator  │
│   softlyplease- │    │   assets/gh-definitions/      │    │                 │
│   compute-server│    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 1.2 Key Components

**Backend Services:**
- **Rhino Compute Server**: Geometry computation engine (Port 6500)
- **Node.js Express Server**: REST API server (Port 3000)
- **Grasshopper Definitions**: Parametric models in `assets/gh-definitions/`
- **Caching Layer**: Node-cache and Memcached support

**Frontend Components:**
- **React/Vue/Angular**: Frontend framework of your choice
- **API Client**: Integration with Node.js backend
- **Configurator UI**: Dynamic interface for TopoOpt.gh
- **Real-time Updates**: Live parameter adjustment and preview

### 1.3 Data Flow Architecture

```
User Action → Frontend → API Request → Parameter Processing → Cache Check → Rhino Compute → Grasshopper → Result → Frontend Update
```

**Detailed Workflow:**
1. **User interacts** with configurator UI
2. **Frontend sends** API request with parameters
3. **Node.js server** validates and processes request
4. **Cache lookup** for existing results
5. **Rhino Compute** solves Grasshopper definition
6. **Results returned** via JSON response
7. **Frontend updates** with new geometry/visualization

---

## 2. Quick Start Setup

### 2.1 Prerequisites

**Required Software:**
- **Node.js**: Version 16.x or higher
- **Git**: Latest version
- **Heroku CLI**: For deployment
- **Frontend Framework**: React, Vue, or Angular

**System Requirements:**
- **RAM**: Minimum 8GB (16GB recommended)
- **Disk Space**: 10GB free space
- **Network**: Stable internet connection

### 2.2 Environment Setup

```bash
# 1. Clone the repository
git clone https://github.com/boi1da-proj/SoftlyPlease-Compute.git
cd SoftlyPlease-Compute

# 2. Install dependencies
npm install

# 3. Start Rhino Compute (in background)
npm run start-rhino

# 4. Start Node.js server (in new terminal)
npm start

# 5. Verify services are running
curl http://localhost:3000/version
curl http://localhost:3000/
```

### 2.3 Development Environment

**Recommended Development Setup:**
```bash
# Use development mode for better error messages
NODE_ENV=development npm start

# Or use the dev script
npm run start:dev
```

**Environment Variables for Development:**
```bash
# .env file (create in project root)
RHINO_COMPUTE_URL=http://localhost:6500/
RHINO_COMPUTE_KEY=p2robot-13a6-48f3-b24e-2025computeX
NODE_ENV=development
CORS_ORIGIN=http://localhost:3001  # Your frontend dev server
PORT=3000
```

---

## 3. Node.js Backend Configuration

### 3.1 Server Structure

**Key Files:**
```
src/
├── app.js              # Main application setup
├── bin/www             # Server startup
├── definitions.js      # Definition management
├── version.js          # Version handling
├── routes/
│   ├── index.js        # Definition listing
│   ├── definition.js   # Definition serving
│   ├── solve.js        # Core solving logic
│   ├── version.js      # Version endpoint
│   └── template.js     # Auto-generated UI
└── files/              # Grasshopper definitions
    └── TopoOpt.gh      # Your topology optimizer
```

### 3.2 Main Application Setup (`src/app.js`)

**Key Configuration:**
```javascript
// CORS configuration for your domain
app.use(cors({
  origin: [
    'https://www.softlyplease.com',
    'https://softlyplease.com',
    'http://localhost:3001',  // Your dev server
    process.env.CORS_ORIGIN
  ].filter(Boolean),
  credentials: true
}))

// Rhino Compute connection
const RHINO_COMPUTE_URL = process.env.RHINO_COMPUTE_URL || 'http://localhost:6500/'
const RHINO_COMPUTE_KEY = process.env.RHINO_COMPUTE_KEY || 'p2robot-13a6-48f3-b24e-2025computeX'
```

### 3.3 Route Configuration

**Available Endpoints:**
```javascript
// Definition management
app.use('/', require('./routes/index'))           // GET / - List definitions
app.use('/definition', require('./routes/definition')) // GET /definition/:id - Get definition

// Solving
app.use('/solve', require('./routes/solve'))      // GET /solve/:definition, POST /solve

// Information
app.use('/version', require('./routes/version'))  // GET /version - System info
app.use('/view', require('./routes/template'))    // GET /view - Auto-generated UI
```

### 3.4 Definition Management (`src/definitions.js`)

**Auto-Discovery Process:**
```javascript
function registerDefinitions() {
  const files = fs.readdirSync(path.join(__dirname, 'files/'))
  const definitions = []

  files.forEach(file => {
    if (file.includes('.gh') || file.includes('.ghx')) {
      const fullPath = path.join(__dirname, 'files/' + file)
      const hash = md5File.sync(fullPath)

      definitions.push({
        name: file,              // "TopoOpt.gh"
        id: hash,               // Unique MD5 identifier
        path: fullPath          // Absolute file path
      })
    }
  })

  return definitions
}
```

**Parameter Discovery:**
```javascript
async function getParams(definitionUrl) {
  const response = await compute.computeFetch('io', { 'pointer': definitionUrl })
  const result = await response.json()

  // Convert to JavaScript-friendly format
  result = camelcaseKeys(result, {deep: true})

  return {
    description: result.description,
    inputs: result.inputs,
    outputs: result.outputs,
    view: result.view  // Whether to show in UI
  }
}
```

---

## 4. Heroku Deployment Integration

### 4.1 Heroku App Setup

**Create Heroku App:**
```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create app
heroku create softlyplease-compute-server

# Add remote
heroku git:remote -a softlyplease-compute-server
```

### 4.2 Environment Variables

**Required Environment Variables:**
```bash
# Set environment variables
heroku config:set RHINO_COMPUTE_URL="http://localhost:6500/"  # Update with your server IP
heroku config:set RHINO_COMPUTE_KEY="p2robot-13a6-48f3-b24e-2025computeX"
heroku config:set NODE_ENV="production"
heroku config:set CORS_ORIGIN="https://www.softlyplease.com"
heroku config:set PORT="3000"
```

**Production Environment Variables:**
```bash
# For production with external Rhino Compute
heroku config:set RHINO_COMPUTE_URL="http://YOUR_SERVER_IP:6500/"
```

### 4.3 Deployment Process

**Deploy to Heroku:**
```bash
# Add changes
git add .
git commit -m "Deploy to Heroku"

# Push to Heroku
git push heroku main

# Check deployment status
heroku logs --tail
heroku ps
```

### 4.4 Domain Configuration

**Custom Domain Setup:**
```bash
# Add domains to Heroku
heroku domains:add www.softlyplease.com
heroku domains:add softlyplease.com

# Get DNS target
heroku domains

# Configure DNS (Namecheap example):
# A Record: @ → [Heroku IP]
# CNAME Record: www → softlyplease-compute-server.herokuapp.com
```

---

## 5. API Integration Guide

### 5.1 Base API Configuration

**API Base URLs:**
```javascript
// Development
const API_BASE = 'http://localhost:3000'

// Production
const API_BASE = 'https://softlyplease-compute-server.herokuapp.com'

// Custom domain
const API_BASE = 'https://www.softlyplease.com'
```

### 5.2 Core API Endpoints

**Definition Management:**
```javascript
// Get all available definitions
const response = await fetch(`${API_BASE}/`)
const definitions = await response.json()
// Returns: [{"name": "TopoOpt.gh"}, {"name": "beam_mod.gh"}, ...]

// Get specific definition info
const response = await fetch(`${API_BASE}/TopoOpt.gh`)
const definitionInfo = await response.json()
// Returns: {description, inputs, outputs, view}
```

**Solving Definitions:**
```javascript
// GET request for simple parameters
const response = await fetch(`${API_BASE}/solve/TopoOpt.gh?width=1000&height=500&material=steel`)

// POST request for complex parameters
const response = await fetch(`${API_BASE}/solve`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    definition: 'TopoOpt.gh',
    inputs: {
      width: [1000],
      height: [500],
      material: ['steel'],
      load: [10000]
    }
  })
})
```

**System Information:**
```javascript
// Get version information
const response = await fetch(`${API_BASE}/version`)
const versionInfo = await response.json()
// Returns: {rhino, compute, appserver, git_sha}
```

### 5.3 API Response Format

**Standard Response:**
```javascript
{
  "values": [
    ["geometry_data"],     // Output 1: Geometry
    [0.85],               // Output 2: Efficiency ratio
    [2450.5],            // Output 3: Weight in kg
    ["optimized_mesh"]    // Output 4: Mesh data
  ]
}
```

**Error Response:**
```javascript
{
  "message": "Invalid parameter type for input: width"
}
```

### 5.4 Caching Strategy

**Built-in Caching:**
```javascript
// Results are automatically cached based on:
// - Definition name
// - Input parameters
// - Definition file hash

// Cache headers in response
// Cache-Control: public, max-age=31536000
// Server-Timing: cacheHit;dur=15
```

**Cache Invalidation:**
- **Automatic**: When definition file changes (MD5 hash changes)
- **Manual**: Restart server to clear Node cache
- **TTL**: 1 hour default for node-cache

---

## 6. TopoOpt.gh Configurator Integration

### 6.1 Dynamic Parameter Discovery

**Get TopoOpt Parameters:**
```javascript
async function getTopoOptParameters() {
  try {
    const response = await fetch(`${API_BASE}/TopoOpt.gh`)
    const data = await response.json()

    return {
      description: data.description,
      inputs: data.inputs,      // Array of input parameters
      outputs: data.outputs     // Array of output parameters
    }
  } catch (error) {
    console.error('Failed to load TopoOpt parameters:', error)
    return null
  }
}
```

**Parameter Structure:**
```javascript
{
  "inputs": [
    {
      "name": "Width",
      "paramType": "Number",
      "default": [1000],
      "minimum": [100],
      "maximum": [5000]
    },
    {
      "name": "Height",
      "paramType": "Number",
      "default": [500],
      "minimum": [50],
      "maximum": [2000]
    },
    {
      "name": "Material",
      "paramType": "Text",
      "default": ["steel"],
      "options": ["steel", "titanium", "aluminum", "composite"]
    }
  ],
  "outputs": [
    {
      "name": "OptimizedGeometry",
      "paramType": "Geometry"
    },
    {
      "name": "Efficiency",
      "paramType": "Number"
    },
    {
      "name": "Weight",
      "paramType": "Number"
    }
  ]
}
```

### 6.2 Dynamic UI Generation

**Generate Configurator UI:**
```javascript
function generateConfiguratorUI(parameters) {
  const container = document.getElementById('configurator')

  parameters.inputs.forEach(param => {
    const paramDiv = document.createElement('div')
    paramDiv.className = 'parameter-group'

    // Label
    const label = document.createElement('label')
    label.textContent = param.name
    paramDiv.appendChild(label)

    // Input element based on type
    const input = createInputForParameter(param)
    paramDiv.appendChild(input)

    container.appendChild(paramDiv)
  })
}

function createInputForParameter(param) {
  switch(param.paramType) {
    case 'Number':
      const slider = document.createElement('input')
      slider.type = 'range'
      slider.min = param.minimum ? param.minimum[0] : 0
      slider.max = param.maximum ? param.maximum[0] : 1000
      slider.value = param.default[0]
      slider.step = (param.maximum[0] - param.minimum[0]) / 100
      return slider

    case 'Text':
      if (param.options) {
        const select = document.createElement('select')
        param.options.forEach(option => {
          const optionEl = document.createElement('option')
          optionEl.value = option
          optionEl.textContent = option
          select.appendChild(optionEl)
        })
        return select
      } else {
        const input = document.createElement('input')
        input.type = 'text'
        input.value = param.default[0]
        return input
      }

    case 'Boolean':
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.checked = param.default[0]
      return checkbox

    default:
      const textInput = document.createElement('input')
      textInput.type = 'text'
      textInput.value = param.default[0]
      return textInput
  }
}
```

### 6.3 Real-time Parameter Updates

**Debounced Parameter Updates:**
```javascript
class TopoOptConfigurator {
  constructor(apiBase) {
    this.apiBase = apiBase
    this.parameters = {}
    this.updateTimeout = null
    this.isUpdating = false
  }

  async initialize() {
    // Load parameters
    const paramData = await this.getParameters()
    if (paramData) {
      this.parameters = paramData.inputs
      this.generateUI()
      this.setupEventListeners()
    }
  }

  async getParameters() {
    try {
      const response = await fetch(`${this.apiBase}/TopoOpt.gh`)
      return await response.json()
    } catch (error) {
      console.error('Failed to get parameters:', error)
      return null
    }
  }

  generateUI() {
    // Generate UI as shown above
    generateConfiguratorUI({ inputs: this.parameters })
  }

  setupEventListeners() {
    // Add listeners to all inputs
    document.querySelectorAll('#configurator input, #configurator select')
      .forEach(input => {
        input.addEventListener('input', () => this.debouncedUpdate())
      })
  }

  debouncedUpdate() {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout)
    }

    this.updateTimeout = setTimeout(() => {
      this.updateResults()
    }, 500) // 500ms debounce
  }

  async updateResults() {
    if (this.isUpdating) return

    this.isUpdating = true
    const params = this.collectParameters()

    try {
      const response = await fetch(`${this.apiBase}/solve/TopoOpt.gh?${this.buildQueryString(params)}`)
      const result = await response.json()

      if (result.values) {
        this.updateVisualization(result.values)
        this.updateMetrics(result.values)
      }
    } catch (error) {
      console.error('Update failed:', error)
      this.showError('Failed to update results')
    } finally {
      this.isUpdating = false
    }
  }

  collectParameters() {
    const params = {}
    document.querySelectorAll('#configurator input, #configurator select')
      .forEach(input => {
        const paramName = input.closest('.parameter-group').querySelector('label').textContent
        if (input.type === 'checkbox') {
          params[paramName] = [input.checked]
        } else {
          params[paramName] = [input.value]
        }
      })
    return params
  }

  buildQueryString(params) {
    return Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value[0])}`)
      .join('&')
  }

  updateVisualization(values) {
    // Update 3D viewer with geometry from values[0]
    const geometry = values[0]
    if (window.viewer) {
      window.viewer.updateGeometry(geometry)
    }
  }

  updateMetrics(values) {
    // Update efficiency, weight, etc.
    const efficiency = values[1] ? values[1][0] : 0
    const weight = values[2] ? values[2][0] : 0

    document.getElementById('efficiency').textContent = `${(efficiency * 100).toFixed(1)}%`
    document.getElementById('weight').textContent = `${weight.toFixed(1)} kg`
  }

  showError(message) {
    const errorDiv = document.getElementById('error-message')
    errorDiv.textContent = message
    errorDiv.style.display = 'block'
    setTimeout(() => {
      errorDiv.style.display = 'none'
    }, 5000)
  }
}

// Initialize configurator
const configurator = new TopoOptConfigurator(API_BASE)
configurator.initialize()
```

### 6.4 Advanced Features

**Batch Processing:**
```javascript
async function runBatchOptimization(variations) {
  const promises = variations.map(variation => {
    const queryString = Object.entries(variation)
      .map(([key, value]) => `${key}=${value}`)
      .join('&')

    return fetch(`${API_BASE}/solve/TopoOpt.gh?${queryString}`)
      .then(response => response.json())
  })

  const results = await Promise.all(promises)
  return results
}

// Usage
const variations = [
  { width: 1000, height: 500, material: 'steel' },
  { width: 1200, height: 600, material: 'titanium' },
  { width: 800, height: 400, material: 'aluminum' }
]

const batchResults = await runBatchOptimization(variations)
console.log('Batch results:', batchResults)
```

**Parameter Presets:**
```javascript
const parameterPresets = {
  lightweight: {
    width: [800],
    height: [400],
    material: ['aluminum'],
    load: [5000]
  },
  heavyDuty: {
    width: [1500],
    height: [800],
    material: ['steel'],
    load: [15000]
  },
  racing: {
    width: [1200],
    height: [300],
    material: ['titanium'],
    load: [8000]
  }
}

function applyPreset(presetName) {
  const preset = parameterPresets[presetName]
  if (preset) {
    Object.entries(preset).forEach(([paramName, value]) => {
      const input = document.querySelector(`[data-parameter="${paramName}"]`)
      if (input) {
        input.value = value[0]
        input.dispatchEvent(new Event('input'))
      }
    })
  }
}
```

---

## 7. Frontend Development Workflow

### 7.1 Project Structure

**Recommended Frontend Structure:**
```
softlyplease-frontend/
├── src/
│   ├── components/
│   │   ├── Configurator/
│   │   │   ├── TopoOptConfigurator.jsx
│   │   │   ├── ParameterSlider.jsx
│   │   │   ├── GeometryViewer.jsx
│   │   │   └── MetricsDisplay.jsx
│   │   ├── Layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── Navigation.jsx
│   │   └── Common/
│   │       ├── LoadingSpinner.jsx
│   │       └── ErrorMessage.jsx
│   ├── services/
│   │   ├── api.js
│   │   ├── configurator.js
│   │   └── definitions.js
│   ├── hooks/
│   │   ├── useConfigurator.js
│   │   └── useAPI.js
│   ├── utils/
│   │   ├── geometry.js
│   │   └── validation.js
│   ├── styles/
│   │   ├── components/
│   │   └── global.css
│   └── App.jsx
├── public/
│   ├── index.html
│   └── assets/
├── package.json
└── .env
```

### 7.2 API Service Layer

**API Service (`src/services/api.js`):**
```javascript
class APIService {
  constructor(baseURL) {
    this.baseURL = baseURL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Definition methods
  async getDefinitions() {
    return this.request('/')
  }

  async getDefinitionInfo(definitionName) {
    return this.request(`/${definitionName}`)
  }

  // Solving methods
  async solveDefinition(definitionName, params) {
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value[0])}`)
      .join('&')

    return this.request(`/solve/${definitionName}?${queryString}`)
  }

  async solveDefinitionPost(definitionName, inputs) {
    return this.request('/solve', {
      method: 'POST',
      body: JSON.stringify({
        definition: definitionName,
        inputs: inputs
      })
    })
  }

  // System methods
  async getVersion() {
    return this.request('/version')
  }
}

// Export singleton instance
export default new APIService(
  process.env.NODE_ENV === 'production'
    ? 'https://www.softlyplease.com'
    : 'http://localhost:3000'
)
```

### 7.3 Configurator Hook

**Custom Hook (`src/hooks/useConfigurator.js`):**
```javascript
import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

export function useConfigurator(definitionName = 'TopoOpt.gh') {
  const [parameters, setParameters] = useState([])
  const [currentValues, setCurrentValues] = useState({})
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load parameters on mount
  useEffect(() => {
    loadParameters()
  }, [definitionName])

  const loadParameters = async () => {
    try {
      setLoading(true)
      const data = await api.getDefinitionInfo(definitionName)

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
    } finally {
      setLoading(false)
    }
  }

  const updateParameter = useCallback((paramName, value) => {
    setCurrentValues(prev => ({
      ...prev,
      [paramName]: [value]
    }))
  }, [])

  const solve = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await api.solveDefinition(definitionName, currentValues)
      setResults(result.values)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [definitionName, currentValues])

  return {
    parameters,
    currentValues,
    results,
    loading,
    error,
    updateParameter,
    solve,
    reload: loadParameters
  }
}
```

### 7.4 Main Configurator Component

**Configurator Component (`src/components/Configurator/TopoOptConfigurator.jsx`):**
```jsx
import React from 'react'
import { useConfigurator } from '../../hooks/useConfigurator'
import ParameterSlider from './ParameterSlider'
import GeometryViewer from './GeometryViewer'
import MetricsDisplay from './MetricsDisplay'
import LoadingSpinner from '../Common/LoadingSpinner'
import ErrorMessage from '../Common/ErrorMessage'

function TopoOptConfigurator() {
  const {
    parameters,
    currentValues,
    results,
    loading,
    error,
    updateParameter,
    solve
  } = useConfigurator('TopoOpt.gh')

  const handleParameterChange = (paramName, value) => {
    updateParameter(paramName, value)
    // Debounced solve - could be optimized
    setTimeout(solve, 500)
  }

  if (loading && parameters.length === 0) {
    return <LoadingSpinner message="Loading configurator..." />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} />
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
            <GeometryViewer geometry={results?.[0]} loading={loading} />
          </div>

          <div className="metrics-section">
            <h2>Performance Metrics</h2>
            <MetricsDisplay results={results} loading={loading} />
          </div>
        </div>
      </div>

      <div className="configurator-actions">
        <button
          onClick={solve}
          disabled={loading}
          className="solve-button"
        >
          {loading ? 'Computing...' : 'Compute Optimization'}
        </button>
      </div>
    </div>
  )
}

export default TopoOptConfigurator
```

### 7.5 Parameter Slider Component

**Parameter Slider (`src/components/Configurator/ParameterSlider.jsx`):**
```jsx
import React from 'react'

function ParameterSlider({ parameter, value, onChange }) {
  const handleChange = (e) => {
    const newValue = e.target.type === 'range'
      ? parseFloat(e.target.value)
      : e.target.type === 'number'
      ? parseFloat(e.target.value)
      : e.target.value

    onChange(newValue)
  }

  const renderInput = () => {
    switch(parameter.paramType) {
      case 'Number':
        const hasRange = parameter.minimum && parameter.maximum
        if (hasRange) {
          return (
            <div className="slider-group">
              <input
                type="range"
                min={parameter.minimum[0]}
                max={parameter.maximum[0]}
                step={(parameter.maximum[0] - parameter.minimum[0]) / 100}
                value={value || parameter.default?.[0] || 0}
                onChange={handleChange}
                className="parameter-slider"
              />
              <input
                type="number"
                min={parameter.minimum[0]}
                max={parameter.maximum[0]}
                value={value || parameter.default?.[0] || 0}
                onChange={handleChange}
                className="parameter-number"
              />
            </div>
          )
        } else {
          return (
            <input
              type="number"
              value={value || parameter.default?.[0] || 0}
              onChange={handleChange}
              className="parameter-number"
            />
          )
        }

      case 'Text':
        if (parameter.options) {
          return (
            <select
              value={value || parameter.default?.[0] || ''}
              onChange={handleChange}
              className="parameter-select"
            >
              {parameter.options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          )
        } else {
          return (
            <input
              type="text"
              value={value || parameter.default?.[0] || ''}
              onChange={handleChange}
              className="parameter-text"
            />
          )
        }

      case 'Boolean':
        return (
          <label className="parameter-checkbox">
            <input
              type="checkbox"
              checked={value || parameter.default?.[0] || false}
              onChange={(e) => onChange(e.target.checked)}
            />
            {parameter.name}
          </label>
        )

      default:
        return (
          <input
            type="text"
            value={value || parameter.default?.[0] || ''}
            onChange={handleChange}
            className="parameter-text"
          />
        )
    }
  }

  return (
    <div className="parameter-group">
      <label className="parameter-label">
        {parameter.name}
        {parameter.paramType === 'Number' && (
          <span className="parameter-unit">
            ({parameter.minimum?.[0] || 0} - {parameter.maximum?.[0] || 1000})
          </span>
        )}
      </label>
      {renderInput()}
    </div>
  )
}

export default ParameterSlider
```

### 7.6 Geometry Viewer Component

**Geometry Viewer (`src/components/Configurator/GeometryViewer.jsx`):**
```jsx
import React, { useEffect, useRef } from 'react'

function GeometryViewer({ geometry, loading }) {
  const viewerRef = useRef(null)
  const viewerInstance = useRef(null)

  useEffect(() => {
    // Initialize 3D viewer (e.g., Three.js, Babylon.js, or custom viewer)
    if (viewerRef.current && !viewerInstance.current) {
      viewerInstance.current = initializeViewer(viewerRef.current)
    }
  }, [])

  useEffect(() => {
    if (viewerInstance.current && geometry) {
      viewerInstance.current.updateGeometry(geometry)
    }
  }, [geometry])

  const initializeViewer = (container) => {
    // Initialize your 3D viewer here
    // This is a placeholder - replace with actual viewer implementation
    console.log('Initializing 3D viewer in', container)

    return {
      updateGeometry: (geometryData) => {
        console.log('Updating geometry:', geometryData)
        // Update viewer with new geometry
      }
    }
  }

  return (
    <div className="geometry-viewer">
      {loading && (
        <div className="viewer-loading">
          <div className="loading-spinner"></div>
          <p>Computing topology optimization...</p>
        </div>
      )}

      <div
        ref={viewerRef}
        className="viewer-container"
        style={{
          width: '100%',
          height: '400px',
          background: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          position: 'relative'
        }}
      >
        {!geometry && !loading && (
          <div className="viewer-placeholder">
            <p>Geometry will appear here after computation</p>
          </div>
        )}
      </div>

      <div className="viewer-controls">
        <button onClick={() => viewerInstance.current?.resetView()}>
          Reset View
        </button>
        <button onClick={() => viewerInstance.current?.toggleWireframe()}>
          Toggle Wireframe
        </button>
      </div>
    </div>
  )
}

export default GeometryViewer
```

### 7.7 Metrics Display Component

**Metrics Display (`src/components/Configurator/MetricsDisplay.jsx`):**
```jsx
import React from 'react'

function MetricsDisplay({ results, loading }) {
  if (!results && !loading) {
    return (
      <div className="metrics-placeholder">
        <p>Metrics will appear after computation</p>
      </div>
    )
  }

  // Assuming results format: [geometry, efficiency, weight, other_metrics]
  const efficiency = results?.[1]?.[0] || 0
  const weight = results?.[2]?.[0] || 0

  return (
    <div className="metrics-display">
      <div className="metric-item">
        <label>Efficiency Ratio:</label>
        <span className="metric-value">
          {loading ? '...' : `${(efficiency * 100).toFixed(1)}%`}
        </span>
      </div>

      <div className="metric-item">
        <label>Weight:</label>
        <span className="metric-value">
          {loading ? '...' : `${weight.toFixed(1)} kg`}
        </span>
      </div>

      {loading && (
        <div className="metrics-loading">
          <div className="loading-bar"></div>
          <p>Analyzing optimization results...</p>
        </div>
      )}
    </div>
  )
}

export default MetricsDisplay
```

---

## 8. UI/UX Design Considerations

### 8.1 Design Principles

**User-Centric Design:**
- **Intuitive Controls**: Sliders and dropdowns for parameters
- **Real-time Feedback**: Immediate visual updates
- **Progressive Disclosure**: Show advanced options on demand
- **Error Prevention**: Validate inputs before computation

**Performance Considerations:**
- **Loading States**: Show progress during computation
- **Caching**: Leverage API caching for faster responses
- **Progressive Enhancement**: Basic functionality without JavaScript
- **Mobile Responsive**: Work on all device sizes

### 8.2 Visual Hierarchy

**Configurator Layout:**
```css
.topoopt-configurator {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.parameters-panel {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.results-panel {
  display: grid;
  gap: 2rem;
}

.viewer-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.metrics-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

### 8.3 Interactive Elements

**Parameter Controls:**
```css
.parameter-group {
  margin-bottom: 1.5rem;
}

.parameter-label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.parameter-slider {
  width: 100%;
  margin-bottom: 0.5rem;
}

.slider-group {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.parameter-number {
  width: 80px;
  padding: 0.25rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.parameter-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
```

### 8.4 Loading and Feedback

**Loading States:**
```css
.viewer-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 1000;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.metrics-loading {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.loading-bar {
  width: 100%;
  height: 4px;
  background: #e9ecef;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.loading-bar::after {
  content: '';
  display: block;
  width: 30%;
  height: 100%;
  background: #3498db;
  animation: loading 1.5s ease-in-out infinite;
}

@keyframes loading {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(300%); }
}
```

### 8.5 Error Handling

**Error Display:**
```css
.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #f5c6cb;
  margin-bottom: 1rem;
  display: none;
}

.error-message.show {
  display: block;
}

.error-message .error-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.error-message .error-text {
  margin-bottom: 0.5rem;
}

.error-message .error-retry {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.error-message .error-retry:hover {
  background: #c82333;
}
```

**Success Feedback:**
```css
.success-message {
  background: #d4edda;
  color: #155724;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #c3e6cb;
  margin-bottom: 1rem;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## 9. Testing and Debugging

### 9.1 Development Testing

**API Testing:**
```bash
# Test API endpoints
curl http://localhost:3000/
curl "http://localhost:3000/TopoOpt.gh"
curl "http://localhost:3000/solve/TopoOpt.gh?width=1000&height=500"

# Test with different parameters
curl "http://localhost:3000/solve/TopoOpt.gh?width=1000&height=500&material=steel"
```

**Frontend Testing:**
```javascript
// Test configurator in browser console
const configurator = new TopoOptConfigurator('http://localhost:3000')
await configurator.initialize()
console.log('Parameters:', configurator.parameters)
```

### 9.2 Debugging Tools

**Browser Developer Tools:**
```javascript
// Debug API calls
fetch('http://localhost:3000/TopoOpt.gh')
  .then(r => r.json())
  .then(data => console.log('Parameters:', data))
  .catch(err => console.error('Error:', err))

// Debug parameter changes
document.querySelectorAll('input').forEach(input => {
  input.addEventListener('input', (e) => {
    console.log('Parameter changed:', e.target.name, e.target.value)
  })
})
```

**Network Debugging:**
```javascript
// Monitor all API requests
const originalFetch = window.fetch
window.fetch = function(...args) {
  console.log('API Request:', args[0], args[1])
  return originalFetch.apply(this, args)
    .then(response => {
      console.log('API Response:', response.status, response.statusText)
      return response
    })
}
```

### 9.3 Performance Monitoring

**API Performance:**
```javascript
// Measure API response times
async function measurePerformance() {
  const start = performance.now()

  try {
    const response = await fetch('/solve/TopoOpt.gh?width=1000&height=500')
    const end = performance.now()

    console.log('API Response Time:', end - start, 'ms')
    console.log('Cache Hit:', response.headers.get('server-timing')?.includes('cacheHit'))

    return await response.json()
  } catch (error) {
    console.error('API Error:', error)
  }
}
```

**Memory Usage:**
```javascript
// Monitor memory usage
setInterval(() => {
  if (performance.memory) {
    console.log('Memory Usage:', {
      used: Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB',
      total: Math.round(performance.memory.totalJSHeapSize / 1048576) + ' MB',
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + ' MB'
    })
  }
}, 5000)
```

---

## 10. Production Deployment

### 10.1 Build Configuration

**Frontend Build:**
```bash
# Build for production
npm run build

# Serve build locally
npm install -g serve
serve -s build -l 3001
```

**Environment Variables:**
```bash
# .env.production
REACT_APP_API_URL=https://www.softlyplease.com
REACT_APP_DEBUG=false
```

### 10.2 Heroku Deployment

**Deploy Frontend:**
```bash
# Create Heroku app for frontend
heroku create softlyplease-frontend

# Add buildpack for React
heroku buildpacks:set mars/create-react-app

# Set environment variables
heroku config:set REACT_APP_API_URL=https://www.softlyplease.com

# Deploy
git push heroku main
```

**Static Hosting Alternative:**
```bash
# Build and deploy to Netlify/Vercel
npm run build

# Deploy build folder to hosting service
# Configure API_BASE in environment
```

### 10.3 CDN and Assets

**Static Asset Optimization:**
```javascript
// Preload critical assets
<link rel="preload" href="/static/js/main.js" as="script">
<link rel="preload" href="/static/css/main.css" as="style">

// Lazy load 3D viewer
const GeometryViewer = lazy(() => import('./GeometryViewer'))
```

**Image Optimization:**
```javascript
// Use WebP with fallbacks
<picture>
  <source srcset="logo.webp" type="image/webp">
  <img src="logo.png" alt="Logo">
</picture>
```

---

## 11. Monitoring and Maintenance

### 11.1 Performance Monitoring

**Heroku Metrics:**
```bash
# Monitor dyno performance
heroku metrics:response-time --app softlyplease-compute-server
heroku metrics:memory --app softlyplease-compute-server

# Check dyno status
heroku ps --app softlyplease-compute-server
```

**API Monitoring:**
```bash
# Monitor API response times
heroku logs --app softlyplease-compute-server --tail | grep "response_time"
```

### 11.2 Error Tracking

**Log Analysis:**
```bash
# View recent errors
heroku logs --app softlyplease-compute-server --num 100 | grep -i error

# Monitor specific endpoint
heroku logs --app softlyplease-compute-server | grep "/solve/TopoOpt.gh"
```

**Error Reporting:**
```javascript
// Add error tracking service
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // Add custom context
    event.contexts = {
      ...event.contexts,
      configurator: {
        definition: 'TopoOpt.gh',
        parameters: currentValues
      }
    }
    return event
  }
})
```

### 11.3 Backup and Recovery

**Configuration Backup:**
```bash
# Backup Heroku config
heroku config --app softlyplease-compute-server > config_backup.txt

# Backup app info
heroku apps:info --app softlyplease-compute-server > app_info.txt
```

**Definition Backup:**
```bash
# Backup definitions
cp -r assets/gh-definitions/ backup/files_$(date +%Y%m%d_%H%M%S)

# Backup to Git
git add assets/gh-definitions/
git commit -m "Backup definitions"
git push origin main
```

---

## 12. Troubleshooting Guide

### 12.1 Common Issues

**API Connection Failed:**
```bash
# Check if backend is running
curl http://localhost:3000/version

# Check environment variables
echo $REACT_APP_API_URL

# Verify CORS configuration
curl -H "Origin: http://localhost:3001" -v http://localhost:3000/
```

**Definition Not Found:**
```bash
# Check if file exists
ls -la assets/gh-definitions/TopoOpt.gh

# Verify registration
curl http://localhost:3000/

# Check file permissions
icacls src\files\TopoOpt.gh
```

**Parameter Errors:**
```bash
# Get parameter structure
curl "http://localhost:3000/TopoOpt.gh"

# Check parameter names match exactly
# Verify data types
# Check array format for DataTree
```

**Solving Errors:**
```bash
# Check Rhino Compute connection
curl http://localhost:6500/version

# Test with simple parameters
curl "http://localhost:3000/solve/TopoOpt.gh?width=1000"

# Check Grasshopper definition validity
# Verify all components are connected
```

### 12.2 Performance Issues

**Slow Response Times:**
```bash
# Check cache headers
curl -I "http://localhost:3000/solve/TopoOpt.gh?width=1000"

# Monitor memory usage
heroku ps:info web.1

# Check for large geometry output
# Reduce mesh quality if needed
```

**Memory Issues:**
```bash
# Monitor memory usage
heroku metrics:memory

# Check for memory leaks
# Reduce geometry complexity
# Implement streaming for large data
```

### 12.3 Browser Compatibility

**JavaScript Errors:**
```javascript
// Check browser support
if (!window.fetch) {
  // Polyfill fetch
  import('whatwg-fetch')
}

// Check WebGL support for 3D viewer
if (!window.WebGLRenderingContext) {
  showError('WebGL not supported')
}
```

**Mobile Issues:**
```javascript
// Check touch support
const isTouchDevice = 'ontouchstart' in window

// Adjust UI for mobile
if (isTouchDevice) {
  // Larger touch targets
  // Simplified controls
  // Touch gestures for 3D viewer
}
```

---

## 13. API Reference

### 13.1 Core Endpoints

**Definitions:**
```http
GET /                           # List all definitions
GET /:definition               # Get definition info
```

**Solving:**
```http
GET /solve/:definition?param=value  # Solve with GET
POST /solve                       # Solve with POST
{
  "definition": "TopoOpt.gh",
  "inputs": {
    "width": [1000],
    "height": [500]
  }
}
```

**System:**
```http
GET /version                    # System version info
```

### 13.2 Response Formats

**Definition Info:**
```json
{
  "description": "Topology optimization configurator",
  "inputs": [
    {
      "name": "Width",
      "paramType": "Number",
      "default": [1000],
      "minimum": [100],
      "maximum": [5000]
    }
  ],
  "outputs": [
    {
      "name": "OptimizedGeometry",
      "paramType": "Geometry"
    }
  ]
}
```

**Solve Result:**
```json
{
  "values": [
    ["geometry_data"],    // Output 1
    [0.85],              // Output 2
    [2450.5],            // Output 3
  ]
}
```

**Error Response:**
```json
{
  "message": "Invalid parameter type for input: width"
}
```

### 13.3 Authentication

**API Key (if required):**
```bash
curl -H "RhinoComputeKey: your_api_key" http://localhost:3000/
```

**CORS Headers:**
```javascript
// Frontend sends
fetch('http://localhost:3000/', {
  headers: {
    'Origin': 'http://localhost:3001'
  }
})
```

---

## 14. Examples and Templates

### 14.1 Complete React App

**App.jsx:**
```jsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import TopoOptConfigurator from './components/Configurator/TopoOptConfigurator'
import Header from './components/Layout/Header'
import Footer from './components/Layout/Footer'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<TopoOptConfigurator />} />
            <Route path="/configurator" element={<TopoOptConfigurator />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
```

**index.js:**
```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
```

### 14.2 Vue.js Integration

**TopoOptConfigurator.vue:**
```vue
<template>
  <div class="topoopt-configurator">
    <div class="configurator-header">
      <h1>Topology Optimization Configurator</h1>
      <p>Design optimized structures using advanced computational methods</p>
    </div>

    <div class="configurator-layout">
      <div class="parameters-panel">
        <h2>Parameters</h2>
        <div v-for="param in parameters" :key="param.name" class="parameter-group">
          <ParameterSlider
            :parameter="param"
            :value="currentValues[param.name]?.[0]"
            @input="updateParameter(param.name, $event)"
          />
        </div>
      </div>

      <div class="results-panel">
        <GeometryViewer :geometry="results?.[0]" :loading="loading" />
        <MetricsDisplay :results="results" :loading="loading" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import ParameterSlider from './ParameterSlider.vue'
import GeometryViewer from './GeometryViewer.vue'
import MetricsDisplay from './MetricsDisplay.vue'
import { useConfigurator } from '../hooks/useConfigurator'

export default {
  name: 'TopoOptConfigurator',
  components: {
    ParameterSlider,
    GeometryViewer,
    MetricsDisplay
  },
  setup() {
    const { parameters, currentValues, results, loading, error, updateParameter, solve } = useConfigurator('TopoOpt.gh')

    onMounted(() => {
      // Initial solve with default parameters
      solve()
    })

    return {
      parameters,
      currentValues,
      results,
      loading,
      error,
      updateParameter,
      solve
    }
  }
}
</script>
```

### 14.3 Angular Integration

**topoopt-configurator.component.ts:**
```typescript
import { Component, OnInit } from '@angular/core'
import { ConfiguratorService } from '../../services/configurator.service'
import { Parameter } from '../../models/parameter.model'

@Component({
  selector: 'app-topoopt-configurator',
  templateUrl: './topoopt-configurator.component.html',
  styleUrls: ['./topoopt-configurator.component.scss']
})
export class TopooptConfiguratorComponent implements OnInit {
  parameters: Parameter[] = []
  currentValues: { [key: string]: any[] } = {}
  results: any[] = []
  loading = false
  error: string | null = null

  constructor(private configuratorService: ConfiguratorService) {}

  ngOnInit() {
    this.loadParameters()
  }

  async loadParameters() {
    try {
      this.loading = true
      const data = await this.configuratorService.getDefinitionInfo('TopoOpt.gh')
      this.parameters = data.inputs || []

      // Initialize with default values
      this.currentValues = {}
      this.parameters.forEach(param => {
        this.currentValues[param.name] = param.default || ['']
      })
    } catch (err) {
      this.error = err.message
    } finally {
      this.loading = false
    }
  }

  async onParameterChange(paramName: string, value: any) {
    this.currentValues[paramName] = [value]
    await this.solve()
  }

  async solve() {
    try {
      this.loading = true
      this.error = null

      const result = await this.configuratorService.solveDefinition('TopoOpt.gh', this.currentValues)
      this.results = result.values || []
    } catch (err) {
      this.error = err.message
    } finally {
      this.loading = false
    }
  }
}
```

---

This comprehensive guide provides everything needed to build, deploy, and maintain the softlyplease.com website with the TopoOpt.gh topology optimization configurator. It covers the complete stack from Node.js backend to frontend integration, with practical examples and troubleshooting guidance.
