const fs = require('fs')
const path = require('path')
const md5File = require('md5-file')
const compute = require('compute-rhino3d')
const camelcaseKeys = require('camelcase-keys')

/*
function getFiles(dir) {
  return new Promise ( (resolve, reject) => {
    fs.readdir(dir, (err, files) => {
      if(err) reject(err)
      else resolve(files)
    })
  } )
}
*/
function getFilesSync(dir) {
  return fs.readdirSync(dir)
}

function registerDefinitions() {
  let files = getFilesSync(path.join(__dirname, 'files/'))
  let definitions = []
  files.forEach( file => {
    if(file.includes('.gh') || file.includes('.ghx')) {
      const fullPath = path.join(__dirname, 'files/' + file)
      const hash = md5File.sync(fullPath)
      
      definitions.push({
        name: file,
        id:hash,
        path: fullPath
      })
    }
  })
  return definitions
}

async function getParams(definition) {
  // TODO: set and forget!
  compute.url = process.env.RHINO_COMPUTE_URL
  compute.apiKey = process.env.RHINO_COMPUTE_KEY

  console.log('Getting params for definition:', definition.name)
  console.log('Rhino Compute URL:', process.env.RHINO_COMPUTE_URL)
  console.log('API Key set:', !!process.env.RHINO_COMPUTE_KEY)

  // Read the definition file directly and encode it
  const fs = require('fs')

  try {
    console.log('Reading definition file:', definition.path)

    // Read the definition file
    const definitionContent = fs.readFileSync(definition.path)
    const base64Content = definitionContent.toString('base64')

    console.log('Definition file read successfully, size:', definitionContent.length)

    // Send the base64 encoded content directly
    const response = await compute.computeFetch('io', {
      'content': base64Content,
      'type': 'base64'
    }, false)

    console.log('Response status:', response.status)
    console.log('Response ok:', response.ok)

    // throw error if response not ok
    if(!response.ok) {
      const errorText = await response.text()
      console.error('Response error details:', errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
    }

    let result = await response.json()

    // json returned by /io is PascalCase and looks weird in javascript
    result = camelcaseKeys(result, {deep: true})

  let inputs = result.inputs === undefined ? result.inputNames : result.inputs
  
  let outputs = result.outputs === undefined ? result.outputNames: result.outputs

  const description = result.description === undefined ? '' : result.description

  let view = true

  inputs.forEach( i => {
    if (  i.paramType === 'Geometry' ||
          i.paramType === 'Point' ||
          i.paramType === 'Curve' ) {
            view = false
          }
  } )

    return { description, inputs, outputs, view }

  } catch (error) {
    console.error('Error reading definition file or API call:', error)
    throw error
  }
}

module.exports = { registerDefinitions, getParams }
