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
const md5File = require('md5-file')
const getParams = require('../definitions.js').getParams

/**
 * Set url and apikey used to communicate with a compute server
 */
function setComputeParams (){
  compute.url = process.env.RHINO_COMPUTE_URL
  compute.apiKey = process.env.RHINO_COMPUTE_KEY
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

  // Check if JSON format is explicitly requested
  const forceJson = req.query.format === 'json';

  if (forceJson) {
    // Serve JSON for API requests
    res.setHeader('Content-Type', 'application/json')
    res.send(JSON.stringify(definitions))
  } else {
    // Prepare definitions with display names and descriptions
    const definitionsWithInfo = definitions.map(def => {
      const descriptions = {
        'BranchNodeRnd.gh': 'Generate parametric spiky spheres with adjustable radius, count, and length parameters. Real-time 3D visualization.',
        'delaunay.gh': 'Create Delaunay triangulation from point clouds. Perfect for mesh generation from scattered data points.',
        'dresser3.gh': 'Interactive furniture design tool with width, height, and depth controls. Explore parametric furniture design.',
        'metaballTable.gh': 'Dynamic table design using metaball algorithms. Interactive point manipulation with real-time updates.',
        'bendy.gh': 'Physics-based deformation using Kangaroo solver. Explore structural bending and material behavior.',
        'docString.gh': 'Advanced example showing how to return complete Rhino documents from Grasshopper definitions.',
        'multi.gh': 'Dynamic file selection interface allowing you to switch between different Grasshopper definitions.',
        'upload.gh': 'File upload capability demonstration. Shows how to process external files as input parameters.',
        'valueList.gh': 'Working with value lists as input parameters. Demonstrates dropdown and selection interfaces.',
        'beam_mod.gh': 'Structural beam analysis and modification tools. Explore engineering applications.',
        'brep_union.gh': 'Boolean operations on solid geometry. Perfect for architectural modeling and design.',
        'rnd_lattice.gh': 'Generate random lattice structures. Great for exploring algorithmic architectural forms.',
        'rnd_node.gh': 'Node-based random geometry generation with customizable parameters.',
        'srf_kmeans.gh': 'Surface analysis using K-means clustering. Advanced computational geometry techniques.',
        'Bending_gridshell.gh': 'Grid shell bending analysis and visualization. Structural engineering applications.',
        'QuadPanelAperture.gh': 'Quad panel systems with aperture control. Architectural facade design tools.',
        'SampleGHConvertTo3dm.gh': 'Conversion utilities for Grasshopper to Rhino file formats. File processing examples.'
      };
      
      return {
        ...def,
        displayName: def.name.replace('.gh', ''),
        description: descriptions[def.name] || 'Interactive Grasshopper definition with real-time parameter control.'
      };
    });

    // Serve the homepage for browser requests (default)
    res.render('homepage', {
      title: 'SoftlyPlease - Interactive Grasshopper Examples',
      definitions: definitionsWithInfo
    });
  }
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
    const hash = md5File.sync(fullPath)
    let definitions = req.app.get('definitions')
    definition = {
      name: fullPath,
      id:hash,
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

module.exports = router
