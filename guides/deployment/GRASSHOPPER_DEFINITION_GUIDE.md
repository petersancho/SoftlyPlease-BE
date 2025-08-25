# Complete Grasshopper Definition Guide for SoftlyPlease Compute API

This comprehensive guide details everything a Grasshopper designer needs to know to create definitions that work seamlessly with the SoftlyPlease Compute REST API architecture. It covers file placement, parameter design, API integration, testing, deployment, and troubleshooting.

## Table of Contents

### 1. System Architecture Overview
### 2. File Placement and Discovery
### 3. Definition Registration Process
### 4. Parameter Design and Structure
### 5. Input Parameter Requirements
### 6. Output Parameter Design
### 7. API Endpoint Generation
### 8. Data Type Compatibility
### 9. Definition Metadata
### 10. Performance Considerations
### 11. Error Handling in Definitions
### 12. Testing and Validation
### 13. Deployment Workflow
### 14. Version Control Best Practices
### 15. Troubleshooting Common Issues
### 16. Advanced Features
### 17. Examples and Templates
### 18. API Integration Examples

---

## 1. System Architecture Overview

### 1.1 Core Components

The SoftlyPlease Compute system consists of these integrated components:

**Frontend Layer:**
- **Express.js REST API Server** - Handles HTTP requests and responses
- **Definition Registry** - Automatically discovers and registers Grasshopper files
- **Parameter Processor** - Converts API parameters to Grasshopper DataTrees
- **Caching Layer** - Node-cache and Memcached support for performance

**Backend Layer:**
- **Rhino Compute Server** - Geometry computation engine
- **Grasshopper Solver** - Processes definition files with parameters
- **Resthopper Integration** - REST API interface for Grasshopper

**File System Layer:**
- **Definition Storage** - `assets/gh-definitions/` directory for `.gh` and `.ghx` files
- **Hash-based Access** - MD5 hashing for unique file identification
- **Auto-discovery** - Automatic scanning and registration

### 1.2 Data Flow Architecture

```
API Request → Parameter Processing → Definition Lookup → Cache Check → Rhino Compute → Grasshopper Solve → Response
```

**Detailed Flow:**
1. **HTTP Request** arrives at Express server
2. **Parameter Extraction** from query/body parameters
3. **Definition Discovery** by filename in registry
4. **Cache Lookup** using definition hash + parameters
5. **File Serving** via hash-based URL to Rhino Compute
6. **Grasshopper Solving** with DataTree parameters
7. **Result Processing** and JSON response
8. **Cache Storage** for future requests

### 1.3 Supported File Types

| Extension | Format | Support Level | Notes |
|-----------|--------|---------------|-------|
| `.gh` | Grasshopper 3D (current) | **Full Support** | Recommended format |
| `.ghx` | Grasshopper Legacy | **Limited Support** | Legacy format support |

---

## 2. File Placement and Discovery

### 2.1 Required Directory Structure

**Absolute Path Requirement:**
```
C:\SoftlyPlease-Compute\          # Project root
└── src\                          # Source directory
    └── files\                    # Grasshopper definitions
        ├── my_definition.gh     # Your files go here
        ├── another_tool.gh      # Multiple files supported
        └── complex_solver.ghx   # Legacy format support
```

**Alternative Path (if different installation):**
```
[Project_Root]/
└── src/
    └── files/
        └── [your_definition_files]
```

### 2.2 File Naming Requirements

**Mandatory Rules:**
- **Extensions**: Must be `.gh` (preferred) or `.ghx` (legacy)
- **Case Sensitivity**: File system dependent (Windows is case-insensitive)
- **Special Characters**: Avoid spaces and special characters in filenames
- **Length Limit**: Maximum 255 characters (file system limit)

**Recommended Naming Conventions:**

#### 2.2.1 URL-Friendly Names
```bash
# ✓ Good Examples
beam_generator.gh
structural_analysis.gh
geometry_optimizer.gh
mesh_processor.gh
data_visualizer.gh

# ✗ Avoid These
My Complex Solver.gh      # Spaces problematic
solver-v2-final.gh        # Hyphens can cause issues
Solver(Backup).gh         # Parentheses and special chars
```

#### 2.2.2 Descriptive Naming Patterns
```
[category]_[action]_[variant].gh

# Examples:
structural_beam_generator_v2.gh
geometry_mesh_optimizer.gh
analysis_stress_calculator.gh
fabrication_panel_layout.gh
```

#### 2.2.3 Version Control Friendly
```bash
# Version in filename for major changes
beam_calculator_v2.gh
beam_calculator_v3.gh

# Or use Git tags for version tracking
beam_calculator.gh  # Version in Git
```

### 2.3 Auto-Discovery Process

**How the System Finds Your Files:**

```javascript
// From src/definitions.js - registerDefinitions() function
function registerDefinitions() {
  let files = getFilesSync(path.join(__dirname, 'files/'))
  let definitions = []

  files.forEach( file => {
    // Step 1: Extension Check
    if(file.includes('.gh') || file.includes('.ghx')) {

      // Step 2: Full Path Resolution
      const fullPath = path.join(__dirname, 'files/' + file)

      // Step 3: Hash Generation (MD5)
      const hash = md5File.sync(fullPath)

      // Step 4: Definition Registration
      definitions.push({
        name: file,              // Original filename
        id: hash,               // Unique MD5 hash
        path: fullPath          // Absolute file path
      })
    }
  })

  return definitions
}
```

**Discovery Timing:**
- **Automatic**: On server startup/restart
- **Manual Trigger**: `npm restart` command
- **Hot Reload**: Not supported (requires restart)
- **Real-time**: No file watching (static registration)

### 2.4 File Access Permissions

**Required Permissions:**
- **Read Access**: System must be able to read the `.gh` file
- **Directory Listing**: System needs to scan `assets/gh-definitions/` directory
- **Hash Calculation**: MD5 computation requires file content access

**Permission Issues:**
```bash
# Check file permissions (Windows)
icacls src\files\my_definition.gh

# Check directory permissions
icacls src\files

# Grant read access if needed
icacls src\files\my_definition.gh /grant Users:R
```

**File Locking Issues:**
- Close Grasshopper before copying files
- Ensure no other processes have file open
- Check for antivirus software interference

---

## 3. Definition Registration Process

### 3.1 Registration Object Structure

**What the System Stores:**

