<script lang="ts">
	import { onMount } from 'svelte';
	import { portraitOf, startPortrait, type Portrait } from '../../lib/portrait';

	interface Props {
		/** The photo, in full tone: it is dithered here, on the screen's own pixels. */
		portrait: string;
		/** The intro has set off (the loading screen lifted, see Landing.svelte): follow it from here. */
		intro?: boolean;
		/** Called once the photo is first drawn, for the loading screen to wait on. */
		onready?: () => void;
	}

	let { portrait, intro = false, onready }: Props = $props();

	const fade = 'transition-colors duration-320 ease-out motion-reduce:transition-none';

	/*
	 * The dithered look only holds when one cell of the pattern is one device pixel: a
	 * dithered image resampled to any other size turns to moiré, which is what the old 480px
	 * export did past 1440 wide, where the page zooms, and what a live dither did under the
	 * intro, which scales the column up to full size. So this box sits over the photo's place
	 * in the column (Bio.svelte's spacer, `data-portrait-place`) from outside the animated group
	 * (`data-intro`), where nothing transforms it, and its canvas, sized to the box in device
	 * pixels, draws the photo wherever the place is right now (smaller and shifted while the
	 * intro runs, at rest after) and dithers it there, on the spot, frame by frame while the
	 * intro runs and again whenever the box's size changes (the breakpoint, the page zoom, the
	 * screen's density). The box fades with the group.
	 *
	 * The drawing itself lives in src/lib/portrait.ts, because the page's own script starts it
	 * as soon as the page is parsed, long before this island's script arrives, so the photo is
	 * there from the intro's first frames. This component adopts that drawing when it mounts
	 * (or starts one, should the page script not have), reports its first draw, and cues it
	 * when the intro sets off.
	 */
	let box: HTMLDivElement;
	let drawing: Portrait | undefined;

	onMount(() => {
		drawing = portraitOf(box) ?? startPortrait(box);
		drawing?.drawn.then(() => onready?.());
		return () => drawing?.destroy();
	});
	// The intro setting off is a cue to follow it: the drawing only runs on while it does.
	$effect(() => {
		if (intro) drawing?.schedule();
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
<div bind:this={box} data-portrait class="absolute top-0 left-0 size-30 sm:size-40">
	<img src={portrait} alt="Manitej" width="160" height="160" class="size-full object-cover [.js_&]:opacity-0" />
	<canvas
		class="invisible absolute top-0 left-0 h-[calc(100%+12px)] w-[calc(100%+12px)] bg-black [image-rendering:pixelated] [.js_&]:visible"
		aria-hidden="true"
	></canvas>
	<!-- A wash over the photo: peach at rest, the hovered project's ink. -->
	<div class="absolute -right-3 -bottom-3 top-0 left-0 mix-blend-multiply {fade}" style:background-color="var(--c-tint)"></div>
</div>
