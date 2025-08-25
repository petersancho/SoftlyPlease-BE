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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        const response = await fetch('/health');
        if (response.ok) {
          const data = await response.json();
          setHealthData(data);
        }
      } catch (error) {
        console.error('Failed to fetch health data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHealthData();
    // Update every 5 seconds
    const interval = setInterval(fetchHealthData, 5000);
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
    </Container>
  );
};

export default PerformancePage;