```javascript
{
  name: "beam_generator.gh",                    // Original filename
  id: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",    // MD5 hash (32 chars)
  path: "C:\\SoftlyPlease-Compute\\src\\files\\beam_generator.gh"  // Full path
}
```

**Hash Generation Details:**
- **Algorithm**: MD5 (Message Digest 5)
- **Input**: Complete file content (binary)
- **Output**: 32-character hexadecimal string
- **Purpose**: Unique identification, cache invalidation

### 3.2 Registration Verification

**Check if Definition is Registered:**

```bash
# Method 1: API List Endpoint
curl http://localhost:3000/

# Response includes all registered definitions:
# [{"name":"beam_generator.gh"}, {"name":"mesh_tool.gh"}]

# Method 2: Check specific definition
curl "http://localhost:3000/solve/beam_generator.gh"
# Returns parameter structure if registered

# Method 3: Check file hash
# System generates: /definition/{md5_hash}
```

**Registration Debugging:**

```javascript
// In Node.js console or debug
const definitions = req.app.get('definitions')
console.log('Registered definitions:', definitions)

// Check specific file
const beamDef = definitions.find(d => d.name === 'beam_generator.gh')
console.log('Beam definition:', beamDef)
```

### 3.3 Hash-Based File Access

**Why Hash URLs?**
- **Security**: Prevents directory traversal attacks
- **Caching**: Hash changes when file is modified
- **Uniqueness**: Each file version gets unique URL
- **Performance**: Rhino Compute can cache by hash

**URL Structure:**
```
http://localhost:3000/definition/{32_character_md5_hash}
```

**Example:**
```
Definition File: beam_generator.gh
MD5 Hash: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
Access URL: http://localhost:3000/definition/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Hash Changes When:**
- File content is modified (even single character)
- File is recreated or replaced
- Different file with same name

---

## 4. Parameter Design and Structure

### 4.1 Parameter Discovery Process

**How System Extracts Parameters:**

```javascript
// From src/definitions.js - getParams() function
async function getParams(definitionUrl) {
  // Step 1: Call Rhino Compute /io endpoint
  const response = await compute.computeFetch('io', { 'pointer': definitionUrl }, false)

  // Step 2: Parse JSON response
  let result = await response.json()

  // Step 3: Convert PascalCase to camelCase
  result = camelcaseKeys(result, {deep: true})

  // Step 4: Extract inputs and outputs
  let inputs = result.inputs === undefined ? result.inputNames : result.inputs
  let outputs = result.outputs === undefined ? result.outputNames : result.outputs

  // Step 5: Determine if viewable
  let view = true
  inputs.forEach( i => {
    if (i.paramType === 'Geometry' || i.paramType === 'Point' || i.paramType === 'Curve') {
      view = false  // Complex geometry inputs disable viewer
    }
  })

  return { description, inputs, outputs, view }
}
```

### 4.2 Parameter Structure Requirements

**Input Parameter Object:**
```javascript
{
  "name": "Length",              // Parameter name (string)
  "paramType": "Number",         // Data type (string)
  "default": [5000],            // Default value (array)
  "minimum": [1000],            // Min value (optional array)
  "maximum": [10000],           // Max value (optional array)
  "options": ["steel", "wood"]  // Options for Text type (optional array)
}
```

**Output Parameter Object:**
```javascript
{
  "name": "Volume",              // Parameter name (string)
  "paramType": "Number"          // Data type (string)
}
```

### 4.3 Data Type Compatibility Matrix

| Grasshopper Type | API Type | Array Format | Example | Supported |
|-----------------|----------|--------------|---------|-----------|
| **Number** | `Number` | `[value]` | `[5000]` | ✅ Full |
| **Integer** | `Integer` | `[value]` | `[10]` | ✅ Full |
| **Text** | `Text` | `["value"]` | `["steel"]` | ✅ Full |
| **Boolean** | `Boolean` | `[true/false]` | `[true]` | ✅ Full |
| **Point3d** | `Point` | `[[x,y,z]]` | `[[0,0,0]]` | ✅ Full |
| **Vector3d** | `Vector` | `[[x,y,z]]` | `[[1,0,0]]` | ✅ Full |
| **Geometry** | `Geometry` | Binary data | Complex | ⚠️ Limited |
| **Curve** | `Curve` | Binary data | Complex | ⚠️ Limited |
| **Mesh** | `Mesh` | Binary data | Complex | ⚠️ Limited |
| **Surface** | `Surface` | Binary data | Complex | ⚠️ Limited |
| **Brep** | `Brep` | Binary data | Complex | ⚠️ Limited |

**Type Notes:**
- **Geometry Types**: Complex binary data, may cause issues with viewer
- **Array Wrapping**: All values must be wrapped in arrays for DataTree format
- **Default Values**: Strongly recommended for all parameters

---

## 5. Input Parameter Requirements

### 5.1 Mandatory Parameter Properties

**Required for All Inputs:**
```javascript
{
  "name": "ParameterName",       // Must match Grasshopper input name exactly
  "paramType": "Number",         // Must be valid Grasshopper type
  "default": [value]            // Must have default (array format)
}
```

### 5.2 Parameter Naming Rules

**Critical Requirements:**
- **Exact Match**: API parameter names must match Grasshopper input names exactly
- **Case Sensitive**: "Length" ≠ "length" ≠ "LENGTH"
- **No Spaces**: Use underscores or camelCase: "beam_length" or "beamLength"
- **Alphanumeric**: Letters, numbers, underscores only
- **Length Limit**: 1-255 characters

**Common Issues:**
```javascript
// ❌ Wrong - will cause "parameter not found" errors
Grasshopper Input: "Length (mm)"
API Call: ?length=5000

// ✅ Correct - exact name match
Grasshopper Input: "Length"
API Call: ?Length=5000

// ✅ Correct - exact match with units
Grasshopper Input: "Length (mm)"
API Call: ?Length%20(mm)=5000  // URL encoded
```

### 5.3 Default Value Best Practices

**Why Defaults Are Critical:**
- **API Discovery**: System can extract parameter structure without values
- **Error Prevention**: Missing parameters use defaults instead of failing
- **Documentation**: Defaults serve as examples for API consumers

**Default Value Guidelines:**
```javascript
// Numbers: Use reasonable engineering values
"length": [5000],        // 5000mm = 5m
"width": [200],          // 200mm
"height": [300],         // 300mm

// Text: Use most common option
"material": ["steel"],
"type": ["ibeam"],

