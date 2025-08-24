# Memcached Architecture Guide: Scaling Multiple Grasshopper Definitions

## 🚀 **The Complete Adjacent Payload & Caching Architecture**

This is the **most crucial guide** for understanding how Memcached enables a single Heroku app server to efficiently host multiple Grasshopper definitions through the **Adjacent Payload System**. Without this understanding, your architecture cannot scale.

---

## Table of Contents

### 1. Memcached Fundamentals for Grasshopper Compute
### 2. The Adjacent Payload System Deep Dive
### 3. Multi-Definition Architecture on Single Heroku Instance
### 4. Cache Key Strategy for Definition Management
### 5. Frontend Implementation: Adjacent Payload Construction
### 6. Performance Optimization with Memcached
### 7. Error Handling in Cached Multi-Definition Environment
### 8. Scaling Strategy: From Single to Multi-Definition
### 9. Production Deployment Architecture
### 10. Monitoring and Troubleshooting

---

## 1. Memcached Fundamentals for Grasshopper Compute

### 1.1 What is Memcached in This Context?

**Memcached is the memory-based distributed caching system that enables your Heroku app server to:**

- **Store computed results** from Grasshopper definitions
- **Cache definition metadata** (parameters, hashes, etc.)
- **Enable rapid retrieval** of frequently-used definitions
- **Support multiple definitions** on a single instance
- **Reduce Rhino Compute load** through intelligent caching

### 1.2 Why Memcached is Essential

**Without Memcached:**
```javascript
// Every request = Full computation cycle
User Request → Parse Definition → Build DataTrees → Call Rhino Compute → Wait for Result
// Takes 5-30 seconds per request
```

**With Memcached:**
```javascript
// First request = Computation, subsequent = Cache hit
User Request → Check Cache → Cache Hit! → Return Result
// Takes 50-200 milliseconds
```

### 1.3 Memcached Architecture in SoftlyPlease Compute

**Cache Layers:**
```
Frontend Request
    ↓
Memcached (Results Cache)
    ↓
Node.js App Server
    ↓
Rhino Compute (Heavy Computation)
```

**Cache Storage:**
- **Definition Metadata**: Parameter schemas, hash mappings
- **Computed Results**: Geometry outputs, analysis results
- **Definition Files**: Base64-encoded .gh content (temporary)
- **Session Data**: User preferences, configuration state

---

## 2. The Adjacent Payload System Deep Dive

### 2.1 What is the Adjacent Payload System?

**The Adjacent Payload System is the core mechanism** where:

1. **Grasshopper Definition** → Base64 encoded binary file
2. **Input Parameters** → DataTree structured data
3. **Combined Payload** → Definition + Inputs sent together
4. **Rhino Compute** → Processes the complete payload

### 2.2 Base64 Encoding Process (CRITICAL)

**How Definitions Become Payloads:**

```javascript
// Step 1: Read Grasshopper file as binary
const fs = require('fs')
const definitionBuffer = fs.readFileSync('src/files/TopoOpt.gh')

// Step 2: Convert to base64
const base64Definition = definitionBuffer.toString('base64')

// Step 3: This becomes part of the adjacent payload
// The base64 string is what gets "shoehorned" into the payload
```

**Why Base64?**
- **HTTP Compatibility**: Text-based protocols can't handle binary
- **Network Safety**: No special character encoding issues
- **Standard Format**: Universally supported by all systems
- **Rhino Compute Ready**: Can be decoded and loaded as .gh file

### 2.3 Payload Structure Breakdown

**Complete Adjacent Payload:**
```javascript
{
  "definition": "TopoOpt.gh",        // Definition identifier
  "inputs": {                        // Input parameters (DataTree format)
    "width": [1000],                // Array-wrapped values
    "height": [500],                // Array-wrapped values
    "material": ["steel"]           // Array-wrapped values
  },
  "cache": {                        // Cache control (optional)
    "ttl": 3600,                   // Time to live in seconds
    "key": "custom_cache_key"      // Custom cache identifier
  }
}
```

**What Gets Sent to Rhino Compute:**

```javascript
// The system constructs two parts:

// Part 1: Definition File (base64 encoded)
GET /definition/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
// Returns: Binary .gh file content (base64 decoded)

// Part 2: Input Parameters (DataTree structure)
const inputTrees = [
  new Grasshopper.DataTree("width").append([0], [1000]),
  new Grasshopper.DataTree("height").append([0], [500]),
  new Grasshopper.DataTree("material").append([0], ["steel"])
]

// Part 3: Combined Call
compute.Grasshopper.evaluateDefinition(definitionUrl, inputTrees, false)
```

### 2.4 The "Shoehorning" Process

