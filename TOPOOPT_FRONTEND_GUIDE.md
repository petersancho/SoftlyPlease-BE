# 🚀 TopoOpt Configurator Frontend Integration Guide

## For SoftlyPlease.com Frontend Developer

---

## 📋 **Quick Start Checklist**

### **✅ Prerequisites**
- [ ] Node.js server deployed to Heroku/production
- [ ] MemCachier addon configured (for production)
- [ ] Domain pointing to your Heroku app
- [ ] Frontend can make API calls to your backend

### **🎯 Integration Steps**
1. [ ] Set up API client configuration
2. [ ] Create TopoOpt UI components
3. [ ] Implement parameter controls
4. [ ] Add result visualization
5. [ ] Handle loading states and errors
6. [ ] Add performance monitoring

---

## 🔧 **API Configuration**

### **Base Configuration**
```javascript
// config/api.js
const API_CONFIG = {
  // For production (replace with your Heroku app URL)
  baseURL: process.env.NODE_ENV === 'production'
    ? 'https://your-app-name.herokuapp.com'
    : 'http://localhost:3000',

  endpoints: {
    solve: '/solve',
    definition: '/definition',
    health: '/health',
    metrics: '/metrics',
    topoopt: '/topoopt' // Test interface
  },

  timeout: 30000, // 30 seconds for complex computations
  retries: 3
};
```

### **API Client Setup**
```javascript
// utils/topoOptApi.js
class TopoOptAPI {
  constructor(baseURL = API_CONFIG.baseURL) {
    this.baseURL = baseURL;
  }

  async solve(parameters) {
    const response = await fetch(`${this.baseURL}/solve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        definition: 'TopoOpt.gh',
        inputs: {
          height: [parameters.height || 500],
          width: [parameters.width || 1000],
          depth: [parameters.depth || 300],
          num: [parameters.num || 3],
          'RH_IN:explode': [parameters.explode || false]
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Computation failed');
    }

    const result = await response.json();

    // Extract performance metrics from headers
    const metrics = {
      responseTime: response.headers.get('x-response-time'),
      cacheStatus: response.headers.get('x-cache'),
      computeTime: response.headers.get('x-compute-time'),
      requestId: response.headers.get('x-request-id')
    };

    return { result, metrics };
  }

  async getDefinitionInfo() {
    const response = await fetch(`${this.baseURL}/TopoOpt.gh`);
    if (!response.ok) throw new Error('Failed to get definition info');
    return response.json();
  }

  async checkHealth() {
    const response = await fetch(`${this.baseURL}/health`);
    return response.json();
  }
}

export default TopoOptAPI;
```

---

## 🎨 **UI Components**

### **Main TopoOpt Component**
```javascript
// components/TopoOptConfigurator.js
import React, { useState, useCallback } from 'react';
import TopoOptAPI from '../utils/topoOptApi';
import ParameterControls from './ParameterControls';
import ResultViewer from './ResultViewer';
import PerformanceMonitor from './PerformanceMonitor';

const TopoOptConfigurator = () => {
  const [parameters, setParameters] = useState({
    height: 500,
    width: 1000,
    depth: 300,
    num: 3,
    explode: false
  });

  const [result, setResult] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const api = new TopoOptAPI();

  const handleParameterChange = useCallback((param, value) => {
    setParameters(prev => ({
      ...prev,
      [param]: value
    }));
  }, []);

  const handleCompute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { result: computationResult, metrics: performanceMetrics } =
        await api.solve(parameters);

      setResult(computationResult);
      setMetrics(performanceMetrics);

    } catch (err) {
      setError(err.message);
      console.error('TopoOpt computation failed:', err);
    } finally {
      setLoading(false);
    }
  }, [parameters]);

  return (
    <div className="topoopt-configurator">
      <h1>🚀 Topology Optimization Configurator</h1>

      <ParameterControls
        parameters={parameters}
        onChange={handleParameterChange}
        onCompute={handleCompute}
        loading={loading}
      />

      {error && (
        <div className="error-message">
          ❌ Error: {error}
        </div>
      )}

      {result && (
        <ResultViewer result={result} />
      )}

      {metrics && (
        <PerformanceMonitor metrics={metrics} />
      )}
    </div>
  );
};

export default TopoOptConfigurator;
```

### **Parameter Controls**
```javascript
// components/ParameterControls.js
import React from 'react';

