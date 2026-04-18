const MODES = [
  { id: 'solid', label: 'Solid' },
  { id: 'rainbow', label: 'Rainbow' },
  { id: 'cycle', label: 'Per-cycle' },
];

export default function ColorControls({ color, onChange }) {
  const update = (patch) => onChange({ ...color, ...patch });

  return (
    <div className="color-controls">
      <span className="control-label">Color</span>

      <div className="segmented" role="radiogroup" aria-label="Color mode">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={color.mode === m.id}
            className={`segmented__option ${color.mode === m.id ? 'segmented__option--active' : ''}`}
            onClick={() => update({ mode: m.id })}
          >
            {m.label}
          </button>
        ))}
      </div>

      {color.mode === 'solid' && (
        <label className="color-controls__picker">
          <span>Pick color</span>
          <input
            type="color"
            value={color.value}
            onChange={(e) => update({ value: e.target.value })}
          />
          <span className="color-controls__swatch" style={{ background: color.value }} />
        </label>
      )}

      {color.mode === 'rainbow' && (
        <label className="slider">
          <span className="slider__label">
            <span>Rainbow speed</span>
            <span className="slider__value">{color.rainbowSpeed ?? 60}</span>
          </span>
          <input
            type="range"
            min="10"
            max="240"
            step="5"
            value={color.rainbowSpeed ?? 60}
            onChange={(e) => update({ rainbowSpeed: Number(e.target.value) })}
          />
        </label>
      )}

      {color.mode === 'cycle' && (
        <>
          <label className="slider">
            <span className="slider__label">
              <span>Base hue</span>
              <span className="slider__value">{color.cycleBaseHue ?? 200}°</span>
            </span>
            <input
              type="range"
              min="0"
              max="359"
              value={color.cycleBaseHue ?? 200}
              onChange={(e) => update({ cycleBaseHue: Number(e.target.value) })}
            />
          </label>
          <label className="slider">
            <span className="slider__label">
              <span>Hue step</span>
              <span className="slider__value">{color.cycleHueStep ?? 47}°</span>
            </span>
            <input
              type="range"
              min="5"
              max="120"
              value={color.cycleHueStep ?? 47}
              onChange={(e) => update({ cycleHueStep: Number(e.target.value) })}
            />
          </label>
        </>
      )}
    </div>
  );
}