**"Shoehorning" means:**
- **Definition file** is encoded into base64 to fit into text protocol
- **Binary data** is forced into the HTTP payload structure
- **File content** is "squeezed" into the request alongside parameters
- **Result**: Single payload containing both definition and inputs

**Frontend Developer Responsibility:**
```javascript
// You MUST understand: The definition becomes base64 in the payload
// You don't handle encoding, but you MUST format inputs correctly

const adjacentPayload = {
  definition: "TopoOpt.gh",        // References the base64-encoded file
  inputs: {
    width: [1000],                // Your parameters get shoehorned alongside
    height: [500],                // the encoded definition
    material: ["steel"]           // This is the "adjacent" part
  }
}
```

---

## 3. Multi-Definition Architecture on Single Heroku Instance

### 3.1 Heroku App Server Architecture

**Single Instance, Multiple Definitions:**
```
Heroku Dyno (Single Instance)
├── Node.js App Server (Port 3000)
│   ├── Definition Registry
│   │   ├── TopoOpt.gh → MD5 Hash: a1b2c3...
│   │   ├── BeamAnalysis.gh → MD5 Hash: b2c3d4...
│   │   └── StructureOpt.gh → MD5 Hash: c3d4e5...
│   ├── Memcached Client
│   │   ├── Results Cache
│   │   ├── Definition Metadata Cache
│   │   └── Session Cache
│   └── Route Handlers
│       ├── /solve (Main computation)
│       ├── /definition/:id (File serving)
│       └── /cache/stats (Monitoring)
└── Rhino Compute Connection (Port 6500)
```

### 3.2 Definition Storage Strategy

**File Organization:**
```
src/files/
├── TopoOpt.gh          // Topology Optimization
├── BeamAnalysis.gh     // Structural Analysis
├── StructureOpt.gh     // Advanced Optimization
└── MaterialTest.gh     // Material Testing
```

**Memory Organization:**
```javascript
// Definition Registry in Memory
const definitions = {
  "TopoOpt.gh": {
    id: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    path: "/app/src/files/TopoOpt.gh",
    parameters: ["width", "height", "material", "load"],
    cache: {
      hits: 1250,
      misses: 45,
      lastUsed: "2024-01-15T10:30:00Z"
    }
  },
  "BeamAnalysis.gh": {
    id: "b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7",
    path: "/app/src/files/BeamAnalysis.gh",
    parameters: ["length", "load", "material"],
    cache: {
      hits: 890,
      misses: 23,
      lastUsed: "2024-01-15T09:45:00Z"
    }
  }
}
```

### 3.3 Resource Allocation Strategy

**Memory Management:**
```javascript
// Memcached Configuration for Multiple Definitions
const memcachedConfig = {
  // Total memory allocation
  totalMemory: '64MB',              // Heroku dyno memory limit
  
  // Per-definition allocation
  definitionCache: '16MB',          // Metadata and schemas
  resultCache: '32MB',              // Computed results
  sessionCache: '8MB',              // User sessions
  tempCache: '8MB'                  // Temporary data
  
  // Cache expiration strategy
  defaultTTL: 3600,                 // 1 hour
  resultTTL: 7200,                  // 2 hours for results
  metadataTTL: 86400               // 24 hours for metadata
}
```

**File Serving Optimization:**
```javascript
// Efficient file serving for multiple definitions
app.get('/definition/:id', (req, res) => {
  const definition = definitions.find(d => d.id === req.params.id)
  
  if (!definition) {
    return res.status(404).json({ error: 'Definition not found' })
  }
  
  // Serve file with caching headers
  res.set({
    'Cache-Control': 'public, max-age=3600',
    'ETag': definition.id,
    'Last-Modified': definition.lastModified
  })
  
  res.sendFile(definition.path)
})
```

---

## 4. Cache Key Strategy for Definition Management

### 4.1 Cache Key Structure

**Multi-Definition Cache Keys:**
```javascript
// Cache key format: definition:input_hash:result_hash
const cacheKey = `${definitionName}:${inputHash}:${resultHash}`

// Examples:
"TopoOpt.gh:abc123def456:result789xyz000"     // Specific computation
"BeamAnalysis.gh:def456ghi789:result123abc111" // Different definition
"StructureOpt.gh:ghi789jkl012:result456def222" // Another definition
```

**Hash Generation:**
```javascript
function generateCacheKey(definitionName, inputs) {
  // Hash the inputs to create unique identifier
  const inputString = JSON.stringify(inputs)
  const inputHash = crypto.createHash('md5').update(inputString).digest('hex')
  
  // Include definition name for multi-definition support
  return `${definitionName}:${inputHash}`
}
```

