"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var express = require("express");
var helmet = require("helmet");
var rateLimit = require("express-rate-limit");
var cors = require("cors");
var index_1 = require("./routes/index");
var definitions_1 = require("./routes/definitions");
var solve_1 = require("./routes/solve");
var compute_1 = require("./compute");
// Create Express app
var app = express();
// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"]
        }
    }
}));
// Rate limiting
var limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT || "100"),
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false
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
app.use(function (req, res, next) {
    // Skip auth for health check
    if (req.path === '/health') {
        return next();
    }
    var auth = req.headers.authorization || "";
    var expectedToken = process.env.APP_TOKEN;
    if (!expectedToken) {
        console.warn('⚠️  APP_TOKEN not set in environment');
        return res.status(500).json({ error: 'Server configuration error' });
    }
    if (auth !== "Bearer ".concat(expectedToken)) {
        console.warn("\u274C Invalid or missing authorization token for ".concat(req.method, " ").concat(req.path));
        return res.status(401).json({ error: 'Invalid authorization token' });
    }
    next();
});
// Health check endpoint (no auth required)
app.get('/health', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var computeHealthy;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, compute_1.checkComputeHealth)()];
            case 1:
                computeHealthy = _a.sent();
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
                return [2 /*return*/];
        }
    });
}); });
// Mount routes
app.use("/", index_1["default"]);
app.use("/definitions", definitions_1["default"]);
app.use("/solve", solve_1["default"]);
// 404 handler
app.use(function (req, res) {
    res.status(404).json({
        error: 'Not found',
        path: req.path,
        method: req.method
    });
});
// Error handler
app.use(function (error, req, res, next) {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
    });
});
// Start server
var port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("\uD83D\uDE80 SoftlyPlease App Server running on port ".concat(port));
    console.log("\uD83C\uDF0D Environment: ".concat(process.env.NODE_ENV || 'development'));
    console.log("\uD83D\uDD17 Compute URL: ".concat(process.env.COMPUTE_URL || 'https://compute.softlyplease.com'));
    console.log("\uD83D\uDD11 Token auth: ".concat(process.env.APP_TOKEN ? 'Enabled' : 'Disabled (set APP_TOKEN)'));
    if (process.env.NODE_ENV === 'development') {
        console.log("\n\uD83D\uDCCB Test commands:");
        console.log("curl -H \"Authorization: Bearer $APP_TOKEN\" http://localhost:".concat(port, "/"));
        console.log("curl -H \"Authorization: Bearer $APP_TOKEN\" http://localhost:".concat(port, "/definitions/:id"));
    }
});
