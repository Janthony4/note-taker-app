<template>
  <div>
    <form @submit.prevent="submitForm" enctype="multipart/form-data">
      <div class="mb-3">
        <label for="title" class="form-label">Title</label>
        <input type="text" class="form-control" id="title" v-model="note.title" placeholder="Title" required />
      </div>
      <div class="mb-3">
        <label for="content" class="form-label">Content</label>
        <textarea class="form-control" id="content" v-model="note.content" placeholder="Content" rows="5"
          required></textarea>
      </div>
      <div class="mb-3">
        <label for="attachments" class="form-label">Attachments</label>
        <input type="file" class="form-control" id="attachments" multiple @change="handleFileUpload" />
      </div>
      <div v-if="note.attachments && note.attachments.length" class="mb-3">
        <h6>Selected Files:</h6>
        <ul>
          <li v-for="(file, index) in note.attachments" :key="index">
            {{ file.name }}
            <button type="button" class="btn btn-sm btn-danger ms-2" @click="removeFile(index)">
              Remove
            </button>
          </li>
        </ul>
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
        content: '',
        attachments: []
      },
      files: []
    };
  },
  methods: {
    handleFileUpload(event) {
      this.files = Array.from(event.target.files);
      this.note.attachments = this.files.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size
      }));
    },
    removeFile(index) {
      this.files.splice(index, 1);
      this.note.attachments.splice(index, 1);
    },
    async submitForm() {
      try {
        const formData = new FormData();
        formData.append('title', this.note.title);
        formData.append('content', this.note.content);

        // Append each file individually
        this.files.forEach(file => {
          formData.append('attachments', file);
        });

        const response = await axios.post('/api/notes', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          withCredentials: true // Important for CORS with credentials
        });

        this.$emit('note-created');
        this.$router.push('/'); // Or wherever you want to redirect
      } catch (error) {
        console.error('Error submitting note:', error);
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
        }
      }
    }
  }
};
</script>