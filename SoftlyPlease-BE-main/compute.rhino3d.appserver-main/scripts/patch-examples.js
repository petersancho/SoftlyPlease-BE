const fg = require('fast-glob');
const fs = require('fs');
const path = require('path');

// Simple HTML manipulation without cheerio
function patchHTML(html, filename) {
  let patched = html;

  // Remove existing rhino3dm scripts
  patched = patched.replace(/<script[^>]*rhino3dm[^>]*><\/script>/gi, '');

  // Add pinned rhino3dm script at the beginning of head
  const rhinoScript = '<script async src="https://cdn.jsdelivr.net/npm/rhino3dm@8.17.0/rhino3dm.min.js"></script>';
  if (!patched.includes('rhino3dm@8.17.0')) {
    patched = patched.replace(/(<head[^>]*>)/i, '$1\n  ' + rhinoScript);
  }

  // Add ES module bootstrap
  const bootstrapScript = '<script type="module" src="/examples/_common/bootstrap.js"></script>';
  if (!patched.includes('bootstrap.js')) {
    patched = patched.replace(/(<\/head>)/i, '  ' + bootstrapScript + '\n$1');
  }

  // Remove legacy three.js script tags
  patched = patched.replace(/<script[^>]*three(\.min)?\.js[^>]*><\/script>/gi, '');

  // Add init wrapper script if not present
  const initWrapper = `<script>
  if (!window.THREE) {
    window.addEventListener('three-bridge-ready', () => {
      if (window.init && !window.__initCalled) {
        window.__initCalled = true;
        window.init();
      }
    }, { once: true });
  } else {
    if (window.init && !window.__initCalled) {
      window.__initCalled = true;
      window.init();
    }
  }
</script>`;

  if (!patched.includes('three-bridge-ready') && patched.includes('function init') || patched.includes('init()')) {
    patched = patched.replace(/(<\/body>)/i, '  ' + initWrapper + '\n$1');
  }

  return patched;
}

async function main() {
  const root = path.resolve(process.cwd(), 'src', 'examples');
  console.log('Scanning examples directory:', root);

  if (!fs.existsSync(root)) {
    console.error('Examples directory not found:', root);
    process.exit(1);
  }

  const files = await fg(['**/*.html'], { cwd: root, dot: false });

  console.log(`Found ${files.length} HTML files to patch`);

  for (const rel of files) {
    const full = path.join(root, rel);
    const html = fs.readFileSync(full, 'utf8');
    const patched = patchHTML(html, rel);

    if (patched !== html) {
      fs.writeFileSync(full, patched);
      console.log('✅ Patched', rel);
    } else {
      console.log('⚪ No changes needed for', rel);
    }
  }

  console.log('🎉 Example patching complete!');
}

main().catch(console.error);
