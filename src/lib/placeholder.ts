import type { ImageMetadata } from 'astro';
import sharp from 'sharp';

const cache = new Map<string, Promise<string | undefined>>();

/**
 * A blurred, few-hundred-byte stand-in for an image, inlined as a CSS background on the
 * `<img>` so something is on screen while the real file loads. The full image paints over
 * it, so images with transparency get none (the blur would show through).
 */
export function placeholder(image: ImageMetadata): Promise<string | undefined> {
	// Astro hides the source path on the metadata object as a non-enumerable property.
	const path = (image as ImageMetadata & { fsPath?: string }).fsPath;
	if (!path) return Promise.resolve(undefined);

	let result = cache.get(path);
	if (!result) {
		result = render(path);
		cache.set(path, result);
	}
	return result;
}

async function render(path: string) {
	const source = sharp(path);
	const { hasAlpha, width = 1, height = 1 } = await source.metadata();
	if (hasAlpha) return undefined;

	const tiny = await source.resize(16, 16, { fit: 'inside' }).webp({ quality: 50 }).toBuffer();
	// Blurring inside an SVG filter keeps the edges soft without a CSS filter, which would
	// blur the real image too.
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><filter id="b" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${Math.max(width, height) / 40}"/><feComponentTransfer><feFuncA type="discrete" tableValues="1 1"/></feComponentTransfer></filter><image width="100%" height="100%" preserveAspectRatio="none" filter="url(#b)" href="data:image/webp;base64,${tiny.toString('base64')}"/></svg>`;
	return `background: url("data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}") center / 100% 100% no-repeat`;
}
