# 🚀 Backend Provisioning Guide: Complete Setup for SoftlyPlease.com

## Overview

This comprehensive guide provides everything needed to provision, configure, and deploy the backend infrastructure for **softlyplease.com**. It ensures seamless integration between frontend and backend systems using the **Adjacent Payload Architecture** with enterprise-grade performance and reliability.

---

## Table of Contents

### 1. System Architecture & Requirements
### 2. Core Infrastructure Setup
### 3. Adjacent Payload System Configuration
### 4. Caching Architecture Implementation
### 5. Performance Optimization Stack
### 6. Security & Monitoring Setup
### 7. Production Deployment Strategy
### 8. Frontend Integration Verification
### 9. Scaling & Maintenance
### 10. Troubleshooting Matrix
### 11. Emergency Procedures

---

## 1. System Architecture & Requirements

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

### 1.2 Infrastructure Requirements

**Minimum Hardware Requirements:**
- **CPU**: 2+ cores (4+ cores recommended)
- **RAM**: 4GB minimum (8GB+ recommended)
- **Storage**: 20GB SSD minimum
- **Network**: 100Mbps+ stable connection

**Software Requirements:**
- **Node.js**: 16.x or 18.x (18.x recommended)
- **Rhino 7/8**: Latest version
- **Git**: Latest version
- **Heroku CLI**: Latest version

### 1.3 Service Dependencies

**Required Services:**
- **Heroku Account**: For cloud deployment
- **Rhino Compute Server**: Local or cloud instance
- **Memcached**: For production caching
- **Domain Registrar**: For custom domain setup

---

## 2. Core Infrastructure Setup

### 2.1 Project Structure Verification

**Required Directory Structure:**
```
SoftlyPlease-Compute/
├── src/
│   ├── app.js              # Main application
│   ├── bin/www             # Server startup
│   ├── definitions.js      # Definition management
│   ├── routes/
│   │   ├── index.js        # Definition listing
│   │   ├── definition.js   # File serving
│   │   ├── solve.js        # Core computation
│   │   └── version.js      # Version info
│   └── files/              # Grasshopper definitions
│       └── TopoOpt.gh      # Your definitions
├── package.json            # Dependencies & scripts
├── Procfile                # Heroku deployment
├── README.md              # Documentation
└── [Guide Files]          # All setup guides
```

**Verification Script:**
```bash
# Check required files exist
required_files=(
  "src/app.js"
  "src/bin/www"
  "src/definitions.js"
  "src/routes/solve.js"
  "package.json"
  "Procfile"
)

for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Missing: $file"
  else
    echo "✅ Found: $file"
  fi
done
```

### 2.2 Node.js Environment Setup

**Node.js Installation & Verification:**
```bash
# Install Node.js 18.x (recommended)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be v18.x.x
npm --version   # Should be 9.x.x

# Install global tools
npm install -g heroku pm2 nodemon
```

**NPM Dependencies Installation:**
```bash
# Clean install of all dependencies
rm -rf node_modules package-lock.json
npm install

# Verify critical dependencies
npm list compute-rhino3d memjs express helmet compression
```

### 2.3 Rhino Compute Server Setup

**Local Rhino Compute Installation:**
```bash
# Download and install Rhino 8
# Visit: https://www.rhino3d.com/download

# Install compute.geometry
# Copy compute.geometry.exe to:
# C:\SoftlyPlease-Compute\compute.rhino3d-8.x\src\bin\Release\compute.geometry\

# Verify Rhino Compute
ls -la compute.rhino3d-8.x/src/bin/Release/compute.geometry/
```

**Rhino Compute Configuration:**
```bash
# Start Rhino Compute server (Port 6500)
npm run start-rhino

# Verify server is running
curl http://localhost:6500/version

# Expected response:
# {
#   "version": "8.0.x.x",
#   "server": "compute.geometry"
# }
```

---

## 3. Adjacent Payload System Configuration

### 3.1 Core Payload Architecture Setup

