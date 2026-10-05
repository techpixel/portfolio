import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';
import { widthsUpTo, zoomed } from './sizes';

/**
 * How a case study's hero is served: the 1200px column (zoomed on large screens) above
 * 1248px, the full width below. CaseStudy.astro's <Picture> and the landing's hover
 * prefetch both use these, so the file fetched on hover is the one the page then shows.
 */
export const HERO_SIZES = `(min-width: 1248px) ${zoomed(1200)}, 100vw`;

export const heroWidths = (hero: ImageMetadata) => widthsUpTo(hero.width);

/** The hero's AVIF candidates, as <Picture> writes them into its <source srcset>. */
export async function heroSrcset(hero: ImageMetadata): Promise<string> {
	const { srcSet } = await getImage({ src: hero, format: 'avif', widths: heroWidths(hero) });
	return srcSet.attribute;
}
