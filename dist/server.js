"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const index_1 = __importDefault(require("./routes/index"));
const definitions_1 = __importDefault(require("./routes/definitions"));
const solve_1 = __importDefault(require("./routes/solve"));
const compute_1 = require("./compute");
// Create Express app
const app = express();
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
    max: parseInt(process.env.RATE_LIMIT || "100"),
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Apply rate limiting to solve endpoints
app.use('/solve', limiter);
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
app.use((req, res, next) => {
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
app.get('/health', async (req, res) => {
    const computeHealthy = await (0, compute_1.checkComputeHealth)();
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
app.use("/", index_1.default);
app.use("/definitions", definitions_1.default);
app.use("/solve", solve_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.path,
        method: req.method
    });
});
// Error handler
app.use((error, req, res, next) => {
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