// Boolean: Use safer option
"enable_analysis": [false],
"show_details": [true],

// Points: Use origin or logical default
"insertion_point": [[0,0,0]],
"reference_point": [[1000,1000,0]]
```

### 5.4 Parameter Validation in Grasshopper

**Add Input Validation Components:**

```
Grasshopper Definition Structure:
├── Input Parameters
│   ├── Length (Number) → [Bounds Component] → [Your Logic]
│   ├── Width (Number) → [Bounds Component] → [Your Logic]
│   └── Material (Text) → [Value List] → [Your Logic]
├── Validation Logic
│   ├── [If Length < 1000 → Error Message]
│   ├── [If Material not in list → Default to "steel"]
│   └── [Range checking for all numeric inputs]
└── Output Parameters
    ├── Results → [Your Output Components]
    └── Error Messages → [Panel with validation results]
```

**Validation Component Examples:**
```grasshopper
// Length validation (Python component)
if length < 1000:
    length = 1000  # Set minimum
    print("Warning: Length increased to minimum 1000mm")

// Material validation (Python component)
valid_materials = ["steel", "wood", "concrete", "aluminum"]
if material not in valid_materials:
    material = "steel"  # Set default
    print("Warning: Invalid material, using steel")
```

### 5.5 Complex Parameter Types

**Point3d Parameters:**
```javascript
// API Format
?insertion_point=0,0,0
?insertion_point=[0,0,0]  // Alternative

// Grasshopper Input: Point3d parameter
// System converts to: Point3d(0,0,0)
```

**List Parameters:**
```javascript
// Multiple values for one parameter
?heights=1000&heights=2000&heights=3000

// Becomes DataTree with multiple branches
// Branch 0: 1000
// Branch 1: 2000
// Branch 2: 3000
```

**DataTree Structure:**
```javascript
// API sends as simple array
?values=1&values=2&values=3

// Grasshopper receives as DataTree
// {0} -> 1
// {1} -> 2
// {2} -> 3
```

---

## 6. Output Parameter Design

### 6.1 Output Parameter Structure

**Required Properties:**
```javascript
{
  "name": "Volume",           // Must match Grasshopper output name exactly
  "paramType": "Number"       // Must be valid Grasshopper type
}
```

### 6.2 Output Naming Best Practices

**Descriptive Names:**
```javascript
// Good Examples
"calculated_volume"
"maximum_stress"
"total_weight"
"geometry_output"
"analysis_results"

// Include Units in Name
"volume_m3"
"stress_kpa"
"weight_kg"
"length_mm"
```

**Avoid Generic Names:**
```javascript
// ❌ Avoid
"Output"
"Result"
"Data"
"Geometry"

// ✅ Better
"BeamGeometry"
"StressAnalysisResult"
"OptimizedMesh"
"PanelLayout"
```

### 6.3 Multiple Output Handling

**Organize Multiple Outputs:**
```javascript
// Single definition with multiple outputs
{
  "outputs": [
    {"name": "MainGeometry", "paramType": "Geometry"},
    {"name": "Volume", "paramType": "Number"},
    {"name": "SurfaceArea", "paramType": "Number"},
    {"name": "Weight", "paramType": "Number"},
    {"name": "AnalysisReport", "paramType": "Text"}
  ]
}
```

**Output Grouping:**
```grasshopper
// Use Panels to group related outputs
"Geometry Group": MainGeometry, PreviewGeometry
"Analysis Group": Volume, Weight, Stress
"Report Group": Summary, Details, Warnings
```

### 6.4 Output Data Type Considerations

**Numeric Outputs:**
- **Precision**: Consider significant digits for your domain
- **Units**: Always specify units in parameter names
- **Range**: Provide realistic expected ranges

**Geometry Outputs:**
- **Complexity**: Consider mesh density and polygon count
- **File Size**: Large geometry may cause API timeouts
- **Format**: Ensure compatible with target applications

**Text Outputs:**
- **Structure**: Use consistent formatting (JSON, CSV, etc.)
- **Length**: Avoid extremely long text outputs
- **Encoding**: Ensure UTF-8 compatibility

---

## 7. API Endpoint Generation

### 7.1 Automatic Endpoint Creation

**For Each Definition, System Creates:**

```javascript
// GET Endpoint (Query Parameters)
GET /solve/{definition_name}?param1=value1&param2=value2

// POST Endpoint (JSON Body)
POST /solve
{
  "definition": "{definition_name}",
  "inputs": {
    "param1": [value1],
    "param2": [value2]
  }
}

// Definition File Access
GET /definition/{md5_hash}

// Parameter Discovery
GET /solve/{definition_name}  // Returns parameter structure
```

### 7.2 Endpoint URL Patterns

**Base URL Structure:**
```
http://localhost:3000/solve/{definition_filename}
```

**Example Endpoints for `beam_generator.gh`:**

```bash
# Parameter discovery (GET with no parameters)
GET /solve/beam_generator.gh

# Simple solve (GET with query parameters)
GET /solve/beam_generator.gh?length=5000&width=200&height=300&material=steel

# Complex solve (POST with JSON body)
POST /solve
{
  "definition": "beam_generator.gh",
  "inputs": {
    "length": [5000],
    "width": [200],
    "height": [300],
    "material": ["steel"],
    "load": [10000]
  }
}

# Definition file access
GET /definition/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### 7.3 Parameter Format Conversion

**How API Parameters Become Grasshopper DataTrees:**

```javascript
// API Input
?length=5000&width=200&material=steel

// System Processing (src/routes/solve.js)
for (let [key, value] of Object.entries(req.query)) {
  let param = new compute.Grasshopper.DataTree(key)
  param.append([0], Array.isArray(value) ? value : [value])
  trees.push(param)
}

// Result: DataTree Structure
{
  "length": {0} -> 5000,
  "width": {0} -> 200,
  "material": {0} -> "steel"
}
```

**POST JSON to DataTree:**
```javascript
// API Input
{
  "inputs": {
    "length": [5000, 6000, 7000],  // Multiple values
    "material": ["steel"]
  }
}

// Becomes DataTree
{
  "length": {0} -> 5000, {1} -> 6000, {2} -> 7000,
  "material": {0} -> "steel"
}
```

---

## 8. Data Type Compatibility

### 8.1 Supported Grasshopper Data Types

