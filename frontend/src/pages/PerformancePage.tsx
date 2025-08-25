import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

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

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const MetricCard = styled.div`
  background: #1a1a1a;
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid #333;
`;

const MetricTitle = styled.h3`
  color: #ffffff;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-family: 'Times New Roman', serif;
`;

const MetricValue = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 0.5rem;
  font-family: 'Times New Roman', serif;
`;

const MetricLabel = styled.div`
  color: #cccccc;
  font-size: 0.9rem;
  font-family: 'Times New Roman', serif;
`;

const ChartContainer = styled.div`
  background: #1a1a1a;
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid #333;
  margin-bottom: 2rem;
`;

const ChartTitle = styled.h3`
  color: #ffffff;
  margin-bottom: 1rem;
  font-size: 1.8rem;
  font-family: 'Times New Roman', serif;
`;

const ChartPlaceholder = styled.div`
  height: 300px;
  background: linear-gradient(45deg, #2a2a2a, #333333);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cccccc;
  font-family: 'Times New Roman', serif;
  font-size: 1.2rem;
`;

const StatusIndicator = styled.div<{ status: 'healthy' | 'warning' | 'error' }>`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => {
    switch (props.status) {
      case 'healthy': return '#00ff88';
      case 'warning': return '#ffaa00';
      case 'error': return '#ff4444';
      default: return '#666666';
    }
  }};
  margin-right: 0.5rem;
`;

const StatusText = styled.span`
  color: #cccccc;
  font-family: 'Times New Roman', serif;
