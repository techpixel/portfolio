export interface Project {
	slug: 'midnight' | 'horizons' | 'manifesto';
	name: string;
	/** One line, set beside the wordmark while the row is hovered. */
	description: string;
	/**
	 * The colours the page takes on while the row is hovered: tints of the project's own hue,
	 * picked by role. `bar` fills the row and `onBar` is the text on it. `ink` colours the bio
	 * and the outlined name, `link` the bio's links, lighter again. `dots` is the grid behind
	 * the art, dark enough to sit back.
	 */
	theme: { bar: string; onBar: string; ink: string; link: string; dots: string };
}

export type Slug = Project['slug'];

export const projects: Project[] = [
	{
		slug: 'midnight',
		name: 'Midnight',
		description: 'A hackathon in Vienna, Austria',
		// As drawn in Figma: Midnight Veil for the bar and the dots, lighter purples for the text.
		theme: { bar: '#453b61', onBar: '#ffffff', ink: '#7b6da1', link: '#b0a1db', dots: '#453b61' },
	},
	{
		slug: 'horizons',
		name: 'Horizons',
		description: '6 hackathons across the world',
		// Polaroid Yellow for the text, black on the bar, the orange darkened for the dots.
		theme: { bar: '#ffa400', onBar: '#000000', ink: '#fba74d', link: '#ffd59f', dots: '#5c3b00' },
	},
	{
		slug: 'manifesto',
		name: 'Manifesto',
		description: 'The Hack Club Gap Year application',
		// Hack Club Red for the text, Impure White on the bar, the red darkened for the dots.
		theme: { bar: '#ff4849', onBar: '#eeeeee', ink: '#ec5750', link: '#ffa39e', dots: '#5c1a1a' },
	},
];
