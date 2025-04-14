<template>
  <div>
    <h1>Create Note</h1>
    <form @submit.prevent="createNote">
      <input v-model="title" placeholder="Title" required />
      <textarea v-model="content" placeholder="Content" required></textarea>
      <button type="submit">Create</button>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';

export default defineComponent({
  setup() {
    const title = ref('');
    const content = ref('');
    const router = useRouter();

    const createNote = async () => {
      try {
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ title: title.value, content: content.value })
        });
    
        if (response.ok) {
          router.push('/');
        } else {
          console.error('Failed to create note');
        }
      } catch (error) {
        console.error('Error creating note:', error);
      }
    };

    return {
      title,
      content,
      createNote
    };
  }
});
</script>