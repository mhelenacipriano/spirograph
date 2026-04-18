import { useEffect, useState } from 'react';

/**
 * Observe an element's content box size. Returns `{ width, height }` (CSS
 * pixels) or `null` until the first measurement.
 */
export function useResizeObserver(ref) {
  const [size, setSize] = useState(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        setSize({ width: Math.round(cr.width), height: Math.round(cr.height) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return size;
}