### 4.2 Cache Organization by Definition

**Definition-Specific Cache Pools:**
```javascript
// Each definition gets its own cache pool
const cachePools = {
  "TopoOpt.gh": {
    pool: memcached.createClient({ poolSize: 5 }),
    stats: { hits: 0, misses: 0, evictions: 0 },
    memory: { used: 0, available: '8MB' }
  },
  "BeamAnalysis.gh": {
    pool: memcached.createClient({ poolSize: 3 }),
    stats: { hits: 0, misses: 0, evictions: 0 },
    memory: { used: 0, available: '6MB' }
  },
  "StructureOpt.gh": {
    pool: memcached.createClient({ poolSize: 4 }),
    stats: { hits: 0, misses: 0, evictions: 0 },
    memory: { used: 0, available: '7MB' }
  }
}
```

### 4.3 Cache Invalidation Strategy

**When to Invalidate Cache:**
```javascript
// Definition file changes
if (definitionFileModified) {
  await invalidateDefinitionCache(definitionName)
}

// Parameter schema changes
if (parameterSchemaChanged) {
  await invalidateParameterCache(definitionName)
}

// Memory pressure
if (memoryUsage > 90%) {
  await evictOldestEntries()
}
```

**Selective Invalidation:**
```javascript
async function invalidateDefinitionCache(definitionName) {
  // Invalidate all cache entries for this definition
  const pattern = `${definitionName}:*`
  const keys = await getKeysByPattern(pattern)
  
  for (const key of keys) {
    await memcached.del(key)
  }
  
  // Update cache statistics
  cacheStats[definitionName] = {
    hits: 0,
    misses: 0,
    lastInvalidation: new Date()
  }
}
```

---

## 5. Frontend Implementation: Adjacent Payload Construction

### 5.1 Understanding Your Role in the Adjacent Payload System

**Frontend Developer Responsibilities:**

1. **Payload Construction**: Build the correct payload structure
2. **Parameter Formatting**: Ensure DataTree compliance
3. **Cache Awareness**: Understand how caching affects your requests
4. **Error Handling**: Handle cache-related errors
5. **Performance**: Optimize for cache hit rates

### 5.2 Adjacent Payload Construction (CRITICAL)

**The Complete Payload Building Process:**

```javascript
class AdjacentPayloadBuilder {
  constructor(definitionName) {
    this.definitionName = definitionName
    this.cacheConfig = {
      ttl: 3600,
      useCache: true
    }
  }
  
  // Build the complete adjacent payload
  buildPayload(inputs) {
    // Validate input format (CRITICAL)
    this.validateInputs(inputs)
    
    // Format inputs for DataTree structure
    const formattedInputs = this.formatForDataTree(inputs)
    
    // Construct the adjacent payload
    const payload = {
      definition: this.definitionName,    // References base64-encoded file
      inputs: formattedInputs,           // Your parameters alongside definition
      cache: this.cacheConfig            // Cache control
    }
    
    return payload
  }
  
  // CRITICAL: Ensure DataTree compliance
  validateInputs(inputs) {
    for (const [key, value] of Object.entries(inputs)) {
      if (!Array.isArray(value)) {
        throw new Error(`Parameter ${key} must be an array, got: ${typeof value}`)
      }
      
      if (value.length === 0) {
        throw new Error(`Parameter ${key} cannot be empty`)
      }
    }
  }
  
  // Convert to DataTree format
  formatForDataTree(inputs) {
    const formatted = {}
    
    for (const [key, value] of Object.entries(inputs)) {
      // Ensure array format for DataTree
      formatted[key] = Array.isArray(value) ? value : [value]
    }
    
    return formatted
  }
}
```

### 5.3 Frontend Cache Integration

**Cache-Aware Request Handling:**

```javascript
class CacheAwareConfigurator {
  constructor(definitionName, apiService) {
    this.definitionName = definitionName
    this.apiService = apiService
    this.payloadBuilder = new AdjacentPayloadBuilder(definitionName)
    this.cache = new Map()  // Frontend cache
  }
  
  async compute(inputs) {
    // Build the adjacent payload
    const payload = this.payloadBuilder.buildPayload(inputs)
    
    // Generate cache key
    const cacheKey = this.generateCacheKey(payload)
    
    // Check frontend cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }
    
    try {
      // Send to backend (which will check Memcached)
      const result = await this.apiService.solve(payload)
      
      // Cache locally for future use
      this.cache.set(cacheKey, result)
      
      return result
      
    } catch (error) {
      // Handle cache-related errors
      this.handleCacheError(error)
      throw error
    }
  }
  
  generateCacheKey(payload) {
    // Create unique key for this computation
    const inputString = JSON.stringify(payload.inputs)
    const inputHash = btoa(inputString).slice(0, 16)
    return `${payload.definition}:${inputHash}`
  }
  
  handleCacheError(error) {
    if (error.message.includes('cache')) {
      console.warn('Cache error:', error.message)
      // Implement retry logic or fallback
    }
  }
}
```

