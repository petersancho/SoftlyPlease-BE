# Grasshopper Definition Setup for Remote Solving

## Input Parameter Naming Convention

Use the format: `RH_IN:ParameterName`

Examples:
- `RH_IN:GridSize` for a number slider
- `RH_IN:Mesh` for a geometry input
- `RH_IN:Points` for a point collection

## Output Parameter Naming Convention

Use the format: `RH_OUT:ParameterName`

Examples:
- `RH_OUT:Mesh` for geometry output
- `RH_OUT:Analysis` for data output
- `RH_OUT:Points` for point output

## Data Structure Format

### Single Values
```javascript
{
  "definition": "YourDefinition.gh",
  "inputs": {
    "GridSize": [10],
    "Thickness": [0.5]
  }
}
```

### Collections/Lists
```javascript
{
  "definition": "YourDefinition.gh",
  "inputs": {
    "Points": [[x1,y1,z1], [x2,y2,z2], [x3,y3,z3]]
  }
}
```

### Geometry (Meshes, Curves, etc.)
```javascript
{
  "definition": "YourDefinition.gh",
  "inputs": {
    "BaseMesh": [meshData]
  }
}
```

## Common Parameter Types

- **Number**: `[value]` - Single numeric value
- **Boolean**: `[true/false]` - True or false value
- **String**: `["text"]` - Text string
- **Point3d**: `[[x,y,z]]` - Single point coordinates
- **Vector3d**: `[[x,y,z]]` - Direction vector
- **Mesh**: `[meshObject]` - Rhino mesh geometry
- **Curve**: `[curveObject]` - Rhino curve geometry

## Testing Your Definition

1. Open in Rhino/Grasshopper locally
2. Verify all inputs work correctly
3. Check outputs produce expected results
4. Save as `.gh` file
5. Test with App Server solve endpoint

## Example Definition Structure

```
[Input Parameters]
├── RH_IN:Length (Number)
├── RH_IN:Width (Number)
└── RH_IN:Height (Number)

[Grasshopper Logic]
└── Your computational logic here

[Output Parameters]
└── RH_OUT:Volume (Number)
```
