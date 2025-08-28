/**
 * Provide routes for getting descriptive information about the definitions
 * available on this AppServer instance as well as details on the inputs and
 * outputs for a given definition
 * 
 * Routes:
 *  ('/')
 *     Show list of definitions available
 *  ('/:definition')
 *     Get definition input/output details for a definition installed in
 *     this AppServer. These definitions are located in the 'files' directory
 *  ('/definition_description?path=FILEPATH`)
 *     Get definition input/output details for a definition at an absolute
 *     path on the AppServer machine.
 */
const express = require('express')
const router = express.Router()
const compute = require('compute-rhino3d')
// Removed md5-file dependency - using filename as ID instead
const getParams = require('../definitions.js').getParams
<<<<<<< HEAD
const config = require('../../config/config')
=======
const config = require('../config/config')
>>>>>>> c41033c05d4751a82a5fe6faa753e5cfe35f0d1d

/**
 * Set url and apikey used to communicate with a compute server
 */
function setComputeParams (){
  compute.url = config.rhino.url
  compute.apiKey = config.rhino.apiKey
}

/**
 * Return list of definitions available on this server. The definitions
 * are located in the 'files' directory. These are the names that can be
 * used to call '/:definition_name` for details about a specific definition
 */
router.get('/',  function(req, res, next) {
  let definitions = []
  req.app.get('definitions').forEach( def => {
    definitions.push({name: def.name})
  })

  // Render the homepage template with definitions
  res.render('homepage', { title: 'softlyplease.com', definitions: definitions });
})

function describeDefinition(definition, req, res, next){
  if(definition === undefined)
    throw new Error('Definition not found on server.') 

  let data = {name: definition.name}

  if(!Object.prototype.hasOwnProperty.call(definition, 'inputs')
     && !Object.prototype.hasOwnProperty.call(definition, 'outputs')) {

    let fullUrl = req.protocol + '://' + req.get('host')
    let definitionPath = `${fullUrl}/definition/${definition.id}`

    getParams(definitionPath).then(data => {
      // cache
      definition.description = data.description
      definition.inputs = data.inputs
      definition.outputs = data.outputs

      // pretty print json
      res.setHeader('Content-Type', 'application/json')
      res.send(JSON.stringify(data, null, 4))
    }).catch(next)
  } else {
    data.description = definition.description
    data.inputs = definition.inputs
    data.outputs = definition.outputs

    res.setHeader('Content-Type', 'application/json')
    res.send(JSON.stringify(data, null, 4))
  }
}

router.get('/definition_description', function(req, res, next){
  let fullPath = req.query['path']
  let definition = req.app.get('definitions').find(o => o.name === fullPath)
  if(definition === undefined){
    // Use filename as ID instead of MD5 hash
    const id = fullPath.split('/').pop().replace('.gh', '').replace('.ghx', '')
    let definitions = req.app.get('definitions')
    definition = {
      name: fullPath,
      id: id,
      path: fullPath
    }
    definitions.push(definition)
  }
  describeDefinition(definition, req, res, next)
})

/**
 * This route needs to be declared after /definition_description so it won't be
 * called when '/definition_description' is requested
 */
router.get('/:name', function(req, res, next){
  let definition = req.app.get('definitions').find(o => o.name === req.params.name)
  describeDefinition(definition, req, res, next)
})

/* GET diagnostics */
router.get('/diagnostics', function(req, res, next) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cwd: process.cwd(),
    definitions: req.app.get('definitions') || [],
    config: {
      rhinoUrl: config.rhino.url,
      apiKey: config.rhino.apiKey ? 'SET (length: ' + config.rhino.apiKey.length + ')' : 'NOT SET',
      definitionsDir: config.definitions.directory
    },
    memory: process.memoryUsage()
  }

  res.json(diagnostics)
})

module.exports = router
