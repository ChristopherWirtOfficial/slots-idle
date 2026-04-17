import { RefObject, useLayoutEffect, useState } from 'react';

export interface CellCenters {
  /** Column center X as percentage of grid width. */
  cols: number[];
  /** Row center Y as percentage of grid height. */
  rows: number[];
}

/**
 * Measures the center of each reel cell in percentage coordinates
 * (0–100 of the grid's bounding box), re-measuring on resize.
 *
 * Used by PaylineOverlay: its SVG uses viewBox="0 0 100 100" with
 * preserveAspectRatio="none", so these percentages land the dots
 * and polyline on top of the real cells without coupling the overlay
 * to pixel sizes.
 *
 * Assumes all reels have the same pixel height (they do — every Reel
 * uses the same --cell-h × --row-count CSS).
 */
export function useCellCenters(
  gridRef: RefObject<HTMLDivElement | null>,
  reelCount: number,
  rowCount: number,
): CellCenters {
  const [centers, setCenters] = useState<CellCenters>({ cols: [], rows: [] });

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const measure = () => {
      const reels = grid.querySelectorAll<HTMLElement>('[data-reel]');
      if (reels.length === 0) return;
      const gridRect = grid.getBoundingClientRect();
      if (gridRect.width === 0 || gridRect.height === 0) return;

      const cols: number[] = [];
      reels.forEach((el) => {
        const r = el.getBoundingClientRect();
        cols.push(((r.left + r.width / 2 - gridRect.left) / gridRect.width) * 100);
      });

      const first = reels[0].getBoundingClientRect();
      const cellH = first.height / rowCount;
      const rows = Array.from({ length: rowCount }, (_, i) => {
        const mid = (i + 0.5) * cellH;
        return ((first.top + mid - gridRect.top) / gridRect.height) * 100;
      });

      setCenters({ cols, rows });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(grid);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [gridRef, reelCount, rowCount]);

  return centers;
}
