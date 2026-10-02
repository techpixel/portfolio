<script lang="ts">
	import type { Project, Slug } from '../data/work';
	import Bio from './Bio.svelte';
	import ProjectRow from './ProjectRow.svelte';

	interface Props {
		projects: Project[];
		previews: Record<Slug, { src: string; style?: string }>;
		portrait: string;
		horizonsFerret: string;
	}

	let { projects, previews, portrait, horizonsFerret }: Props = $props();

	let active = $state<Slug | null>(null);

	// TEMP (debugging): clicking a row pins its hover state until it's clicked again.
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

	// Everything in the top area shares one grid cell, so swapping never shifts the layout.
	const layer = '[grid-area:1/1] transition-[opacity,visibility] duration-150';
	const visibility = (shown: boolean) => (shown ? 'visible opacity-100' : 'invisible opacity-0');
</script>

<main class="mx-auto w-full max-w-[773px] p-6 md:mx-0">
	<div class="grid md:min-h-[469px]">
		<Bio {portrait} class="{layer} {visibility(active === null)}" />

		{#each projects as project (project.slug)}
			<img
				src={previews[project.slug].src}
				style={previews[project.slug].style}
				alt="{project.name} preview"
				width="725"
				height="438"
				fetchpriority="low"
				class="mt-[3px] aspect-[725/438] w-full object-cover {layer} {visibility(active === project.slug)}"
			/>
		{/each}
	</div>

	<section class="mt-12 md:mt-2">
		<h2 class="mb-4 font-display text-4xl leading-[normal] font-bold">Selected Work</h2>
		<ul class="flex flex-col gap-2" onmouseleave={deactivate}>
			{#each projects as project (project.slug)}
				<ProjectRow
					{project}
					{horizonsFerret}
					active={active === project.slug}
					onactivate={() => activate(project.slug)}
					ondeactivate={deactivate}
					onpin={() => togglePin(project.slug)}
				/>
			{/each}
		</ul>
		<!-- Touch screens have no hover to hint at. -->
		<p
			class="mt-2 text-sm leading-none text-peach transition-[opacity,visibility] duration-150 [@media(hover:none)]:hidden {visibility(
				active === null
			)}"
		>
			Hover to view
		</p>
	</section>
</main>
