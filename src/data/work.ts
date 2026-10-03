export interface Project {
	slug: 'midnight' | 'horizons' | 'manifesto';
	name: string;
	description: string;
	tags: string[];
	/** Tailwind classes for the active row's highlight bar, text, and tags. */
	accent: { bar: string; text: string; tag: string };
}

export type Slug = Project['slug'];

export const projects: Project[] = [
	{
		slug: 'midnight',
		name: 'Midnight',
		description: 'a hackathon in vienna',
		tags: ['branding', 'ui/ux design'],
		accent: { bar: 'bg-midnight', text: 'text-cream', tag: 'bg-cream text-midnight' },
	},
	{
		slug: 'horizons',
		name: 'Horizons',
		description: '6 hackathons across the world',
		tags: ['branding', 'ui/ux design'],
		accent: { bar: 'bg-horizons', text: 'text-black', tag: 'bg-black text-horizons' },
	},
	{
		slug: 'manifesto',
		name: 'Manifesto',
		description: 'the hack club gap year application',
		tags: ['storytelling', 'web design'],
		accent: {
			bar: 'bg-manifesto',
			text: 'text-manifesto-white',
			tag: 'bg-manifesto-white text-manifesto',
		},
	},
];
