# 🏗️ SoftlyPlease.com - Rhino Compute App Server Architecture

This directory contains the **architectural essence** of the SoftlyPlease.com Rhino Compute app server, organized to clearly show the system layers, components, and relationships.

## 📊 Architecture Overview

```
SoftlyPlease.com Rhino Compute App Server
├── 🎯 Core Business Logic
├── 🔧 Compute Engine Integration
├── 🌐 API Layer
├── ⚛️ Frontend Application
├── 🚀 Deployment Infrastructure
├── 🛠️ DevOps & Operations
├── ⚙️ Configuration Management
├── 📦 Assets & Resources
├── 📚 Documentation
└── 🔧 Development Tools
```

## 🏗️ Architectural Layers

### 1. 🎯 Core Business Logic (`core/`)
The heart of the SoftlyPlease platform - where computational geometry meets web architecture.

#### `core/app-server/`
- **Express.js application** with REST API endpoints
- **Request routing** and middleware pipeline
- **HTTP server** with WebSocket support
- **View rendering** for legacy endpoints

#### `core/workshop-engine/`
- **TypeScript-based computation server**
- **Modern API architecture** with async/await
- **Token-based authentication** system
- **Request queuing** and load balancing

#### `core/definition-manager/`
- **Grasshopper definition discovery** and registration
- **Parameter introspection** and validation
- **Definition metadata** management
- **File system integration** for `.gh` files

#### `core/cache-layer/`
- **In-memory caching** for computation results
- **Memcached integration** for distributed caching
- **TTL management** and cache invalidation
- **Performance optimization** layer

#### `core/auth-middleware/`
- **JWT token validation**
- **API key authentication**
- **Request authorization**
- **Security middleware**

### 2. 🔧 Compute Engine Integration (`compute/`)
Where web meets computational geometry.

#### `compute/rhino-engine/`
- **Rhino 8 headless installation**
- **Windows service management**
- **Process monitoring** and health checks
- **License management** (Cloud Zoo)

#### `compute/hops-integration/`
- **Hops server components**
- **REST API endpoints** for computation
- **Parameter marshaling**
- **Result serialization**

#### `compute/geometry-solver/`
- **Grasshopper definition execution**
- **Geometry computation** pipeline
- **Result processing** and optimization
- **Error handling** and recovery

#### `compute/cloud-connector/`
- **HTTP client** for Rhino Compute communication
- **Request/response** transformation
- **Retry logic** and circuit breaking
- **Connection pooling**

### 3. 🌐 API Layer (`api/`)
The interface between web and computation.

#### `api/routes/`
- **RESTful endpoint definitions**
- **Route handlers** and controllers
- **Parameter validation**
- **Response formatting**

#### `api/endpoints/`
- **Computation endpoints** (`/solve`)
- **Definition endpoints** (`/definitions`)
- **Health endpoints** (`/health`)
- **Management endpoints**

#### `api/controllers/`
- **Business logic** for API operations
- **Data transformation**
- **Error handling**
- **Logging and monitoring**

#### `api/middleware/`
- **Authentication** middleware
- **Rate limiting**
- **Request logging**
- **CORS handling**

### 4. ⚛️ Frontend Application (`frontend/`)
The user interface for computational design.

#### `frontend/app/`
- **React application** with TypeScript
- **Component architecture**
- **State management**
- **Routing system**

#### `frontend/components/`
- **Reusable UI components**
- **Three.js viewers**
- **Form controls**
- **Layout components**

#### `frontend/pages/`
- **Page components** for each route
- **Configurator interfaces**
- **Dashboard views**
- **Documentation pages**

#### `frontend/services/`
- **API client** for backend communication
- **Data fetching** utilities
- **Error handling**
- **Caching strategies**

### 5. 🚀 Deployment Infrastructure (`deployment/`)
How the system gets deployed and scaled.

#### `deployment/heroku/`
- **App server deployment**
- **Procfile** configuration
- **Build scripts**
- **Environment management**

#### `deployment/azure/`
- **VM provisioning** scripts
- **Rhino Compute** installation
- **Network configuration**
- **Security setup**

#### `deployment/docker/`
- **Container definitions**
- **Multi-stage builds**
- **Orchestration configs**

#### `deployment/ci-cd/`
- **GitHub Actions** workflows
- **Automated testing**
- **Deployment pipelines**
- **Rollback procedures**

### 6. 🛠️ DevOps & Operations (`infrastructure/`)

#### `infrastructure/monitoring/`
- **Health check endpoints**
- **Performance metrics**
- **Request tracing**
- **Alert configurations**

#### `infrastructure/logging/`
- **Structured logging**
- **Log aggregation**
- **Error tracking**
- **Audit trails**

#### `infrastructure/security/`
- **SSL/TLS configuration**
- **Firewall rules**
- **Access control**
- **Security headers**

