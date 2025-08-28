const fs = require('fs')
const path = require('path')
const md5File = require('md5-file')
const compute = require('compute-rhino3d')
const camelcaseKeys = require('camelcase-keys')
const config = require('../../../config/config');

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
      // Use filename as ID instead of MD5 hash to avoid potential issues
      const id = file.replace('.gh', '').replace('.ghx', '')

      definitions.push({
        name: file,
        id: id,
        path: fullPath
      })
    }
  })
  console.log('Loaded definitions:', definitions.map(d => d.name))
  return definitions
}

async function getParams(definitionUrl) {
  // TODO: set and forget!
  compute.url = config.rhino.url;
  if (!compute.url.endsWith('/')) {
    compute.url += '/';
  }
  compute.apiKey = config.rhino.apiKey;

  const response = await compute.computeFetch('io', { 'pointer': definitionUrl }, false)
  
  // throw error if response not ok
  if(!response.ok) {
    throw new Error(response.statusText)
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
}

module.exports = { registerDefinitions, getParams }
