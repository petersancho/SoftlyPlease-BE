const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');

const root = process.cwd();

// Create vendor directory structure
function setupVendorDirectories() {
  const dirs = [
    'public/vendor/three/0.158.0',
    'public/examples/_common'
  ];

  dirs.forEach(dir => {
    const fullPath = path.join(root, dir);
    if (!fs.existsSync(fullPath)) {
      fse.ensureDirSync(fullPath);
      console.log(`✅ Created directory: ${dir}`);
    } else {
      console.log(`ℹ️  Directory exists: ${dir}`);
    }
  });
}

// Copy Three.js from node_modules to vendor
function copyThreeJS() {
  const src = path.join(root, 'node_modules/three/build/three.min.js');
  const destDir = path.join(root, 'public/vendor/three/0.158.0');
  const destFile = path.join(destDir, 'three.min.js');

  if (!fs.existsSync(src)) {
    console.error(`❌ Three.js source not found: ${src}`);
    console.log('💡 Make sure to run "npm install" first');
    return false;
  }

  fse.ensureDirSync(destDir);
  fs.copyFileSync(src, destFile);
  console.log(`✅ Copied Three.js to: public/vendor/three/0.158.0/three.min.js`);
  return true;
}

// Copy bootstrap script to common location
function copyBootstrap() {
  const src = path.join(root, 'public/examples/_common/bootstrap.js');
  const dest = path.join(root, 'public/vendor/bootstrap.js');

  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✅ Copied bootstrap to: public/vendor/bootstrap.js`);
    return true;
  } else {
    console.log(`⚠️  Bootstrap source not found, will be created during patching`);
    return false;
  }
}

function main() {
  console.log('🔧 Setting up vendor directories and files...\n');

  try {
    setupVendorDirectories();
    const threeCopied = copyThreeJS();
    const bootstrapCopied = copyBootstrap();

    console.log('\n✅ Vendor setup complete!');
    console.log('\n📋 Summary:');
    console.log(`  Three.js copied: ${threeCopied ? '✅' : '❌'}`);
    console.log(`  Bootstrap copied: ${bootstrapCopied ? '✅' : 'ℹ️ (will be created during patching)'}`);
    console.log('\n💡 Next steps:');
    console.log('  1. Run "npm run patch-examples" to update HTML files');
    console.log('  2. Run "npm run gen-examples-index" to create examples index');
    console.log('  3. Deploy to Heroku');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();
