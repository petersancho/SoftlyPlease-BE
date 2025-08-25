const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Load manifest
const MANIFEST_PATH = path.join(__dirname, '../../../gh-manifest.json');
let manifest: any[] = [];

try {
  if (fs.existsSync(MANIFEST_PATH)) {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  }
} catch (error) {
  console.error('❌ Failed to load manifest:', error);
}

// GET / - Index endpoint (lists definitions)
router.get("/", (_, res) => {
  res.json({
    ok: true,
    service: "softlyplease-app-server",
    defs: manifest.map(d => ({
      id: d.id,
      title: d.title,
      version: d.version
    }))
  });
});

export default router;
