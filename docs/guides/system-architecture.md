# System Architecture

## 🏗️ **SoftlyPlease.com Rhino Compute System Architecture**

This document outlines the complete architecture of the Rhino Compute system powering softlyplease.com.

## 📊 **High-Level Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│  softlyplease.  │◄──►│  AppServer      │◄──►│  Rhino Compute  │
│      .com       │    │  (Heroku)       │    │  (Azure VM)     │
│  (Frontend)     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   MemCachier     │    │   Rhino +       │
                       │  (Heroku Add-on) │    │ Grasshopper     │
                       │                 │    │                 │
                       └─────────────────┘    └─────────────────┘
                                                │
                                                ▼
                                       ┌─────────────────┐
                                       │  Cloud Zoo      │
                                       │  Licensing      │
                                       └─────────────────┘
```

## 🖥️ **Component Details**

### **Frontend (softlyplease.com)**
- **Technology**: HTML/CSS/JavaScript
- **Purpose**: User interface and client-side logic
- **Communication**: REST API calls to AppServer
- **Key Files**: Main website files

### **AppServer (Heroku)**
- **Technology**: Node.js + Express.js
- **Purpose**: API bridge between frontend and Rhino Compute
- **Features**:
  - REST API endpoints
  - Request caching (MemCachier)
  - Grasshopper definition management
  - Error handling and logging
- **Environment**: Production on Heroku
- **URL**: `https://softlyplease-appserver.herokuapp.com`

### **Rhino Compute (Azure VM)**
- **Technology**: C# .NET Core, Rhino + Grasshopper
- **Purpose**: Remote Grasshopper definition solving
- **Features**:
  - Headless Rhino execution
  - Grasshopper definition processing
  - Geometry computation
  - REST API server
- **VM Details**:
  - OS: Windows Server 2019
  - IP: `4.248.252.92`
  - Port: `6500` (rhino.compute), `5000` (compute.geometry)

### **Supporting Services**

#### **MemCachier (Heroku Add-on)**
- **Purpose**: High-performance caching
- **Use Cases**:
  - Cache solved Grasshopper definitions
  - Reduce computation time for repeated requests
  - Store geometry data temporarily

#### **Cloud Zoo (Rhino Licensing)**
- **Purpose**: Rhino license management
- **Features**:
  - Core-hour billing
  - Cloud-based licensing
  - No local license installation needed

## 🔄 **Data Flow**

### **Request Flow**
```
1. User interacts with softlyplease.com
2. Frontend sends API request to AppServer
3. AppServer checks cache (MemCachier)
4. If not cached, AppServer forwards to Rhino Compute
5. Rhino Compute solves Grasshopper definition
6. Result flows back: Rhino Compute → AppServer → Frontend
7. AppServer caches result for future requests
```

### **Authentication Flow**
```
Frontend Request → AppServer → Rhino Compute
     ↓              ↓              ↓
  No Auth       API Key       API Key
  Required    (Header)       (Header)
```

## 🗂️ **File Structure**

### **Repository Structure**
```
compute.rhino3d/
├── src/
│   ├── rhino.compute/          # Web API server
│   ├── compute.geometry/       # Rhino compute engine
│   └── hops/                   # Hops integration
├── compute.rhino3d.appserver/
│   ├── src/
│   │   ├── files/             # Grasshopper definitions
│   │   ├── routes/            # API endpoints
│   │   └── app.js             # Main application
│   └── deploy-to-heroku.ps1   # Deployment script
└── SOFTLYPLEASE-COMPUTE-DOCS/  # This documentation
```

### **Key Configuration Files**
- `src/rhino.compute/appsettings.json` - Rhino Compute settings
- `src/app.js` - AppServer main configuration
- `src/files/*.gh` - Grasshopper definitions
- `deploy-to-heroku.ps1` - Deployment automation

## 🔐 **Security**

### **API Authentication**
- **Method**: Header-based authentication
- **Header**: `RhinoComputeKey`
- **Key**: `softlyplease-secure-key-2024`
- **Purpose**: Secure access to Rhino Compute server

### **Network Security**
- **Azure VM**: Configured with security groups
- **Heroku**: Platform-level security
- **Access**: Restricted to known IP ranges

## 📈 **Scalability**

### **Current Setup**
- **AppServer**: Single Heroku dyno (can scale to multiple)
- **Rhino Compute**: Single Azure VM (can add more VMs)
- **Caching**: MemCachier for performance

### **Scaling Options**
- **Horizontal**: Add more Heroku dynos and Azure VMs
- **Load Balancing**: Distribute across multiple instances
- **Auto-scaling**: Configure based on demand

## 💰 **Cost Structure**

### **Monthly Costs Estimate**
- **Azure VM** (Windows Server): $100-200/month
- **Heroku Dyno**: $25-100/month
- **MemCachier**: $15-50/month
- **Rhino Licensing**: $0.10/core/hour (usage-based)
- **Total**: $140-350/month (depending on usage)

### **Cost Optimization**
- Use smaller VM instances when possible
- Implement caching to reduce compute time
- Monitor usage and scale down when not needed

## 🚨 **Failure Points & Recovery**

### **Single Points of Failure**
1. **Azure VM**: If down, no computation possible
2. **Heroku App**: If down, no API access
3. **Network**: Connectivity issues between services

### **Redundancy Options**
- Multiple Azure VMs with load balancer
- Heroku auto-scaling
- Database for persistent caching

## 📊 **Monitoring Points**

### **Key Metrics**
- **Response Time**: API response times
- **Error Rate**: Failed requests percentage
- **Compute Usage**: Rhino core-hours consumed
- **Cache Hit Rate**: Percentage of cached responses

### **Monitoring Tools**
- **Heroku Dashboard**: App performance and logs
- **Azure Portal**: VM performance and logs
- **Custom Health Checks**: Application-specific monitoring

## 🔄 **Update Strategy**

### **Component Updates**
- **Rhino Compute**: Weekly updates via scripts
- **AppServer**: Deploy via git to Heroku
- **Definitions**: Replace files and redeploy
- **Dependencies**: Update via package managers

### **Rollback Plan**
- Keep previous versions of deployments
- Database backups before major changes
- Test in staging environment first

## 📚 **Related Documentation**

- [Initial Setup Guide](initial-setup.md) - Complete setup instructions
- [Troubleshooting Guide](operations/troubleshooting.md) - Common issues
- [Backup Procedures](operations/backup.md) - Data protection
- [Performance Optimization](scaling/performance.md) - Tuning guides

---

**Architecture Version**: 1.0
**Last Reviewed**: December 2024
**Next Review**: June 2025