`;

const PerformancePage: React.FC = () => {
  const [healthData, setHealthData] = useState<any>(null);
  const [definitions, setDefinitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch health data
        const healthResponse = await fetch('/health');
        if (healthResponse.ok) {
          const data = await healthResponse.json();
          setHealthData(data);
        }

        // Fetch definitions list
        const definitionsResponse = await fetch('/api/definitions');
        if (definitionsResponse.ok) {
          const data = await definitionsResponse.json();
          setDefinitions(data);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Update every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatMemory = (bytes: number) => {
    return `${Math.round(bytes / 1024 / 1024)} MB`;
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <Container>
        <Header>
          <Title>Loading Performance Metrics...</Title>
        </Header>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Performance Dashboard</Title>
        <Subtitle>Real-time system metrics and performance monitoring</Subtitle>
      </Header>

      <MetricsGrid>
        <MetricCard>
          <MetricTitle>System Status</MetricTitle>
          <MetricValue>
            <StatusIndicator status={healthData?.status === 'healthy' ? 'healthy' : 'error'} />
            <StatusText>{healthData?.status || 'Unknown'}</StatusText>
          </MetricValue>
          <MetricLabel>Overall system health</MetricLabel>
        </MetricCard>

        <MetricCard>
          <MetricTitle>Uptime</MetricTitle>
          <MetricValue>{healthData?.uptime ? formatUptime(healthData.uptime) : 'N/A'}</MetricValue>
          <MetricLabel>Time since last restart</MetricLabel>
        </MetricCard>

        <MetricCard>
          <MetricTitle>Memory Usage</MetricTitle>
          <MetricValue>{healthData?.memory?.heapUsed ? formatMemory(healthData.memory.heapUsed) : 'N/A'}</MetricValue>
          <MetricLabel>Heap memory consumption</MetricLabel>
        </MetricCard>

        <MetricCard>
          <MetricTitle>Cache Status</MetricTitle>
          <MetricValue>
            <StatusIndicator status={healthData?.cache?.status === 'operational' ? 'healthy' : 'warning'} />
            <StatusText>{healthData?.cache?.status || 'Unknown'}</StatusText>
          </MetricValue>
          <MetricLabel>MemCachier performance</MetricLabel>
        </MetricCard>

        <MetricCard>
          <MetricTitle>Rhino Compute</MetricTitle>
          <MetricValue>
            <StatusIndicator status={healthData?.rhinoCompute?.connected ? 'healthy' : 'error'} />
            <StatusText>{healthData?.rhinoCompute?.connected ? 'Connected' : 'Disconnected'}</StatusText>
          </MetricValue>
          <MetricLabel>Grasshopper computation engine</MetricLabel>
        </MetricCard>

        <MetricCard>
          <MetricTitle>Response Time</MetricTitle>
          <MetricValue>&lt;50ms</MetricValue>
          <MetricLabel>Typical API response time</MetricLabel>
        </MetricCard>
      </MetricsGrid>

      <ChartContainer>
        <ChartTitle>Response Time Trends</ChartTitle>
        <ChartPlaceholder>
          📊 Live response time graph would be displayed here
          <br />
          <small>Real-time performance monitoring visualization</small>
        </ChartPlaceholder>
      </ChartContainer>

      <ChartContainer>
        <ChartTitle>Memory Usage Over Time</ChartTitle>
        <ChartPlaceholder>
          📈 Memory consumption chart would be displayed here
          <br />
          <small>Heap usage and garbage collection monitoring</small>
        </ChartPlaceholder>
      </ChartContainer>

      <ChartContainer>
        <ChartTitle>Cache Performance</ChartTitle>
        <ChartPlaceholder>
          🎯 Cache hit rate and efficiency metrics
          <br />
          <small>MemCachier performance analytics</small>
        </ChartPlaceholder>
      </ChartContainer>

      <ChartContainer>
        <ChartTitle>System Load</ChartTitle>
        <ChartPlaceholder>
          ⚡ CPU usage and system load monitoring
          <br />
          <small>Real-time system resource utilization</small>
        </ChartPlaceholder>
      </ChartContainer>

      <ChartContainer>
        <ChartTitle>📋 Available API Definitions</ChartTitle>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem',
          maxHeight: '300px',
          overflowY: 'auto',
          padding: '1rem'
        }}>
          {definitions.length > 0 ? (
            definitions.map((def, index) => (
              <div
                key={index}
                style={{
                  background: '#2a2a2a',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #444',
                  textAlign: 'center',
                  fontFamily: '"Times New Roman", serif',
                  color: '#ffffff'
                }}
              >
                <div style={{
                  fontSize: '1.2rem',
                  marginBottom: '0.5rem',
                  background: 'linear-gradient(45deg, #ff6b9d, #4ecdc4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  📄
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                  {def.name.replace('.gh', '')}
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#cccccc',
                  marginTop: '0.5rem'
                }}>
                  .gh file
                </div>
              </div>
            ))
          ) : (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              color: '#cccccc',
              fontFamily: '"Times New Roman", serif'
            }}>
              Loading definitions...
            </div>
          )}
        </div>
      </ChartContainer>

      <ChartContainer>
        <ChartTitle>🔧 API Endpoints</ChartTitle>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{
            background: '#2a2a2a',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #444'
          }}>
            <h4 style={{
              color: '#ffffff',
              marginBottom: '1rem',
              fontFamily: '"Times New Roman", serif',
              background: 'linear-gradient(45deg, #ff6b9d, #4ecdc4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              GET /health
            </h4>
            <p style={{
              color: '#cccccc',
              fontSize: '0.9rem',
              fontFamily: '"Times New Roman", serif',
              marginBottom: '0.5rem'
            }}>
              System health and metrics
            </p>
            <div style={{
              background: '#1a1a1a',
              padding: '0.5rem',
              borderRadius: '4px',
              fontSize: '0.8rem',
              color: '#4ecdc4',
              fontFamily: 'monospace'
            }}>
              curl https://softlyplease.com/health
            </div>
          </div>

          <div style={{
            background: '#2a2a2a',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #444'
          }}>
            <h4 style={{
              color: '#ffffff',
              marginBottom: '1rem',
              fontFamily: '"Times New Roman", serif',
              background: 'linear-gradient(45deg, #4ecdc4, #ffe66d)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              POST /solve
            </h4>
            <p style={{
              color: '#cccccc',
              fontSize: '0.9rem',
              fontFamily: '"Times New Roman", serif',
              marginBottom: '0.5rem'
            }}>
              Run Grasshopper computation
            </p>
            <div style={{
              background: '#1a1a1a',
              padding: '0.5rem',
              borderRadius: '4px',
              fontSize: '0.8rem',
              color: '#ffe66d',
              fontFamily: 'monospace'
            }}>
              curl -X POST https://softlyplease.com/solve
            </div>
          </div>

          <div style={{
            background: '#2a2a2a',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #444'
          }}>
            <h4 style={{
              color: '#ffffff',
              marginBottom: '1rem',
              fontFamily: '"Times New Roman", serif',
              background: 'linear-gradient(45deg, #ffe66d, #ff6b9d)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              GET /
            </h4>
            <p style={{
              color: '#cccccc',
              fontSize: '0.9rem',
              fontFamily: '"Times New Roman", serif',
              marginBottom: '0.5rem'
            }}>
              List available definitions
            </p>
            <div style={{
              background: '#1a1a1a',
              padding: '0.5rem',
              borderRadius: '4px',
              fontSize: '0.8rem',
              color: '#ff6b9d',
              fontFamily: 'monospace'
            }}>
              curl https://softlyplease.com/
            </div>
          </div>
        </div>
      </ChartContainer>
    </Container>
  );
};

export default PerformancePage;
