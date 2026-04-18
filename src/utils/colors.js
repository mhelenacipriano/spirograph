// Color helpers used by the engine.
//
// - `resolveStrokeColor` returns the stroke style to use at a given point in
//    time. Handles solid, rainbow-per-point, and randomize-per-cycle modes.
// - `hsl()` is a tiny formatter.

export function hsl(h, s = 70, l = 55, a = 1) {
  return a >= 1 ? `hsl(${h}, ${s}%, ${l}%)` : `hsla(${h}, ${s}%, ${l}%, ${a})`;
}

const TAU = Math.PI * 2;

/**
 * @param {object} p
 * @param {number} p.t         - engine time parameter
 * @param {number} p.cycle     - completed outer cycles (for cycle-randomize)
 * @param {object} p.color     - { mode, value, saturation, lightness, speed }
 */
export function resolveStrokeColor({ t, cycle, color }) {
  const mode = color.mode ?? 'solid';
  if (mode === 'rainbow') {
    // Sweep hue with t. `rainbowSpeed` controls how fast the hue cycles.
    const speed = color.rainbowSpeed ?? 60;
    const hue = ((t * speed) / TAU) % 360;
    return hsl(
      (hue + 360) % 360,
      color.saturation ?? 75,
      color.lightness ?? 60
    );
  }
  if (mode === 'cycle') {
    // Deterministic hue per completed lap so the pattern restarts predictably.
    const base = color.cycleBaseHue ?? 200;
    const step = color.cycleHueStep ?? 47;
    const hue = (base + cycle * step) % 360;
    return hsl(hue, color.saturation ?? 72, color.lightness ?? 58);
  }
  return color.value ?? '#7c3aed';
}

/** Produce an array of nicely-spaced hues for preset thumbnails etc. */
export function evenlySpacedHues(count, offset = 0) {
  const out = new Array(count);
  for (let i = 0; i < count; i++) out[i] = (offset + (i * 360) / count) % 360;
  return out;
}

/** Random pleasant color (avoid muddy mid-saturations). */
export function randomNiceColor() {
  const hue = Math.floor(Math.random() * 360);
  return hsl(hue, 70 + Math.floor(Math.random() * 20), 55);
}
