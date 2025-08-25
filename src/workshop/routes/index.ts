const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Load manifest
const MANIFEST_PATH = path.join(__dirname, '../../assets/gh-definitions/gh-manifest.json');
console.log('📄 Looking for manifest at:', MANIFEST_PATH);
console.log('📄 Resolved path:', path.resolve(MANIFEST_PATH));
console.log('📄 File exists:', fs.existsSync(MANIFEST_PATH));

let manifest: any[] = [];

try {
  if (fs.existsSync(MANIFEST_PATH)) {
    const data = fs.readFileSync(MANIFEST_PATH, 'utf-8');
    console.log('📄 Manifest file size:', data.length);
    manifest = JSON.parse(data);
    console.log('📄 Successfully loaded manifest with', manifest.length, 'definitions');
  } else {
    console.error('❌ Manifest file does not exist');
  }
} catch (error) {
  console.error('❌ Failed to load manifest:', error);
  console.error('❌ Error details:', error.message);
}

// GET / - Index endpoint (lists definitions)
router.get("/", (_, res) => {
  try {
    console.log('📋 Serving definitions list, manifest length:', manifest.length);
    res.json({
      ok: true,
      service: "softlyplease-app-server",
      defs: manifest.map(d => ({
        id: d.id,
        title: d.title,
        version: d.version
      }))
    });
  } catch (error) {
    console.error('❌ Error in index route:', error);
    res.status(500).json({ error: "Server configuration error", details: error.message });
  }
});

export default router;