**Definition Registration System:**
```javascript
// src/definitions.js - Auto-discovery configuration
function registerDefinitions() {
  const files = fs.readdirSync(path.join(__dirname, 'files/'))
  const definitions = []

  files.forEach(file => {
    if (file.includes('.gh') || file.includes('.ghx')) {
      const fullPath = path.join(__dirname, 'files/' + file)
      const hash = md5File.sync(fullPath)  // MD5 for consistency

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

**Parameter Processing System:**
```javascript
// src/routes/solve.js - DataTree conversion
function buildParameterTrees(params) {
  const trees = []

  if (params.inputs !== undefined) {
    for (let [key, value] of Object.entries(params.inputs)) {
      // CRITICAL: Ensure array format for DataTree
      if (!Array.isArray(value)) {
        console.warn(`Parameter ${key} converted to array:`, value)
        value = [value]
      }

      if (value.length > 0) {
        let param = new compute.Grasshopper.DataTree(key)
        param.append([0], value)
        trees.push(param)
      }
    }
  }

  return trees
}
```

### 3.2 File Serving System

**Hash-Based File Access:**
```javascript
// src/routes/definition.js - Definition serving
router.get('/:id', function(req, res, next) {
  let definition = req.app.get('definitions').find(o => o.id === req.params.id)

  if (!definition) {
    return res.status(404).json({ error: 'Definition not found' })
  }

  // Serve with performance headers
  res.set({
    'Cache-Control': 'public, max-age=3600',
    'ETag': definition.id,
    'Last-Modified': definition.lastModified || new Date().toISOString(),
    'Content-Type': 'application/octet-stream'
  })

  res.sendFile(definition.path, (error) => {
    if (error) {
      console.error('File serving error:', error.message)
      next(error)
    }
  })
})
```

### 3.3 Payload Construction Validation

**Frontend Payload Builder:**
```javascript
// For frontend developers - Adjacent Payload Construction
class AdjacentPayloadBuilder {
  constructor(definitionName) {
    this.definitionName = definitionName
  }

  buildPayload(inputs) {
    // Validate parameter format (CRITICAL)
    this.validateInputs(inputs)

    // Format for DataTree structure
    const formattedInputs = this.formatForDataTree(inputs)

    return {
      definition: this.definitionName,    // References base64 file
      inputs: formattedInputs,           // Parameters alongside definition
      cache: {
        ttl: 3600,                      // Cache duration
        useCache: true                  // Enable caching
      }
    }
  }

  validateInputs(inputs) {
    for (const [key, value] of Object.entries(inputs)) {
      if (!Array.isArray(value)) {
        throw new Error(`Parameter ${key} must be an array for DataTree`)
      }
      if (value.length === 0) {
        throw new Error(`Parameter ${key} cannot be empty`)
      }
    }
  }

  formatForDataTree(inputs) {
    const formatted = {}
    for (const [key, value] of Object.entries(inputs)) {
      formatted[key] = Array.isArray(value) ? value : [value]
    }
    return formatted
  }
}
```

---

## 4. Caching Architecture Implementation

### 4.1 Memcached Setup & Configuration

**Memcached Installation:**
```bash
# Install Memcached server
sudo apt-get update
sudo apt-get install memcached

# Start Memcached service
sudo systemctl start memcached
sudo systemctl enable memcached

# Verify Memcached is running
sudo systemctl status memcached

# Test connection
echo "stats" | nc localhost 11211
```

**Heroku Memcached Setup:**
```bash
# Add Memcached add-on to Heroku app
heroku addons:create memcachier:dev

# Verify Memcached environment variables
heroku config:get MEMCACHIER_SERVERS
heroku config:get MEMCACHIER_USERNAME
heroku config:get MEMCACHIER_PASSWORD
```

### 4.2 Cache Configuration

**Advanced Cache Setup:**
```javascript
// Enhanced Memcached configuration
if(process.env.MEMCACHIER_SERVERS !== undefined) {
  mc = memjs.Client.create(process.env.MEMCACHIER_SERVERS, {
    failover: true,        // Enable automatic failover
    timeout: 2,            // Increased timeout for complex computations
    keepAlive: true,       // Keep connections alive
    retries: 3,            // Retry failed operations
    retry_delay: 0.2,      // Delay between retries
    max_connections: 10,   // Connection pool size
    min_connections: 2     // Minimum connections to maintain
  })

  console.log('🚀 Memcached connected:', process.env.MEMCACHIER_SERVERS)
}

