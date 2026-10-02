<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { prefersReducedMotion, Tween } from 'svelte/motion';
	import type { Project } from '../data/work';
	import { familjenGrotesk700 } from '../lib/glyphkit';
	import ProjectMascot from './ProjectMascot.svelte';
	import StretchWord, { ascent, inkWidth, stretchToFit } from './StretchWord.svelte';
	import Tag from './Tag.svelte';

	interface Props {
		project: Project;
		active: boolean;
		horizonsFerret: string;
		onactivate: () => void;
		ondeactivate: () => void;
		onpin: () => void;
	}

	let { project, active, horizonsFerret, onactivate, ondeactivate, onpin }: Props = $props();

	const DURATION = 320;
	const font = familjenGrotesk700;

	// The resting name is Schibsted Grotesk Italic at 32px: cap height 1440/2048 em,
	// ascent 2000/2048 em, leaning 12°. The wordmark takes over from exactly there.
	const RESTING_SIZE = 32 * (1440 / 2048);
	const RESTING_BASELINE = 32 * (2000 / 2048);
	const RESTING_SLANT = 12;

	// Every wordmark shares one cap height and one stretch, so the letterforms match
	// from row to row and only the width follows the word. It sits on the resting
	// name's baseline, which centres its caps in the row.
	const WORDMARK_SIZE = 22;
	const WORDMARK_STRETCH = 1.15;

	// Progress through the stretch, eased out. An interrupted hover heads back from
	// wherever it was.
	const progress = new Tween(0, { easing: cubicOut });
	// The crossfade between the italic name and the wordmark runs on its own short clock,
	// so the moment both are visible is brief.
	const fade = new Tween(0);

	/** Below this much progress the wordmark is still the italic name's shape. */
	const STRETCH_START = 0.2;
	const FADE_IN = 45;

	let nameEl: HTMLElement;
	// The wordmark starts at the italic name's width, so nothing beside it moves on the
	// swap. Fitting it warps the word several times, so do it up front, once the italic
	// face has loaded, rather than on the first frame of a hover.
	let startStretch = $state(1);
	// Widths of the name at rest, in bold italic, and as the finished wordmark, which
	// the Schibsted-only hover-out scales between.
	let restWidth = $state(0);
	let boldWidth = $state(0);
	let markWidth = $state(0);

	onMount(() => {
		document.fonts.ready.then(() => {
			restWidth = nameEl.getBoundingClientRect().width;
			startStretch = stretchToFit(font, project.name, RESTING_SIZE, restWidth);
			markWidth = inkWidth(font, project.name, WORDMARK_SIZE, WORDMARK_STRETCH);
			const ctx = document.createElement('canvas').getContext('2d');
			if (ctx) {
				ctx.font = `italic 700 32px "Schibsted Grotesk"`;
				boldWidth = ctx.measureText(project.name).width;
			}
		});
	});

	$effect(() => {
		const isActive = active;
		untrack(() => {
			if (isActive) {
				const reduced = prefersReducedMotion.current;
				progress.set(1, { duration: reduced ? 0 : DURATION * (1 - progress.current) });
				fade.set(1, { duration: reduced ? 0 : FADE_IN });
			} else {
				// Leaving swaps straight to the Schibsted name, set as wide and bold as the
				// wordmark, and eases that back to rest. Crossfading the two faces in reverse
				// is easier to catch than it is going in.
				const reduced = prefersReducedMotion.current;
				progress.set(0, { duration: reduced ? 0 : DURATION * progress.current });
				fade.set(0, { duration: 0 });
			}
		});
	});

	const clamp = (x: number) => Math.min(1, Math.max(0, x));
	// Two phases. The italic name thickens and crossfades into the wordmark, set to the
	// same size, lean, width and baseline, so the swap reads as one word gaining weight.
	// The wordmark stretches out once progress passes STRETCH_START.
	// Leaving has no crossfade phase, so it spends the whole of its progress shrinking.
	const stretchT = $derived(
		active ? clamp((progress.current - STRETCH_START) / (1 - STRETCH_START)) : progress.current,
	);
	const lerp = (from: number, to: number) => from + (to - from) * stretchT;

	// Colours fade both ways over the hover's duration.
	const colorFade = 'transition-colors duration-320 ease-out';

	const animating = $derived(progress.current > 0 || fade.current > 0);
	const leaving = $derived(!active && progress.current > 0);

	// While leaving: the name's width, weight and horizontal scale at this point, going
	// from the wordmark's width in bold back to the resting italic.
	const mix = (from: number, to: number) => from + (to - from) * stretchT;
	const leavingWidth = $derived(mix(restWidth, markWidth));
	const leavingScale = $derived(boldWidth ? leavingWidth / mix(restWidth, boldWidth) : 1);
	const size = $derived(lerp(RESTING_SIZE, WORDMARK_SIZE));
	const gap = $derived(lerp(10, 12));
</script>

<li class="relative isolate">
	<!--
		The bar and the mascot rising out of it fade together. The wrapper spans the bar,
		raised 100px for the mascot. Explicit top/bottom: Chrome sizes it 24px short with
		-inset-y here.
	-->
	<div
		class="pointer-events-none absolute -top-[104px] right-0 -bottom-1 -left-6 -z-10 transition-opacity duration-320 ease-out {active
			? 'opacity-100'
			: 'opacity-0'}"
	>
		<div class="absolute inset-x-0 top-[100px] bottom-0 {project.accent.bar}"></div>
		<ProjectMascot slug={project.slug} {horizonsFerret} />
	</div>

	<a
		href="/work/{project.slug}"
		class="flex min-h-10 cursor-pointer flex-wrap items-center py-2 text-left leading-[normal]"
		style:column-gap="{gap}px"
		onmouseenter={onactivate}
		onfocus={onactivate}
		onclick={(event) => {
			// TEMP (debugging): Alt+click pins the hover state instead of navigating.
			if (event.altKey) {
				event.preventDefault();
				onpin();
			}
		}}
		onblur={ondeactivate}
	>
		<span class="relative block h-10 shrink-0" style:width={leaving ? `${leavingWidth}px` : null}>
			<span
				bind:this={nameEl}
				class="block origin-left text-[32px] whitespace-nowrap italic {colorFade} {animating
					? 'absolute top-0 left-0'
					: ''} {active ? project.accent.text : ''}"
				style:opacity={1 - fade.current}
				style:font-weight={400 + 300 * (leaving ? stretchT : fade.current)}
				style:transform={leaving ? `scaleX(${leavingScale})` : null}
				aria-hidden={fade.current > 0}>{project.name}</span
			>
			{#if fade.current > 0}
				<StretchWord
					text={project.name}
					{font}
					{size}
					stretch={lerp(startStretch, WORDMARK_STRETCH)}
					slant={lerp(RESTING_SLANT, 0)}
					class="{colorFade} {active ? project.accent.text : ''}"
					style="margin-top: {RESTING_BASELINE - ascent(font, size)}px; opacity: {fade.current}"
				/>
			{/if}
		</span>
		<span
			class="flex flex-wrap items-center pt-1 {colorFade} {active ? project.accent.text : ''}"
			style:column-gap="{gap}px"
		>
			<span>{project.description}</span>
			<span class="flex gap-2">
				{#each project.tags as tag (tag)}
					<Tag label={tag} class={active ? project.accent.tag : undefined} />
				{/each}
			</span>
		</span>
	</a>
</li>
