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
<<<<<<< HEAD
  let files = getFilesSync(path.join(__dirname, '..', 'files/'))
  let definitions = []
  files.forEach( file => {
    if(file.includes('.gh') || file.includes('.ghx')) {
      const fullPath = path.join(__dirname, '..', 'files', file)
      const hash = md5File.sync(fullPath)
      
=======
  // Use root ./files directory as single source of truth
  const filesDir = path.join(process.cwd(), 'files');
  let files = getFilesSync(filesDir)
  let definitions = []
  files.forEach( file => {
    if(file.includes('.gh') || file.includes('.ghx')) {
      const fullPath = path.join(filesDir, file)
      const hash = md5File.sync(fullPath)

>>>>>>> c41033c05d4751a82a5fe6faa753e5cfe35f0d1d
      definitions.push({
        name: file,
        id:hash,
        path: fullPath
      })
    }
  })
  return definitions
}

async function getParams(definitionUrl) {
  // TODO: set and forget!
<<<<<<< HEAD
  compute.url = process.env.RHINO_RHINO_COMPUTE_URL
=======
  compute.url = process.env.COMPUTE_URL
>>>>>>> c41033c05d4751a82a5fe6faa753e5cfe35f0d1d
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
