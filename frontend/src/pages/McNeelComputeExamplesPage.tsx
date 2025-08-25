import React from 'react';
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
  font-size: 1.5rem;
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

const SectionTitle = styled.h2`
  color: #ffffff;
  font-size: 2rem;
  margin: 3rem 0 2rem 0;
  font-family: 'Times New Roman', serif;
  text-align: center;
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

const McNeelComputeExamplesPage: React.FC = () => {
  return (
    <Container>
      <Header>
        <Title>McNeel Compute Examples</Title>
        <Subtitle>Explore Grasshopper definitions and computational design tutorials</Subtitle>
      </Header>

      <SectionTitle>Available Definitions</SectionTitle>

      <ExamplesGrid>
        <ExampleCard>
          <ExampleTitle>🎯 TopoOpt</ExampleTitle>
          <ExampleDescription>
            Topology optimization using genetic algorithms and material distribution optimization.
            Perfect for lightweight structures and material efficiency studies.
          </ExampleDescription>
          <ExampleButton href="/configurator?definition=TopoOpt.gh">
            Open in Configurator
          </ExampleButton>
        </ExampleCard>

        <ExampleCard>
          <ExampleTitle>🏗️ Bending Gridshell</ExampleTitle>
          <ExampleDescription>
            Parametric gridshell generation with bending analysis and form-finding algorithms.
            Explore complex curved surfaces and structural optimization.
          </ExampleDescription>
          <ExampleButton href="/configurator?definition=Bending_gridshell.gh">
            Open in Configurator
          </ExampleButton>
        </ExampleCard>

        <ExampleCard>
          <ExampleTitle>🔗 Branch Node Randomization</ExampleTitle>
          <ExampleDescription>
            Dynamic branching systems with procedural node placement and connection algorithms.
            Ideal for studying network topologies and connectivity patterns.
          </ExampleDescription>
          <ExampleButton href="/configurator?definition=BranchNodeRnd.gh">
            Open in Configurator
          </ExampleButton>
        </ExampleCard>

        <ExampleCard>
          <ExampleTitle>🏠 Quad Panel Aperture</ExampleTitle>
          <ExampleDescription>
            Adaptive facade systems with customizable panel patterns and aperture optimization.
            Perfect for building envelope studies and daylight analysis.
          </ExampleDescription>
          <ExampleButton href="/configurator?definition=QuadPanelAperture.gh">
            Open in Configurator
          </ExampleButton>
        </ExampleCard>

        <ExampleCard>
          <ExampleTitle>🔄 Sample Conversion</ExampleTitle>
          <ExampleDescription>
            Data conversion workflows between different formats and computational methods.
            Essential for interoperability and data pipeline development.
          </ExampleDescription>
          <ExampleButton href="/configurator?definition=SampleGHConvertTo3dm.gh">
            Open in Configurator
          </ExampleButton>
        </ExampleCard>

        <ExampleCard>
          <ExampleTitle>⚡ Beam Modification</ExampleTitle>
          <ExampleDescription>
            Structural beam optimization with load analysis and material property adjustments.
            Study beam behavior under various loading conditions.
          </ExampleDescription>
          <ExampleButton href="/configurator?definition=beam_mod.gh">
            Open in Configurator
          </ExampleButton>
        </ExampleCard>

        <ExampleCard>
          <ExampleTitle>🔧 BREP Union</ExampleTitle>
          <ExampleDescription>
            Boolean operations and solid modeling techniques for complex geometry creation.
            Master advanced modeling workflows and surface operations.
          </ExampleDescription>
          <ExampleButton href="/configurator?definition=brep_union.gh">
            Open in Configurator
          </ExampleButton>
        </ExampleCard>

        <ExampleCard>
          <ExampleTitle>📐 Delaunay Mesh</ExampleTitle>
          <ExampleDescription>
            Triangulation algorithms and mesh generation techniques for spatial analysis.
            Essential for studying mesh topologies and optimization problems.
          </ExampleDescription>
          <ExampleButton href="/configurator?definition=delaunay.gh">
            Open in Configurator
          </ExampleButton>
        </ExampleCard>

        <ExampleCard>
          <ExampleTitle>📝 Documentation String</ExampleTitle>
          <ExampleDescription>
            Automated documentation generation and metadata extraction from Grasshopper files.
            Perfect for creating comprehensive project documentation.
          </ExampleDescription>
          <ExampleButton href="/configurator?definition=docString.gh">
            Open in Configurator
          </ExampleButton>
        </ExampleCard>

        <ExampleCard>
          <ExampleTitle>🪑 Furniture Design</ExampleTitle>
          <ExampleDescription>
            Parametric furniture generation with ergonomic considerations and manufacturing constraints.
            Explore form-finding and optimization in product design.
          </ExampleDescription>
          <ExampleButton href="/configurator?definition=dresser3.gh">
            Open in Configurator
          </ExampleButton>
        </ExampleCard>

        <ExampleCard>
          <ExampleTitle>💎 Metaball Table</ExampleTitle>
          <ExampleDescription>
            Organic form generation using metaball algorithms and implicit surface modeling.
            Study complex organic shapes and volumetric modeling techniques.
          </ExampleDescription>
          <ExampleButton href="/configurator?definition=metaballTable.gh">
            Open in Configurator
          </ExampleButton>
        </ExampleCard>

        <ExampleCard>
          <ExampleTitle>🌐 Random Lattice</ExampleTitle>
          <ExampleDescription>
            Stochastic lattice generation with customizable density and connectivity parameters.
            Perfect for studying porous structures and material properties.
          </ExampleDescription>
          <ExampleButton href="/configurator?definition=rnd_lattice.gh">
            Open in Configurator
          </ExampleButton>
        </ExampleCard>

        <ExampleCard>
          <ExampleTitle>🎲 Random Node</ExampleTitle>
          <ExampleDescription>
            Node placement algorithms with spatial constraints and distribution controls.
            Essential for studying point cloud generation and spatial analysis.
          </ExampleDescription>
          <ExampleButton href="/configurator?definition=rnd_node.gh">
            Open in Configurator
          </ExampleButton>
        </ExampleCard>

        <ExampleCard>
          <ExampleTitle>📊 Surface K-means</ExampleTitle>
          <ExampleDescription>
            Clustering algorithms applied to surface analysis and point cloud processing.
            Master data-driven surface manipulation and pattern recognition.
          </ExampleDescription>
          <ExampleButton href="/configurator?definition=srf_kmeans.gh">
            Open in Configurator
          </ExampleButton>
        </ExampleCard>

        <ExampleCard>
          <ExampleTitle>🎛️ Value List</ExampleTitle>
          <ExampleDescription>
            Dynamic list manipulation and data structure operations for complex workflows.
            Essential for managing large datasets and parametric variations.
          </ExampleDescription>
          <ExampleButton href="/configurator?definition=value_list.gh">
            Open in Configurator
          </ExampleButton>
        </ExampleCard>
      </ExamplesGrid>

      <SectionTitle>Rhino Compute Tutorials</SectionTitle>

      <TutorialSection>
        <TutorialTitle>🚀 Getting Started with Rhino Compute</TutorialTitle>
        <TutorialContent>
          <p>Rhino Compute is a cloud-based computational engine that allows you to run Grasshopper definitions
          without needing Rhino or Grasshopper installed locally. This enables scalable, web-based parametric design.</p>

          <h4>Key Benefits:</h4>
          <ul>
            <li>⚡ High-performance cloud computing</li>
            <li>🔄 RESTful API for easy integration</li>
            <li>📈 Scalable processing power</li>
            <li>🌐 Web-based accessibility</li>
            <li>💾 Intelligent caching system</li>
          </ul>

          <h4>Supported Operations:</h4>
          <ul>
            <li>Geometry creation and manipulation</li>
            <li>Mathematical computations</li>
            <li>Data analysis and visualization</li>
            <li>Optimization algorithms</li>
            <li>Simulation and analysis</li>
          </ul>
        </TutorialContent>
      </TutorialSection>

      <TutorialSection>
        <TutorialTitle>🔧 API Integration Guide</TutorialTitle>
        <TutorialContent>
          <p>The RESThopper API provides a simple HTTP interface for running Grasshopper definitions.
          Each definition becomes a REST endpoint that accepts JSON input and returns computed results.</p>

          <h4>Basic Request Format:</h4>
          <pre style={{background: '#2a2a2a', padding: '1rem', borderRadius: '8px', color: '#cccccc'}}>
{`POST /solve
{
  "definition": "MyDefinition.gh",
  "inputs": {
    "param1": [value1, value2],
    "param2": [value3]
  }
}`}
          </pre>

          <h4>Response Format:</h4>
          <pre style={{background: '#2a2a2a', padding: '1rem', borderRadius: '8px', color: '#cccccc'}}>
{`{
  "success": true,
  "data": {
    "values": [...]
  }
}`}
          </pre>
        </TutorialContent>
      </TutorialSection>

      <TutorialSection>
        <TutorialTitle>🎯 Best Practices</TutorialTitle>
        <TutorialContent>
          <h4>Performance Optimization:</h4>
          <ul>
            <li>Use appropriate data types and ranges</li>
            <li>Implement proper error handling</li>
            <li>Cache frequently used results</li>
            <li>Monitor API usage and response times</li>
          </ul>

          <h4>Security Considerations:</h4>
          <ul>
            <li>Validate all input parameters</li>
            <li>Implement rate limiting</li>
            <li>Use HTTPS for all communications</li>
            <li>Monitor for malicious inputs</li>
          </ul>
        </TutorialContent>
      </TutorialSection>
    </Container>
  );
};

export default McNeelComputeExamplesPage;
