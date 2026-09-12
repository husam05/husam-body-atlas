import * as THREE from 'three';

/**
 * Educational bladder-wall cutaway, with deliberately enlarged wall layers.
 * Generic anatomy, not CT segmentation, histology, or a thickness measurement.
 * The schematic growth projects into the lumen and never crosses the lining.
 */
export function createBladderDetail() {
  const group = new THREE.Group();
  group.name = 'Bladder wall · educational cutaway';
  group.visible = false;
  const center = new THREE.Vector3(0, 5, 0);
  const layerGroups = {};
  const layerMaterials = {};
  let activeLayer = 'lining';
  let effects = false;
  const palette = { muscle: '#a66460', support: '#cfb29a', lining: '#dca29a', lesion: '#c66f65' };
  const radii = {
    outer: [1.82, 1.95, 1.39],
    muscleInside: [1.65, 1.78, 1.22],
    supportInside: [1.51, 1.64, 1.08],
    lumen: [1.455, 1.585, 1.025],
  };
  const TAU = Math.PI * 2;
  const cutAngle = phi => 1.27 + .13 * Math.cos(phi - .45) + .025 * Math.sin(phi * 2);

  for (const id of Object.keys(palette)) {
    layerGroups[id] = new THREE.Group();
    layerGroups[id].name = id;
    layerGroups[id].userData.layer = id;
    group.add(layerGroups[id]);
    layerMaterials[id] = [];
  }

  function material(id, color = palette[id], options = {}) {
    const m = new THREE.MeshPhysicalMaterial({
      color, roughness: .46, metalness: .015, clearcoat: .16,
      clearcoatRoughness: .55, emissive: color, emissiveIntensity: .025,
      ...options,
    });
    layerMaterials[id].push(m);
    return m;
  }
  const outerMuscle = material('muscle', '#945650', { roughness: .58, clearcoat: .10 });
  const cutMuscle = material('muscle', '#b5746a', { roughness: .62 });
  const support = material('support', '#ccb198', { roughness: .66, clearcoat: .06 });
  const cutSupport = material('support', '#e1c6a8', { roughness: .64, clearcoat: .08 });
  const lining = material('lining', '#dca29a', { roughness: .43, clearcoat: .24 });
  const cutLining = material('lining', '#eec3ad', { roughness: .50 });
  const growthMaterial = material('lesion', '#cc7d6f', { roughness: .56, clearcoat: .12 });

  // A deterministic procedural bump field supplies shallow muscle striation.
  const bumpPixels = new Uint8Array(128 * 128 * 4);
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 128; x++) {
      const value = 126 + 30 * Math.sin(y * .93 + 2.4 * Math.sin(x * .055)) + 10 * Math.sin(x * 1.71 + y * .24);
      const offset = (y * 128 + x) * 4;
      bumpPixels[offset] = bumpPixels[offset + 1] = bumpPixels[offset + 2] = value;
      bumpPixels[offset + 3] = 255;
    }
  }
  const bump = new THREE.DataTexture(bumpPixels, 128, 128, THREE.RGBAFormat);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  bump.magFilter = THREE.LinearFilter;
  bump.minFilter = THREE.LinearFilter;
  bump.needsUpdate = true;
  outerMuscle.bumpMap = bump; outerMuscle.bumpScale = .018;
  cutMuscle.bumpMap = bump; cutMuscle.bumpScale = .011;

  function surface(radius, theta, phi, inwardOffset = 0) {
    const sy = Math.sin(theta) * Math.sin(phi);
    const taperX = 1 + .18 * Math.min(sy, 0);
    const taperZ = 1 + .13 * Math.min(sy, 0);
    const point = new THREE.Vector3(
      radius[0] * Math.sin(theta) * Math.cos(phi) * taperX,
      5 + radius[1] * sy,
      radius[2] * Math.cos(theta) * taperZ,
    );
    if (inwardOffset) point.addScaledVector(center.clone().sub(point).normalize(), inwardOffset);
    return point;
  }
  function lerpRadius(a, b, t) {
    return a.map((value, i) => THREE.MathUtils.lerp(value, b[i], t));
  }
  function smoothCoincidentNormals(geometry) {
    const positions = geometry.attributes.position, normals = geometry.attributes.normal;
    const sums = new Map();
    const keys = [];
    for (let i = 0; i < positions.count; i++) {
      const key = [positions.getX(i), positions.getY(i), positions.getZ(i)].map(v => Math.round(v * 100000)).join(',');
      keys.push(key);
      if (!sums.has(key)) sums.set(key, new THREE.Vector3());
      sums.get(key).add(new THREE.Vector3(normals.getX(i), normals.getY(i), normals.getZ(i)));
    }
    for (const value of sums.values()) value.normalize();
    for (let i = 0; i < positions.count; i++) {
      const value = sums.get(keys[i]);
      normals.setXYZ(i, value.x, value.y, value.z);
    }
    normals.needsUpdate = true;
  }
  function addMesh(geometry, mat, id, parent = layerGroups[id]) {
    const item = new THREE.Mesh(geometry, mat);
    item.userData.layer = id;
    item.castShadow = true;
    item.receiveShadow = true;
    parent.add(item);
    return item;
  }
  function curveMesh(points, radius, mat, id, closed = false, segments = 64, parent = layerGroups[id]) {
    const path = new THREE.CatmullRomCurve3(points, closed, 'centripetal');
    const item = addMesh(new THREE.TubeGeometry(path, segments, radius, 7, closed), mat, id, parent);
    return item;
  }
  function shellSurface(radius, inward, mat, id) {
    const around = 128, deep = 56;
    const positions = [], uvs = [], indices = [];
    for (let j = 0; j <= deep; j++) {
      for (let i = 0; i <= around; i++) {
        const phi = i / around * TAU;
        const theta = THREE.MathUtils.lerp(cutAngle(phi), Math.PI, j / deep);
        const point = surface(radius, theta, phi);
        positions.push(point.x, point.y, point.z);
        uvs.push(i / around, j / deep);
        if (j && i) {
          const a = j * (around + 1) + i, b = a - around - 1;
          if (inward) indices.push(a - 1, b - 1, b, a - 1, b, a);
          else indices.push(a - 1, b, b - 1, a - 1, a, b);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices); geometry.computeVertexNormals();
    smoothCoincidentNormals(geometry);
    return addMesh(geometry, mat, id);
  }
  function cutSurface(inner, outer, mat, id) {
    const around = 128, steps = 5;
    const positions = [], uvs = [], indices = [];
    for (let j = 0; j <= steps; j++) {
      const radius = lerpRadius(inner, outer, j / steps);
      for (let i = 0; i <= around; i++) {
        const phi = i / around * TAU;
        const p = surface(radius, cutAngle(phi), phi);
        positions.push(p.x, p.y, p.z);
        uvs.push(i / around * 8, j / steps);
        if (j && i) {
          const a = j * (around + 1) + i, b = a - around - 1;
          indices.push(a - 1, b, b - 1, a - 1, a, b);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices); geometry.computeVertexNormals();
    smoothCoincidentNormals(geometry);
    return addMesh(geometry, mat, id);
  }
  function layer(inner, outer, exterior, interior, cut, id) {
    shellSurface(outer, false, exterior, id);
    shellSurface(inner, true, interior, id);
    cutSurface(inner, outer, cut, id);
  }
  layer(radii.muscleInside, radii.outer, outerMuscle, outerMuscle, cutMuscle, 'muscle');
  layer(radii.supportInside, radii.muscleInside, support, support, cutSupport, 'support');
  layer(radii.lumen, radii.supportInside, lining, lining, cutLining, 'lining');

  // Continuous, thin boundaries distinguish the layers at the cut edge.
  const edgeMaterials = {};
  for (const [id, radius, color] of [
    ['muscle', radii.outer, '#d29687'],
    ['support', radii.muscleInside, '#efc8aa'],
    ['lining', radii.supportInside, '#f1d0b6'],
    ['lining', radii.lumen, '#edbfa8'],
  ]) {
    const m = material(id, color, { roughness: .40 });
    edgeMaterials[id] = m;
    const points = Array.from({ length: 128 }, (_, i) => {
      const phi = i / 128 * TAU;
      return surface(radius, cutAngle(phi), phi);
    });
    curveMesh(points, .008, m, id, true, 192);
  }

  // Crossing detrusor bundles follow the outer curved wall.
  const muscleFiber = material('muscle', '#bf897b', { roughness: .76, transparent: true, opacity: .42, depthWrite: false });
  for (let bundle = 0; bundle < 34; bundle++) {
    const phiStart = bundle / 34 * TAU;
    const points = [];
    for (let j = 0; j < 28; j++) {
      const t = j / 27;
      const phi = phiStart + .21 * Math.sin(t * Math.PI) + .032 * Math.sin(t * 10 + bundle);
      const theta = THREE.MathUtils.lerp(cutAngle(phi) + .025, Math.PI - .16, t);
      points.push(surface(radii.outer, theta, phi, -.006));
    }
    curveMesh(points, .006, muscleFiber, 'muscle', false, 40);
  }
  // Fine bundle ends on the muscle's exposed cut surface.
  const cutFiber = material('muscle', '#e0a792', { roughness: .78, transparent: true, opacity: .48, depthWrite: false });
  for (let i = 0; i < 96; i++) {
    const phi = (i + .35) / 96 * TAU;
    const points = [];
    for (let j = 0; j < 5; j++) {
      const t = .15 + j / 4 * .70;
      const angle = phi + .012 * Math.sin(t * Math.PI);
      const point = surface(lerpRadius(radii.muscleInside, radii.outer, t), cutAngle(angle), angle);
      point.z += .004;
      points.push(point);
    }
    curveMesh(points, .0035, cutFiber, 'muscle', false, 7);
  }

  // Supportive connective tissue texture is limited to its cut surface.
  const supportDetail = material('support', '#b99580', { roughness: .72, transparent: true, opacity: .42, depthWrite: false });
  for (let i = 0; i < 72; i++) {
    const phi = (i + .62) / 72 * TAU;
    const t = .28 + .42 * (.5 + .5 * Math.sin(i * 2.71));
    const p = surface(lerpRadius(radii.supportInside, radii.muscleInside, t), cutAngle(phi), phi);
    p.z += .004;
    const dot = addMesh(new THREE.SphereGeometry(.0065, 7, 5), supportDetail, 'support');
    dot.position.copy(p); dot.scale.set(1.5, .75, .42);
  }

  // Shallow mucosal folds sit on the luminal face of the lining.
  const foldMaterial = material('lining', '#d5a498', { roughness: .70, transparent: true, opacity: .32, depthWrite: false });
  for (let fold = 0; fold < 15; fold++) {
    const basePhi = fold / 15 * TAU;
    const points = [];
    for (let j = 0; j < 24; j++) {
      const t = j / 23;
      const phi = basePhi + .065 * Math.sin(t * 8 + fold) + .075 * t;
      const theta = THREE.MathUtils.lerp(cutAngle(phi) + .13, 2.43 + .13 * Math.sin(fold * 1.2), t);
      points.push(surface(radii.lumen, theta, phi, .008));
    }
    curveMesh(points, .009 + (fold % 3) * .0015, foldMaterial, 'lining', false, 40);
  }

  // A short bladder neck gives anatomical orientation without drawing a whole urethra.
  const neck = addMesh(new THREE.CylinderGeometry(.285, .145, .72, 48, 10, true), outerMuscle, 'muscle');
  neck.position.set(0, 2.98, .025);
  const neckInner = addMesh(new THREE.CylinderGeometry(.22, .105, .72, 48, 10, true), lining, 'lining');
  neckInner.position.copy(neck.position);
  neckInner.material = lining.clone();
  neckInner.material.side = THREE.BackSide;
  layerMaterials.lining.push(neckInner.material);
  const neckRim = addMesh(new THREE.TorusGeometry(.124, .020, 8, 48), cutLining, 'lining');
  neckRim.rotation.x = Math.PI / 2;
  neckRim.position.set(0, 2.62, .025);

  // Two schematic growths, because the CT describes two. They keep the reported count,
  // laterality and relative sizes: patient-left about 18 x 10 mm on a narrow pedicle
  // (attachment about 5 mm), patient-right about 13 x 8 mm on a broad base (about 12 mm),
  // both near the ureteric orifices on the lower posterior wall. One unit of this enlarged
  // cutaway is roughly 34.6 mm, so the pair is drawn in proportion to the report.
  // Both stay inside the lumen and never cross the lining: the pathology report describes
  // a non-invasive (pTa) finding. Neither is CT segmentation or inverted histology.
  const growthEdgeMaterial = material('lesion', '#e6b691', { roughness: .52 });
  // A dashed selection halo is an annotation and never represents disease spread.
  const haloMaterial = new THREE.MeshBasicMaterial({ color: '#f3d09a', transparent: true, opacity: .72, depthWrite: false });
  const halo = new THREE.Group();
  halo.name = 'Selection annotation';
  layerGroups.lesion.add(halo);
  function dashedHalo(pointAt) {
    for (let arc = 0; arc < 8; arc++) {
      const points = Array.from({ length: 9 }, (_, j) => pointAt((arc / 8 + j / 9 * .074) * TAU));
      curveMesh(points, .006, haloMaterial, 'lesion', false, 12, halo);
    }
  }

  // A broad-based mass conforms to the luminal surface it sits on.
  function conformingGrowth({ theta, phi, scaleU, scaleV, height }) {
    const direction = new THREE.Vector3(Math.sin(theta) * Math.cos(phi), Math.sin(theta) * Math.sin(phi), Math.cos(theta));
    const tangentU = new THREE.Vector3(1, 0, 0).addScaledVector(direction, -direction.x).normalize();
    const tangentV = direction.clone().cross(tangentU).normalize();
    const point = (rho, angle, flat = false) => {
      const d = direction.clone()
        .addScaledVector(tangentU, Math.cos(angle) * rho * scaleU)
        .addScaledVector(tangentV, Math.sin(angle) * rho * scaleV)
        .normalize();
      const lift = flat ? .027 : .012 + height * Math.pow(Math.max(0, 1 - rho * rho), 1.65)
        + .007 * Math.sin(angle * 5 + rho * 9) * Math.pow(Math.sin(rho * Math.PI), 2);
      return surface(radii.lumen, Math.acos(THREE.MathUtils.clamp(d.z, -1, 1)), Math.atan2(d.y, d.x), lift);
    };
    const positions = [], uvs = [], indices = [];
    const rings = 24, around = 72;
    for (let j = 0; j <= rings; j++) {
      const rho = j / rings;
      for (let i = 0; i <= around; i++) {
        const angle = i / around * TAU;
        const p = point(rho, angle);
        positions.push(p.x, p.y, p.z);
        uvs.push(.5 + Math.cos(angle) * rho * .5, .5 + Math.sin(angle) * rho * .5);
        if (j && i) {
          const a = j * (around + 1) + i, b = a - around - 1;
          // Local U × V points outward from the organ; reverse into the lumen.
          indices.push(a - 1, b - 1, b, a - 1, b, a);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices); geometry.computeVertexNormals();
    smoothCoincidentNormals(geometry);
    const mesh = addMesh(geometry, growthMaterial, 'lesion');
    curveMesh(Array.from({ length: 96 }, (_, i) => point(.99, i / 96 * TAU, true)), .008, growthEdgeMaterial, 'lesion', true, 120);
    dashedHalo(angle => point(1.22, angle, true));
    return { mesh, center: point(0, 0) };
  }

  // A pedunculated mass hangs into the lumen from a narrow stalk, the shape patient
  // guidance describes as looking like a small mushroom growing out of the wall.
  function pedunculatedGrowth({ theta, phi, headSemi, stalkRadius, stalkLength }) {
    const base = surface(radii.lumen, theta, phi, .004);
    const inward = center.clone().sub(base).normalize();
    const tangentU = new THREE.Vector3(0, 1, 0).cross(inward).normalize();
    const tangentV = inward.clone().cross(tangentU).normalize();
    const stalk = addMesh(new THREE.CylinderGeometry(stalkRadius * .9, stalkRadius * 1.16, stalkLength, 24, 1), growthMaterial, 'lesion');
    stalk.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), inward);
    stalk.position.copy(base).addScaledVector(inward, stalkLength / 2);
    const headCenter = base.clone().addScaledVector(inward, stalkLength + headSemi[2]);
    const head = addMesh(new THREE.SphereGeometry(1, 40, 28), growthMaterial, 'lesion');
    head.setRotationFromMatrix(new THREE.Matrix4().makeBasis(tangentU, tangentV, inward));
    head.scale.set(headSemi[0], headSemi[1], headSemi[2]);
    head.position.copy(headCenter);
    dashedHalo(angle => headCenter.clone()
      .addScaledVector(tangentU, Math.cos(angle) * headSemi[0] * 1.3)
      .addScaledVector(tangentV, Math.sin(angle) * headSemi[1] * 1.3));
    return { mesh: head, center: headCenter };
  }

  // Patient-left renders to the viewer's right, the convention the whole-body model uses.
  const leftGrowth = pedunculatedGrowth({
    theta: 2.55, phi: -.78,
    headSemi: [.26, .145, .145], stalkRadius: .072, stalkLength: .17,
  });
  const rightGrowth = conformingGrowth({ theta: 2.55, phi: -2.36, scaleU: .129, scaleV: .0795, height: .17 });
  for (const [growth, note] of [
    [leftGrowth, 'Schematic patient-left growth, about 18 x 10 mm on a narrow pedicle; confined to the lumen, no invasion illustrated'],
    [rightGrowth, 'Schematic patient-right growth, about 13 x 8 mm on a broad base; confined to the lumen, no invasion illustrated'],
  ]) {
    growth.mesh.userData.description = note;
    growth.mesh.userData.schematic = true;
  }

  const anchors = {
    lining: surface(radii.supportInside, cutAngle(1.13), 1.13),
    support: surface(lerpRadius(radii.supportInside, radii.muscleInside, .5), cutAngle(.20), .20),
    muscle: surface(lerpRadius(radii.muscleInside, radii.outer, .5), cutAngle(2.78), 2.78),
    lesion: leftGrowth.center,
  };

  function setLayer(id) {
    activeLayer = Object.hasOwn(layerGroups, id) ? id : null;
    for (const [key, materials] of Object.entries(layerMaterials)) {
      for (const m of materials) m.emissiveIntensity = key === activeLayer ? .14 : .018;
    }
    halo.visible = activeLayer === 'lesion';
  }
  function setEffects(enabled) {
    effects = Boolean(enabled);
  }
  function update(time) {
    const pulse = effects ? .14 + .035 * Math.sin(time * 1.4) : .14;
    if (activeLayer) layerMaterials[activeLayer].forEach(m => { m.emissiveIntensity = pulse; });
    haloMaterial.opacity = effects ? .60 + .16 * Math.sin(time * 1.4) : .68;
  }
  setLayer('lining');
  return { group, anchors, setLayer, update, setEffects };
}