### 5.4 Multi-Definition Frontend Architecture

**Managing Multiple Definitions:**

```javascript
class MultiDefinitionManager {
  constructor() {
    this.definitions = {
      'TopoOpt.gh': new CacheAwareConfigurator('TopoOpt.gh', apiService),
      'BeamAnalysis.gh': new CacheAwareConfigurator('BeamAnalysis.gh', apiService),
      'StructureOpt.gh': new CacheAwareConfigurator('StructureOpt.gh', apiService)
    }
    
    this.activeDefinition = null
    this.cacheStats = {}
  }
  
  // Switch between definitions
  setActiveDefinition(definitionName) {
    if (!this.definitions[definitionName]) {
      throw new Error(`Definition ${definitionName} not available`)
    }
    
    this.activeDefinition = this.definitions[definitionName]
    this.updateCacheStats(definitionName)
  }
  
  // Compute with active definition
  async compute(inputs) {
    if (!this.activeDefinition) {
      throw new Error('No active definition selected')
    }
    
    return await this.activeDefinition.compute(inputs)
  }
  
  // Get cache statistics
  getCacheStats() {
    const stats = {}
    
    for (const [name, config] of Object.entries(this.definitions)) {
      stats[name] = {
        cacheSize: config.cache.size,
        hitRate: this.calculateHitRate(name),
        memoryUsage: this.getMemoryUsage(name)
      }
    }
    
    return stats
  }
  
  calculateHitRate(definitionName) {
    const stats = this.cacheStats[definitionName] || { hits: 0, misses: 0 }
    const total = stats.hits + stats.misses
    return total > 0 ? (stats.hits / total) * 100 : 0
  }
}
```

---

## 6. Performance Optimization with Memcached

### 6.1 Cache Hit Rate Optimization

**Strategies for Maximum Cache Hits:**

```javascript
// 1. Smart Cache Key Generation
function generateSmartCacheKey(definitionName, inputs) {
  // Normalize inputs for better cache hits
  const normalizedInputs = normalizeInputs(inputs)
  const inputString = JSON.stringify(normalizedInputs)
  return `${definitionName}:${md5(inputString)}`
}

function normalizeInputs(inputs) {
  // Sort parameters, round numbers, normalize strings
  const normalized = {}
  
  for (const [key, value] of Object.entries(inputs)) {
    if (Array.isArray(value) && typeof value[0] === 'number') {
      // Round numbers to reduce cache misses
      normalized[key] = value.map(v => Math.round(v * 100) / 100)
    } else {
      normalized[key] = value
    }
  }
  
  return normalized
}

// 2. Cache Pre-warming
async function prewarmCache(definitionName, commonInputs) {
  const promises = commonInputs.map(inputs => 
    apiService.solve({ definition: definitionName, inputs })
  )
  
  await Promise.all(promises)
  console.log(`Pre-warmed cache for ${definitionName}`)
}

// 3. Intelligent Cache Expiration
function getOptimalTTL(definitionName, inputs) {
  // Frequently used definitions get longer TTL
  const usageFrequency = getUsageFrequency(definitionName)
  
  // Complex computations get longer cache time
  const complexity = estimateComplexity(inputs)
  
  return usageFrequency * complexity * 3600  // Base TTL in seconds
}
```

### 6.2 Memory Management

**Efficient Memory Usage:**

```javascript
// Memory-aware caching
class MemoryAwareCache {
  constructor(maxMemory = '32MB') {
    this.maxMemory = this.parseMemory(maxMemory)
    this.currentMemory = 0
    this.cache = new Map()
    this.accessOrder = []
  }
  
  set(key, value, size = null) {
    // Estimate object size if not provided
    const objectSize = size || this.estimateSize(value)
    
    // Check if we need to evict
    if (this.currentMemory + objectSize > this.maxMemory) {
      this.evictToFit(objectSize)
    }
    
    // Store with size metadata
    this.cache.set(key, {
      value,
      size: objectSize,
      lastAccess: Date.now()
    })
    
    this.currentMemory += objectSize
    this.updateAccessOrder(key)
  }
  
  get(key) {
    const entry = this.cache.get(key)
    if (entry) {
      entry.lastAccess = Date.now()
      this.updateAccessOrder(key)
      return entry.value
    }
    return null
  }
  
  evictToFit(requiredSize) {
    // Evict least recently used items
    while (this.currentMemory + requiredSize > this.maxMemory && this.accessOrder.length > 0) {
      const lruKey = this.accessOrder.shift()
      const entry = this.cache.get(lruKey)
      
      if (entry) {
        this.currentMemory -= entry.size
        this.cache.delete(lruKey)
      }
    }
  }
  
  estimateSize(obj) {
    // Rough estimation of object size in bytes
    const str = JSON.stringify(obj)
    return str.length * 2  // 2 bytes per character
  }
}
```

