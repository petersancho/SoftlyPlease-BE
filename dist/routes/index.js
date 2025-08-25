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
// GET / - Index endpoint (lists definitions)
router.get("/", function (_, res) {
    res.json({
        ok: true,
        service: "softlyplease-app-server",
        defs: manifest.map(function (d) { return ({
            id: d.id,
            title: d.title,
            version: d.version
        }); })
    });
});
exports["default"] = router;
