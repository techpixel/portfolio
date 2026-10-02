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
		description: 'making murder fun',
		tags: ['branding', 'ui/ux design'],
		accent: { bar: 'bg-midnight', text: 'text-cream', tag: 'bg-cream text-midnight' },
	},
	{
		slug: 'horizons',
		name: 'Horizons',
		description: 'an identity with many identities',
		tags: ['branding', 'ui/ux design'],
		accent: { bar: 'bg-horizons', text: 'text-black', tag: 'bg-black text-horizons' },
	},
	{
		slug: 'manifesto',
		name: 'Manifesto',
		description: '2 days to tell 20 stories to 2000 people.',
		tags: ['storytelling', 'web design'],
		accent: {
			bar: 'border-4 border-manifesto bg-black',
			text: 'text-manifesto',
			tag: 'bg-manifesto text-black',
		},
	},
];
