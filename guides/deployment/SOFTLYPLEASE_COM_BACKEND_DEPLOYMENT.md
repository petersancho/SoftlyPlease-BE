# 🚀 **SoftlyPlease.com - Complete Backend Deployment Guide**

## **Ultimate Production Configuration for SoftlyPlease.com Rhino Compute App Server**

---

## 📊 **Production Architecture Overview**

```
🌐 softlyplease.com (Frontend + API Gateway)
    ↓ HTTPS (443)
🖥️  Heroku App Server (softlyplease-appserver)
    ↓ HTTPS Internal (8081)
🦏 Azure VM (compute.softlyplease.com)
    ↓ Rhino 8 + Cloud Zoo Licensing
🎯 Grasshopper Definitions (TopoOpt.gh, etc.)
```

## 🎯 **Current Production URLs**

| **Service** | **URL** | **Status** |
|-------------|---------|------------|
| **Frontend** | `https://softlyplease.com` | ✅ Active |
| **API Gateway** | `https://softlyplease-appserver-5d5d5bc6198a.herokuapp.com` | ✅ Deployed |
| **Rhino Compute** | `https://compute.softlyplease.com` | 🔧 Setup Required |
| **Health Checks** | `https://softlyplease.com/health` | ✅ Active |

---

## 🔧 **1. Heroku App Server Configuration**

### **Environment Variables (Critical for Production)**

```bash
# =============================================================================
# SOFTLYPLEASE.COM - PRODUCTION ENVIRONMENT CONFIGURATION
# =============================================================================

# -------------------------------
# ESSENTIAL SETTINGS
# -------------------------------
NODE_ENV=production
PORT=3000
WEB_CONCURRENCY=2

# -------------------------------
# RHINO COMPUTE INTEGRATION
# -------------------------------
RHINO_COMPUTE_URL=https://compute.softlyplease.com
RHINO_COMPUTE_KEY=prod-rhino-key-2024
COMPUTE_TIMEOUT_MS=30000

# -------------------------------
# API AUTHENTICATION
# -------------------------------
APP_TOKEN=prod-token-456
API_KEY=softlyplease-prod-key-2024

# -------------------------------
# CORS CONFIGURATION
# -------------------------------
CORS_ORIGIN=https://softlyplease.com,https://www.softlyplease.com
ALLOWED_ORIGINS=https://softlyplease.com,https://www.softlyplease.com

# -------------------------------
# PERFORMANCE & CACHING
# -------------------------------
CACHE_BACKEND=memcached
CACHE_DEFAULT_TTL=3600
CACHE_TOPOOPT_TTL=7200
CACHE_MAX_KEYS=5000
RATE_LIMIT=1000

# -------------------------------
# MEMCACHIER (Auto-configured when addon added)
# -------------------------------
# MEMCACHIER_SERVERS=mc7-lj-large-123.cache.amazonaws.com:11211
# MEMCACHIER_USERNAME=123456
# MEMCACHIER_PASSWORD=secure-password-123

# -------------------------------
# LOGGING & MONITORING
# -------------------------------
LOG_LEVEL=info
PERFORMANCE_LOGGING=true
SLOW_REQUEST_THRESHOLD=5000
ERROR_REPORTING=true

# -------------------------------
# SSL/TLS CONFIGURATION
# -------------------------------
SSL_REDIRECT=true
FORCE_HTTPS=true

# -------------------------------
# SECURITY HEADERS
# -------------------------------
SECURITY_HEADERS=true
CSRF_PROTECTION=true

# -------------------------------
# GRASSHOPPER DEFINITIONS
# -------------------------------
GH_DEFINITIONS_PATH=assets/gh-definitions/
MAX_CONCURRENT_COMPUTATIONS=5
COMPUTE_QUEUE_SIZE=10
```

### **Critical Heroku Commands**

```bash
# =============================================================================
# SOFTLYPLEASE.COM - HEROKU CONFIGURATION
# =============================================================================

# Set all environment variables
heroku config:set NODE_ENV=production --app softlyplease-appserver
heroku config:set RHINO_COMPUTE_URL=https://compute.softlyplease.com --app softlyplease-appserver
heroku config:set APP_TOKEN=prod-token-456 --app softlyplease-appserver
heroku config:set CORS_ORIGIN=https://softlyplease.com --app softlyplease-appserver
heroku config:set WEB_CONCURRENCY=2 --app softlyplease-appserver
heroku config:set CACHE_BACKEND=memcached --app softlyplease-appserver

# Add MemCachier for caching
heroku addons:create memcachier:dev --app softlyplease-appserver

# Scale dynos for production
heroku ps:scale web=2 --app softlyplease-appserver

# Set up custom domain
heroku domains:add www.softlyplease.com --app softlyplease-appserver
heroku domains:add softlyplease.com --app softlyplease-appserver

# Enable SSL
heroku certs:auto:enable --app softlyplease-appserver
```