### 6.3 Cache Partitioning Strategy

**Partition Cache by Definition:**

```javascript
// Each definition gets its own cache partition
const cachePartitions = {
  "TopoOpt.gh": {
    cache: new MemoryAwareCache('8MB'),
    priority: 'high',
    evictionPolicy: 'lru'
  },
  "BeamAnalysis.gh": {
    cache: new MemoryAwareCache('6MB'),
    priority: 'medium',
    evictionPolicy: 'lru'
  },
  "StructureOpt.gh": {
    cache: new MemoryAwareCache('7MB'),
    priority: 'low',
    evictionPolicy: 'fifo'
  }
}

// Smart cache routing
async function getFromPartitionedCache(definitionName, key) {
  const partition = cachePartitions[definitionName]
  
  if (!partition) {
    throw new Error(`No cache partition for ${definitionName}`)
  }
  
  let result = partition.cache.get(key)
  
  if (!result) {
    // Cache miss - fetch from backend
    result = await fetchFromBackend(definitionName, key)
    
    // Store in appropriate partition
    partition.cache.set(key, result)
  }
  
  return result
}
```

---

## 7. Error Handling in Cached Multi-Definition Environment

### 7.1 Cache-Related Error Handling

**Comprehensive Error Management:**

```javascript
class CacheErrorHandler {
  constructor(memcachedClient) {
    this.memcached = memcachedClient
    this.errorStats = {}
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000
    }
  }
  
  // Handle cache connection errors
  async handleConnectionError(operation, ...args) {
    let lastError
    
    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await this.memcached[operation](...args)
      } catch (error) {
        lastError = error
        
        if (this.isConnectionError(error)) {
          const delay = this.calculateBackoffDelay(attempt)
          await this.delay(delay)
          continue
        } else {
          // Non-connection error, don't retry
          throw error
        }
      }
    }
    
    throw lastError
  }
  
  // Handle cache miss scenarios
  async handleCacheMiss(definitionName, inputs, originalError) {
    console.warn(`Cache miss for ${definitionName}:`, originalError.message)
    
    // Log cache miss for monitoring
    this.recordCacheMiss(definitionName)
    
    // Attempt to compute directly
    try {
      return await this.computeWithoutCache(definitionName, inputs)
    } catch (computeError) {
      throw new Error(`Both cache and computation failed: ${originalError.message} | ${computeError.message}`)
    }
  }
  
  // Handle memory pressure
  handleMemoryPressure() {
    console.warn('Memory pressure detected, implementing emergency measures')
    
    // Clear less critical cache entries
    this.evictLowPriorityEntries()
    
    // Notify monitoring system
    this.sendMemoryAlert()
  }
  
  // Definition-specific error handling
  handleDefinitionError(definitionName, error) {
    const errorType = this.classifyError(error)
    
    switch (errorType) {
      case 'definition_not_found':
        throw new Error(`Definition ${definitionName} not found on server`)
      
      case 'parameter_error':
        throw new Error(`Invalid parameters for ${definitionName}: ${error.message}`)
      
      case 'computation_error':
        throw new Error(`Computation failed for ${definitionName}: ${error.message}`)
      
      default:
        throw new Error(`Unknown error for ${definitionName}: ${error.message}`)
    }
  }
}
```

### 7.2 Graceful Degradation

**Fallback Strategies:**

```javascript
// Fallback when cache is unavailable
async function solveWithFallback(definitionName, inputs) {
  try {
    // Primary: Cached computation
    return await solveWithCache(definitionName, inputs)
  } catch (cacheError) {
    console.warn('Cache unavailable, falling back to direct computation')
    
    try {
      // Secondary: Direct computation
      return await solveDirect(definitionName, inputs)
    } catch (computeError) {
      console.error('Both cache and computation failed')
      
      // Tertiary: Return cached result if available
      const cachedResult = getStaleCache(definitionName, inputs)
      if (cachedResult) {
        console.warn('Returning stale cached result')
        return cachedResult
      }
      
      // Final: Error
      throw new Error('All computation methods failed')
    }
  }
}

// Stale cache retrieval
function getStaleCache(definitionName, inputs) {
  const cacheKey = generateCacheKey(definitionName, inputs)
  const staleKey = `stale:${cacheKey}`
  
  return memcached.get(staleKey)
}
```

