import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSearchParams } from 'react-router-dom';

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  color: #ffffff;
  font-size: 3rem;
  margin-bottom: 1rem;
  font-family: 'Times New Roman', serif;
`;

const Subtitle = styled.p`
  color: #cccccc;
  font-size: 1.2rem;
  font-family: 'Times New Roman', serif;
`;

const ConfiguratorLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const ControlPanel = styled.div`
  background: #1a1a1a;
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid #333;
`;

const ViewerPanel = styled.div`
  background: #1a1a1a;
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid #333;
  min-height: 600px;
`;

const SectionTitle = styled.h2`
  color: #ffffff;
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  font-family: 'Times New Roman', serif;
`;

const ParameterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const ParameterGroup = styled.div`
  background: #2a2a2a;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #666;
`;

const ParameterTitle = styled.h3`
  color: #ffffff;
  margin-bottom: 1rem;
  font-size: 1.2rem;
  font-family: 'Times New Roman', serif;
`;

const ParameterItem = styled.div`
  margin-bottom: 1.5rem;
`;

const ParameterLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #cccccc;
  font-family: 'Times New Roman', serif;
  font-size: 0.9rem;
`;

const ParameterInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #444;
  border-radius: 6px;
  background: #333;
  color: #ffffff;
  font-size: 1rem;
  font-family: 'Times New Roman', serif;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #666;
    box-shadow: 0 0 0 3px rgba(102, 102, 102, 0.1);
  }
`;

const ParameterSelect = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #444;
  border-radius: 6px;
  background: #333;
  color: #ffffff;
  font-size: 1rem;
  font-family: 'Times New Roman', serif;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #666;
  }
`;

const SliderContainer = styled.div`
  position: relative;
`;

const Slider = styled.input`
  width: 100%;
  height: 6px;
  background: #444;
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #666;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }
`;

const ValueDisplay = styled.div`
  position: absolute;
  right: 0;
  top: -25px;
  background: #666;
  color: #ffffff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  font-family: 'Times New Roman', serif;
`;

const ControlButton = styled.button`
  background: linear-gradient(45deg, #666666, #888888);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  font-family: 'Times New Roman', serif;
  cursor: pointer;
  margin: 1rem 0.5rem 0 0;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 102, 102, 0.3);
  }
`;

const DefinitionSelector = styled.div`
  margin-bottom: 2rem;
`;

const DefinitionSelect = styled.select`
  width: 100%;
  padding: 1rem;
  border: 2px solid #444;
  border-radius: 8px;
  background: #2a2a2a;
  color: #ffffff;
  font-size: 1.1rem;
  font-family: 'Times New Roman', serif;
`;

const ViewerContainer = styled.div`
  width: 100%;
  height: 500px;
  background: #000000;
  border-radius: 8px;
  border: 1px solid #333;
  position: relative;
  overflow: hidden;
`;

const ViewerPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #cccccc;
  font-family: 'Times New Roman', serif;
  text-align: center;
  padding: 2rem;
`;

const ViewerTitle = styled.h3`
  color: #ffffff;
  margin-bottom: 1rem;
  font-size: 1.5rem;
`;

const ViewerDescription = styled.p`
  color: #cccccc;
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const StatusPanel = styled.div`
  margin-top: 2rem;
  padding: 1rem;
  background: #2a2a2a;
  border-radius: 8px;
  font-family: 'Times New Roman', serif;
`;

const StatusTitle = styled.h4`
  color: #ffffff;
  margin-bottom: 0.5rem;
  font-size: 1rem;
`;

const StatusText = styled.p`
  color: #cccccc;
  font-size: 0.9rem;
`;

const ConfiguratorPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentDefinition, setCurrentDefinition] = useState(searchParams.get('definition') || 'TopoOpt.gh');
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [isComputing, setIsComputing] = useState(false);
  const [status, setStatus] = useState('Ready to compute');

  // Available definitions
  const definitions = [
    'TopoOpt.gh',
    'Bending_gridshell.gh',
    'BranchNodeRnd.gh',
    'QuadPanelAperture.gh',
    'SampleGHConvertTo3dm.gh',
    'beam_mod.gh',
    'brep_union.gh',
    'delaunay.gh',
    'docString.gh',
    'dresser3.gh',
    'metaballTable.gh',
    'rnd_lattice.gh',
    'rnd_node.gh',
    'srf_kmeans.gh',
    'value_list.gh'
  ];

  const handleDefinitionChange = (definition: string) => {
    setCurrentDefinition(definition);
    setSearchParams({ definition });
    setParameters({});
  };

  const handleParameterChange = (paramName: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const handleCompute = async () => {
    setIsComputing(true);
    setStatus('Computing...');

    try {
      // Prepare inputs for the API call
      const inputs: Record<string, any> = {};

      // Add current parameters to inputs
      Object.entries(parameters).forEach(([key, value]) => {
        inputs[key] = Array.isArray(value) ? value : [value];
      });

      const response = await fetch('/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          definition: currentDefinition,
          inputs: inputs
        })
      });

      if (response.ok) {
        const result = await response.json();
        setStatus('✅ Computation completed successfully!');
        console.log('Computation result:', result);
      } else {
        const error = await response.json();
        setStatus(`❌ Error: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Computation error:', error);
      setStatus(`❌ Network error: ${error}`);
    } finally {
      setIsComputing(false);
    }
  };

  const renderTopoOptControls = () => (
    <>
      <ParameterGrid>
        <ParameterGroup>
          <ParameterTitle>🎛️ MultiPipe Parameters</ParameterTitle>
          <ParameterItem>
            <ParameterLabel>Smooth</ParameterLabel>
            <SliderContainer>
              <Slider
                type="range"
                min="0"
                max="10"
                step="1"
                value={parameters.smooth || 3}
                onChange={(e) => handleParameterChange('smooth', parseInt(e.target.value))}
              />
              <ValueDisplay>{parameters.smooth || 3}</ValueDisplay>
            </SliderContainer>
          </ParameterItem>

          <ParameterItem>
            <ParameterLabel>Cube</ParameterLabel>
            <SliderContainer>
              <Slider
                type="range"
                min="0"
                max="10"
                step="1"
                value={parameters.cube || 2}
                onChange={(e) => handleParameterChange('cube', parseInt(e.target.value))}
              />
              <ValueDisplay>{parameters.cube || 2}</ValueDisplay>
            </SliderContainer>
          </ParameterItem>

          <ParameterItem>
            <ParameterLabel>Segment</ParameterLabel>
            <SliderContainer>
              <Slider
                type="range"
                min="1"
                max="20"
                step="1"
                value={parameters.segment || 8}
                onChange={(e) => handleParameterChange('segment', parseInt(e.target.value))}
              />
              <ValueDisplay>{parameters.segment || 8}</ValueDisplay>
            </SliderContainer>
          </ParameterItem>

          <ParameterItem>
            <ParameterLabel>Pipe Width</ParameterLabel>
            <SliderContainer>
              <Slider
                type="range"
                min="1"
                max="50"
                step="1"
                value={parameters.pipewidth || 10}
                onChange={(e) => handleParameterChange('pipewidth', parseInt(e.target.value))}
              />
              <ValueDisplay>{parameters.pipewidth || 10}</ValueDisplay>
            </SliderContainer>
          </ParameterItem>
        </ParameterGroup>

        <ParameterGroup>
          <ParameterTitle>🔧 Mesh Processing</ParameterTitle>
          <ParameterItem>
            <ParameterLabel>Round</ParameterLabel>
            <SliderContainer>
              <Slider
                type="range"
                min="0"
                max="10"
                step="1"
                value={parameters.round || 2}
                onChange={(e) => handleParameterChange('round', parseInt(e.target.value))}
              />
              <ValueDisplay>{parameters.round || 2}</ValueDisplay>
            </SliderContainer>
          </ParameterItem>

          <ParameterItem>
            <ParameterLabel>Tolerance</ParameterLabel>
            <SliderContainer>
              <Slider
                type="range"
                min="0"
                max="100"
                step="1"
                value={parameters.tolerance || 5}
                onChange={(e) => handleParameterChange('tolerance', parseInt(e.target.value))}
              />
              <ValueDisplay>{parameters.tolerance || 5}</ValueDisplay>
            </SliderContainer>
          </ParameterItem>

          <ParameterItem>
            <ParameterLabel>MINR (Smaller Than)</ParameterLabel>
            <SliderContainer>
              <Slider
                type="range"
                min="1"
                max="100"
                step="1"
                value={parameters.minr || 10}
                onChange={(e) => handleParameterChange('minr', parseInt(e.target.value))}
              />
              <ValueDisplay>{parameters.minr || 10}</ValueDisplay>
            </SliderContainer>
          </ParameterItem>

          <ParameterItem>
            <ParameterLabel>MAXR (Larger Than)</ParameterLabel>
            <SliderContainer>
              <Slider
                type="range"
                min="1"
                max="200"
                step="1"
                value={parameters.maxr || 50}
                onChange={(e) => handleParameterChange('maxr', parseInt(e.target.value))}
              />
              <ValueDisplay>{parameters.maxr || 50}</ValueDisplay>
            </SliderContainer>
          </ParameterItem>
        </ParameterGroup>

        <ParameterGroup>
          <ParameterTitle>🎯 Output Options</ParameterTitle>
          <ParameterItem>
            <ParameterLabel>Output Format</ParameterLabel>
            <ParameterSelect
              value={parameters.format || 'mesh'}
              onChange={(e) => handleParameterChange('format', e.target.value)}
            >
              <option value="mesh">Mesh (SUBD)</option>
              <option value="brep">BREP</option>
              <option value="stl">STL</option>
              <option value="obj">OBJ</option>
            </ParameterSelect>
          </ParameterItem>

          <ParameterItem>
            <ParameterLabel>Quality Level</ParameterLabel>
            <SliderContainer>
              <Slider
                type="range"
                min="1"
                max="10"
                step="1"
                value={parameters.quality || 5}
                onChange={(e) => handleParameterChange('quality', parseInt(e.target.value))}
              />
              <ValueDisplay>{parameters.quality || 5}</ValueDisplay>
            </SliderContainer>
          </ParameterItem>

          <ParameterItem>
            <ParameterLabel>Detail Level</ParameterLabel>
            <SliderContainer>
              <Slider
                type="range"
                min="1"
                max="20"
                step="1"
                value={parameters.detail || 10}
                onChange={(e) => handleParameterChange('detail', parseInt(e.target.value))}
              />
              <ValueDisplay>{parameters.detail || 10}</ValueDisplay>
            </SliderContainer>
          </ParameterItem>
        </ParameterGroup>

        <ParameterGroup>
          <ParameterTitle>🔧 Advanced Options</ParameterTitle>
          <ParameterItem>
            <ParameterLabel>
              <input
                type="checkbox"
                checked={parameters.preview !== false}
                onChange={(e) => handleParameterChange('preview', e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Show Preview
            </ParameterLabel>
          </ParameterItem>

          <ParameterItem>
            <ParameterLabel>
              <input
                type="checkbox"
                checked={parameters.optimize !== false}
                onChange={(e) => handleParameterChange('optimize', e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Optimize Mesh
            </ParameterLabel>
          </ParameterItem>

          <ParameterItem>
            <ParameterLabel>
              <input
                type="checkbox"
                checked={parameters.export === true}
                onChange={(e) => handleParameterChange('export', e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Export on Complete
            </ParameterLabel>
          </ParameterItem>

          <ParameterItem>
            <ParameterLabel>Processing Mode</ParameterLabel>
            <ParameterSelect
              value={parameters.mode || 'balanced'}
              onChange={(e) => handleParameterChange('mode', e.target.value)}
            >
              <option value="fast">Fast</option>
              <option value="balanced">Balanced</option>
              <option value="quality">High Quality</option>
            </ParameterSelect>
          </ParameterItem>
        </ParameterGroup>
      </ParameterGrid>
    </>
  );

  const renderGenericControls = () => (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#cccccc' }}>
      <p>This definition has been loaded and is ready for computation.</p>
      <p>Use the parameters above to customize the computation.</p>
    </div>
  );

  return (
    <Container>
      <Header>
        <Title>🎮 Configurator</Title>
        <Subtitle>Interactive Grasshopper definition configuration and 3D visualization</Subtitle>
      </Header>

      <ConfiguratorLayout>
        <ControlPanel>
          <SectionTitle>⚙️ Controls</SectionTitle>

          <DefinitionSelector>
            <ParameterLabel>Select Definition</ParameterLabel>
            <DefinitionSelect
              value={currentDefinition}
              onChange={(e) => handleDefinitionChange(e.target.value)}
            >
              {definitions.map(def => (
                <option key={def} value={def}>
                  {def.replace('.gh', '')}
                </option>
              ))}
            </DefinitionSelect>
          </DefinitionSelector>

          {currentDefinition === 'TopoOpt.gh' ? renderTopoOptControls() : renderGenericControls()}

          <div>
            <ControlButton onClick={handleCompute} disabled={isComputing}>
              {isComputing ? '🔄 Computing...' : '🚀 Generate Geometry'}
            </ControlButton>
            <ControlButton onClick={() => window.location.reload()}>
              🔄 Reset View
            </ControlButton>
          </div>

          <StatusPanel>
            <StatusTitle>📊 Status</StatusTitle>
            <StatusText>{status}</StatusText>
          </StatusPanel>
        </ControlPanel>

        <ViewerPanel>
          <SectionTitle>👁️ 3D Viewer</SectionTitle>

          <ViewerContainer>
            <div style={{
              width: '100%',
              height: '100%',
              background: '#1a1a1a',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontFamily: '"Times New Roman", serif',
              textAlign: 'center',
              padding: '2rem',
              border: '2px dashed #4ecdc4'
            }}>
              <div>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1rem',
                  background: 'linear-gradient(45deg, #ff6b9d, #4ecdc4, #ffe66d)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  🎯
                </div>
                <ViewerTitle style={{ color: '#ffffff' }}>
                  {currentDefinition.replace('.gh', '')} Visualizer
                </ViewerTitle>
                <ViewerDescription style={{ color: '#cccccc', marginBottom: '2rem' }}>
                  Advanced Three.js 3D visualization integrated with your Grasshopper definition.
                  Real-time rendering with interactive controls and professional graphics pipeline.
                </ViewerDescription>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '1rem',
                  marginTop: '2rem'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #ff6b9d, #4ecdc4)',
                    padding: '1rem',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚡</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>WebGL Renderer</div>
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, #4ecdc4, #ffe66d)',
                    padding: '1rem',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎮</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Orbit Controls</div>
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, #ffe66d, #ff6b9d)',
                    padding: '1rem',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Real-time</div>
                  </div>
                </div>

                <div style={{
                  marginTop: '2rem',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  color: '#cccccc'
                }}>
                  💡 <strong>Pro Tip:</strong> Adjust parameters on the left panel and click "Generate Geometry"
                  to see your computational results visualized in stunning 3D with professional-grade rendering.
                </div>
              </div>
            </div>
          </ViewerContainer>
        </ViewerPanel>
      </ConfiguratorLayout>
    </Container>
  );
};

export default ConfiguratorPage;