const ParameterControls = ({ parameters, onChange, onCompute, loading }) => {
  const parameterConfig = {
    height: { min: 100, max: 1000, step: 10, unit: 'mm', label: 'Height' },
    width: { min: 800, max: 2000, step: 10, unit: 'mm', label: 'Width' },
    depth: { min: 200, max: 700, step: 10, unit: 'mm', label: 'Depth' },
    num: { min: 1, max: 10, step: 1, unit: '', label: 'Number of Elements' }
  };

  return (
    <div className="parameter-controls">
      <h2>⚙️ Parameters</h2>

      {Object.entries(parameterConfig).map(([key, config]) => (
        <div key={key} className="parameter-group">
          <label htmlFor={key}>
            {config.label}: {parameters[key]} {config.unit}
          </label>
          <input
            type="range"
            id={key}
            min={config.min}
            max={config.max}
            step={config.step}
            value={parameters[key]}
            onChange={(e) => onChange(key, parseInt(e.target.value))}
            disabled={loading}
          />
          <div className="range-values">
            <span>{config.min}{config.unit}</span>
            <span>{config.max}{config.unit}</span>
          </div>
        </div>
      ))}

      <div className="parameter-group">
        <label>
          <input
            type="checkbox"
            checked={parameters.explode}
            onChange={(e) => onChange('explode', e.target.checked)}
            disabled={loading}
          />
          Explode Mesh
        </label>
      </div>

      <button
        onClick={onCompute}
        disabled={loading}
        className="compute-button"
      >
        {loading ? '🔄 Computing...' : '🚀 Compute TopoOpt'}
      </button>
    </div>
  );
};

export default ParameterControls;
```

### **Result Viewer**
```javascript
// components/ResultViewer.js
import React from 'react';

