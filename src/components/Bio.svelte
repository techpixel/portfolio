<script lang="ts">
	interface Props {
		portrait: string;
		class?: string;
	}

	let { portrait, class: className = '' }: Props = $props();
</script>

<style>
	/* Hovered links take manitej.com's colours. */
	.cs-grow {
		transition: color 200ms ease;
	}
	.cs-grow:hover,
	.cs-grow:focus-visible {
		color: var(--color-coral);
	}
	/* The email takes the blue manitej.com uses for its contact column. */
	.cs-grow.cs-email:hover,
	.cs-grow.cs-email:focus-visible {
		color: var(--color-teal);
	}
</style>

<section class="flex max-w-[648px] flex-col gap-4 {className}">
	<div class="relative size-[181px]">
		<img src={portrait} alt="Manitej" width="181" height="181" class="size-full object-cover" />
		<div class="absolute inset-0 bg-peach mix-blend-multiply"></div>
	</div>
	<div class="flex flex-col gap-[1lh] leading-[normal]">
		<p>
			<strong class="font-bold">Hey!</strong> My name is Manitej!
			<span class="text-peach">(man-uh-tehj)</span>
		</p>
		<p>
			I’m a programmer and designer currently studying Computer Science at Purdue University. I
			enjoy making <em>things</em> and getting into random side tangents.
		</p>
		<p>
			Previously, I’ve worked at <a href="https://hackclub.com" class="cs-grow underline">Hack Club</a>
			building programs and running events for technical teenagers and helping them become great
			builders and doers.
		</p>
		<p>
			You can reach me at
			<a href="mailto:me@manitej.com" class="cs-grow cs-email underline [text-decoration-skip-ink:none]"
				>(me at manitej dot com)</a
			><br />
			Feel free to say hello!
		</p>
	</div>
</section>
