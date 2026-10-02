<script lang="ts" module>
	import { glyphGeometry, type GlyphFont } from '../lib/glyphkit';

	/** Headroom above the cap line, in em units, so round letters' overshoot isn't clipped. */
	const OVERSHOOT = 30;

	// Set the word in em units on a shared baseline, the same pen walk as glyphkit's <Word>.
	function layout(font: GlyphFont, text: string, stretch: number) {
		let pen = 0;
		const glyphs = Array.from(text, (char) => {
			const geometry = glyphGeometry(font, char, { stretch: { x: stretch }, smooth: true });
			const x = pen;
			pen += geometry.advance;
			return { x, geometry };
		}).filter((g) => g.geometry.d);
		const left = Math.min(...glyphs.map((g) => g.x + g.geometry.bbox[0]));
		const right = Math.max(...glyphs.map((g) => g.x + g.geometry.bbox[2]));
		return { glyphs, left, width: right - left };
	}

	/** Distance from the top of the drawn box down to the baseline, in px. */
	export function ascent(font: GlyphFont, size: number) {
		return ((font.capHeight + OVERSHOOT) * size) / font.capHeight;
	}

	/** How wide `text` draws, in px, at cap height `size`. */
	export function inkWidth(font: GlyphFont, text: string, size: number, stretch: number) {
		return (layout(font, text, stretch).width * size) / font.capHeight;
	}

	/** The stretch at which `text`, at cap height `size`, is `width` px wide. */
	export function stretchToFit(font: GlyphFont, text: string, size: number, width: number) {
		const scale = size / font.capHeight;
		const miss = (stretch: number) => layout(font, text, stretch).width * scale - width;
		// Width is close to linear in stretch, so a few secant steps land on it.
		let a = 1;
		let b = 1.5;
		let fa = miss(a);
		let fb = miss(b);
		for (let i = 0; i < 4 && Math.abs(fb) > 0.05 && fb !== fa; i++) {
			[a, fa, b] = [b, fb, b - (fb * (b - a)) / (fb - fa)];
			fb = miss(b);
		}
		return b;
	}
</script>

<script lang="ts">
	interface Props {
		text: string;
		font: GlyphFont;
		/** Cap height in px. */
		size: number;
		/** Horizontal stretch; 1 is the letter as drawn. */
		stretch?: number;
		/** Forward lean in degrees, pivoting on the baseline. */
		slant?: number;
		class?: string;
		style?: string;
	}

	let { text, font, size, stretch = 1, slant = 0, class: className = '', style }: Props = $props();

	const laid = $derived(layout(font, text, stretch));
	const scale = $derived(size / font.capHeight);
	// A fixed vertical box (cap line plus overshoot down to the descender), so the
	// baseline sits at a known depth whatever the letters are.
	const top = $derived(-(font.capHeight + OVERSHOOT));
	const height = $derived(font.capHeight + OVERSHOOT + font.descender);
</script>

<svg
	role="img"
	aria-label={text}
	width={laid.width * scale}
	height={height * scale}
	viewBox="{laid.left} {top} {laid.width} {height}"
	overflow="visible"
	fill="currentColor"
	stroke="currentColor"
	class="block shrink-0 {className}"
	{style}
>
	<g transform="skewX({-slant})">
		{#each laid.glyphs as glyph, i (i)}
			<!-- A 1px stroke half-hidden by the fill: the Figma wordmarks' 0.5px outside outline. -->
			<path
				d={glyph.geometry.d}
				transform="translate({glyph.x} 0)"
				stroke-width="1"
				vector-effect="non-scaling-stroke"
			/>
		{/each}
	</g>
</svg>
