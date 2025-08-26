/**
 * McNeel Rhino Compute AppServer Configuration
 * Following the official McNeel compute.rhino3d.appserver guide
 */

const config = {
  // Rhino Compute Server Configuration
  rhino: {
    url: process.env.RHINO_COMPUTE_URL || 'http://4.248.252.92:6500/',
    apiKey: process.env.RHINO_COMPUTE_APIKEY || 'softlyplease-secure-key-2024',
    timeout: 30000,
    retries: 3
  },

  // AppServer Configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development',
    concurrency: process.env.WEB_CONCURRENCY || 1
  },

  // Caching Configuration
  cache: {
    memcached: process.env.MEMCACHED_URL || null,
    ttl: 3600, // 1 hour
    enabled: true
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    debug: process.env.DEBUG || 'compute.appserver:*'
  },

  // Definition Configuration
  definitions: {
    directory: './src/files',
    extensions: ['.gh', '.ghx'],
    cacheDefinitions: true
  },

  // Bootstrap Configuration (for VM deployment)
  bootstrap: {
    computeUrl: process.env.COMPUTE_URL || 'http://0.0.0.0:80',
    appServerUrl: process.env.APPSERVER_URL || 'http://localhost:3000',
    networkInterface: '0.0.0.0'
  }
};

module.exports = config;
