<template>
	<div v-if="note">
		<h1>{{ note.title }}</h1>
		<p>{{ note.content }}</p>
	</div>
	<div v-else>
		<p>Note not found</p>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

interface Note {
	_id: string;
	title: string;
	content: string;
}

export default defineComponent({
	setup() {
		const route = useRoute();
		const note = ref<Note | null>(null);

		onMounted(async () => {
			try {
				const id = route.params.id as string;
				const response = await axios.get<Note>(`/api/notes/${id}`);
				note.value = response.data;
			} catch (error) {
				console.error('Error fetching note:', error);
			}
		});

		return { note };
	}
});
</script>
