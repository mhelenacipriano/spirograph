import { useCallback, useEffect, useRef, useState } from 'react';
import DrawingCanvas from './components/DrawingCanvas.jsx';
import ControlPanel from './components/ControlPanel.jsx';
import MobileQuickBar from './components/MobileQuickBar.jsx';
import MobileDrawer from './components/MobileDrawer.jsx';
import { useSpirographEngine } from './hooks/useSpirographEngine.js';
import { useResizeObserver } from './hooks/useResizeObserver.js';
import { useMediaQuery } from './hooks/useMediaQuery.js';
import { exportCanvasAsPng } from './utils/exporter.js';
import { randomPreset } from './utils/presets.js';

const TAU = Math.PI * 2;

const DEFAULT_PARAMS = {
  outerShape: 'circle',
  innerShape: 'circle',
  outerSize: 230,
  innerSize: 75,
  penOffset: 55,
  sensitivity: 1,
  speed: 0.05,
  stepSize: 0.008,
  lineWidth: 1.2,
  polygonSides: 5,
  ellipseRatio: 0.65,
  cornerSharpness: 4,
};

const DEFAULT_COLOR = {
  mode: 'solid',
  value: '#ec4899',
  saturation: 75,
  lightness: 60,
  rainbowSpeed: 60,
  cycleBaseHue: 200,
  cycleHueStep: 47,
};

function getSubtitle(drawMode, drawing) {
  if (drawMode === 'cursor') {
    return drawing
      ? 'Drawing on — move your cursor around the board to roll the gear.'
      : 'Press Play, then move your cursor around the board to draw.';
  }
  return drawing ? 'Auto animation running.' : 'Press Play to start the auto animation.';
}

const DEFAULT_VIEW = {
  showGuides: true,
  showPenArm: true,
  theme: 'dark',
  mirror: 'none',
  drawMode: 'cursor', // 'cursor' | 'auto'
};

