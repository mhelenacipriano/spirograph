import ShapeSelector from './ShapeSelector.jsx';
import ParameterSliders from './ParameterSliders.jsx';
import ColorControls from './ColorControls.jsx';
import PlaybackControls from './PlaybackControls.jsx';
import PresetGallery from './PresetGallery.jsx';
import Toggle from './Toggle.jsx';

const MIRROR_OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'horizontal', label: 'Horizontal' },
  { id: 'vertical', label: 'Vertical' },
  { id: 'both', label: 'Both' },
];

const DRAW_MODES = [
  { id: 'cursor', label: 'Cursor' },
  { id: 'auto', label: 'Auto' },
];

export default function ControlPanel({
  params,
  color,
  view,
  playing,
  onParamsChange,
  onColorChange,
  onViewChange,
  onPlayPause,
  onClear,
  onReset,
  onUndo,
  onExport,
  onRandomize,
  onApplyPreset,
}) {
  return (
    <aside className="control-panel">
      <section className="control-panel__section control-panel__section--dense">
        <div className="mode-switcher">
          <span className="control-label">Mode</span>
          <div className="segmented" role="radiogroup" aria-label="Drawing mode">
            {DRAW_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={view.drawMode === m.id}
                className={`segmented__option ${view.drawMode === m.id ? 'segmented__option--active' : ''}`}
                onClick={() => onViewChange({ ...view, drawMode: m.id })}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <PlaybackControls
          playing={playing}
          drawMode={view.drawMode}
          onPlayPause={onPlayPause}
          onClear={onClear}
          onReset={onReset}
          onUndo={onUndo}
          onExport={onExport}
          onRandomize={onRandomize}
        />
      </section>

      <section className="control-panel__section">
        <h2 className="control-panel__heading">Shapes</h2>
        <ShapeSelector
          label="Outer guide"
          value={params.outerShape}
          onChange={(v) => onParamsChange({ ...params, outerShape: v })}
        />
        <ShapeSelector
          label="Inner gear"
          value={params.innerShape}
          onChange={(v) => onParamsChange({ ...params, innerShape: v })}
        />
      </section>

      <section className="control-panel__section">
        <h2 className="control-panel__heading">Parameters</h2>
        <ParameterSliders
          params={params}
          drawMode={view.drawMode}
          onChange={onParamsChange}
        />
      </section>

      <section className="control-panel__section">
        <h2 className="control-panel__heading">Color</h2>
        <ColorControls color={color} onChange={onColorChange} />
      </section>

      <section className="control-panel__section">
        <h2 className="control-panel__heading">Display</h2>
        <Toggle
          label="Show outer guide"
          checked={view.showGuides}
          onChange={(v) => onViewChange({ ...view, showGuides: v })}
        />
        <Toggle
          label="Show gear & pen arm"
          checked={view.showPenArm}
          onChange={(v) => onViewChange({ ...view, showPenArm: v })}
        />
        <Toggle
          label="Dark theme"
          checked={view.theme === 'dark'}
          onChange={(v) => onViewChange({ ...view, theme: v ? 'dark' : 'light' })}
        />
        <div className="segmented segmented--inline" role="radiogroup" aria-label="Mirror mode">
          <span className="control-label control-label--inline">Mirror</span>
          {MIRROR_OPTIONS.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={view.mirror === m.id}
              className={`segmented__option ${view.mirror === m.id ? 'segmented__option--active' : ''}`}
              onClick={() => onViewChange({ ...view, mirror: m.id })}
            >
              {m.label}
            </button>
          ))}
        </div>
      </section>

      <section className="control-panel__section">
        <h2 className="control-panel__heading">Presets</h2>
        <PresetGallery onApply={onApplyPreset} />
      </section>

      <footer className="control-panel__footer">
        <span>Spirograph Studio</span>
        <a
          className="control-panel__footer-link"
          href="https://github.com/"
          target="_blank"
          rel="noreferrer"
        >
          Open source
        </a>
      </footer>
    </aside>
  );
}
