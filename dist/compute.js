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
exports.checkComputeHealth = exports.solve = void 0;
var fetch = require("node-fetch");
// Configuration from environment
var COMPUTE_URL = process.env.COMPUTE_URL || "https://compute.softlyplease.com";
var COMPUTE_TIMEOUT_MS = parseInt(process.env.COMPUTE_TIMEOUT_MS || "30000");
// Solve function that calls Rhino Compute
function solve(definitionPointer, inputs) {
    return __awaiter(this, void 0, void 0, function () {
        var controller, timeoutId, response, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\uD83D\uDD17 Calling Compute at ".concat(COMPUTE_URL, "/grasshopper"));
                    controller = new AbortController();
                    timeoutId = setTimeout(function () { return controller.abort(); }, COMPUTE_TIMEOUT_MS);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("".concat(COMPUTE_URL, "/grasshopper"), {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": "Bearer ".concat(process.env.COMPUTE_API_KEY || "")
                            },
                            body: JSON.stringify({
                                algo: definitionPointer,
                                pointer: inputs
                            }),
                            signal: controller.signal
                        })];
                case 2:
                    response = _a.sent();
                    clearTimeout(timeoutId);
                    if (!response.ok) {
                        throw new Error("Compute returned ".concat(response.status, ": ").concat(response.statusText));
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    result = _a.sent();
                    console.log("\u2705 Compute successful");
                    return [2 /*return*/, result];
                case 4:
                    error_1 = _a.sent();
                    clearTimeout(timeoutId);
                    if (error_1 instanceof Error) {
                        if (error_1.name === 'AbortError') {
                            throw new Error("Compute request timed out after ".concat(COMPUTE_TIMEOUT_MS, "ms"));
                        }
                        throw error_1;
                    }
                    throw new Error('Unknown error occurred during computation');
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.solve = solve;
// Health check for Compute server
function checkComputeHealth() {
    return __awaiter(this, void 0, void 0, function () {
        var controller_1, timeoutId, response, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    controller_1 = new AbortController();
                    timeoutId = setTimeout(function () { return controller_1.abort(); }, 5000);
                    return [4 /*yield*/, fetch("".concat(COMPUTE_URL, "/health"), {
                            method: "GET",
                            signal: controller_1.signal
                        })];
                case 1:
                    response = _a.sent();
                    clearTimeout(timeoutId);
                    return [2 /*return*/, response.ok];
                case 2:
                    error_2 = _a.sent();
                    console.warn("\u26A0\uFE0F  Compute health check failed: ".concat(error_2 instanceof Error ? error_2.message : 'Unknown error'));
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.checkComputeHealth = checkComputeHealth;
