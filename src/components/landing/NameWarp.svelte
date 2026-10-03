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
	 * along x: the warp stays put and the flat "MANITEJ BOORGU" (Figma's un-warped variant)
	 * moves through it from the right, so the letters travel the arc and bend as they go, and
	 * settle exactly on the warped mark.
	 *
	 * The warp is a mean-value-coordinate cage (as the Figma Warp plugin and the old site's
	 * Warp.svelte use), fitted by least squares to carry the flat text onto the mark: FLAT_REST
	 * is a 24-point cage around the flat text's box (6 a side, 20px out) and WARP is where its
	 * points land (1.7px mean error). Past the text's right end the field runs on along each
	 * row's end tangent, which is the line the arc implies. The flat position of every point
	 * of the mark comes from the reverse fit, WARP_REST onto FLAT_FIT; what little that misses
	 * is blended back in as the slide completes, so the final frame is the Figma path itself.
	 */
	const FLAT_RIGHT = 882.000;
	const FLAT_REST: [number, number][] = [
		[-57, 18.002], [-57, 50.002], [-57, 62.002], [-57, 74.002], [-57, 86.002], [-57, 98.002],
		[-57, 130.002], [116.167, 130.002], [269.333, 130.002], [422.5, 130.002], [575.667, 130.002], [728.833, 130.002],
		[902, 130.002], [902, 98.002], [902, 86.002], [902, 74.002], [902, 62.002], [902, 50.002],
		[902, 18.002], [728.833, 18.002], [575.667, 18.002], [422.5, 18.002], [269.333, 18.002], [116.167, 18.002],
	];
	const WARP: [number, number][] = [
		[-16.677, 31.369], [-13.263, 9.636], [-20.008, 83.834], [-14.753, 40.107], [-16.009, 110.379], [-15.585, 51.517],
		[-18.137, 135.645], [144.921, 172.584], [282.138, 161.154], [420.213, 125.197], [558.786, 89.733], [701.932, 77.023],
		[865.392, 123.696], [869.104, 113.776], [856.658, 52.935], [843.127, 95.396], [896.736, 35.309], [846.258, 63.244],
		[855.795, 20.267], [704.236, -26.195], [565.981, -13.597], [425.673, 21.023], [282.245, 58.25], [140.305, 70.552],
	];
	const WARP_REST: [number, number][] = [
		[-18, -18], [-18, 26], [-18, 50], [-18, 74], [-18, 98], [-18, 122],
		[-18, 166], [142.17, 166], [282.33, 166], [422.5, 166], [562.67, 166], [702.83, 166],
		[863, 166], [863, 122], [863, 98], [863, 74], [863, 50], [863, 26],
		[863, -18], [702.83, -18], [562.67, -18], [422.5, -18], [282.33, -18], [142.17, -18],
	];
	const FLAT_FIT: [number, number][] = [
		[-57.69, -41.69], [-61.24, 51.05], [-61.18, 53.55], [-55.07, 91.2], [-68.9, 97.89], [-43.89, 164.08],
		[-60.17, 149.87], [113.44, 126.81], [269.65, 134.57], [424.03, 175.06], [591.7, 219.83], [728.99, 277.63],
		[894.97, 157.1], [901, 95.24], [890.98, 117.12], [919.76, 64.53], [879.14, 67.93], [944.94, -13.15],
		[901.65, -10.84], [727.95, 23.99], [571.69, 13.41], [415.66, -23.53], [268.6, -75.58], [123.35, -120.38],
	];

	/** How far right, in the flat text's own space, the slide starts: its width and a little. */
	const SLIDE_FROM = 940;
	const DURATION = 1200;
	/** A long ease-out, the dot sweep's curve: fast in, then a glide to rest with no halt. */
	const ease = cubicBezier([0.25, 1, 0.5, 1]);
	/** The end tangent is taken over this many px, past the fit's noisy last letter. */
	const TANGENT_SPAN = 40;
	/** Over this many px before the right end, the warp eases into its straight extension. */
	const BLEND = 160;
	/** Outline segments longer than this many px are subdivided, so they bend rather than stay rigid. */
	const INTERPOLATE = 8;

	/** Mean-value coordinates of `p` with respect to the polygon `V` (Floater 2003). */
	function meanValue([x, y]: number[], V: [number, number][]) {
		const n = V.length;
		const angles: number[] = [];
		for (let i = 0; i < n; i++) {
			const j = (i + 1) % n;
			const ri = Math.hypot(x - V[i][0], y - V[i][1]);
			const rj = Math.hypot(x - V[j][0], y - V[j][1]);
			const rij = Math.hypot(V[i][0] - V[j][0], V[i][1] - V[j][1]);
			const c = (ri * ri + rj * rj - rij * rij) / (2 * ri * rj);
			angles[i] = Number.isNaN(c) ? 0 : Math.acos(Math.max(-1, Math.min(1, c)));
		}
		const w: number[] = [];
		let sum = 0;
		for (let j = 0; j < n; j++) {
			const i = (j + n - 1) % n;
			w[j] = (Math.tan(angles[i] / 2) + Math.tan(angles[j] / 2)) / Math.hypot(V[j][0] - x, V[j][1] - y);
			sum += w[j];
		}
		return w.map((v) => v / sum);
	}

	let glyphs: SVGPathElement;
	// Hidden until the first animated frame, so the finished mark never flashes before it
	// worms in. Only when scripts run: without them the finished mark simply shows.
	let ready = $state(false);

	/** Where the fitted warp puts a point of the flat text. */
	function cageWarp(p: number[]) {
		const L = meanValue(p, FLAT_REST);
		let x = 0;
		let y = 0;
		for (let i = 0; i < L.length; i++) {
			x += L[i] * WARP[i][0];
			y += L[i] * WARP[i][1];
		}
		return [x, y];
	}

	/** The straight continuation of a row past the right end, from its end point and a point TANGENT_SPAN back. */
	function lineAt(x: number, end: number[], back: number[]) {
		const over = (x - FLAT_RIGHT) / TANGENT_SPAN;
		return [end[0] + (end[0] - back[0]) * over, end[1] + (end[1] - back[1]) * over];
	}

	/**
	 * The field the text slides through: the cage warp, carried on past the right end along
	 * each row's end tangent, the line the arc implies. The two are cross-faded over the last
	 * BLEND px with a smoothstep, so letters bend into the warp without a kink. `end` and
	 * `back` are the row's tangent points, cached per point since they depend only on its y.
	 */
	function field(x: number, y: number, end: number[], back: number[]) {
		const inner = FLAT_RIGHT - BLEND;
		if (x <= inner) return cageWarp([x, y]);
		const line = lineAt(x, end, back);
		if (x >= FLAT_RIGHT) return line;
		const u = (x - inner) / BLEND;
		const w = u * u * (3 - 2 * u);
		const bent = cageWarp([x, y]);
		return [bent[0] + (line[0] - bent[0]) * w, bent[1] + (line[1] - bent[1]) * w];
	}

	onMount(() => {
		if (prefersReducedMotion.current) {
			ready = true;
			return;
		}
		// warpjs works on its own copy of the glyphs; each frame's result is copied across, so
		// the mask and the rest of the SVG stay out of its hands.
		const scratch = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		scratch.innerHTML = `<path d="${d}"/>`;
		const warp = new Warp(scratch, 'c');
		warp.interpolate(INTERPOLATE);
		// Each point remembers its flat position, its row's tangent points, and the small
		// correction that lands it exactly.
		warp.transform(([x, y]: number[]) => {
			const L = meanValue([x, y], WARP_REST);
			let fx = 0;
			let fy = 0;
			for (let i = 0; i < L.length; i++) {
				fx += L[i] * FLAT_FIT[i][0];
				fy += L[i] * FLAT_FIT[i][1];
			}
			const end = cageWarp([FLAT_RIGHT, fy]);
			const back = cageWarp([FLAT_RIGHT - TANGENT_SPAN, fy]);
			const home = field(fx, fy, end, back);
			return [x, y, fx, fy, x - home[0], y - home[1], end[0], end[1], back[0], back[1]];
		});
		const source = scratch.querySelector('path')!;
		let raf = 0;
		let start = 0;
		const frame = (now: number) => {
			if (!start) start = now;
			const t = ease(Math.min(1, (now - start) / DURATION));
			const shift = SLIDE_FROM * (1 - t);
			warp.transform(([, , fx, fy, cx, cy, ex, ey, bx, by]: number[]) => {
				const [x, y] = field(fx + shift, fy, [ex, ey], [bx, by]);
				return [x + cx * t, y + cy * t, fx, fy, cx, cy, ex, ey, bx, by];
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
