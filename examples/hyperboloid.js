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
    addObjects(viewers[0].scene, decodeMany(out['RH_OUT:Configurator'] || out['Configurator']));
    // If still no visible geometry, mesh any Breps from encoded 3dm items explicitly
    if (viewers[0].scene.children.filter(c=>c.isMesh).length === 0){
      const items = out['RH_OUT:Configurator'] || out['Configurator'] || []
      for (const it of items){
        try{
          const dat = JSON.parse(it.data)
          if (dat && dat.encoded){
            const bytes = Uint8Array.from(atob(dat.encoded), c=>c.charCodeAt(0))
            const doc = rhino.File3dm.fromByteArray(bytes)
            if (doc){
              const objs = doc.objects()
              for (let i=0;i<objs.count;i++){
                const ro = objs.get(i); const geo = ro.geometry(); if (!geo) continue;
                if (geo instanceof rhino.Brep){
                  const meshes = rhino.Mesh.createFromBrep(geo, rhino.MeshingParameters.default)
                  if (meshes){ for (let j=0;j<meshes.length;j++){ viewers[0].scene.add(toThreeMesh(meshes.get(j))) } }
                } else if (geo instanceof rhino.Mesh){ viewers[0].scene.add(toThreeMesh(geo)) }
              }
            }
          }
        }catch{}
      }
    }

    // Fit and render
    viewers.forEach(v => { fitView(v); v.render(); })
  }

  function collect(result){
    const map = {};
    for (const entry of (result.values || [])){
      const items = entry.InnerTree?.['{0}'] || [];
      const decoded = items; // delay decode for meshing fallback
      map[entry.ParamName] = decoded;
    }
    return map;
  }

  function decodeMany(items){
    const out = [];
    for (const it of (items||[])){
      const dat = it?.data; if (!dat) continue;
      try {
        const parsed = JSON.parse(dat);
        const obj = rhino.CommonObject.decode(parsed);
        if (obj) out.push(obj);
        else if (parsed && parsed.encoded) out.push({ __encoded3dm: parsed.encoded });
      } catch { out.push(dat); }
    }
    return out;
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

  function fitView(v){
    const box = new THREE.Box3();
    v.scene.traverse(obj=>{ if (obj.isMesh){ box.expandByObject(obj) } });
    if (!box.isEmpty()){
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const halfFovY = (v.camera.fov*Math.PI/180)*0.5;
      const halfFovX = Math.atan(Math.tan(halfFovY)*(v.camera.aspect||1));
      const distY = (size.y*0.5)/Math.tan(halfFovY);
      const distX = (size.x*0.5)/Math.tan(halfFovX);
      const dist = Math.max(distX, distY) * 2.0;
      v.camera.near = Math.max(0.1, dist/100);
      v.camera.far = dist*100;
      v.camera.updateProjectionMatrix();
      const dir = new THREE.Vector3().subVectors(v.camera.position, v.controls.target).normalize();
      v.camera.position.copy(center.clone().add(dir.multiplyScalar(dist)));
      v.controls.target.copy(center);
      v.controls.update();
    }
  }

  function addObjects(scene, arr){
    if (!arr) return;
    for (const obj of arr){
      if (!obj) continue;
      if (obj && obj.__encoded3dm){
        try{
          const bytes = Uint8Array.from(atob(obj.__encoded3dm), c=>c.charCodeAt(0));
          const doc = rhino.File3dm.fromByteArray(bytes);
          if (doc){
            const objs = doc.objects();
            for (let i=0;i<objs.count;i++){
              const ro = objs.get(i); const geo = ro.geometry(); if (!geo) continue;
              if (geo instanceof rhino.Brep){
                const meshes = rhino.Mesh.createFromBrep(geo, rhino.MeshingParameters.default);
                if (meshes){ for (let j=0;j<meshes.length;j++){ scene.add(toThreeMesh(meshes.get(j))) } }
              } else if (geo instanceof rhino.Mesh){ scene.add(toThreeMesh(geo)) }
            }
          }
          continue;
        }catch{}
      }
      if (obj && obj instanceof rhino.Brep){
        const meshes = rhino.Mesh.createFromBrep(obj, rhino.MeshingParameters.default);
        if (meshes) for (let i=0;i<meshes.length;i++) scene.add(toThreeMesh(meshes.get(i)));
      } else if (obj && obj instanceof rhino.Mesh){
        scene.add(toThreeMesh(obj));
      } else if (obj && obj instanceof rhino.Curve){
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

