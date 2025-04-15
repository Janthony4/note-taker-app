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

    <!-- View Note Modal -->
    <div v-if="showViewModal" class="modal" style="display: block; background-color: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ currentNote.title }}</h5>
            <button type="button" class="btn-close" @click="showViewModal = false"></button>
          </div>
          <div class="modal-body">
            <p class="mb-4">{{ currentNote.content }}</p>
            
            <div v-if="currentNote.attachments && currentNote.attachments.length">
              <h6>Attachments:</h6>
              <div class="row">
                <div class="col-md-4 mb-3" v-for="(attachment, index) in currentNote.attachments" :key="index">
                  <img v-if="isImage(attachment.contentType)" 
                       :src="getAttachmentUrl(attachment.filename)" 
                       class="img-fluid rounded" 
                       style="max-height: 200px; object-fit: contain;"
                       :alt="attachment.originalname" />
                  <div v-else class="border p-2 rounded">
                    <a :href="getAttachmentUrl(attachment.filename)" 
                       download 
                       class="text-decoration-none">
                      <i class="bi bi-file-earmark-arrow-down me-2"></i>
                      {{ attachment.originalname }}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showViewModal = false">Close</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Note Modal -->
    <div v-if="showEditModal" class="modal" style="display: block; background-color: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Note</h5>
            <button type="button" class="btn-close" @click="showEditModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="updateNote">
              <div class="mb-3">
                <label class="form-label">Title</label>
                <input type="text" class="form-control" v-model="editingNote.title" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Content</label>
                <textarea class="form-control" v-model="editingNote.content" rows="5" required></textarea>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Current Attachments</label>
                <div class="d-flex flex-wrap gap-2 mb-3">
                  <div v-for="(attachment, index) in editingNote.attachments" :key="index" class="position-relative">
                    <img v-if="isImage(attachment.contentType)" 
                         :src="getAttachmentUrl(attachment.filename)" 
                         class="img-thumbnail" 
                         style="height: 100px; object-fit: cover;"
                         :alt="attachment.originalname" />
                    <div v-else class="border p-2 rounded">
                      <i class="bi bi-file-earmark me-2"></i>
                      {{ attachment.originalname }}
                    </div>
                    <button type="button" 
                            class="btn btn-sm btn-danger position-absolute top-0 end-0"
                            @click="removeAttachment(index)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Add New Attachments</label>
                <input type="file" class="form-control" multiple @change="handleFileUpload">
                <div v-if="newAttachments.length" class="mt-2">
                  <div v-for="(file, index) in newAttachments" :key="'new-'+index" class="d-inline-block me-2">
                    <span class="badge bg-secondary">
                      {{ file.name }}
                      <button type="button" class="btn-close btn-close-white btn-sm ms-1" 
                              @click="removeNewAttachment(index)"></button>
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="showEditModal = false">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Notes List -->
    <div class="container mt-4">
      <div class="row">
        <div class="col-md-4 mb-4" v-for="note in notes" :key="note._id">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title">{{ note.title }}</h5>
              <p class="card-text">{{ note.content }}</p>
              
              <div v-if="note.attachments && note.attachments.length" class="mt-3">
                <div class="d-flex flex-wrap gap-2">
                  <div v-for="(attachment, index) in note.attachments.slice(0, 1)" :key="index">
                    <img v-if="isImage(attachment.contentType)" 
                         :src="getAttachmentUrl(attachment.filename)" 
                         class="img-thumbnail" 
                         style="max-height: 100px; max-width: 100%; object-fit: contain;"
                         :alt="attachment.originalname" />
                  </div>
                </div>
              </div>
              
              <div class="mt-3 d-flex gap-2">
                <button class="btn btn-primary" @click="editNote(note)">Edit</button>
                <button class="btn btn-danger" @click="deleteNote(note._id)">Delete</button>
                <button class="btn btn-info" @click="viewNote(note)">View</button>
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
      showCreateModal: false,
      showViewModal: false,
      showEditModal: false,
      currentNote: {},
      editingNote: {
        _id: '',
        title: '',
        content: '',
        attachments: []
      },
      newAttachments: []
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
    editNote(note) {
      this.editingNote = {
        _id: note._id,
        title: note.title,
        content: note.content,
        attachments: [...note.attachments]
      };
      this.newAttachments = [];
      this.showEditModal = true;
    },
    async updateNote() {
      try {
        const formData = new FormData();
        formData.append('title', this.editingNote.title);
        formData.append('content', this.editingNote.content);
        
        // Append existing attachments that weren't deleted
        formData.append('attachments', JSON.stringify(this.editingNote.attachments));
        
        // Append new files
        this.newAttachments.forEach(file => {
          formData.append('newAttachments', file);
        });

        await axios.put(`/api/notes/${this.editingNote._id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        this.showEditModal = false;
        this.fetchNotes();
      } catch (error) {
        console.error('Error updating note:', error);
      }
    },
    handleFileUpload(event) {
      this.newAttachments = [...this.newAttachments, ...Array.from(event.target.files)];
    },
    removeAttachment(index) {
      this.editingNote.attachments.splice(index, 1);
    },
    removeNewAttachment(index) {
      this.newAttachments.splice(index, 1);
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
    viewNote(note) {
      this.currentNote = note;
      this.showViewModal = true;
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
  max-width: 800px;
  width: 100%;
}

.card {
  margin-bottom: 20px;
  transition: transform 0.2s;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}

.img-thumbnail {
  cursor: pointer;
  transition: transform 0.2s;
}

.img-thumbnail:hover {
  transform: scale(1.05);
}

.position-relative {
  position: relative;
}

.position-absolute {
  position: absolute;
}

.top-0 {
  top: 0;
}

.end-0 {
  right: 0;
}
</style>