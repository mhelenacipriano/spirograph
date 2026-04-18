// Curated parameter presets. Each one is a complete, self-contained snapshot
// of the engine inputs so the user can click and go.
//
// `sensitivity` is the mouse-delta multiplier: 1 = 1° of cursor motion rolls
// the gear by 1° around the board.

export const PRESETS = [
  {
    id: 'classic-rose',
    name: 'Classic Rose',
    params: {
      outerShape: 'circle',
      innerShape: 'circle',
      outerSize: 230,
      innerSize: 75,
      penOffset: 55,
      sensitivity: 1,
      stepSize: 0.01,
      lineWidth: 1.2,
      polygonSides: 5,
      ellipseRatio: 0.65,
      cornerSharpness: 4,
    },
    color: { mode: 'solid', value: '#ec4899' },
  },
  {
    id: 'tight-star',
    name: 'Tight Star',
    params: {
      outerShape: 'circle',
      innerShape: 'circle',
      outerSize: 240,
      innerSize: 48,
      penOffset: 70,
      sensitivity: 1.4,
      stepSize: 0.008,
      lineWidth: 1,
      polygonSides: 5,
      ellipseRatio: 0.65,
      cornerSharpness: 4,
    },
    color: { mode: 'cycle', value: '#22d3ee', cycleBaseHue: 190, cycleHueStep: 53 },
  },
  {
    id: 'triangle-waves',
    name: 'Triangle Waves',
    params: {
      outerShape: 'triangle',
      innerShape: 'circle',
      outerSize: 240,
      innerSize: 60,
      penOffset: 50,
      sensitivity: 1,
      stepSize: 0.006,
      lineWidth: 1.1,
      polygonSides: 3,
      ellipseRatio: 0.65,
      cornerSharpness: 4,
    },
    color: { mode: 'rainbow', value: '#7c3aed', rainbowSpeed: 80 },
  },
  {
    id: 'square-petals',
    name: 'Square Petals',
    params: {
      outerShape: 'square',
      innerShape: 'circle',
      outerSize: 240,
      innerSize: 70,
      penOffset: 90,
      sensitivity: 1,
      stepSize: 0.006,
      lineWidth: 1.2,
      polygonSides: 4,
      ellipseRatio: 0.65,
      cornerSharpness: 4,
    },
    color: { mode: 'solid', value: '#f59e0b' },
  },
  {
    id: 'pentagram',
    name: 'Pentagram',
    params: {
      outerShape: 'polygon',
      innerShape: 'circle',
      outerSize: 240,
      innerSize: 60,
      penOffset: 40,
      sensitivity: 1.2,
      stepSize: 0.006,
      lineWidth: 1,
      polygonSides: 5,
      ellipseRatio: 0.65,
      cornerSharpness: 4,
    },
    color: { mode: 'cycle', value: '#8b5cf6', cycleBaseHue: 270, cycleHueStep: 37 },
  },
  {
    id: 'ellipse-orbit',
    name: 'Ellipse Orbit',
    params: {
      outerShape: 'ellipse',
      innerShape: 'circle',
      outerSize: 260,
      innerSize: 55,
      penOffset: 45,
      sensitivity: 1,
      stepSize: 0.008,
      lineWidth: 1.1,
      polygonSides: 5,
      ellipseRatio: 0.55,
      cornerSharpness: 4,
    },
    color: { mode: 'rainbow', value: '#22d3ee', rainbowSpeed: 50 },
  },
  {
    id: 'soft-square',
    name: 'Soft Square',
    params: {
      outerShape: 'roundedSquare',
      innerShape: 'circle',
      outerSize: 240,
      innerSize: 65,
      penOffset: 80,
      sensitivity: 1,
      stepSize: 0.007,
      lineWidth: 1.2,
      polygonSides: 4,
      ellipseRatio: 0.65,
      cornerSharpness: 6,
    },
    color: { mode: 'solid', value: '#10b981' },
  },
  {
    id: 'micro-spiral',
    name: 'Micro Spiral',
    params: {
      outerShape: 'circle',
      innerShape: 'circle',
      outerSize: 250,
      innerSize: 31,
      penOffset: 28,
      sensitivity: 2,
      stepSize: 0.006,
      lineWidth: 0.9,
      polygonSides: 5,
      ellipseRatio: 0.65,
      cornerSharpness: 4,
    },
    color: { mode: 'cycle', value: '#f43f5e', cycleBaseHue: 340, cycleHueStep: 29 },
  },
];

/**
 * Random parameter set that tends to produce visually interesting patterns.
 * Avoids edge cases where the inner is bigger than the outer.
 */
export function randomPreset() {
  const shapes = ['circle', 'ellipse', 'triangle', 'square', 'roundedSquare', 'polygon'];
  const outerShape = shapes[Math.floor(Math.random() * shapes.length)];
  const outerSize = 220 + Math.floor(Math.random() * 40);
  const ratio = 0.15 + Math.random() * 0.45;
  const innerSize = Math.round(outerSize * ratio);
  const penOffset = Math.round(innerSize * (0.4 + Math.random() * 1.1));
  const polygonSides = 3 + Math.floor(Math.random() * 8);

  const colorModes = ['solid', 'rainbow', 'cycle'];
  const mode = colorModes[Math.floor(Math.random() * colorModes.length)];

  return {
    params: {
      outerShape,
      innerShape: 'circle',
      outerSize,
      innerSize,
      penOffset,
      sensitivity: 0.5 + Math.random() * 2,
      stepSize: 0.006 + Math.random() * 0.006,
      lineWidth: 0.9 + Math.random() * 0.9,
      polygonSides,
      ellipseRatio: 0.4 + Math.random() * 0.4,
      cornerSharpness: 3 + Math.random() * 5,
    },
    color: {
      mode,
      value: `hsl(${Math.floor(Math.random() * 360)}, 72%, 58%)`,
      saturation: 72,
      lightness: 58,
      rainbowSpeed: 40 + Math.floor(Math.random() * 60),
      cycleBaseHue: Math.floor(Math.random() * 360),
      cycleHueStep: 23 + Math.floor(Math.random() * 40),
    },
  };
}
