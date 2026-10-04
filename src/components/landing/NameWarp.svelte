<script lang="ts">
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	// @ts-expect-error warpjs ships no types
	import Warp from 'warpjs';
	import svg from '../../assets/landing/name-warp.svg?raw';
	import { cubicBezier } from '../../lib/easing';

	// The glyph outlines and the box they were drawn in, read from the asset so it stays the source.
	const d = /<path id="name-warp-glyphs" d="([^"]+)"/.exec(svg)![1];
	const [, width, height] = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg)!;

	/*
	 * The intro slides the name in along its own warp, the way the Figma version slid it in
	 * along x. The warp's spine is the baseline curve drawn in Figma over the mark ("Vector
	 * 54": a dip under "ITEJ", a crest at "RG", easing down again at the right). Every point
	 * of the mark is described by where it sits along that curve and how far above it, so
	 * the letters can be carried along the curve and set back down exactly where they were.
	 * Past the curve's right end the line runs on along its end tangent, which is where the
	 * letters come in from.
	 */
	type Point = [number, number];
	/** The curve's three cubic segments, in the mark's coordinates (the drawing's box, moved by 1.5, 66). */
	const SPINE: [Point, Point, Point, Point][] = (
		[
			[[0.506295, 39.7453], [11.9873, 46.4858], [58.1082, 78.9256], [183.289, 79.9999]],
			[[183.289, 79.9999], [308.47, 81.0742], [523.006, 1.00001], [639.874, 1]],
			[[639.874, 1], [756.743, 0.99999], [822.006, 33.4836], [841.506, 40.7313]],
		] as [Point, Point, Point, Point][]
	).map((seg) => seg.map(([x, y]) => [x + 1.5, y + 66] as Point) as [Point, Point, Point, Point]);
	/** Samples per segment. The curve is gentle, so this keeps the polyline within a fraction of a pixel. */
	const SAMPLES = 160;

	/** How far along the curve, in px, the slide starts: past the far end, so the first letter is out of view. */
	const SLIDE_FROM = 900;
	const DURATION = 1200;
	/** A long ease-out, the dot sweep's curve: fast in, then a glide to rest with no halt. */
	const ease = cubicBezier([0.25, 1, 0.5, 1]);
	/** Outline segments longer than this many px are subdivided, so they bend rather than stay rigid. */
	const INTERPOLATE = 8;

	/** The spine as a polyline: positions, cumulative arc length, unit tangents and upward unit normals. */
	function sampleSpine() {
		const pts: Point[] = [];
		for (const [p0, p1, p2, p3] of SPINE) {
			for (let i = 0; i < SAMPLES; i++) {
				const t = i / SAMPLES;
				const u = 1 - t;
				pts.push([
					u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
					u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
				]);
			}
		}
		pts.push(SPINE[SPINE.length - 1][3]);
		const s = [0];
		for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
		const tangent: Point[] = pts.map((p, i) => {
			const a = pts[Math.max(0, i - 1)];
			const b = pts[Math.min(pts.length - 1, i + 1)];
			const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
			return [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
		});
		// Up is to the left of the direction of travel, in y-down coordinates.
		const normal: Point[] = tangent.map(([tx, ty]) => [ty, -tx]);
		return { pts, s, tangent, normal };
	}
	type Spine = ReturnType<typeof sampleSpine>;

	/** The point `v` above the spine at arc position `s`, continuing straight past either end. */
	function along(spine: Spine, s: number, v: number): Point {
		const { pts, s: S, tangent, normal } = spine;
		const last = pts.length - 1;
		if (s <= 0) return [pts[0][0] + tangent[0][0] * s + normal[0][0] * v, pts[0][1] + tangent[0][1] * s + normal[0][1] * v];
		if (s >= S[last]) {
			const over = s - S[last];
			return [pts[last][0] + tangent[last][0] * over + normal[last][0] * v, pts[last][1] + tangent[last][1] * over + normal[last][1] * v];
		}
		let lo = 0;
		let hi = last;
		while (hi - lo > 1) {
			const mid = (lo + hi) >> 1;
			if (S[mid] <= s) lo = mid;
			else hi = mid;
		}
		const f = (s - S[lo]) / (S[hi] - S[lo]);
		const nx = normal[lo][0] + (normal[hi][0] - normal[lo][0]) * f;
		const ny = normal[lo][1] + (normal[hi][1] - normal[lo][1]) * f;
		const nl = Math.hypot(nx, ny);
		return [
			pts[lo][0] + (pts[hi][0] - pts[lo][0]) * f + (nx / nl) * v,
			pts[lo][1] + (pts[hi][1] - pts[lo][1]) * f + (ny / nl) * v,
		];
	}

	/** Where a point of the mark sits relative to the spine: its arc position and height above it. */
	function locate(spine: Spine, [x, y]: Point): [number, number] {
		const { pts, s: S } = spine;
		// The spine runs left to right, so the nearest sample by x is on the right segment.
		let lo = 0;
		let hi = pts.length - 1;
		while (hi - lo > 1) {
			const mid = (lo + hi) >> 1;
			if (pts[mid][0] <= x) lo = mid;
			else hi = mid;
		}
		// Project onto that segment for the arc position, and measure the height along its normal.
		const a = pts[lo];
		const b = pts[hi];
		const dx = b[0] - a[0];
		const dy = b[1] - a[1];
		const f = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy)));
		const s = S[lo] + (S[hi] - S[lo]) * f;
		const [cx, cy] = along(spine, s, 0);
		const len = Math.hypot(dx, dy);
		const v = (x - cx) * (dy / len) + (y - cy) * (-dx / len);
		return [s, v];
	}

	let glyphs: SVGPathElement;
	// Hidden until the first animated frame, so the finished mark never flashes before it
	// slides in. Only when scripts run: without them the finished mark simply shows.
	let ready = $state(false);

	onMount(() => {
		if (prefersReducedMotion.current) {
			ready = true;
			return;
		}
		const spine = sampleSpine();
		// warpjs works on its own copy of the glyphs; each frame's result is copied across, so
		// the mask and the rest of the SVG stay out of its hands.
		const scratch = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		scratch.innerHTML = `<path d="${d}"/>`;
		const warp = new Warp(scratch, 'c');
		warp.interpolate(INTERPOLATE);
		// Each point remembers its place on the spine, and the sliver the polyline misses, which
		// is blended back in as the slide completes so the last frame is the mark itself.
		warp.transform(([x, y]: number[]) => {
			const [s, v] = locate(spine, [x, y]);
			const [hx, hy] = along(spine, s, v);
			return [x, y, s, v, x - hx, y - hy];
		});
		const source = scratch.querySelector('path')!;
		let raf = 0;
		let start = 0;
		const frame = (now: number) => {
			if (!start) start = now;
			const t = ease(Math.min(1, (now - start) / DURATION));
			const shift = SLIDE_FROM * (1 - t);
			warp.transform(([, , s, v, cx, cy]: number[]) => {
				const [x, y] = along(spine, s + shift, v);
				return [x + cx * t, y + cy * t, s, v, cx, cy];
			});
			glyphs.setAttribute('d', source.getAttribute('d')!);
			ready = true;
			if (t < 1) raf = requestAnimationFrame(frame);
			else glyphs.setAttribute('d', d);
		};
		raf = requestAnimationFrame(frame);
		return () => cancelAnimationFrame(raf);
	});
</script>

<!--
	"MANITEJ BOORGU", outlined. The stroke sits outside the letters only: the mask hides its
	inner half. The mask's rect is generous so the letters show wherever the slide puts them.
-->
<svg
	{width}
	{height}
	viewBox="0 0 {width} {height}"
	fill="none"
	overflow="visible"
	aria-hidden="true"
	class:ready
>
	<defs>
		<path id="name-warp-glyphs" {d} bind:this={glyphs} />
		<mask id="name-warp-outside" maskUnits="userSpaceOnUse" x="-200" y="-400" width="2600" height="1400">
			<rect x="-200" y="-400" width="2600" height="1400" fill="white" />
			<use href="#name-warp-glyphs" fill="black" />
		</mask>
	</defs>
	<use href="#name-warp-glyphs" stroke="currentColor" stroke-width="3" mask="url(#name-warp-outside)" />
</svg>

<style>
	:global(html.js) svg:not(.ready) {
		visibility: hidden;
	}
</style>
