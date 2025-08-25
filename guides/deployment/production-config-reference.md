# Production Configuration Reference

## 🎯 **Production URLs (No Localhost Anywhere)**

### **Current Live Setup:**
- **Heroku App Server**: `https://softlyplease-appserver-5d5d5bc6198a.herokuapp.com`
- **Custom Domain**: `https://softlyplease.com` (DNS configured ✅)
- **Rhino.Compute**: `https://compute.softlyplease.com` (Azure VM: 4.206.137.232)

### **API Endpoints (Production Only):**
```bash
# App Server API (use this for all client calls)
APP_SERVER_BASE_URL=https://softlyplease.com

# Rhino.Compute (internal - App Server only)
COMPUTE_URL=https://compute.softlyplease.com
```

## 🔑 **Authentication**
```bash
# Bearer token for all API calls
Authorization: Bearer prod-token-456
```

## 📋 **Available Endpoints**

### **GET /** - List Definitions
```bash
curl -H "Authorization: Bearer prod-token-456" https://softlyplease.com/
```

### **GET /definitions/:id** - Get Definition Schema
```bash
curl -H "Authorization: Bearer prod-token-456" https://softlyplease.com/definitions/f3997a3b7a68e0f2
```

### **POST /solve** - Compute Definition
```bash
curl -H "Authorization: Bearer prod-token-456" -X POST https://softlyplease.com/solve \
  -H "Content-Type: application/json" \
  -d '{
    "definitionId": "f3997a3b7a68e0f2",
    "inputs": {
      "height": 500,
      "width": 1000,
      "num": 3
    }
  }'
```

## 🏗️ **Azure VM Setup Status**

- ✅ **VM**: rhino-compute-vm724 (4.206.137.232)
- ✅ **Rhino 8**: Installed
- ✅ **Rhino.Compute**: Installed
- ⏳ **Service Configuration**: Needs setup
- ⏳ **IIS HTTPS**: Needs setup
- ⏳ **SSL Certificate**: Needs setup
- ⏳ **DNS**: compute.softlyplease.com → 4.206.137.232
- ⏳ **Heroku Integration**: COMPUTE_URL=https://compute.softlyplease.com

## 🔧 **Heroku Configuration**

```bash
# Current config (verify)
heroku config --app softlyplease-appserver

# Set Compute URL (after VM is ready)
heroku config:set COMPUTE_URL=https://compute.softlyplease.com --app softlyplease-appserver
```

## 🧪 **Testing Commands**

```bash
# Test App Server health
curl https://softlyplease.com/health

# Test Compute endpoint (after setup)
curl https://compute.softlyplease.com/version

# Test end-to-end solve
curl -H "Authorization: Bearer prod-token-456" -X POST https://softlyplease.com/solve \
  -H "Content-Type: application/json" \
  -d '{"definitionId":"f3997a3b7a68e0f2","inputs":{"height":500,"width":1000,"num":3}}'
```

## 🚨 **Critical Requirements**

1. **NO LOCALHOST** in any production code
2. **HTTPS ONLY** for all external communication
3. **Bearer Token** for all API authentication
4. **Cloud Zoo** licensing for core-hour billing
5. **App Server mediates** all client-to-Compute communication

## 📝 **Frontend Integration**

```javascript
// Production configuration
const API_BASE_URL = 'https://softlyplease.com';
const API_TOKEN = 'prod-token-456';

// Example API call
async function solveDefinition(definitionId, inputs) {
  const response = await fetch(`${API_BASE_URL}/solve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_TOKEN}`
    },
    body: JSON.stringify({ definitionId, inputs })
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}
```

**Your developer can now follow the `azure-vm-rhino-compute-setup.md` guide to complete the Rhino.Compute configuration!** 🚀
