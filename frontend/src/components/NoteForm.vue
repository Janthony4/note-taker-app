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

    const createNote = () => {
      // For simplicity, we'll just log the note to the console
      console.log({ title: title.value, content: content.value });
      router.push('/');
    };

    return {
      title,
      content,
      createNote
    };
  }
});
</script>