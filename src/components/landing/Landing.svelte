<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Project, Slug } from '../../data/work';
	import Bio from './Bio.svelte';
	import NameWarp from './NameWarp.svelte';
	import Portrait from './Portrait.svelte';
	import ProjectRow from './ProjectRow.svelte';

	interface Props {
		projects: Project[];
		previews: Record<Slug, { src: string; style?: string }>;
		/** Each case study's hero as its page serves it, fetched when its row is hovered. */
		heroes: Record<Slug, { srcset: string; sizes: string }>;
		portrait: string;
		emblems: Record<Slug, { hq: string; lq: string }>;
		/** Static art slotted in from Astro: the sillies with their faces. */
		silly?: Snippet;
	}

	let { projects, previews, heroes, portrait, emblems, silly }: Props = $props();

	let active = $state<Slug | null>(null);

	// The column's animated group and the photo's place in it, for the portrait, which is drawn
	// from outside the group so the intro can't resample its dither (see Portrait.svelte).
	let group = $state<HTMLDivElement>();
	let spacer = $state<HTMLDivElement>();

	// TEMP (debugging): Alt+clicking a row pins its hover state until it's Alt+clicked again.
	let pinned = $state<Slug | null>(null);
	// Hovering a row is the surest hint its case study is next, so fetch the hero that page
	// shows, through the page's own srcset and sizes so the browser picks the same file and
	// then has it in cache on arrival.
	const warmed = new Set<Slug>();
	const warm = (slug: Slug) => {
		if (warmed.has(slug)) return;
		warmed.add(slug);
		const img = new Image();
		img.sizes = heroes[slug].sizes;
		img.srcset = heroes[slug].srcset;
	};
	const activate = (slug: Slug) => {
		warm(slug);
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
	<!-- The column settles in as one as the page lands, on the dots' clock: 95% to full size, fading in from nothing. The portrait follows from over its place, outside the group. -->
	<div class="relative z-10 w-full max-w-[517px]">
		<div bind:this={group} class="settle-in flex flex-col gap-12">
			<Bio bind:spacer />
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
		<Portrait {portrait} {spacer} {group} />
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
			<!-- The sillies fade as one group, so where they overlap, and where each face sits on its silly, nothing shows through mid-fade. -->
			<div class="sillies absolute inset-0 {fade} {active ? 'opacity-0' : 'opacity-100'}">
				{@render silly?.()}
			</div>
			{#each projects as project (project.slug)}
				<img
					src={previews[project.slug].src}
					style={previews[project.slug].style}
					alt="{project.name} preview"
					width="745"
					height="449"
					fetchpriority="low"
					class="preview absolute left-1/2 h-[449px] w-[745px] -translate-x-1/2 object-cover {fade} {active === project.slug
						? 'opacity-100'
						: 'opacity-0'}"
				/>
			{/each}
		</div>
	</div>
</main>

<style>
	/*
	 * The preview sits 220px down the frame. The art is scaled to the window's width (see
	 * Layout.astro), so on a window wider than the frame it outgrows the page's height, and
	 * the preview, the lowest thing in it, would run off the bottom: 100% here is the page's
	 * height in the art's pixels. So it lifts just enough to keep 32px clear of the bottom,
	 * but no higher than the dots' first row, short of the name; on the widest windows its
	 * bottom is trimmed instead.
	 */
	.preview {
		top: clamp(180px, 100% - 449px - 32px, 220px);
	}

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
	 * For the intro, the sillies pop in from nothing with a soft swell past full size before
	 * settling, the small one 200ms behind, a short beat after first paint. Durations and
	 * curves are set inline, in index.astro. Hover is handled on their wrapper in the markup
	 * above: it fades out with the preview and back in when the hover ends, on the same clock,
	 * no pop, their scale staying put.
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
		/* `backwards` holds them at nothing until the intro's delay is up; once the pop is done, scale is simply 1. */
		animation: pop-in var(--pop-duration) var(--pop-ease-in) calc(var(--pop-delay) + 100ms) backwards;
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
	}
</style>
