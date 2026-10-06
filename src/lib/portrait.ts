import { ditherBayer } from './dither';

/*
 * The portrait: the photo drawn dithered onto a canvas sized to the screen's own pixels,
 * wherever its place in the column is right now (Portrait.svelte explains why it is drawn
 * this way). It is started by the landing's own page script as soon as the page is parsed,
 * well before the island's script arrives, so the photo is there from the intro's first
 * frames; Portrait.svelte then adopts it, from the box's `portrait` property, and cues it
 * when the intro sets off. The parts are found by attribute: the box `[data-portrait]` with
 * its image and canvas, the photo's place in the column `[data-portrait-place]`, and the
 * column's animated group `[data-intro]`.
 */

export interface Portrait {
	/** Draws at the next frame, and goes on frame by frame while the group's intro runs. */
	schedule(): void;
	/** Settles once the photo has first been drawn. */
	drawn: Promise<void>;
	destroy(): void;
}

type Box = HTMLElement & { portrait?: Portrait };

/** The box's running portrait, if the page script has started one. */
export const portraitOf = (box: HTMLElement): Portrait | undefined => (box as Box).portrait;

/** Starts the page's portrait, if its parts are there. */
export function startPagePortrait(): Portrait | undefined {
	const box = document.querySelector<HTMLElement>('[data-portrait]');
	return box ? startPortrait(box) : undefined;
}

export function startPortrait(box: HTMLElement): Portrait | undefined {
	const img = box.querySelector('img');
	const canvas = box.querySelector('canvas');
	const place = document.querySelector<HTMLElement>('[data-portrait-place]') ?? box;
	const group = document.querySelector<HTMLElement>('[data-intro]');
	const ctx = canvas?.getContext('2d', { willReadFrequently: true });
	if (!img || !canvas || !ctx) return;

	/** The canvas in device pixels. */
	let width = 0;
	let height = 0;
	let frame = 0;
	let resolveDrawn: () => void;
	const drawn = new Promise<void>((resolve) => (resolveDrawn = resolve));
	let isDrawn = false;

	/** Draws the photo, dithered, where its place in the column is right now. */
	const draw = () => {
		if (!width || !height || !img.complete || !img.naturalWidth) return;
		const where = place.getBoundingClientRect();
		const own = canvas.getBoundingClientRect();
		// Device pixels per unit of the rects, whatever space they are in.
		const k = width / own.width;
		const x = Math.round((where.left - own.left) * k);
		const y = Math.round((where.top - own.top) * k);
		const w = Math.round(where.width * k);
		const h = Math.round(where.height * k);
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
		if (!isDrawn) {
			isDrawn = true;
			resolveDrawn();
		}
	};

	/*
	 * A frame: draw, and follow the group's intro. Held at its first frame under the loading
	 * screen (Landing.svelte), the group is at nothing, and so is the box; once the intro runs
	 * the box fades in with it, coming back each frame until it is done.
	 */
	const tick = () => {
		frame = 0;
		draw();
		const animations = group?.getAnimations() ?? [];
		box.style.opacity = animations.length && group ? getComputedStyle(group).opacity : '';
		if (animations.some((animation) => animation.playState === 'running')) frame = requestAnimationFrame(tick);
	};
	const schedule = () => {
		if (!frame) frame = requestAnimationFrame(tick);
	};

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

	const portrait: Portrait = {
		schedule,
		drawn,
		destroy() {
			observer.disconnect();
			removeEventListener('resize', remeasure);
			img.removeEventListener('load', schedule);
			cancelAnimationFrame(frame);
			delete (box as Box).portrait;
		},
	};
	(box as Box).portrait = portrait;
	return portrait;
}