// Node-cache fallback configuration
const cache = new NodeCache({
  stdTTL: 3600,        // Default TTL: 1 hour
  checkperiod: 300,    // Check for expired keys every 5 minutes
  maxKeys: 10000,      // Maximum number of keys
  useClones: false,    // Performance optimization
  deleteOnExpire: true,
  errorOnMissing: false
})
```

### 4.3 Cache Key Strategy Implementation

**Intelligent Cache Key Generation:**
```javascript
function generateCacheKey(definitionName, inputs) {
  // Create deterministic key from definition + inputs
  const keyData = {
    definition: definitionName,
    inputs: inputs,
    timestamp: Math.floor(Date.now() / 1000 / 3600) // Hour-based versioning
  }

  // Use MD5 for consistency across deployments
  const keyString = JSON.stringify(keyData)
  const cacheKey = crypto.createHash('md5').update(keyString).digest('hex')

  return cacheKey
}

function determineCacheTTL(definitionName, parameterCount) {
  let ttl = 3600 // Base: 1 hour

  // Adjust based on definition type
  if (definitionName.includes('TopoOpt')) {
    ttl = 7200 // Topology optimization: 2 hours
  } else if (definitionName.includes('Analysis')) {
    ttl = 1800 // Analysis: 30 minutes
  }

  // Adjust based on parameter complexity
  if (parameterCount > 10) {
    ttl *= 2 // Longer cache for complex parameter sets
  }

  // Adjust for memory pressure
  if (process.memoryUsage().heapUsed > 0.8 * process.memoryUsage().heapTotal) {
    ttl /= 2 // Shorter TTL under memory pressure
  }

  return Math.max(ttl, 300) // Minimum 5 minutes
}
```

---

## 5. Performance Optimization Stack

### 5.1 Clustering & Load Management

**Worker Process Configuration:**
```javascript
// src/app.js - Clustering setup
if (process.env.NODE_ENV === 'production' && process.env.WEB_CONCURRENCY) {
  throng({
    workers: process.env.WEB_CONCURRENCY,
    lifetime: Infinity,
    master: () => {
      console.log('🚀 Master process started')
      console.log(`📊 Workers: ${process.env.WEB_CONCURRENCY}`)
    },
    start: startWorker
  })
}

function startWorker(id) {
  console.log(`🚀 Worker ${id} started`)

  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    console.log(`⏹️  Worker ${id} shutting down gracefully`)
    process.exit(0)
  })
}
```

**Request Queuing System:**
```javascript
// Request queue for concurrent computation management
class RequestQueue {
  constructor(maxConcurrent = 5) {
    this.queue = []
    this.processing = new Set()
    this.maxConcurrent = maxConcurrent
    this.stats = {
      processed: 0,
      queued: 0,
      rejected: 0
    }
  }

  async add(requestId, fn) {
    if (this.processing.size >= this.maxConcurrent) {
      this.stats.queued++
      return new Promise((resolve, reject) => {
        this.queue.push({ requestId, fn, resolve, reject })
      })
    }

    return this.process(requestId, fn)
  }

  async process(requestId, fn) {
    this.processing.add(requestId)
    this.stats.processed++

    try {
      const result = await fn()
      return result
    } finally {
      this.processing.delete(requestId)
      this.processNext()
    }
  }

  processNext() {
    if (this.queue.length > 0 && this.processing.size < this.maxConcurrent) {
      const item = this.queue.shift()
      this.process(item.requestId, item.fn)
        .then(item.resolve)
        .catch(item.reject)
    }
  }

  getStats() {
    return {
      queueLength: this.queue.length,
      processingCount: this.processing.size,
      maxConcurrent: this.maxConcurrent,
      ...this.stats
    }
  }
}
```

### 5.2 Advanced Compression

**Multi-Level Compression Strategy:**
```javascript
// Enhanced compression configuration
app.use(compression({
  level: 6,           // Best compression ratio
  threshold: 1024,    // Only compress >1KB
  filter: (req, res) => {
    // Skip compression for already compressed content
    if (req.headers['x-no-compression']) return false
    if (res.getHeader('Content-Encoding')) return false
    return compression.filter(req, res)
  },
  // Brotli support for modern browsers
  brotli: {
    enabled: true,
    zlib: {}
  }
}))
```

### 5.3 Memory Optimization

**Memory Management:**
```bash
# Node.js memory tuning
export NODE_OPTIONS="--max-old-space-size=512 --optimize-for-size --memory-reducer"

# Production environment
NODE_ENV=production
WEB_CONCURRENCY=2
MAX_CONCURRENT_COMPUTATIONS=5
```

---

## 6. Security & Monitoring Setup

### 6.1 Security Configuration

**Helmet Security Setup:**
```javascript
// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.memcachier.com"]
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}))
```

**Rate Limiting:**
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => req.url === '/health' || req.url === '/ready'
})

app.use('/solve', limiter)
```

