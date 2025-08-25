const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
import indexRouter from "./routes/index";
import definitionsRouter from "./routes/definitions";
import solveRouter from "./routes/solve";
import { checkComputeHealth } from "./compute";

console.log('🔧 Loading routes...');
console.log('📋 Index route loaded:', !!indexRouter);
console.log('📋 Definitions route loaded:', !!definitionsRouter);
console.log('📋 Solve route loaded:', !!solveRouter);

// Create Express app
const app = express();

// Ensure fetch is available globally for Node.js versions that don't have it
const fetch = require('node-fetch').default;
global.fetch = fetch;
global.Request = require('node-fetch').Request;
global.Response = require('node-fetch').Response;
global.Headers = require('node-fetch').Headers;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT || "1000"),
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

console.log('📋 Setting up middleware...');

// Apply rate limiting to solve endpoints
app.use('/solve', limiter);
console.log('📋 Rate limiting middleware added');

// Authentication middleware for protected endpoints
const authMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const appToken = process.env.APP_TOKEN;

  // Skip auth for health, ready, version endpoints
  if (req.path === '/health' || req.path === '/ready' || req.path === '/version' || req.path === '/') {
    return next();
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Missing or invalid authorization header',
      message: 'Please provide a valid Bearer token'
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  if (!appToken) {
    console.warn('⚠️  APP_TOKEN not set in environment - skipping auth for development');
    return next();
  }

  if (token !== appToken) {
    return res.status(401).json({
      error: 'Invalid authorization token',
      message: 'The provided token is not valid'
    });
  }

  next();
};

// Apply authentication to all routes
app.use(authMiddleware);
console.log('📋 Authentication middleware added');

// CORS configuration
app.use(cors({
  origin: [
    'https://softlyplease.com',
    'https://www.softlyplease.com',
    'https://api.softlyplease.com',
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
  maxAge: 86400
}));

// JSON parsing
app.use(express.json({ limit: "2mb" }));

// Token-based authorization middleware (workshop requirement)
app.use((req: any, res: any, next: any) => {
  // Skip auth for health check
  if (req.path === '/health') {
    return next();
  }

  const auth = req.headers.authorization || "";
  const expectedToken = process.env.APP_TOKEN;

  if (!expectedToken) {
    console.warn('⚠️  APP_TOKEN not set in environment');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (auth !== `Bearer ${expectedToken}`) {
    console.warn(`❌ Invalid or missing authorization token for ${req.method} ${req.path}`);
    return res.status(401).json({ error: 'Invalid authorization token' });
  }

  next();
});

// Health check endpoint (no auth required)
app.get('/health', async (req: any, res: any) => {
  const computeHealthy = await checkComputeHealth();

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'softlyplease-app-server',
    compute: {
      url: process.env.COMPUTE_URL || 'https://compute.softlyplease.com',
      connected: computeHealthy
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mount routes
console.log('📋 Mounting routes...');
app.use("/", indexRouter);
console.log('📋 Index route mounted');
app.use("/definitions", definitionsRouter);
console.log('📋 Definitions route mounted');
app.use("/solve", solveRouter);
console.log('📋 Solve route mounted');

// 404 handler
app.use((req: any, res: any) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
  });
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 SoftlyPlease App Server running on port ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Compute URL: ${process.env.COMPUTE_URL || 'https://compute.softlyplease.com'}`);
  console.log(`🔑 Token auth: ${process.env.APP_TOKEN ? 'Enabled' : 'Disabled (set APP_TOKEN)'}`);

  if (process.env.NODE_ENV === 'development') {
    console.log(`\n📋 Test commands:`);
    console.log(`curl -H "Authorization: Bearer $APP_TOKEN" http://localhost:${port}/`);
    console.log(`curl -H "Authorization: Bearer $APP_TOKEN" http://localhost:${port}/definitions/:id`);
  }
});
