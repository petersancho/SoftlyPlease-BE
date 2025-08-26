// Configuration Template for Rhino Compute AppServer
// Copy this file to config.js and update with your values

module.exports = {
  // Rhino Compute Server Configuration
  rhino: {
    // URL of your Azure VM running Rhino Compute
    url: process.env.RHINO_COMPUTE_URL || 'http://YOUR_AZURE_VM_IP:80',
    
    // API key for authenticating with Rhino Compute
    apiKey: process.env.RHINO_COMPUTE_APIKEY || 'YOUR_GENERATED_API_KEY'
  },

  // Server Configuration
  server: {
    // Port for the AppServer (Heroku sets this automatically)
    port: process.env.PORT || 3000,
    
    // Host binding (0.0.0.0 for all interfaces)
    host: process.env.HOST || '0.0.0.0',
    
    // Environment (development/production)
    env: process.env.NODE_ENV || 'development'
  },

  // Caching Configuration
  cache: {
    // Node cache TTL in seconds
    ttl: 3600, // 1 hour
    
    // Memcached configuration (if using)
    memcached: {
      servers: process.env.MEMCACHIER_SERVERS || '127.0.0.1:11211',
      options: {
        failover: true,
        timeout: 1,
        keepAlive: true
      }
    }
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'HEAD', 'OPTIONS']
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.NODE_ENV === 'production' ? 'combined' : 'dev'
  },

  // Security Configuration
  security: {
    // Rate limiting
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    },
    
    // Helmet security headers
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https:"]
        }
      }
    }
  },

  // Database Configuration (if using)
  database: {
    // MongoDB connection string (optional)
    mongoUri: process.env.MONGODB_URI || null,
    
    // Redis connection (optional)
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || null
    }
  },

  // Email Configuration (if using)
  email: {
    // SMTP configuration for notifications
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || null,
        pass: process.env.SMTP_PASS || null
      }
    }
  },

  // Monitoring Configuration
  monitoring: {
    // Health check endpoint
    healthCheck: {
      enabled: true,
      path: '/health',
      timeout: 5000
    },
    
    // Metrics collection
    metrics: {
      enabled: process.env.NODE_ENV === 'production',
      port: process.env.METRICS_PORT || 9090
    }
  },

  // Development Configuration
  development: {
    // Hot reload for development
    hotReload: process.env.NODE_ENV === 'development',
    
    // Debug logging
    debug: process.env.DEBUG || false,
    
    // Mock data for testing
    mockData: process.env.USE_MOCK_DATA || false
  }
};

// Usage Examples:
//
// 1. Basic setup (just change these values):
//    - YOUR_AZURE_VM_IP: Your Azure VM's public IP address
//    - YOUR_GENERATED_API_KEY: API key from Azure VM setup
//
// 2. Environment variables (recommended for production):
//    - Set RHINO_COMPUTE_URL and RHINO_COMPUTE_APIKEY in Heroku
//    - The config will automatically use them
//
// 3. Customization:
//    - Modify caching TTL for your use case
//    - Adjust CORS settings for your domain
//    - Configure security headers as needed
//
// 4. Advanced features:
//    - Enable MongoDB for persistent storage
//    - Add Redis for advanced caching
//    - Configure email notifications
//    - Set up monitoring and metrics
