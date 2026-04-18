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
  onParamsChange,
  onColorChange,
  onPlayPause,
  onClear,
  onOpenMenu,
}) {
  const activeSwatch = color.mode === 'solid' ? color.value : null;
  const playLabel = playing
    ? 'Pause'
    : drawMode === 'cursor'
      ? 'Draw'
      : 'Play';

  return (
    <>
      <div className="mq-pill mq-pill--top" role="radiogroup" aria-label="Outer shape">
        {SHAPES.map((s) => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={params.outerShape === s.id}
            aria-label={s.label}
            className={`mq-chip ${params.outerShape === s.id ? 'mq-chip--active' : ''}`}
            onClick={() => onParamsChange({ ...params, outerShape: s.id })}
          >
            <ShapeIcon id={s.id} />
          </button>
        ))}
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
