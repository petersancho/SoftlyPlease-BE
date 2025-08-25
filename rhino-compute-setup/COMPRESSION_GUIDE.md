# Performance Optimization with Compression

## Draco Compression for Meshes

Based on the McNeel workshop, here's how to optimize your Grasshopper definitions for web deployment:

### Why Compression Matters

- **Network Traffic**: Large geometry files can be 10-100x smaller with compression
- **Load Times**: Faster transmission means better user experience
- **Storage**: Reduced storage costs for cached results
- **Bandwidth**: Lower bandwidth usage for both server and clients

### Draco Compression in App Server

The workshop showed that Rhino Compute includes Draco compression built into rhino3dm:

```javascript
// Automatic Draco compression in App Server responses
// Meshes are compressed before sending to client
// Clients decompress using rhino3dm library
```

### Implementation in Your Definitions

#### 1. Use Binary Mesh Output
Instead of detailed mesh data, output compressed binary:

```grasshopper
// Your Grasshopper definition should output:
// - Binary mesh data (not detailed ASCII)
// - Use minimal mesh density where possible
// - Consider level-of-detail (LOD) approaches
```

#### 2. Client-Side Decompression
The workshop template handles this automatically:

```javascript
// In your web interface (from the template)
const result = await response.json();
const meshData = result.data.geometry;

// rhino3dm handles decompression automatically
const rhinoMesh = rhino3dm.Mesh.decode(meshData);
// Convert to Three.js for display
```

### Performance Benchmarks from Workshop

- **Without Compression**: 88MB for 1,100 mesh cache
- **With Draco Compression**: ~10% of original size
- **Network Transfer**: 10-100x faster
- **Client Loading**: Significantly faster rendering

### Optimization Tips

#### For Grasshopper Definitions:
1. **Mesh Quality**: Use appropriate mesh density for web (not print quality)
2. **Topology**: Simplify mesh topology where visual fidelity allows
3. **File Size**: Target meshes under 1MB uncompressed
4. **LOD**: Consider multiple detail levels for different use cases

#### For Web Interface:
1. **Progressive Loading**: Load low-res first, then high-res
2. **Caching Strategy**: Cache compressed results, not raw geometry
3. **Memory Management**: Clear old meshes before loading new ones
4. **Error Handling**: Graceful degradation if compression fails

### Monitoring Performance

Use browser dev tools to monitor:
- Network tab: Response sizes and compression ratios
- Performance tab: Memory usage and frame rates
- Console: Compression/decompression timing

### Example Implementation

```javascript
// Check compression ratio in your web interface
async function displayResult(data) {
    console.log('Original mesh size:', data.geometry.size);

    const rhinoMesh = rhino3dm.Mesh.decode(data.geometry);
    console.log('Decompressed mesh vertices:', rhinoMesh.vertices.count);

    // Convert to Three.js and display
    const threeGeometry = convertToThreeJS(rhinoMesh);
    // ... rest of display logic
}
```

### Next Steps

1. **Test Current Definitions**: Measure current mesh sizes
2. **Implement Compression**: Add Draco compression to outputs
3. **Optimize Topology**: Reduce mesh complexity where possible
4. **Monitor Performance**: Use browser tools to track improvements
5. **Iterate**: Adjust compression settings based on results

This optimization can dramatically improve your web-deployed Grasshopper definitions' performance! 🚀
