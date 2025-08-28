const fs = require('fs');
const path = require('path');

// Copy Three.js to vendor directory for local fallback
const src = path.resolve('node_modules/three/build/three.min.js');
const destDir = path.resolve('public/vendor/three/0.158.0');
const destFile = path.join(destDir, 'three.min.js');

console.log('Copying Three.js from:', src);
console.log('Copying Three.js to:', destFile);

// Ensure destination directory exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  console.log('Created directory:', destDir);
}

// Copy the file
if (fs.existsSync(src)) {
  fs.copyFileSync(src, destFile);
  console.log('✅ Three.js copied successfully to vendor directory');
} else {
  console.error('❌ Three.js source file not found:', src);
  console.log('Available files in node_modules/three/build/:');
  const buildDir = path.dirname(src);
  if (fs.existsSync(buildDir)) {
    const files = fs.readdirSync(buildDir);
    files.forEach(file => console.log('  -', file));
  }
}
