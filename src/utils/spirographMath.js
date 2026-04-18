// Spirograph engine math.
//
// Two worlds:
//   1. Pure circle-on-circle uses the classic hypotrochoid / epitrochoid
//      closed-form equations (fast and exactly correct).
//   2. Everything else (ellipse, triangle, square, polygon, rounded square)
//      uses a generic "inner shape rolls along outer shape" routine built on
//      top of arc-length-parameterized paths from `shapes.js`.
//
// Conventions:
//   - All math is in a centered, math-style coordinate frame (y-up).
//     The renderer flips y for canvas drawing.
//   - Outer paths are traversed counter-clockwise, so `sampleAt(s).normal`
//     points inward.
//   - Positive `penOffset` places the pen outside the inner center along the
//     gear's rotation axis at angle `phi`.

import { buildShapePath } from './shapes.js';

const TAU = Math.PI * 2;

/**
 * Perimeter of an inner shape whose characteristic radius is `r`.
 * Matches the shapes produced by `buildShapePath` so rolling rates line up.
 */
export function innerPerimeter(kind, r, opts = {}) {
  switch (kind) {
    case 'circle':
      return TAU * r;
    case 'ellipse': {
      const b = r * (opts.ellipseRatio ?? 0.65);
      // Ramanujan approximation.
      const h = ((r - b) * (r - b)) / ((r + b) * (r + b));
      return Math.PI * (r + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
    }
    case 'triangle':
      return 3 * 2 * r * Math.sin(Math.PI / 3);
    case 'square':
      return 4 * 2 * r * Math.sin(Math.PI / 4);
    case 'roundedSquare':
      // Close enough — rolling is visual, not a physical simulation.
      return buildShapePath('roundedSquare', r, opts).perimeter;
    case 'polygon': {
      const n = Math.max(3, opts.polygonSides ?? 5);
      return n * 2 * r * Math.sin(Math.PI / n);
    }
    default:
      return TAU * r;
  }
}

/**
 * Classic hypotrochoid (inner circle of radius r rolling inside outer circle
 * of radius R, pen at distance d from the inner's center).
 *
 *   x(t) = (R - r) cos t + d cos((R - r)/r · t)
 *   y(t) = (R - r) sin t - d sin((R - r)/r · t)
 */
export function hypotrochoid(t, R, r, d) {
  const k = (R - r) / r;
  return {
    x: (R - r) * Math.cos(t) + d * Math.cos(k * t),
    y: (R - r) * Math.sin(t) - d * Math.sin(k * t),
  };
}

/**
 * Epitrochoid (inner rolling OUTSIDE the outer). Kept for completeness —
 * can be exposed later as a "gear mode" toggle.
 */
export function epitrochoid(t, R, r, d) {
  const k = (R + r) / r;
  return {
    x: (R + r) * Math.cos(t) - d * Math.cos(k * t),
    y: (R + r) * Math.sin(t) - d * Math.sin(k * t),
  };
}

/**
 * Generic "inner shape rolls inside outer path" pen position.
 *
 *   - `outerPath` is an arc-length-parameterized path.
 *   - `innerR` is the inner shape's characteristic radius (used to offset the
 *      inner's center away from the outer perimeter along the inward normal).
 *   - `innerPerim` is the inner shape's perimeter, which sets the rolling rate.
 *   - `t` is a normalized angular parameter: t = TAU completes one lap around
 *      the outer perimeter, matching the closed-form circle case.
 *
 * Pen position:
 *   s  = (t / TAU) · outerPerimeter         // arc length travelled
 *   C  = P(s) + innerR · N_inward(s)         // inner's center in world frame
 *   ψ  = angle of N_inward(s) in world frame
 *   φ  = ψ - TAU · s / innerPerim + π        // inner's orientation
 *   pen = C + penOffset · (cos φ, sin φ)
 *
 * The `+ π` phase puts the pen opposite the rolling contact at t=0, which
 * matches the usual spirograph starting configuration.
 */
export function rollAlongPath({
  outerPath,
  innerR,
  innerPerim,
  penOffset,
  t,
}) {
  const s = (t / TAU) * outerPath.perimeter;
  const sample = outerPath.sampleAt(s);

  const cx = sample.x + innerR * sample.normal.x;
  const cy = sample.y + innerR * sample.normal.y;

  const psi = Math.atan2(sample.normal.y, sample.normal.x);
  const phi = psi - (TAU * s) / innerPerim + Math.PI;

  return {
    x: cx + penOffset * Math.cos(phi),
    y: cy + penOffset * Math.sin(phi),
    center: { x: cx, y: cy },
    contact: { x: sample.x, y: sample.y },
    phi,
  };
}

/**
 * Greatest common divisor (for circle-case cycle detection).
 */
export function gcd(a, b) {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}
