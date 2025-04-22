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
        <input type="file" class="form-control" multiple @change="handleFileUpload" :disabled="isSaving"
          accept="image/*,.pdf,.docx,.pptx,.xlsx" />
      </div>
      <div v-if="fileErrors.length" class="alert alert-danger mt-2">
        <ul class="mb-0">
          <li v-for="(err, idx) in fileErrors" :key="idx">{{ err }}</li>
        </ul>
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
      <div class="mb-3">
        <label for="labels" class="form-label">Labels (comma-separated)</label>
        <input type="text" class="form-control" id="labels" v-model="labelsInput" placeholder="e.g., work, urgent" />
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
        attachments: [],
        isPinned: false,
        isFavourite: false,
        labels: []
      },
      labelsInput: '',
      files: [],
      fileErrors: []

    };
  },
  methods: {
    handleFileUpload(event) {
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 
        'application/pdf',                         
        'application/msword',                      
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'text/markdown',                           
        'application/vnd.ms-powerpoint',           
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', 
        'application/vnd.ms-excel',                
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
        'text/plain'                          
      ];
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      this.files = [];
      this.note.attachments = [];
      this.fileErrors = [];

      const selectedFiles = Array.from(event.target.files);

      selectedFiles.forEach(file => {
        if (!allowedTypes.includes(file.type)) {
          this.fileErrors.push(`${file.name} is not an allowed file type.`);
          return;
        }
        if (file.size > MAX_FILE_SIZE) {
          this.fileErrors.push(`${file.name} exceeds the 5MB size limit.`);
          return;
        }
        this.files.push(file);
        this.note.attachments.push({
          name: file.name,
          type: file.type,
          size: file.size
        });
      });
    },

    removeFile(index) {
      this.files.splice(index, 1);
      this.note.attachments.splice(index, 1);
    },
    async submitForm() {
      if (this.fileErrors.length) {
        alert('Please fix the file upload errors before submitting.');
        return;
      }

      try {
        const formData = new FormData();

        this.note.labels = this.labelsInput
          .split(',')
          .map(label => label.trim())
          .filter(label => label.length > 0);

        formData.append('title', this.note.title);
        formData.append('content', this.note.content);
        formData.append('isPinned', this.note.isPinned);
        formData.append('isFavourite', this.note.isFavourite);
        formData.append('labels', JSON.stringify(this.note.labels));

        // Append each file individually
        this.files.forEach(file => {
          formData.append('attachments', file);
        });

        const response = await axios.post('/api/notes', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          withCredentials: true
        });

        this.$emit('note-created');
        this.$router.push('/');
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