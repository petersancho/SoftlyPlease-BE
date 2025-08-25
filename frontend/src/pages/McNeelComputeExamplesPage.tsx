import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSearchParams } from 'react-router-dom';

const Container = styled.div`
  max-width: 1200px;
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

const ExplorerLayout = styled.div`
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
  border-left: 4px solid #4ecdc4;
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
    border-color: #4ecdc4;
    box-shadow: 0 0 0 3px rgba(78, 205, 196, 0.1);
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
    background: #4ecdc4;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }
`;

const ValueDisplay = styled.div`
  position: absolute;
  right: 0;
  top: -25px;
  background: #4ecdc4;
  color: #000000;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  font-family: 'Times New Roman', serif;
`;

const ControlButton = styled.button`
  background: linear-gradient(45deg, #ff6b9d, #4ecdc4);
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
    box-shadow: 0 5px 15px rgba(255, 107, 157, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
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

const TutorialSection = styled.div`
  background: #1a1a1a;
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid #333;
  margin-bottom: 2rem;
`;

const TutorialTitle = styled.h3`
  color: #ffffff;
  margin-bottom: 1rem;
  font-size: 1.3rem;
  font-family: 'Times New Roman', serif;
`;

const TutorialContent = styled.div`
  color: #cccccc;
  font-family: 'Times New Roman', serif;
  line-height: 1.6;
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

const ExamplesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const ExampleCard = styled.div`
  background: #1a1a1a;
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid #333;
  transition: all 0.3s ease;

  &:hover {
    border-color: #666;
    transform: translateY(-2px);
  }
`;

const ExampleTitle = styled.h3`
  color: #ffffff;
  margin-bottom: 1rem;
  font-size: 1.3rem;
  font-family: 'Times New Roman', serif;
`;

const ExampleDescription = styled.p`
  color: #cccccc;
  margin-bottom: 1.5rem;
  font-family: 'Times New Roman', serif;
  line-height: 1.6;
`;

const ExampleButton = styled.a`
  background: linear-gradient(45deg, #666666, #888888);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Times New Roman', serif;
  display: inline-block;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 102, 102, 0.3);
  }
`;

const McNeelComputeExamplesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentDefinition, setCurrentDefinition] = useState(searchParams.get('definition') || 'Bending_gridshell.gh');
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [isComputing, setIsComputing] = useState(false);
  const [status, setStatus] = useState('Ready to explore');
  const [definitions] = useState([
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
  ]);

  const handleDefinitionChange = (definition: string) => {
    setCurrentDefinition(definition);
    setSearchParams({ definition });
    setParameters({});
    setStatus(`Selected: ${definition.replace('.gh', '')}`);
  };

  const handleParameterChange = (paramName: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [paramName]: value
    }));
    setStatus(`Parameter updated: ${paramName} = ${value}`);
  };

  const handleCompute = async () => {
    setIsComputing(true);
    setStatus('Computing...');

    try {
      const inputs: Record<string, any> = {};
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

  const renderParameterControls = () => {
    switch (currentDefinition) {
      case 'Bending_gridshell.gh':
        return (
          <>
            <ParameterGroup>
              <ParameterTitle>🏗️ Grid Shell Parameters</ParameterTitle>
              <ParameterItem>
                <ParameterLabel>Grid Size</ParameterLabel>
                <SliderContainer>
                  <Slider
                    type="range"
                    min="5"
                    max="20"
                    step="1"
                    value={parameters.gridSize || 10}
                    onChange={(e) => handleParameterChange('gridSize', parseInt(e.target.value))}
                  />
                  <ValueDisplay>{parameters.gridSize || 10}</ValueDisplay>
                </SliderContainer>
              </ParameterItem>

              <ParameterItem>
                <ParameterLabel>Thickness</ParameterLabel>
                <SliderContainer>
                  <Slider
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={parameters.thickness || 0.5}
                    onChange={(e) => handleParameterChange('thickness', parseFloat(e.target.value))}
                  />
                  <ValueDisplay>{parameters.thickness || 0.5}</ValueDisplay>
                </SliderContainer>
              </ParameterItem>

              <ParameterItem>
                <ParameterLabel>Bend Angle</ParameterLabel>
                <SliderContainer>
                  <Slider
                    type="range"
                    min="0"
                    max="90"
                    step="5"
                    value={parameters.bendAngle || 30}
                    onChange={(e) => handleParameterChange('bendAngle', parseInt(e.target.value))}
                  />
                  <ValueDisplay>{parameters.bendAngle || 30}°</ValueDisplay>
                </SliderContainer>
              </ParameterItem>
            </ParameterGroup>
          </>
        );

      case 'delaunay.gh':
        return (
          <>
            <ParameterGroup>
              <ParameterTitle>📐 Mesh Generation</ParameterTitle>
              <ParameterItem>
                <ParameterLabel>Points</ParameterLabel>
                <ParameterInput
                  type="number"
                  placeholder="Number of points"
                  value={parameters.points || 20}
                  onChange={(e) => handleParameterChange('points', parseInt(e.target.value))}
                />
              </ParameterItem>

              <ParameterItem>
                <ParameterLabel>Influence Radius</ParameterLabel>
                <SliderContainer>
                  <Slider
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={parameters.radius || 10}
                    onChange={(e) => handleParameterChange('radius', parseInt(e.target.value))}
                  />
                  <ValueDisplay>{parameters.radius || 10}</ValueDisplay>
                </SliderContainer>
              </ParameterItem>
            </ParameterGroup>
          </>
        );

      case 'beam_mod.gh':
        return (
          <>
            <ParameterGroup>
              <ParameterTitle>⚡ Beam Analysis</ParameterTitle>
              <ParameterItem>
                <ParameterLabel>Length</ParameterLabel>
                <SliderContainer>
                  <Slider
                    type="range"
                    min="100"
                    max="1000"
                    step="10"
                    value={parameters.length || 500}
                    onChange={(e) => handleParameterChange('length', parseInt(e.target.value))}
                  />
                  <ValueDisplay>{parameters.length || 500}mm</ValueDisplay>
                </SliderContainer>
              </ParameterItem>

              <ParameterItem>
                <ParameterLabel>Width</ParameterLabel>
                <SliderContainer>
                  <Slider
                    type="range"
                    min="20"
                    max="200"
                    step="5"
                    value={parameters.width || 50}
                    onChange={(e) => handleParameterChange('width', parseInt(e.target.value))}
                  />
                  <ValueDisplay>{parameters.width || 50}mm</ValueDisplay>
                </SliderContainer>
              </ParameterItem>

              <ParameterItem>
                <ParameterLabel>Height</ParameterLabel>
                <SliderContainer>
                  <Slider
                    type="range"
                    min="20"
                    max="200"
                    step="5"
                    value={parameters.height || 100}
                    onChange={(e) => handleParameterChange('height', parseInt(e.target.value))}
                  />
                  <ValueDisplay>{parameters.height || 100}mm</ValueDisplay>
                </SliderContainer>
              </ParameterItem>
            </ParameterGroup>
          </>
        );

      case 'metaballTable.gh':
        return (
          <>
            <ParameterGroup>
              <ParameterTitle>💎 Organic Forms</ParameterTitle>
              <ParameterItem>
                <ParameterLabel>Resolution</ParameterLabel>
                <SliderContainer>
                  <Slider
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={parameters.resolution || 50}
                    onChange={(e) => handleParameterChange('resolution', parseInt(e.target.value))}
                  />
                  <ValueDisplay>{parameters.resolution || 50}</ValueDisplay>
                </SliderContainer>
              </ParameterItem>

              <ParameterItem>
                <ParameterLabel>Threshold</ParameterLabel>
                <SliderContainer>
                  <Slider
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={parameters.threshold || 0.5}
                    onChange={(e) => handleParameterChange('threshold', parseFloat(e.target.value))}
                  />
                  <ValueDisplay>{parameters.threshold || 0.5}</ValueDisplay>
                </SliderContainer>
              </ParameterItem>

              <ParameterItem>
                <ParameterLabel>Scale</ParameterLabel>
                <SliderContainer>
                  <Slider
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={parameters.scale || 1.0}
                    onChange={(e) => handleParameterChange('scale', parseFloat(e.target.value))}
                  />
                  <ValueDisplay>{parameters.scale || 1.0}x</ValueDisplay>
                </SliderContainer>
              </ParameterItem>
            </ParameterGroup>
          </>
        );

      default:
        return (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#cccccc' }}>
            <p>This definition has been loaded and is ready for computation.</p>
            <p>Use the parameters above to customize the computation.</p>
            <p>Generic parameters will be applied if specific ones aren't available.</p>
          </div>
        );
    }
  };

  const getDefinitionInfo = (def: string) => {
    const info: Record<string, { title: string; description: string; icon: string }> = {
      'Bending_gridshell.gh': {
        title: '🏗️ Bending Gridshell',
        description: 'Parametric gridshell generation with bending analysis and form-finding algorithms. Explore complex curved surfaces and structural optimization.',
        icon: '🏗️'
      },
      'BranchNodeRnd.gh': {
        title: '🔗 Branch Node Randomization',
        description: 'Dynamic branching systems with procedural node placement and connection algorithms. Ideal for studying network topologies.',
        icon: '🔗'
      },
      'QuadPanelAperture.gh': {
        title: '🏠 Quad Panel Aperture',
        description: 'Adaptive facade systems with customizable panel patterns and aperture optimization for building envelopes.',
        icon: '🏠'
      },
      'SampleGHConvertTo3dm.gh': {
        title: '🔄 Format Conversion',
        description: 'Data conversion workflows between different formats and computational methods for interoperability.',
        icon: '🔄'
      },
      'beam_mod.gh': {
        title: '⚡ Beam Modification',
        description: 'Structural beam optimization with load analysis and material property adjustments.',
        icon: '⚡'
      },
      'brep_union.gh': {
        title: '🔧 BREP Union',
        description: 'Boolean operations and solid modeling techniques for complex geometry creation.',
        icon: '🔧'
      },
      'delaunay.gh': {
        title: '📐 Delaunay Mesh',
        description: 'Triangulation algorithms and mesh generation techniques for spatial analysis.',
        icon: '📐'
      },
      'docString.gh': {
        title: '📝 Documentation String',
        description: 'Automated documentation generation and metadata extraction from Grasshopper files.',
        icon: '📝'
      },
      'dresser3.gh': {
        title: '🪑 Furniture Design',
        description: 'Parametric furniture generation with ergonomic considerations and manufacturing constraints.',
        icon: '🪑'
      },
      'metaballTable.gh': {
        title: '💎 Metaball Table',
        description: 'Organic form generation using metaball algorithms and implicit surface modeling.',
        icon: '💎'
      },
      'rnd_lattice.gh': {
        title: '🌐 Random Lattice',
        description: 'Stochastic lattice generation with customizable density and connectivity parameters.',
        icon: '🌐'
      },
      'rnd_node.gh': {
        title: '🎲 Random Node',
        description: 'Node placement algorithms with spatial constraints and distribution controls.',
        icon: '🎲'
      },
      'srf_kmeans.gh': {
        title: '📊 Surface K-means',
        description: 'Clustering algorithms applied to surface analysis and point cloud processing.',
        icon: '📊'
      },
      'value_list.gh': {
        title: '🎛️ Value List',
        description: 'Dynamic list manipulation and data structure operations for complex workflows.',
        icon: '🎛️'
      }
    };
    return info[def] || { title: def.replace('.gh', ''), description: 'Custom parametric definition', icon: '🔧' };
  };

  return (
    <Container>
      <Header>
        <Title>🧩 McNeel Compute Examples</Title>
        <Subtitle>Interactive Grasshopper definition explorer - Deploy your own .gh files on the web</Subtitle>
      </Header>

      <ExplorerLayout>
        <ControlPanel>
          <SectionTitle>🎛️ Definition Explorer</SectionTitle>

          <DefinitionSelector>
            <ParameterLabel>Select Grasshopper Definition</ParameterLabel>
            <DefinitionSelect
              value={currentDefinition}
              onChange={(e) => handleDefinitionChange(e.target.value)}
            >
              {definitions.map(def => {
                const info = getDefinitionInfo(def);
                return (
                  <option key={def} value={def}>
                    {info.icon} {def.replace('.gh', '')}
                  </option>
                );
              })}
            </DefinitionSelect>
          </DefinitionSelector>

          <ParameterGrid>
            {renderParameterControls()}
          </ParameterGrid>

          <div>
            <ControlButton onClick={handleCompute} disabled={isComputing}>
              {isComputing ? '🔄 Computing...' : '🚀 Generate Geometry'}
            </ControlButton>
            <ControlButton onClick={() => window.location.reload()}>
              🔄 Reset Parameters
            </ControlButton>
          </div>

          <StatusPanel>
            <StatusTitle>📊 Status</StatusTitle>
            <StatusText>{status}</StatusText>
          </StatusPanel>
        </ControlPanel>

        <ViewerPanel>
          <SectionTitle>👁️ Results Viewer</SectionTitle>

          <ViewerContainer>
            <div style={{
              width: '100%',
              height: '100%',
              background: '#1a1a1a',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
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
                  {getDefinitionInfo(currentDefinition).icon}
                </div>
                <ViewerTitle style={{ color: '#ffffff' }}>
                  {getDefinitionInfo(currentDefinition).title}
                </ViewerTitle>
                <ViewerDescription style={{ color: '#cccccc', marginBottom: '2rem' }}>
                  {getDefinitionInfo(currentDefinition).description}
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
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎛️</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Parameter Control</div>
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, #4ecdc4, #ffe66d)',
                    padding: '1rem',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔧</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Grasshopper Engine</div>
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, #ffe66d, #ff6b9d)',
                    padding: '1rem',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🌐</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Web Deployment</div>
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
                  💡 <strong>Developer Example:</strong> This demonstrates how to deploy any Grasshopper definition
                  on the web with interactive parameter controls. Use the sliders to modify parameters and click
                  "Generate Geometry" to see the results.
                </div>
              </div>
            </div>
          </ViewerContainer>
        </ViewerPanel>
      </ExplorerLayout>

      <SectionTitle>🚀 Developer Documentation</SectionTitle>

      <TutorialSection>
        <TutorialTitle>🔧 How to Deploy Your Own Grasshopper Definitions</TutorialTitle>
        <TutorialContent>
          <p>This McNeel Examples page serves as a complete template for deploying Grasshopper definitions on the web.
          Follow these steps to add your own definitions:</p>

          <h4>Step 1: Add Your Definition File</h4>
          <ul>
            <li>Place your `.gh` file in the `src/files/` directory</li>
            <li>The system will automatically detect and register it</li>
            <li>Restart the server to pick up new definitions</li>
          </ul>

          <h4>Step 2: Add Parameter Controls</h4>
          <pre style={{background: '#2a2a2a', padding: '1rem', borderRadius: '8px', color: '#cccccc'}}>
{`case 'YourDefinition.gh':
  return (
    <>
      <ParameterGroup>
        <ParameterTitle>🎯 Your Parameters</ParameterTitle>
        <ParameterItem>
          <ParameterLabel>Parameter Name</ParameterLabel>
          <SliderContainer>
            <Slider
              type="range"
              min="0"
              max="100"
              value={parameters.paramName || 50}
              onChange={(e) => handleParameterChange('paramName', parseInt(e.target.value))}
            />
            <ValueDisplay>{parameters.paramName || 50}</ValueDisplay>
          </SliderContainer>
        </ParameterItem>
      </ParameterGroup>
    </>
  );`}
          </pre>

          <h4>Step 3: Add Fallback Parameters</h4>
          <pre style={{background: '#2a2a2a', padding: '1rem', borderRadius: '8px', color: '#cccccc'}}>
{`'YourDefinition.gh': {
  inputs: [
    { name: 'paramName', paramType: 'Number', description: 'Parameter description' }
  ],
  outputs: [
    { name: 'result', paramType: 'Geometry', description: 'Output geometry' }
  ]
}`}
          </pre>
        </TutorialContent>
      </TutorialSection>

      <TutorialSection>
        <TutorialTitle>📋 Available Definitions</TutorialTitle>
        <TutorialContent>
          <p>Here are all the Grasshopper definitions currently available in this example:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {definitions.map(def => {
              const info = getDefinitionInfo(def);
              return (
                <div key={def} style={{
                  background: '#2a2a2a',
                  padding: '1rem',
                  borderRadius: '8px',
                  borderLeft: '4px solid #4ecdc4'
                }}>
                  <h4 style={{ color: '#ffffff', marginBottom: '0.5rem' }}>
                    {info.icon} {def.replace('.gh', '')}
                  </h4>
                  <p style={{ color: '#cccccc', fontSize: '0.9rem' }}>
                    {info.description}
                  </p>
                </div>
              );
            })}
          </div>
        </TutorialContent>
      </TutorialSection>

      <TutorialSection>
        <TutorialTitle>🌐 API Integration</TutorialTitle>
        <TutorialContent>
          <p>Use the REST API to integrate these definitions into your own applications:</p>

          <h4>Endpoint:</h4>
          <pre style={{background: '#2a2a2a', padding: '1rem', borderRadius: '8px', color: '#4ecdc4'}}>
            POST /solve
          </pre>

          <h4>Request Example:</h4>
          <pre style={{background: '#2a2a2a', padding: '1rem', borderRadius: '8px', color: '#cccccc'}}>
{`{
  "definition": "Bending_gridshell.gh",
  "inputs": {
    "gridSize": [10],
    "thickness": [0.5],
    "bendAngle": [30]
  }
}`}
          </pre>

          <h4>Response:</h4>
          <pre style={{background: '#2a2a2a', padding: '1rem', borderRadius: '8px', color: '#ffe66d'}}>
{`{
  "success": true,
  "data": {
    "geometry": [...],
    "analysis": {...}
  }
}`}
          </pre>
        </TutorialContent>
      </TutorialSection>
    </Container>
  );
};

export default McNeelComputeExamplesPage;