---

## 8. Scaling Strategy: From Single to Multi-Definition

### 8.1 Vertical Scaling (Single Instance)

**Optimize Single Heroku Dyno:**

```javascript
// Configuration for single dyno with multiple definitions
const singleDynoConfig = {
  // Memory allocation
  memory: {
    total: '512MB',
    memcached: '64MB',
    node: '384MB',
    rhino: '64MB'
  },
  
  // Definition limits
  maxDefinitions: 10,
  maxConcurrentComputations: 5,
  
  // Cache strategy
  cacheStrategy: 'aggressive',
  evictionPolicy: 'smart_lru',
  
  // Monitoring
  monitoring: {
    cacheHitRate: true,
    memoryUsage: true,
    responseTime: true,
    errorRate: true
  }
}
```

### 8.2 Horizontal Scaling Preparation

**Ready for Multiple Dynos:**

```javascript
// Shared cache configuration for horizontal scaling
const sharedCacheConfig = {
  // Redis/Memcached cluster configuration
  cacheCluster: {
    nodes: ['cache1.herokuapp.com', 'cache2.herokuapp.com'],
    replication: true,
    failover: true
  },
  
  // Definition distribution
  definitionSharding: {
    strategy: 'consistent_hashing',
    virtualNodes: 100,
    shardMap: {
      'TopoOpt.gh': 'shard1',
      'BeamAnalysis.gh': 'shard2',
      'StructureOpt.gh': 'shard1'
    }
  },
  
  // Load balancing
  loadBalancer: {
    algorithm: 'least_connections',
    healthChecks: '/health',
    sessionAffinity: false
  }
}
```

### 8.3 Definition Prioritization

**Smart Resource Allocation:**

```javascript
// Prioritize definitions based on usage
const definitionPriority = {
  "TopoOpt.gh": {
    priority: 'critical',
    memory: '16MB',
    concurrent: 3,
    cacheTTL: 7200
  },
  "BeamAnalysis.gh": {
    priority: 'high',
    memory: '12MB',
    concurrent: 2,
    cacheTTL: 3600
  },
  "StructureOpt.gh": {
    priority: 'medium',
    memory: '8MB',
    concurrent: 1,
    cacheTTL: 1800
  }
}

// Dynamic resource allocation
function allocateResources(definitionName) {
  const config = definitionPriority[definitionName]
  
  if (!config) {
    return getDefaultAllocation()
  }
  
  return {
    memory: config.memory,
    concurrent: config.concurrent,
    cacheTTL: config.cacheTTL,
    evictionPriority: config.priority
  }
}
```

---

## 9. Production Deployment Architecture

### 9.1 Heroku Production Setup

**Complete Heroku Configuration:**

```yaml
# heroku.yml
build:
  docker:
    web: Dockerfile

run:
  web: npm start

# Environment Variables
RHINO_COMPUTE_URL: https://rhino-compute.herokuapp.com
RHINO_COMPUTE_KEY: your_api_key
MEMCACHED_URL: redis://your-redis-instance
NODE_ENV: production
CACHE_SIZE: 64MB
MAX_DEFINITIONS: 10
```

**Dockerfile for Production:**
```dockerfile
FROM node:16-alpine

# Install dependencies
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Build for production
RUN npm run build

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]
```

### 9.2 Cache Persistence Strategy

**Production Cache Management:**

```javascript
// Cache persistence for production
class PersistentCache {
  constructor(memcachedClient, redisClient) {
    this.memcached = memcachedClient  // Fast, volatile
    this.redis = redisClient          // Persistent, slower
    this.syncInterval = 300000        // 5 minutes
  }
  
  async set(key, value, ttl = 3600) {
    // Set in both caches
    await Promise.all([
      this.memcached.set(key, value, ttl),
      this.redis.set(key, JSON.stringify(value), 'EX', ttl)
    ])
  }
  
  async get(key) {
    // Try memcached first (faster)
    let result = await this.memcached.get(key)
    
    if (!result) {
      // Fallback to Redis
      const redisResult = await this.redis.get(key)
      if (redisResult) {
        result = JSON.parse(redisResult)
        
        // Restore to memcached
        await this.memcached.set(key, result, 3600)
      }
    }
    
    return result
  }
  
  // Periodic synchronization
  startSync() {
    setInterval(async () => {
      await this.syncCaches()
    }, this.syncInterval)
  }
  
  async syncCaches() {
    // Sync important data between caches
    const criticalKeys = await this.getCriticalKeys()
    
    for (const key of criticalKeys) {
      const memcachedValue = await this.memcached.get(key)
      const redisValue = await this.redis.get(key)
      
      if (memcachedValue && !redisValue) {
        await this.redis.set(key, JSON.stringify(memcachedValue))
      } else if (!memcachedValue && redisValue) {
        await this.memcached.set(key, JSON.parse(redisValue))
      }
    }
  }
}
```

