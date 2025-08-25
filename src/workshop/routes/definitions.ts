const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Load manifest
const MANIFEST_PATH = path.join(__dirname, '../../gh-manifest.json');
let manifest: any[] = [];

try {
  if (fs.existsSync(MANIFEST_PATH)) {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  }
} catch (error) {
  console.error('❌ Failed to load manifest:', error);
}

// GET /definitions/:id - Returns definition metadata/schema
router.get("/:id", (req, res) => {
  const def = manifest.find(d => d.id === req.params.id);
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

export default router;
