<template>
  <div>
    <!-- Header -->
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <div class="container-fluid">
        <span class="navbar-brand mb-0 h1">NoteTaker</span>
        <button class="btn btn-success" @click="showCreateModal = true">Create Note</button>
      </div>
    </nav>

    <!-- Create Note Modal -->
    <div v-if="showCreateModal" class="modal" style="display: block; background-color: rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Create New Note</h5>
            <button type="button" class="btn-close" @click="showCreateModal = false"></button>
          </div>
          <div class="modal-body">
            <NoteForm @note-created="handleNoteCreated" />
          </div>
        </div>
      </div>
    </div>

    <!-- Notes -->
    <div class="container mt-4">
      <div class="row">
        <div class="col-md-4 mb-4" v-for="note in notes" :key="note._id">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title">{{ note.title }}</h5>
              <p class="card-text">{{ note.content }}</p>

              <!-- Attachments Section -->
              <div v-for="(attachment, index) in note.attachments" :key="index">
                <img v-if="isImage(attachment.contentType)" :src="getAttachmentUrl(attachment.filename)"
                  class="img-thumbnail" style="max-height: 100px; max-width: 100%; object-fit: contain;"
                  :alt="attachment.originalname" />
              </div>

              <div class="mt-3 d-flex gap-2">
                <button class="btn btn-primary" @click="editNote(note._id)">Edit</button>
                <button class="btn btn-danger" @click="deleteNote(note._id)">Delete</button>
                <button class="btn btn-info" @click="viewNote(note._id)">View</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import NoteForm from './components/NoteForm.vue';

export default {
  components: {
    NoteForm
  },
  data() {
    return {
      notes: [],
      showCreateModal: false
    };
  },
  mounted() {
    this.fetchNotes();
  },
  methods: {
    isImage(contentType) {
      return contentType && contentType.startsWith('image/');
    },
    getAttachmentUrl(filename) {
      return `${import.meta.env.VITE_API_BASE_URL || ''}/uploads/${filename}`;
    },
    async fetchNotes() {
      try {
        const response = await axios.get('/api/notes');
        this.notes = response.data;
      } catch (error) {
        console.error('Error fetching notes:', error);
      }
    },
    editNote(id) {
      this.$router.push(`/edit/${id}`);
    },
    deleteNote(id) {
      axios.delete(`/api/notes/${id}`)
        .then(() => {
          this.fetchNotes();
        })
        .catch(error => {
          console.error('Error deleting note:', error);
        });
    },
    viewNote(id) {
      this.$router.push({ name: 'NoteDetail', params: { id } });
    },
    handleNoteCreated() {
      this.showCreateModal = false;
      this.fetchNotes();
    }
  }
};
</script>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}

.modal-dialog {
  max-width: 500px;
  width: 100%;
}

.card {
  margin-bottom: 20px;
  transition: transform 0.2s;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.img-thumbnail {
  cursor: pointer;
}
</style>