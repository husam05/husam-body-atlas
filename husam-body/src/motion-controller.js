import { MathUtils, Quaternion, Spherical, Vector3 } from 'three';

/**
 * Owns camera transitions and the atlas's render-on-demand loop.
 * OrbitControls keeps handling input; this controller only schedules visible work.
 * `render` and `onFrame` receive the RAF timestamp and delta in seconds.
 */
export function createMotionController({
  camera,
  controls,
  render,
  onFrame = () => {},
  onPoseChange = () => {},
  isVisible = () => true,
  canAnimate = () => true,
}) {
  let frameId = null;
  let inFrame = false;
  let disposed = false;
  let dirty = false;
  let transition = null;
  let previousTime = null;
  let suspendedAt = null;
  let reducedMotion = false;
  let continuous = () => false;
  let continuousActive = false;
  let dampingActive = false;
  let interacting = false;
  let silenceChanges = 0;
  let dampingBeforeReduction = controls.enableDamping;
  const counters = { renderedFrames: 0, scheduledFrames: 0, transitionsStarted: 0, transitionsFinished: 0, transitionsCancelled: 0 };
  const doc = typeof document === 'undefined' ? null : document;
  const now = () => performance.now();
  const visible = () => !doc?.hidden && isVisible();
  const animationAllowed = () => !reducedMotion && canAnimate();
  const vector = value => value?.isVector3 ? value.clone() : new Vector3(...value);
  const yAxis = new Vector3(0, 1, 0);

  // OrbitControls has no public clear-inertia method. Consume its deltas with
  // damping disabled, then restore the actual pose before the next paint. The
  // second update synchronizes its internal pose cache using only public APIs.
  function clearInertia() {
    const position = camera.position.clone();
    const target = controls.target.clone();
    const zoom = camera.zoom;
    const damping = controls.enableDamping;
    const rotate = controls.autoRotate;
    silenceChanges++;
    try {
      controls.enableDamping = false;
      controls.autoRotate = false;
      controls.update(0);
      camera.position.copy(position);
      controls.target.copy(target);
      if (camera.zoom !== zoom) {
        camera.zoom = zoom;
        camera.updateProjectionMatrix();
      }
      controls.update(0);
    } finally {
      controls.enableDamping = reducedMotion ? false : damping;
      controls.autoRotate = reducedMotion ? false : rotate;
      silenceChanges--;
    }
    dampingActive = false;
  }

  function suspend() {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    previousTime = null;
    if (suspendedAt === null) suspendedAt = now();
    continuousActive = false;
  }

  function schedule() {
    if (disposed) return;
    if (!visible()) {
      suspend();
      return;
    }
    if (inFrame || frameId !== null) return;
    if (suspendedAt !== null) {
      if (transition) transition.start += now() - suspendedAt;
      suspendedAt = null;
    }
    counters.scheduledFrames++;
    frameId = requestAnimationFrame(frame);
  }

  function requestRender() {
    if (disposed) return;
    dirty = true;
    schedule();
  }

  function applyPose(position, target) {
    camera.position.copy(position);
    controls.target.copy(target);
    const damping = controls.enableDamping;
    const rotate = controls.autoRotate;
    controls.enableDamping = false;
    controls.autoRotate = false;
    try {
      controls.update(0);
    } finally {
      controls.enableDamping = reducedMotion ? false : damping;
      controls.autoRotate = reducedMotion ? false : rotate;
    }
  }

  function finishTransition() {
    if (!transition || disposed) return;
    const destination = transition;
    transition = null;
    clearInertia();
    applyPose(destination.toPosition, destination.toTarget);
    counters.transitionsFinished++;
    requestRender();
  }

  function cancelTransition() {
    if (disposed) return;
    if (transition) counters.transitionsCancelled++;
    transition = null;
    clearInertia();
    requestRender();
  }

  function transitionCamera({ target, position, duration = 600 }) {
    if (disposed) return;
    if (transition) counters.transitionsCancelled++;
    transition = null;
    clearInertia();
    controls.autoRotate = false;
    const toTarget = vector(target);
    const toPosition = vector(position);
    if (!Number.isFinite(duration) || duration <= 0 || !animationAllowed()) {
      applyPose(toPosition, toTarget);
      requestRender();
      return;
    }
    const fromTarget = controls.target.clone();
    const up = new Quaternion().setFromUnitVectors(camera.up.clone().normalize(), yAxis);
    const inverseUp = up.clone().invert();
    const from = new Spherical().setFromVector3(camera.position.clone().sub(fromTarget).applyQuaternion(up));
    const to = new Spherical().setFromVector3(toPosition.clone().sub(toTarget).applyQuaternion(up));
    let azimuth = MathUtils.euclideanModulo(to.theta - from.theta + Math.PI, Math.PI * 2) - Math.PI;
    // Give the exactly opposite preset a stable orbit direction.
    if (Math.abs(azimuth + Math.PI) < 1e-9) azimuth = Math.PI;
    transition = { fromTarget, toTarget, toPosition, from, to, azimuth, inverseUp, start: now(), duration };
    counters.transitionsStarted++;
    // A new selection replaces any older hidden-view pause as well as its pose.
    if (suspendedAt !== null) suspendedAt = now();
    requestRender();
  }

  function stepTransition(time) {
    const move = transition;
    const fraction = MathUtils.clamp((time - move.start) / move.duration, 0, 1);
    if (fraction >= 1 || !animationAllowed()) {
      transition = null;
      applyPose(move.toPosition, move.toTarget);
      counters.transitionsFinished++;
      return;
    }
    const eased = fraction * fraction * (3 - 2 * fraction);
    const target = new Vector3().lerpVectors(move.fromTarget, move.toTarget, eased);
    const orbit = new Spherical(
      MathUtils.lerp(move.from.radius, move.to.radius, eased),
      MathUtils.lerp(move.from.phi, move.to.phi, eased),
      move.from.theta + move.azimuth * eased,
    ).makeSafe();
    const position = new Vector3().setFromSpherical(orbit).applyQuaternion(move.inverseUp).add(target);
    applyPose(position, target);
  }

  function frame(time) {
    frameId = null;
    if (disposed) return;
    if (!visible()) {
      suspend();
      return;
    }
    inFrame = true;
    dirty = false;
    const delta = previousTime === null ? 0 : MathUtils.clamp((time - previousTime) / 1000, 0, .1);
    previousTime = time;
    let controlsChanged = false;
    try {
      if (transition) {
        stepTransition(time);
      } else {
        const rotate = controls.autoRotate;
        if (!animationAllowed()) controls.autoRotate = false;
        controlsChanged = controls.update(delta) === true;
        if (!animationAllowed()) controls.autoRotate = reducedMotion ? false : rotate;
        if (controls.enableDamping && !controls.autoRotate) {
          if (controlsChanged) dampingActive = true;
          else if (dampingActive) clearInertia();
        }
      }
      // A controls change above has already been included in this frame. Only
      // new invalidations from application callbacks need another static frame.
      dirty = false;
      onFrame(time, delta);
      render(time, delta);
      counters.renderedFrames++;
      continuousActive = animationAllowed() && (continuous(time, delta) === true || controls.autoRotate);
    } finally {
      inFrame = false;
    }
    if (transition || dampingActive || continuousActive || dirty) schedule();
    else previousTime = null;
  }

  function setContinuous(predicate) {
    continuous = typeof predicate === 'function' ? predicate : () => Boolean(predicate);
    requestRender();
  }

  function setReducedMotion(enabled) {
    const next = Boolean(enabled);
    if (next === reducedMotion || disposed) return;
    if (next) dampingBeforeReduction = controls.enableDamping;
    reducedMotion = next;
    if (next) {
      controls.autoRotate = false;
      clearInertia();
      controls.enableDamping = false;
      finishTransition();
      continuousActive = false;
    } else {
      controls.enableDamping = dampingBeforeReduction;
    }
    requestRender();
  }

  function handleChange() {
    if (silenceChanges || disposed) return;
    onPoseChange();
    requestRender();
  }
  function handleStart() {
    interacting = true;
    cancelTransition();
  }
  function handleEnd() {
    interacting = false;
    requestRender();
  }
  function handleVisibility() {
    if (visible()) requestRender();
    else suspend();
  }
  controls.addEventListener('change', handleChange);
  controls.addEventListener('start', handleStart);
  controls.addEventListener('end', handleEnd);
  doc?.addEventListener('visibilitychange', handleVisibility);

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    transition = null;
    controls.removeEventListener('change', handleChange);
    controls.removeEventListener('start', handleStart);
    controls.removeEventListener('end', handleEnd);
    doc?.removeEventListener('visibilitychange', handleVisibility);
  }

  function getState() {
    return {
      ...counters,
      transitioning: Boolean(transition),
      pendingFrame: frameId !== null,
      reducedMotion,
      continuous: continuousActive,
      damping: dampingActive,
      interacting,
      visible: !disposed && visible(),
      idle: frameId === null && !inFrame && !transition,
      disposed,
    };
  }

  return { transitionCamera, requestRender, cancelTransition, finishTransition, setContinuous, setReducedMotion, dispose, getState };
}
