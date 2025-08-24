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

      // Check if we have fallback parameters for this definition
      const hasFallback = FALLBACK_PARAMS[file] !== undefined

      definitions.push({
        name: file,
        id: hash,
        path: fullPath,
        hasFallback: hasFallback,
        fallbackInputs: hasFallback ? FALLBACK_PARAMS[file].inputs : null,
        fallbackOutputs: hasFallback ? FALLBACK_PARAMS[file].outputs : null
      })
    }
  })
  return definitions
}

// Fallback parameter definitions for when Rhino Compute is unavailable
const FALLBACK_PARAMS = {
  'TopoOpt.gh': {
    inputs: [
      { name: 'smooth', paramType: 'Number', description: 'Smoothness parameter (0-10)' },
      { name: 'cube', paramType: 'Number', description: 'Cube size parameter (0-10)' },
      { name: 'segment', paramType: 'Integer', description: 'Number of segments (1-20)' },
      { name: 'pipewidth', paramType: 'Number', description: 'Pipe width (1-50)' },
      { name: 'minr', paramType: 'Number', description: 'Minimum radius (1-100)' },
      { name: 'maxr', paramType: 'Number', description: 'Maximum radius (1-200)' },
      { name: 'tolerance', paramType: 'Number', description: 'Tolerance (0-100)' },
      { name: 'round', paramType: 'Number', description: 'Round parameter (0-10)' }
    ],
    outputs: [
      { name: 'OptimizedMesh', paramType: 'Mesh', description: 'Topology optimized mesh' },
      { name: 'Results', paramType: 'Text', description: 'Optimization results' }
    ]
  },
  'dresser3.gh': {
    inputs: [
      { name: 'width', paramType: 'Number', description: 'Width of dresser' },
      { name: 'height', paramType: 'Number', description: 'Height of dresser' },
      { name: 'depth', paramType: 'Number', description: 'Depth of dresser' },
      { name: 'numDrawers', paramType: 'Integer', description: 'Number of drawers' }
    ],
    outputs: [
      { name: 'Geometry', paramType: 'Brep', description: 'Dresser geometry' }
    ]
  },
  'delaunay.gh': {
    inputs: [
      { name: 'points', paramType: 'Point', description: 'Input points' },
      { name: 'radius', paramType: 'Number', description: 'Influence radius' }
    ],
    outputs: [
      { name: 'mesh', paramType: 'Mesh', description: 'Delaunay mesh' }
    ]
  },
  'metaballTable.gh': {
    inputs: [
      { name: 'resolution', paramType: 'Integer', description: 'Mesh resolution' },
      { name: 'threshold', paramType: 'Number', description: 'Metaball threshold' },
      { name: 'scale', paramType: 'Number', description: 'Scale factor' }
    ],
    outputs: [
      { name: 'mesh', paramType: 'Mesh', description: 'Metaball mesh' }
    ]
  },
  'beam_mod.gh': {
    inputs: [
      { name: 'length', paramType: 'Number', description: 'Beam length' },
      { name: 'width', paramType: 'Number', description: 'Beam width' },
      { name: 'height', paramType: 'Number', description: 'Beam height' }
    ],
    outputs: [
      { name: 'geometry', paramType: 'Brep', description: 'Beam geometry' }
    ]
  },
  'Bending_gridshell.gh': {
    inputs: [
      { name: 'gridSize', paramType: 'Integer', description: 'Grid size' },
      { name: 'thickness', paramType: 'Number', description: 'Shell thickness' },
      { name: 'bendAngle', paramType: 'Number', description: 'Bend angle' }
    ],
    outputs: [
      { name: 'shell', paramType: 'Brep', description: 'Gridshell geometry' }
    ]
  },
  'BranchNodeRnd.gh': {
    inputs: [
      { name: 'seed', paramType: 'Integer', description: 'Random seed' },
      { name: 'branchLength', paramType: 'Number', description: 'Branch length' },
      { name: 'nodeCount', paramType: 'Integer', description: 'Number of nodes' }
    ],
    outputs: [
      { name: 'network', paramType: 'Curve', description: 'Branch network' }
    ]
  },
  'brep_union.gh': {
    inputs: [
      { name: 'brep1', paramType: 'Brep', description: 'First brep' },
      { name: 'brep2', paramType: 'Brep', description: 'Second brep' }
    ],
    outputs: [
      { name: 'union', paramType: 'Brep', description: 'Union result' }
    ]
  },
  'docString.gh': {
    inputs: [
      { name: 'text', paramType: 'Text', description: 'Input text' },
      { name: 'fontSize', paramType: 'Number', description: 'Font size' }
    ],
    outputs: [
      { name: 'curves', paramType: 'Curve', description: 'Text curves' }
    ]
  },
  'QuadPanelAperture.gh': {
    inputs: [
      { name: 'panelSize', paramType: 'Number', description: 'Panel size' },
      { name: 'apertureSize', paramType: 'Number', description: 'Aperture size' },
      { name: 'pattern', paramType: 'Text', description: 'Aperture pattern' }
    ],
    outputs: [
      { name: 'panel', paramType: 'Brep', description: 'Panel with aperture' }
    ]
  },
  'rnd_lattice.gh': {
    inputs: [
      { name: 'seed', paramType: 'Integer', description: 'Random seed' },
      { name: 'density', paramType: 'Number', description: 'Lattice density' },
      { name: 'thickness', paramType: 'Number', description: 'Lattice thickness' }
    ],
    outputs: [
      { name: 'lattice', paramType: 'Brep', description: 'Random lattice' }
    ]
  },
  'rnd_node.gh': {
    inputs: [
      { name: 'seed', paramType: 'Integer', description: 'Random seed' },
      { name: 'nodeCount', paramType: 'Integer', description: 'Number of nodes' },
      { name: 'radius', paramType: 'Number', description: 'Node radius' }
    ],
    outputs: [
      { name: 'nodes', paramType: 'Point', description: 'Random nodes' }
    ]
  },
  'SampleGHConvertTo3dm.gh': {
    inputs: [
      { name: 'geometry', paramType: 'Geometry', description: 'Input geometry' },
      { name: 'fileName', paramType: 'Text', description: 'Output filename' }
    ],
    outputs: [
      { name: 'file', paramType: 'Text', description: '3DM file path' }
    ]
  },
  'srf_kmeans.gh': {
    inputs: [
      { name: 'surface', paramType: 'Surface', description: 'Input surface' },
      { name: 'clusters', paramType: 'Integer', description: 'Number of clusters' },
      { name: 'iterations', paramType: 'Integer', description: 'Max iterations' }
    ],
    outputs: [
      { name: 'clusters', paramType: 'Point', description: 'Cluster centers' },
      { name: 'regions', paramType: 'Brep', description: 'Clustered regions' }
    ]
  },
  'value_list.gh': {
    inputs: [
      { name: 'values', paramType: 'Text', description: 'Value list (comma-separated)' },
      { name: 'selectedIndex', paramType: 'Integer', description: 'Selected index' }
    ],
    outputs: [
      { name: 'selectedValue', paramType: 'Text', description: 'Selected value' }
    ]
  }
}

