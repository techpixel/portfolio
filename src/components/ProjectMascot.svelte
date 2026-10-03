<script lang="ts">
	interface Props {
		emblem: { hq: string; lq: string };
	}

	let { emblem }: Props = $props();

	// The tiny LQ emblem shows (blurred) until the HQ one has loaded, then the two
	// crossfade. Both load with the page, so it's usually ready before the first hover.
	let loaded = $state(false);
</script>

<!--
	All three emblems share one square frame in Figma, so they share one box here, anchored
	10px in from the highlight bar's right end and 5px up from its bottom (Figma "Frame 86").
-->
<div
	class="pointer-events-none absolute right-[10px] bottom-[5px] size-[94px] max-md:hidden"
	aria-hidden="true"
>
	<img
		src={emblem.lq}
		alt=""
		width="94"
		height="94"
		class="absolute inset-0 size-full blur-[2px] transition-opacity duration-200 {loaded ? 'opacity-0' : 'opacity-100'}"
	/>
	<img
		src={emblem.hq}
		alt=""
		width="94"
		height="94"
		class="absolute inset-0 size-full transition-opacity duration-200 {loaded ? 'opacity-100' : 'opacity-0'}"
		onload={() => (loaded = true)}
	/>
</div>
