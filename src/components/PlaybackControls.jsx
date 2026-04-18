export default function PlaybackControls({
  playing,
  drawMode = 'auto',
  onPlayPause,
  onClear,
  onReset,
  onUndo,
  onExport,
  onRandomize,
}) {
  const startLabel = drawMode === 'cursor' ? 'Draw' : 'Play';
  return (
    <div className="playback-controls">
      <button
        type="button"
        className="btn btn--primary"
        onClick={onPlayPause}
        aria-pressed={playing}
      >
        {playing ? (
          <>
            <PauseIcon /> Pause
          </>
        ) : (
          <>
            <PlayIcon /> {startLabel}
          </>
        )}
      </button>

      <button type="button" className="btn" onClick={onClear} title="Clear drawing, keep settings">
        <ClearIcon /> Clear
      </button>

      <button type="button" className="btn" onClick={onUndo} title="Undo last run">
        <UndoIcon /> Undo
      </button>

      <button type="button" className="btn" onClick={onReset} title="Reset everything">
        <ResetIcon /> Reset
      </button>

      <button type="button" className="btn" onClick={onRandomize} title="Randomize settings">
        <DiceIcon /> Random
      </button>

      <button type="button" className="btn btn--accent" onClick={onExport} title="Export PNG">
        <ExportIcon /> Export
      </button>
    </div>
  );
}

// Tiny inline SVG icon set so we don't need an icon dependency.
const I = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <polygon points="7,5 19,12 7,19" fill="currentColor" />
  </svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <rect x="6" y="5" width="4" height="14" fill="currentColor" />
    <rect x="14" y="5" width="4" height="14" fill="currentColor" />
  </svg>
);
const ClearIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M5 6h14M9 6V4h6v2M7 6l1 14h8l1-14" {...I} />
  </svg>
);
const UndoIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M9 14L4 9l5-5" {...I} />
    <path d="M4 9h10a6 6 0 0 1 6 6v0a6 6 0 0 1-6 6H9" {...I} />
  </svg>
);
const ResetIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M4 12a8 8 0 1 0 3-6.2" {...I} />
    <polyline points="4,4 4,9 9,9" {...I} />
  </svg>
);
const DiceIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <rect x="4" y="4" width="16" height="16" rx="3" {...I} />
    <circle cx="9" cy="9" r="1.2" fill="currentColor" />
    <circle cx="15" cy="9" r="1.2" fill="currentColor" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    <circle cx="9" cy="15" r="1.2" fill="currentColor" />
    <circle cx="15" cy="15" r="1.2" fill="currentColor" />
  </svg>
);
const ExportIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M12 4v12" {...I} />
    <polyline points="7,9 12,4 17,9" {...I} />
    <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" {...I} />
  </svg>
);
