# SoftlyPlease - Geometry Calculator & Rhino Compute AppServer

A web-based geometry calculator and Rhino Compute appserver for solving Grasshopper definitions with a clean, modern interface.

## Features

- **Clean Web Interface**: Times New Roman styling with black/white theme
- **Grasshopper Integration**: Solve definitions using Rhino Compute
- **Three.js Visualization**: Modern 3D rendering with ESM modules
- **Definition Management**: Secure validation and caching
- **API Endpoints**: RESTful solve and status endpoints
- **Production Ready**: Heroku deployment with monitoring

## Getting Started

1. **Prerequisites**: Node.js 18.x, Git
2. **Clone**: `git clone https://github.com/petersancho/SoftlyPlease-BE.git`
3. **Install**: `npm install`
4. **Configure**:
   ```bash
   export COMPUTE_URL=http://your-compute-server:6001/
   export RHINO_COMPUTE_KEY=your-key-if-needed
   export PUBLIC_APP_ORIGIN=https://your-domain.com
   ```
5. **Sync Examples**: `npm run sync:examples`
6. **Patch for ESM**: `npm run patch:examples`
7. **Start**: `npm start`

## Usage

### Web Interface
- **Homepage**: `https://your-domain.com/` - Exact title: "geometry calculator, a rhino compute appserver."
- **Examples**: `https://your-domain.com/examples/` - Browse and run Grasshopper examples
- **My Examples**: `https://your-domain.com/my-examples/` - Placeholder for custom examples

### API Endpoints
- **Solve**: `POST /solve/` with `{definition: "Name.gh", inputs: {...}}`
- **Status**: `GET /status` - Compute health check
- **Definitions**: `GET /status/definitions` - List available definitions

## Examples

Visit the live examples at: https://www.softlyplease.com/examples/

The examples use Three.js with modern ESM modules for 3D visualization and interact with Rhino Compute for geometry solving.

## Deployment

### Heroku
```bash
heroku create your-app-name
heroku config:set COMPUTE_URL=http://your-compute:6001/
heroku config:set PUBLIC_APP_ORIGIN=https://your-app.herokuapp.com
git push heroku main
```

### Local Development
```bash
npm run dev  # Development mode
npm run sync:upstream  # Sync latest examples
npm run verify:defs   # Check definition references
```

## Architecture

- **Frontend**: HTML/CSS/JavaScript with Times New Roman styling
- **Backend**: Node.js/Express with definition validation
- **Compute**: Rhino Compute integration with retry logic
- **Caching**: Memcached support for performance
- **Security**: Path traversal prevention and input validation

## Upstream & Credits

This project builds upon the excellent work from:
- **McNeel Rhino Compute AppServer**: https://github.com/mcneel/compute.rhino3d.appserver
- **Rhino3D Compute**: https://www.rhino3d.com/compute
- **Three.js**: Modern 3D visualization library

## License

MIT License - see LICENSE file for details.

---

Built with ❤️ for the computational design community.