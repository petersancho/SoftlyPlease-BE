const fs = require('fs');
const path = require('path');

// Simple HTML patching without cheerio
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

  fs.writeFileSync(filePath, html);
  console.log('Patched', path.basename(filePath));
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
