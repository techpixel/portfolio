<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { prefersReducedMotion, Tween } from 'svelte/motion';
	import type { Project } from '../../data/work';
	import { familjenGrotesk700 } from '../../lib/glyphkit';
	import Arrow from './Arrow.svelte';
	import Mascot from './Mascot.svelte';
	import StretchWord, { ascent, inkWidth, stretchToFit } from './StretchWord.svelte';

	interface Props {
		project: Project;
		active: boolean;
		emblem: { hq: string; lq: string };
		onactivate: () => void;
		ondeactivate: () => void;
		onpin: () => void;
	}

	let { project, active, emblem, onactivate, ondeactivate, onpin }: Props = $props();

	const DURATION = 320;
	const font = familjenGrotesk700;

	// The resting name is Familjen Grotesk Regular at 24px, line-height normal: caps 650/1000 em
	// tall, the baseline 1025/1000 em down. The wordmark is the same face in bold, stretched,
	// set to the same cap height on the same baseline, so the swap holds the letters' top and
	// bottom and only their width changes.
	const REST_SIZE = 24;
	const CAP = REST_SIZE * (font.capHeight / font.em);
	const REST_BASELINE = REST_SIZE * (font.ascender / font.em);
	// One stretch for every wordmark, so the letterforms match from row to row and only the
	// width follows the word. Sets "Midnight" 141px wide, as in Figma.
	const WORDMARK_STRETCH = 1.485;
	// The arrow's strokes thicken with the letters: 2.2px at rest, 2.75px beside the wordmark.
	const ARROW_WEIGHT = [2.2, 2.75] as const;

	// Progress through the stretch, eased out. An interrupted hover heads back from wherever
	// it was.
	const progress = new Tween(0, { easing: cubicOut });
	// The crossfade from the text to the wordmark runs on its own short clock, so the moment
	// both are visible is brief.
	const fade = new Tween(0);

	/** Below this much progress the wordmark is still the resting name's shape. */
	const STRETCH_START = 0.2;
	const FADE_IN = 45;

	// Measured once the fonts are in, in CSS pixels, so page zoom on large screens doesn't
	// skew the fit: the resting name's ink in regular and in bold, the finished wordmark's,
	// and the air either side of the regular's ink. The wordmark starts at the regular ink's
	// width, so nothing beside it moves on the swap.
	let inkLeft = $state(0);
	let trailing = $state(0);
	let restInk = $state(0);
	let boldInk = $state(0);
	let markInk = $state(0);
	let startStretch = $state(1);

	onMount(() => {
		const faces = [`400 ${REST_SIZE}px "Familjen Grotesk"`, `700 ${REST_SIZE}px "Familjen Grotesk"`];
		Promise.all(faces.map((face) => document.fonts.load(face))).then(() => {
			const ctx = document.createElement('canvas').getContext('2d');
			if (!ctx) return;
			ctx.font = faces[0];
			const rest = ctx.measureText(project.name);
			inkLeft = -rest.actualBoundingBoxLeft;
			restInk = rest.actualBoundingBoxRight + rest.actualBoundingBoxLeft;
			trailing = rest.width - inkLeft - restInk;
			ctx.font = faces[1];
			const bold = ctx.measureText(project.name);
			boldInk = bold.actualBoundingBoxRight + bold.actualBoundingBoxLeft;
			startStretch = stretchToFit(font, project.name, CAP, restInk);
			markInk = inkWidth(font, project.name, CAP, WORDMARK_STRETCH);
		});
	});

	$effect(() => {
		const isActive = active;
		untrack(() => {
			const reduced = prefersReducedMotion.current;
			if (isActive) {
				progress.set(1, { duration: reduced ? 0 : DURATION * (1 - progress.current) });
				fade.set(1, { duration: reduced ? 0 : FADE_IN });
			} else {
				// Leaving swaps straight to the text, set as wide and bold as the wordmark, and
				// eases that back to rest. Crossfading in reverse is easier to catch than going in.
				progress.set(0, { duration: reduced ? 0 : DURATION * progress.current });
				fade.set(0, { duration: 0 });
			}
		});
	});

	const clamp = (x: number) => Math.min(1, Math.max(0, x));
	// Two phases in. The name thickens and crossfades into the wordmark, fitted to the same
	// width, so the swap reads as one word gaining weight; then the wordmark stretches out once
	// progress passes STRETCH_START. Leaving has no crossfade, so it spends all of its progress
	// shrinking.
	const stretchT = $derived(
		active ? clamp((progress.current - STRETCH_START) / (1 - STRETCH_START)) : progress.current,
	);
	const mix = (from: number, to: number) => from + (to - from) * stretchT;

	const animating = $derived(progress.current > 0 || fade.current > 0);
	const leaving = $derived(!active && progress.current > 0);
	// How bold the letters and the arrow are: following the crossfade in, the shrink out.
	const weightT = $derived(leaving ? stretchT : fade.current);

	const stretch = $derived(mix(startStretch, WORDMARK_STRETCH));
	// The name's ink width right now: the wordmark's while entering; while leaving, the bold
	// text's, scaled to meet the regular's.
	const ink = $derived(leaving ? mix(restInk, markInk) : inkWidth(font, project.name, CAP, stretch));
	const leavingScale = $derived(boldInk ? ink / mix(restInk, boldInk) : 1);

	const colorFade = 'transition-colors duration-320 ease-out motion-reduce:transition-none';
