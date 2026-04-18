// Shape generators and arc-length parameterization.
//
// Every shape is exposed as a "Path" object:
//   { perimeter, sampleAt(s), samplePoints(n), drawTo(ctx) }
//
// `sampleAt(s)` returns { x, y, tangent: {x,y}, normal: {x,y} } where `normal`
// points toward the interior of the shape. This lets us roll an inner gear
// along any outer perimeter using a single, generic algorithm.

const TAU = Math.PI * 2;

// ---------- Generic helpers ----------

/**
 * Build a Path from a `t -> {x, y}` parametric function.
 * The function should be defined on t in [0, TAU] traversed counter-clockwise
 * so that the inward normal (rotate tangent by +90°) points into the shape.
 */
function pathFromParametric(generator, segments = 1024) {
  const pts = new Array(segments + 1);
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * TAU;
    const { x, y } = generator(t);
    pts[i] = { x, y };
  }
  return pathFromPoints(pts);
}

function pathFromPoints(points) {
  const n = points.length;
  const cum = new Float64Array(n);
  for (let i = 1; i < n; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    cum[i] = cum[i - 1] + Math.hypot(dx, dy);
  }
  const perimeter = cum[n - 1];

  function sampleAt(s) {
    if (perimeter === 0) {
      return {
        x: points[0].x,
        y: points[0].y,
        tangent: { x: 1, y: 0 },
        normal: { x: 0, y: 1 },
      };
    }
    // Wrap into [0, perimeter)
    let ss = s % perimeter;
    if (ss < 0) ss += perimeter;

    // Binary search for the segment containing ss.
    let lo = 0;
    let hi = n - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] <= ss) lo = mid;
      else hi = mid;
    }
    const segLen = cum[hi] - cum[lo];
    const f = segLen > 0 ? (ss - cum[lo]) / segLen : 0;

    const ax = points[lo].x;
    const ay = points[lo].y;
    const bx = points[hi].x;
    const by = points[hi].y;

    const x = ax + (bx - ax) * f;
    const y = ay + (by - ay) * f;

    const tx = bx - ax;
    const ty = by - ay;
    const tlen = Math.hypot(tx, ty) || 1;
    const tangent = { x: tx / tlen, y: ty / tlen };
    // Counter-clockwise traversal => inward normal is tangent rotated +90°,
    // i.e. (x, y) -> (-y, x).
    const normal = { x: -tangent.y, y: tangent.x };

    return { x, y, tangent, normal };
  }

  function drawTo(ctx) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < n; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
  }

  return { points, perimeter, sampleAt, drawTo };
}

// ---------- Concrete shapes ----------
// All shapes use `size` as a "characteristic radius" so they're roughly
// comparable when swapped, and they are all parameterized counter-clockwise.

export function circlePath(R) {
  return pathFromParametric((t) => ({
    x: R * Math.cos(t),
    y: R * Math.sin(t),
  }));
}

export function ellipsePath(a, b) {
  return pathFromParametric((t) => ({
    x: a * Math.cos(t),
    y: b * Math.sin(t),
  }));
}

/** Regular polygon with `sides` sides inscribed in a circle of radius R. */
export function polygonPath(sides, R) {
  const verts = [];
  // Start at the top vertex (-π/2). Going CCW means decreasing angle in screen
  // coordinates because canvas y axis is flipped — but we build everything in
  // a math frame and let the renderer flip y later.
  for (let i = 0; i < sides; i++) {
    const a = -Math.PI / 2 + (i / sides) * TAU;
    verts.push({ x: R * Math.cos(a), y: R * Math.sin(a) });
  }
  // Sample each edge densely for smooth arc-length sampling and overlay drawing.
  const perEdge = 64;
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = verts[i];
    const b = verts[(i + 1) % sides];
    for (let j = 0; j < perEdge; j++) {
      const f = j / perEdge;
      pts.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f });
    }
  }
  pts.push({ ...verts[0] });
  return pathFromPoints(pts);
}

export function trianglePath(R) {
  return polygonPath(3, R);
}

export function squarePath(R) {
  return polygonPath(4, R);
}

/** Superellipse-based rounded square; `n` controls the corner roundness. */
export function roundedSquarePath(R, n = 4) {
  const sgn = (v) => (v >= 0 ? 1 : -1);
  return pathFromParametric((t) => {
    const c = Math.cos(t);
    const s = Math.sin(t);
    const x = R * sgn(c) * Math.pow(Math.abs(c), 2 / n);
    const y = R * sgn(s) * Math.pow(Math.abs(s), 2 / n);
    return { x, y };
  });
}

// ---------- Factory ----------

/**
 * Build the requested outer shape from the parameter bag.
 * `size` is the characteristic radius (outer half-extent).
 */
export function buildShapePath(kind, size, opts = {}) {
  switch (kind) {
    case 'circle':
      return circlePath(size);
    case 'ellipse':
      return ellipsePath(size, size * (opts.ellipseRatio ?? 0.65));
    case 'triangle':
      return trianglePath(size);
    case 'square':
      return squarePath(size);
    case 'roundedSquare':
      return roundedSquarePath(size, opts.cornerSharpness ?? 4);
    case 'polygon':
      return polygonPath(Math.max(3, opts.polygonSides ?? 5), size);
    default:
      return circlePath(size);
  }
}

/** Convenience: draw an inner shape outline rotated by `phi` around its center. */
export function drawShapeOutline(ctx, kind, size, cx, cy, phi, opts = {}) {
  const path = buildShapePath(kind, size, opts);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(phi);
  path.drawTo(ctx);
  ctx.restore();
}
