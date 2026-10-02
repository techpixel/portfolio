<script lang="ts">
	interface Props {
		label: string;
		class?: string;
	}

	let { label, class: className = 'bg-cream text-black' }: Props = $props();
</script>

<span class="p-1 text-xs whitespace-nowrap transition-colors duration-320 ease-out {className}">{label}</span>
