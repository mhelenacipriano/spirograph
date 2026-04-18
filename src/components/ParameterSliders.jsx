import { useId } from 'react';

function formatValue(value, step) {
  if (typeof value !== 'number') return value;
  const digits = step < 1 ? 3 : 0;
  return value.toFixed(digits);
}

function Slider({ label, value, min, max, step = 1, suffix, onChange }) {
  const inputId = useId();
  return (
    <div className="slider">
      <label className="slider__label" htmlFor={inputId}>
        <span>{label}</span>
        <span className="slider__value">
          {formatValue(value, step)}
          {suffix ? ` ${suffix}` : ''}
        </span>
      </label>
      <input
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
    </div>
  );
}

export default function ParameterSliders({ params, drawMode, limits, onChange }) {
  const update = (patch) => onChange({ ...params, ...patch });

  const maxOuter = limits?.maxOuterSize ?? 320;
  const maxInner = limits?.maxInnerSize ?? Math.min(260, params.outerSize - 10);
  const maxPen = limits?.maxPenOffset ?? Math.max(30, params.innerSize * 2.2);

  return (
    <div className="parameter-sliders">
      <Slider
        label="Outer size"
        value={Math.min(params.outerSize, maxOuter)}
        min={60}
        max={Math.max(60, maxOuter)}
        onChange={(v) => update({ outerSize: v })}
      />
      <Slider
        label="Inner size"
        value={Math.min(params.innerSize, maxInner)}
        min={15}
        max={Math.max(15, maxInner)}
        onChange={(v) => update({ innerSize: v })}
      />
      <Slider
        label="Pen offset"
        value={Math.min(params.penOffset, maxPen)}
        min={0}
        max={Math.max(0, maxPen)}
        onChange={(v) => update({ penOffset: v })}
      />
      {drawMode === 'auto' && (
        <Slider
          label="Speed"
          value={params.speed}
          min={0.005}
          max={0.25}
          step={0.005}
          onChange={(v) => update({ speed: v })}
        />
      )}
      <Slider
        label="Smoothness"
        value={params.stepSize}
        min={0.002}
        max={0.05}
        step={0.001}
        onChange={(v) => update({ stepSize: v })}
      />
      <Slider
        label="Line width"
        value={params.lineWidth}
        min={0.4}
        max={6}
        step={0.1}
        onChange={(v) => update({ lineWidth: v })}
      />

      {params.outerShape === 'polygon' && (
        <Slider
          label="Polygon sides"
          value={params.polygonSides}
          min={3}
          max={12}
          onChange={(v) => update({ polygonSides: v })}
        />
      )}

      {params.outerShape === 'ellipse' && (
        <Slider
          label="Ellipse ratio"
          value={params.ellipseRatio}
          min={0.2}
          max={1}
          step={0.01}
          onChange={(v) => update({ ellipseRatio: v })}
        />
      )}

      {params.outerShape === 'roundedSquare' && (
        <Slider
          label="Corner roundness"
          value={params.cornerSharpness}
          min={2.2}
          max={10}
          step={0.1}
          onChange={(v) => update({ cornerSharpness: v })}
        />
      )}
    </div>
  );
}
