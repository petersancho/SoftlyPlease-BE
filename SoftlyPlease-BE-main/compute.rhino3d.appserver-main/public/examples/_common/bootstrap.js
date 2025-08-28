import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import { Rhino3dmLoader } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/loaders/3DMLoader.js';

// Bridge for legacy code that expects globals
window.THREE = THREE;
window.THREE.OrbitControls = OrbitControls;
window.THREE.Rhino3dmLoader = Rhino3dmLoader;

// Configure Rhino3dmLoader to find the wasm/worker
const rhinoCdn = 'https://cdn.jsdelivr.net/npm/rhino3dm@8.17.0/';
const loader = new Rhino3dmLoader();
loader.setLibraryPath(rhinoCdn);
window.__rhino3dmLoader = loader;

// Dispatch ready event so examples can wait before init
window.dispatchEvent(new CustomEvent('three-bridge-ready'));

// Add error handling banner
window.addEventListener('load', () => {
  setTimeout(() => {
    if (!window.THREE) {
      const banner = document.createElement('div');
      banner.id = 'three-error-banner';
      banner.innerHTML = `
        <div style="
          position: fixed;
          top: 10px;
          right: 10px;
          background: #fee;
          color: #900;
          padding: 12px 16px;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          font: 14px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          max-width: 300px;
          z-index: 10000;
          border-left: 4px solid #900;
        ">
          <strong>3D Viewer Error</strong><br>
          Failed to load Three.js libraries. Please check your internet connection or disable content blockers and refresh the page.
          <button onclick="this.parentElement.remove()" style="
            margin-left: 8px;
            background: none;
            border: none;
            color: #900;
            cursor: pointer;
            font-weight: bold;
          ">×</button>
        </div>
      `;
      document.body.appendChild(banner);

      // Log error to server
      fetch('/client-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'three-js-load-failure',
          message: 'Three.js libraries failed to load',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      }).catch(e => console.warn('Failed to log error:', e));
    }
  }, 5000); // Wait 5 seconds before showing banner
});

console.log('✅ Three.js ES module bridge ready');
