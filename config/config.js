/**
 * McNeel Rhino Compute AppServer Configuration
 * Following the official McNeel compute.rhino3d.appserver guide
 */

const config = {
  // Rhino Compute Server Configuration
  rhino: {
    url: process.env.COMPUTE_URL || 'http://softlyplease.canadacentral.cloudapp.azure.com:6001',
    apiKey: process.env.RHINO_COMPUTE_KEY || process.env.RHINO_COMPUTE_APIKEY || 'p2robot-13a6-48f3-b24e-2025computeX',
    timeout: 30000,
    retries: 3
  },

  // AppServer Configuration
  server: {
    port: process.env.PORT || (process.env.NODE_ENV === 'production' ? 80 : 3000),
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
    origin: process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production'
      ? 'https://softlyplease.com'
      : '*'),
    credentials: true
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    debug: process.env.DEBUG || 'compute.appserver:*'
  },

  // Definition Configuration
  definitions: {
    directory: './SoftlyPlease-BE-main/compute.rhino3d.appserver-main/src/files',
    extensions: ['.gh', '.ghx'],
    cacheDefinitions: true
  },

  // Bootstrap Configuration (for VM deployment)
  bootstrap: {
    computeUrl: process.env.COMPUTE_URL || (process.env.NODE_ENV === 'production'
      ? 'http://softlyplease.canadacentral.cloudapp.azure.com:6001'
      : 'http://localhost:6001'),
    appServerUrl: process.env.APPSERVER_URL || (process.env.NODE_ENV === 'production'
      ? 'https://softlyplease-appserver.herokuapp.com'
      : 'http://localhost:3000'),
    networkInterface: '0.0.0.0'
  }
};

module.exports = config;