async function getParams(definitionUrl) {
  try {
    // TODO: set and forget!
    compute.url = process.env.RHINO_COMPUTE_URL
    compute.apiKey = process.env.RHINO_COMPUTE_KEY

    const response = await compute.computeFetch('io', { 'pointer': definitionUrl }, false)

    // throw error if response not ok
    if(!response.ok) {
      throw new Error(`Rhino Compute error: ${response.status} ${response.statusText}`)
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

    console.log(`✅ Successfully got parameters for ${definitionUrl}`)
    return { description, inputs, outputs, view }

  } catch (error) {
    console.warn(`⚠️  Rhino Compute failed for ${definitionUrl}: ${error.message}`)

    // Extract definition name from URL for fallback
    const urlParts = definitionUrl.split('/')
    const definitionId = urlParts[urlParts.length - 1]

    console.log(`🔍 Looking for definition with ID: ${definitionId}`)
    console.log(`📍 Full URL: ${definitionUrl}`)

    // Try to find the definition in our registered definitions to get the name
    let definitionName = null
    try {
      // This is a bit of a hack but should work for finding the definition name
      const definitions = registerDefinitions()
      console.log(`📋 Available definitions: ${definitions.map(d => `${d.name} (${d.id.substring(0,8)}...)`).join(', ')}`)

      const definition = definitions.find(def => def.id === definitionId)
      if (definition) {
        definitionName = definition.name
        console.log(`✅ Found definition: ${definitionName}`)
      } else {
        console.log(`❌ Definition not found for ID: ${definitionId}`)
      }
    } catch (e) {
      console.warn('Could not find definition name for fallback:', e.message)
    }

    const fallbackDefinition = definitionName && FALLBACK_PARAMS[definitionName]

    if (definitionName && FALLBACK_PARAMS[definitionName]) {
      console.log(`🔄 Using fallback parameters for ${definitionName}`)
      const fallback = FALLBACK_PARAMS[definitionName]
      return {
        description: `Fallback parameters for ${definitionName}`,
        inputs: fallback.inputs,
        outputs: fallback.outputs,
        view: true
      }
    }

    // Generic fallback if specific definition not found
    console.log(`📝 Using generic fallback parameters`)
    return {
      description: 'Generic parameters (Rhino Compute unavailable)',
      inputs: [
        { name: 'input1', paramType: 'Number', description: 'Generic input 1' },
        { name: 'input2', paramType: 'Number', description: 'Generic input 2' }
      ],
      outputs: [
        { name: 'output1', paramType: 'Geometry', description: 'Generic output' }
      ],
      view: true
    }
  }
}

module.exports = { registerDefinitions, getParams }