| Category | Type | API Support | Notes |
|----------|------|-------------|-------|
| **Primitives** | Number | ✅ Full | Integers, floats, doubles |
| | Integer | ✅ Full | Whole numbers |
| | Text | ✅ Full | Strings, labels |
| | Boolean | ✅ Full | True/false values |
| **Geometry** | Point3d | ✅ Full | [x,y,z] coordinates |
| | Vector3d | ✅ Full | [x,y,z] direction |
| | Line | ✅ Full | Start and end points |
| | Plane | ✅ Full | Origin and axes |
| | Circle | ⚠️ Limited | May require special handling |
| | Arc | ⚠️ Limited | Complex curve data |
| **Complex** | Curve | ⚠️ Limited | Large binary data |
| | Surface | ⚠️ Limited | Complex geometry |
| | Brep | ⚠️ Limited | Boundary representation |
| | Mesh | ⚠️ Limited | Polygon mesh data |
| **Lists** | DataTree | ✅ Full | Nested data structures |
| | Lists | ✅ Full | Simple arrays |

### 8.2 Data Type Mapping Examples

**Numeric Types:**
```javascript
// API → Grasshopper
?length=5000.5
// → DataTree: {0} → 5000.5 (Number)

?count=10
// → DataTree: {0} → 10 (Integer)
```

**Text Types:**
```javascript
// API → Grasshopper
?material=steel
// → DataTree: {0} → "steel" (Text)

?options=option1&options=option2
// → DataTree: {0} → "option1", {1} → "option2"
```

**Point3d Types:**
```javascript
// API → Grasshopper
?point=0,0,0
// → DataTree: {0} → Point3d(0,0,0)

?points=0,0,0&points=1000,0,0&points=1000,1000,0
// → DataTree: {0} → Point3d(0,0,0)
//              {1} → Point3d(1000,0,0)
//              {2} → Point3d(1000,1000,0)
```

### 8.3 DataTree Structure Details

**Single Value:**
```javascript
// API: ?length=5000
// DataTree: {0;0} → 5000

// API: ?material=steel
// DataTree: {0;0} → "steel"
```

**Multiple Values (Same Parameter):**
```javascript
// API: ?length=5000&length=6000&length=7000
// DataTree:
// {0;0} → 5000
// {1;0} → 6000
// {2;0} → 7000
```

**Complex DataTree (POST):**
```javascript
// API POST:
{
  "inputs": {
    "points": [[0,0,0], [1000,0,0], [1000,1000,0]]
  }
}

// DataTree:
// {0;0} → Point3d(0,0,0)
// {1;0} → Point3d(1000,0,0)
// {2;0} → Point3d(1000,1000,0)
```

### 8.4 Type Conversion Rules

**Automatic Conversions:**
- **String to Number**: `"5000"` → `5000`
- **String to Boolean**: `"true"` → `true`, `"false"` → `false`
- **Array to DataTree**: `[1,2,3]` → `{0}→1, {1}→2, {2}→3`

**Error-Prone Conversions:**
```javascript
// Potential Issues
?flag=1          // "1" (string) instead of 1 (number)
?enabled=yes     // "yes" instead of true
?point=0,0,0     // Single string instead of [0,0,0] array
```

---

## 9. Definition Metadata

### 9.1 Definition Description

**How to Add Description:**
```grasshopper
// Add a Panel component with description
"Beam Generator Tool
Generates parameterized structural beams
Supports multiple materials and cross-sections
Outputs: geometry, volume, weight, stress"

Panel → Description Input → Definition Description
```

**Description in API Response:**
```javascript
{
  "description": "Beam Generator Tool\nGenerates parameterized structural beams\nSupports multiple materials and cross-sections\nOutputs: geometry, volume, weight, stress",
  "inputs": [...],
  "outputs": [...]
}
```

### 9.2 Definition Categories and Tags

**Enhanced Definition Structure:**
```javascript
// Custom definition object (advanced)
{
  name: "beam_generator.gh",
  id: hash,
  path: fullPath,
  category: "structural",
  tags: ["beam", "steel", "analysis"],
  description: "Generates structural beam geometry",
  author: "SoftlyPlease Team",
  version: "1.0.0",
  inputs: ["length", "width", "height", "material"],
  outputs: ["geometry", "volume", "weight"]
}
```

### 9.3 Version Information

**Version Tracking Methods:**
1. **Filename Versioning**: `beam_tool_v2.gh`
2. **Git Tags**: Version in repository
3. **Internal Version**: Parameter in definition
4. **API Version**: Separate version endpoint

### 9.4 Definition Dependencies

**Document Dependencies:**
```grasshopper
// Add dependency information in description
"Dependencies:
- Lunchbox Plugin
- Weaverbird Plugin
- Custom Components: BeamTools.gha

Required Plugins:
- Lunchbox (v1.5+)
- Weaverbird (v0.9+)"
```

---

## 10. Performance Considerations

### 10.1 Definition Optimization

**Performance Factors:**
- **Component Count**: Fewer components = faster solving
- **Geometry Complexity**: Simplify meshes and surfaces
- **Calculation Depth**: Avoid unnecessary iterations
- **Data Structure**: Use efficient data types

**Optimization Techniques:**
```grasshopper
// Use caching where possible
// Avoid real-time sliders in API definitions
// Pre-calculate lookup tables
// Use conditional logic to skip unnecessary calculations
```

### 10.2 Memory Management

**Memory Considerations:**
- **Large Geometry**: Can cause memory issues in API
- **Mesh Density**: Reduce polygon count for web delivery
- **Data Retention**: Clean up unused data trees
- **Recursion Limits**: Avoid deeply nested recursion

**Memory Optimization:**
```grasshopper
// Use Simplify Mesh component
// Reduce mesh quality for preview
// Cull unused geometry branches
// Use Clean Tree component
```

### 10.3 Computation Time Limits

**API Timeout Considerations:**
- **Default Timeout**: 30 seconds (configurable)
- **Heavy Computations**: May need longer timeouts
- **Progressive Output**: Provide partial results for long operations
- **Background Processing**: For very long operations

**Timeout Handling:**
```javascript
// In definition, add progress indicators
"Progress: Computing step 1/5"
"Progress: Computing step 2/5"
// ...
"Progress: Complete"
```

### 10.4 Caching Strategy

**Cache Invalidation:**
- **File Changes**: Hash changes automatically invalidate cache
- **Parameter Changes**: Different parameters = different cache keys
- **Manual Clearing**: Restart server to clear Node cache