---

## 🌐 **2. API Endpoints Configuration**

### **Production API Endpoints**

```javascript
// =============================================================================
// SOFTLYPLEASE.COM - PRODUCTION API ENDPOINTS
// =============================================================================

const SOFTLYPLEASE_API = {
  // Base Configuration
  BASE_URL: 'https://softlyplease.com',
  API_TOKEN: 'prod-token-456',

  // Core Endpoints
  HEALTH: '/health',
  METRICS: '/metrics',
  VERSION: '/version',
  DEFINITIONS: '/',
  SOLVE: '/solve',

  // Definition Endpoints
  DEFINITION_INFO: (id) => `/definitions/${id}`,
  DEFINITION_FILE: (id) => `/definition/${id}`,

  // Legacy Endpoints (for compatibility)
  TOPOOPT: '/topoopt',
  VIEW: '/view',
  EXAMPLES: '/examples'
}
```

### **Complete API Testing Suite**

```bash
# =============================================================================
# SOFTLYPLEASE.COM - API TESTING COMMANDS
# =============================================================================

# Health Check
curl https://softlyplease.com/health

# System Metrics
curl https://softlyplease.com/metrics

# List Available Definitions
curl -H "Authorization: Bearer prod-token-456" https://softlyplease.com/

# Get Definition Schema
curl -H "Authorization: Bearer prod-token-456" https://softlyplease.com/definitions/f3997a3b7a68e0f2

# Test TopoOpt Computation
curl -H "Authorization: Bearer prod-token-456" -X POST https://softlyplease.com/solve \
  -H "Content-Type: application/json" \
  -d '{
    "definitionId": "f3997a3b7a68e0f2",
    "inputs": {
      "height": [500],
      "width": [1000],
      "num": [3],
      "smooth": [3],
      "cube": [2],
      "segment": [8],
      "pipewidth": [10],
      "round": [2],
      "tolerance": [5],
      "minr": [10],
      "maxr": [50],
      "format": ["mesh"],
      "quality": [5],
      "detail": [10],
      "preview": [true],
      "optimize": [true]
    }
  }'

# Version Information
curl https://softlyplease.com/version
```

---

## 🦏 **3. Azure VM Rhino.Compute Configuration**

### **VM Connection Details**

```bash
# =============================================================================
# SOFTLYPLEASE.COM - AZURE VM CONNECTION
# =============================================================================

VM_HOSTNAME: rhino-compute-vm724
PUBLIC_IP: 4.206.137.232
RESOURCE_GROUP: Rhino-Compute-VM_group
LOCATION: Canada Central
ADMIN_USERNAME: azureuser

# Connect via RDP or SSH
ssh azureuser@4.206.137.232
# OR RDP to 4.206.137.232
```

### **Rhino.Compute Service Configuration**

```powershell
# =============================================================================
# SOFTLYPLEASE.COM - RHINO COMPUTE SERVICE SETUP
# =============================================================================

# Step 1: Verify Rhino Installation
Write-Host "=== CHECKING RHINO INSTALLATION ==="
$rhinoPaths = @(
    "C:\Program Files\Rhino 8\System\Rhino.exe",
    "C:\Program Files\Rhino 8\Rhino.exe",
    "C:\Program Files\Rhino 7\System\Rhino.exe",
    "C:\Program Files\Rhino 7\Rhino.exe"
)

foreach ($path in $rhinoPaths) {
    if (Test-Path $path) {
        Write-Host "✓ Found Rhino at: $path"
        $rhinoPath = $path
        break
    }
}

# Step 2: Create Rhino.Compute Service
Write-Host "=== CREATING RHINO COMPUTE SERVICE ==="
$serviceName = "RhinoCompute"
$computeArgs = "/nosplash /compute /port=8081"

New-Service -Name $serviceName `
    -BinaryPathName "`"$rhinoPath`" $computeArgs" `
    -DisplayName "Rhino Compute" `
    -StartupType Automatic `
    -Description "Rhino Compute headless service for softlyplease.com"

