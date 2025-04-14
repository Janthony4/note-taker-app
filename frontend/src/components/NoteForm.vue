<!-- <template>
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
</script> -->

<template>
  <div>
    <h1>{{ id ? 'Edit Note' : 'Create Note' }}</h1>
    <form @submit.prevent="submitForm">
      <input type="text" v-model="note.title" placeholder="Title" required />
      <textarea v-model="note.content" placeholder="Content" required></textarea>
      <button type="submit">{{ id ? 'Update' : 'Create' }} Note</button>
    </form>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  props: ['id'],
  data() {
    return {
      note: {
        title: '',
        content: ''
      }
    };
  },
  mounted() {
    if (this.id) {
      this.fetchNote();
    }
  },
  methods: {
    async fetchNote() {
      try {
        const response = await axios.get(`http://localhost:5000/notes/${this.id}`);
        this.note = response.data;
      } catch (error) {
        console.error('Error fetching note:', error);
      }
    },
    async submitForm() {
      try {
        if (this.id) {
          await axios.put(`http://localhost:5000/notes/${this.id}`, this.note);
          this.$router.push('/');
        } else {
          await axios.post('http://localhost:5000/notes', this.note);
          this.$router.push('/');
        }
      } catch (error) {
        console.error('Error submitting note:', error);
      }
    }
  }
};
</script>
