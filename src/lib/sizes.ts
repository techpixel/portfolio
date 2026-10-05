/**
 * The `sizes` width of an image slot that is `px` wide in the layout.
 *
 * Layout.astro zooms the whole page by max(1, min(vw / 1440, vh / 888)) on large screens,
 * so a 1200px column really paints 1200 × zoom CSS pixels. Browsers choose a srcset
 * candidate from `sizes`, not from the zoomed layout, so a plain `1200px` makes them pick
 * an image up to 60% too small and upscale it. This spells the zoom out in viewport units.
 */
export function zoomed(px: number): string {
	const vw = ((px / 1440) * 100).toFixed(2);
	const vh = ((px / 888) * 100).toFixed(2);
	return `max(${px}px, min(${vw}vw, ${vh}vh))`;
}

/** Srcset widths up to and including the source's own, so large zoomed slots stay sharp. */
export function widthsUpTo(max: number, steps = [480, 720, 960, 1200, 1600, 2000, 2400, 3000, 3600]): number[] {
	return [...steps.filter((w) => w < max), max];
}