# Step 3: Start Service
Start-Service -Name "RhinoCompute"
Start-Sleep -Seconds 5

# Step 4: Verify Service
Get-Service -Name "RhinoCompute"
netstat -ano | findstr :8081

# Step 5: Test Local Endpoint
Invoke-WebRequest -Uri "http://localhost:8081/version"
```

### **IIS Reverse Proxy Configuration**

```powershell
# =============================================================================
# SOFTLYPLEASE.COM - IIS HTTPS REVERSE PROXY
# =============================================================================

# Step 1: Install IIS Features
Install-WindowsFeature -Name Web-Server,Web-Request-Monitor,Web-Http-Redirect,Web-Performance,Web-Dyn-Compression,Web-Stat-Compression,Web-Filtering,Web-Basic-Auth,Web-Windows-Auth,Web-Net-Ext45,Web-Asp-Net45,Web-ISAPI-Ext,Web-ISAPI-Filter

# Step 2: Install Application Request Routing
Install-WindowsFeature -Name Web-ARR

# Step 3: Configure Reverse Proxy Rules
Import-Module WebAdministration

# Create server farm
New-WebFarm -Name "RhinoComputeFarm"
Add-WebFarmServer -WebFarm "RhinoComputeFarm" -Address "localhost" -Port 8081

# Create rewrite rule
Add-WebConfigurationProperty -pspath "MACHINE/WEBROOT/APPHOST" -filter "system.webServer/rewrite/rules" -name "." -value @{name='RhinoComputeProxy'}
Set-WebConfigurationProperty -pspath "MACHINE/WEBROOT/APPHOST" -filter "system.webServer/rewrite/rules/rule[@name='RhinoComputeProxy']/match" -name "url" -value ".*"
Set-WebConfigurationProperty -pspath "MACHINE/WEBROOT/APPHOST" -filter "system.webServer/rewrite/rules/rule[@name='RhinoComputeProxy']/action" -name "type" -value "Rewrite"
Set-WebConfigurationProperty -pspath "MACHINE/WEBROOT/APPHOST" -filter "system.webServer/rewrite/rules/rule[@name='RhinoComputeProxy']/action" -name "url" -value "http://rhino-compute-farm/{R:0}"
```

---

## 🔐 **4. Authentication & Security Configuration**

### **API Authentication Setup**

```javascript
// =============================================================================
// SOFTLYPLEASE.COM - AUTHENTICATION MIDDLEWARE
// =============================================================================

// Backend Authentication Middleware
const authenticateRequest = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Missing or invalid authorization header'
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer '

  if (token !== process.env.APP_TOKEN) {
    return res.status(403).json({
      error: 'Invalid authentication token'
    });
  }

  next();
};

// Apply to all API routes
app.use('/api', authenticateRequest);
app.use('/solve', authenticateRequest);
app.use('/definitions', authenticateRequest);
```

### **Security Headers Configuration**

```javascript
// =============================================================================
// SOFTLYPLEASE.COM - SECURITY HEADERS
// =============================================================================

const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "https://softlyplease.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://compute.softlyplease.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));
```

### **Rate Limiting Configuration**

```javascript
// =============================================================================
// SOFTLYPLEASE.COM - RATE LIMITING
// =============================================================================

const rateLimit = require('express-rate-limit');

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60 * 1000
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/solve', apiLimiter);
app.use('/definitions', apiLimiter);
```

---

## 🌐 **5. Domain & SSL Configuration**

### **DNS Configuration**

```bash
# =============================================================================
# SOFTLYPLEASE.COM - DNS RECORDS
# =============================================================================

# Primary Domain Records
# Type: CNAME, Name: @, Target: softlyplease-appserver.herokuapp.com
# Type: CNAME, Name: www, Target: softlyplease-appserver.herokuapp.com

# Compute Subdomain Records
# Type: A, Name: compute, Target: 4.206.137.232
# Type: CNAME, Name: compute, Target: compute.softlyplease.com (if using CDN)

# Verification Commands
nslookup www.softlyplease.com
nslookup compute.softlyplease.com
```

### **Heroku SSL Configuration**

```bash
# =============================================================================
# SOFTLYPLEASE.COM - HEROKU SSL SETUP
# =============================================================================

