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
  const [computationResult, setComputationResult] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [status, setStatus] = useState('Ready to explore');
  const [availableDefinitions, setAvailableDefinitions] = useState<string[]>(['TopoOpt.gh']);
  const [definitionInfo, setDefinitionInfo] = useState<any>(null);

  // Fetch available definitions on component mount
  useEffect(() => {
    const fetchDefinitions = async () => {
      try {
        const response = await fetch('/api/definitions');
        if (response.ok) {
          const data = await response.json();
          const defs = data.map((d: any) => d.name);
          setAvailableDefinitions(defs);
          console.log('Available definitions:', defs);
        }
      } catch (error) {
        console.error('Failed to fetch definitions:', error);
        setStatus('Failed to load definitions');
      }
    };

    fetchDefinitions();
  }, []);

  // Fetch definition info when definition changes
  useEffect(() => {
    const fetchDefinitionInfo = async () => {
      if (!currentDefinition) return;

      try {
        const response = await fetch(`/${currentDefinition}`);
        if (response.ok) {
          const data = await response.json();
          setDefinitionInfo(data);
          console.log('Definition info:', data);
        } else {
          console.error('Failed to fetch definition info');
        }
      } catch (error) {
        console.error('Error fetching definition info:', error);
      }
    };

    fetchDefinitionInfo();
  }, [currentDefinition]);

  const handleDefinitionChange = (definition: string) => {
    setCurrentDefinition(definition);
    setSearchParams({ definition });
    setParameters({});
    setComputationResult(null);
    setPerformanceData(null);
    setStatus(`Selected: ${definition.replace('.gh', '')}`);
  };

  const handleParameterChange = (paramName: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [paramName]: value
    }));

    setStatus(`Parameter updated: ${paramName} = ${value}`);
    console.log(`Parameter updated: ${paramName} = ${value}`);
  };

  const handleCompute = async () => {
    if (!currentDefinition) {
      setStatus('❌ Please select a definition first');
      return;
    }

    setIsComputing(true);
    setStatus('🔄 Computing geometry...');

    try {
      // Prepare the request data
      const requestData = {
        definition: currentDefinition,
        inputs: {} as Record<string, any[]>
      };

      // Convert parameters to the expected format
      Object.keys(parameters).forEach(key => {
        const value = (parameters as Record<string, any>)[key];
        requestData.inputs[key] = Array.isArray(value) ? value : [value];
      });

      console.log('Sending computation request:', requestData);

      const startTime = Date.now();

      // Send the computation request
      const response = await fetch('/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (response.ok) {
        const result = await response.json();
        console.log('Computation result:', result);

        setComputationResult(result);

        // Extract performance data from headers
        const perfData = {
          responseTime: responseTime,
          cacheHit: response.headers.get('x-cache') === 'HIT',
          computeTime: parseInt(response.headers.get('x-compute-time') || '0'),
          definition: response.headers.get('x-definition'),
          resultSize: response.headers.get('x-result-size')
        };

        setPerformanceData(perfData);

        if (result.success !== false) {
          setStatus('✅ Geometry computed successfully!');
        } else {
          setStatus(`❌ Computation failed: ${result.message || 'Unknown error'}`);
        }
      } else {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        setStatus(`❌ Error: ${error.message || `HTTP ${response.status}`}`);
        console.error('Computation error:', error);
      }

    } catch (error) {
      console.error('Network error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setStatus(`❌ Network error: ${errorMessage}`);
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
        <Title>🔷 Soft.Geometry</Title>
        <Subtitle>Advanced computational geometry and topology optimization platform</Subtitle>
      </Header>

      <ConfiguratorLayout>
        <ControlPanel>
          <SectionTitle>🎛️ Parameters</SectionTitle>

          <DefinitionSelector>
            <ParameterLabel>Select Definition</ParameterLabel>
            <DefinitionSelect
              value={currentDefinition}
              onChange={(e) => handleDefinitionChange(e.target.value)}
            >
              {availableDefinitions.map(def => (
                <option key={def} value={def}>
                  {def.replace('.gh', '')}
                </option>
              ))}
            </DefinitionSelect>
          </DefinitionSelector>

          {currentDefinition === 'TopoOpt.gh' ? renderTopoOptControls() : renderGenericControls()}

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={handleCompute}
              disabled={isComputing}
              style={{
                background: isComputing ? '#444' : 'linear-gradient(45deg, #ff6b9d, #4ecdc4)',
                color: 'white',
                border: 'none',
                padding: '1rem 2rem',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: '600',
                fontFamily: '"Times New Roman", serif',
                cursor: isComputing ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {isComputing ? '🔄 Computing...' : '🚀 Generate Geometry'}
            </button>

            <button
              onClick={() => {
                setParameters({});
                setComputationResult(null);
                setPerformanceData(null);
                setStatus('Parameters reset to defaults');
              }}
              style={{
                background: '#444',
                color: 'white',
                border: 'none',
                padding: '1rem 2rem',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: '600',
                fontFamily: '"Times New Roman", serif',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              🔄 Reset Parameters
            </button>
          </div>

          <StatusPanel>
            <StatusTitle>🔷 Soft.Geometry Status</StatusTitle>
            <StatusText>{status}</StatusText>

            {performanceData && (
              <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#999' }}>
                <div>Response Time: {performanceData.responseTime}ms</div>
                <div>Cache Hit: {performanceData.cacheHit ? 'Yes' : 'No'}</div>
                {performanceData.computeTime > 0 && (
                  <div>Compute Time: {performanceData.computeTime}ms</div>
                )}
              </div>
            )}

            {computationResult && computationResult.data && (
              <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#4ecdc4' }}>
                <div>Geometry: {computationResult.data.type || 'Generated'}</div>
                {computationResult.data.geometry && (
                  <div>Details: {JSON.stringify(computationResult.data.geometry).length} bytes</div>
                )}
              </div>
            )}
          </StatusPanel>
        </ControlPanel>

        <ViewerPanel>
          <SectionTitle>👁️ 3D Viewer</SectionTitle>

          <ViewerContainer>
            {!computationResult ? (
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
                    Configure parameters and click "Generate Geometry" to see the computational results.
                    Soft.Geometry provides core computational tools for advanced design exploration.
                  </ViewerDescription>

                  <div style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    color: '#cccccc'
                  }}>
                    💡 <strong>Ready to Compute:</strong> Adjust the parameters in the left panel and click "Generate Geometry"
                    to see real-time computational results with performance metrics.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                background: '#1a1a1a',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                color: '#ffffff',
                fontFamily: '"Times New Roman", serif'
              }}>
                <div style={{
                  padding: '1rem',
                  background: 'rgba(78, 205, 196, 0.1)',
                  borderBottom: '1px solid #333',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <strong style={{ color: '#4ecdc4' }}>
                      {computationResult.data?.type || 'Computation'} Results
                    </strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#ccc' }}>
                    {new Date(computationResult.data?.timestamp || Date.now()).toLocaleTimeString()}
                  </div>
                </div>

                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem',
                  textAlign: 'center'
                }}>
                  <div>
                    <div style={{
                      fontSize: '4rem',
                      marginBottom: '1rem',
                      background: 'linear-gradient(45deg, #ff6b9d, #4ecdc4)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      ✅
                    </div>

                    <ViewerTitle style={{ color: '#4ecdc4', marginBottom: '1rem' }}>
                      Computation Complete!
                    </ViewerTitle>

                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '8px',
                      marginBottom: '2rem',
                      fontSize: '0.9rem'
                    }}>
                      {computationResult.data?.type === 'topology_optimization' && (
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ color: '#4ecdc4', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            🧮 Topology Optimization Results
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', textAlign: 'left' }}>
                            <div>Original Volume: {(computationResult.data.geometry?.originalVolume || 0).toLocaleString()} mm³</div>
                            <div>Optimized Volume: {(computationResult.data.geometry?.optimizedVolume || 0).toLocaleString()} mm³</div>
                            <div>Material Reduction: {((computationResult.data.geometry?.optimizationRatio || 0) * 100).toFixed(1)}%</div>
                            <div>Nodes: {computationResult.data.geometry?.nodes || 0}</div>
                            <div>Max Stress: {computationResult.data.performance?.maxStress?.toFixed(2) || 0} MPa</div>
                            <div>Safety Factor: {computationResult.data.performance?.factorOfSafety?.toFixed(2) || 0}</div>
                          </div>
                        </div>
                      )}

                      {computationResult.data?.type && computationResult.data.type !== 'topology_optimization' && (
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ color: '#4ecdc4', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            📊 Computation Results
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <div>Type: {computationResult.data.type}</div>
                            {computationResult.data.geometry && (
                              <div>Geometry Size: {JSON.stringify(computationResult.data.geometry).length} bytes</div>
                            )}
                          </div>
                        </div>
                      )}

                      <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255, 107, 157, 0.1)', borderRadius: '4px' }}>
                        <div style={{ color: '#ff6b9d', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                          📈 Performance Metrics
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', textAlign: 'left', fontSize: '0.8rem' }}>
                          <div>Response Time: {performanceData?.responseTime || 0}ms</div>
                          <div>Cache Hit: {performanceData?.cacheHit ? 'Yes' : 'No'}</div>
                          <div>Compute Time: {performanceData?.computeTime || 0}ms</div>
                          <div>Result Size: {performanceData?.resultSize || 'Unknown'}</div>
                        </div>
                      </div>
                    </div>

                    <div style={{
                      fontSize: '0.9rem',
                      color: '#cccccc',
                      marginBottom: '2rem'
                    }}>
                      💡 <strong>3D Viewer:</strong> A full Three.js viewer would be integrated here to visualize
                      the computed geometry in real-time. The current setup demonstrates the complete
                      computational pipeline with performance monitoring.
                    </div>

                    <button
                      onClick={() => {
                        setComputationResult(null);
                        setPerformanceData(null);
                        setStatus('Ready to explore');
                      }}
                      style={{
                        background: '#444',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        fontFamily: '"Times New Roman", serif',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      🔄 New Computation
                    </button>
                  </div>
                </div>
              </div>
            )}
          </ViewerContainer>
        </ViewerPanel>
      </ConfiguratorLayout>
    </Container>
  );
};

export default ConfiguratorPage;
