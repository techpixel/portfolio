<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Project, Slug } from '../../data/work';
	import Bio from './Bio.svelte';
	import ProjectRow from './ProjectRow.svelte';

	interface Props {
		projects: Project[];
		previews: Record<Slug, { src: string; style?: string }>;
		portrait: string;
		emblems: Record<Slug, { hq: string; lq: string }>;
		/** Static art slotted in from Astro: the outlined name, and the silly flowers with their faces. */
		name?: Snippet;
		silly?: Snippet;
	}

	let { projects, previews, portrait, emblems, name, silly }: Props = $props();

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
	<div class="relative z-10 flex w-full max-w-[517px] flex-col gap-12">
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
		runs to the window's edge as it does in the frame. Only the page clips it (overflow-clip
		on main), so the name's outline can poke left past the column's gap while the dots and
		the big flower run off the window's edges.
	-->
	<div
		class="pointer-events-none absolute inset-y-0 right-0 left-[599px] max-lg:hidden"
		aria-hidden="true"
	>
		<div class="absolute inset-0" style:zoom="var(--art-scale, 1)">
			<!-- The intro slides each piece in from off the canvas (Figma's "(animated)" frame): the dots and the flowers from the bottom right, the name from the right. -->
			<div
				class="dots art-in absolute top-[180px] right-0 bottom-0 left-[76px] {recolor}"
				style="color: var(--c-dots); --from-x: 863px; --from-y: 761px; --ease: cubic-bezier(0, 0, 0.437, 0.987)"
			></div>
			<div
				class="name-warp art-in absolute top-0 -left-0.5 {recolor}"
				style="color: var(--c-ink); --from-x: 841px; --from-y: 0px; --ease: cubic-bezier(0, 0, 0.44, 0.99)"
			>
				{@render name?.()}
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
	/*
	 * Intro: every piece of the art slides in over 2s from its own offset and with its own
	 * ease, as timed in Figma. `translate` keeps clear of the children's layout transforms.
	 */
	@keyframes -global-art-in {
		from {
			translate: var(--from-x, 0px) var(--from-y, 0px);
		}
		to {
			translate: 0px 0px;
		}
	}
	:global(.art-in) {
		animation: art-in 1.5s var(--ease, ease-out) both;
	}

	/*
	 * Hovering a row fades the silly flowers out with the preview, on the same clock, and
	 * collapses them once hidden. When the hover ends they come back at once, growing from
	 * nothing on Figma's pop curve played backwards (a swell past full size, then settling),
	 * held to whole frames, the small one 200ms behind. Durations and curves are set inline,
	 * in index.astro.
	 */
	:global(.silly) {
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
		:global(.art-in) {
			animation: none;
		}
		:global(.silly) {
			transition: none;
		}
	}

	/* A 5px square every 30px: the Figma pattern tiles a 1×1 rect in a 6×6 box, scaled by 30. */
	.dots {
		background-image: conic-gradient(from 270deg at 5px 5px, currentColor 90deg, transparent 0);
		background-size: 30px 30px;
	}</style>
