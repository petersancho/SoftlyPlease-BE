const fs = require('fs');
const path = require('path');

const root = path.join(process.cwd(), 'src', 'examples');

// Get all directories in examples folder
function getExampleDirs() {
  if (!fs.existsSync(root)) {
    console.error('Examples directory not found:', root);
    process.exit(1);
  }

  const items = fs.readdirSync(root, { withFileTypes: true });
  const dirs = items
    .filter(item => item.isDirectory())
    .map(item => item.name)
    .sort();

  return dirs;
}

function generateIndexHTML(dirs) {
  const links = dirs.map(dir => `    <li><a href="${dir}/">${dir}</a></li>`).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rhino Compute Examples</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2c5530;
      border-bottom: 3px solid #8fbc8f;
      padding-bottom: 0.5rem;
    }
    ul {
      list-style: none;
      padding: 0;
    }
    li {
      margin: 0.5rem 0;
      padding: 0.5rem;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    li:hover {
      background-color: #f0f8f0;
    }
    a {
      text-decoration: none;
      color: #2c5530;
      font-weight: 500;
      display: block;
    }
    a:hover {
      color: #1a331e;
    }
    .count {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🐘 Rhino Compute Grasshopper Examples</h1>
    <p class="count">Found ${dirs.length} example${dirs.length !== 1 ? 's' : ''}</p>
    <ul>
${links}
    </ul>
    <p style="margin-top: 2rem; color: #666; font-size: 0.9rem;">
      These examples demonstrate how to use Rhino Compute with Grasshopper definitions.
      Each example includes interactive 3D viewers and parameter controls.
    </p>
  </div>
</body>
</html>`;

  return html;
}

function main() {
  const dirs = getExampleDirs();
  const html = generateIndexHTML(dirs);

  const indexPath = path.join(root, 'index.html');
  fs.writeFileSync(indexPath, html);

  console.log(`✅ Generated examples/index.html with ${dirs.length} entries:`);
  dirs.forEach(dir => console.log(`  - ${dir}`));
}

main();