</script>

<!--
	No stacking context of its own, so the highlight (negative z) falls behind everything in the
	column, the bio included. The bar and the mascot fade as one layer: the bar is painted over
	the mascot inside it, so nothing shows through while they fade. The bar reaches 6px into
	the gap below the row, so the fill reads as more than a hairline around the type.
-->
<li class="relative">
	<div
		class="pointer-events-none absolute inset-x-0 top-0 -bottom-1.5 -z-10 transition-opacity duration-320 ease-out motion-reduce:transition-none {active
			? 'opacity-100'
			: 'opacity-0'}"
	>
		<Mascot {emblem} />
		<div class="absolute inset-0" style:background-color={project.theme.bar}></div>
	</div>

	<a
		href="/work/{project.slug}"
		data-astro-prefetch
		class="flex h-[30px] items-baseline gap-[10px] font-display text-2xl leading-[normal] whitespace-nowrap {colorFade}"
		style:color={active ? project.theme.onBar : '#ffffff'}
		onmouseenter={onactivate}
		onfocus={onactivate}
		onblur={ondeactivate}
		onclick={(event) => {
			// TEMP (debugging): Alt+click pins the hover state instead of navigating.
			if (event.altKey) {
				event.preventDefault();
				onpin();
			}
		}}
	>
		<span class="relative flex items-baseline gap-[6px]">
			<!--
				The text stays in flow so the row keeps its baseline; the wordmark is drawn over it.
				While animating the box is sized to the ink, so the arrow follows the stretch.
			-->
			<span class="relative block" style:width={animating ? `${inkLeft + ink + trailing}px` : null}>
				<span
					class="block origin-left"
					style:font-weight={400 + 300 * weightT}
					style:opacity={1 - fade.current}
					style:transform={leaving ? `scaleX(${leavingScale})` : null}
					aria-hidden={fade.current > 0}>{project.name}</span
				>
				{#if fade.current > 0}
					<StretchWord
						text={project.name}
						{font}
						size={CAP}
						{stretch}
						class="absolute"
						style="top: {REST_BASELINE - ascent(font, CAP)}px; left: {inkLeft}px; opacity: {fade.current}"
					/>
				{/if}
			</span>
			<Arrow weight={ARROW_WEIGHT[0] + (ARROW_WEIGHT[1] - ARROW_WEIGHT[0]) * weightT} />
			<!-- A dashed rule under the name and arrow (Figma "Vector 49": 2px, dashed 2 on 4 off). It follows the wordmark's width and colour on hover. -->
			<span class="dashes pointer-events-none absolute inset-x-0 -bottom-px h-0.5"></span>
		</span>
		<span
			class="font-sans text-xs leading-[normal] transition-opacity duration-320 ease-out motion-reduce:transition-none max-sm:hidden"
			style:opacity={progress.current}
			aria-hidden={!active}>{project.description}</span
		>
	</a>
</li>

<style>
	.dashes {
		background-image: repeating-linear-gradient(90deg, currentColor 0 2px, transparent 2px 6px);
	}
</style>
