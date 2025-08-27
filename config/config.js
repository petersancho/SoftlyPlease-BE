/**
 * McNeel Rhino Compute AppServer Configuration
 * Following the official McNeel compute.rhino3d.appserver guide
 */

const config = {
  // Rhino Compute Server Configuration
  rhino: {
    url: process.env.RHINO_COMPUTE_URL || 'http://4.248.252.92:80/',
    // Extracted the actual JWT token from the provided auth response
    apiKey: process.env.RHINO_COMPUTE_APIKEY || 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEiLCJ0eXAiOiJKV1QifQ.eyJzdWIiOiI1OTEwMjkxODQ2NTI5MDI0IiwiZW1haWwiOiJwZXRlcmpzYW5jaG9AZ21haWwuY29tIiwiZW1haWwfdmVyaWZpZWQiOnRydWUsImNvbS5yaGlubzNkLmFjY291bnRzLmVtYWlscyI6WyJwZXRlcmpzYW5jaG9AZ21haWwuY29tIl0sIm5hbWUiOiJQZXRlciBXaW5nbyIsImxvY2FsZSI6ImVuLWNhIiwicGljdHVyZSI6Imh0dHBzOi8vd3d3LmdyYXZhdGFyLmNvbS9hdmF0YXIvNjZjYzlkZTI1OTE5ODg3NjFiZmI2YzVkZWNjZGE4OGI_ZD1yZXRybyIsImNvbS5yaGlubzNkLmFjY291bnRzLm1lbWJlcl9ncm91cHMiOlt7ImlkIjoiNjA1NTEwOTQyMDEyMjExMiIsIm5hbWUiOiJNQkVMYWIiLCJkb21haW5zIjpbXX1dLCJjb20ucmhpbm8zZC5hY2NvdW50cy5hZG1pbl9ncm91cHMiOltdLCJjb20ucmhpbm8zZC5hY2NvdW50cy5vd25lcl9ncm91cHMiOlt7ImlkIjoiNDc4OTQxNTkzNzgzNTAwOCIsIm5hbWUiOiJDb21wdXRlIHRlYW0iLCJkb21haW5zIjpbXX1dLCJjb20ucmhpbm8zZC5hY2NvdW50cy5zaWQiOiJrUXF1K3ZWbnQyam9tSXd1aUY1R3hSUDZTMHM5dURqZE8vU1dBNEM3L3dzPSIsImlzcyI6Imh0dHBzOi8vYWNjb3VudHMucmhpbm8zZC5jb20iLCJhdWQiOiJjbG91ZF96b29fY2xpZW50IiwiZXhwIjozMzMxMDQ4MDU0LCJpYXQiOjE3NTQyNDgwNTUsImF1dGhfdGltZSI6MTc1NDI0MjEzNSwibm9uY2UiOiJaek8zTzlNN3I5WVJTQVRqOG14QldpYk5senRrdEhjdHZQRE5hcjhpU1pIeXlpS0ZHNlJYVjV4R055aVZ0aFNlIiwiYXRfaGFzaCI6ImJ1cW9LOV9lTzdnZTJOX2ZfemxGdWc9PSJ9.C7HqqZz08PbDLHGATrorhoTEnwi_CFHbgkaJ1IqHVD6oxFSgL-FVR9F4rdBabSuLSjvoB09nzf7NQ4SocIYF62ax8dB6RE3ZMmMrXrgRyIISRXzvijtNh7pVSVp2uKuAhdAIdRpzJLDwnq4YXq52W0fgcTubqiNH19_tamOBVEJkXJe0JX54_OJYgE7QHmz-BYRSFDIiK-icFBJmP3xQl30MxWngJNZNfk0V9bS01jiOe5CQTcgts93UxRTpDcIAx5RIl49jtsyqnXPBoGSoDmwF87cYl067vxuUn8kVOvAOTDDm9sog-gv7zQhHGui4aoGPnPy-AYhHLYmlBLSxQ',
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
    directory: './src/files',
    extensions: ['.gh', '.ghx'],
    cacheDefinitions: true
  },

  // Bootstrap Configuration (for VM deployment)
  bootstrap: {
    computeUrl: process.env.COMPUTE_URL || 'http://4.248.252.92:80',
    appServerUrl: process.env.APPSERVER_URL || (process.env.NODE_ENV === 'production'
      ? 'https://softlyplease-appserver.herokuapp.com'
      : 'http://localhost:3000'),
    networkInterface: '0.0.0.0'
  }
};

module.exports = config;