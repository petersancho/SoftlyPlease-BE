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

// Fallback definitions for when Rhino Compute API is unavailable
const fallbackDefinitions = {
  'TopoOpt.gh': {
    description: 'Advanced Topology Optimization - Structural optimization using finite element analysis',
    inputs: [
      {
        name: 'Design_Width',
        paramType: 'Number',
        default: 1000,
        minimum: 100,
        maximum: 10000,
        step: 50,
        description: 'Width of the design domain (mm)'
      },
      {
        name: 'Design_Height',
        paramType: 'Number',
        default: 500,
        minimum: 50,
        maximum: 5000,
        step: 25,
        description: 'Height of the design domain (mm)'
      },
      {
        name: 'Design_Depth',
        paramType: 'Number',
        default: 100,
        minimum: 10,
        maximum: 1000,
        step: 10,
        description: 'Depth of the design domain (mm)'
      },
      {
        name: 'Load_Magnitude',
        paramType: 'Number',
        default: 10000,
        minimum: 100,
        maximum: 100000,
        step: 500,
        description: 'Applied load magnitude (N)'
      },
      {
        name: 'Load_X',
        paramType: 'Number',
        default: 500,
        minimum: 0,
        maximum: 1000,
        step: 10,
        description: 'Load application point X coordinate (mm)'
      },
      {
        name: 'Load_Y',
        paramType: 'Number',
        default: 250,
        minimum: 0,
        maximum: 500,
        step: 10,
        description: 'Load application point Y coordinate (mm)'
      },
      {
        name: 'Material_Type',
        paramType: 'String',
        default: 'Steel',
        options: ['Steel', 'Aluminum', 'Titanium', 'Carbon_Fiber', 'Concrete'],
        description: 'Material selection for optimization'
      },
      {
        name: 'Youngs_Modulus',
        paramType: 'Number',
        default: 210000,
        minimum: 10000,
        maximum: 400000,
        step: 10000,
        description: 'Material stiffness (MPa)'
      },
      {
        name: 'Poissons_Ratio',
        paramType: 'Number',
        default: 0.3,
        minimum: 0.1,
        maximum: 0.5,
        step: 0.01,
        description: 'Material Poisson\'s ratio'
      },
      {
        name: 'Density',
        paramType: 'Number',
        default: 7850,
        minimum: 1000,
        maximum: 20000,
        step: 100,
        description: 'Material density (kg/m³)'
      },
      {
        name: 'Yield_Strength',
        paramType: 'Number',
        default: 250,
        minimum: 50,
        maximum: 2000,
        step: 10,
        description: 'Material yield strength (MPa)'
      },
      {
        name: 'Volume_Fraction',
        paramType: 'Number',
        default: 0.5,
        minimum: 0.1,
        maximum: 0.9,
        step: 0.05,
        description: 'Target volume fraction (0.1-0.9)'
      },
      {
        name: 'Penalty_Factor',
        paramType: 'Number',
        default: 3.0,
        minimum: 1.0,
        maximum: 10.0,
        step: 0.5,
        description: 'SIMP penalty factor for intermediate densities'
      },
      {
        name: 'Filter_Radius',
        paramType: 'Number',
        default: 5.0,
        minimum: 1.0,
        maximum: 50.0,
        step: 1.0,
        description: 'Mesh filter radius for smoothing (mm)'
      },
      {
        name: 'Mesh_Size',
        paramType: 'Number',
        default: 10,
        minimum: 1,
        maximum: 100,
        step: 1,
        description: 'Finite element mesh size (mm)'
      },
      {
        name: 'Optimization_Method',
        paramType: 'String',
        default: 'SIMP',
        options: ['SIMP', 'Level_Set', 'Topology_Optimization'],
        description: 'Optimization algorithm selection'
      },
      {
        name: 'Constraint_Type',
        paramType: 'String',
        default: 'volume',
        options: ['volume', 'stress', 'compliance', 'combined'],
        description: 'Primary optimization constraint'
      },
      {
        name: 'Max_Iterations',
        paramType: 'Number',
        default: 100,
        minimum: 10,
        maximum: 500,
        step: 10,
        description: 'Maximum optimization iterations'
      },
      {
        name: 'Convergence_Tolerance',
        paramType: 'Number',
        default: 0.001,
        minimum: 0.0001,
        maximum: 0.1,
        step: 0.0001,
        description: 'Convergence criterion tolerance'
      }
    ],
    outputs: [
      {
        name: 'Optimized_Geometry',
        paramType: 'Geometry',
        description: 'Final optimized topology'
      },
      {
        name: 'Density_Distribution',
        paramType: 'Geometry',
        description: 'Element density distribution'
      },
      {
        name: 'Stress_Field',
        paramType: 'Geometry',
        description: 'Von Mises stress distribution'
      },
      {
        name: 'Displacement_Field',
        paramType: 'Geometry',
        description: 'Deformation field visualization'
      },
      {
        name: 'Volume_Fraction_Achieved',
        paramType: 'Number',
        description: 'Achieved volume fraction'
      },
      {
        name: 'Compliance_Value',
        paramType: 'Number',
        description: 'Structural compliance (energy)'
      },
      {
        name: 'Max_Stress',
        paramType: 'Number',
        description: 'Maximum von Mises stress (MPa)'
      },
      {
        name: 'Weight_Reduction',
        paramType: 'Number',
        description: 'Weight reduction percentage'
      },
      {
        name: 'Optimization_Converged',
        paramType: 'Boolean',
        description: 'Whether optimization converged'
      },
      {
        name: 'Iteration_Count',
        paramType: 'Number',
        description: 'Number of iterations performed'
      }
    ],
    view: true,
    category: 'Optimization',
    tags: ['topology', 'structural', 'optimization', 'finite-element', 'SIMP', 'FEA']
  },
  'beam_mod.gh': {
    description: 'Beam Analysis and Modification Tool',
    inputs: [
      {
        name: 'Length',
        paramType: 'Number',
        default: 5000,
        minimum: 1000,
        maximum: 20000,
        step: 100,
        description: 'Beam length (mm)'
      },
      {
        name: 'Load',
        paramType: 'Number',
        default: 10000,
        minimum: 1000,
        maximum: 50000,
        step: 500,
        description: 'Applied load (N)'
      },
      {
        name: 'Material',
        paramType: 'String',
        default: 'Steel',
        options: ['Steel', 'Wood', 'Concrete', 'Aluminum'],
        description: 'Beam material'
      }
    ],
    outputs: [
      {
        name: 'Deflection',
        paramType: 'Number',
        description: 'Maximum deflection (mm)'
      },
      {
        name: 'Stress',
        paramType: 'Number',
        description: 'Maximum stress (MPa)'
      },
      {
        name: 'Safety_Factor',
        paramType: 'Number',
        description: 'Safety factor'
      }
    ],
    view: true,
    category: 'Analysis',
    tags: ['beam', 'analysis', 'structural', 'engineering']
  },
  'Bending_gridshell.gh': {
    description: 'Advanced Grid Shell Analysis - Parametric bending analysis for architectural structures',
    inputs: [
      {
        name: 'Grid_Size_X',
        paramType: 'Number',
        default: 10,
        minimum: 3,
        maximum: 50,
        step: 1,
        description: 'Grid divisions in X direction'
      },
      {
        name: 'Grid_Size_Y',
        paramType: 'Number',
        default: 10,
        minimum: 3,
        maximum: 50,
        step: 1,
        description: 'Grid divisions in Y direction'
      },
      {
        name: 'Height_Amplitude',
        paramType: 'Number',
        default: 5.0,
        minimum: 0.1,
        maximum: 20.0,
        step: 0.1,
        description: 'Maximum height variation (m)'
      },
      {
        name: 'Frequency_X',
        paramType: 'Number',
        default: 2,
        minimum: 1,
        maximum: 10,
        step: 1,
        description: 'Wave frequency in X direction'
      },
      {
        name: 'Frequency_Y',
        paramType: 'Number',
        default: 2,
        minimum: 1,
        maximum: 10,
        step: 1,
        description: 'Wave frequency in Y direction'
      },
      {
        name: 'Material_Thickness',
        paramType: 'Number',
        default: 0.02,
        minimum: 0.005,
        maximum: 0.1,
        step: 0.005,
        description: 'Shell thickness (m)'
      },
      {
        name: 'Youngs_Modulus',
        paramType: 'Number',
        default: 210000,
        minimum: 10000,
        maximum: 400000,
        step: 10000,
        description: 'Material stiffness (MPa)'
      },
      {
        name: 'Poissons_Ratio',
        paramType: 'Number',
        default: 0.3,
        minimum: 0.1,
        maximum: 0.5,
        step: 0.01,
        description: 'Material Poisson\'s ratio'
      }
    ],
    outputs: [
      {
        name: 'Grid_Shell_Geometry',
        paramType: 'Geometry',
        description: 'Generated grid shell surface'
      },
      {
        name: 'Stress_Distribution',
        paramType: 'Geometry',
        description: 'Stress analysis visualization'
      },
      {
        name: 'Displacement_Field',
        paramType: 'Geometry',
        description: 'Deformation analysis'
      },
      {
        name: 'Max_Stress',
        paramType: 'Number',
        description: 'Maximum von Mises stress (MPa)'
      },
      {
        name: 'Max_Displacement',
        paramType: 'Number',
        description: 'Maximum displacement (mm)'
      },
      {
        name: 'Surface_Area',
        paramType: 'Number',
        description: 'Total surface area (m²)'
      }
    ],
    view: true,
    category: 'Architectural',
    tags: ['gridshell', 'architectural', 'bending', 'analysis', 'parametric']
  },
  'BranchNodeRnd.gh': {
    description: 'Branching Node Randomization - Generative branching structures with node variations',
    inputs: [
      {
        name: 'Base_Radius',
        paramType: 'Number',
        default: 50,
        minimum: 10,
        maximum: 200,
        step: 5,
        description: 'Base branch radius (mm)'
      },
      {
        name: 'Branch_Length',
        paramType: 'Number',
        default: 300,
        minimum: 50,
        maximum: 1000,
        step: 25,
        description: 'Average branch length (mm)'
      },
      {
        name: 'Branch_Count',
        paramType: 'Number',
        default: 8,
        minimum: 3,
        maximum: 20,
        step: 1,
        description: 'Number of primary branches'
      },
      {
        name: 'Random_Seed',
        paramType: 'Number',
        default: 42,
        minimum: 1,
        maximum: 1000,
        step: 1,
        description: 'Random seed for reproducible results'
      }
    ],
    outputs: [
      {
        name: 'Branching_Structure',
        paramType: 'Geometry',
        description: 'Generated branching network'
      },
      {
        name: 'Structure_Volume',
        paramType: 'Number',
        description: 'Total structure volume (cm³)'
      },
      {
        name: 'Branch_Density',
        paramType: 'Number',
        description: 'Branches per unit volume'
      }
    ],
    view: true,
    category: 'Generative',
    tags: ['branching', 'randomization', 'generative', 'node', 'parametric']
  },
  'brep_union.gh': {
    description: 'BREP Boolean Union Operations - Advanced solid modeling with union operations',
    inputs: [
      {
        name: 'Primary_Shape',
        paramType: 'String',
        default: 'Box',
        options: ['Box', 'Sphere', 'Cylinder', 'Cone', 'Torus'],
        description: 'Primary shape type'
      },
      {
        name: 'Primary_Size',
        paramType: 'Number',
        default: 100,
        minimum: 10,
        maximum: 500,
        step: 10,
        description: 'Primary shape size (mm)'
      },
      {
        name: 'Offset_X',
        paramType: 'Number',
        default: 50,
        minimum: -200,
        maximum: 200,
        step: 10,
        description: 'Secondary shape X offset (mm)'
      }
    ],
    outputs: [
      {
        name: 'Union_Result',
        paramType: 'Geometry',
        description: 'Boolean union result geometry'
      },
      {
        name: 'Volume',
        paramType: 'Number',
        description: 'Resulting volume (cm³)'
      },
      {
        name: 'Surface_Area',
        paramType: 'Number',
        description: 'Surface area (cm²)'
      }
    ],
    view: true,
    category: 'Modeling',
    tags: ['brep', 'boolean', 'union', 'solid', 'modeling']
  },
  'delaunay.gh': {
    description: 'Delaunay Triangulation - Advanced mesh generation from point clouds',
    inputs: [
      {
        name: 'Point_Count',
        paramType: 'Number',
        default: 50,
        minimum: 10,
        maximum: 1000,
        step: 10,
        description: 'Number of random points'
      },
      {
        name: 'Distribution_Type',
        paramType: 'String',
        default: 'Random',
        options: ['Random', 'Grid', 'Circle', 'Spiral', 'Noise'],
        description: 'Point distribution pattern'
      },
      {
        name: 'Boundary_Size',
        paramType: 'Number',
        default: 1000,
        minimum: 100,
        maximum: 5000,
        step: 100,
        description: 'Boundary size (mm)'
      }
    ],
    outputs: [
      {
        name: 'Delaunay_Mesh',
        paramType: 'Geometry',
        description: 'Generated Delaunay triangulation mesh'
      },
      {
        name: 'Voronoi_Diagram',
        paramType: 'Geometry',
        description: 'Corresponding Voronoi diagram'
      },
      {
        name: 'Triangle_Count',
        paramType: 'Number',
        description: 'Number of triangles in mesh'
      }
    ],
    view: true,
    category: 'Mesh',
    tags: ['delaunay', 'triangulation', 'mesh', 'voronoi', 'points']
  },
  'dresser3.gh': {
    description: '3D Dresser Generator - Parametric furniture design with storage optimization',
    inputs: [
      {
        name: 'Width',
        paramType: 'Number',
        default: 800,
        minimum: 400,
        maximum: 2000,
        step: 50,
        description: 'Dresser width (mm)'
      },
      {
        name: 'Height',
        paramType: 'Number',
        default: 900,
        minimum: 600,
        maximum: 1800,
        step: 50,
        description: 'Dresser height (mm)'
      },
      {
        name: 'Depth',
        paramType: 'Number',
        default: 450,
        minimum: 300,
        maximum: 800,
        step: 25,
        description: 'Dresser depth (mm)'
      },
      {
        name: 'Drawer_Count',
        paramType: 'Number',
        default: 6,
        minimum: 3,
        maximum: 12,
        step: 1,
        description: 'Number of drawers'
      }
    ],
    outputs: [
      {
        name: 'Dresser_Assembly',
        paramType: 'Geometry',
        description: 'Complete dresser model'
      },
      {
        name: 'Total_Storage',
        paramType: 'Number',
        description: 'Total storage volume (liters)'
      },
      {
        name: 'Material_Usage',
        paramType: 'Number',
        description: 'Estimated material usage (m²)'
      }
    ],
    view: true,
    category: 'Furniture',
    tags: ['furniture', 'dresser', 'storage', 'parametric', 'design']
  },
  'metaballTable.gh': {
    description: 'Metaball Table Generator - Organic table design using implicit surfaces',
    inputs: [
      {
        name: 'Metaball_Count',
        paramType: 'Number',
        default: 5,
        minimum: 3,
        maximum: 15,
        step: 1,
        description: 'Number of metaball centers'
      },
      {
        name: 'Base_Radius',
        paramType: 'Number',
        default: 200,
        minimum: 50,
        maximum: 500,
        step: 25,
        description: 'Base metaball radius (mm)'
      },
      {
        name: 'Table_Height',
        paramType: 'Number',
        default: 400,
        minimum: 200,
        maximum: 800,
        step: 25,
        description: 'Table surface height (mm)'
      }
    ],
    outputs: [
      {
        name: 'Table_Surface',
        paramType: 'Geometry',
        description: 'Generated table surface mesh'
      },
      {
        name: 'Table_Legs',
        paramType: 'Geometry',
        description: 'Generated table legs'
      },
      {
        name: 'Surface_Area',
        paramType: 'Number',
        description: 'Table surface area (cm²)'
      },
      {
        name: 'Volume',
        paramType: 'Number',
        description: 'Table volume (cm³)'
      }
    ],
    view: true,
    category: 'Furniture',
    tags: ['metaball', 'organic', 'table', 'implicit', 'surfaces']
  },
  'QuadPanelAperture.gh': {
    description: 'Quad Panel with Aperture - Advanced facade paneling with customizable openings',
    inputs: [
      {
        name: 'Panel_Width',
        paramType: 'Number',
        default: 1000,
        minimum: 500,
        maximum: 3000,
        step: 100,
        description: 'Panel width (mm)'
      },
      {
        name: 'Panel_Height',
        paramType: 'Number',
        default: 1000,
        minimum: 500,
        maximum: 3000,
        step: 100,
        description: 'Panel height (mm)'
      },
      {
        name: 'Aperture_Type',
        paramType: 'String',
        default: 'Circular',
        options: ['Circular', 'Rectangular', 'Hexagonal', 'Custom'],
        description: 'Aperture shape type'
      },
      {
        name: 'Aperture_Size',
        paramType: 'Number',
        default: 300,
        minimum: 50,
        maximum: 800,
        step: 25,
        description: 'Aperture size (mm)'
      }
    ],
    outputs: [
      {
        name: 'Panel_Geometry',
        paramType: 'Geometry',
        description: 'Complete panel with apertures'
      },
      {
        name: 'Aperture_Geometry',
        paramType: 'Geometry',
        description: 'Individual aperture shapes'
      },
      {
        name: 'Open_Area_Ratio',
        paramType: 'Number',
        description: 'Percentage of open area'
      },
      {
        name: 'Weight_Estimate',
        paramType: 'Number',
        description: 'Estimated panel weight (kg)'
      }
    ],
    view: true,
    category: 'Architectural',
    tags: ['panel', 'aperture', 'facade', 'architectural', 'parametric']
  },
  'rnd_lattice.gh': {
    description: 'Random Lattice Generator - Stochastic lattice structures with connectivity optimization',
    inputs: [
      {
        name: 'Lattice_Type',
        paramType: 'String',
        default: 'Cubic',
        options: ['Cubic', 'Hexagonal', 'Octagonal', 'Custom'],
        description: 'Base lattice structure type'
      },
      {
        name: 'Unit_Size',
        paramType: 'Number',
        default: 50,
        minimum: 10,
        maximum: 200,
        step: 5,
        description: 'Unit cell size (mm)'
      },
      {
        name: 'Grid_Size_X',
        paramType: 'Number',
        default: 10,
        minimum: 3,
        maximum: 50,
        step: 1,
        description: 'Grid divisions in X'
      },
      {
        name: 'Random_Seed',
        paramType: 'Number',
        default: 123,
        minimum: 1,
        maximum: 10000,
        step: 1,
        description: 'Random seed for reproducibility'
      }
    ],
    outputs: [
      {
        name: 'Lattice_Structure',
        paramType: 'Geometry',
        description: 'Generated lattice geometry'
      },
      {
        name: 'Volume_Ratio',
        paramType: 'Number',
        description: 'Material volume ratio'
      },
      {
        name: 'Connectivity_Degree',
        paramType: 'Number',
        description: 'Average node connectivity'
      }
    ],
    view: true,
    category: 'Structural',
    tags: ['lattice', 'random', 'stochastic', 'structure', 'parametric']
  },
  'rnd_node.gh': {
    description: 'Random Node Generator - Node-based systems with procedural generation',
    inputs: [
      {
        name: 'Node_Count',
        paramType: 'Number',
        default: 20,
        minimum: 5,
        maximum: 200,
        step: 5,
        description: 'Number of nodes to generate'
      },
      {
        name: 'Distribution_Type',
        paramType: 'String',
        default: 'Random_3D',
        options: ['Random_3D', 'Spherical', 'Cylindrical', 'Planar', 'Clustered'],
        description: 'Node distribution pattern'
      },
      {
        name: 'Bounding_Volume',
        paramType: 'Number',
        default: 1000,
        minimum: 100,
        maximum: 5000,
        step: 100,
        description: 'Bounding volume size (mm)'
      },
      {
        name: 'Connection_Distance',
        paramType: 'Number',
        default: 200,
        minimum: 50,
        maximum: 1000,
        step: 25,
        description: 'Maximum connection distance (mm)'
      }
    ],
    outputs: [
      {
        name: 'Node_Geometry',
        paramType: 'Geometry',
        description: 'Generated node spheres/points'
      },
      {
        name: 'Connection_Lines',
        paramType: 'Geometry',
        description: 'Node connection curves'
      },
      {
        name: 'Node_Density',
        paramType: 'Number',
        description: 'Nodes per unit volume'
      },
      {
        name: 'Average_Connectivity',
        paramType: 'Number',
        description: 'Average connections per node'
      }
    ],
    view: true,
    category: 'Generative',
    tags: ['nodes', 'random', 'network', 'procedural', 'connections']
  },
  'SampleGHConvertTo3dm.gh': {
    description: 'Grasshopper to Rhino Converter - Export Grasshopper geometry to Rhino 3DM format',
    inputs: [
      {
        name: 'Geometry_Type',
        paramType: 'String',
        default: 'Mesh',
        options: ['Mesh', 'Brep', 'Curve', 'Points', 'Mixed'],
        description: 'Type of geometry to generate and convert'
      },
      {
        name: 'Element_Count',
        paramType: 'Number',
        default: 10,
        minimum: 1,
        maximum: 100,
        step: 1,
        description: 'Number of geometric elements'
      },
      {
        name: 'Size_Scale',
        paramType: 'Number',
        default: 100,
        minimum: 10,
        maximum: 1000,
        step: 10,
        description: 'Overall scale factor (mm)'
      }
    ],
    outputs: [
      {
        name: 'Generated_Geometry',
        paramType: 'Geometry',
        description: 'Geometry ready for 3DM export'
      },
      {
        name: 'Export_Status',
        paramType: 'String',
        description: 'Export operation status'
      },
      {
        name: 'Object_Count',
        paramType: 'Number',
        description: 'Number of exported objects'
      }
    ],
    view: true,
    category: 'Export',
    tags: ['export', '3dm', 'rhino', 'converter', 'file']
  },
  'srf_kmeans.gh': {
    description: 'Surface K-Means Clustering - Machine learning approach to surface analysis and clustering',
    inputs: [
      {
        name: 'Base_Surface',
        paramType: 'String',
        default: 'Plane',
        options: ['Plane', 'Cylinder', 'Sphere', 'Torus', 'Freeform'],
        description: 'Base surface type for analysis'
      },
      {
        name: 'Surface_Size',
        paramType: 'Number',
        default: 1000,
        minimum: 200,
        maximum: 5000,
        step: 100,
        description: 'Base surface size (mm)'
      },
      {
        name: 'Sample_Points',
        paramType: 'Number',
        default: 1000,
        minimum: 100,
        maximum: 10000,
        step: 100,
        description: 'Number of sample points on surface'
      },
      {
        name: 'Cluster_Count',
        paramType: 'Number',
        default: 5,
        minimum: 2,
        maximum: 20,
        step: 1,
        description: 'Number of K-means clusters'
      }
    ],
    outputs: [
      {
        name: 'Clustered_Surface',
        paramType: 'Geometry',
        description: 'Surface divided into clusters'
      },
      {
        name: 'Cluster_Centroids',
        paramType: 'Geometry',
        description: 'Cluster center points'
      },
      {
        name: 'Cluster_Sizes',
        paramType: 'Number',
        description: 'Size of each cluster'
      },
      {
        name: 'Cluster_Quality',
        paramType: 'Number',
        description: 'Clustering quality metric (0-1)'
      }
    ],
    view: true,
    category: 'Analysis',
    tags: ['kmeans', 'clustering', 'machine-learning', 'surface', 'analysis']
  },
  'value_list.gh': {
    description: 'Value List Processor - Advanced data manipulation and list operations',
    inputs: [
      {
        name: 'Input_List',
        paramType: 'String',
        default: '1,2,3,4,5',
        description: 'Input values as comma-separated list'
      },
      {
        name: 'Operation_Type',
        paramType: 'String',
        default: 'Sort',
        options: ['Sort', 'Reverse', 'Shuffle', 'Filter', 'Transform', 'Statistics'],
        description: 'List operation to perform'
      },
      {
        name: 'Sort_Order',
        paramType: 'String',
        default: 'Ascending',
        options: ['Ascending', 'Descending'],
        description: 'Sort order (for sort operation)'
      }
    ],
    outputs: [
      {
        name: 'Processed_List',
        paramType: 'String',
        description: 'Processed list result'
      },
      {
        name: 'List_Length',
        paramType: 'Number',
        description: 'Length of processed list'
      },
      {
        name: 'Processing_Time',
        paramType: 'Number',
        description: 'Processing time (ms)'
      }
    ],
    view: true,
    category: 'Data',
    tags: ['data', 'list', 'processing', 'manipulation', 'statistics']
  },
  'docString.gh': {
    description: 'Documentation String Generator - Automated documentation from Grasshopper definitions',
    inputs: [
      {
        name: 'Input_Text',
        paramType: 'String',
        default: 'Sample documentation text',
        description: 'Text to process for documentation'
      },
      {
        name: 'Font_Size',
        paramType: 'Number',
        default: 12,
        minimum: 6,
        maximum: 72,
        step: 1,
        description: 'Font size for generated text'
      },
      {
        name: 'Text_Width',
        paramType: 'Number',
        default: 200,
        minimum: 50,
        maximum: 1000,
        step: 25,
        description: 'Maximum text width (mm)'
      }
    ],
    outputs: [
      {
        name: 'Documentation_Text',
        paramType: 'Geometry',
        description: 'Generated documentation curves'
      },
      {
        name: 'Text_Boundary',
        paramType: 'Geometry',
        description: 'Text bounding rectangle'
      },
      {
        name: 'Character_Count',
        paramType: 'Number',
        description: 'Total character count'
      }
    ],
    view: true,
    category: 'Documentation',
    tags: ['documentation', 'text', 'string', 'typography']
  }
}

// Function to get definition data with fallback support
function getFallbackDefinition(filename) {
  return fallbackDefinitions[filename] || {
    description: `Definition: ${filename}`,
    inputs: [],
    outputs: [],
    view: true
  }
}

async function getParams(definitionUrl) {
  // TODO: set and forget!
  compute.url = process.env.RHINO_COMPUTE_URL
  compute.apiKey = process.env.RHINO_COMPUTE_KEY

  // Extract filename from URL for fallback lookup
  const urlParts = definitionUrl.split('/')
  const filename = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2] || 'unknown'
  console.log(`🔍 Processing definition URL: ${definitionUrl}`)
  console.log(`📁 Extracted filename: ${filename}`)

  try {
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

  } catch (error) {
    console.log(`⚠️  Using fallback definition for ${filename} - ${error.message}`)
    console.log(`🔍 Available fallback definitions:`, Object.keys(fallbackDefinitions))

    // Return fallback definition if available
    const fallback = getFallbackDefinition(filename)
    console.log(`📋 Returning fallback for ${filename}:`, fallback.inputs?.length || 0, 'inputs')
    return fallback
  }
}

module.exports = { registerDefinitions, getParams }
