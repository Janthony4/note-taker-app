<template>
  <div>
    <h1 v-if="note">{{ note.title }}</h1>
    <p v-if="note">{{ note.content }}</p>
    <h1 v-else>Note not found</h1>
    <router-link to="/">Back to Notes</router-link>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useRoute } from 'vue-router';

export default defineComponent({
  setup() {
    const route = useRoute();
    const noteId = parseInt(route.params.id as string);
    const notes = [
      { id: 1, title: 'Note 1', content: 'This is the first note.' },
      { id: 2, title: 'Note 2', content: 'This is the second note.' }
    ];

    const note = notes.find(n => n.id === noteId);

    return {
      note
    };
  }
});
</script>