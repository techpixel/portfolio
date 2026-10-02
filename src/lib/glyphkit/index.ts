import familjen from './fonts/familjen-grotesk-700.json';
import type { GlyphFont } from './types';

export { glyphGeometry } from './outline';
export type { GlyphFont } from './types';

// JSON imports widen tuples to arrays, so the font needs a cast to its real shape.
export const familjenGrotesk700 = familjen as unknown as GlyphFont;
