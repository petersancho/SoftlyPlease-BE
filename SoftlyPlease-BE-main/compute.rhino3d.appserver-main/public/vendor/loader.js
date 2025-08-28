/**
 * Robust Three.js and Rhino3dm Loader
 * Provides local-first fallback with CDN backups
 */

// Global loading state
window.LOADER_STATE = {
  threeLoaded: false,
  orbitControlsLoaded: false,
  rhino3dmLoaded: false,
  errors: []
};

/**
 * Load Three.js with robust fallback system
 */
function loadThreeJS(callback) {
  if (window.THREE) {
    window.LOADER_STATE.threeLoaded = true;
    if (callback) callback();
    return;
  }

  const sources = [
    '/vendor/three/0.158.0/three.min.js',
    'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.158.0/three.min.js',
    'https://unpkg.com/three@0.158.0/build/three.min.js'
  ];

  loadScriptSequence(sources, 'THREE', (success, error) => {
    window.LOADER_STATE.threeLoaded = success;
    if (!success && error) {
      window.LOADER_STATE.errors.push('Three.js: ' + error.message);
      console.error('Failed to load Three.js:', error);
    }

    if (callback) callback(success, error);
  });
}

/**
 * Load OrbitControls with fallback system
 */
function loadOrbitControls(callback) {
  if (window.THREE && window.THREE.OrbitControls) {
    window.LOADER_STATE.orbitControlsLoaded = true;
    if (callback) callback();
    return;
  }

  // Wait for Three.js first
  if (!window.THREE) {
    loadThreeJS(() => loadOrbitControls(callback));
    return;
  }

  const sources = [
    '/vendor/three/0.158.0/examples/js/controls/OrbitControls.js',
    'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/js/controls/OrbitControls.js',
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.158.0/examples/js/controls/OrbitControls.js',
    'https://unpkg.com/three@0.158.0/examples/js/controls/OrbitControls.js'
  ];

  loadScriptSequence(sources, 'THREE.OrbitControls', (success, error) => {
    window.LOADER_STATE.orbitControlsLoaded = success;
    if (!success && error) {
      window.LOADER_STATE.errors.push('OrbitControls: ' + error.message);
      console.error('Failed to load OrbitControls:', error);
    }

    if (callback) callback(success, error);
  });
}

/**
 * Load Rhino3dm with fallback system
 */
function loadRhino3dm(callback) {
  if (window.rhino3dm) {
    window.LOADER_STATE.rhino3dmLoaded = true;
    if (callback) callback();
    return;
  }

  const sources = [
    'https://cdn.jsdelivr.net/npm/rhino3dm@8.17.0/rhino3dm.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/rhino3dm/8.17.0/rhino3dm.min.js',
    'https://unpkg.com/rhino3dm@8.17.0/rhino3dm.min.js'
  ];

  loadScriptSequence(sources, 'rhino3dm', (success, error) => {
    window.LOADER_STATE.rhino3dmLoaded = success;
    if (!success && error) {
      window.LOADER_STATE.errors.push('rhino3dm: ' + error.message);
      console.error('Failed to load rhino3dm:', error);
    }

    if (callback) callback(success, error);
  });
}

/**
 * Load a sequence of scripts with fallback
 */
function loadScriptSequence(sources, checkProperty, callback) {
  let index = 0;

  function tryNext() {
    if (index >= sources.length) {
      callback(false, new Error('All sources failed'));
      return;
    }

    const src = sources[index++];
    console.log(`Trying to load from: ${src}`);

    loadScript(src, (success, error) => {
      if (success) {
        console.log(`✅ Successfully loaded: ${src}`);
        callback(true);
      } else {
        console.warn(`❌ Failed to load: ${src}`, error);
        tryNext(); // Try next source
      }
    });
  }

  function loadScript(src, callback) {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;

    script.onload = () => {
      // Check if the expected property is available
      const isLoaded = checkProperty === 'THREE' ? !!window.THREE :
                      checkProperty === 'THREE.OrbitControls' ? !!(window.THREE && window.THREE.OrbitControls) :
                      checkProperty === 'rhino3dm' ? !!window.rhino3dm :
                      true; // Default to true if we can't check

      callback(isLoaded);
    };

    script.onerror = () => {
      callback(false, new Error(`Failed to load script: ${src}`));
    };

    document.head.appendChild(script);
  }

  tryNext();
}

/**
 * Load all libraries with a single call
 */
function loadAllLibraries(callback) {
  let loaded = 0;
  const total = 3;
  let errors = [];

  function onComplete(success, error) {
    loaded++;
    if (!success && error) {
      errors.push(error);
    }

    if (loaded >= total) {
      const allSuccess = errors.length === 0;
      console.log(`Library loading complete: ${allSuccess ? 'SUCCESS' : 'PARTIAL'}`);
      if (errors.length > 0) {
        console.warn('Some libraries failed to load:', errors);
      }

      if (callback) {
        callback(allSuccess, errors);
      }
    }
  }

  loadThreeJS(onComplete);
  loadOrbitControls(onComplete);
  loadRhino3dm(onComplete);
}

// Auto-load if this script is included without explicit calls
if (typeof window !== 'undefined' && !window.LIBRARIES_LOADING) {
  window.LIBRARIES_LOADING = true;
  console.log('🔄 Auto-loading Three.js, OrbitControls, and rhino3dm...');
  loadAllLibraries((success, errors) => {
    if (success) {
      console.log('✅ All libraries loaded successfully!');
      window.dispatchEvent(new CustomEvent('libraries-loaded'));
    } else {
      console.error('❌ Some libraries failed to load:', errors);
      window.dispatchEvent(new CustomEvent('libraries-load-failed', { detail: errors }));
    }
  });
}

module.exports = {
  loadThreeJS,
  loadOrbitControls,
  loadRhino3dm,
  loadAllLibraries
};
