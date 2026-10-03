<script lang="ts">
	interface Props {
		emblem: { hq: string; lq: string };
		shown: boolean;
	}

	let { emblem, shown }: Props = $props();

	// The tiny LQ emblem shows (blurred) until the HQ one has loaded, then the two crossfade.
	// Both load with the page, so it's usually ready before the first hover.
	let loaded = $state(false);
</script>

<!--
	The project's mascot rises faintly behind the bar's right end (Figma "image 235": 113px at
	35%, its right edge 56px past the column, its bottom 11px up from the bar's). It sits at
	the very back of the column, under the bar and the text.
-->
<div
	class="pointer-events-none absolute -right-14 bottom-[11px] -z-20 size-[113px] transition-opacity duration-320 ease-out motion-reduce:transition-none max-lg:hidden {shown
		? 'opacity-35'
		: 'opacity-0'}"
	aria-hidden="true"
>
	<img
		src={emblem.lq}
		alt=""
		width="113"
		height="113"
		class="absolute inset-0 size-full blur-[2px] transition-opacity duration-200 {loaded ? 'opacity-0' : 'opacity-100'}"
	/>
	<img
		src={emblem.hq}
		alt=""
		width="113"
		height="113"
		class="absolute inset-0 size-full transition-opacity duration-200 {loaded ? 'opacity-100' : 'opacity-0'}"
		onload={() => (loaded = true)}
	/>
</div>
