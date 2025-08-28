import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import { Rhino3dmLoader } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/loaders/3DMLoader.js';

// Bridge globals for legacy examples
window.THREE = THREE;
window.THREE.OrbitControls = OrbitControls;
window.THREE.Rhino3dmLoader = Rhino3dmLoader;

// Configure Rhino3dmLoader for wasm/worker
const rhinoCdn = 'https://cdn.jsdelivr.net/npm/rhino3dm@8.17.0/';
const loader = new Rhino3dmLoader();
loader.setLibraryPath(rhinoCdn);
window.__rhino3dmLoader = loader;

// Announce readiness so examples can init after this loads
window.dispatchEvent(new CustomEvent('three-bridge-ready'));