---

## 10. Monitoring and Troubleshooting

### 10.1 Cache Performance Monitoring

**Comprehensive Monitoring:**

```javascript
// Cache monitoring system
class CacheMonitor {
  constructor(memcachedClient) {
    this.memcached = memcachedClient
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      memory: 0,
      connections: 0
    }
    
    this.alerts = {
      lowHitRate: 80,      // Alert if hit rate below 80%
      highMemory: 90,      // Alert if memory usage above 90%
      highEvictions: 100   // Alert if more than 100 evictions per minute
    }
  }
  
  // Collect cache statistics
  async collectStats() {
    try {
      const stats = await this.memcached.stats()
      
      this.stats = {
        hits: stats.hits,
        misses: stats.misses,
        evictions: stats.evictions,
        memory: stats.bytes,
        connections: stats.connections
      }
      
      this.checkAlerts()
      this.reportMetrics()
      
    } catch (error) {
      console.error('Failed to collect cache stats:', error)
    }
  }
  
  // Check for alert conditions
  checkAlerts() {
    const hitRate = this.calculateHitRate()
    
    if (hitRate < this.alerts.lowHitRate) {
      this.sendAlert('Low cache hit rate', `Hit rate: ${hitRate}%`)
    }
    
    if (this.stats.memory > this.alerts.highMemory) {
      this.sendAlert('High memory usage', `Memory: ${this.stats.memory}%`)
    }
    
    if (this.stats.evictions > this.alerts.highEvictions) {
      this.sendAlert('High eviction rate', `Evictions: ${this.stats.evictions}`)
    }
  }
  
  // Calculate cache hit rate
  calculateHitRate() {
    const total = this.stats.hits + this.stats.misses
    return total > 0 ? (this.stats.hits / total) * 100 : 0
  }
  
  // Send alert to monitoring system
  sendAlert(title, message) {
    // Implement your alerting mechanism
    console.error(`CACHE ALERT: ${title} - ${message}`)
    
    // Send to monitoring service
    // sendToMonitoringService({ title, message, stats: this.stats })
  }
  
  // Report metrics to monitoring system
  reportMetrics() {
    const metrics = {
      cacheHitRate: this.calculateHitRate(),
      cacheMemoryUsage: this.stats.memory,
      cacheEvictions: this.stats.evictions,
      cacheConnections: this.stats.connections,
      timestamp: new Date().toISOString()
    }
    
    // Send to metrics collection system
    // reportMetrics(metrics)
  }
}
```

### 10.2 Troubleshooting Common Issues

**Cache Troubleshooting Guide:**

```javascript
// Troubleshooting utilities
class CacheTroubleshooter {
  constructor(memcachedClient, definitions) {
    this.memcached = memcachedClient
    this.definitions = definitions
  }
  
  // Diagnose cache issues
  async diagnoseCacheIssues() {
    const issues = []
    
    // Check cache connectivity
    try {
      await this.memcached.set('test', 'test', 1)
      const testResult = await this.memcached.get('test')
      if (testResult !== 'test') {
        issues.push('Cache connectivity issue')
      }
    } catch (error) {
      issues.push(`Cache connection failed: ${error.message}`)
    }
    
    // Check memory usage
    const stats = await this.memcached.stats()
    if (stats.bytes > 0.9 * stats.limit_maxbytes) {
      issues.push('Memory usage above 90%')
    }
    
    // Check definition cache health
    for (const definition of this.definitions) {
      const cacheKey = `health:${definition.name}`
      const health = await this.memcached.get(cacheKey)
      
      if (!health) {
        issues.push(`No cache health data for ${definition.name}`)
      }
    }
    
    return issues
  }
  
  // Clear problematic cache entries
  async clearProblematicEntries() {
    // Clear expired entries
    await this.memcached.flush_all()
    
    // Rebuild essential cache entries
    await this.rebuildEssentialCache()
  }
  
  // Rebuild essential cache
  async rebuildEssentialCache() {
    for (const definition of this.definitions) {
      // Cache definition metadata
      await this.memcached.set(
        `definition:${definition.name}`,
        definition,
        86400  // 24 hours
      )
      
      // Cache parameter schema
      if (definition.parameters) {
        await this.memcached.set(
          `schema:${definition.name}`,
          definition.parameters,
          86400
        )
      }
    }
  }
}
```

