<script lang="ts">
	interface Props {
		/** Stroke weight in px. */
		weight?: number;
		class?: string;
	}

	let { weight = 2.2, class: className = '' }: Props = $props();

	// The ↗ fills the bottom 11×11 of an 11×20 box (Figma "Frame 58"), so its bottom edge
	// rests on the text's baseline when the row aligns its items by baseline.
	const half = $derived(weight / 2);
	// Where a butt-capped diagonal of this weight just touches the box's corners.
	const inset = $derived(weight / (2 * Math.SQRT2));
</script>

<svg
	width="11"
	height="20"
	viewBox="0 0 11 20"
	fill="none"
	stroke="currentColor"
	stroke-width={weight}
	class="shrink-0 {className}"
	aria-hidden="true"
>
	<path d="M0 {9 + half}H{11 - half}V20" />
	<path d="M{inset} {20 - inset}L{11 - inset} {9 + inset}" />
</svg>
