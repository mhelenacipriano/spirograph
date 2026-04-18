import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAnimationFrame } from './useAnimationFrame.js';
import { buildShapePath } from '../utils/shapes.js';
import { innerPerimeter, rollAlongPath } from '../utils/spirographMath.js';
import { resolveStrokeColor } from '../utils/colors.js';

const TAU = Math.PI * 2;

/**
 * Set up a canvas for high-DPI rendering with a centered, y-up coordinate
 * frame. Returns true if the dimensions actually changed.
 */
function configureCanvas(canvas, size) {
  if (!canvas || !size) return false;
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.round(size.width * dpr));
  const h = Math.max(1, Math.round(size.height * dpr));
  const changed = canvas.width !== w || canvas.height !== h;
  if (changed) {
    canvas.width = w;
    canvas.height = h;
  }
  canvas.style.width = `${size.width}px`;
  canvas.style.height = `${size.height}px`;
  const ctx = canvas.getContext('2d');
  // Centered, math-style (y-up) coordinate frame for everything we draw.
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(size.width / 2, size.height / 2);
  ctx.scale(1, -1);
  return changed;
}

function clearCanvasFull(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function snapshotCanvas(canvas) {
  if (!canvas || canvas.width === 0 || canvas.height === 0) return null;
  const snap = document.createElement('canvas');
  snap.width = canvas.width;
  snap.height = canvas.height;
  snap.getContext('2d').drawImage(canvas, 0, 0);
  return snap;
}

function restoreSnapshotTo(canvas, snap) {
  if (!canvas || !snap) return;
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(snap, 0, 0);
  ctx.restore();
}

/**
 * Apply the mirror mode by stroking additional reflected line segments
 * alongside the primary segment. Assumes a centered coord frame, so
 * reflections are just sign flips.
 */
function strokeMirroredSegments(ctx, a, b, mirror) {
  if (mirror === 'none' || !mirror) return;
  const pairs = [];
  if (mirror === 'horizontal' || mirror === 'both') {
    pairs.push([{ x: -a.x, y: a.y }, { x: -b.x, y: b.y }]);
  }
  if (mirror === 'vertical' || mirror === 'both') {
    pairs.push([{ x: a.x, y: -a.y }, { x: b.x, y: -b.y }]);
  }
  if (mirror === 'both') {
    pairs.push([{ x: -a.x, y: -a.y }, { x: -b.x, y: -b.y }]);
  }
  for (const [p1, p2] of pairs) {
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
}

/**
 * The core engine hook.
 *
 * It owns:
 *   - a centered-frame draw canvas where the permanent pattern accumulates
 *   - an overlay canvas that re-renders every frame with the guide, the moving
 *     gear, the pen arm, and the pen tip
 *   - the animation loop and all pen-position computation
 *
 * Returns imperative controls (`clear`, `reset`, `undo`, `snapshot`, `getState`).
 */
export function useSpirographEngine({
  drawCanvasRef,
  overlayCanvasRef,
  containerSize,
  params,
  color,
  playing,
  view,
}) {
  // ----- Precomputed paths -----
  // Outer path geometry rarely changes, so memoize it.
  const outerPath = useMemo(
    () =>
      buildShapePath(params.outerShape, params.outerSize, {
        polygonSides: params.polygonSides,
        ellipseRatio: params.ellipseRatio,
        cornerSharpness: params.cornerSharpness,
      }),
    [
      params.outerShape,
      params.outerSize,
      params.polygonSides,
      params.ellipseRatio,
      params.cornerSharpness,
    ]
  );

  const innerPerim = useMemo(
    () =>
      innerPerimeter(params.innerShape, params.innerSize, {
        polygonSides: params.polygonSides,
        ellipseRatio: params.ellipseRatio,
        cornerSharpness: params.cornerSharpness,
      }),
    [
      params.innerShape,
      params.innerSize,
      params.polygonSides,
      params.ellipseRatio,
      params.cornerSharpness,
    ]
  );

  const innerPath = useMemo(
    () =>
      buildShapePath(params.innerShape, params.innerSize, {
        polygonSides: params.polygonSides,
        ellipseRatio: params.ellipseRatio,
        cornerSharpness: params.cornerSharpness,
      }),
    [
      params.innerShape,
      params.innerSize,
      params.polygonSides,
      params.ellipseRatio,
      params.cornerSharpness,
    ]
  );

  // ----- Mutable engine state -----
  const stateRef = useRef({
    t: 0,
    prevPoint: null,
    cycle: 0,
    lastSnapshot: null,
    trail: [], // ring buffer of recent pen points (for the overlay trail)
  });

  // Latest refs so the RAF callback (closed over on mount) always sees fresh
  // values without re-creating the loop.
  const paramsRef = useRef(params);
  const colorRef = useRef(color);
  const viewRef = useRef(view);
  const playingRef = useRef(playing);
  const outerPathRef = useRef(outerPath);
  const innerPerimRef = useRef(innerPerim);
  const innerPathRef = useRef(innerPath);
  paramsRef.current = params;
  colorRef.current = color;
  viewRef.current = view;
  playingRef.current = playing;
  outerPathRef.current = outerPath;
  innerPerimRef.current = innerPerim;
  innerPathRef.current = innerPath;

  // A "run" is a stretch of drawing done with a single set of parameters.
  // Whenever any visible parameter changes (shape, size, color, mirror, …)
  // we snapshot the current canvas and lift the pen, marking the boundary.
  // `undoLastRun` then restores the snapshot — rolling back only the strokes
  // drawn since the most recent boundary, not the entire canvas.
  const runKey = [
    params.outerShape,
    params.innerShape,
    params.outerSize,
    params.innerSize,
    params.penOffset,
    params.polygonSides,
    params.ellipseRatio,
    params.cornerSharpness,
    params.lineWidth,
    color.mode,
    color.value,
    color.rainbowSpeed,
    color.cycleBaseHue,
    color.cycleHueStep,
    view.mirror,
  ].join('|');

  useEffect(() => {
    stateRef.current.lastSnapshot = snapshotCanvas(drawCanvasRef.current);
    stateRef.current.prevPoint = null;
    stateRef.current.trail = [];
  }, [runKey, drawCanvasRef]);

  // Configure canvases on size change. We clear the draw canvas on resize
  // because the coord frame is centered and snapshot-preserving across DPR
  // changes gets messy — cheaper to just redraw.
  useEffect(() => {
    if (!containerSize) return;
    const drawChanged = configureCanvas(drawCanvasRef.current, containerSize);
    configureCanvas(overlayCanvasRef.current, containerSize);
    if (drawChanged) {
      clearCanvasFull(drawCanvasRef.current);
      stateRef.current.prevPoint = null;
    }
  }, [containerSize, drawCanvasRef, overlayCanvasRef]);

  // Auto-snapshot when transitioning from paused -> playing, so "undo last run"
  // restores the state right before the user started drawing.
  const wasPlayingRef = useRef(false);
  useEffect(() => {
    if (playing && !wasPlayingRef.current) {
      stateRef.current.lastSnapshot = snapshotCanvas(drawCanvasRef.current);
    }
    wasPlayingRef.current = playing;
  }, [playing, drawCanvasRef]);

  // Compute pen position at parameter `t` using the generic rolling routine.
  // This reproduces the classic hypotrochoid when both shapes are circles.
  const computePen = useCallback((t) => {
    return rollAlongPath({
      outerPath: outerPathRef.current,
      innerR: paramsRef.current.innerSize,
      innerPerim: innerPerimRef.current,
      penOffset: paramsRef.current.penOffset,
      t,
    });
  }, []);

  /**
   * Advance the engine by an angular delta `dt`, drawing every sub-step
   * between the old and new `t`. Called from the pointer handler whenever the
   * cursor moves while "drawing mode" is active. `dt` can be negative (reverses
   * the pen along its path).
   */
  const advanceBy = useCallback((dt) => {
    if (!dt) return;
    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) return;

    const p = paramsRef.current;
    const c = colorRef.current;
    const v = viewRef.current;
    const st = stateRef.current;

    const drawCtx = drawCanvas.getContext('2d');
    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';
    drawCtx.lineWidth = p.lineWidth;

    const step = Math.max(0.001, p.stepSize);
    const substeps = Math.max(1, Math.ceil(Math.abs(dt) / step));
    const dstep = dt / substeps;

    for (let i = 0; i < substeps; i++) {
      st.t += dstep;
      const pen = computePen(st.t);

      drawCtx.strokeStyle = resolveStrokeColor({
        t: st.t,
        cycle: st.cycle,
        color: c,
      });

      if (st.prevPoint) {
        drawCtx.beginPath();
        drawCtx.moveTo(st.prevPoint.x, st.prevPoint.y);
        drawCtx.lineTo(pen.x, pen.y);
        drawCtx.stroke();
        strokeMirroredSegments(drawCtx, st.prevPoint, pen, v.mirror);
      }
      st.prevPoint = { x: pen.x, y: pen.y };

      const completed = Math.floor(st.t / TAU);
      if (completed > st.cycle) st.cycle = completed;

      st.trail.push({ x: pen.x, y: pen.y });
      if (st.trail.length > 160) st.trail.shift();
    }
  }, [computePen, drawCanvasRef]);

  /**
   * Detach the pen from its last drawn position so the next `advanceBy`
   * starts a new sub-path without a jumping line segment. Used when the
   * pointer re-enters the stage or drawing is toggled off.
   */
  const liftPen = useCallback(() => {
    stateRef.current.prevPoint = null;
  }, []);

  // ----- RAF loop -----
  // In "auto" mode the loop advances `t` itself (like a classic spirograph
  // animation). In "cursor" mode it only renders the overlay — drawing is
  // driven by pointer events that call `advanceBy`.
  useAnimationFrame(() => {
    const drawCanvas = drawCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!drawCanvas || !overlayCanvas) return;

    const p = paramsRef.current;
    const c = colorRef.current;
    const v = viewRef.current;
    const st = stateRef.current;

    if (playingRef.current && v.drawMode === 'auto') {
      advanceBy(p.speed);
    }

    // ----- Overlay (every frame) -----
    const overlayCtx = overlayCanvas.getContext('2d');
    overlayCtx.save();
    overlayCtx.setTransform(1, 0, 0, 1, 0, 0);
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    overlayCtx.restore();

    const pen = computePen(st.t);
    const axis = v.theme === 'dark' ? 'rgba(255,255,255,' : 'rgba(0,0,0,';

    if (v.showGuides) {
      overlayCtx.strokeStyle = axis + '0.28)';
      overlayCtx.lineWidth = 1.25;
      overlayCtx.setLineDash([]);
      outerPathRef.current.drawTo(overlayCtx);
      overlayCtx.stroke();
    }

    if (v.showPenArm) {
      // Inner gear outline at its current center / rotation.
      overlayCtx.save();
      overlayCtx.translate(pen.center.x, pen.center.y);
      overlayCtx.rotate(pen.phi);
      overlayCtx.strokeStyle = axis + '0.55)';
      overlayCtx.lineWidth = 1.5;
      innerPathRef.current.drawTo(overlayCtx);
      overlayCtx.stroke();
      overlayCtx.restore();

      // Pen arm.
      overlayCtx.beginPath();
      overlayCtx.moveTo(pen.center.x, pen.center.y);
      overlayCtx.lineTo(pen.x, pen.y);
      overlayCtx.strokeStyle = axis + '0.55)';
      overlayCtx.lineWidth = 1.5;
      overlayCtx.stroke();

      // Inner center dot.
      overlayCtx.beginPath();
      overlayCtx.arc(pen.center.x, pen.center.y, 2.5, 0, TAU);
      overlayCtx.fillStyle = axis + '0.7)';
      overlayCtx.fill();

      // Pen tip dot — color-matched to current stroke.
      overlayCtx.beginPath();
      overlayCtx.arc(pen.x, pen.y, 4, 0, TAU);
      overlayCtx.fillStyle = resolveStrokeColor({
        t: st.t,
        cycle: st.cycle,
        color: c,
      });
      overlayCtx.fill();
      overlayCtx.strokeStyle = axis + '0.9)';
      overlayCtx.lineWidth = 1;
      overlayCtx.stroke();

      // Faint trailing breadcrumbs so the preview has motion even when paused.
      if (st.trail.length > 1) {
        overlayCtx.save();
        overlayCtx.lineCap = 'round';
        overlayCtx.lineWidth = 1.2;
        for (let i = 1; i < st.trail.length; i++) {
          const a = st.trail[i - 1];
          const b = st.trail[i];
          const alpha = (i / st.trail.length) * 0.35;
          overlayCtx.strokeStyle = axis + `${alpha.toFixed(3)})`;
          overlayCtx.beginPath();
          overlayCtx.moveTo(a.x, a.y);
          overlayCtx.lineTo(b.x, b.y);
          overlayCtx.stroke();
        }
        overlayCtx.restore();
      }
    }
  });

  // ----- Imperative controls -----
  const clearDrawing = useCallback(() => {
    stateRef.current.lastSnapshot = snapshotCanvas(drawCanvasRef.current);
    clearCanvasFull(drawCanvasRef.current);
    stateRef.current.prevPoint = null;
    stateRef.current.trail = [];
  }, [drawCanvasRef]);

  const resetEngine = useCallback(() => {
    clearCanvasFull(drawCanvasRef.current);
    stateRef.current.t = 0;
    stateRef.current.cycle = 0;
    stateRef.current.prevPoint = null;
    stateRef.current.trail = [];
    stateRef.current.lastSnapshot = null;
  }, [drawCanvasRef]);

  const undoLastRun = useCallback(() => {
    const snap = stateRef.current.lastSnapshot;
    if (snap) {
      restoreSnapshotTo(drawCanvasRef.current, snap);
      stateRef.current.prevPoint = null;
      stateRef.current.trail = [];
    }
  }, [drawCanvasRef]);

  const snapshotNow = useCallback(() => {
    stateRef.current.lastSnapshot = snapshotCanvas(drawCanvasRef.current);
  }, [drawCanvasRef]);

  return {
    clearDrawing,
    resetEngine,
    undoLastRun,
    snapshotNow,
    advanceBy,
    liftPen,
    getState: () => ({ ...stateRef.current }),
  };
}
