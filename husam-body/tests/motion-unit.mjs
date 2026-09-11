import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createMotionController } from '../src/motion-controller.js';

// Deterministic frame timestamps plus real OrbitControls exercise orbit geometry,
// interruptions, damping and idle scheduling without a GPU or a browser timer.
const original = { requestAnimationFrame: globalThis.requestAnimationFrame, cancelAnimationFrame: globalThis.cancelAnimationFrame, performance: globalThis.performance };
let timestamp = 0;
let nextId = 0;
const queue = new Map();
globalThis.performance = { now: () => timestamp };
globalThis.requestAnimationFrame = callback => { const id = ++nextId; queue.set(id, callback); return id; };
globalThis.cancelAnimationFrame = id => queue.delete(id);
function step(ms = 16) {
  timestamp += ms;
  const callbacks = [...queue.values()];
  queue.clear();
  callbacks.forEach(callback => callback(timestamp));
}
function drain(limit = 400) {
  let count = 0;
  while (queue.size && count++ < limit) step();
  assert.equal(queue.size, 0, 'render loop must settle');
}
function close(actual, expected, tolerance = 1e-7) {
  assert.ok(actual.distanceTo(expected) < tolerance, `${actual.toArray()} != ${expected.toArray()}`);
}
function rig() {
  const camera = new PerspectiveCamera(36, 1, .01, 100);
  camera.position.set(0, 0, 10);
  const controls = new OrbitControls(camera);
  controls.enableDamping = true;
  controls.dampingFactor = .08;
  let isVisible = true;
  let effect = false;
  const poses = [];
  const motion = createMotionController({
    camera, controls,
    render: () => poses.push(camera.position.clone()),
    isVisible: () => isVisible,
  });
  return { camera, controls, motion, poses, visibility: value => { isVisible = value; motion.requestRender(); }, effects: value => { effect = value; motion.setContinuous(() => effect); } };
}

try {
  const r = rig();
  r.motion.requestRender();
  r.motion.requestRender();
  r.motion.requestRender();
  assert.equal(queue.size, 1, 'coalesce visual invalidations');
  step();
  assert.equal(r.poses.length, 1);
  assert.equal(queue.size, 0, 'static scene has no ongoing RAF');

  r.motion.transitionCamera({ target: [0, 0, 0], position: [0, 0, -10] });
  step(300);
  close(r.camera.position, new Vector3(10, 0, 0));
  assert.ok(r.camera.position.length() > 9.999, 'front/back travels around the body');
  step(300);
  close(r.camera.position, new Vector3(0, 0, -10));
  drain();
  assert.equal(r.motion.getState().transitionsFinished, 1);

  // Replacement starts at the currently shown pose, with no jump at t = 0.
  r.motion.transitionCamera({ target: [0, 3, 0], position: [10, 3, 0] });
  step(180);
  const interrupted = r.camera.position.clone();
  r.motion.transitionCamera({ target: [0, 1, 0], position: [-7, 1, 0] });
  close(r.camera.position, interrupted);
  step(0);
  close(r.camera.position, interrupted);
  drain();
  close(r.camera.position, new Vector3(-7, 1, 0));

  // Keyboard/input interruption consumes inertia and preserves the displayed pose.
  r.motion.transitionCamera({ target: [0, 0, 0], position: [0, 0, 10] });
  step(180);
  const stopped = r.camera.position.clone();
  r.controls.dispatchEvent({ type: 'start' });
  drain();
  close(r.camera.position, stopped);
  assert.equal(r.motion.getState().transitioning, false);
  r.controls.dispatchEvent({ type: 'end' });
  drain();

  // Actual damping eventually stops; unrelated redraws cannot restart its drift.
  r.controls.rotateLeft(.35);
  drain();
  const afterDamping = r.camera.position.clone();
  r.motion.requestRender();
  drain();
  close(r.camera.position, afterDamping);
  assert.equal(r.motion.getState().idle, true);

  // A new preset during inertia does not apply the old drag after it completes.
  r.controls.rotateLeft(.6);
  r.motion.transitionCamera({ target: [0, 0, 0], position: [0, 0, 10] });
  drain();
  close(r.camera.position, new Vector3(0, 0, 10));
  r.motion.requestRender();
  drain();
  close(r.camera.position, new Vector3(0, 0, 10));

  r.effects(true);
  step();
  step();
  assert.equal(queue.size, 1, 'explicit effects keep rendering');
  r.effects(false);
  drain();
  assert.equal(r.motion.getState().idle, true);

  r.effects(true);
  step();
  r.visibility(false);
  assert.equal(queue.size, 0, 'sources or hidden view cancels queued work');
  const hiddenCount = r.poses.length;
  step(1000);
  assert.equal(r.poses.length, hiddenCount);
  r.visibility(true);
  step();
  assert.ok(r.poses.length > hiddenCount, 'visible effects resume');
  r.effects(false);
  drain();

  // Hidden time pauses an existing transition without delaying a new selection.
  r.motion.transitionCamera({ target: [0, 0, 0], position: [0, 0, -10] });
  step(120);
  const beforeHidden = r.camera.position.clone();
  r.visibility(false);
  step(5000);
  r.visibility(true);
  step(0);
  close(r.camera.position, beforeHidden);
  drain();
  r.visibility(false);
  step(5000);
  r.motion.transitionCamera({ target: [0, 0, 0], position: [0, 0, 10] });
  r.visibility(true);
  step(600);
  close(r.camera.position, new Vector3(0, 0, 10));
  drain();

  r.motion.transitionCamera({ target: [0, 2, 0], position: [0, 2, -12] });
  step(120);
  r.effects(true);
  r.controls.autoRotate = true;
  r.motion.setReducedMotion(true);
  close(r.camera.position, new Vector3(0, 2, -12));
  drain();
  assert.equal(r.controls.autoRotate, false);
  assert.equal(r.controls.enableDamping, false);
  assert.equal(r.motion.getState().continuous, false);
  assert.equal(r.motion.getState().pendingFrame, false);
  r.motion.transitionCamera({ target: [0, 0, 0], position: [0, 0, 10] });
  close(r.camera.position, new Vector3(0, 0, 10));
  drain();
  r.effects(false);
  r.motion.setReducedMotion(false);
  drain();
  assert.equal(r.controls.enableDamping, true, 'restore previous damping preference');

  // Zoom radius is interpolated, not applied as an abrupt camera jump.
  r.motion.transitionCamera({ target: [0, 0, 0], position: [0, 0, 6], duration: 180 });
  close(r.camera.position, new Vector3(0, 0, 10));
  step(90);
  close(r.camera.position, new Vector3(0, 0, 8));
  drain();
  close(r.camera.position, new Vector3(0, 0, 6));
  r.motion.requestRender();
  r.motion.dispose();
  assert.equal(queue.size, 0);
  r.controls.rotateLeft(.3);
  assert.equal(queue.size, 0, 'dispose removes controls subscriptions');
  console.log('Motion checks passed: orbital presets, replacement, input interruption, real OrbitControls damping, coalescing, idle, visibility, reduced motion and animated zoom.');
} finally {
  Object.assign(globalThis, original);
}
