import * as THREE from 'three';

/**
 * A decorative display plinth for the illustrative anatomy, not medical data.
 * It contains no scan sweep, measurement scale, or patient-derived surface.
 * Motion is opt-in, and the stage disappears for CT and bladder-layer views.
 */
export function createStudioStage() {
  const group = new THREE.Group();
  group.name = 'Anatomy studio · decorative presentation stage';
  group.userData.decorative = true;
  const platform = new THREE.Group();
  platform.name = 'Studio plinth';
  group.add(platform);
  const frame = new THREE.Group();
  frame.name = 'Studio framing arcs';
  group.add(frame);
  let mode = 'body';

  const lineMaterial = (color, opacity) => new THREE.LineBasicMaterial({
    color, transparent: true, opacity, depthWrite: false,
    toneMapped: false,
  });
  const primaryLine = lineMaterial('#74d8da', .32);
  const secondaryLine = lineMaterial('#649398', .19);
  const quietLine = lineMaterial('#679a9f', .085);
  function polyline(points, material, parent) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    line.userData.decorative = true;
    parent.add(line);
    return line;
  }
  function floorArc(radius, start, span, material) {
    const points = [];
    const segments = Math.max(24, Math.ceil(span * 40));
    for (let i = 0; i <= segments; i++) {
      const angle = start + span * i / segments;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, -.032, Math.sin(angle) * radius));
    }
    return polyline(points, material, platform);
  }

  const plinthMaterial = new THREE.MeshPhysicalMaterial({
    color: '#10262e', roughness: .47, metalness: .38,
    transparent: true, opacity: .68, clearcoat: .45,
    clearcoatRoughness: .31,
  });
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.83, 1.89, .055, 112), plinthMaterial);
  plinth.position.y = -.080;
  platform.add(plinth);

  // A radial floor glow anchors the feet without requiring shadows or bloom.
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(5.3, 5.3), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying vec2 vUv;
      void main() {
        float radius = length(vUv - 0.5);
        float center = (1.0 - smoothstep(0.02, 0.46, radius)) * 0.15;
        float ring = exp(-pow((radius - 0.344) / 0.016, 2.0)) * 0.09;
        gl_FragColor = vec4(0.12, 0.47, 0.50, center + ring);
      }`,
  }));
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -.042;
  platform.add(glow);
  floorArc(1.82, 0, Math.PI * 2, secondaryLine);
  floorArc(2.18, 0, Math.PI * 2, quietLine);
  const accents = [];
  for (const start of [.18, Math.PI + .18]) accents.push(floorArc(1.96, start, Math.PI * .69, primaryLine));
  for (const start of [0, Math.PI]) floorArc(2.30, start + .38, .60, secondaryLine);

  const ticks = [];
  for (let i = 0; i < 48; i++) {
    const angle = i / 48 * Math.PI * 2;
    const inner = i % 12 === 0 ? 2.20 : 2.215;
    const outer = i % 12 === 0 ? 2.32 : 2.255;
    ticks.push(new THREE.Vector3(Math.cos(angle) * inner, -.035, Math.sin(angle) * inner));
    ticks.push(new THREE.Vector3(Math.cos(angle) * outer, -.035, Math.sin(angle) * outer));
  }
  const tickMarks = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(ticks), secondaryLine);
  tickMarks.name = 'Decorative plinth divisions · no measurement units';
  platform.add(tickMarks);

  // Open elliptical arcs sit behind the anatomy and leave the label area clear.
  for (const side of [-1, 1]) {
    const arcPoints = [];
    for (let i = 0; i <= 80; i++) {
      const theta = -.76 + i / 80 * 1.52;
      arcPoints.push(new THREE.Vector3(side * 2.55 * Math.cos(theta), 5.28 + 4.35 * Math.sin(theta), -1.24));
    }
    polyline(arcPoints, quietLine, frame);
    for (const y of [2.29, 8.27]) {
      const x = side * 1.85;
      polyline([
        new THREE.Vector3(x, y + .11, -1.24),
        new THREE.Vector3(x, y, -1.24),
        new THREE.Vector3(x - side * .11, y, -1.24),
      ], secondaryLine, frame);
    }
  }

  function setMode(nextMode) {
    mode = ['body', 'urinary', 'detail', 'ct'].includes(nextMode) ? nextMode : 'body';
    group.visible = mode === 'body' || mode === 'urinary';
    platform.visible = mode === 'body';
    frame.visible = mode === 'body';
  }
  function update(time, motionEnabled = false) {
    if (!motionEnabled || mode !== 'body' || !Number.isFinite(time)) return;
    // Only the two display arcs drift, very slowly. Anatomy is never affected.
    for (const accent of accents) accent.rotation.y = time * .035;
  }
  setMode('body');
  return { group, setMode, update };
}
