import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import Header from './components/Header';
import Footer from './components/Footer';
import LoadingSpinner from './components/Common/LoadingSpinner';

// Pages
const HomePage = React.lazy(() => import('./pages/HomePage'));
const ConfiguratorPage = React.lazy(() => import('./pages/ConfiguratorPage'));
const McNeelComputeExamplesPage = React.lazy(() => import('./pages/McNeelComputeExamplesPage'));
const PerformancePage = React.lazy(() => import('./pages/PerformancePage'));
const AboutPage = React.lazy(() => import('./pages/AboutPage'));
const ContactPage = React.lazy(() => import('./pages/ContactPage'));

// Demo Components
const ThreeJSViewerDemo = React.lazy(() => import('./components/Configurator/ThreeJSViewerDemo'));

const theme = {
  colors: {
    primary: '#ffffff',
    secondary: '#666666',
    accent: '#cccccc',
    background: '#000000',
    surface: '#111111',
    surfaceLight: '#1a1a1a',
    text: '#ffffff',
    textSecondary: '#cccccc',
    textMuted: '#999999',
    border: '#333333',
    borderLight: '#444444',
    success: '#888888',
    warning: '#666666',
    error: '#444444',
  },
  fonts: {
    primary: '"Times New Roman", serif',
    mono: '"SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace',
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
  fontWeights: {
    thin: 100,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ flex: 1, padding: '2rem' }}>
          <Suspense
            fallback={
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <LoadingSpinner />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/configurator" element={<ConfiguratorPage />} />
              <Route path="/mcneel-compute-examples" element={<McNeelComputeExamplesPage />} />
              <Route path="/performance" element={<PerformancePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/threejs-demo" element={<ThreeJSViewerDemo />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
};

export default App;
