"use strict";
exports.__esModule = true;
var express = require("express");
var fs = require("fs");
var path = require("path");
var router = express.Router();
// Load manifest
var MANIFEST_PATH = path.join(__dirname, '../../../gh-manifest.json');
var manifest = [];
try {
    if (fs.existsSync(MANIFEST_PATH)) {
        manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    }
}
catch (error) {
    console.error('❌ Failed to load manifest:', error);
}
// GET /definitions/:id - Returns definition metadata/schema
router.get("/:id", function (req, res) {
    var def = manifest.find(function (d) { return d.id === req.params.id; });
    if (!def) {
        return res.status(404).json({ error: "Definition not found" });
    }
    // Return metadata only - never expose the raw GH file
    res.json({
        id: def.id,
        title: def.title,
        version: def.version,
        inputs: def.inputs
    });
});
exports["default"] = router;