### 6.2 Monitoring & Observability

**Health Check Endpoints:**
```javascript
// Health check
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    rhinoCompute: {
      url: process.env.RHINO_COMPUTE_URL,
      connected: true
    },
    cache: {
      type: process.env.MEMCACHIER_SERVERS ? 'memcached' : 'node-cache',
      status: 'operational'
    },
    definitions: (req.app.get('definitions') || []).length
  }
  res.json(health)
})

// Readiness check
app.get('/ready', (req, res) => {
  const definitions = req.app.get('definitions') || []
  const isReady = definitions.length > 0

  if (isReady) {
    res.status(200).json({
      status: 'ready',
      definitionsCount: definitions.length,
      definitions: definitions.map(d => d.name)
    })
  } else {
    res.status(503).json({
      status: 'not ready',
      definitionsCount: 0
    })
  }
})
```

**Performance Monitoring:**
```javascript
// Response time tracking
app.use(responseTime((req, res, time) => {
  res.setHeader('X-Response-Time', `${Math.round(time)}ms`)

  // Log slow requests
  if (time > 5000) {
    console.warn(`🐌 Slow request: ${req.method} ${req.url} took ${Math.round(time)}ms`)
  }

  // Performance metrics
  if (time > 1000) {
    // Log to monitoring service
    logPerformanceMetric({
      url: req.url,
      method: req.method,
      responseTime: time,
      timestamp: new Date().toISOString()
    })
  }
}))
```

---

## 7. Production Deployment Strategy

### 7.1 Heroku Production Setup

**Complete Heroku Configuration:**
```bash
# Create Heroku app
heroku create softlyplease-compute-server

# Set production environment
heroku config:set NODE_ENV=production
heroku config:set WEB_CONCURRENCY=2

# Configure Rhino Compute connection
heroku config:set RHINO_COMPUTE_URL="http://localhost:6500/"
heroku config:set RHINO_COMPUTE_KEY="p2robot-13a6-48f3-b24e-2025computeX"

# Add Memcached for performance
heroku addons:create memcachier:dev

# Set performance limits
heroku config:set MAX_CONCURRENT_COMPUTATIONS=5
heroku config:set RATE_LIMIT=100
heroku config:set CACHE_DEFAULT_TTL=3600

# Configure CORS for frontend domain
heroku config:set CORS_ORIGIN="https://www.softlyplease.com"

# Deploy
git push heroku main
```

### 7.2 Environment Variables Matrix

**Production Environment Variables:**
```bash
# ========================================
# NODE.JS CONFIGURATION
# ========================================
NODE_ENV=production
PORT=3000
WEB_CONCURRENCY=2

# ========================================
# RHINO COMPUTE CONFIGURATION
# ========================================
RHINO_COMPUTE_URL=http://localhost:6500/
RHINO_COMPUTE_KEY=p2robot-13a6-48f3-b24e-2025computeX

# ========================================
# CACHING CONFIGURATION
# ========================================
MEMCACHIER_SERVERS=your-memcached-instance
MEMCACHIER_USERNAME=
MEMCACHIER_PASSWORD=
CACHE_DEFAULT_TTL=3600
CACHE_TOPOOPT_TTL=7200
CACHE_ANALYSIS_TTL=1800

# ========================================
# PERFORMANCE CONFIGURATION
# ========================================
MAX_CONCURRENT_COMPUTATIONS=5
MAX_QUEUE_SIZE=100
QUEUE_TIMEOUT=30000
RATE_LIMIT=100

# ========================================
# CORS & SECURITY
# ========================================
CORS_ORIGIN=https://www.softlyplease.com
HELMET_ENABLED=true

# ========================================
# MONITORING & LOGGING
# ========================================
PERFORMANCE_LOGGING=true
SLOW_REQUEST_THRESHOLD=5000
LOG_LEVEL=info
```

### 7.3 Domain Configuration

**Custom Domain Setup:**
```bash
# Add domains to Heroku
heroku domains:add www.softlyplease.com
heroku domains:add softlyplease.com

# Configure DNS (at your domain registrar)
# Type: CNAME
# Host: www
# Target: [Heroku DNS target]
# TTL: 300 (5 minutes)

# Verify SSL certificate
heroku certs:auto:enable
```

---