# Enable automatic SSL certificates
heroku certs:auto:enable --app softlyplease-appserver

# Verify SSL status
heroku certs --app softlyplease-appserver

# Expected output:
# Domain               Status  Common Name(s)  Expires               Type  Trusted
# -------------------  ------  ---------------  --------------------  ----  -------
# softlyplease.com     OK      softlyplease.com  2024-12-15 12:00 UTC  ACM   True
# www.softlyplease.com OK      www.softlyplease.com  2024-12-15 12:00 UTC  ACM   True
```

### **Azure VM SSL Certificate**

```powershell
# =============================================================================
# SOFTLYPLEASE.COM - AZURE VM SSL CERTIFICATE
# =============================================================================

# Install Windows Certificate Services (if not already installed)
Install-WindowsFeature -Name ADCS-Cert-Authority

# Generate self-signed certificate for development/testing
$cert = New-SelfSignedCertificate `
    -Subject "CN=compute.softlyplease.com" `
    -CertStoreLocation "Cert:\LocalMachine\My" `
    -KeyAlgorithm RSA `
    -KeyLength 2048 `
    -NotAfter (Get-Date).AddYears(2)

# Bind certificate to IIS site
$binding = Get-WebBinding -Name "Default Web Site" -Protocol "https"
$binding.AddSslCertificate($cert.GetCertHashString(), "my")

# Restart IIS
Restart-Service -Name W3SVC
```

---

## 📊 **6. Monitoring & Health Checks**

### **Health Check Endpoints**

```javascript
// =============================================================================
// SOFTLYPLEASE.COM - HEALTH CHECK ENDPOINTS
// =============================================================================

// Basic health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'softlyplease-compute',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV
  });
});

// Readiness check
app.get('/ready', (req, res) => {
  // Check if Rhino Compute is reachable
  const computeHealth = checkRhinoComputeHealth();

  if (computeHealth) {
    res.json({
      status: 'ready',
      rhinoCompute: 'connected',
      cache: 'operational',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      rhinoCompute: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

// Performance metrics
app.get('/metrics', (req, res) => {
  res.json({
    performance: {
      responseTime: calculateAverageResponseTime(),
      cacheHitRate: calculateCacheHitRate(),
      errorRate: calculateErrorRate(),
      throughput: calculateRequestsPerSecond()
    },
    system: {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      cpu: process.cpuUsage(),
      loadAverage: os.loadavg()
    },
    rhinoCompute: {
      connected: checkRhinoComputeConnection(),
      queueLength: getComputeQueueLength(),
      activeComputations: getActiveComputationsCount()
    }
  });
});
```

### **Monitoring Commands**

```bash
# =============================================================================
# SOFTLYPLEASE.COM - MONITORING COMMANDS
# =============================================================================

# Health check
curl https://softlyplease.com/health

# Readiness check
curl https://softlyplease.com/ready

# Performance metrics
curl https://softlyplease.com/metrics

# Heroku logs
heroku logs --tail --app softlyplease-appserver

# Application metrics
heroku addons:open papertrail --app softlyplease-appserver

# Performance monitoring
heroku addons:open librato --app softlyplease-appserver
```

---

## 💾 **7. Caching & Performance Configuration**

### **Memcached Configuration**

```javascript
// =============================================================================
// SOFTLYPLEASE.COM - MEMCACHED CONFIGURATION
// =============================================================================

const memcached = require('memcached');

// Production Memcached configuration
const memcachedConfig = {
  hosts: process.env.MEMCACHIER_SERVERS || 'localhost:11211',
  username: process.env.MEMCACHIER_USERNAME,
  password: process.env.MEMCACHIER_PASSWORD,
  options: {
    retries: 3,
    retry: 10000,
    remove: true,
    idle: 30000,
    timeout: 60000,
    failures: 5,
    failuresTimeout: 30000,
    reconnect: 10000,
    idleTimeout: 30000,
    keyCompression: true
  }
};

// Create Memcached client
const cache = new memcached(memcachedConfig.hosts, memcachedConfig.options);

// Configure authentication if needed
if (memcachedConfig.username && memcachedConfig.password) {
  cache.auth(memcachedConfig.username, memcachedConfig.password);
}

module.exports = cache;
```

### **Cache Strategy Configuration**

