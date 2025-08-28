
const appserverVersion = require('../package.json').version

async function getVersion() {

  let request = {
    'method':'GET',
    'headers': {'RhinoComputeKey': process.env.RHINO_COMPUTE_KEY }
  }

<<<<<<< HEAD
  const response = await fetch( process.env.RHINO_RHINO_COMPUTE_URL + 'version', request )
=======
  const response = await fetch( process.env.RHINO_COMPUTE_URL + 'version', request )
>>>>>>> c41033c05d4751a82a5fe6faa753e5cfe35f0d1d
  console.log(response)
  const result = await response.json()

  result.appserver = appserverVersion

  console.log(result)

  return result

}

module.exports = { getVersion }