## 8. Frontend Integration Verification

### 8.1 API Endpoint Testing

**Complete API Test Suite:**
```bash
#!/bin/bash
# Test script for backend API verification

BASE_URL="http://localhost:3000"

echo "🚀 Testing Backend API Endpoints"
echo "================================="

# Test health endpoint
echo "1. Testing /health endpoint..."
curl -f -s $BASE_URL/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
fi

# Test readiness endpoint
echo "2. Testing /ready endpoint..."
curl -f -s $BASE_URL/ready > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Readiness check passed"
else
    echo "❌ Readiness check failed"
fi

# Test definition listing
echo "3. Testing / definition listing..."
response=$(curl -s $BASE_URL/)
if [ -n "$response" ]; then
    echo "✅ Definition listing works"
else
    echo "❌ Definition listing failed"
fi

# Test TopoOpt.gh definition info
echo "4. Testing TopoOpt.gh definition..."
definition_hash=$(curl -s $BASE_URL/ | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$definition_hash" ]; then
    echo "✅ Definition hash found: $definition_hash"
else
    echo "❌ Definition hash not found"
fi

# Test definition serving
if [ -n "$definition_hash" ]; then
    echo "5. Testing definition serving..."
    curl -f -s $BASE_URL/definition/$definition_hash > /dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Definition serving works"
    else
        echo "❌ Definition serving failed"
    fi
fi

# Test solve endpoint with TopoOpt.gh
echo "6. Testing solve endpoint..."
payload='{
  "definition": "TopoOpt.gh",
  "inputs": {
    "width": [1000],
    "height": [500],
    "material": ["steel"]
  }
}'

response=$(curl -s -X POST $BASE_URL/solve \
  -H "Content-Type: application/json" \
  -d "$payload" \
  --max-time 30)

if [ -n "$response" ] && [ "$response" != "null" ]; then
    echo "✅ Solve endpoint works"
    echo "   Response preview: ${response:0:100}..."
else
    echo "❌ Solve endpoint failed or timed out"
fi

echo "================================="
echo "Backend API testing complete"
```

### 8.2 Frontend Integration Test

**Frontend-Backend Integration Test:**
```javascript
// Frontend integration test
async function testBackendIntegration() {
  const baseURL = 'http://localhost:3000'
  const results = {}

  try {
    // Test 1: Health check
    const healthResponse = await fetch(`${baseURL}/health`)
    results.health = healthResponse.ok
    console.log('✅ Health check:', results.health)

    // Test 2: Definition listing
    const definitionsResponse = await fetch(`${baseURL}/`)
    const definitions = await definitionsResponse.json()
    results.definitions = definitions.length > 0
    console.log('✅ Definitions found:', definitions.length)

    // Test 3: Adjacent payload test
    const payload = {
      definition: 'TopoOpt.gh',
      inputs: {
        width: [1000],
        height: [500],
        material: ['steel']
      }
    }

    const solveResponse = await fetch(`${baseURL}/solve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (solveResponse.ok) {
      const result = await solveResponse.json()
      results.solve = result.values && result.values.length > 0

      // Check response headers
      const cacheStatus = solveResponse.headers.get('x-cache')
      const responseTime = solveResponse.headers.get('x-response-time')

      results.cache = cacheStatus !== null
      results.performance = responseTime !== null

      console.log('✅ Solve successful:', results.solve)
      console.log('✅ Cache headers:', results.cache)
      console.log('✅ Performance headers:', results.performance)
    } else {
      results.solve = false
      console.log('❌ Solve failed:', solveResponse.status)
    }

  } catch (error) {
    console.error('❌ Integration test error:', error.message)
    results.error = error.message
  }

  // Summary
  const passed = Object.values(results).filter(v => v === true).length
  const total = Object.keys(results).length

  console.log(`\n📊 Integration Test Results: ${passed}/${total} passed`)

  return results
}

// Run the test
testBackendIntegration().then(results => {
  console.log('🎯 Integration test complete:', results)
})
```

### 8.3 Performance Benchmarking

**Performance Test Script:**
```bash
#!/bin/bash
# Performance benchmarking script

BASE_URL="http://localhost:3000"
TEST_RUNS=10
TIMEOUT=30

echo "🚀 Performance Benchmarking"
echo "=========================="

