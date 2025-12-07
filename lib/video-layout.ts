export interface GridLayout {
  rows: number;
  cols: number;
  itemWidth: string;
  itemHeight: string;
  gap: number;
}

export interface VideoPosition {
  row: number;
  col: number;
  width: string;
  height: string;
}

/**
 * Calculate optimal grid layout based on participant count
 * - 1 participant: Full screen
 * - 2 participants: Side by side (1x2)
 * - 3-4 participants: Grid 2x2
 * - 5-9 participants: Grid 3x3
 * - 10+ participants: Grid 4x4 with scroll
 */
export function calculateGridLayout(count: number): GridLayout {
  if (count <= 0) {
    return { rows: 0, cols: 0, itemWidth: "0%", itemHeight: "0%", gap: 8 };
  }

  if (count === 1) {
    return { rows: 1, cols: 1, itemWidth: "100%", itemHeight: "100%", gap: 0 };
  }

  if (count === 2) {
    return { rows: 2, cols: 1, itemWidth: "100%", itemHeight: "50%", gap: 8 };
  }

  if (count <= 4) {
    return { rows: 2, cols: 2, itemWidth: "50%", itemHeight: "50%", gap: 8 };
  }

  if (count <= 9) {
    return { rows: 3, cols: 3, itemWidth: "33.33%", itemHeight: "33.33%", gap: 8 };
  }

  // 10+ participants: 4x4 grid with scroll
  return { rows: 4, cols: 4, itemWidth: "25%", itemHeight: "25%", gap: 8 };
}

/**
 * Get position in grid for a specific index
 */
export function getGridPosition(index: number, cols: number): VideoPosition {
  const row = Math.floor(index / cols);
  const col = index % cols;
  const layout = calculateGridLayout((row + 1) * cols);

  return {
    row,
    col,
    width: layout.itemWidth,
    height: layout.itemHeight,
  };
}

/**
 * Get CSS grid template based on participant count
 */
export function getGridTemplateStyles(count: number): React.CSSProperties {
  const layout = calculateGridLayout(count);

  if (count <= 0) {
    return {};
  }

  return {
    display: "grid",
    gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
    gridTemplateRows: count > 9 ? "auto" : `repeat(${layout.rows}, 1fr)`,
    gap: `${layout.gap}px`,
    padding: layout.gap > 0 ? `${layout.gap}px` : 0,
    height: count > 9 ? "auto" : "100%",
    minHeight: count > 9 ? "100%" : undefined,
    overflow: count > 9 ? "auto" : "hidden",
  };
}

/**
 * Get responsive grid classes for Tailwind
 */
export function getGridClasses(count: number): string {
  if (count <= 0) return "";
  if (count === 1) return "grid grid-cols-1 grid-rows-1";
  if (count === 2) return "grid grid-cols-1 grid-rows-2 gap-2";
  if (count <= 4) return "grid grid-cols-2 grid-rows-2 gap-2 p-2";
  if (count <= 9) return "grid grid-cols-3 grid-rows-3 gap-2 p-2";
  return "grid grid-cols-4 auto-rows-fr gap-2 p-2 overflow-auto";
}

/**
 * Check if layout should scroll (for 10+ participants)
 */
export function shouldScroll(count: number): boolean {
  return count > 9;
}

/**
 * Get aspect ratio for video container
 */
export function getAspectRatio(count: number): string {
  if (count === 1) return "16/9";
  if (count === 2) return "16/9";
  return "4/3";
}
