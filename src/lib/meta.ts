import type { ImageMetadata } from 'astro';
import meta from '../data/meta.json';

/*
 * Page metadata (title, description, social preview) lives in src/data/meta.json, keyed
 * by URL path. Preview image paths are relative to src/assets/.
 */

export interface PageMeta {
	title: string;
	description: string;
	/** Path under src/assets/, e.g. "work/midnight/hero.webp". */
	image?: string;
	imageAlt?: string;
	/** `article` for case studies, `website` for everything else. */
	type?: 'website' | 'article';
	/** Keep the page out of search results. */
	noindex?: boolean;
}

export const site = meta.site;

const pages: Record<string, PageMeta> = meta.pages as Record<string, PageMeta>;

const assets = import.meta.glob<{ default: ImageMetadata }>('../assets/**/*.{png,jpg,jpeg,webp,avif}', {
	eager: true,
});

/** The metadata for a URL path, with or without a trailing slash. */
export function pageMeta(pathname: string): PageMeta {
	const key = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
	const page = pages[key];
	if (!page) throw new Error(`No entry for "${key}" in src/data/meta.json`);
	return page;
}

/** Resolve a meta.json image path to the imported image. */
export function metaImage(path: string): ImageMetadata {
	const image = assets[`../assets/${path}`];
	if (!image) throw new Error(`src/data/meta.json: no image at src/assets/${path}`);
	return image.default;
}