const ResultViewer = ({ result }) => {
  // Parse the result data - this will depend on what TopoOpt.gh outputs
  const meshData = result.values?.find(v => v.ParamName === 'RH_OUT:mesh');

  return (
    <div className="result-viewer">
      <h2>📊 Results</h2>

      {meshData ? (
        <div className="mesh-result">
          <h3>Generated Mesh</h3>
          <div className="mesh-preview">
            {/* Implement 3D viewer here - could use Three.js or similar */}
            <div className="placeholder-3d">
              <p>3D Mesh Preview</p>
              <p>Data size: {meshData.InnerTree['{0}'][0].data.length} bytes</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="no-results">
          <p>No mesh data available in result</p>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default ResultViewer;
```

### **Performance Monitor**
```javascript
// components/PerformanceMonitor.js
import React from 'react';

const PerformanceMonitor = ({ metrics }) => {
  return (
    <div className="performance-monitor">
      <h3>⚡ Performance Metrics</h3>
      <div className="metrics-grid">
        <div className="metric-item">
          <span className="metric-label">Response Time:</span>
          <span className="metric-value">{metrics.responseTime}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Cache Status:</span>
          <span className={`metric-value ${metrics.cacheStatus === 'HIT' ? 'cache-hit' : 'cache-miss'}`}>
            {metrics.cacheStatus}
          </span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Compute Time:</span>
          <span className="metric-value">{metrics.computeTime}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Request ID:</span>
          <span className="metric-value">{metrics.requestId}</span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
```

---

## 🎨 **CSS Styling**

### **Modern Glassmorphism Design**
```css
/* styles/topoopt.css */
.topoopt-configurator {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.parameter-controls {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 30px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 20px;
}

.parameter-group {
  margin-bottom: 25px;
}

.parameter-group label {
  display: block;
  margin-bottom: 10px;
  font-weight: bold;
  color: white;
}

.parameter-group input[type="range"] {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
}

.parameter-group input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(45deg, #4CAF50, #45a049);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.range-values {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.compute-button {
  background: linear-gradient(45deg, #4CAF50, #45a049);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 25px;
  font-size: 16px;
  cursor: pointer;
  width: 100%;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.compute-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.compute-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: rgba(220, 53, 69, 0.3);
  color: #f8d7da;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
  border: 1px solid rgba(220, 53, 69, 0.5);
}

.performance-monitor {
  background: rgba(0, 123, 255, 0.2);
  border-radius: 10px;
  padding: 20px;
  border: 1px solid rgba(0, 123, 255, 0.3);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-label {
  font-weight: bold;
  color: #cce7ff;
}

.metric-value {
  font-weight: bold;
  color: #99d3ff;
}

.cache-hit {
  color: #d4edda !important;
}

.cache-miss {
  color: #f8d7da !important;
}
```

---

## 🔧 **Integration Examples**

### **1. Basic Integration**
```javascript
// pages/topoopt.js (Next.js example)
import TopoOptConfigurator from '../components/TopoOptConfigurator';

export default function TopoOptPage() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <TopoOptConfigurator />
    </div>
  );
}
```

### **2. Advanced Integration with State Management**
```javascript
// Using Redux/Zustand for global state
const useTopoOptStore = create((set) => ({
  parameters: {
    height: 500,
    width: 1000,
    depth: 300,
    num: 3,
    explode: false
  },
  results: [],
  loading: false,

  updateParameter: (param, value) =>
    set(state => ({
      parameters: { ...state.parameters, [param]: value }
    })),

  compute: async () => {
    set({ loading: true });
    try {
      const api = new TopoOptAPI();
      const { result, metrics } = await api.solve(get().parameters);

      set(state => ({
        results: [...state.results, { ...result, metrics, timestamp: Date.now() }],
        loading: false
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  }
}));
```

### **3. Real-time Collaboration**
```javascript
// Add WebSocket support for real-time updates
const ws = new WebSocket('wss://your-app.herokuapp.com/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'topoopt-update') {
    // Handle real-time updates from other users
    updateSharedState(data.payload);
  }
};
```

---

## 🚀 **Deployment Instructions**

### **1. Environment Setup**
```bash
# Install dependencies
npm install

# Set environment variables
export API_BASE_URL=https://your-app-name.herokuapp.com

# For production with MemCachier
export MEMCACHIER_SERVERS=your-memcachier-server
export MEMCACHIER_USERNAME=your-username
export MEMCACHIER_PASSWORD=your-password
```

### **2. Build Configuration**
```javascript
// next.config.js (for Next.js)
module.exports = {
  env: {
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000'
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_BASE_URL}/:path*`
      }
    ];
  }
};
```

### **3. Error Handling**
```javascript
// utils/errorHandler.js
export const handleTopoOptError = (error) => {
  switch (error.message) {
    case 'fetch failed':
      return 'Unable to connect to computation server. Please try again.';
    case 'No valid parameters provided':
      return 'Please check your input parameters.';
    case 'Rhino Compute error':
      return 'Computation server error. Please contact support.';
    default:
      return `Unexpected error: ${error.message}`;
  }
};
```

---

## 📊 **Performance Optimization**

### **Caching Strategy**
```javascript
// Implement client-side caching
const cache = new Map();

const getCachedResult = async (parameters) => {
  const key = JSON.stringify(parameters);

  if (cache.has(key)) {
    return { ...cache.get(key), cached: true };
  }

  const result = await api.solve(parameters);
  cache.set(key, result);

  // Expire cache after 5 minutes
  setTimeout(() => cache.delete(key), 5 * 60 * 1000);

  return { ...result, cached: false };
};
```

### **Lazy Loading**
```javascript
// Only load 3D viewer when needed
const ResultViewer = () => {
  const [viewerLoaded, setViewerLoaded] = useState(false);

  useEffect(() => {
    if (result && !viewerLoaded) {
      import('three').then(() => setViewerLoaded(true));
    }
  }, [result]);

  if (!viewerLoaded) {
    return <div>Loading 3D viewer...</div>;
  }

  return <ThreeViewer data={result} />;
};
```

---

## 🧪 **Testing**

### **Unit Tests**
```javascript
// __tests__/TopoOptConfigurator.test.js
describe('TopoOptConfigurator', () => {
  it('should compute with default parameters', async () => {
    const mockApi = {
      solve: jest.fn().mockResolvedValue({
        result: { values: [] },
        metrics: { responseTime: '100ms', cacheStatus: 'HIT' }
      })
    };

    // Test implementation
  });

  it('should handle API errors gracefully', async () => {
    const mockApi = {
      solve: jest.fn().mockRejectedValue(new Error('Network error'))
    };

    // Test error handling
  });
});
```

### **Integration Tests**
```javascript
// Test full workflow
describe('TopoOpt Integration', () => {
  it('should complete full computation workflow', async () => {
    // 1. Set parameters
    // 2. Trigger computation
    // 3. Verify result
    // 4. Check performance metrics
  });
});
```

---

## 📈 **Monitoring & Analytics**

### **Performance Tracking**
```javascript
// Track user interactions
const trackTopoOptUsage = (action, data) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: 'TopoOpt',
      event_label: data.definition,
      value: data.responseTime
    });
  }
};
```

### **Error Reporting**
```javascript
// Send errors to monitoring service
const reportError = (error, context) => {
  // Send to Sentry, LogRocket, or similar
  console.error('TopoOpt Error:', error, context);
};
```

---

## 🎯 **Next Steps**

1. **Deploy the backend** to Heroku with MemCachier
2. **Implement the UI components** using the examples above
3. **Add 3D visualization** for mesh results
4. **Set up monitoring** and error tracking
5. **Add user authentication** if needed
6. **Implement real-time collaboration** features

---

## 📞 **Support**

If you encounter any issues:

1. Check the **browser console** for errors
2. Verify **network requests** in developer tools
3. Test the **API endpoints directly**:
   ```bash
   curl https://your-app.herokuapp.com/health
   curl https://your-app.herokuapp.com/TopoOpt.gh
   ```
4. Check **Heroku logs** for backend issues
5. Monitor **MemCachier dashboard** for cache performance

---

**Your TopoOpt configurator is ready for softlyplease.com! 🚀**

This guide provides everything you need to integrate a high-performance topology optimization tool that outperforms ShapeDiver in speed, efficiency, and user experience.
