export const SHAPES = [
  { id: 'circle', label: 'Circle' },
  { id: 'ellipse', label: 'Ellipse' },
  { id: 'triangle', label: 'Triangle' },
  { id: 'square', label: 'Square' },
  { id: 'roundedSquare', label: 'Rounded' },
  { id: 'polygon', label: 'Polygon' },
];

/**
 * Segmented button group. When `innerOnly` is true we offer a reduced set —
 * non-circle inner gears still work mathematically via our generic rolling
 * routine, so we expose all of them.
 */
export default function ShapeSelector({ label, value, onChange, shapes = SHAPES }) {
  return (
    <div className="shape-selector">
      <span className="control-label">{label}</span>
      <div className="shape-selector__options" role="radiogroup" aria-label={label}>
        {shapes.map((s) => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={value === s.id}
            className={`shape-chip ${value === s.id ? 'shape-chip--active' : ''}`}
            onClick={() => onChange(s.id)}
          >
            <ShapeIcon id={s.id} />
            <span>{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ShapeIcon({ id }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6 };
  switch (id) {
    case 'circle':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <circle cx="12" cy="12" r="8" {...common} />
        </svg>
      );
    case 'ellipse':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <ellipse cx="12" cy="12" rx="9" ry="5.5" {...common} />
        </svg>
      );
    case 'triangle':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <polygon points="12,3 21,20 3,20" {...common} />
        </svg>
      );
    case 'square':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" {...common} />
        </svg>
      );
    case 'roundedSquare':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="5" ry="5" {...common} />
        </svg>
      );
    case 'polygon':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <polygon points="12,3 21,9 18,20 6,20 3,9" {...common} />
        </svg>
      );
    default:
      return null;
  }
}
