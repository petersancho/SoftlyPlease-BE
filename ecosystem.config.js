module.exports = {
  apps: [{
    name: "softlyplease-appserver",
    script: "./src/bin/www",
    env: {
      NODE_ENV: "production",
      PORT: "5000",
      RHINO_COMPUTE_URL: "http://localhost:6001/",
      RHINO_COMPUTE_KEY: "p2robot-13a6-48f3-b24e-2025computeX"
    },
    autorestart: true,
    max_restarts: 10,
    watch: false,
    instances: 1,
    exec_mode: "fork",
    env_production: {
      NODE_ENV: "production"
    }
  }]
};
