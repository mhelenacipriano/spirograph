import { useState } from 'react';
import { SHAPES, ShapeIcon } from './ShapeSelector.jsx';

/**
 * Floating overlays for mobile: a horizontal shape-picker pill at the top of
 * the stage, a horizontal color-swatch pill at the bottom-left, and a stack
 * of FABs (Play/Pause, Menu, Clear) at the bottom-right.
 *
 * The drawing stage sits below this overlay and occupies the full viewport.
 */

const QUICK_COLORS = [
  '#ec4899',
  '#7c3aed',
  '#22d3ee',
  '#10b981',
  '#f59e0b',
  '#f43f5e',
];

export default function MobileQuickBar({
  params,
  color,
  playing,
  drawMode,
  limits,
  onParamsChange,
  onColorChange,
  onPlayPause,
  onClear,
  onUndo,
  onRedo,
  onOpenMenu,
}) {
  const [shapeTab, setShapeTab] = useState('outer');

  const activeSwatch = color.mode === 'solid' ? color.value : null;
  const playLabel = playing
    ? 'Pause'
    : drawMode === 'cursor'
      ? 'Draw'
      : 'Play';

  const shapeKey = shapeTab === 'outer' ? 'outerShape' : 'innerShape';
  const activeShape = params[shapeKey];
  const setActiveShape = (id) => onParamsChange({ ...params, [shapeKey]: id });

  // The size slider targets whichever shape the tab currently controls.
  const sizeKey = shapeTab === 'outer' ? 'outerSize' : 'innerSize';
  const sizeMin = shapeTab === 'outer' ? 60 : 15;
  const sizeMax = Math.max(
    sizeMin,
    shapeTab === 'outer'
      ? (limits?.maxOuterSize ?? 320)
      : (limits?.maxInnerSize ?? 260)
  );
  const sizeValue = Math.min(params[sizeKey], sizeMax);

  return (
    <>
      <div className="mq-top-bar">
        <div className="mq-row">
          <div
            className="mq-pill mq-pill--tabs"
            role="tablist"
            aria-label="Shape target"
          >
            <button
              type="button"
              role="tab"
              aria-selected={shapeTab === 'outer'}
              aria-label="Edit outer shape"
              title="Outer shape"
              className={`mq-chip ${shapeTab === 'outer' ? 'mq-chip--active' : ''}`}
              onClick={() => setShapeTab('outer')}
            >
              <OuterTabIcon />
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={shapeTab === 'inner'}
              aria-label="Edit inner shape"
              title="Inner shape"
              className={`mq-chip mq-chip--inner-tab ${shapeTab === 'inner' ? 'mq-chip--active' : ''}`}
              onClick={() => setShapeTab('inner')}
            >
              <InnerTabIcon />
            </button>
          </div>
          <div className="mq-pill mq-pill--history" aria-label="History">
            <button
              type="button"
              className="mq-chip mq-chip--action"
              onClick={onUndo}
              aria-label="Undo"
              title="Undo"
            >
              <UndoIcon />
            </button>
            <button
              type="button"
              className="mq-chip mq-chip--action"
              onClick={onRedo}
              aria-label="Redo"
              title="Redo"
            >
              <RedoIcon />
            </button>
          </div>
        </div>

        <div className="mq-row">
          <div
            className={`mq-pill mq-pill--shape mq-pill--shape-${shapeTab}`}
            role="radiogroup"
            aria-label={`${shapeTab} shape`}
          >
            {SHAPES.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={activeShape === s.id}
                aria-label={`${shapeTab} ${s.label}`}
                className={`mq-chip ${activeShape === s.id ? 'mq-chip--active' : ''}`}
                onClick={() => setActiveShape(s.id)}
              >
                <ShapeIcon id={s.id} />
              </button>
            ))}
          </div>
        </div>

        <div className="mq-row">
          <label
            className="mq-pill mq-pill--slider"
            aria-label={`${shapeTab} size`}
          >
            <span className="mq-slider__icon" aria-hidden="true">
              <SizeIcon />
            </span>
            <input
              type="range"
              className="mq-range"
              min={sizeMin}
              max={sizeMax}
              value={sizeValue}
              onChange={(e) =>
                onParamsChange({
                  ...params,
                  [sizeKey]: Number(e.target.value),
                })
              }
            />
            <span className="mq-slider__value">{sizeValue}</span>
          </label>
        </div>
      </div>

      <div className="mq-pill mq-pill--colors" aria-label="Color">
        {QUICK_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Use color ${c}`}
            className={`mq-swatch ${activeSwatch === c ? 'mq-swatch--active' : ''}`}
            style={{ background: c }}
            onClick={() => onColorChange({ ...color, mode: 'solid', value: c })}
          />
        ))}
      </div>

      <div className="mq-fabs">
        <button
          type="button"
          className="mq-fab"
          onClick={onClear}
          aria-label="Clear drawing"
          title="Clear drawing"
        >
          <ClearIcon />
        </button>
        <button
          type="button"
          className="mq-fab"
          onClick={onOpenMenu}
          aria-label="Open advanced controls"
          title="Advanced"
        >
          <MenuIcon />
        </button>
        <button
          type="button"
          className="mq-fab mq-fab--primary"
          onClick={onPlayPause}
          aria-pressed={playing}
          aria-label={playLabel}
          title={playLabel}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>
    </>
  );
}

const I = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <polygon points="7,5 19,12 7,19" fill="currentColor" />
  </svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <rect x="6" y="5" width="4" height="14" fill="currentColor" />
    <rect x="14" y="5" width="4" height="14" fill="currentColor" />
  </svg>
);
const ClearIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path d="M5 6h14M9 6V4h6v2M7 6l1 14h8l1-14" {...I} />
  </svg>
);
const MenuIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h16" {...I} />
  </svg>
);
const UndoIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path d="M9 14L4 9l5-5" {...I} />
    <path d="M4 9h10a6 6 0 0 1 6 6v0a6 6 0 0 1-6 6H9" {...I} />
  </svg>
);
const RedoIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path d="M15 14l5-5-5-5" {...I} />
    <path d="M20 9H10a6 6 0 0 0-6 6v0a6 6 0 0 0 6 6h5" {...I} />
  </svg>
);
const SizeIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M4 4l6 6M14 14l6 6M4 4h5M4 4v5M20 20h-5M20 20v-5" {...I} />
  </svg>
);
// Outer/Inner tab icons: concentric circles where the relevant ring is
// emphasized (thicker stroke) so the pair reads as a visual opposition.
const OuterTabIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.2" />
    <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.55" />
  </svg>
);
const InnerTabIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.55" />
    <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
  </svg>
);
