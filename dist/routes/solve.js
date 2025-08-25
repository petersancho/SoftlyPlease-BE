"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var router = express.Router();
// Load manifest
var MANIFEST_PATH = path.join(__dirname, '../../gh-manifest.json');
var manifest = [];
try {
    if (fs.existsSync(MANIFEST_PATH)) {
        manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    }
}
catch (error) {
    console.error('❌ Failed to load manifest:', error);
}
// In-memory cache for identical solves
var solveCache = new Map();
// POST /solve - Compute definition with given inputs
router.post("/", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, definitionId, inputs, def, key, mockResult;
    return __generator(this, function (_b) {
        _a = req.body || {}, definitionId = _a.definitionId, inputs = _a.inputs;
        if (!definitionId || !inputs) {
            return [2 /*return*/, res.status(400).json({
                    error: "Missing required fields: definitionId and inputs"
                })];
        }
        def = manifest.find(function (d) { return d.id === definitionId; });
        if (!def) {
            return [2 /*return*/, res.status(400).json({
                    error: "Unknown definitionId"
                })];
        }
        key = crypto.createHash("sha256")
            .update(definitionId + JSON.stringify(inputs))
            .digest("hex");
        // Check cache first
        if (solveCache.has(key)) {
            console.log("\uD83D\uDCBE Cache hit for ".concat(definitionId));
            return [2 /*return*/, res.json(__assign({ cached: true }, solveCache.get(key)))];
        }
        try {
            console.log("\uD83E\uDD8F Solving ".concat(def.title, " (").concat(definitionId, ") with inputs:"), inputs);
            mockResult = {
                definitionId: definitionId,
                inputs: inputs,
                outputs: {
                    mesh: {
                        vertices: [
                            [0, 0, 0], [100, 0, 0], [100, 100, 0], [0, 100, 0],
                            [0, 0, 100], [100, 0, 100], [100, 100, 100], [0, 100, 100]
                        ],
                        faces: [
                            [0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4],
                            [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]
                        ]
                    },
                    volume: inputs.height * inputs.width * inputs.num || 1000,
                    timestamp: new Date().toISOString()
                },
                computedAt: new Date().toISOString()
            };
            // Cache the result
            solveCache.set(key, mockResult);
            console.log("\u2705 Solved ".concat(definitionId, " successfully"));
            res.json(mockResult);
        }
        catch (error) {
            console.error("\u274C Solve error for ".concat(definitionId, ":"), error);
            res.status(500).json({
                error: "Computation failed",
                details: error instanceof Error ? error.message : "Unknown error"
            });
        }
        return [2 /*return*/];
    });
}); });
exports["default"] = router;
