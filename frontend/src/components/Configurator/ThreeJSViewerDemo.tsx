import React, { useState } from 'react';
import styled from 'styled-components';

const DemoContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  background: #f8f9fa;
  border-radius: 12px;
`

const Title = styled.h1`
  text-align: center;
  color: #2c3e50;
  margin-bottom: 2rem;
  font-size: 2.5rem;
  font-weight: 700;
`

const Description = styled.p`
  text-align: center;
  color: #6c757d;
  font-size: 1.1rem;
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
`

const DemoControls = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`

const DemoButton = styled.button<{ active?: boolean }>`
  background: ${props => props.active ? '#007bff' : '#6c757d'};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;

  &:hover {
    background: ${props => props.active ? '#0056b3' : '#545b62'};
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
  }
`

const ViewerSection = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`

const Stats = styled.div`
  background: #2c3e50;
  color: white;
  padding: 1rem;
  border-radius: 8px;
  font-family: monospace;
  font-size: 0.9rem;
`

const ThreeJSViewerDemo: React.FC = () => {
  const [currentDemo, setCurrentDemo] = useState('box')
  const [loading, setLoading] = useState(false)

  // Demo geometry data
  const demoGeometries = {
    box: {
      type: 'box',
      width: 50,
      height: 30,
      depth: 20,
      color: 0x4a90e2
    },
    sphere: {
      type: 'sphere',
      radius: 25,
      color: 0x00ff88
    },
    cylinder: {
      type: 'cylinder',
      radiusTop: 20,
      radiusBottom: 20,
      height: 60,
      color: 0xff6b6b
    },
    mesh: {
      type: 'mesh',
      vertices: [
        [-25, -25, -25], [25, -25, -25], [25, 25, -25], [-25, 25, -25],
        [-25, -25, 25], [25, -25, 25], [25, 25, 25], [-25, 25, 25]
      ],
      faces: [
        [0, 1, 2], [0, 2, 3], // front
        [4, 5, 6], [4, 6, 7], // back
        [0, 1, 5], [0, 5, 4], // bottom
        [2, 3, 7], [2, 7, 6], // top
        [0, 3, 7], [0, 7, 4], // left
        [1, 2, 6], [1, 6, 5]  // right
      ],
      color: 0xf39c12
    },
    complex: [
      {
        type: 'box',
        width: 40,
        height: 20,
        depth: 15,
        color: 0x9b59b6
      },
      {
        type: 'sphere',
        radius: 12,
        color: 0x1abc9c
      },
      {
        type: 'cylinder',
        radiusTop: 8,
        radiusBottom: 8,
        height: 35,
        color: 0xe74c3c
      }
    ]
  }

  const handleDemoChange = async (demoType: string) => {
    setLoading(true)
    setCurrentDemo(demoType)

    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500))
    setLoading(false)
  }

  const getCurrentGeometry = () => {
    return demoGeometries[currentDemo as keyof typeof demoGeometries]
  }

  const getStats = () => {
    const geometry = getCurrentGeometry()
    if (Array.isArray(geometry)) {
      return `Complex Scene: ${geometry.length} objects`
    }

    const geom = geometry as any
    switch (geom.type) {
      case 'box':
        return `Box: ${geom.width}×${geom.height}×${geom.depth}`
      case 'sphere':
        return `Sphere: Radius ${geom.radius}`
      case 'cylinder':
        return `Cylinder: R=${geom.radiusTop}, H=${geom.height}`
      case 'mesh':
        return `Mesh: ${geom.vertices?.length || 0} vertices, ${geom.faces?.length || 0} faces`
      default:
        return 'Unknown geometry type'
    }
  }

  return (
    <DemoContainer>
      <Title>🚀 Three.js Viewer Demo</Title>
      <Description>
        This demo showcases the new Three.js viewer with professional 3D rendering capabilities,
        interactive camera controls, and support for various geometry formats.
      </Description>

      <DemoControls>
        {Object.keys(demoGeometries).map((demoType) => (
          <DemoButton
            key={demoType}
            active={currentDemo === demoType}
            onClick={() => handleDemoChange(demoType)}
          >
            {demoType.charAt(0).toUpperCase() + demoType.slice(1)}
          </DemoButton>
        ))}
      </DemoControls>

      <ViewerSection>
        <h2>3D Preview - {currentDemo.charAt(0).toUpperCase() + currentDemo.slice(1)}</h2>
        <div style={{
          width: '100%',
          height: '400px',
          background: '#1a1a1a',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#00ff88',
          border: '1px solid #333'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h3>🚀 Three.js Viewer</h3>
            <p>3D visualization will appear here</p>
            <p>Current demo: {getStats()}</p>
          </div>
        </div>
      </ViewerSection>

      <Stats>
        <strong>Current Demo:</strong> {getStats()}<br/>
        <strong>Features:</strong> Orbit controls, wireframe toggle, auto-fit camera<br/>
        <strong>Rendering:</strong> Physically-based materials, shadows, anti-aliasing
      </Stats>
    </DemoContainer>
  )
}

export default ThreeJSViewerDemo
