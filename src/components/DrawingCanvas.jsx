import { forwardRef } from 'react';

/**
 * Two stacked canvases with pointer handling.
 *
 *   - `drawCanvas` holds the permanent pattern.
 *   - `overlayCanvas` re-renders the gear / pen / guides every frame.
 *   - Pointer events on the container roll the inner gear; the parent
 *     converts those events to engine commands.
 *
 * When `drawing` is true the cursor switches to a crosshair so the user
 * knows they're actively tracing.
 */
const DrawingCanvas = forwardRef(function DrawingCanvas(
  {
    drawCanvasRef,
    overlayCanvasRef,
    containerRef,
    theme,
    drawing,
    onPointerMove,
    onPointerEnter,
    onPointerLeave,
    onPointerDown,
  },
  _ref
) {
  return (
    <div
      ref={containerRef}
      className={`drawing-stage drawing-stage--${theme} ${drawing ? 'drawing-stage--active' : ''}`}
      role="img"
      aria-label={drawing ? 'Spirograph drawing canvas — drawing mode active' : 'Spirograph drawing canvas'}
      onPointerMove={onPointerMove}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
    >
      <div className="drawing-stage__frame" aria-hidden="true" />
      <canvas ref={drawCanvasRef} className="drawing-stage__canvas drawing-stage__canvas--draw" />
      <canvas ref={overlayCanvasRef} className="drawing-stage__canvas drawing-stage__canvas--overlay" />
      {!drawing && (
        <div className="drawing-stage__hint" aria-hidden="true">
          Press <kbd>Draw</kbd> to enable cursor-driven drawing.
        </div>
      )}
    </div>
  );
});

export default DrawingCanvas;