**Cache Key Structure:**
```javascript
// How cache keys are generated
const key = {
  definition: {
    name: "beam_generator.gh",
    id: "a1b2c3d4e5f6..."  // MD5 hash
  },
  inputs: {
    length: [5000],
    width: [200],
    material: ["steel"]
  }
}
```

---

## 11. Error Handling in Definitions

### 11.1 Input Validation

**Add Validation Logic:**
```grasshopper
// Python component for validation
import rhinoscriptsyntax as rs

# Length validation
if length <= 0:
    length = 1000  # Default minimum
    print("Warning: Length must be positive, using 1000mm")

# Material validation
valid_materials = ["steel", "wood", "concrete", "aluminum"]
if material not in valid_materials:
    material = "steel"
    print("Warning: Invalid material, using steel")
```

**Validation Output:**
```grasshopper
// Add validation output parameter
"ValidationMessages" (Text output)
- Collects all warning and error messages
- Can be returned in API response
```

### 11.2 Error States

**Handle Error Conditions:**
```grasshopper
// Check for computation errors
try:
    result = complex_calculation()
except Exception as e:
    print(f"Error in calculation: {e}")
    result = None

// Provide fallback values
if result is None:
    result = default_value
```

**Error Reporting:**
```grasshopper
// Use Panel components for error messages
"Error: Invalid input parameters"
"Error: Geometry computation failed"
"Error: Memory limit exceeded"

// Collect all errors in single output
"ErrorSummary" (Text parameter)
```

### 11.3 Graceful Degradation

**Fallback Mechanisms:**
```grasshopper
// Provide simplified results if complex computation fails
if complex_method_fails:
    use_simplified_method()
    add_warning("Using simplified calculation method")

// Provide default geometry if generation fails
if geometry_generation_fails:
    use_default_geometry()
    add_warning("Using default geometry")
```

---

## 12. Testing and Validation

### 12.1 Local Testing Process

**Step 1: File Placement**
```bash
# Copy definition to correct location
cp beam_generator.gh assets/gh-definitions/

# Verify file exists and is readable
ls -la assets/gh-definitions/beam_generator.gh
```

**Step 2: Server Restart**
```bash
# Restart to register new definition
npm restart

# Check server logs for registration
tail -f logs/app.log
```

**Step 3: Registration Verification**
```bash
# Check if definition appears in list
curl http://localhost:3000/

# Should include: {"name":"beam_generator.gh"}
```

**Step 4: Parameter Discovery**
```bash
# Get parameter structure
curl "http://localhost:3000/solve/beam_generator.gh"

# Should return JSON with inputs/outputs
```

**Step 5: Basic Solve Test**
```bash
# Test with GET request
curl "http://localhost:3000/solve/beam_generator.gh?length=5000&width=200"

# Test with POST request
curl -X POST http://localhost:3000/solve \
  -H "Content-Type: application/json" \
  -d '{"definition": "beam_generator.gh", "inputs": {"length": [5000], "width": [200]}}'
```

### 12.2 Parameter Testing Matrix

**Create Test Cases:**
```javascript
// Test different parameter combinations
const testCases = [
  { length: 5000, width: 200, material: "steel" },
  { length: 1000, width: 100, material: "wood" },
  { length: 10000, width: 500, material: "concrete" },
  { length: 0, width: 200, material: "steel" },      // Error case
  { length: 5000, width: 0, material: "steel" },     // Error case
  { length: 5000, width: 200, material: "invalid" }  // Error case
]
```

**Automated Testing Script:**
```bash
#!/bin/bash
# test_definition.sh

BASE_URL="http://localhost:3000"
DEFINITION="beam_generator.gh"

echo "Testing $DEFINITION..."

# Test 1: Parameter discovery
echo "1. Parameter discovery:"
curl -s "$BASE_URL/solve/$DEFINITION" | jq '.inputs'

# Test 2: Valid parameters
echo "2. Valid solve:"
curl -s "$BASE_URL/solve/$DEFINITION?length=5000&width=200&material=steel" | jq '.values'

# Test 3: Invalid parameters
echo "3. Invalid parameters:"
curl -s "$BASE_URL/solve/$DEFINITION?length=0&width=200" | jq '.error'

echo "Tests completed."
```

### 12.3 Performance Testing

**Response Time Testing:**
```bash
# Test response time
time curl "http://localhost:3000/solve/beam_generator.gh?length=5000&width=200"

# Multiple requests to test consistency
for i in {1..10}; do
  time curl -s "http://localhost:3000/solve/beam_generator.gh?length=5000&width=200" > /dev/null
done
```

**Load Testing:**
```bash
# Simple load test with parallel requests
seq 1 10 | xargs -n1 -P5 curl -s "http://localhost:3000/solve/beam_generator.gh?length=5000&width=200" > /dev/null
```

### 12.4 Integration Testing

**Full Workflow Test:**
```javascript
// Test complete API workflow
const testFullWorkflow = async () => {
  // 1. Get definition list
  const listResponse = await fetch('http://localhost:3000/')
  const definitions = await listResponse.json()

  // 2. Find our definition
  const ourDef = definitions.find(d => d.name === 'beam_generator.gh')
  if (!ourDef) throw new Error('Definition not found')

  // 3. Get parameters
  const paramResponse = await fetch(`http://localhost:3000/solve/${ourDef.name}`)
  const paramStructure = await paramResponse.json()

  // 4. Solve with parameters
  const solveResponse = await fetch(`http://localhost:3000/solve/${ourDef.name}?length=5000&width=200`)
  const result = await solveResponse.json()

  // 5. Validate result structure
  if (!result.values) throw new Error('No results returned')

  console.log('Full workflow test passed!')
}
```

---

## 13. Deployment Workflow

### 13.1 Development to Production

**Local Development:**
```bash
# 1. Create/modify definition in Grasshopper
# 2. Save as .gh file
# 3. Copy to assets/gh-definitions/
cp beam_generator.gh assets/gh-definitions/

# 4. Test locally
npm restart
curl "http://localhost:3000/solve/beam_generator.gh?length=5000&width=200"
```

**Staging Deployment:**
```bash
# 5. Commit changes
git add assets/gh-definitions/beam_generator.gh
git commit -m "Add beam_generator.gh definition"

# 6. Push to staging branch
git push staging main

# 7. Test on staging server
curl "https://staging-app.herokuapp.com/solve/beam_generator.gh?length=5000&width=200"
```

**Production Deployment:**
```bash
# 8. Merge to production branch
git checkout production
git merge staging

