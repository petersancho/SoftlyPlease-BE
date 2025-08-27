
const appserverVersion = require('../package.json').version

async function getVersion() {

  // Use COMPUTE_URL as primary, fallback to RHINO_COMPUTE_URL for backward compatibility
  const computeUrl = process.env.COMPUTE_URL || process.env.RHINO_COMPUTE_URL
  const baseUrl = computeUrl.endsWith('/') ? computeUrl : computeUrl + '/'
  const apiKey = process.env.RHINO_COMPUTE_KEY

  // Use the same authentication method as solve.js
  const url = baseUrl + 'version?RhinoComputeKey=' + encodeURIComponent(apiKey)
  const response = await fetch(url)
  console.log(response)
  const result = await response.json()

  result.appserver = appserverVersion

  console.log(result)

  return result

}

module.exports = { getVersion }
