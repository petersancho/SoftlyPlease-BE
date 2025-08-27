
const appserverVersion = require('../package.json').version
const config = require('../../config/config')

async function getVersion() {

  let computeUrl = process.env.COMPUTE_URL || process.env.RHINO_COMPUTE_URL || config.rhino.url;
  if (!computeUrl.endsWith('/')) {
    computeUrl += '/';
  }

  let request = {
    'method':'GET',
    'headers': {'RhinoComputeKey': process.env.RHINO_COMPUTE_KEY || config.rhino.apiKey }
  }

  const response = await fetch(computeUrl + 'version', request )
  console.log(response)
  const result = await response.json()

  result.appserver = appserverVersion

  console.log(result)

  return result

}

module.exports = { getVersion }
