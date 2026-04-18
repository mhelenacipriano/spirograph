import { useEffect } from 'react';

/**
 * Bottom-sheet drawer. Slides up over the canvas, dims the stage behind it,
 * and can be dismissed with the backdrop, the close button, or Escape.
 */
export default function MobileDrawer({
  open,
  onClose,
  title = 'Advanced controls',
  children,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div
      className={`mobile-drawer ${open ? 'mobile-drawer--open' : ''}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className="mobile-drawer__backdrop"
        aria-label="Close advanced controls"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <div
        className="mobile-drawer__sheet"
        role="dialog"
        aria-modal={open}
        aria-label={title}
      >
        <div className="mobile-drawer__header">
          <span className="mobile-drawer__handle" aria-hidden="true" />
          <h2 className="mobile-drawer__title">{title}</h2>
          <button
            type="button"
            className="mobile-drawer__close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="mobile-drawer__content">{children}</div>
      </div>
    </div>
  );
}
