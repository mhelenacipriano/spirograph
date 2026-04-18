# Looploom

An interactive spirograph drawing app built with **React**, **Vite**, and **SCSS**.
Place outer guides and inner gears, tune the pen, pick colors, and watch a live hypotrochoid / generic-rolling pattern unfold on a high-DPI canvas. Export as PNG when you like the result.

No paid or closed-source dependencies — just React, React DOM, and Sass.

---

## Run it locally

Requires Node 18+.

```bash
cd spirograph
npm install
npm run dev
```

Vite will open [http://localhost:5173](http://localhost:5173).

Production build:

```bash
npm run build
npm run preview
```

---

## File tree

```
spirograph/
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── components/
    │   ├── ControlPanel.jsx
    │   ├── ColorControls.jsx
    │   ├── DrawingCanvas.jsx
    │   ├── ParameterSliders.jsx
    │   ├── PlaybackControls.jsx
    │   ├── PresetGallery.jsx
    │   ├── ShapeSelector.jsx
    │   └── Toggle.jsx
    ├── hooks/
    │   ├── useAnimationFrame.js
    │   ├── useResizeObserver.js
    │   └── useSpirographEngine.js
    ├── utils/
    │   ├── colors.js
    │   ├── exporter.js
    │   ├── presets.js
    │   ├── shapes.js
    │   └── spirographMath.js
    └── styles/
        ├── _canvas.scss
        ├── _controls.scss
        ├── _layout.scss
        ├── _variables.scss
        └── main.scss
```

---

## How the math works

### Circle-on-circle (classic spirograph)

A circle of radius `r` rolling **inside** a fixed outer circle of radius `R`, with a pen at distance `d` from the inner circle's center, traces a **hypotrochoid**:

```
x(t) = (R − r) · cos(t) + d · cos(((R − r) / r) · t)
y(t) = (R − r) · sin(t) − d · sin(((R − r) / r) · t)
```

This is exact and matches a real spirograph board for circular rings.

### Generic rolling along any outer shape

To support ellipses, triangles, squares, rounded squares, and N-gons the engine generalizes the idea:

1. **Represent the outer shape as an arc-length-parameterized path.**
   Every shape in [`shapes.js`](src/utils/shapes.js) is sampled into ~1024 points and indexed by cumulative perimeter length, so `path.sampleAt(s)` returns the position, tangent, and inward normal at arc length `s`.

2. **Advance an arc length `s` proportional to a normalized parameter `t`.**
   `s = (t / 2π) · outerPerimeter`, so `t = 2π` corresponds to one full lap regardless of shape — this keeps the UI sliders intuitive.

3. **Place the inner gear's center on the inward normal.**
   `C(s) = P(s) + r · N_in(s)`, where `r` is the inner shape's characteristic radius.

4. **Compute the inner gear's orientation.**
   The gear "rolls" along the outer wall, so it rotates by `2π · s / innerPerimeter` as it travels. Combined with the orientation of the inward normal:

   ```
   φ(s) = ψ(s) − 2π · s / innerPerim + π
   ```

   (The `+ π` constant just sets the pen to start opposite the contact point, matching the classical starting position.)

5. **Offset the pen.**
   `Pen = C(s) + d · (cos φ, sin φ)`

For circle-on-circle, this generic formulation reduces exactly to the hypotrochoid above — you can verify it by substituting a circular outer path.

The rolling rate depends on the *inner* shape's perimeter, which is why swapping inner gear shapes changes the pattern even when the outer shape is unchanged.

See [`spirographMath.js`](src/utils/spirographMath.js) for the implementation.

---

## Architecture at a glance

| Layer       | Where                             | Role                                                                                    |
| ----------- | --------------------------------- | --------------------------------------------------------------------------------------- |
| UI          | [`App.jsx`](src/App.jsx), [`components/`](src/components/) | Renders the layout and controls, owns React state.                        |
| Engine hook | [`useSpirographEngine`](src/hooks/useSpirographEngine.js) | Runs the rAF loop, computes pen positions, draws to both canvases.        |
| Math        | [`spirographMath.js`](src/utils/spirographMath.js), [`shapes.js`](src/utils/shapes.js) | Pure functions. No React, no DOM.                           |
| Rendering   | Two stacked `<canvas>` elements   | One holds the permanent drawing; the other redraws guides / gear / pen every frame.     |

**Two-canvas design.** The draw canvas accumulates strokes and is never cleared during normal play (so you can pause/resume without losing work). The overlay canvas is cleared every frame and re-renders the outer guide, inner gear outline, pen arm, pen tip, and a short fading trail.

**High-DPI.** Each canvas sets its pixel size to `cssSize × devicePixelRatio` and then `ctx.scale(dpr, dpr)`, plus a centered y-up coordinate system so all math matches textbook parametric equations directly. The renderer flips y so positive y is visually "up".

**Responsive.** A `ResizeObserver` on the stage container re-configures both canvases when the layout changes. Geometry changes lift the pen (reset `prevPoint`) so mid-draw parameter changes don't leave a jumping line.

**Undo.** When you press **Play** the engine snapshots the current draw canvas into an offscreen buffer. **Undo** restores the snapshot, which means "take me back to the state right before I started this run".

---

## Feature map

Requested features and where they live:

- Shape selection, inner & outer — [`ShapeSelector`](src/components/ShapeSelector.jsx)
- Outer/inner size, pen offset, speed, step size, line width, polygon sides, ellipse ratio, rounded-square sharpness — [`ParameterSliders`](src/components/ParameterSliders.jsx)
- Solid / rainbow / per-cycle color — [`ColorControls`](src/components/ColorControls.jsx), [`colors.js`](src/utils/colors.js)
- Play / Pause / Clear / Reset / Undo / Randomize / Export — [`PlaybackControls`](src/components/PlaybackControls.jsx)
- Guides + pen arm toggles, dark/light theme, mirror mode (none/horizontal/vertical/both) — [`ControlPanel`](src/components/ControlPanel.jsx), SCSS variables
- Presets gallery with live SVG thumbnails — [`PresetGallery`](src/components/PresetGallery.jsx), [`presets.js`](src/utils/presets.js)
- PNG export — [`exporter.js`](src/utils/exporter.js)

---

## Extending

- **Add a new outer shape.** Add a generator to [`shapes.js`](src/utils/shapes.js) that returns a path via `pathFromParametric` (or `pathFromPoints` for piecewise shapes), and add a matching branch to `buildShapePath` and `innerPerimeter`. Add an entry to `ShapeSelector.SHAPES` and an icon — done.
- **Add a new color mode.** Extend `resolveStrokeColor` in [`colors.js`](src/utils/colors.js) and add a mode button to [`ColorControls`](src/components/ColorControls.jsx).
- **Switch to Zustand.** The state in `App.jsx` is already grouped (`params`, `color`, `view`, `playing`); moving it to a store is a drop-in change.
