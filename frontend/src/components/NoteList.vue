<template>
  <div>
    <h1>Notes</h1>
    <ul>
      <li v-for="note in notes" :key="note.id">
        <router-link :to="{ name: 'NoteDetail', params: { id: note.id } }">{{ note.title }}</router-link>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import axios from 'axios';

interface Note {
  id: number;
  title: string;
}

export default defineComponent({
  setup() {
    const notes = ref<Note[]>([]);

    onMounted(async () => {
      try {
        const response = await axios.get<Note[]>('http://localhost:5000/notes');
        notes.value = response.data;
      } catch (error) {
        console.error('Error fetching notes:', error);
      }
    });

    return {
      notes
    };
  }
});
</script>