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
exports.__esModule = true;
exports.generateManifest = void 0;
var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var GH_DEFS_DIR = path.join(__dirname, '../../gh-defs');
var MANIFEST_PATH = path.join(__dirname, '../../gh-manifest.json');
// Copy existing definitions to gh-defs directory
function copyExistingDefinitions() {
    var srcDir = path.join(__dirname, '../files');
    var destDir = GH_DEFS_DIR;
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    // Copy .gh files from src/files to gh-defs
    var files = fs.readdirSync(srcDir).filter(function (f) { return f.endsWith('.gh'); });
    files.forEach(function (file) {
        var srcPath = path.join(srcDir, file);
        var destPath = path.join(destDir, file);
        fs.copyFileSync(srcPath, destPath);
        console.log("\uD83D\uDCCB Copied ".concat(file, " to gh-defs"));
    });
}
// Generate stable ID from file content and name
function generateDefinitionId(filePath) {
    var fileContent = fs.readFileSync(filePath);
    var fileName = path.basename(filePath, '.gh');
    // Create hash from file content and name for stable ID
    var hash = crypto.createHash('sha256');
    hash.update(fileContent);
    hash.update(fileName);
    return hash.digest('hex').substring(0, 16);
}
// Extract definition metadata (simplified for now - in production you'd introspect the GH file)
function extractDefinitionMetadata(filePath) {
    var fileName = path.basename(filePath, '.gh');
    // Map common definitions to their parameters
    var definitionMap = {
        'TopoOpt': {
            title: 'Topology Optimization',
            version: '1.0',
            inputs: [
                { name: 'height', type: 'number', "default": 500, min: 100, max: 2000 },
                { name: 'width', type: 'number', "default": 1000, min: 100, max: 2000 },
                { name: 'num', type: 'number', "default": 3, min: 1, max: 10 }
            ]
        },
        'beam_mod': {
            title: 'Beam Modifier',
            version: '1.0',
            inputs: [
                { name: 'length', type: 'number', "default": 1000, min: 100, max: 5000 },
                { name: 'width', type: 'number', "default": 50, min: 10, max: 200 },
                { name: 'height', type: 'number', "default": 100, min: 20, max: 500 }
            ]
        },
        'delaunay': {
            title: 'Delaunay Triangulation',
            version: '1.0',
            inputs: [
                { name: 'points', type: 'number', "default": 50, min: 3, max: 1000 },
                { name: 'radius', type: 'number', "default": 100, min: 10, max: 1000 }
            ]
        },
        'brep_union': {
            title: 'BREP Union',
            version: '1.0',
            inputs: [
                { name: 'size1', type: 'number', "default": 100, min: 10, max: 500 },
                { name: 'size2', type: 'number', "default": 80, min: 10, max: 500 },
                { name: 'offset', type: 'number', "default": 20, min: 0, max: 100 }
            ]
        }
    };
    return definitionMap[fileName] || {
        title: fileName.replace(/[_-]/g, ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); }),
        version: '1.0',
        inputs: [
            { name: 'param1', type: 'number', "default": 100, min: 0, max: 1000 }
        ]
    };
}
// Generate manifest
function generateManifest() {
    console.log('🚀 Generating Grasshopper definition manifest...');
    // Copy existing definitions if not already done
    if (fs.readdirSync(GH_DEFS_DIR).length === 0) {
        copyExistingDefinitions();
    }
    var files = fs.readdirSync(GH_DEFS_DIR).filter(function (f) { return f.endsWith('.gh'); });
    var manifest = [];
    files.forEach(function (file) {
        var filePath = path.join(GH_DEFS_DIR, file);
        var id = generateDefinitionId(filePath);
        var metadata = extractDefinitionMetadata(filePath);
        var definition = __assign(__assign({ id: id }, metadata), { storageUri: "file://".concat(filePath) // In production, this would be a pre-signed URL
         });
        manifest.push(definition);
        console.log("\uD83D\uDCCB Added definition: ".concat(definition.title, " (").concat(id, ")"));
    });
    // Write manifest
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    console.log("\uD83D\uDCBE Manifest saved to ".concat(MANIFEST_PATH));
    console.log("\uD83D\uDCCA Generated manifest with ".concat(manifest.length, " definitions"));
}
exports.generateManifest = generateManifest;
// Run if called directly
if (require.main === module) {
    generateManifest();
}
