const fs = require('fs');
const path = require('path');

// Simple HTML and JS patching without cheerio
function patchHtmlFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');

  // Add site CSS if not present
  if (!html.includes('/styles/softly.css')) {
    html = html.replace(/<head>/, '<head>\n<link rel="stylesheet" href="/styles/softly.css">');
  }

  // Replace rhino3dm scripts with pinned version
  html = html.replace(/<script[^>]*rhino3dm[^>]*><\/script>/g, '');
  html = html.replace(/(<head>)/, '$1\n<script async src="https://cdn.jsdelivr.net/npm/rhino3dm@8.17.0/rhino3dm.min.js"></script>');

  // Add ESM bootstrap if not present
  if (!html.includes('_common/bootstrap.js')) {
    html = html.replace(/(<\/head>)/, '<script type="module" src="/examples/_common/bootstrap.js"></script>\n$1');
  }

  // Remove legacy three.js UMD tags
  html = html.replace(/<script[^>]*three(\.min)?\.js[^>]*><\/script>/g, '');

  // Remove import maps and es-module-shims (causing duplicate Three loading)
  html = html.replace(/<!-- Import maps polyfill -->[\s\S]*?<\/script>/g, '');
  html = html.replace(/<script[^>]*es-module-shims[^>]*><\/script>/g, '');
  html = html.replace(/<script type="importmap">[\s\S]*?<\/script>/g, '');

  fs.writeFileSync(filePath, html);
  console.log('Patched', path.basename(filePath));
}

// Patch JavaScript files to use global THREE instead of imports
function patchJsFile(filePath) {
  let js = fs.readFileSync(filePath, 'utf8');

  // Remove Three.js imports
  js = js.replace(/import \* as THREE from ['"`]three['"`];?\n?/g, '');
  js = js.replace(/import { OrbitControls } from ['"`]three\/examples\/jsm\/controls\/OrbitControls['"`];?\n?/g, '');
  js = js.replace(/import { Rhino3dmLoader } from ['"`]three\/examples\/jsm\/loaders\/3DMLoader['"`];?\n?/g, '');

  // Update rhino3dm import to use CDN directly
  js = js.replace(/import rhino3dm from ['"`]rhino3dm['"`];?\n?/g, "import rhino3dm from 'https://cdn.jsdelivr.net/npm/rhino3dm@8.17.0/rhino3dm.module.js';");

  // Replace loader initialization with global loader
  js = js.replace(/const loader = new Rhino3dmLoader\(\);?\n?loader\.setLibraryPath\([^)]+\);?\n?/g, 'const loader = window.__rhino3dmLoader;');

  // Update OrbitControls instantiation to use global THREE
  js = js.replace(/new OrbitControls\(/g, 'new THREE.OrbitControls(');

  fs.writeFileSync(filePath, js);
  console.log('Patched JS', path.basename(filePath));
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.html')) {
      patchHtmlFile(fullPath);
    } else if (file === 'script.js') {
      patchJsFile(fullPath);
    }
  }
}

const examplesDir = path.join(process.cwd(), 'examples');
if (fs.existsSync(examplesDir)) {
  walkDir(examplesDir);
  console.log('All HTML files patched successfully!');
} else {
  console.log('Examples directory not found');
}
