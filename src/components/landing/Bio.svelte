<script lang="ts">
	const fade = 'transition-colors duration-320 ease-out motion-reduce:transition-none';
</script>

<section class="flex flex-col gap-5">
	<!-- The photo's place: 160px on desktop, 120px on phones, as in the two Figma frames. An empty box, which the portrait is drawn over from outside the column's intro (see Portrait.svelte). -->
	<div data-portrait-place class="size-30 sm:size-40" aria-hidden="true"></div>
	<div class="flex flex-col gap-[1lh] text-xs leading-[normal] sm:text-base {fade}" style:color="var(--c-ink)">
		<p>
			My name is Manitej Boorgu. I’m a programmer and designer making atypical and bold visual
			work. Nothing about my craft is normal.
		</p>
		<p>I’m probably at a Starbucks while you’re reading this.</p>
		<p>
			Previously, I’ve worked at <a href="https://hackclub.com" class="bio-link {fade}" style:--hover="#ec3750">Hack Club</a>
			building programs and running events for technical teenagers and helping them become great
			builders and doers.
		</p>
		<p>
			I currently design for <a href="https://purduehackers.com" class="bio-link {fade}" style:--hover="#fcd202">Purdue Hackers</a>.
			Open to work.
		</p>
	</div>
</section>

<style>
	.bio-link {
		color: var(--c-link);
		text-decoration: underline;
		text-decoration-thickness: from-font;
		text-underline-position: from-font;
	}
	.bio-link:hover,
	.bio-link:focus-visible {
		color: var(--hover);
	}
</style>
