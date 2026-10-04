<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Project, Slug } from '../../data/work';
	import Bio from './Bio.svelte';
	import NameWarp from './NameWarp.svelte';
	import ProjectRow from './ProjectRow.svelte';

	interface Props {
		projects: Project[];
		previews: Record<Slug, { src: string; style?: string }>;
		portrait: string;
		emblems: Record<Slug, { hq: string; lq: string }>;
		/** Static art slotted in from Astro: the sillies with their faces. */
		silly?: Snippet;
	}

	let { projects, previews, portrait, emblems, silly }: Props = $props();

	let active = $state<Slug | null>(null);

	// TEMP (debugging): Alt+clicking a row pins its hover state until it's Alt+clicked again.
	let pinned = $state<Slug | null>(null);
	const activate = (slug: Slug) => {
		if (!pinned) active = slug;
	};
	const deactivate = () => {
		if (!pinned) active = null;
	};
	const togglePin = (slug: Slug) => {
		pinned = pinned === slug ? null : slug;
		active = slug;
	};

	// The hovered project's colours, handed down as custom properties that the bio, the
	// outlined name and the dots read. At rest everything is cream, with the peach wash over
	// the portrait.
	const theme = $derived(projects.find((p) => p.slug === active)?.theme);

	const fade = 'transition-opacity duration-320 ease-out motion-reduce:transition-none';
	const recolor = 'transition-colors duration-320 ease-out motion-reduce:transition-none';
</script>

<main
	class="relative flex min-h-[var(--page-height,100dvh)] items-center overflow-clip px-4 py-12 sm:px-6 lg:pl-12"
	style:--c-ink={theme?.ink ?? 'var(--color-cream)'}
	style:--c-link={theme?.link ?? 'var(--color-cream)'}
	style:--c-tint={theme?.ink ?? 'var(--color-peach)'}
	style:--c-dots={theme?.dots ?? 'var(--color-cream)'}
	data-active={active}
>
	<!-- The column settles in as one as the page lands, on the dots' clock: 95% to full size, fading in from nothing. -->
	<div class="settle-in relative z-10 flex w-full max-w-[517px] flex-col gap-12">
		<Bio {portrait} />
		<div class="flex flex-col gap-1">
			<p class="text-xs leading-[normal] text-peach">Selected Work</p>
			<ul class="flex flex-col gap-2" onmouseleave={deactivate}>
				{#each projects as project (project.slug)}
					<ProjectRow
						{project}
						emblem={emblems[project.slug]}
						active={active === project.slug}
						onactivate={() => activate(project.slug)}
						ondeactivate={deactivate}
						onpin={() => togglePin(project.slug)}
					/>
			{/each}
			</ul>
		</div>
	</div>

	<!--
		The art right of the column, drawn at the coordinates of the 1440×888 design (x − 599)
		and pinned to the top. It is scaled to fill whatever is right of the column, so the name
		runs to the window's edge as it does in the frame, with its outline just inside. Only the
		page clips it (overflow-clip on main), so the name's outline can poke left past the
		column's gap while the dots and the big silly run off the window's edges. The pointer
		passes through it all but the name, which squashes under it.
	-->
	<div
		class="pointer-events-none absolute inset-y-0 right-0 left-[599px] max-lg:hidden"
		aria-hidden="true"
	>
		<div class="absolute inset-0" style:zoom="var(--art-scale, 1)">
			<!-- The intro: the dots fade in one after another from the bottom right corner; the sillies pop in; the name slides in along its warp. -->
			<div class="dots absolute top-[180px] right-0 bottom-0 left-[76px] {recolor}" style="color: var(--c-dots)"></div>
			<div class="name-warp absolute top-0 -left-1 {recolor}" style="color: var(--c-ink)">
				<NameWarp />
			</div>
			{@render silly?.()}
			{#each projects as project (project.slug)}
				<img
					src={previews[project.slug].src}
					style={previews[project.slug].style}
					alt="{project.name} preview"
					width="745"
					height="449"
					fetchpriority="low"
					class="absolute top-[220px] left-1/2 h-[449px] w-[745px] -translate-x-1/2 object-cover {fade} {active === project.slug
						? 'opacity-100'
						: 'opacity-0'}"
				/>
			{/each}
		</div>
	</div>
</main>

<style>
	/* On the dot sweep's clock exactly (same start, length and curve), so the two land together. `backwards` leaves no transform behind once done. */
	.settle-in {
		animation: settle-in 1.6s cubic-bezier(0.25, 1, 0.5, 1) 150ms backwards;
	}
	@keyframes settle-in {
		from {
			scale: 0.95;
			opacity: 0;
		}
		to {
			scale: 1;
			opacity: 1;
		}
	}

	/*
	 * A 5px square every 30px: the Figma pattern tiles a 1×1 rect in a 6×6 box, scaled by 30.
	 * For the intro, a circle grows out of the bottom right corner and uncovers the dots as
	 * it passes, through an edge about one spacing wide, so each dot fades in just after its
	 * neighbour. The circle is a mask image pinned to that corner whose size animates, which
	 * every browser interpolates. It ends at 142% of the element, just enough to reach its far
	 * corner whatever the window, so the whole run is spent crossing dots. It starts a beat
	 * after first paint so the sweep is seen.
	 */
	.dots {
		background-image: conic-gradient(from 270deg at 5px 5px, currentColor 90deg, transparent 0);
		background-size: 30px 30px;
		mask-image: radial-gradient(circle farthest-side at 100% 100%, #000 calc(100% - 36px), transparent 100%);
		mask-repeat: no-repeat;
		mask-position: 100% 100%;
		animation: dots-in 1.6s cubic-bezier(0.25, 1, 0.5, 1) 150ms both;
	}
	@keyframes -global-dots-in {
		from {
			mask-size: 0% 0%;
		}
		to {
			mask-size: 142% 142%;
		}
	}

	/*
	 * The sillies pop in from nothing with a soft swell past full size before settling, the
	 * small one 200ms behind: for the intro, a short beat after first paint, and again when a
	 * hover ends. Hovering a row fades them out with the preview,
	 * on the same clock, and collapses them once hidden so the return can grow from nothing.
	 * Durations and curves are set inline, in index.astro.
	 */
	@keyframes -global-pop-in {
		from {
			scale: 0;
		}
		to {
			scale: 1;
		}
	}
	:global(.silly) {
		/* The intro is the same pop, a short beat after first paint; `backwards` holds them at nothing until then and hands scale back to the rules below once done. */
		animation: pop-in var(--pop-duration) var(--pop-ease-in) calc(var(--pop-delay) + 100ms) backwards;
		transition:
			scale var(--pop-duration) var(--pop-ease-in) var(--pop-delay),
			opacity 0s;
	}
	main[data-active] :global(.silly) {
		opacity: 0;
		scale: 0;
		transition:
			opacity 320ms ease-out,
			scale 0s 320ms;
	}
	@media (prefers-reduced-motion: reduce) {
		.dots,
		.settle-in,
		:global(.silly) {
			animation: none;
		}
		.dots {
			mask-image: none;
		}
		:global(.silly) {
			transition: none;
		}
	}
</style>
