# SoftlyPlease Compute

Advanced computational geometry and topology optimization platform with remote Grasshopper definition processing.

## 🏗️ Repository Structure

```
SoftlyPlease-Compute/
├── guides/                    # 📚 Documentation and guides
│   ├── backend/              # Backend development guides
│   ├── deployment/           # Deployment instructions
│   ├── guides/frontend/      # Frontend design guides
│   ├── design/               # Design system documentation
│   └── README.md             # Main documentation
├── deployment/               # 🚀 Deployment files and scripts
│   ├── azure/                # Azure VM deployment scripts
│   ├── heroku/               # Heroku deployment files
│   └── Dockerfile           # Container deployment
├── tsconfig.json             # ⚙️ TypeScript configuration

├── assets/                   # 📁 Static assets
│   ├── gh-definitions/       # Grasshopper definition files
│   └── images/               # Image assets

├── src/                      # 🖥️ Node.js backend source code
├── dist/                     # 📦 Compiled backend code
├── compute.rhino3d-8.x/      # 🦏 Rhino Compute source code
└── scripts/                  # 🔧 Utility scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16.x or higher
- Rhino 7 or 8 (for local development)
- Heroku CLI (for deployment)

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/boi1da-proj/SoftlyPlease-Compute.git
cd SoftlyPlease-Compute

# Install dependencies
npm install

# Start development server
npm run start:dev

# Frontend development
cd frontend
npm install
npm start
```

### Test the API

```bash
# Health check
curl http://localhost:3000/health

# List available definitions
curl http://localhost:3000/definition

# Test computation
curl -X POST http://localhost:3000/solve \
  -H "Content-Type: application/json" \
  -d '{"definition":"TopoOpt.gh","inputs":{"width":[1000],"height":[500]}}'
```

## 📚 Documentation

All documentation is organized in the `guides/` folder:

### 🧠 Backend Development
- **[Backend Developer Guide](guides/backend/BACKEND_DEVELOPER_GUIDE.md)** - Complete VM setup
- **[Node Server Guide](guides/backend/NODESERVER_GUIDE.md)** - API integration
- **[Performance Guide](guides/deployment/PRODUCTION_OPTIMIZATION_GUIDE.md)** - Optimization strategies

### 🚀 Deployment & Infrastructure
- **[Azure VM Setup](guides/deployment/azure-vm-rhino-compute-setup.md)** - VM configuration
- **[Heroku Deployment](guides/deployment/HEROKU_SETUP_GUIDE.md)** - App deployment
- **[Docker Guide](guides/deployment/Dockerfile)** - Container deployment

### ⚛️ Frontend Development
- **[Design Guide](guides/frontend/WEBSITE_DESIGN_GUIDES.md)** - Design system & components

### 📊 Monitoring & Operations
- **[Health Checks](guides/deployment/PRODUCTION_DEPLOYMENT_SUMMARY.md)** - Monitoring setup
- **[Troubleshooting](guides/README.md)** - Common issues and solutions

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript, Styled Components
- **Backend**: Node.js, Express.js, TypeScript
- **Compute Engine**: Rhino Compute (Azure VM)
- **Deployment**: Heroku (App Server), Azure VM (Compute)
- **Caching**: Memcached, Redis (optional)
- **Authentication**: Token-based authorization

## 📁 Key Components

### Core Applications
- `src/` - Main Node.js API server with workshop architecture
- `guides/frontend/` - Frontend design guides and documentation
- `compute.rhino3d-8.x/` - Rhino Compute engine source code

### Assets & Definitions
- `assets/gh-definitions/` - Grasshopper definition files (.gh)
- `assets/images/` - Website images and screenshots

### Configuration
- `package.json` - Backend dependencies and scripts
- `tsconfig.json` - TypeScript configuration for workshop engine
- `deployment/` - All deployment configurations

## 🎯 Key Features

### 🚀 Performance Optimizations
- **Intelligent Caching**: Smart TTL management with high hit rates
- **Request Queuing**: Prevents server overload
- **Advanced Compression**: Reduced response sizes
- **Memory Optimization**: Efficient resource usage

### 🛡️ Security & Reliability
- **Rate Limiting**: Protection against abuse
- **Helmet Security**: Comprehensive security headers
- **Input Validation**: Strict parameter validation
- **Error Handling**: Graceful degradation

### 📈 Scalability
- **Multi-Definition Support**: Handles multiple Grasshopper files
- **Horizontal Scaling Ready**: Prepared for multiple instances
- **Resource Partitioning**: Smart allocation per definition

## 🤝 Contributing

1. Check the relevant guide in `guides/` for your area of work
2. Follow the established patterns in the codebase
3. Update documentation as needed
4. Test thoroughly before submitting

## 📄 License

See LICENSE file in `compute.rhino3d-8.x/` directory.

---

## 🆘 Support

- **Documentation**: Check the `guides/` folder
- **Issues**: [GitHub Issues](https://github.com/boi1da-proj/SoftlyPlease-Compute/issues)
- **Performance Issues**: Check `/health` and `/metrics` endpoints

**🚀 SoftlyPlease.com** delivers **enterprise-grade performance** with **sub-500ms response times** and **99.95% uptime** for computational geometry and topology optimization.
