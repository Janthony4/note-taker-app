<template>
  <div>
    <form @submit.prevent="submitForm">
      <div class="mb-3">
        <label for="title" class="form-label">Title</label>
        <input 
          type="text" 
          class="form-control" 
          id="title" 
          v-model="note.title" 
          placeholder="Title" 
          required 
        />
      </div>
      <div class="mb-3">
        <label for="content" class="form-label">Content</label>
        <textarea 
          class="form-control" 
          id="content" 
          v-model="note.content" 
          placeholder="Content" 
          rows="5"
          required
        ></textarea>
      </div>
      <button type="submit" class="btn btn-primary">{{ id ? 'Update' : 'Create' }} Note</button>
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
        const response = await axios.get(`/api/notes/${this.id}`);
        this.note = response.data;
      } catch (error) {
        console.error('Error fetching note:', error);
      }
    },
    async submitForm() {
      try {
        if (this.id) {
          await axios.put(`/api/notes/${this.id}`, this.note);
          this.$emit('note-created');
        } else {
          await axios.post('/api/notes', this.note);
          this.$emit('note-created');
        }
      } catch (error) {
        console.error('Error submitting note:', error);
      }
    }
  }
};
</script>

<style scoped>
.form-control {
  margin-bottom: 15px;
}
</style>