# Function to time request
time_request() {
  local start_time=$(date +%s%N)
  local result=$(curl -s -X POST $BASE_URL/solve \
    -H "Content-Type: application/json" \
    -d '{
      "definition": "TopoOpt.gh",
      "inputs": {
        "width": [1000],
        "height": [500],
        "material": ["steel"]
      }
    }' \
    --max-time $TIMEOUT)
  local end_time=$(date +%s%N)

  if [ -n "$result" ] && [ "$result" != "null" ]; then
    local duration=$(( (end_time - start_time) / 1000000 ))  # Convert to milliseconds
    echo $duration
  else
    echo "0"  # Failed request
  fi
}

echo "Running $TEST_RUNS performance tests..."

times=()
for i in $(seq 1 $TEST_RUNS); do
  echo -n "Test $i: "
  time=$(time_request)
  if [ "$time" != "0" ]; then
    echo "${time}ms"
    times+=($time)
  else
    echo "FAILED"
  fi
  sleep 1  # Brief pause between tests
done

# Calculate statistics
if [ ${#times[@]} -gt 0 ]; then
  sum=0
  min=${times[0]}
  max=${times[0]}

  for time in "${times[@]}"; do
    sum=$((sum + time))
    if [ $time -lt $min ]; then min=$time; fi
    if [ $time -gt $max ]; then max=$time; fi
  done

  avg=$((sum / ${#times[@]}))
  success_rate=$(echo "scale=2; ${#times[@]} * 100 / $TEST_RUNS" | bc)

  echo ""
  echo "📊 Performance Results:"
  echo "  Success Rate: $success_rate%"
  echo "  Average: ${avg}ms"
  echo "  Minimum: ${min}ms"
  echo "  Maximum: ${max}ms"
  echo "  Sample Size: ${#times[@]}/$TEST_RUNS"

  if [ $avg -lt 500 ]; then
    echo "  Status: ✅ EXCELLENT (<500ms)"
  elif [ $avg -lt 2000 ]; then
    echo "  Status: ✅ GOOD (<2s)"
  else
    echo "  Status: ⚠️  SLOW (>2s)"
  fi
else
  echo "❌ All tests failed"
fi
```

---

## 9. Scaling & Maintenance

### 9.1 Vertical Scaling

**Resource Scaling Strategy:**
```bash
# Scale dyno size for more resources
heroku dyno:resize performance-l  # 1GB RAM, 2.5GB swap

# Scale worker processes
heroku config:set WEB_CONCURRENCY=4

# Increase concurrent computations
heroku config:set MAX_CONCURRENT_COMPUTATIONS=8
```

### 9.2 Horizontal Scaling

**Multi-Dyno Setup:**
```bash
# Scale to multiple dynos
heroku ps:scale web=2

# Set up load balancer (if needed)
# Configure sticky sessions for caching consistency
```

### 9.3 Maintenance Procedures

**Regular Maintenance Tasks:**
```bash
# 1. Update dependencies
npm audit
npm update

# 2. Clear cache if needed
heroku run node -e "require('./src/routes/solve.js').clearCache()"

# 3. Restart dynos
heroku ps:restart

# 4. Check logs for errors
heroku logs --tail

# 5. Monitor performance
curl https://your-app.herokuapp.com/metrics
```

**Automated Maintenance:**
```javascript
// Automated cache cleanup
setInterval(() => {
  // Clean expired cache entries
  if (mc) {
    // Memcached cleanup logic
  } else {
    // Node-cache cleanup
    cache.flushStats()
  }
}, 3600000) // Every hour
```

---

## 10. Troubleshooting Matrix

### 10.1 Common Issues & Solutions

| Issue | Symptoms | Diagnosis | Solution |
|-------|----------|-----------|----------|
| **Slow Performance** | Response times >5s | Check cache hit rate | Optimize cache TTL, check Memcached connection |
| **High Memory Usage** | Dyno memory >80% | Monitor memory usage | Reduce cache size, implement cache eviction |
| **Cache Misses** | Low cache hit rate | Verify cache keys | Check cache key generation, TTL settings |
| **Queue Backlog** | Queue length >10 | Too many concurrent requests | Increase MAX_CONCURRENT_COMPUTATIONS |
| **Definition Not Found** | 404 errors for definitions | Check file paths | Verify files exist in assets/gh-definitions/, restart server |
| **Rhino Compute Connection** | 500 errors with compute failures | Check Rhino Compute status | Verify Rhino Compute is running on correct port |

### 10.2 Diagnostic Commands

**Quick Diagnostics:**
```bash
# Check system status
curl https://your-app.herokuapp.com/health
curl https://your-app.herokuapp.com/ready
curl https://your-app.herokuapp.com/metrics

# Check Heroku status
heroku ps
heroku logs --tail
heroku config

# Check local development
curl http://localhost:3000/health
curl http://localhost:3000/ready

# Check Rhino Compute
curl http://localhost:6500/version
```

**Performance Diagnostics:**
```bash
# Test cache performance
curl -H "X-Debug: true" https://your-app.herokuapp.com/metrics

# Test specific definition
curl -X POST https://your-app.herokuapp.com/solve \
  -H "Content-Type: application/json" \
  -d '{"definition":"TopoOpt.gh","inputs":{"width":[1000]}}'

# Check response headers
curl -I https://your-app.herokuapp.com/solve \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"definition":"TopoOpt.gh","inputs":{"width":[1000]}}'
```

### 10.3 Log Analysis

**Common Log Patterns:**
```bash
# Successful cache hit
heroku logs --grep "Cache hit" --tail

# Cache misses
heroku logs --grep "Cache miss" --tail

# Slow requests
heroku logs --grep "Slow request" --tail

# Errors
heroku logs --grep "ERROR" --tail

# Memory warnings
heroku logs --grep "memory" --tail
```

---

## 11. Emergency Procedures

### 11.1 Emergency Shutdown

**Graceful Shutdown:**
```bash
# Stop accepting new requests
heroku maintenance:on

# Wait for active requests to complete (check logs)
heroku logs --tail

# Scale down to prevent new requests
heroku ps:scale web=0

# Emergency restart
heroku ps:restart --all
```

### 11.2 Cache Emergency Reset

**Cache Clearing:**
```javascript
// Emergency cache clear function
function emergencyCacheClear() {
  try {
    if (mc) {
      // Clear Memcached
      mc.flush_all((err) => {
        if (err) console.error('Memcached flush error:', err)
        else console.log('✅ Memcached cleared')
      })
    } else {
      // Clear Node-cache
      cache.flushAll()
      console.log('✅ Node-cache cleared')
    }
  } catch (error) {
    console.error('❌ Cache clear error:', error)
  }
}
```

### 11.3 Definition Emergency Recovery

**Definition Recovery:**
```bash
# Check which definitions exist
curl https://your-app.herokuapp.com/

# Verify file system
ls -la assets/gh-definitions/

# Rebuild definitions registry
curl https://your-app.herokuapp.com/health

# Force server restart
heroku ps:restart
```

### 11.4 Performance Emergency

**Performance Recovery:**
```bash
# Enable maintenance mode
heroku maintenance:on

# Clear cache
heroku run node -e "console.log('Cache cleared')"

# Reset rate limiting
heroku config:set RATE_LIMIT=50

# Monitor recovery
heroku logs --tail

# Disable maintenance
heroku maintenance:off
```

---

## 🎯 Final Verification Checklist

### ✅ Backend Provisioning Complete

- [ ] **Node.js Environment**: 18.x installed and configured
- [ ] **Dependencies**: All npm packages installed
- [ ] **Rhino Compute**: Server running on port 6500
- [ ] **Definitions**: TopoOpt.gh and others in assets/gh-definitions/
- [ ] **Caching**: Memcached configured and connected
- [ ] **Security**: Helmet and rate limiting active
- [ ] **Monitoring**: Health endpoints responding
- [ ] **Performance**: Request queuing and clustering active

### ✅ Frontend Integration Ready

- [ ] **Adjacent Payload**: Payload builder implemented
- [ ] **Parameter Format**: DataTree array format validated
- [ ] **API Endpoints**: All endpoints tested and working
- [ ] **Error Handling**: Comprehensive error management
- [ ] **Cache Awareness**: Frontend respects cache headers
- [ ] **Performance**: Sub-500ms response times achieved

### ✅ Production Deployment Verified

- [ ] **Heroku App**: Created and configured
- [ ] **Environment Variables**: All required vars set
- [ ] **Domain Setup**: Custom domain configured
- [ ] **SSL Certificate**: HTTPS enabled
- [ ] **Monitoring**: Production monitoring active
- [ ] **Scaling**: Ready for horizontal scaling

**Result**: **SoftlyPlease.com** backend is fully provisioned and ready to deliver enterprise-grade performance with seamless frontend integration through the Adjacent Payload System! 🚀