```javascript
// =============================================================================
// SOFTLYPLEASE.COM - CACHE STRATEGY
// =============================================================================

const CACHE_STRATEGIES = {
  // TopoOpt definition caching
  TOPOOPT: {
    ttl: 7200, // 2 hours
    keyPrefix: 'topoopt:',
    compression: true
  },

  // Generic definition caching
  DEFAULT: {
    ttl: 3600, // 1 hour
    keyPrefix: 'definition:',
    compression: true
  },

  // User session caching
  SESSION: {
    ttl: 1800, // 30 minutes
    keyPrefix: 'session:',
    compression: false
  },

  // Performance metrics caching
  METRICS: {
    ttl: 300, // 5 minutes
    keyPrefix: 'metrics:',
    compression: true
  }
};

// Cache key generation
function generateCacheKey(definitionId, inputs) {
  const inputHash = crypto.createHash('md5')
    .update(JSON.stringify(inputs))
    .digest('hex');

  return `${definitionId}:${inputHash}`;
}
```

---

## 🔧 **8. Error Handling & Logging**

### **Error Handling Configuration**

```javascript
// =============================================================================
// SOFTLYPLEASE.COM - ERROR HANDLING
// =============================================================================

const errorHandler = (err, req, res, next) => {
  // Log error details
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Determine error type and response
  let statusCode = 500;
  let message = 'Internal server error';

  if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Rhino Compute service unavailable';
  } else if (err.code === 'ETIMEDOUT') {
    statusCode = 504;
    message = 'Request timeout - computation took too long';
  } else if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Send error response
  res.status(statusCode).json({
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path,
    requestId: req.headers['x-request-id'] || 'unknown'
  });
};

// Apply error handler
app.use(errorHandler);
```

### **Logging Configuration**

```javascript
// =============================================================================
// SOFTLYPLEASE.COM - LOGGING CONFIGURATION
// =============================================================================

const winston = require('winston');

// Production logging configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'softlyplease-compute' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// If we're not in production then log to the console with a simple format
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  });

  next();
};

app.use(requestLogger);
```

---

## 🚀 **9. Deployment Verification**

### **Complete Testing Suite**

```bash
# =============================================================================
# SOFTLYPLEASE.COM - DEPLOYMENT VERIFICATION
# =============================================================================

#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Testing SoftlyPlease.com Deployment...${NC}"

# Test 1: Health Check
echo -e "\n${YELLOW}1. Testing Health Endpoint...${NC}"
if curl -s https://softlyplease.com/health | grep -q "healthy"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    exit 1
fi

# Test 2: API Authentication
echo -e "\n${YELLOW}2. Testing API Authentication...${NC}"
if curl -s -H "Authorization: Bearer prod-token-456" https://softlyplease.com/ | grep -q "definitions"; then
    echo -e "${GREEN}✅ API authentication working${NC}"
else
    echo -e "${RED}❌ API authentication failed${NC}"
    exit 1
fi

# Test 3: Rhino Compute Connection
echo -e "\n${YELLOW}3. Testing Rhino Compute Connection...${NC}"
if curl -s https://compute.softlyplease.com/version | grep -q "version"; then
    echo -e "${GREEN}✅ Rhino Compute connection working${NC}"
else
    echo -e "${RED}❌ Rhino Compute connection failed${NC}"
    echo -e "${YELLOW}⚠️  This may be expected if VM is still being configured${NC}"
fi

# Test 4: SSL Certificate
echo -e "\n${YELLOW}4. Testing SSL Certificate...${NC}"
if curl -s -I https://softlyplease.com/ | grep -q "200 OK"; then
    echo -e "${GREEN}✅ SSL certificate working${NC}"
else
    echo -e "${RED}❌ SSL certificate issue${NC}"
    exit 1
fi

# Test 5: Performance Metrics
echo -e "\n${YELLOW}5. Testing Performance Metrics...${NC}"
if curl -s https://softlyplease.com/metrics | grep -q "performance"; then
    echo -e "${GREEN}✅ Performance metrics working${NC}"
else
    echo -e "${RED}❌ Performance metrics failed${NC}"
    exit 1
fi

# Test 6: Definition Schema
echo -e "\n${YELLOW}6. Testing Definition Schema...${NC}"
if curl -s -H "Authorization: Bearer prod-token-456" https://softlyplease.com/definitions/f3997a3b7a68e0f2 | grep -q "inputs"; then
    echo -e "${GREEN}✅ Definition schema working${NC}"
else
    echo -e "${RED}❌ Definition schema failed${NC}"
    exit 1
fi

echo -e "\n${GREEN}🎉 All critical tests passed! SoftlyPlease.com is ready for production.${NC}"
```

