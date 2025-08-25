import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const ViewerContainer = styled.div`
  position: relative;
  width: 100%;
  height: 400px;
  background: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #333;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(26, 26, 26, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 10;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-left-color: #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const Controls = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 5;
`;

const ControlButton = styled.button`
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.9);
    border-color: #00ff88;
  }

  &:active {
    transform: scale(0.95);
  }
`;

const PlaceholderText = styled.div`
  color: #666;
  text-align: center;
  font-size: 14px;

  h3 {
    color: #aaa;
    margin-bottom: 0.5rem;
  }

  p {
    margin: 0.25rem 0;
    font-size: 12px;
  }
`;

interface ThreeJSViewerProps {
  geometry: any;
  loading: boolean;
}

const ThreeJSViewer: React.FC<ThreeJSViewerProps> = ({ geometry, loading }) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [wireframeMode, setWireframeMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Three.js viewer
  useEffect(() => {
    if (viewerRef.current && !sceneRef.current) {
      initializeViewer();
    }

    return () => {
      cleanupViewer();
    };
  }, []);

  // Update geometry when new data arrives
  useEffect(() => {
    if (geometry && sceneRef.current && isInitialized) {
      updateGeometry(geometry);
    }
  }, [geometry, isInitialized]);

  const initializeViewer = () => {
    try {
      // Create scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a1a);
      sceneRef.current = scene;

      // Create camera
      const camera = new THREE.PerspectiveCamera(
        75,
        viewerRef.current!.clientWidth / viewerRef.current!.clientHeight,
        0.1,
        10000
      );
      camera.position.set(100, 100, 100);
      cameraRef.current = camera;

      // Create renderer
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(viewerRef.current!.clientWidth, viewerRef.current!.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      // Color space setting (using older API for compatibility)
      if ('outputColorSpace' in renderer) {
        (renderer as any).outputColorSpace = THREE.SRGBColorSpace;
      } else {
        (renderer as any).outputEncoding = THREE.sRGBEncoding;
      }
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;

      viewerRef.current!.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Add lights
      setupLighting(scene);

      // Add grid and axes helpers
      addHelpers(scene);

      // Setup controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.screenSpacePanning = false;
      controls.minDistance = 1;
      controls.maxDistance = 5000;
      controls.maxPolarAngle = Math.PI;
      controlsRef.current = controls;

      // Handle window resize
      const handleResize = () => {
        if (viewerRef.current && camera && renderer) {
          camera.aspect = viewerRef.current.clientWidth / viewerRef.current.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(viewerRef.current.clientWidth, viewerRef.current.clientHeight);
        }
      };

      window.addEventListener('resize', handleResize);

      // Start render loop
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      setIsInitialized(true);
      console.log('🚀 Three.js viewer initialized successfully');

    } catch (err) {
      console.error('Failed to initialize Three.js viewer:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const setupLighting = (scene: THREE.Scene) => {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    // Directional light (main)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    scene.add(directionalLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0x87CEEB, 0.3);
    fillLight.position.set(-100, 50, 50);
    scene.add(fillLight);

    // Rim light
    const rimLight = new THREE.DirectionalLight(0xFFE4B5, 0.2);
    rimLight.position.set(0, -100, 50);
    scene.add(rimLight);
  };

  const addHelpers = (scene: THREE.Scene) => {
    // Grid helper
    const gridHelper = new THREE.GridHelper(200, 20, 0x444444, 0x222222);
    gridHelper.position.y = 0;
    gridHelper.name = 'helper';
    scene.add(gridHelper);

    // Axes helper
    const axesHelper = new THREE.AxesHelper(50);
    axesHelper.name = 'helper';
    scene.add(axesHelper);
  };

  const updateGeometry = async (geometryData: any) => {
    if (!sceneRef.current) return;

    try {
      console.log('🔄 Updating geometry with data:', geometryData);

      // Clear existing geometry
      clearGeometry();

      if (!geometryData || geometryData.length === 0) {
        console.warn('No geometry data provided');
        return;
      }

      // Handle different geometry formats
      if (typeof geometryData === 'string') {
        // For now, create a fallback geometry
        createFallbackGeometry();
      } else {
        // Use geometry data to create objects
        createGeometryFromData(geometryData);
      }

      // Fit camera to scene
      fitCameraToScene();

    } catch (err) {
      console.error('Failed to update geometry:', err);
      setError(err instanceof Error ? err.message : 'Failed to update geometry');
    }
  };

  const createGeometryFromData = (data: any) => {
    if (!sceneRef.current) return;

    try {
      let geometry: THREE.BufferGeometry;

      if (data.type === 'box') {
        geometry = new THREE.BoxGeometry(
          data.width || 10,
          data.height || 10,
          data.depth || 10
        );
      } else if (data.type === 'sphere') {
        geometry = new THREE.SphereGeometry(data.radius || 5);
      } else if (data.type === 'cylinder') {
        geometry = new THREE.CylinderGeometry(
          data.radiusTop || 5,
          data.radiusBottom || 5,
          data.height || 10
        );
      } else if (data.type === 'mesh' && data.vertices && data.faces) {
        geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array(data.vertices.flat());
        const indices = data.faces.flat();

        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
      } else {
        geometry = new THREE.BoxGeometry(10, 10, 10);
      }

      const material = new THREE.MeshPhysicalMaterial({
        color: data.color || 0x4a90e2,
        metalness: 0.1,
        roughness: 0.4,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        transparent: false,
        opacity: 1.0,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      sceneRef.current.add(mesh);
      console.log('✅ Geometry created successfully');

    } catch (err) {
      console.error('Failed to create geometry:', err);
    }
  };

  const createFallbackGeometry = () => {
    if (!sceneRef.current) return;

    const geometry = new THREE.BoxGeometry(20, 20, 20);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff6b6b,
      transparent: true,
      opacity: 0.5
    });
    const mesh = new THREE.Mesh(geometry, material);
    sceneRef.current.add(mesh);
    console.log('⚠️ Created fallback geometry');
  };

  const clearGeometry = () => {
    if (!sceneRef.current) return;

    const objectsToRemove: THREE.Object3D[] = [];
    sceneRef.current.traverse((object) => {
      if (object instanceof THREE.Mesh && object.name !== 'helper') {
        objectsToRemove.push(object);
      }
    });

    objectsToRemove.forEach(object => {
      sceneRef.current!.remove(object);
      if (object instanceof THREE.Mesh) {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });
  };

  const fitCameraToScene = () => {
    if (!sceneRef.current || !cameraRef.current || !controlsRef.current) return;

    const box = new THREE.Box3();
    sceneRef.current.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        box.expandByObject(object);
      }
    });

    if (!box.isEmpty()) {
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = cameraRef.current.fov * (Math.PI / 180);
      const cameraDistance = Math.abs(maxDim / Math.sin(fov / 2));

      cameraRef.current.position.copy(center);
      cameraRef.current.position.z += cameraDistance * 1.5;

      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    }
  };

  const resetView = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(100, 100, 100);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const toggleWireframe = () => {
    setWireframeMode(!wireframeMode);

    sceneRef.current!.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => {
            material.wireframe = !wireframeMode;
            material.needsUpdate = true;
          });
        } else {
          object.material.wireframe = !wireframeMode;
          object.material.needsUpdate = true;
        }
      }
    });
  };

  const cleanupViewer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (rendererRef.current) {
      rendererRef.current.dispose();
    }

    if (controlsRef.current) {
      controlsRef.current.dispose();
    }

    if (sceneRef.current) {
      sceneRef.current.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });
    }
  };

  return (
    <div className="geometry-viewer">
      <ViewerContainer ref={viewerRef}>
        {loading && (
          <LoadingOverlay>
            <LoadingSpinner />
            <div>
              <strong>Computing topology optimization...</strong>
              <p>This may take a few moments</p>
            </div>
          </LoadingOverlay>
        )}

        {!geometry && !loading && isInitialized && (
          <LoadingOverlay>
            <PlaceholderText>
              <h3>3D Viewer Ready</h3>
              <p>Geometry will appear here after computation</p>
              <p>Adjust parameters to start optimization</p>
            </PlaceholderText>
          </LoadingOverlay>
        )}

        {error && (
          <LoadingOverlay>
            <div style={{ color: '#ff6b6b', textAlign: 'center' }}>
              <h3>Viewer Error</h3>
              <p>{error}</p>
              <ControlButton onClick={() => setError(null)}>
                Dismiss
              </ControlButton>
            </div>
          </LoadingOverlay>
        )}

        <Controls>
          <ControlButton onClick={resetView} title="Reset Camera View">
            Reset View
          </ControlButton>
          <ControlButton onClick={toggleWireframe} title="Toggle Wireframe Mode">
            {wireframeMode ? 'Solid' : 'Wireframe'}
          </ControlButton>
          <ControlButton onClick={fitCameraToScene} title="Fit Camera to Scene">
            Fit View
          </ControlButton>
        </Controls>
      </ViewerContainer>
    </div>
  );
};

export default ThreeJSViewer;
