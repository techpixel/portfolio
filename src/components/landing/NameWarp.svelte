<script lang="ts">
	import { onMount } from 'svelte';
	import { prefersReducedMotion, Spring } from 'svelte/motion';
	// @ts-expect-error warpjs ships no types
	import Warp from 'warpjs';
	import svg from '../../assets/landing/name-warp.svg?raw';
	import { cubicBezier } from '../../lib/easing';

	// The glyph outlines and the box they were drawn in, read from the asset so it stays the source.
	const d = /<path id="name-warp-glyphs" d="([^"]+)"/.exec(svg)![1];
	const [, width, height] = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg)!;

	/*
	 * The mark is flat text warped by its baseline curve, drawn in Figma over it ("Vector 54":
	 * a dip under "ITEJ", a crest at "RG", easing down again at the right): every column of
	 * the text is moved straight down onto the curve, so stems stay vertical and letters shear
	 * where the curve slopes. Each point of the mark is described by its x and its height
	 * straight above the curve, so the letters can be slid along x, riding the curve, and set
	 * back down exactly where they were. Past either end the curve runs on along its end
	 * slope, which on the right is where the intro's letters come in from.
	 */
	type Point = [number, number];
	type Segment = [Point, Point, Point, Point];
	/** Cubic segments drawn in Figma, moved into the mark's coordinates. */
	const placed = (segments: number[][][], dx: number, dy: number) =>
		segments.map((seg) => seg.map(([x, y]) => [x + dx, y + dy] as Point) as Segment);
	/** The resting curve, "Vector 54": three segments in its drawing's box, which sits at 1.5, 66 in the mark's. */
	const REST = placed(
		[
			[[0.506295, 39.7453], [11.9873, 46.4858], [58.1082, 78.9256], [183.289, 79.9999]],
			[[183.289, 79.9999], [308.47, 81.0742], [523.006, 1.00001], [639.874, 1]],
			[[639.874, 1], [756.743, 0.99999], [822.006, 33.4836], [841.506, 40.7313]],
		],
		1.5,
		66,
	);
	/*
	 * The stretch spline, "Vector 55": the resting curve carried 59px to the left and given a
	 * first segment there, where the dip's wall climbs on to the crest's height. Placed so its
	 * right end meets the resting curve's, which is where the mark is pinned.
	 */
	const STRETCH = placed(
		[
			[[0.560053, 1.00006], [0.560053, 1.00006], [47.56, 32.8171], [59.5601, 39.7453]],
			[[59.5601, 39.7453], [71.5601, 46.6735], [117.162, 78.9256], [242.343, 79.9999]],
			[[242.343, 79.9999], [367.524, 81.0742], [582.06, 1.00001], [698.928, 1]],
			[[698.928, 1], [815.796, 0.99999], [881.06, 33.4836], [900.56, 40.7313]],
		],
		1.5 + 841.506 - 900.56,
		66,
	);
	/** The resting curve with a zero-length first segment, so it blends with the stretch spline segment for segment. */
	const REST_BLENDABLE: Segment[] = [[REST[0][0], REST[0][0], REST[0][0], REST[0][0]], ...REST];
	/** Samples per segment. The curves are gentle, so this keeps the polylines within a fraction of a pixel. */
	const SAMPLES = 160;

	/** How far right, in px, the slide starts: past the far end, so the first letter is out of view. */
	const SLIDE_FROM = 900;
	const DURATION = 1200;
	/** A long ease-out, the dot sweep's curve: fast in, then a glide to rest with no halt. */
	const ease = cubicBezier([0.25, 1, 0.5, 1]);
	/** Outline segments longer than this many px are subdivided, so they bend rather than stay rigid. */
	const INTERPOLATE = 8;

	/** A curve as y over x: its sampled points, x increasing, since each runs left to right. */
	function sampleCurve(segments: Segment[]) {
		const xs: number[] = [];
		const ys: number[] = [];
		for (const [p0, p1, p2, p3] of segments) {
			for (let i = 0; i < SAMPLES; i++) {
				const t = i / SAMPLES;
				const u = 1 - t;
				xs.push(u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0]);
				ys.push(u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]);
			}
		}
		xs.push(segments[segments.length - 1][3][0]);
		ys.push(segments[segments.length - 1][3][1]);
		return { xs, ys };
	}
	type Curve = ReturnType<typeof sampleCurve>;
	const rest = sampleCurve(REST);
	const stretched = sampleCurve(STRETCH);
	/** The right end, where the mark is pinned, and the two curves' widths. Their ratio is how much wider the mark gets. */
	const RIGHT = rest.xs[rest.xs.length - 1];
	const WIDTH = RIGHT - rest.xs[0];
	const STRETCHED_WIDTH = RIGHT - stretched.xs[0];

	/** The curve `q` of the way from rest to stretched: the blend of the two curves' control points. */
	function curveAt(q: number): Curve {
		if (q <= 0) return rest;
		if (q >= 1) return stretched;
		return sampleCurve(
			REST_BLENDABLE.map(
				(seg, i) => seg.map(([x, y], j) => [x + (STRETCH[i][j][0] - x) * q, y + (STRETCH[i][j][1] - y) * q] as Point) as Segment,
			),
		);
	}

	/** The curve's height at `x`, continuing along its end slope past either end. */
	function heightAt({ xs, ys }: Curve, x: number): number {
		const last = xs.length - 1;
		let lo = 0;
		let hi = last;
		if (x <= xs[0]) hi = 1;
		else if (x >= xs[last]) lo = last - 1;
		else {
			while (hi - lo > 1) {
				const mid = (lo + hi) >> 1;
				if (xs[mid] <= x) lo = mid;
				else hi = mid;
			}
		}
		return ys[lo] + ((x - xs[lo]) * (ys[hi] - ys[lo])) / (xs[hi] - xs[lo]);
	}

	let glyphs: SVGPathElement;
	// Hidden until the first animated frame, so the finished mark never flashes before it
	// slides in. Only when scripts run: without them the finished mark simply shows.
	let ready = $state(false);

	/*
	 * Hovering stretches the letters onto the stretch spline: the mark is warped by it as it
	 * was by the resting curve, so it grows leftward with its right end in place and the "M"
	 * rides up the new wall. Every point goes as much further from the right end as the curve
	 * is wider and keeps its height above the curve, so each letter gets wider and no shorter.
	 * The stretch spline's left end is drawn at the crest's height, so the "M" arrives with
	 * its top on the page's top edge, as the crest's letters already are; shortening the
	 * letters would drop it below. The letters run OVERRUN px past the spline's start, on
	 * along its slope, which is what it takes for the "M"'s top corner, a little in from its
	 * left edge, to meet the edge exactly. The amount is a spring: damped to a standstill
	 * going in, so the stretch lands without a bounce past the edge, and loose on release, so
	 * the letters overshoot past rest, drawn in narrower for a beat.
	 */
	// TEMP: the hover is switched off for now. Set true to bring the squash back.
	const HOVER = false;
	const OVERRUN = 3.9;
	const PRESS_DAMPING = 0.9;
	const RELEASE_DAMPING = 0.45;
	const squash = new Spring(0, { stiffness: 0.2, damping: PRESS_DAMPING, precision: 0.001 });
	const press = () => {
		squash.damping = PRESS_DAMPING;
		squash.target = 1;
	};
	const release = () => {
		squash.damping = RELEASE_DAMPING;
		squash.target = 0;
	};
	/** Redraws the mark for the slide so far and a squash amount. Set once warpjs is up; absent under reduced motion, so hovering then does nothing. */
	let draw: ((q: number) => void) | undefined;
	$effect(() => {
		// Read first: with `draw` not yet set, `draw?.(squash.current)` would skip the read and never follow the spring.
		const q = squash.current;
		draw?.(q);
	});

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
		// Each point remembers its resting x and its height straight above the resting curve.
		warp.transform(([x, y]: number[]) => [x, y, x, y - heightAt(rest, x)]);
		const source = scratch.querySelector('path')!;
		/** The slide's eased progress, 0 to 1. */
		let t = 0;
		draw = (q) => {
			// At rest the path is the asset's own, not the polyline's reading of it.
			if (t >= 1 && q === 0) {
				glyphs.setAttribute('d', d);
				return;
			}
			const shift = SLIDE_FROM * (1 - t);
			const curve = curveAt(q);
			// Past rest on the rebound (q below 0) the curve is the resting one and the letters draw in toward its right end.
			const stretch = q > 0 ? (RIGHT - curve.xs[0] + OVERRUN * q) / WIDTH : 1 + ((STRETCHED_WIDTH + OVERRUN) / WIDTH - 1) * q;
			warp.transform(([, , x, h]: number[]) => {
				const X = RIGHT + (x - RIGHT) * stretch + shift;
				return [X, heightAt(curve, X) + h, x, h];
			});
			glyphs.setAttribute('d', source.getAttribute('d')!);
		};
		let raf = 0;
		let start = 0;
		const frame = (now: number) => {
			if (!start) start = now;
			t = ease(Math.min(1, (now - start) / DURATION));
			draw!(squash.current);
			ready = true;
			if (t < 1) raf = requestAnimationFrame(frame);
		};
		raf = requestAnimationFrame(frame);
		return () => {
			cancelAnimationFrame(raf);
			draw = undefined;
		};
	});
</script>

<!--
	"MANITEJ BOORGU", outlined. The stroke sits outside the letters only: the mask hides its
	inner half. The mask's rect is generous so the letters show wherever the slide puts them.
	The SVG's box is the hover target, so the squash doesn't flicker as the letters slide out
	from under the pointer.
-->
<svg
	{width}
	{height}
	viewBox="0 0 {width} {height}"
	fill="none"
	overflow="visible"
	aria-hidden="true"
	class:ready
	class:hoverable={HOVER}
	onmouseenter={HOVER ? press : undefined}
	onmouseleave={HOVER ? release : undefined}
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
	/* The art around the mark lets the pointer through; the mark takes it back for its squash. */
	svg.hoverable {
		pointer-events: auto;
	}
	:global(html.js) svg:not(.ready) {
		visibility: hidden;
	}
</style>
