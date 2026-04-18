import { useEffect, useRef } from 'react';

/**
 * Stable requestAnimationFrame loop. `callback` receives the delta in ms since
 * the previous frame. The callback can be changed freely without tearing down
 * the loop (we store it in a ref).
 *
 * Pass `active=false` to pause the loop without unmounting.
 */
export function useAnimationFrame(callback, active = true) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!active) return undefined;
    let rafId = 0;
    let prev = performance.now();

    const tick = (now) => {
      const dt = now - prev;
      prev = now;
      cbRef.current?.(dt, now);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [active]);
}