#### `infrastructure/performance/`
- **Caching strategies**
- **Load balancing**
- **Resource optimization**
- **Scalability configurations**

### 7. ⚙️ Configuration Management (`config/`)

#### `config/environments/`
- **Environment-specific configs**
- **Secret management**
- **Feature flags**
- **Database connections**

#### `config/secrets/`
- **API keys** and tokens
- **Database credentials**
- **SSL certificates**
- **Encryption keys**

#### `config/build/`
- **Build scripts**
- **Asset compilation**
- **Optimization configs**
- **Bundle analysis**

#### `config/scripts/`
- **Utility scripts**
- **Maintenance tasks**
- **Backup procedures**
- **Migration scripts**

### 8. 📦 Assets & Resources (`assets/`)

#### `assets/definitions/`
- **Grasshopper definition files**
- **Parameter configurations**
- **Test cases**
- **Examples**

#### `assets/models/`
- **3D model files**
- **Geometry data**
- **Test fixtures**
- **Sample outputs**

#### `assets/images/`
- **UI assets**
- **Screenshots**
- **Documentation images**
- **Branding materials**

#### `assets/templates/`
- **HTML templates**
- **Configuration templates**
- **Deployment templates**
- **Code generation templates**

### 9. 📚 Documentation (`docs/`)

#### `docs/architecture/`
- **System architecture** documentation
- **Component relationships**
- **Data flow diagrams**
- **API specifications**

#### `docs/api/`
- **API endpoint** documentation
- **Request/response** examples
- **Authentication** guides
- **Integration tutorials**

#### `docs/deployment/`
- **Deployment guides**
- **Infrastructure setup**
- **Configuration management**
- **Troubleshooting**

#### `docs/development/`
- **Development guides**
- **Coding standards**
- **Testing procedures**
- **Contribution guidelines**

### 10. 🔧 Development Tools (`scripts/`)

#### `scripts/build/`
- **Build automation**
- **Asset compilation**
- **Package management**
- **Release preparation**

#### `scripts/deploy/`
- **Deployment automation**
- **Environment setup**
- **Rollback procedures**
- **Configuration deployment**

#### `scripts/test/`
- **Test automation**
- **Integration testing**
- **Performance testing**
- **Quality assurance**

#### `scripts/maintenance/`
- **System maintenance**
- **Backup procedures**
- **Health monitoring**
- **Cleanup tasks**

## 🔄 Data Flow Architecture

```
User Request → Frontend → API Layer → Core Business Logic
                                      ↓
                                Cache Layer → Compute Engine
                                      ↓
                                Rhino Compute → Geometry Solver
                                      ↓
                                Result → Cache → API Response → User
```

## 🏛️ System Principles

### 1. **Separation of Concerns**
- **API Layer**: Handles HTTP communication
- **Core Layer**: Contains business logic
- **Compute Layer**: Manages geometry computation
- **Frontend Layer**: Provides user interface

### 2. **Scalability Design**
- **Stateless API** servers for horizontal scaling
- **External caching** for performance
- **Queue-based processing** for load management
- **Cloud-native deployment** patterns

### 3. **Performance Optimization**
- **Multi-layer caching** strategy
- **Asynchronous processing** for long computations
- **Result compression** and optimization
- **CDN integration** for static assets

### 4. **Security First**
- **Token-based authentication**
- **Input validation** at all layers
- **HTTPS everywhere**
- **Secure configuration** management

## 🎯 Key Architectural Decisions

1. **TypeScript Migration**: Moving from JavaScript to TypeScript for better maintainability
2. **Workshop Pattern**: Modern API architecture with clear separation
3. **External Compute**: Rhino Compute runs separately for better scaling
4. **Multi-layer Caching**: Memory + Memcached for optimal performance
5. **Container-Ready**: Docker support for consistent deployments

## 📈 Scaling Strategy

- **Horizontal Scaling**: Add more Heroku dynos for API layer
- **Vertical Scaling**: Increase Azure VM size for compute layer
- **Caching Scaling**: Add more Memcached instances
- **CDN Scaling**: Use CloudFlare for global asset distribution

## 🔧 Development Workflow

1. **Local Development**: Use workshop engine with local Rhino
2. **Staging Deployment**: Test with staging Heroku app
3. **Production Deployment**: Automated CI/CD to production
4. **Monitoring**: Real-time performance and error tracking

---

## 📂 How to Navigate This Architecture

Each directory contains **symbolic links** to the actual implementation files, allowing you to see the **architectural organization** while the files remain in their original locations. This provides the **"essence view"** of the system without duplicating files.

**Example**: `architecture/core/workshop-engine/` contains a link to `src/workshop/` - you can explore the workshop engine architecture while the actual code remains in `src/workshop/`.

This architectural view helps you understand:
- **System layers** and their responsibilities
- **Component relationships** and dependencies
- **Data flow** through the system
- **Scaling boundaries** and concerns
- **Development** and deployment organization
