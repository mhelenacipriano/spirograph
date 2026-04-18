/**
 * Accessible on/off switch. Controlled component.
 */
export default function Toggle({ label, description, checked, onChange, disabled }) {
  return (
    <label className={`toggle ${disabled ? 'toggle--disabled' : ''}`}>
      <span className="toggle__text">
        <span className="toggle__label">{label}</span>
        {description && <span className="toggle__desc">{description}</span>}
      </span>
      <span className={`toggle__switch ${checked ? 'toggle__switch--on' : ''}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <span className="toggle__thumb" />
      </span>
    </label>
  );
}
