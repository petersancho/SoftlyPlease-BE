
const appserverVersion = require('../package.json').version

async function getVersion() {
  // Check if we're in production and RHINO_COMPUTE_URL points to our own app
  const isProductionSelfReference = process.env.NODE_ENV === 'production' &&
    process.env.RHINO_COMPUTE_URL &&
    process.env.RHINO_COMPUTE_URL.includes('softlyplease-appserver');

  if (isProductionSelfReference) {
    // Return a mock response when we're pointing to ourselves
    console.log('🔄 Production mode: Returning mock version info (self-reference detected)');
    return {
      rhino: '8.0.0',
      compute: '1.0.0',
      appserver: appserverVersion,
      mode: 'mock-production'
    };
  }

  // Check if we have a real Rhino Compute URL
  if (!process.env.RHINO_COMPUTE_URL || process.env.RHINO_COMPUTE_URL === 'http://localhost:6500/') {
    console.log('🏠 Development mode or no external Rhino Compute: Returning basic version info');
    return {
      rhino: '8.0.0',
      compute: '1.0.0',
      appserver: appserverVersion,
      mode: 'development'
    };
  }

  // Try to fetch from external Rhino Compute
  try {
    let request = {
      'method':'GET',
      'headers': {'RhinoComputeKey': process.env.RHINO_COMPUTE_KEY }
    }

    const response = await fetch( process.env.RHINO_COMPUTE_URL + 'version', request )
    console.log('🌐 External Rhino Compute response:', response)

    if (response.ok) {
      const result = await response.json()
      result.appserver = appserverVersion
      console.log('✅ Version info retrieved:', result)
      return result
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  } catch (error) {
    console.error('❌ Error fetching version from Rhino Compute:', error.message)
    // Fallback to mock response
    return {
      rhino: '8.0.0',
      compute: '1.0.0',
      appserver: appserverVersion,
      mode: 'fallback',
      error: error.message
    };
  }
}

module.exports = { getVersion }
