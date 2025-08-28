<<<<<<< HEAD
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import { Rhino3dmLoader } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/loaders/3DMLoader.js';

// Bridge globals for legacy examples
window.THREE = THREE;
window.THREE.OrbitControls = OrbitControls;
window.THREE.Rhino3dmLoader = Rhino3dmLoader;

// Configure Rhino3dmLoader for wasm/worker
=======
import * as THREE_NS from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import { Rhino3dmLoader } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/loaders/3DMLoader.js';

// Create an extendable THREE global by copying the module's exports
const THREE = {};
for (const k in THREE_NS) THREE[k] = THREE_NS[k];
window.THREE = THREE;

// Attach addons to the global (legacy examples expect this)
THREE.OrbitControls = OrbitControls;
THREE.Rhino3dmLoader = Rhino3dmLoader;

// Configure the rhino3dm library path used by the loader
>>>>>>> c41033c05d4751a82a5fe6faa753e5cfe35f0d1d
const rhinoCdn = 'https://cdn.jsdelivr.net/npm/rhino3dm@8.17.0/';
const loader = new Rhino3dmLoader();
loader.setLibraryPath(rhinoCdn);
window.__rhino3dmLoader = loader;

<<<<<<< HEAD
// Announce readiness so examples can init after this loads
=======
// Let examples know the bridge is ready
>>>>>>> c41033c05d4751a82a5fe6faa753e5cfe35f0d1d
window.dispatchEvent(new CustomEvent('three-bridge-ready'));