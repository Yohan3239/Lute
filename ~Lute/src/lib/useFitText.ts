import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type FitTextOptions = {
  minSize: number;
  maxSize: number;
};

function px(n: string) {
  const v = parseFloat(n);
  return Number.isFinite(v) ? v : 0;
}

export function useFitText(
  textRef: { current: HTMLElement | null },
  containerRef: { current: HTMLElement | null },
  options: FitTextOptions,
  deps: ReadonlyArray<unknown> = []
) {
  const rafRef = useRef<number | null>(null);
  const lastSizeRef = useRef<number | null>(null);

  const [fitted, setFitted] = useState(false);
  const [bestSize, setBestSize] = useState<number | null>(null);
  const [needsScroll, setNeedsScroll] = useState(false);

  useEffect(() => {
    setFitted(false);
    setNeedsScroll(false);
  }, deps);

  useLayoutEffect(() => {
    const textEl = textRef.current;
    const containerEl = containerRef.current;
    if (!textEl || !containerEl) return;

    const min = Math.max(1, Math.min(options.minSize, options.maxSize));
    const max = Math.max(options.minSize, options.maxSize);

    const fit = () => {
      const t = textRef.current;
      const c = containerRef.current;
      if (!t || !c) return;

      t.style.transition = "none";
      const prevOverflowY = c.style.overflowY;
      c.style.overflowY = "hidden";

      const cs = window.getComputedStyle(c);
      const paddingW = px(cs.paddingLeft) + px(cs.paddingRight);
      const paddingH = px(cs.paddingTop) + px(cs.paddingBottom);
      const maxW = px(cs.maxWidth);
      const maxH = px(cs.maxHeight);
      const baseW = maxW > 0 ? maxW : c.clientWidth;
      const baseH = maxH > 0 ? maxH : c.clientHeight;
      const availW = baseW - paddingW;
      const availH = baseH - paddingH;

      if (availW <= 0 || availH <= 0) {
        c.style.overflowY = prevOverflowY;
        setFitted(false);
        setNeedsScroll(false);
        return;
      }

      const content = t.textContent ?? "";
      if (content.trim().length === 0) {
        if (lastSizeRef.current !== max) {
          t.style.fontSize = `${max}px`;
          lastSizeRef.current = max;
          setBestSize(max);
        }
        c.style.overflowY = prevOverflowY;
        setFitted(true);
        setNeedsScroll(false);
        return;
      }

      t.style.fontSize = `${max}px`;

      let low = min;
      let high = max;
      let best = min;
      let didFit = false;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        t.style.fontSize = `${mid}px`;

        const fits = t.scrollHeight <= availH;

        if (fits) {
          didFit = true;
          best = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      if (lastSizeRef.current !== best) {
        t.style.fontSize = `${best}px`;
        lastSizeRef.current = best;
        setBestSize(best);
      } else {
        // ensure we're actually at the last chosen size
        t.style.fontSize = `${best}px`;
      }

      const finalFits = didFit && t.scrollHeight <= availH;

      // Check overflow at MIN (this is the "needs scrollbar" truth)
      const prevFontSize = t.style.fontSize;
      t.style.fontSize = `${min}px`;
      const overflowsAtMin = t.scrollHeight > availH;
      t.style.fontSize = prevFontSize;

      c.style.overflowY = prevOverflowY;
      setFitted(finalFits);
      setNeedsScroll(overflowsAtMin);
    };

    const scheduleFit = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        fit();
      });
    };

    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(scheduleFit) : null;
    if (ro) ro.observe(containerEl);

    scheduleFit();

    return () => {
      ro?.disconnect();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [textRef, containerRef, options.minSize, options.maxSize, ...deps]);

  return { fitted, bestSize, needsScroll };
}