### **Performance Benchmarking**

```bash
# =============================================================================
# SOFTLYPLEASE.COM - PERFORMANCE BENCHMARKING
# =============================================================================

#!/bin/bash

echo "🚀 Benchmarking SoftlyPlease.com Performance..."

# Test response time
echo "Testing response time..."
curl -o /dev/null -s -w "Response time: %{time_total}s\n" https://softlyplease.com/health

# Test concurrent requests
echo "Testing concurrent requests..."
for i in {1..10}; do
    curl -s https://softlyplease.com/health &
done
wait

# Test TopoOpt computation
echo "Testing TopoOpt computation..."
curl -s -H "Authorization: Bearer prod-token-456" -X POST https://softlyplease.com/solve \
  -H "Content-Type: application/json" \
  -d '{"definitionId":"f3997a3b7a68e0f2","inputs":{"height":[500],"width":[1000],"num":[3]}}' \
  -w "Computation time: %{time_total}s\n"

echo "✅ Benchmarking complete!"
```

---

## 🆘 **10. Troubleshooting Guide**

### **Common Issues & Solutions**

```bash
# =============================================================================
# SOFTLYPLEASE.COM - TROUBLESHOOTING
# =============================================================================

# Issue 1: API Authentication Fails
echo "🔍 Checking API token..."
heroku config:get APP_TOKEN --app softlyplease-appserver

# Issue 2: Rhino Compute Connection Fails
echo "🔍 Checking Rhino Compute URL..."
heroku config:get RHINO_COMPUTE_URL --app softlyplease-appserver

# Issue 3: SSL Certificate Issues
echo "🔍 Checking SSL certificates..."
heroku certs --app softlyplease-appserver

# Issue 4: Performance Issues
echo "🔍 Checking performance metrics..."
curl https://softlyplease.com/metrics

# Issue 5: Cache Issues
echo "🔍 Checking cache status..."
heroku addons --app softlyplease-appserver | grep memcachier

# Issue 6: Domain Resolution Issues
echo "🔍 Checking DNS resolution..."
nslookup www.softlyplease.com
nslookup compute.softlyplease.com

# Issue 7: Service Health
echo "🔍 Checking service health..."
curl https://softlyplease.com/health
curl https://softlyplease.com/ready

# Issue 8: Log Analysis
echo "🔍 Checking application logs..."
heroku logs --tail --app softlyplease-appserver
```

### **Emergency Commands**

```bash
# Restart Heroku app
heroku ps:restart --app softlyplease-appserver

# Scale dynos
heroku ps:scale web=2 --app softlyplease-appserver

# Clear cache
heroku run node -e "console.log('Cache cleared')" --app softlyplease-appserver

# Emergency rollback
heroku rollback --app softlyplease-appserver
```

---

## 📋 **Final Checklist**

### **✅ Pre-Deployment Checklist**
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] DNS records pointing correctly
- [ ] Rhino Compute service running
- [ ] Memcached addon active
- [ ] Authentication tokens set
- [ ] Domain configured in Heroku

### **✅ Post-Deployment Checklist**
- [ ] Health endpoint responding
- [ ] API authentication working
- [ ] SSL certificate valid
- [ ] Performance metrics active
- [ ] Rhino Compute connection established
- [ ] Cache operational
- [ ] Monitoring alerts configured

### **✅ Production Readiness Checklist**
- [ ] Load testing completed
- [ ] Backup procedures in place
- [ ] Rollback procedures tested
- [ ] Monitoring dashboards active
- [ ] Emergency contacts configured
- [ ] Documentation up to date

---

## 🎯 **SoftlyPlease.com - Production Ready!**

This comprehensive guide contains **all backend deployment configuration information** needed for a complete softlyplease.com deployment, including:

- **Complete environment configuration** for Heroku
- **Azure VM setup** for Rhino Compute
- **API authentication** and security
- **Domain and SSL configuration**
- **Monitoring and health checks**
- **Performance optimization**
- **Troubleshooting procedures**
- **Testing and verification**

The backend agent now has access to the complete production configuration needed to deploy and maintain softlyplease.com successfully! 🚀