export default function App() {
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [view, setView] = useState(DEFAULT_VIEW);
  const [drawing, setDrawing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isMobile = useMediaQuery('(max-width: 820px)');

  const drawCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const containerSize = useResizeObserver(containerRef);

  // ----- Fit-to-container clamping -----
  // The pen's furthest reach is `outerSize + max(0, penOffset - innerSize)`.
  // We compute what each slider's max should be given the other two values
  // and the container size, then clamp the live params so the drawing never
  // renders outside the visible canvas.
  const CANVAS_PADDING = 24;
  const maxReach = containerSize
    ? Math.min(containerSize.width, containerSize.height) / 2 - CANVAS_PADDING
    : null;

  const limits = maxReach == null
    ? { maxOuterSize: 320, maxInnerSize: 260, maxPenOffset: 260 }
    : {
        maxOuterSize: Math.max(60, Math.floor(maxReach - Math.max(0, params.penOffset - params.innerSize))),
        maxInnerSize: Math.max(15, Math.min(260, params.outerSize - 10)),
        maxPenOffset: Math.max(0, Math.floor(maxReach - params.outerSize + params.innerSize)),
      };

  useEffect(() => {
    if (maxReach == null) return;
    setParams((p) => {
      const newOuter = Math.min(p.outerSize, Math.floor(maxReach));
      const newInner = Math.min(p.innerSize, Math.max(15, newOuter - 10));
      const penCap = Math.max(0, Math.floor(maxReach - newOuter + newInner));
      const newPen = Math.min(p.penOffset, penCap);
      if (
        newOuter === p.outerSize &&
        newInner === p.innerSize &&
        newPen === p.penOffset
      ) {
        return p;
      }
      return { ...p, outerSize: newOuter, innerSize: newInner, penOffset: newPen };
    });
  }, [maxReach]);

  const { clearDrawing, resetEngine, undoLastRun, redoLastRun, advanceBy, liftPen } =
    useSpirographEngine({
      drawCanvasRef,
      overlayCanvasRef,
      containerSize,
      params,
      color,
      playing: drawing,
      view,
    });

  // ----- Pointer → gear roll -----
  // We read the cursor's angle around the canvas center and feed each angular
  // delta into the engine. Moving the mouse counter-clockwise around the board
  // rolls the gear forward, clockwise reverses it.
  const prevAngleRef = useRef(null);
  const sensitivityRef = useRef(params.sensitivity);
  sensitivityRef.current = params.sensitivity;
  const drawingRef = useRef(drawing);
  drawingRef.current = drawing;

  const readAngle = useCallback((clientX, clientY) => {
    const container = containerRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    const mx = clientX - rect.left - rect.width / 2;
    // Flip y: DOM y grows downward, our math frame is y-up.
    const my = -(clientY - rect.top - rect.height / 2);
    if (mx === 0 && my === 0) return null;
    return Math.atan2(my, mx);
  }, []);

  const drawModeRef = useRef(view.drawMode);
  drawModeRef.current = view.drawMode;

  const handlePointerMove = useCallback(
    (e) => {
      if (!drawingRef.current) return;
      if (drawModeRef.current !== 'cursor') return;
      const angle = readAngle(e.clientX, e.clientY);
      if (angle == null) return;

      const prev = prevAngleRef.current;
      if (prev == null) {
        prevAngleRef.current = angle;
        return;
      }

      // Shortest-arc unwrap so crossing the ±π seam doesn't cause a huge jump.
      let delta = angle - prev;
      if (delta > Math.PI) delta -= TAU;
      else if (delta < -Math.PI) delta += TAU;

      prevAngleRef.current = angle;
      advanceBy(delta * sensitivityRef.current);
    },
    [advanceBy, readAngle]
  );

  const handlePointerEnter = useCallback(
    (e) => {
      if (drawModeRef.current !== 'cursor') return;
      prevAngleRef.current = readAngle(e.clientX, e.clientY);
      liftPen();
    },
    [liftPen, readAngle]
  );

  const handlePointerLeave = useCallback(() => {
    if (drawModeRef.current !== 'cursor') return;
    prevAngleRef.current = null;
    liftPen();
  }, [liftPen]);

  // Mobile-only: tapping the stage auto-enables drawing mode so the user
  // doesn't need to hit the Play FAB first. We set the ref synchronously so
  // the pointermove that follows the same tap isn't gated on a stale state.
  const isMobileRef = useRef(isMobile);
  isMobileRef.current = isMobile;

  const handlePointerDown = useCallback(
    (e) => {
      if (!isMobileRef.current) return;
      if (!drawingRef.current) {
        drawingRef.current = true;
        setDrawing(true);
      }
      if (drawModeRef.current === 'cursor') {
        prevAngleRef.current = readAngle(e.clientX, e.clientY);
        liftPen();
      }
    },
    [liftPen, readAngle]
  );

  // Toggling play state or switching modes lifts the pen so there's no
  // jumping line segment across the transition.
  useEffect(() => {
    prevAngleRef.current = null;
    liftPen();
  }, [drawing, view.drawMode, liftPen]);

  // ----- Toolbar actions -----
  const handleDrawToggle = useCallback(() => setDrawing((p) => !p), []);

  const handleClear = useCallback(() => {
    clearDrawing();
  }, [clearDrawing]);

  const handleReset = useCallback(() => {
    setParams(DEFAULT_PARAMS);
    setColor(DEFAULT_COLOR);
    setView(DEFAULT_VIEW);
    setDrawing(false);
    resetEngine();
  }, [resetEngine]);

  const handleExport = useCallback(() => {
    const bg = view.theme === 'dark' ? '#0f0f1a' : '#ffffff';
    exportCanvasAsPng(drawCanvasRef.current, {
      filename: `spirograph-${Date.now()}.png`,
      background: bg,
    });
  }, [view.theme]);

  const handleRandomize = useCallback(() => {
    const { params: rp, color: rc } = randomPreset();
    setParams((prev) => ({ ...prev, ...rp }));
    setColor(rc);
  }, []);

  const handleApplyPreset = useCallback((preset) => {
    setParams((prev) => ({ ...DEFAULT_PARAMS, ...prev, ...preset.params }));
    setColor({ ...DEFAULT_COLOR, ...preset.color });
  }, []);

  const controlPanel = (
    <ControlPanel
      params={params}
      color={color}
      view={view}
      playing={drawing}
      limits={limits}
      onParamsChange={setParams}
      onColorChange={setColor}
      onViewChange={setView}
      onPlayPause={handleDrawToggle}
      onClear={handleClear}
      onReset={handleReset}
      onUndo={undoLastRun}
      onExport={handleExport}
      onRandomize={handleRandomize}
      onApplyPreset={handleApplyPreset}
    />
  );

  return (
    <div
      className={`app app--${view.theme} ${isMobile ? 'app--mobile' : 'app--desktop'}`}
    >
      <header className="app__header">
        <div className="app__brand">
          <span className="app__brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="24" height="24">
              <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="16" cy="9" r="5" fill="none" stroke="currentColor" strokeWidth="1.3" opacity="0.7" />
              <circle cx="16" cy="6" r="1.6" fill="currentColor" />
            </svg>
          </span>
          <div>
            <h1 className="app__title">Looploom</h1>
            <p className="app__subtitle">{getSubtitle(view.drawMode, drawing)}</p>
          </div>
        </div>
        <div className="app__header-actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setView((v) => ({ ...v, theme: v.theme === 'dark' ? 'light' : 'dark' }))}
            title="Toggle theme"
          >
            {view.theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
      </header>

      <main className="app__main">
        <DrawingCanvas
          drawCanvasRef={drawCanvasRef}
          overlayCanvasRef={overlayCanvasRef}
          containerRef={containerRef}
          theme={view.theme}
          drawing={drawing}
          onPointerMove={handlePointerMove}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onPointerDown={handlePointerDown}
        />

        {isMobile ? (
          <>
            <MobileQuickBar
              params={params}
              color={color}
              playing={drawing}
              drawMode={view.drawMode}
              limits={limits}
              onParamsChange={setParams}
              onColorChange={setColor}
              onPlayPause={handleDrawToggle}
              onClear={handleClear}
              onUndo={undoLastRun}
              onRedo={redoLastRun}
              onOpenMenu={() => setMobileMenuOpen(true)}
            />
            <MobileDrawer
              open={mobileMenuOpen}
              onClose={() => setMobileMenuOpen(false)}
            >
              {controlPanel}
            </MobileDrawer>
          </>
        ) : (
          controlPanel
        )}
      </main>
    </div>
  );
}
