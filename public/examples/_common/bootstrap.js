// ESM bootstrap for three.js and Rhino3dmLoader
// Use local Three.js files to avoid CDN module resolution issues
import * as THREE_NS from '/vendor/three/three.module.js';
import { OrbitControls } from '/vendor/three/OrbitControls.js';
import { Rhino3dmLoader } from '/vendor/three/3DMLoader.js';

const THREE = {};
for (const k in THREE_NS) THREE[k] = THREE_NS[k];
window.THREE = THREE;

THREE.OrbitControls = OrbitControls;
THREE.Rhino3dmLoader = Rhino3dmLoader;

const loader = new Rhino3dmLoader();
loader.setLibraryPath('https://cdn.jsdelivr.net/npm/rhino3dm@8.17.0/');
window.__rhino3dmLoader = loader;

// Announce readiness so examples can init after this loads
window.dispatchEvent(new CustomEvent('three-bridge-ready'));