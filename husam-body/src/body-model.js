import * as THREE from 'three';

/**
 * Educational, procedural anatomy; this is not a segmented CT reconstruction.
 * World axes: +Y superior, +Z anterior, +X the patient's left.
 * Bladder nodules illustrate the pre-TURBT CT context only. They stay entirely
 * within the bladder and do not represent residual tumour or wall invasion.
 */
export function createBodyModel() {
  const group = new THREE.Group();
  group.name = 'Husam · anatomical illustration';
  const skinMaterials = [];
  const organMeshes = [];
  const lesionMeshes = [];
  const liverMarkers = new THREE.Group();
  liverMarkers.name = 'Indeterminate liver findings · schematic markers';
  group.add(liverMarkers);
  const flowParticles = [];
  const flowCurves = [];
  const focusMeshes = { bladder: [], kidney: [], liver: [], hip: [], chest: [] };
  let activeFocus = 'bladder';
  let effectsEnabled = true;
  let presentation = 'anatomy';
  const muscles = new THREE.Group();
  muscles.name = 'Generic superficial muscle anatomy · illustrative';
  muscles.userData.context = 'Illustrative anatomy only; not a finding or patient reconstruction';
  group.add(muscles);

  const skin = new THREE.MeshPhysicalMaterial({
    color: '#bdab98', roughness: .54, metalness: .015,
    transparent: true, opacity: .115, depthWrite: false,
    side: THREE.FrontSide, clearcoat: .18, clearcoatRoughness: .42,
  });
  const skinFine = skin.clone(); skinFine.opacity = .145;
  // Soft Fresnel shading gives the shell a satin silhouette while preserving the
  // view of internal anatomy. This is a presentation material, not a CT surface.
  for (const shell of [skin, skinFine]) {
    shell.userData.shellOpaque = { value: 0 };
    shell.userData.shellMuscle = { value: 0 };
    shell.onBeforeCompile = shader => {
      shader.uniforms.shellOpaque = shell.userData.shellOpaque;
      shader.uniforms.shellMuscle = shell.userData.shellMuscle;
      shader.vertexShader = 'varying vec3 vShellLocal;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vShellLocal = position;');
      shader.fragmentShader = 'uniform float shellOpaque; uniform float shellMuscle; varying vec3 vShellLocal;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
        #include <color_fragment>
        float tissueFibers = sin(vShellLocal.x * 132.0 + sin(vShellLocal.y * 3.5) * 3.0);
        diffuseColor.rgb *= 1.0 - shellMuscle * (0.055 + tissueFibers * 0.045);
      `);
      shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
        float shellFacing = abs(dot(normal, normalize(vViewPosition)));
        float shellRim = pow(1.0 - shellFacing, 2.35);
        float shellSatin = pow(max(0.0, dot(normal, normalize(vec3(-0.5, 0.65, 1.0)))), 9.0);
        diffuseColor.a = mix(diffuseColor.a * (0.67 + 1.48 * shellRim), 1.0, shellOpaque);
        outgoingLight += diffuseColor.rgb * shellRim * 0.15;
        outgoingLight += vec3(0.085) * shellSatin;
        #include <opaque_fragment>
      `);
    };
    shell.customProgramCacheKey = () => 'anatomy-shell-natural-layers-v5';
  }
  skinMaterials.push(skin, skinFine);
  const bone = new THREE.MeshStandardMaterial({
    color: '#dfd2af', roughness: .71, transparent: true,
    opacity: .76, depthWrite: false,
  });
  const boneSoft = bone.clone(); boneSoft.opacity = .61;
  const contourMaterial = new THREE.LineBasicMaterial({
    color: '#d0bba3', transparent: true, opacity: .13, depthWrite: false,
  });
  const organMaterial = (color, opacity = 1) => new THREE.MeshPhysicalMaterial({
    color, roughness: .46, metalness: .015, clearcoat: .24, clearcoatRoughness: .33,
    transparent: opacity < 1, opacity, depthWrite: opacity >= .95,
    emissive: color, emissiveIntensity: .035,
  });

  function mesh(geometry, material, position, scale, parent = group) {
    const item = new THREE.Mesh(geometry, material);
    if (position) item.position.set(...position);
    if (scale) item.scale.set(...scale);
    parent.add(item);
    return item;
  }
  function sphere(position, scale, material, segments = 32, parent = group) {
    return mesh(new THREE.SphereGeometry(1, segments, 24), material, position, scale, parent);
  }
  function tube(points, radius, material, segments = 48, parent = group) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const item = mesh(new THREE.TubeGeometry(curve, segments, radius, 8, false), material, null, null, parent);
    return { item, curve };
  }
  function contour(points, material = contourMaterial) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(96)), material);
    group.add(line);
    return line;
  }
  function selectable(item, id) {
    item.userData.organ = id;
    organMeshes.push(item);
    focusMeshes[id].push(item);
    item.userData.baseEmission = item.material.emissiveIntensity || 0;
    return item;
  }

  // Coincident vertices at the wrapped surface seam share their normals. Without
  // this, a faint vertical crease appears under the studio's side lighting.
  function smoothWrappedNormals(geometry, rows, segments) {
    const normals = geometry.attributes.normal;
    const joined = new THREE.Vector3();
    for (let row = 0; row < rows; row++) {
      const a = row * (segments + 1), b = a + segments;
      joined.set(normals.getX(a) + normals.getX(b), normals.getY(a) + normals.getY(b), normals.getZ(a) + normals.getZ(b)).normalize();
      normals.setXYZ(a, joined.x, joined.y, joined.z);
      normals.setXYZ(b, joined.x, joined.y, joined.z);
    }
    normals.needsUpdate = true;
  }

  // Smooth horizontal sections keep the torso continuous. Broad surface shaping
  // suggests pectoral and abdominal anatomy without drawing extra clinical data.
  function ringBody(rings, material, segments = 72, torso = false) {
    const sourceRings = rings;
    const profile = new THREE.CatmullRomCurve3(rings.map(r => new THREE.Vector3(r[1], r[0], r[2])));
    rings = Array.from({ length: sourceRings.length * 3 }, (_, index) => {
      const t = index / (sourceRings.length * 3 - 1);
      const v = profile.getPoint(t);
      const section = t * (sourceRings.length - 1);
      const low = Math.min(Math.floor(section), sourceRings.length - 2);
      const centerZ = THREE.MathUtils.lerp(sourceRings[low][3] || 0, sourceRings[low + 1][3] || 0, section - low);
      return [v.y, Math.max(.008, v.x), Math.max(.008, v.z), centerZ];
    });
    const positions = [], indices = [], uvs = [];
    for (let j = 0; j < rings.length; j++) {
      const [y, width, depth, centerZ = 0] = rings[j];
      for (let i = 0; i <= segments; i++) {
        const angle = i / segments * Math.PI * 2;
        const x = Math.cos(angle) * width;
        let z = Math.sin(angle) * depth + centerZ;
        if (torso) {
          const front = Math.pow(Math.max(0, Math.sin(angle)), 3);
          const pairedChest = Math.exp(-Math.pow((Math.abs(x) - .46) / .36, 2) - Math.pow((y - 7.62) / .43, 2));
          const sternum = Math.exp(-Math.pow(x / .14, 2) - Math.pow((y - 7.55) / .55, 2));
          const abdomen = Math.exp(-Math.pow(x / .45, 2) - Math.pow((y - 5.87) / .61, 2));
          z += front * (.085 * pairedChest - .028 * sternum + .032 * abdomen);
          const back = Math.pow(Math.max(0, -Math.sin(angle)), 3);
          z -= back * .030 * Math.exp(-Math.pow((Math.abs(x) - .47) / .30, 2) - Math.pow((y - 7.60) / .52, 2));
        }
        positions.push(x, y, z);
        uvs.push(i / segments, j / (rings.length - 1));
        if (j && i) {
          const a = j * (segments + 1) + i, b = a - segments - 1;
          indices.push(a - 1, b, b - 1, a - 1, a, b);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices); geometry.computeVertexNormals();
    smoothWrappedNormals(geometry, rings.length, segments);
    const item = mesh(geometry, material);
    item.name = torso ? 'Continuous anatomical torso shell' : 'Anatomical shell';
    return item;
  }

  function taperedLimb(points, radii, material, segments = 52, circumference = 28) {
    const path = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const frames = path.computeFrenetFrames(segments, false);
    const positions = [], indices = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = path.getPointAt(t);
      const radiusPosition = t * (radii.length - 1);
      const radiusIndex = Math.min(Math.floor(radiusPosition), radii.length - 2);
      const fraction = radiusPosition - radiusIndex;
      const f = fraction * fraction * (3 - 2 * fraction);
      const rx = THREE.MathUtils.lerp(radii[radiusIndex][0], radii[radiusIndex + 1][0], f);
      const rz = THREE.MathUtils.lerp(radii[radiusIndex][1], radii[radiusIndex + 1][1], f);
      for (let j = 0; j <= circumference; j++) {
        const theta = j / circumference * Math.PI * 2;
        const v = point.clone()
          .addScaledVector(frames.normals[i], Math.cos(theta) * rx)
          .addScaledVector(frames.binormals[i], Math.sin(theta) * rz);
        positions.push(v.x, v.y, v.z);
        if (i && j) {
          const a = i * (circumference + 1) + j, b = a - circumference - 1;
          indices.push(a - 1, b - 1, b, a - 1, b, a);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices); geometry.computeVertexNormals();
    smoothWrappedNormals(geometry, segments + 1, circumference);
    return mesh(geometry, material);
  }

  ringBody([
    [4.37, .19, .25, -.035], [4.50, .52, .36, -.045],
    [4.69, .73, .40, -.025], [4.95, .77, .43, 0],
    [5.20, .71, .43, 0], [5.48, .63, .42, 0],
    [5.77, .62, .45, 0], [6.10, .69, .48, 0],
    [6.45, .81, .52, -.015], [6.80, .92, .55, -.025],
    [7.15, 1.03, .56, -.025], [7.49, 1.12, .55, -.035],
    [7.80, 1.17, .51, -.04], [8.03, 1.20, .45, -.045],
    [8.17, 1.11, .39, -.04], [8.30, .85, .33, -.02],
    [8.45, .44, .29, 0], [8.54, .32, .27, 0],
  ], skin, 80, true);
  ringBody([[8.40, .30, .25], [8.56, .29, .25], [8.75, .31, .28], [8.83, .32, .3]], skin);
  ringBody([
    [8.76, .12, .15, .11], [8.81, .23, .26, .06],
    [8.91, .32, .34, .015], [9.06, .39, .39], [9.24, .44, .40],
    [9.46, .455, .41, -.015], [9.65, .43, .40, -.025],
    [9.82, .34, .34, -.03], [9.94, .20, .21, -.035],
    [9.985, .015, .015, -.035],
  ], skinFine);
  // Minimal facial contours keep the figure anonymous and anatomically legible.
  sphere([0, 9.22, .388], [.073, .15, .085], skinFine, 20);
  for (const side of [-1, 1]) {
    sphere([side * .454, 9.24, -.015], [.073, .14, .08], skinFine, 16);
    contour([[side * .055, 9.39, .379], [side * .15, 9.41, .374], [side * .255, 9.38, .337]]);
    contour([[0, 8.49, .25], [side * .42, 8.25, .34], [side * .96, 8.13, .245]]);
    taperedLimb([
      [side * 1.02, 8.09, -.035], [side * 1.28, 7.87, -.01],
      [side * 1.40, 7.25, 0], [side * 1.58, 6.58, .03],
      [side * 1.69, 6.15, .06], [side * 1.82, 5.55, .12],
      [side * 1.92, 5.10, .16],
    ], [[.20, .22], [.30, .28], [.25, .235], [.20, .185], [.20, .18], [.165, .14], [.11, .11]], skin);
    taperedLimb([
      [side * 1.91, 5.16, .16], [side * 1.99, 4.94, .18],
      [side * 2.03, 4.69, .18], [side * 2.05, 4.61, .18],
    ], [[.11, .105], [.15, .09], [.13, .075], [.09, .06]], skinFine, 20);
    for (let finger = 0; finger < 4; finger++) {
      const spread = (finger - 1.5) * .075;
      const length = [.24, .33, .32, .25][finger];
      taperedLimb([
        [side * (2.045 + spread), 4.70, .18],
        [side * (2.06 + spread * 1.15), 4.56, .19],
        [side * (2.08 + spread * 1.28), 4.65 - length, .20],
      ], [[.041, .038], [.036, .033], [.009, .011]], skinFine, 12, 10);
    }
    taperedLimb([[side * 1.91, 4.99, .21], [side * 1.83, 4.79, .28], [side * 1.83, 4.64, .30]], [[.065, .065], [.044, .041], [.012, .014]], skinFine, 15, 12);
    taperedLimb([
      [side * .48, 4.82, -.05], [side * .54, 4.43, -.035],
      [side * .55, 3.72, .01], [side * .53, 2.91, .015],
      [side * .54, 2.59, .035], [side * .55, 2.15, -.01],
      [side * .55, 1.61, -.055], [side * .55, .78, -.01],
      [side * .55, .39, .04],
    ], [[.35, .35], [.39, .37], [.33, .315], [.235, .24], [.21, .22], [.27, .24], [.235, .205], [.14, .135], [.125, .15]], skin);
    // Foot mesh continues the ankle with a low instep and forward toes.
    const foot = sphere([side * .55, .225, .23], [.20, .21, .47], skinFine);
    foot.rotation.x = .06;
    contour([[side * .68, .2, .50], [side * .57, .16, .67], [side * .41, .15, .62]]);
  }

  // Restrained external landmarks help the transparent body read as a person.
  const landmarkMaterial = new THREE.LineBasicMaterial({ color: '#d4b9a0', transparent: true, opacity: .085, depthWrite: false });
  for (const side of [-1, 1]) {
    contour([[side * .15, 7.40, .536], [side * .42, 7.30, .569], [side * .77, 7.40, .435], [side * .96, 7.57, .324]], landmarkMaterial);
    contour([[side * .27, 8.48, .166], [side * .34, 8.37, .252], [side * .47, 8.25, .321]], landmarkMaterial);
    contour([[side * .31, 5.13, .355], [side * .43, 4.98, .342], [side * .59, 4.84, .234]], landmarkMaterial);
  }

  // Vertebrae and rib arcs provide depth without obscuring the highlighted organs.
  tube([[0, 8.52, -.18], [0, 7.9, -.33], [0, 6.75, -.38], [0, 5.72, -.31], [0, 4.65, -.24]], .067, boneSoft);
  for (let i = 0; i < 20; i++) {
    const y = 4.87 + i * .168;
    const z = -.30 - .075 * Math.sin((y - 5) / 3.5 * Math.PI);
    sphere([0, y, z], [.125, .057, .095], bone, 16);
    tube([[-.17, y, z + .01], [0, y + .02, z - .025], [.17, y, z + .01]], .023, boneSoft, 12);
  }
  for (const side of [-1, 1]) {
    for (let rib = 0; rib < 9; rib++) {
      const y = 8.04 - rib * .166;
      const width = [.53, .68, .79, .89, .96, .98, .95, .89, .80][rib];
      tube([
        [side * .10, y, -.30], [side * width * .72, y + .07, -.31],
        [side * width, y - .055, -.04], [side * width * .84, y - .20, .32],
        [side * .13, y - .30 - rib * .013, .43 - rib * .003],
      ], .022, bone, 32);
    }
    tube([[side * .07, 8.26, .27], [side * .50, 8.15, .27], [side * 1.02, 8.11, .035]], .035, bone, 24);
    tube([[side * 1.17, 7.99, -.03], [side * 1.38, 7.34, -.01], [side * 1.57, 6.57, .02]], .052, boneSoft);
    tube([[side * 1.56, 6.55, .02], [side * 1.69, 5.92, .07], [side * 1.90, 5.11, .15]], .034, boneSoft);
    tube([[side * 1.63, 6.5, .035], [side * 1.78, 5.94, .08], [side * 1.94, 5.13, .16]], .027, boneSoft);
    // Iliac crests, pubic arch, and femoral neck establish the hip relationship.
    const iliac = sphere([side * .49, 4.95, -.20], [.36, .46, .11], boneSoft);
    iliac.rotation.z = side * .35;
    tube([[side * .08, 4.95, -.28], [side * .38, 5.27, -.23], [side * .75, 5.14, -.10], [side * .64, 4.67, .01], [side * .32, 4.38, .20], [0, 4.42, .26]], .058, bone, 38);
    tube([[side * .63, 4.76, -.015], [side * .78, 4.48, -.03], [side * .56, 4.28, -.015], [side * .53, 2.61, .045]], .067, boneSoft);
    sphere([side * .54, 2.56, .12], [.13, .13, .07], boneSoft, 16);
    tube([[side * .52, 2.48, .015], [side * .53, 1.57, -.005], [side * .55, .45, .04]], .045, boneSoft);
    tube([[side * .66, 2.45, -.025], [side * .66, 1.4, -.03], [side * .63, .46, .025]], .025, boneSoft);
  }
  tube([[0, 8.03, .36], [0, 7.61, .43], [0, 7.04, .43]], .037, bone, 30);

  // Generic skull and distal bones complete the optional skeletal layer. They
  // are schematic orientation anatomy, never a reconstruction of Husam's skull.
  const skull = new THREE.Group();
  skull.name = 'Generic schematic skull';
  group.add(skull);
  sphere([0, 9.42, -.055], [.397, .46, .344], bone, 48, skull);
  sphere([0, 9.07, .215], [.218, .12, .109], bone, 36, skull);
  const socketMaterial = new THREE.MeshStandardMaterial({ color: '#261d17', roughness: .91 });
  for (const side of [-1, 1]) {
    sphere([side * .149, 9.30, .286], [.108, .091, .059], socketMaterial, 28, skull);
    const orbit = mesh(new THREE.TorusGeometry(.105, .018, 10, 40), bone, [side * .149, 9.30, .311], [1, .87, .62], skull);
    orbit.rotation.y = side * .10;
    tube([[side * .28, 9.23, .08], [side * .294, 9.09, .15], [side * .237, 8.91, .232], [side * .13, 8.875, .296], [0, 8.87, .315]], .033, bone, 34, skull);
    tube([[side * .23, 9.16, .285], [side * .315, 9.20, .18], [side * .35, 9.30, .05]], .034, bone, 24, skull);
    for (let tooth = 0; tooth < 4; tooth++) {
      const x = side * (.029 + tooth * .046);
      sphere([x, 8.982, .303 - tooth * tooth * .0037], [.023, .039, .027], bone, 12, skull);
    }
  }
  const nasalOpening = mesh(new THREE.ConeGeometry(.047, .13, 3), socketMaterial, [0, 9.132, .328], [1, 1, .34], skull);
  nasalOpening.rotation.z = Math.PI;
  skull.traverse(item => { if (item.geometry) item.userData.category = 'skeleton'; });
  for (const side of [-1, 1]) {
    for (let finger = 0; finger < 4; finger++) {
      const spread = (finger - 1.5) * .075;
      const length = [.24, .33, .32, .25][finger];
      tube([[side * 1.95, 5.065, .16], [side * (2.045 + spread), 4.70, .18], [side * (2.06 + spread * 1.15), 4.56, .19], [side * (2.08 + spread * 1.28), 4.65 - length, .20]], .012, bone, 28);
    }
    tube([[side * 1.91, 5.025, .19], [side * 1.83, 4.79, .28], [side * 1.83, 4.655, .30]], .017, bone, 18);
    sphere([side * .55, .18, .115], [.11, .11, .19], bone, 24);
    for (let toe = 0; toe < 5; toe++) {
      const x = side * (.55 + (toe - 2) * .055);
      tube([[x, .165, .22], [x, .12, .38], [x, .105, .57 - toe * .016]], .018, bone, 16);
    }
  }

  // Generic thoracic anatomy locates the chest report. These are educational
  // surfaces, not CT segmentations. No pulmonary lesion is drawn.
  const contextOrgan = organMaterial('#a9868d', .12);
  const lungMaterial = organMaterial('#bb8990', .82);
  const airwayMaterial = organMaterial('#d2c2aa', .94);
  const fissureMaterial = organMaterial('#826775', .65);
  for (const side of [-1, 1]) {
    const geometry = new THREE.SphereGeometry(1, 52, 36);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
      const basalWidth = 1 - .24 * Math.max(y, 0);
      const cardiacNotch = side === 1 && x < 0 && z > 0
        ? .12 * Math.exp(-((y + .22) ** 2) / .18) * -x * z : 0;
      positions.setXYZ(i, x * .41 * basalWidth + cardiacNotch,
        y * .66 + .065 * (1 - y * y), z * .29 * basalWidth);
    }
    geometry.computeVertexNormals();
    const lung = selectable(mesh(geometry, lungMaterial, [side * .49, 7.70, .035]), 'chest');
    lung.name = side < 0 ? 'Right lung · schematic' : 'Left lung · schematic';
    // Surface lines suggest normal fissures, not abnormalities.
    selectable(tube([[side * .27, 7.85, .26], [side * .47, 7.58, .32], [side * .71, 7.25, .20]], .008, fissureMaterial, 26).item, 'chest');
    if (side < 0) selectable(tube([[-.29, 7.63, .30], [-.56, 7.64, .32], [-.81, 7.68, .20]], .008, fissureMaterial, 22).item, 'chest');
    selectable(tube([[0, 8.02, .33], [side * .23, 7.85, .33], [side * .39, 7.62, .33]], .036, airwayMaterial, 24).item, 'chest');
    selectable(tube([[side * .28, 7.80, .33], [side * .46, 8.03, .30], [side * .56, 8.14, .24]], .022, airwayMaterial, 20).item, 'chest');
    selectable(tube([[side * .37, 7.66, .33], [side * .53, 7.48, .31], [side * .60, 7.32, .25]], .021, airwayMaterial, 20).item, 'chest');
  }
  selectable(tube([[0, 8.63, .20], [0, 8.32, .27], [0, 8.02, .33]], .051, airwayMaterial, 30).item, 'chest');
  for (let i = 0; i < 9; i++) {
    const ring = mesh(new THREE.TorusGeometry(.054, .008, 8, 24), airwayMaterial,
      [0, 8.12 + i * .052, .315 - i * .011]);
    ring.rotation.x = Math.PI / 2;
    selectable(ring, 'chest');
  }
  contour([[-.55, 5.49, .37], [-.42, 5.76, .40], [0, 5.84, .42], [.40, 5.70, .38], [.48, 5.44, .32]], new THREE.LineBasicMaterial({ color: '#c2ad9b', transparent: true, opacity: .09, depthWrite: false }));

  // Optional generic superficial muscle layer. These sculpted bundles provide
  // anatomical orientation; their shapes and fibers do not come from the CT.
  const muscleMaterial = new THREE.MeshPhysicalMaterial({
    color: '#974a43', roughness: .62, metalness: 0,
    clearcoat: .12, clearcoatRoughness: .54,
  });
  muscleMaterial.onBeforeCompile = shader => {
    shader.vertexShader = 'varying vec3 vMuscleLocal;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vMuscleLocal = position;');
    shader.fragmentShader = 'varying vec3 vMuscleLocal;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      float fibers = sin(vMuscleLocal.x * 115.0 + sin(vMuscleLocal.y * 4.0) * 2.8);
      float fineFibers = sin(vMuscleLocal.x * 207.0 + vMuscleLocal.y * 3.0);
      float tendon = smoothstep(0.65, 0.99, abs(vMuscleLocal.y));
      diffuseColor.rgb *= 0.91 + fibers * 0.055 + fineFibers * 0.026;
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.63, 0.49, 0.39), tendon * 0.45);
    `);
  };
  muscleMaterial.customProgramCacheKey = () => 'illustrative-muscle-fibers-v1';
  function muscle(name, position, scale, rotation = [0, 0, 0]) {
    const item = sphere(position, scale, muscleMaterial, 36, muscles);
    item.name = name + ' · generic anatomical context';
    item.rotation.set(...rotation);
    return item;
  }
  for (const side of [-1, 1]) {
    muscle('Pectoralis major', [side * .52, 7.69, .43], [.53, .34, .16], [0, side * .09, side * -.16]);
    muscle('Deltoid', [side * 1.19, 7.93, .01], [.26, .39, .26], [0, 0, side * .17]);
    muscle('Biceps brachii', [side * 1.40, 7.17, .12], [.19, .49, .16], [0, 0, side * .19]);
    muscle('Triceps brachii', [side * 1.36, 7.20, -.13], [.18, .48, .15], [0, 0, side * .18]);
    muscle('Forearm flexors', [side * 1.74, 5.99, .12], [.145, .50, .13], [0, 0, side * .21]);
    muscle('Forearm extensors', [side * 1.72, 6.02, -.04], [.14, .49, .105], [0, 0, side * .20]);
    muscle('External oblique', [side * .59, 6.13, .19], [.15, .64, .29], [0, 0, side * -.12]);
    muscle('Latissimus dorsi', [side * .61, 6.99, -.37], [.29, .79, .15], [0, 0, side * -.15]);
    muscle('Trapezius', [side * .48, 8.02, -.28], [.39, .40, .12], [0, 0, side * .45]);
    muscle('Gluteus maximus', [side * .47, 4.76, -.27], [.34, .37, .23], [0, 0, side * -.08]);
    muscle('Rectus femoris', [side * .50, 3.89, .19], [.22, .70, .19], [0, 0, side * -.015]);
    muscle('Vastus lateralis', [side * .74, 3.91, .04], [.16, .73, .21], [0, 0, side * -.11]);
    muscle('Vastus medialis', [side * .37, 3.49, .11], [.15, .41, .18], [0, 0, side * -.12]);
    muscle('Hamstrings', [side * .53, 3.88, -.19], [.235, .71, .16], [0, 0, side * .03]);
    muscle('Gastrocnemius', [side * .56, 1.98, -.12], [.21, .52, .16]);
    muscle('Tibialis anterior', [side * .49, 1.73, .09], [.11, .64, .11], [0, 0, side * .045]);
    for (let segment = 0; segment < 4; segment++) {
      muscle('Rectus abdominis', [side * .19, 7.07 - segment * .37, .515 - segment * .015], [.17, .16, .105]);
    }
  }
  muscles.visible = false;

  // Asymmetric liver, patient's right (screen left from the front).
  const liverMaterial = organMaterial('#793c2d', .96);
  const liverGeometry = new THREE.SphereGeometry(1, 56, 36);
  const liverPosition = liverGeometry.attributes.position;
  for (let i = 0; i < liverPosition.count; i++) {
    const x = liverPosition.getX(i), y = liverPosition.getY(i), z = liverPosition.getZ(i);
    const taper = 1 - .40 * Math.max(x, 0);
    liverPosition.setXYZ(i, x * .83, y * .40 * taper - .13 * x, z * .34 * taper + .065 * (1 - x * x));
  }
  liverGeometry.computeVertexNormals();
  const liver = selectable(mesh(liverGeometry, liverMaterial, [-.34, 6.94, .18]), 'liver');
  liver.rotation.z = -.07;
  // Dashed amber symbols encode indeterminate findings, not confirmed tumours.
  // Their count, size, and positions are illustrative rather than CT coordinates.
  const markerMaterial = new THREE.MeshBasicMaterial({ color: '#efca7c', transparent: true, opacity: .84, depthWrite: false });
  [[-.786, 7.103, .522], [-.307, 6.813, .580], [.136, 6.846, .453]].forEach((position, index) => {
    const marker = new THREE.Group();
    marker.position.set(...position);
    liverMarkers.add(marker);
    const radius = index === 0 ? .057 : .041;
    for (let arc = 0; arc < 4; arc++) {
      const ring = selectable(mesh(new THREE.TorusGeometry(radius, .006, 6, 12, Math.PI * .32), markerMaterial, null, null, marker), 'liver');
      ring.rotation.z = arc * Math.PI / 2;
      ring.userData.schematic = true;
    }
    const dot = selectable(sphere([0, 0, 0], [.011, .011, .006], markerMaterial, 10, marker), 'liver');
    dot.userData.schematic = true;
  });
  liverMarkers.visible = false;
  // A subtle lobe boundary is an illustrative surface detail, not a lesion.
  tube([[-.27, 7.27, .39], [-.18, 7.01, .51], [-.10, 6.77, .41]], .009, new THREE.MeshBasicMaterial({ color: '#43251f', transparent: true, opacity: .42 }), 24);

  const kidneyLeftMaterial = organMaterial('#ac6257');
  const kidneyRightMaterial = organMaterial('#965149', .98);
  function kidney(side, center, size, material) {
    const geometry = new THREE.SphereGeometry(1, 48, 36);
    const p = geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const indentation = .29 * Math.exp(-y * y / .12) * Math.pow(Math.max(0, -x), 2);
      p.setXYZ(i, side * (x * .34 + indentation), y * .55, z * .235 * (1 - .15 * Math.abs(y)));
    }
    // Mirroring the right kidney reverses triangle orientation as well as X.
    // Reverse its winding so both bean-shaped surfaces have outward normals.
    if (side < 0) {
      const index = geometry.index;
      for (let i = 0; i < index.count; i += 3) {
        const previous = index.getX(i + 1);
        index.setX(i + 1, index.getX(i + 2));
        index.setX(i + 2, previous);
      }
      index.needsUpdate = true;
    }
    geometry.computeVertexNormals();
    const item = mesh(geometry, material, center, [size, size, size]);
    item.rotation.z = side * -.17;
    return item;
  }
  const leftKidney = selectable(kidney(1, [.57, 6.18, -.025], .76, kidneyLeftMaterial), 'kidney');
  const rightKidney = kidney(-1, [-.60, 6.11, -.05], 1, kidneyRightMaterial);
  rightKidney.userData.context = 'Contralateral kidney for anatomical orientation';

  const ureterMaterial = organMaterial('#d3bdaa', .96);
  const ureterSheath = new THREE.MeshBasicMaterial({ color: '#dccbbb', transparent: true, opacity: .07, depthWrite: false });
  const urinaryPaths = [
    [[.37, 6.15, .07], [.36, 5.95, .12], [.38, 5.64, .11], [.32, 5.31, .12], [.22, 4.97, .18], [.15, 4.84, .22]],
    [[-.32, 6.10, .07], [-.33, 5.91, .12], [-.39, 5.60, .11], [-.34, 5.28, .12], [-.23, 4.98, .18], [-.15, 4.84, .22]],
  ];
  urinaryPaths.forEach(points => {
    const { curve } = tube(points, .023, ureterMaterial, 60);
    tube(points, .052, ureterSheath, 60);
    flowCurves.push(curve);
  });

  const bladderMaterial = organMaterial('#ce8b87', .47);
  bladderMaterial.side = THREE.DoubleSide;
  bladderMaterial.depthWrite = false;
  const bladderGeometry = new THREE.SphereGeometry(1, 56, 40);
  const bladderPositions = bladderGeometry.attributes.position;
  for (let i = 0; i < bladderPositions.count; i++) {
    const x = bladderPositions.getX(i), y = bladderPositions.getY(i), z = bladderPositions.getZ(i);
    const taper = y < 0 ? 1 + y * .35 : 1;
    bladderPositions.setXYZ(i, x * .41 * taper, y * .40, z * .31 * taper);
  }
  bladderGeometry.computeVertexNormals();
  const bladder = selectable(mesh(bladderGeometry, bladderMaterial, [0, 4.78, .245]), 'bladder');
  const neckMaterial = organMaterial('#b9756e', .53);
  selectable(tube([[0, 4.45, .245], [0, 4.35, .24], [0, 4.19, .21]], .048, neckMaterial, 22).item, 'bladder');

  // Noninvasive, inward-projecting nodules. Every vertex remains inside bladder.
  const lesionMaterial = organMaterial('#c45c51');
  [[-.155, 4.67, .408, .050], [.16, 4.76, .424, .070]].forEach(([x, y, z, radius], n) => {
    const lesion = selectable(sphere([x, y, z], [radius, radius * .82, radius * .68], lesionMaterial, 28), 'bladder');
    lesion.userData.preTURBT = true;
    lesion.userData.description = 'Illustrative pre-resection bladder lesion; no wall invasion depicted';
    lesionMeshes.push(lesion);
    // Rounded micro-lobules soften the lesion surface without implying depth.
    for (let j = 0; j < 5; j++) {
      const a = j / 5 * Math.PI * 2 + n;
      const lobe = selectable(sphere([x + Math.cos(a) * radius * .51, y + Math.sin(a) * radius * .43, z + radius * .30], [radius * .29, radius * .29, radius * .20], lesionMaterial, 12), 'bladder');
      lobe.userData.preTURBT = true;
      lesionMeshes.push(lobe);
    }
  });

  // Left hip is a separate review item, visually separated from urinary pathways.
  const hipMaterial = organMaterial('#bf9d65', .48);
  const hip = selectable(sphere([.635, 4.59, -.045], [.165, .165, .165], hipMaterial, 36), 'hip');
  const hipRingMaterial = new THREE.MeshBasicMaterial({ color: '#dfc288', transparent: true, opacity: .25, depthWrite: false });
  const hipRing = mesh(new THREE.TorusGeometry(.225, .007, 8, 80), hipRingMaterial, [.635, 4.59, .04]);
  hipRing.userData.decorative = true;
  focusMeshes.hip.push(hipRing);

  const flowMaterial = new THREE.MeshBasicMaterial({ color: '#f4d6a2', transparent: true, opacity: .9, depthWrite: false });
  flowCurves.forEach((curve, curveIndex) => {
    for (let i = 0; i < 6; i++) {
      const particle = sphere([0, 0, 0], [.026, .038, .026], flowMaterial, 10);
      particle.userData.curve = curveIndex;
      particle.userData.offset = i / 6;
      flowParticles.push(particle);
    }
  });

  const anchors = {
    bladder: new THREE.Vector3(0, 4.77, .55),
    kidney: new THREE.Vector3(.61, 6.21, .21),
    liver: new THREE.Vector3(-.63, 7.00, .50),
    hip: new THREE.Vector3(.68, 4.59, .15),
    chest: new THREE.Vector3(.52, 7.77, .38),
  };

  function setPresentation(next = 'anatomy') {
    presentation = ['anatomy', 'xray', 'muscles', 'skeleton', 'skin'].includes(next) ? next : 'anatomy';
    const xray = presentation === 'xray';
    const surface = presentation === 'skin';
    const skeletal = presentation === 'skeleton';
    const muscular = presentation === 'muscles';
    const clinical = presentation === 'anatomy' || xray;
    muscles.visible = presentation === 'muscles';
    group.traverse(item => {
      if (!item.geometry) return;
      if (!item.userData.category) {
        item.userData.category = item.material === skin || item.material === skinFine ? 'skin'
          : item.material === bone || item.material === boneSoft ? 'skeleton'
          : item.material === muscleMaterial ? 'muscles'
          : item.isLine ? 'surface-landmark' : 'organs';
      }
      item.visible = item.userData.category === 'skin' ? !skeletal
        : item.userData.category === 'skeleton' ? !surface && !muscular
        : item.userData.category === 'muscles' ? presentation === 'muscles'
        : item.userData.category === 'surface-landmark' ? surface || clinical
        : clinical;
    });
    skin.color.set(xray ? '#69abb2' : surface ? '#bb9479' : muscular ? '#974a43' : '#bdab98');
    skinFine.color.copy(skin.color);
    skin.roughness = skinFine.roughness = xray ? .32 : .62;
    skin.opacity = surface || muscular ? 1 : xray ? .30 : .115;
    skinFine.opacity = surface || muscular ? 1 : xray ? .28 : .145;
    for (const material of skinMaterials) {
      material.userData.baseOpacity = material.opacity;
      material.userData.shellOpaque.value = surface || muscular ? 1 : 0;
      material.userData.shellMuscle.value = muscular ? 1 : 0;
      material.depthWrite = surface || muscular;
    }
    bone.color.set(xray ? '#94b9bc' : '#dfd2af');
    boneSoft.color.copy(bone.color);
    bone.opacity = xray ? .125 : skeletal ? 1 : .76;
    boneSoft.opacity = xray ? .070 : skeletal ? 1 : .61;
    bone.depthWrite = boneSoft.depthWrite = skeletal;
    contourMaterial.color.set(xray ? '#a1d8d9' : '#d0bba3');
    contextOrgan.color.set(xray ? '#3c757b' : '#a9868d');
    lungMaterial.color.set(xray ? '#78aeb3' : '#bb8990');
    lungMaterial.emissive.copy(lungMaterial.color);
    liverMaterial.color.set(xray ? '#348780' : '#793c2d');
    kidneyLeftMaterial.color.set(xray ? '#c99a60' : '#ac6257');
    kidneyRightMaterial.color.set(xray ? '#578e83' : '#965149');
    ureterMaterial.color.set(xray ? '#c8b884' : '#d3bdaa');
    bladderMaterial.color.set(xray ? '#c7776c' : '#ce8b87');
    lesionMaterial.color.set(xray ? '#ec7c70' : '#c45c51');
    for (const material of [contextOrgan, liverMaterial, kidneyLeftMaterial, kidneyRightMaterial, ureterMaterial, bladderMaterial, lesionMaterial]) material.emissive.copy(material.color);
    setFocus(activeFocus);
  }

  function setFocus(id) {
    activeFocus = Object.hasOwn(focusMeshes, id) ? id : null;
    for (const [key, meshes] of Object.entries(focusMeshes)) {
      for (const item of meshes) {
        if (item.material.emissive) item.material.emissiveIntensity = key === activeFocus ? .15 : .035;
      }
    }
    hipRingMaterial.opacity = activeFocus === 'hip' ? .64 : .19;
    lungMaterial.opacity = activeFocus === 'chest' ? .94 : .66;
    liverMarkers.visible = activeFocus === 'liver' && (presentation === 'anatomy' || presentation === 'xray');
    flowParticles.forEach(p => { p.visible = effectsEnabled && (presentation === 'anatomy' || presentation === 'xray') && (activeFocus === 'bladder' || activeFocus === 'kidney'); });
  }
  function setEffects(enabled) {
    effectsEnabled = Boolean(enabled);
    flowParticles.forEach(p => { p.visible = effectsEnabled && (presentation === 'anatomy' || presentation === 'xray') && (activeFocus === 'bladder' || activeFocus === 'kidney'); });
  }
  function update(time) {
    if (effectsEnabled) {
      for (const particle of flowParticles) {
        const curve = flowCurves[particle.userData.curve];
        const t = (time * .13 + particle.userData.offset) % 1;
        particle.position.copy(curve.getPointAt(t));
        particle.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), curve.getTangentAt(t).normalize());
      }
    }
    markerMaterial.opacity = effectsEnabled && activeFocus === 'liver' ? .76 + Math.sin(time * 1.5) * .12 : .84;
    if (effectsEnabled && activeFocus === 'hip') hipRingMaterial.opacity = .60 + Math.sin(time * 1.5) * .12;
    if (activeFocus) {
      const intensity = effectsEnabled ? .15 + Math.sin(time * 1.75) * .025 : .15;
      for (const item of focusMeshes[activeFocus]) {
        if (item.material.emissive) item.material.emissiveIntensity = intensity;
      }
    }
  }
  setPresentation('anatomy');
  setFocus('bladder');
  update(0);
  return { group, skinMaterials, organMeshes, anchors, flowParticles, flowCurves, lesionMeshes, muscles, getPresentation: () => presentation, setPresentation, setFocus, setEffects, update };
}
