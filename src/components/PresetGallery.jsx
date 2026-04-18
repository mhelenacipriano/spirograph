import { PRESETS } from '../utils/presets.js';

/**
 * Preset chips. Clicking one applies both the param and color bundles.
 */
export default function PresetGallery({ onApply }) {
  return (
    <div className="preset-gallery">
      <span className="control-label">Presets</span>
      <div className="preset-gallery__grid">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className="preset-chip"
            onClick={() => onApply(p)}
            title={p.name}
          >
            <PresetThumb preset={p} />
            <span className="preset-chip__name">{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Static thumbnail: a handful of pen samples from the generic rolling routine.
 * We inline the math here rather than mounting another canvas per chip — the
 * sample count is tiny and the output is a plain SVG polyline.
 */
function PresetThumb({ preset }) {
  const { params, color } = preset;
  const points = samplePattern(params, 260);
  const bbox = pointsBBox(points);
  const viewW = 72;
  const viewH = 72;
  const padding = 4;
  const scale = Math.min(
    (viewW - padding * 2) / (bbox.w || 1),
    (viewH - padding * 2) / (bbox.h || 1)
  );
  const cx = bbox.x + bbox.w / 2;
  const cy = bbox.y + bbox.h / 2;
  const path = points
    .map((p, i) => {
      const x = viewW / 2 + (p.x - cx) * scale;
      const y = viewH / 2 - (p.y - cy) * scale;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const stroke = color.value || '#7c3aed';
  return (
    <svg viewBox={`0 0 ${viewW} ${viewH}`} width="72" height="72" aria-hidden="true">
      <path d={path} fill="none" stroke={stroke} strokeWidth="1" opacity="0.9" />
    </svg>
  );
}

// Minimal stand-in for the engine — good enough for thumbnails.
function samplePattern(params, steps) {
  const TAU = Math.PI * 2;
  const R = params.outerSize;
  const r = params.innerSize;
  const d = params.penOffset;
  const pts = [];
  // Use the simple hypotrochoid for the thumbnail — fast, close enough across
  // shapes to hint at the final pattern's look.
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * TAU * 6;
    const k = (R - r) / r;
    pts.push({
      x: (R - r) * Math.cos(t) + d * Math.cos(k * t),
      y: (R - r) * Math.sin(t) - d * Math.sin(k * t),
    });
  }
  return pts;
}

function pointsBBox(points) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
