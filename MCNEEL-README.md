# McNeel Rhino Compute AppServer - Official Setup Guide

A Node.js server acting as a bridge between client applications and Rhino Compute geometry servers, following the official McNeel compute.rhino3d.appserver architecture.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client App    │───▶│  AppServer       │───▶│ Rhino Compute   │
│                 │    │  (Node.js/Express)│    │ (rhino.geometry)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │                        │
                              │  Hosts Grasshopper     │  Solves GH
                              │  Definitions (.gh/.ghx) │  Definitions
                              └────────────────────────┘
```

## Key Features

- **REST API Bridge**: Exposes rhino.geometry namespace through HTTP endpoints
- **Grasshopper Definition Hosting**: Hosts .gh/.ghx files with base64 encoding
- **Caching**: Memcached support for definition and result caching
- **Multi-format Support**: GET, POST, and HEAD requests with caching
- **Input/Output Detection**: Automatic parameter sniffing from RH_in:/RH_out: patterns
- **Authentication**: API key-based authorization for Rhino Compute access

## Quick Start (McNeel Standard Setup)

### Prerequisites
- Node.js 16.x or higher
- Access to Rhino Compute server (local or remote)
- Grasshopper definitions with proper RH_in:/RH_out: naming

### 1. Environment Configuration

```bash
# Set required environment variables
export RHINO_COMPUTE_URL="http://localhost:6500/"  # Your Rhino Compute server
export RHINO_COMPUTE_APIKEY="your-api-key-here"    # Authentication key
export PORT=3000                                    # AppServer port
export NODE_ENV="production"                        # Environment
```

### 2. Bootstrap and Start

```bash
# Use the McNeel bootstrap script
chmod +x bootstrap-compute.sh
./bootstrap-compute.sh
```

Or for Windows PowerShell:
```powershell
.\bootstrap-compute.ps1
```

### 3. Test the Setup

```bash
# Test Rhino Compute connectivity
curl http://localhost:6500/version

# Test AppServer endpoints
curl http://localhost:3000/                    # List definitions
curl http://localhost:3000/definition_name     # Get definition info
curl "http://localhost:3000/solve?definition=def&param=value"  # Solve
```

## API Endpoints

### Core Endpoints
- `GET /` - List all available Grasshopper definitions
- `GET /:definition` - Get inputs/outputs for a specific definition
- `GET /solve` - Solve definition with query parameters
- `POST /solve` - Solve definition with JSON body
- `HEAD /solve` - Check cache without full computation

### Advanced Endpoints
- `GET /definition` - Access definition files (with caching)
- `GET /definition_description` - Detailed definition metadata

## Grasshopper Definition Setup

### Input Parameters
```grasshopper
RH_in:parameter_name  # Creates input parameter
```

### Output Parameters
```grasshopper
RH_out:result_name    # Creates output parameter
```

### Example Definition Structure
```
Inputs:
├── RH_in:radius (Number)
├── RH_in:height (Number)
└── RH_in:segments (Integer)

Outputs:
└── RH_out:mesh (Mesh)
```

## Configuration Options

### Environment Variables
```bash
# Required
RHINO_COMPUTE_URL="http://your-compute-server:6500/"
RHINO_COMPUTE_APIKEY="your-api-key"

# Optional
PORT=3000
NODE_ENV="production"
HOST="0.0.0.0"
WEB_CONCURRENCY=1
MEMCACHED_URL="localhost:11211"
CORS_ORIGIN="*"
```

### Compute Server URLs
- **Local Development**: `http://localhost:6500/`
- **VM Deployment**: `http://your-vm-ip:6500/`
- **Docker**: `http://host.docker.internal:6500/`

## Deployment Scenarios

### Scenario 1: Local Development
```bash
# Terminal 1: Start Rhino Compute
rhino-compute.exe --port=6500 --bind=localhost

# Terminal 2: Start AppServer
npm run bootstrap:compute
```

### Scenario 2: VM Architecture
```powershell
# On Windows VM - Start Rhino Compute
rhino-compute.exe --port=6500 --bind=0.0.0.0

# On Mac Studio - Configure AppServer
export RHINO_COMPUTE_URL="http://vm-ip:6500/"
npm run bootstrap:compute
```

### Scenario 3: Docker Deployment
```yaml
version: '3.8'
services:
  rhino-compute:
    image: mcneel/compute-rhino3d:latest
    ports:
      - "6500:6500"
    environment:
      - RHINO_COMPUTE_APIKEY=your-key

  appserver:
    build: .
    ports:
      - "3000:3000"
    environment:
      - RHINO_COMPUTE_URL=http://rhino-compute:6500/
      - RHINO_COMPUTE_APIKEY=your-key
    depends_on:
      - rhino-compute
```

## Testing and Validation

### Test Commands
```bash
# 1. Test Rhino Compute server
curl -s http://localhost:6500/version

# 2. Test definition loading
curl -s "http://localhost:6500/io" \
  -H "Content-Type: application/json" \
  -d '{"content":"BASE64_ENCODED_GH_FILE","type":"base64"}'

# 3. Test AppServer endpoints
curl -s http://localhost:3000/ | jq  # List definitions

# 4. Test solve endpoint
curl -s "http://localhost:3000/solve?definition=test&input=123"
```

### Health Check
```bash
# Check if both services are running
curl -s http://localhost:6500/version && echo " - Rhino Compute: OK"
curl -s http://localhost:3000/ && echo " - AppServer: OK"
```

## Troubleshooting

### Common Issues

**"Connection refused" to Rhino Compute**
```bash
# Check if Rhino Compute is running
ps aux | grep rhino-compute
# Or on Windows
Get-Process | Where-Object {$_.ProcessName -like "*rhino*"}
```

**"API key not configured"**
```bash
export RHINO_COMPUTE_APIKEY="your-actual-api-key"
```

**"Definition not found"**
- Ensure .gh files are in `./src/files/` directory
- Check file permissions
- Verify base64 encoding if uploading

### Debug Mode
```bash
# Enable debug logging
export DEBUG="compute.appserver:*"
npm run start:dev
```

## Security Considerations

- Always set `RHINO_COMPUTE_APIKEY` for production
- Use HTTPS in production environments
- Configure `CORS_ORIGIN` appropriately
- Regularly rotate API keys
- Monitor access logs for unauthorized requests

## Performance Tuning

```bash
# Increase worker processes
export WEB_CONCURRENCY=4

# Enable memcached for better performance
export MEMCACHED_URL="localhost:11211"

# Adjust timeouts for complex definitions
# Modify config.js rhino.timeout value
```

## Contributing

This follows the official McNeel compute.rhino3d.appserver architecture:
- Grasshopper definitions stored in `./src/files/`
- REST API endpoints for all operations
- Proper caching with memcached support
- Environment-based configuration

## Resources

- [Official McNeel Documentation](https://developer.rhino3d.com/guides/compute/)
- [API Reference](docs/endpoints.md)
- [Client Examples](docs/clientcode.md)
