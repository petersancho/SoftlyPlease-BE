// ESM bootstrap that re-exports Three.js and helpers for legacy examples
// IMPORTANT: import via the page's import map alias "three" to avoid duplicate instances
import * as THREE_NS from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Rhino3dmLoader } from 'three/examples/jsm/loaders/3DMLoader';

// Create an extensible copy so we can attach helpers without mutating the frozen module namespace
const THREE = {};
for (const key in THREE_NS) THREE[key] = THREE_NS[key];
window.THREE = THREE;

// Attach helpers expected by legacy scripts
THREE.OrbitControls = OrbitControls;
THREE.Rhino3dmLoader = Rhino3dmLoader;

// Prepare a shared Rhino3dmLoader instance (wasm base from CDN)
const loader = new Rhino3dmLoader();
loader.setLibraryPath('https://cdn.jsdelivr.net/npm/rhino3dm@8.17.0/');
window.__rhino3dmLoader = loader;

// Signal readiness
window.dispatchEvent(new CustomEvent('three-bridge-ready'));

