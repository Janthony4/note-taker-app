<template>
  <div>
    <h1>Notes</h1>
    <ul>
      <li v-for="note in notes" :key="note._id">
        <router-link :to="{ name: 'NoteDetail', params: { id: note._id } }">
          {{ note.title }}
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import axios from 'axios';

interface Note {
  _id: string;
  title: string;
}

export default defineComponent({
  setup() {
    const notes = ref<Note[]>([]);

    onMounted(async () => {
      try {
        const response = await axios.get<Note[]>('/api/notes');
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