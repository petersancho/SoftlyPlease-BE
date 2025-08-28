// Mock Rhino.Compute service for development
// Run with: node ops/mock-compute.js
// This provides a local stub that mimics Rhino.Compute API

const express = require('express');
const app = express();
const PORT = process.env.MOCK_COMPUTE_PORT || 8081;

// Simple bearer token auth middleware
app.use((req, res, next) => {
  if (req.method === 'GET' && req.path === '/version') {
    // Allow health checks without auth
    return next();
  }

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // In development, accept any bearer token
  next();
});

app.use(express.json({ limit: '2mb' }));

// Mock version endpoint
app.get('/version', (req, res) => {
  res.json({
    version: '8.17.0-mock',
    rhino: '8.17.0',
    compute: '1.0.0-mock',
    timestamp: new Date().toISOString()
  });
});

// Mock solve endpoint
app.post('/solve', (req, res) => {
  const { definition, inputs } = req.body;

  console.log(`[MOCK] Solving definition: ${definition}`);
  console.log(`[MOCK] Inputs:`, inputs);

  // Simulate processing time
  setTimeout(() => {
    // Mock response based on common Rhino.Compute patterns
    const mockResponse = {
      message: 'Mock solve completed successfully',
      definition: definition,
      inputs: inputs,
      timestamp: new Date().toISOString(),
      // Mock some geometry data
      values: [
        {
          ParamName: 'Output',
          InnerTree: {
            '0': [
              {
                type: 'Point3d',
                data: [0, 0, 0]
              }
            ]
          }
        }
      ]
    };

    // Add some variety based on inputs
    if (inputs && inputs.Count) {
      const count = inputs.Count;
      mockResponse.values[0].InnerTree['0'] = [];
      for (let i = 0; i < count; i++) {
        mockResponse.values[0].InnerTree['0'].push({
          type: 'Point3d',
          data: [i * 10, 0, 0]
        });
      }
    }

    res.json(mockResponse);
  }, 500); // 500ms delay to simulate compute time
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'mock-rhino-compute',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🐳 Mock Rhino.Compute running on port ${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   GET  /version`);
  console.log(`   GET  /health`);
  console.log(`   POST /solve`);
  console.log(`\n🚀 Use COMPUTE_URL=http://localhost:${PORT} for local development`);
  console.log(`🔧 Stop with Ctrl+C`);
});
