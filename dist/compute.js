"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.solve = solve;
exports.checkComputeHealth = checkComputeHealth;
const fetch = require("node-fetch");
// Configuration from environment
const COMPUTE_URL = process.env.COMPUTE_URL || "https://compute.softlyplease.com";
const COMPUTE_TIMEOUT_MS = parseInt(process.env.COMPUTE_TIMEOUT_MS || "30000");
// Solve function that calls Rhino Compute
async function solve(definitionPointer, inputs) {
    console.log(`🔗 Calling Compute at ${COMPUTE_URL}/grasshopper`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), COMPUTE_TIMEOUT_MS);
    try {
        const response = await fetch(`${COMPUTE_URL}/grasshopper`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.COMPUTE_API_KEY || ""}`
            },
            body: JSON.stringify({
                algo: definitionPointer,
                pointer: inputs
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            throw new Error(`Compute returned ${response.status}: ${response.statusText}`);
        }
        const result = await response.json();
        console.log(`✅ Compute successful`);
        return result;
    }
    catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                throw new Error(`Compute request timed out after ${COMPUTE_TIMEOUT_MS}ms`);
            }
            throw error;
        }
        throw new Error('Unknown error occurred during computation');
    }
}
// Health check for Compute server
async function checkComputeHealth() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`${COMPUTE_URL}/health`, {
            method: "GET",
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response.ok;
    }
    catch (error) {
        console.warn(`⚠️  Compute health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return false;
    }
}
