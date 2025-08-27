
const appserverVersion = require('../package.json').version

async function getVersion() {

  let request = {
    'method':'GET',
    'headers': {'RhinoComputeKey': process.env.RHINO_COMPUTE_KEY }
  }

  // Use COMPUTE_URL as primary, fallback to RHINO_COMPUTE_URL for backward compatibility
  const computeUrl = process.env.COMPUTE_URL || process.env.RHINO_COMPUTE_URL
  const response = await fetch( computeUrl + 'version', request )
  console.log(response)
  const result = await response.json()

  result.appserver = appserverVersion

  console.log(result)

  return result

}

module.exports = { getVersion }
