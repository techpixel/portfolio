<script lang="ts">
	import { onMount } from 'svelte';
	import { ditherBayer } from '../../lib/dither';

	interface Props {
		/** The photo, in full tone: it is dithered here, on the screen's own pixels. */
		portrait: string;
		/** The photo's place in the column: an empty box its size, which the column's intro scales along with the rest. */
		spacer?: HTMLElement;
		/** The column's animated group, whose intro (scale and opacity) the photo follows frame by frame. */
		group?: HTMLElement;
	}

	let { portrait, spacer, group }: Props = $props();

	const fade = 'transition-colors duration-320 ease-out motion-reduce:transition-none';

	/*
	 * The dithered look only holds when one cell of the pattern is one device pixel: a
	 * dithered image resampled to any other size turns to moiré, which is what the old 480px
	 * export did past 1440 wide, where the page zooms, and what a live dither did under the
	 * intro, which scales the column up to full size. So this box sits over the photo's place
	 * in the column from outside the animated group, where nothing transforms it, and its
	 * canvas, sized to the box in device pixels, draws the photo wherever the place is right
	 * now (smaller and shifted while the intro runs, at rest after) and dithers it there, on
	 * the spot, frame by frame while the intro runs and again whenever the box's size changes
	 * (the breakpoint, the page zoom, the screen's density). The box fades with the group.
	 */
	let box: HTMLDivElement;
	let img: HTMLImageElement;
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	/** The canvas in device pixels. */
	let width = 0;
	let height = 0;
	let frame = 0;

	/** Draws the photo, dithered, where its place in the column is right now. */
	const draw = () => {
		if (!ctx || !width || !height || !img.complete || !img.naturalWidth) return;
		const place = (spacer ?? box).getBoundingClientRect();
		const own = canvas.getBoundingClientRect();
		// Device pixels per unit of the rects, whatever space they are in.
		const k = width / own.width;
		const x = Math.round((place.left - own.left) * k);
		const y = Math.round((place.top - own.top) * k);
		const w = Math.round(place.width * k);
		const h = Math.round(place.height * k);
		if (!w || !h) return;
		canvas.width = width;
		canvas.height = height;
		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = 'high';
		// The photo covers its place, as object-fit: cover does for the image beneath.
		const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
		const iw = img.naturalWidth * scale;
		const ih = img.naturalHeight * scale;
		ctx.save();
		ctx.beginPath();
		ctx.rect(x, y, w, h);
		ctx.clip();
		ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
		ctx.restore();
		const pixels = ctx.getImageData(x, y, w, h);
		ditherBayer(pixels, { origin: { x, y } });
		ctx.putImageData(pixels, x, y);
	};

	/** A frame: draw, and while the group's intro runs, fade with it and come back next frame. */
	const tick = () => {
		frame = 0;
		draw();
		const running = (group?.getAnimations().length ?? 0) > 0;
		box.style.opacity = running && group ? getComputedStyle(group).opacity : '';
		if (running) frame = requestAnimationFrame(tick);
	};
	const schedule = () => {
		if (!frame) frame = requestAnimationFrame(tick);
	};

	onMount(() => {
		ctx = canvas.getContext('2d', { willReadFrequently: true });
		if (!ctx) return;

		// The canvas in device pixels: exactly, where the observer reports them (Chrome, Firefox);
		// otherwise from its CSS size, the zoom in effect on it and the screen's pixel ratio.
		const measure = (entry?: ResizeObserverEntry) => {
			const exact = entry?.devicePixelContentBoxSize?.[0];
			if (exact) {
				width = exact.inlineSize;
				height = exact.blockSize;
				return;
			}
			const zoom =
				(canvas as { currentCSSZoom?: number }).currentCSSZoom ??
				(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--page-zoom')) || 1);
			width = Math.round(canvas.clientWidth * zoom * devicePixelRatio);
			height = Math.round(canvas.clientHeight * zoom * devicePixelRatio);
		};
		// Measured by hand, the zoom and the pixel ratio can change with no change to the CSS
		// box, so the window's resize (where the page sets its zoom) is watched as well.
		const remeasure = () => {
			measure();
			schedule();
		};
		let byHand = false;
		const observer = new ResizeObserver(([entry]) => {
			if (!byHand && !entry.devicePixelContentBoxSize?.[0]) {
				byHand = true;
				addEventListener('resize', remeasure);
			}
			measure(entry);
			schedule();
		});
		try {
			observer.observe(canvas, { box: 'device-pixel-content-box' });
		} catch {
			observer.observe(canvas);
		}
		img.addEventListener('load', schedule);

		return () => {
			observer.disconnect();
			removeEventListener('resize', remeasure);
			img.removeEventListener('load', schedule);
			cancelAnimationFrame(frame);
		};
	});
</script>

<!--
	The box is the photo's place at rest; the canvas and the wash run 12px past it to the right
	and bottom, where the intro's scaling (95%, about the column's centre) pushes the photo by
	up to about 7px. The canvas is black where no photo is drawn (and all over until the first
	draw), so the wash, which multiplies with what is under it within the column's stacking
	context, always has black to multiply with there and shows nothing of its own.

	With JavaScript (html.js, set in the head) the canvas is the photo from first paint and the
	image only feeds it; without, the image is the photo and the canvas stays hidden. Both are
	switched by utilities, which land in the global stylesheet, where a component style would
	not until the component's code arrives in dev. The image is hidden by opacity, so it stays
	the photo for assistive tech.
-->
<div bind:this={box} class="absolute top-0 left-0 size-30 sm:size-40">
	<img bind:this={img} src={portrait} alt="Manitej" width="160" height="160" class="size-full object-cover [.js_&]:opacity-0" />
	<canvas
		bind:this={canvas}
		class="invisible absolute top-0 left-0 h-[calc(100%+12px)] w-[calc(100%+12px)] bg-black [image-rendering:pixelated] [.js_&]:visible"
		aria-hidden="true"
	></canvas>
	<!-- A wash over the photo: peach at rest, the hovered project's ink. -->
	<div class="absolute -right-3 -bottom-3 top-0 left-0 mix-blend-multiply {fade}" style:background-color="var(--c-tint)"></div>
</div>
