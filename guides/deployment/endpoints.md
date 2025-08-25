## API Endpoints

The SoftlyPlease.com API provides comprehensive access to Grasshopper computational geometry through the following endpoints:

### **Core API Endpoints**

| endpoint | method | return type | description |
|----------|--------|-------------|-------------|
| `/` | GET | `application/json` | List all available Grasshopper definitions |
| `/definitions/:id` | GET | `application/json` | Get definition metadata and parameters |
| `/definition/:id` | GET | `application/json` | Get definition file (legacy endpoint) |
| `/solve` | POST | `application/json` | Solve a Grasshopper definition with parameters |
| `/health` | GET | `application/json` | Health check and system status |
| `/ready` | GET | `application/json` | Readiness check for load balancers |
| `/metrics` | GET | `application/json` | Performance metrics and statistics |
| `/version` | GET | `application/json` | API version and system information |

### **Authentication**
All API endpoints (except `/health`, `/ready`, `/version`) require authentication:
```
Authorization: Bearer prod-token-456
```

### **Request/Response Format**

#### **POST /solve**
```javascript
// Request
{
  "definitionId": "f3997a3b7a68e0f2",
  "inputs": {
    "width": [1000],
    "height": [500],
    "num": [3],
    "smooth": [3],
    "cube": [2]
  }
}

// Response
{
  "success": true,
  "data": {
    "type": "topology_optimization",
    "geometry": {...},
    "performance": {...}
  }
}
```

#### **GET /definitions/:id**
```javascript
// Response
{
  "id": "f3997a3b7a68e0f2",
  "title": "TopoOpt.gh",
  "version": "1.0.0",
  "inputs": [
    {
      "name": "width",
      "type": "number",
      "default": 1000,
      "min": 100,
      "max": 2000
    }
  ]
}
```

### **Error Responses**
```javascript
{
  "error": "Invalid authentication token",
  "timestamp": "2024-01-25T12:00:00Z",
  "path": "/solve",
  "requestId": "abc123"
}
```

### **Rate Limiting**
- 1000 requests per 15 minutes per IP
- Headers included in response:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`
