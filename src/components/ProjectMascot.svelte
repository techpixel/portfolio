<script lang="ts">
	import type { Slug } from '../data/work';

	interface Props {
		slug: Slug;
		horizonsFerret: string;
	}

	let { slug, horizonsFerret }: Props = $props();
</script>

<!--
	Every mascot is centred in the same 93px box, anchored 10px in from the highlight bar's
	right end and 5px up from its bottom (Figma "Frame 86"). Positioned against the bar's box.
-->
<div
	class="pointer-events-none absolute right-[10px] bottom-[5px] flex h-[93.782px] w-[93px] items-center justify-center max-md:hidden"
	aria-hidden="true"
>
	{#if slug === 'midnight'}
		<img src="/work/midnight-crow.svg" alt="" width="93" height="81.6" class="max-w-none" />
	{:else if slug === 'horizons'}
		<img src={horizonsFerret} alt="" width="94" height="95" class="max-w-none" />
	{:else}
		<!--
			Drawn at its Figma size: a 56px mark whose 64px SVG includes a 4px outline, nudged
			8px right of centre.
		-->
		<div class="relative size-14 translate-x-2">
			<img
				src="/work/manifesto-mark.svg"
				alt=""
				width="64"
				height="64"
				class="absolute -top-1 -left-1 max-w-none"
			/>
		</div>
	{/if}
</div>
