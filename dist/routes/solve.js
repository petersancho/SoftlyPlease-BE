"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const router = express.Router();
// Load manifest
const MANIFEST_PATH = path.join(__dirname, '../../gh-manifest.json');
let manifest = [];
try {
    if (fs.existsSync(MANIFEST_PATH)) {
        manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    }
}
catch (error) {
    console.error('❌ Failed to load manifest:', error);
}
// In-memory cache for identical solves
const solveCache = new Map();
// POST /solve - Compute definition with given inputs
router.post("/", async (req, res) => {
    const { definitionId, inputs } = req.body || {};
    if (!definitionId || !inputs) {
        return res.status(400).json({
            error: "Missing required fields: definitionId and inputs"
        });
    }
    const def = manifest.find(d => d.id === definitionId);
    if (!def) {
        return res.status(400).json({
            error: "Unknown definitionId"
        });
    }
    // Create cache key from definitionId and inputs
    const key = crypto.createHash("sha256")
        .update(definitionId + JSON.stringify(inputs))
        .digest("hex");
    // Check cache first
    if (solveCache.has(key)) {
        console.log(`💾 Cache hit for ${definitionId}`);
        return res.json({
            cached: true,
            ...solveCache.get(key)
        });
    }
    try {
        console.log(`🦏 Solving ${def.title} (${definitionId}) with inputs:`, inputs);
        // For now, return mock data (will be replaced with actual Compute call)
        const mockResult = {
            definitionId,
            inputs,
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
        console.log(`✅ Solved ${definitionId} successfully`);
        res.json(mockResult);
    }
    catch (error) {
        console.error(`❌ Solve error for ${definitionId}:`, error);
        res.status(500).json({
            error: "Computation failed",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
});
exports.default = router;
