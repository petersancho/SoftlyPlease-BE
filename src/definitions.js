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
  const roots = [
    path.join(process.cwd(), 'files'),
    path.join(__dirname, 'files')
  ]
  const seen = new Set()
  const definitions = []
  for (const dir of roots){
    if (!fs.existsSync(dir)) continue
    const files = getFilesSync(dir)
    files.forEach(file => {
      if (!(/\.(gh|ghx)$/i.test(file))) return
      if (seen.has(file)) return
      const fullPath = path.join(dir, file)
      const hash = md5File.sync(fullPath)
      definitions.push({ name:file, id:hash, path:fullPath })
      seen.add(file)
    })
  }
  return definitions
}

async function getParams(definitionUrl) {
  // TODO: set and forget!
  compute.url = process.env.RHINO_COMPUTE_URL
  compute.apiKey = process.env.RHINO_COMPUTE_KEY

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
