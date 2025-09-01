(async () => {
  const rhino = await rhino3dm();
  const viewers = [makeViewer('cv1'), makeViewer('cv2'), makeViewer('cv3')];

  // Phase 2: hardcoded baseline payload
  const inputs = {
    'RH_IN:move_a': 0,
    'RH_IN:move_b': 0,
    'RH_IN:elipse_x': 12,
    'RH_IN:elipse_y': 8,
    'RH_IN:twist_configurator_rings': 45,
    'RH_IN:configurator_height': 60,
    'RH_IN:move_cone_a': 5,
    'RH_IN:move_cone_b': -3,
    'RH_IN:move_cone_c': 2,
    'RH_IN:array_panels': 24
  };

  await solveAndRender(inputs);

  async function solveAndRender(payloadInputs){
    let result;
    try {
      const res = await fetch('/solve-hyperboloid', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ definition:'Hyperboloid.ghx', inputs: payloadInputs })
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text||('HTTP '+res.status));
      result = JSON.parse(text);
    } catch (e) {
      console.error('Solve failed:', e);
      return;
    }

    // Clear scenes
    viewers.forEach(v => clearScene(v.scene));

    // Collect outputs
    const out = collect(result);

    // Phase 2: render only Configurator in viewer 1
    addObjects(viewers[0].scene, out['RH_OUT:Configurator'] || out['Configurator']);

    viewers.forEach(v => v.render());
  }

  function collect(result){
    const map = {};
    for (const entry of (result.values || [])){
      const items = entry.InnerTree?.['{0}'] || [];
      const decoded = items.map(it => {
        try { return rhino.CommonObject.decode(JSON.parse(it.data)); }
        catch { return it.data; }
      });
      map[entry.ParamName] = decoded;
    }
    return map;
  }

  function makeViewer(canvasId){
    const canvas = document.getElementById(canvasId);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0xf8f8f8);
    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth/canvas.clientHeight, 0.1, 10000);
    camera.position.set(60,60,60);
    const controls = new THREE.OrbitControls(camera, renderer.domElement); controls.target.set(0,0,0); controls.update();
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dir = new THREE.DirectionalLight(0xffffff, 0.6); dir.position.set(1,1,1); scene.add(dir);
    function resize(){ const w=canvas.clientWidth,h=canvas.clientHeight; if(canvas.width!==w||canvas.height!==h){ renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); } }
    function render(){ resize(); renderer.render(scene,camera); }
    return { canvas, renderer, scene, camera, controls, render };
  }

  function addObjects(scene, arr){
    if (!arr) return;
    for (const obj of arr){
      if (!obj) continue;
      if (obj instanceof rhino.Brep){
        const meshes = rhino.Mesh.createFromBrep(obj, rhino.MeshingParameters.default);
        if (meshes) for (let i=0;i<meshes.length;i++) scene.add(toThreeMesh(meshes.get(i)));
      } else if (obj instanceof rhino.Mesh){
        scene.add(toThreeMesh(obj));
      } else if (obj instanceof rhino.Curve){
        scene.add(toThreeCurve(obj));
      }
    }
  }

  function toThreeMesh(mesh){
    const geom=new THREE.BufferGeometry(), verts=mesh.vertices(), faces=mesh.faces();
    const pos=[], idx=[];
    for(let i=0;i<verts.count;i++){ const v=verts.get(i); pos.push(v.x,v.y,v.z); }
    for(let i=0;i<faces.count;i++){ const f=faces.get(i); if(f.isTriangle) idx.push(f.a,f.b,f.c); else idx.push(f.a,f.b,f.c,f.a,f.c,f.d); }
    geom.setAttribute('position', new THREE.Float32BufferAttribute(pos,3)); geom.setIndex(idx); geom.computeVertexNormals();
    const mat=new THREE.MeshStandardMaterial({ color:0x999999, metalness:0.1, roughness:0.7, side:THREE.DoubleSide });
    return new THREE.Mesh(geom, mat);
  }

  function toThreeCurve(curve){
    const nurbs = curve.toNurbsCurve(); const pts=nurbs.points(); const arr=[];
    for(let i=0;i<pts.count;i++){ const p=pts.get(i).location; arr.push(new THREE.Vector3(p.x,p.y,p.z)); }
    const g=new THREE.BufferGeometry().setFromPoints(arr); const m=new THREE.LineBasicMaterial({ color:0x333333 });
    return new THREE.Line(g,m);
  }

  function clearScene(scene){
    const keep=new Set(); scene.children.forEach(ch=>{ if(ch.isLight) keep.add(ch); });
    for(let i=scene.children.length-1;i>=0;i--){ const ch=scene.children[i]; if(!keep.has(ch)) scene.remove(ch); }
  }
})();