---

## 🚀 **Frontend Developer Implementation Guide**

### Complete Adjacent Payload Setup

**1. Install Dependencies:**
```bash
npm install memcached lodash
```

**2. Create Adjacent Payload Builder:**
```javascript
// AdjacentPayloadBuilder.js
export class AdjacentPayloadBuilder {
  constructor(definitionName) {
    this.definitionName = definitionName
    this.memcached = new memcached.Client('localhost:11211')
  }
  
  buildAdjacentPayload(inputs) {
    // CRITICAL: Validate and format inputs
    const validatedInputs = this.validateAndFormatInputs(inputs)
    
    return {
      definition: this.definitionName,    // References base64-encoded file
      inputs: validatedInputs,           // Your parameters alongside definition
      cache: {
        ttl: 3600,                      // Cache for 1 hour
        useCache: true                  // Enable caching
      }
    }
  }
  
  validateAndFormatInputs(inputs) {
    const formatted = {}
    
    for (const [key, value] of Object.entries(inputs)) {
      if (!Array.isArray(value)) {
        throw new Error(`Parameter ${key} must be an array for DataTree`)
      }
      
      if (value.length === 0) {
        throw new Error(`Parameter ${key} cannot be empty array`)
      }
      
      formatted[key] = value  // Already in correct format
    }
    
    return formatted
  }
  
  async checkCache(payload) {
    const cacheKey = this.generateCacheKey(payload)
    return await this.memcached.get(cacheKey)
  }
  
  generateCacheKey(payload) {
    const inputString = JSON.stringify(payload.inputs)
    const inputHash = btoa(inputString).slice(0, 16)
    return `${payload.definition}:${inputHash}`
  }
}
```

**3. Create Cache-Aware API Service:**
```javascript
// CacheAwareAPIService.js
export class CacheAwareAPIService {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL
    this.payloadBuilder = new AdjacentPayloadBuilder()
  }
  
  async solve(definitionName, inputs) {
    // Build the adjacent payload
    const payload = this.payloadBuilder.buildAdjacentPayload(inputs)
    
    // Check cache first
    const cachedResult = await this.payloadBuilder.checkCache(payload)
    if (cachedResult) {
      console.log('Cache hit!')
      return JSON.parse(cachedResult)
    }
    
    // Cache miss - compute
    const response = await fetch(`${this.baseURL}/solve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message)
    }
    
    const result = await response.json()
    
    // Cache the result
    await this.cacheResult(payload, result)
    
    return result
  }
  
  async cacheResult(payload, result) {
    const cacheKey = this.payloadBuilder.generateCacheKey(payload)
    await this.payloadBuilder.memcached.set(
      cacheKey,
      JSON.stringify(result),
      3600  // 1 hour TTL
    )
  }
}
```

**4. Use in Your Configurator:**
```javascript
// TopoOptConfigurator.js
import { CacheAwareAPIService } from './CacheAwareAPIService'

class TopoOptConfigurator {
  constructor() {
    this.apiService = new CacheAwareAPIService()
    this.definitionName = 'TopoOpt.gh'
  }
  
  async compute(parameters) {
    // Parameters are already in correct format
    const inputs = {
      width: [parameters.width],
      height: [parameters.height],
      material: [parameters.material],
      load: [parameters.load]
    }
    
    try {
      const result = await this.apiService.solve(this.definitionName, inputs)
      return result.values  // Return computed values
    } catch (error) {
      console.error('Computation failed:', error.message)
      throw error
    }
  }
}

// Usage in your component
const configurator = new TopoOptConfigurator()

// This will automatically handle:
// 1. Adjacent payload construction
// 2. Cache checking
// 3. Base64 definition handling
// 4. DataTree parameter formatting
const results = await configurator.compute({
  width: 1000,
  height: 500,
  material: 'steel',
  load: 5000
})
```

---

## 🎯 **Key Takeaways for Frontend Developers**

1. **You don't handle base64 encoding** - the backend does that automatically
2. **You MUST format parameters as arrays** for DataTree structure
3. **The "adjacent payload" means** your parameters travel alongside the encoded definition
4. **Cache awareness** will dramatically improve performance
5. **Error handling** is crucial for cache-related issues
6. **Memory management** affects how many definitions can run simultaneously

This architecture enables your single Heroku app server to efficiently host multiple Grasshopper definitions while maintaining excellent performance through intelligent Memcached usage and the Adjacent Payload System.

**The Adjacent Payload System is the key innovation** that allows binary Grasshopper files to be "shoehorned" through text-based protocols while maintaining full computational integrity.