# 9. Push to production
git push production main

# 10. Verify on production
curl "https://production-app.herokuapp.com/solve/beam_generator.gh?length=5000&width=200"
```

### 13.2 Definition Updates

**Minor Updates:**
```bash
# Update existing definition
cp updated_beam_generator.gh assets/gh-definitions/beam_generator.gh

# Test the update
curl "http://localhost:3000/solve/beam_generator.gh?length=5000&width=200"

# Deploy
git add assets/gh-definitions/beam_generator.gh
git commit -m "Update beam_generator.gh - improved accuracy"
git push heroku main
```

**Major Updates (Breaking Changes):**
```bash
# For breaking changes, create new version
cp beam_generator_v2.gh assets/gh-definitions/

# Update API consumers
# Deploy new version alongside old version
git add assets/gh-definitions/beam_generator_v2.gh
git commit -m "Add beam_generator_v2.gh - major improvements"
git push heroku main
```

### 13.3 Rollback Procedures

**Quick Rollback:**
```bash
# Rollback to previous commit
git log --oneline -5  # Find previous commit
git revert HEAD       # Revert last change
git push heroku main  # Deploy rollback
```

**Full Rollback:**
```bash
# Reset to previous state
git reset --hard HEAD~1
git push heroku main --force
```

---

## 14. Version Control Best Practices

### 14.1 Git Workflow for Definitions

**Repository Structure:**
```
assets/gh-definitions/
├── beam_generator.gh         # Current version
├── beam_generator_v1.gh      # Previous versions
├── beam_generator_v2.gh      # Future versions
└── archive/                  # Deprecated definitions
```

**Git Ignore Patterns:**
```bash
# .gitignore for definitions
assets/gh-definitions/*_temp.gh           # Temporary files
assets/gh-definitions/*_backup.gh         # Backup files
assets/gh-definitions/*_old.gh            # Old versions
```

**Commit Messages:**
```bash
# Good commit messages
git commit -m "Add beam_generator.gh - parametric beam tool"
git commit -m "Fix beam_generator.gh - correct volume calculation"
git commit -m "Update beam_generator.gh - add material validation"
git commit -m "Refactor beam_generator.gh - optimize performance"
```

### 14.2 Definition Versioning

**Semantic Versioning:**
```bash
# Version in filename
beam_generator_v1.0.0.gh      # Major.Minor.Patch
beam_generator_v1.1.0.gh      # Added features
beam_generator_v1.1.1.gh      # Bug fixes
```

**Change Documentation:**
```grasshopper
// Document changes in definition
"Version History:
v1.1.1 - Fixed volume calculation bug
v1.1.0 - Added material density lookup
v1.0.0 - Initial release"
```

### 14.3 Collaboration Workflow

**Multiple Designers:**
```bash
# Each designer works on their own branch
git checkout -b feature/beam-improvements

# Make changes to definition
# Test changes locally

# Commit changes
git add assets/gh-definitions/beam_generator.gh
git commit -m "Improve beam_generator.gh accuracy"

# Push branch
git push origin feature/beam-improvements

# Create pull request for review
```

**Code Review Process:**
```bash
# Reviewer tests the changes
curl "http://localhost:3000/solve/beam_generator.gh?length=5000&width=200"

# Review parameter structure
curl "http://localhost:3000/solve/beam_generator.gh"

# Test edge cases
curl "http://localhost:3000/solve/beam_generator.gh?length=0&width=200"
```

---

## 15. Troubleshooting Common Issues

### 15.1 Definition Not Found Errors

**Problem:** "Definition not found on server"
```bash
# Check if file exists
ls -la assets/gh-definitions/my_definition.gh

# Check file extension
file assets/gh-definitions/my_definition.gh

# Restart server
npm restart

# Check registration
curl http://localhost:3000/
```

**Problem:** "Definition not found" after restart
```bash
# Check file permissions
icacls src\files\my_definition.gh

# Check for file locking
# Ensure Grasshopper is closed

# Check file size (empty files cause issues)
ls -lh assets/gh-definitions/my_definition.gh
```

### 15.2 Parameter Errors

**Problem:** "Invalid parameter" errors
```bash
# Get parameter structure
curl "http://localhost:3000/solve/my_definition.gh"

# Check parameter names match exactly
# Check parameter types are correct
# Verify array format
```

**Problem:** Parameters ignored
```javascript
// Check if parameters are properly defined in Grasshopper
// Ensure input components are connected
// Check for parameter name conflicts
// Verify default values are set
```

### 15.3 Solving Errors

**Problem:** Definition fails to solve
```bash
# Check Rhino Compute is running
curl http://localhost:6500/version

# Test in Grasshopper directly
# Check for missing plugins
# Verify all components are valid
```

**Problem:** Timeout errors
```bash
# Check definition complexity
# Reduce geometry detail
# Add progress indicators
# Consider breaking into smaller definitions
```

### 15.4 Performance Issues

**Problem:** Slow response times
```bash
# Check cache is working
curl -H "Server-Timing: *" "http://localhost:3000/solve/..."

# Monitor memory usage
heroku ps:info web.1

# Profile definition performance
```

**Problem:** Memory errors
```bash
# Reduce mesh density
# Clean up unused data
# Use streaming for large outputs
# Implement pagination for results
```

### 15.5 File System Issues

**Problem:** File access denied
```bash
# Check file permissions
icacls src\files\my_definition.gh

# Grant read access
icacls src\files\my_definition.gh /grant Users:R
```

**Problem:** File changes not detected
```bash
# Force server restart
npm restart

# Check if file was properly saved
# Verify no temporary files
```

---

## 16. Advanced Features

### 16.1 Custom Middleware

**Definition-Specific Processing:**
```javascript
// In src/routes/solve.js
function customBeamProcessing(req, res, next) {
  const definition = res.locals.params.definition

  if (definition.name === 'beam_generator.gh') {
    // Custom validation
    const inputs = res.locals.params.inputs

    if (inputs.length && inputs.length[0] > 10000) {
      return next(new Error('Length cannot exceed 10000mm'))
    }

    // Custom parameter processing
    if (inputs.material && inputs.material[0] === 'custom') {
      inputs.density = [7850]  // Steel density kg/m3
    }
  }

  next()
}
```

### 16.2 Webhook Integration

**Post-Solve Notifications:**
```javascript
// Trigger webhooks after successful solve
function triggerWebhook(definition, result, inputs) {
  if (definition.webhook_url) {
    fetch(definition.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        definition: definition.name,
        result: result,
        inputs: inputs,
        timestamp: new Date(),
        success: true
      })
    })
  }
}
```

### 16.3 Custom Response Formatting

**Definition-Specific Output:**
```javascript
// Custom response formatting
function formatBeamResponse(req, res, next) {
  const originalSend = res.send
  res.send = function(data) {
    if (req.params.definition === 'beam_generator.gh') {
      const parsed = JSON.parse(data)

      // Add custom metadata
      parsed.metadata = {
        definition: 'beam_generator.gh',
        computed_at: new Date(),
        version: '1.0.0',
        units: 'mm, kg, m3'
      }

      // Reformat results
      if (parsed.values) {
        const [geometry, volume, weight, stress] = parsed.values
        parsed.results = {
          geometry: geometry,
          volume_m3: volume[0] / 1000000000,  // Convert mm3 to m3
          weight_kg: weight[0],
          stress_kpa: stress[0]
        }
        delete parsed.values
      }

      return originalSend.call(this, JSON.stringify(parsed))
    }

    originalSend.call(this, data)
  }
  next()
}
```

### 16.4 Advanced Parameter Types

**File Upload Parameters:**
```javascript
// For definitions that need file inputs
// Add multer middleware for file uploads
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

// API endpoint
app.post('/upload-geometry', upload.single('file'), (req, res) => {
  // Process uploaded file
  // Pass to Grasshopper definition
})
```

**Real-time Data Integration:**
```javascript
// For definitions that need live data
function fetchLiveData(req, res, next) {
  if (req.params.definition === 'weather_responsive.gh') {
    // Fetch weather data
    fetch('https://api.weather.com/current')
      .then(response => response.json())
      .then(data => {
        // Add to parameters
        req.body.inputs.temperature = [data.temp]
        req.body.inputs.humidity = [data.humidity]
        next()
      })
  } else {
    next()
  }
}
```

---

## 17. Examples and Templates

### 17.1 Basic Definition Template

**Simple Parametric Box:**
```grasshopper
// Input Parameters:
"Length" (Number) = 5000
"Width" (Number) = 2000
"Height" (Number) = 1000

// Logic:
Length → [Number] → [Construct Domain] → [Divide Domain] → Points X
Width → [Number] → [Construct Domain] → [Divide Domain] → Points Y
Height → [Number] → [Construct Domain] → [Divide Domain] → Points Z

Points X,Y,Z → [Construct Point] → [Bounding Box] → Geometry Output
Points X,Y,Z → [Volume] → Volume Output

// Output Parameters:
"Geometry" (Geometry) - 3D box geometry
"Volume" (Number) - Calculated volume in mm³
```

**API Usage:**
```bash
# Solve the box definition
GET /solve/box_generator.gh?Length=5000&Width=2000&Height=1000

# Returns:
{
  "values": [
    ["geometry_data"],
    [10000000000]  // 10,000,000,000 mm³ = 10 m³
  ]
}
```

### 17.2 Advanced Definition with Validation

**Structural Beam Generator:**
```grasshopper
// Input Parameters:
"Length" (Number) = 5000
"Width" (Number) = 200
"Height" (Number) = 300
"Material" (Text) = "steel"

// Validation Logic:
Length → [Bounds] → [Minimum=1000, Maximum=10000]
Width → [Bounds] → [Minimum=50, Maximum=500]
Height → [Bounds] → [Minimum=50, Maximum=500]
Material → [Value List] → ["steel", "wood", "concrete"]

// Material Properties (Python):
if material == "steel":
    density = 7850  # kg/m³
    strength = 250   # MPa
elif material == "wood":
    density = 500   # kg/m³
    strength = 30   # MPa
else:
    density = 2400  # kg/m³
    strength = 20   # MPa

// Calculations:
Length,Width,Height → [Volume] → volume_mm3
volume_mm3 → [Convert Units] → volume_m3
volume_m3 * density → weight_kg

// Stress Analysis:
Load → [Formula] → moment
moment / section_modulus → stress_mpa

// Output Parameters:
"Geometry" (Geometry) - Beam geometry
"Volume" (Number) - Volume in m³
"Weight" (Number) - Weight in kg
"Stress" (Number) - Maximum stress in MPa
"MaterialInfo" (Text) - Material properties summary
```

### 17.3 Real-time Data Integration

**Weather-Responsive Design:**
```grasshopper
// Input Parameters:
"Location" (Text) = "New York"
"Date" (Text) = "2024-01-15"
"Temperature" (Number) = 22.5
"Humidity" (Number) = 65

// Weather API Integration (Python):
import requests

api_key = "your_weather_api_key"
location = "New York"

response = requests.get(f"https://api.weather.com/{location}?key={api_key}")
weather_data = response.json()

temperature = weather_data['temp']
humidity = weather_data['humidity']

// Adaptive Design Logic:
if temperature > 25:
    shading_factor = 0.8
elif temperature < 10:
    shading_factor = 0.3
else:
    shading_factor = 0.5

// Generate responsive geometry
temperature, humidity → [Adaptive Components] → Responsive Geometry

// Output Parameters:
"ResponsiveGeometry" (Geometry) - Weather-adapted design
"WeatherSummary" (Text) - Current conditions
"DesignStrategy" (Text) - Adaptation strategy used
```

---

## 18. API Integration Examples

### 18.1 JavaScript Integration

**Basic API Call:**
```javascript
// Simple solve request
async function solveBeam() {
  const response = await fetch('/solve/beam_generator.gh?length=5000&width=200&height=300')
  const result = await response.json()

  if (result.values) {
    const [geometry, volume, weight, stress] = result.values
    console.log(`Volume: ${volume[0]} mm³`)
    console.log(`Weight: ${weight[0]} kg`)
    console.log(`Stress: ${stress[0]} MPa`)
  }
}
```

**Advanced Integration:**
```javascript
// Complete integration with error handling
class GrasshopperAPI {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl
  }

  // Get available definitions
  async getDefinitions() {
    const response = await fetch(`${this.baseUrl}/`)
    return await response.json()
  }

  // Get definition parameters
  async getParameters(definitionName) {
    const response = await fetch(`${this.baseUrl}/solve/${definitionName}`)
    return await response.json()
  }

  // Solve definition
  async solve(definitionName, inputs, method = 'GET') {
    let url, options

    if (method === 'GET') {
      // Convert inputs to query parameters
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(inputs)) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v))
        } else {
          params.append(key, value)
        }
      }
      url = `${this.baseUrl}/solve/${definitionName}?${params}`
      options = {}
    } else {
      // POST method
      url = `${this.baseUrl}/solve`
      options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ definition: definitionName, inputs })
      }
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  // Batch solve multiple definitions
  async solveBatch(requests) {
    const promises = requests.map(req =>
      this.solve(req.definition, req.inputs, req.method)
    )
    return await Promise.all(promises)
  }
}

// Usage example
const api = new GrasshopperAPI()

// Get all definitions
const definitions = await api.getDefinitions()

// Solve a beam
const result = await api.solve('beam_generator.gh', {
  length: [5000],
  width: [200],
  height: [300],
  material: ['steel']
})

console.log('Beam solved:', result)
```

### 18.2 Python Integration

**Basic API Client:**
```python
import requests
import json

class GrasshopperClient:
    def __init__(self, base_url='http://localhost:3000'):
        self.base_url = base_url

    def get_definitions(self):
        """Get all available definitions"""
        response = requests.get(f"{self.base_url}/")
        return response.json()

    def get_parameters(self, definition_name):
        """Get definition parameters"""
        response = requests.get(f"{self.base_url}/solve/{definition_name}")
        return response.json()

    def solve_get(self, definition_name, **kwargs):
        """Solve using GET request"""
        params = {}
        for key, value in kwargs.items():
            if isinstance(value, list):
                params[key] = value
            else:
                params[key] = [value]

        response = requests.get(
            f"{self.base_url}/solve/{definition_name}",
            params=params
        )
        return response.json()

    def solve_post(self, definition_name, inputs):
        """Solve using POST request"""
        data = {
            'definition': definition_name,
            'inputs': inputs
        }

        response = requests.post(
            f"{self.base_url}/solve",
            json=data,
            headers={'Content-Type': 'application/json'}
        )
        return response.json()

# Usage example
client = GrasshopperClient()

# Get definitions
definitions = client.get_definitions()
print("Available definitions:", definitions)

# Solve beam using GET
result = client.solve_get(
    'beam_generator.gh',
    length=5000,
    width=200,
    height=300,
    material='steel'
)
print("Beam result:", result)

# Solve using POST
result = client.solve_post('beam_generator.gh', {
    'length': [5000],
    'width': [200],
    'height': [300],
    'material': ['steel']
})
print("POST result:", result)
```

### 18.3 C# Integration

**For Rhino/Grasshopper Plugin Developers:**
```csharp
using System.Net.Http;
using System.Text;
using Newtonsoft.Json;

public class GrasshopperApiClient
{
    private readonly HttpClient _client;
    private readonly string _baseUrl;

    public GrasshopperApiClient(string baseUrl = "http://localhost:3000")
    {
        _client = new HttpClient();
        _baseUrl = baseUrl;
    }

    public async Task<List<DefinitionInfo>> GetDefinitionsAsync()
    {
        var response = await _client.GetAsync($"{_baseUrl}/");
        response.EnsureSuccessStatusCode();

        var content = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<List<DefinitionInfo>>(content);
    }

    public async Task<ParameterInfo> GetParametersAsync(string definitionName)
    {
        var response = await _client.GetAsync($"{_baseUrl}/solve/{definitionName}");
        response.EnsureSuccessStatusCode();

        var content = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ParameterInfo>(content);
    }

    public async Task<SolveResult> SolveGetAsync(string definitionName, Dictionary<string, object> inputs)
    {
        var queryParams = new List<string>();
        foreach (var input in inputs)
        {
            if (input.Value is IEnumerable<object> list)
            {
                foreach (var item in list)
                {
                    queryParams.Add($"{input.Key}={item}");
                }
            }
            else
            {
                queryParams.Add($"{input.Key}={input.Value}");
            }
        }

        var queryString = string.Join("&", queryParams);
        var response = await _client.GetAsync($"{_baseUrl}/solve/{definitionName}?{queryString}");
        response.EnsureSuccessStatusCode();

        var content = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<SolveResult>(content);
    }

    public async Task<SolveResult> SolvePostAsync(string definitionName, Dictionary<string, List<object>> inputs)
    {
        var requestData = new
        {
            definition = definitionName,
            inputs = inputs
        };

        var json = JsonConvert.SerializeObject(requestData);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _client.PostAsync($"{_baseUrl}/solve", content);
        response.EnsureSuccessStatusCode();

        var responseContent = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<SolveResult>(responseContent);
    }
}

// Data classes
public class DefinitionInfo
{
    public string Name { get; set; }
}

public class ParameterInfo
{
    public string Description { get; set; }
    public List<InputParameter> Inputs { get; set; }
    public List<OutputParameter> Outputs { get; set; }
    public bool View { get; set; }
}

public class InputParameter
{
    public string Name { get; set; }
    public string ParamType { get; set; }
    public List<object> Default { get; set; }
    public List<object> Minimum { get; set; }
    public List<object> Maximum { get; set; }
    public List<string> Options { get; set; }
}

public class OutputParameter
{
    public string Name { get; set; }
    public string ParamType { get; set; }
}

public class SolveResult
{
    public List<List<object>> Values { get; set; }
    public string Error { get; set; }
}

// Usage example
var client = new GrasshopperApiClient();

// Get definitions
var definitions = await client.GetDefinitionsAsync();

// Get parameters
var parameters = await client.GetParametersAsync("beam_generator.gh");

// Solve using GET
var inputs = new Dictionary<string, object>
{
    { "length", 5000 },
    { "width", 200 },
    { "height", 300 },
    { "material", "steel" }
};
var result = await client.SolveGetAsync("beam_generator.gh", inputs);

// Solve using POST
var postInputs = new Dictionary<string, List<object>>
{
    { "length", new List<object> { 5000 } },
    { "width", new List<object> { 200 } },
    { "height", new List<object> { 300 } },
    { "material", new List<object> { "steel" } }
};
var postResult = await client.SolvePostAsync("beam_generator.gh", postInputs);
```

This comprehensive guide covers everything a Grasshopper designer needs to know to create definitions that work seamlessly with the SoftlyPlease Compute REST API architecture. From file placement and parameter design to deployment and troubleshooting, this guide provides all the technical details needed for successful integration.
