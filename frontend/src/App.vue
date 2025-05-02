<template>
  <div>
    <!-- Header -->
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <div class="container-fluid">
        <span class="navbar-brand mb-0 h1">NoteTaker</span>
        <div>
          <template v-if="isAuthenticated">
            <button class="btn btn-success me-2" @click="showCreateModal = true">
              <i class="bi bi-plus-lg"></i> Create Note
            </button>
            <button class="btn btn-outline-danger" @click="logout">
              <i class="bi bi-box-arrow-right"></i> Logout
            </button>
          </template>
          <template v-else>
            <button class="btn btn-primary" @click="goToLogin">
              <i class="bi bi-box-arrow-in-right"></i> Login
            </button>
          </template>
        </div>
      </div>
    </nav>

    <div class="container mt-4">
      <!-- Show LoginForm when not authenticated -->
      <template v-if="!isAuthenticated">
        <LoginForm @auth-success="handleAuthSuccess" />
      </template>


      <template v-else>


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

                <div v-if="currentNote.labels && currentNote.labels.length" class="mb-3">
                  <div class="d-flex flex-wrap gap-1">
                    <span v-for="(label, index) in currentNote.labels" :key="index" class="badge bg-primary">
                      {{ label }}
                    </span>
                  </div>
                </div>

                <div v-if="currentNote.attachments && currentNote.attachments.length">
                  <h6>Attachments:</h6>
                  <div class="row">
                    <div class="col-md-4 mb-3" v-for="(attachment, index) in currentNote.attachments" :key="index">
                      <img v-if="isImage(attachment.contentType)" :src="getAttachmentUrl(attachment.fileId)"
                        class="img-fluid rounded" style="max-height: 200px; object-fit: contain;"
                        :alt="attachment.originalname" @error="handleImageError" />
                      <div v-else class="border p-2 rounded">
                        <a :href="getAttachmentUrl(attachment.fileId)" :download="attachment.originalname"
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
                <button type="button" class="btn-close" @click="cancelEdit"></button>
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

                  <!-- Labels Section -->
                  <div class="mb-3">
                    <label class="form-label">Labels</label>
                    <div class="d-flex flex-wrap gap-2 mb-2">
                      <span v-for="(label, index) in editingNote.labels" :key="index"
                        class="badge bg-primary d-flex align-items-center">
                        {{ label }}
                        <button type="button" class="btn-close btn-close-white btn-sm ms-1" @click="removeLabel(index)"
                          :disabled="isSaving"></button>
                      </span>
                    </div>
                    <div class="input-group">
                      <input type="text" class="form-control" v-model="newLabel" placeholder="Add label..."
                        @keydown.enter.prevent="addLabel" :disabled="isSaving" list="labelSuggestions">
                      <button class="btn btn-outline-secondary" type="button" @click="addLabel"
                        :disabled="isSaving || !newLabel.trim()">
                        Add
                      </button>
                    </div>
                    <datalist id="labelSuggestions">
                      <option v-for="label in availableLabels" :key="label" :value="label"></option>
                    </datalist>
                    <div v-if="availableLabels.length" class="mt-2">
                      <small class="text-muted">Available labels:</small>
                      <div class="d-flex flex-wrap gap-1 mt-1">
                        <button v-for="label in availableLabels" :key="label" class="btn btn-sm btn-outline-secondary"
                          @click="addExistingLabel(label)" :disabled="editingNote.labels.includes(label) || isSaving">
                          {{ label }}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Current Attachments</label>
                    <div class="d-flex flex-wrap gap-2 mb-3">
                      <div v-for="(attachment, index) in editingNote.attachments" :key="index"
                        class="position-relative">
                        <img v-if="isImage(attachment.contentType)" :src="getAttachmentUrl(attachment.fileId)"
                          class="img-thumbnail" style="height: 100px; object-fit: cover;"
                          :alt="attachment.originalname" />
                        <div v-else class="border p-2 rounded">
                          <i class="bi bi-file-earmark me-2"></i>
                          {{ attachment.originalname }}
                        </div>
                        <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0"
                          @click="removeAttachment(index)" :disabled="isSaving">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Add New Attachments (max 5MB each)</label>
                    <input type="file" class="form-control" multiple @change="handleFileUpload" :disabled="isSaving"
                      accept="image/*,.pdf,.docx,.pptx,.xlsx">

                    <div v-if="newAttachments.length" class="mt-2">
                      <div v-for="(file, index) in newAttachments" :key="'new-' + index" class="d-inline-block me-2">
                        <span class="badge bg-secondary">
                          {{ file.name }} ({{ formatFileSize(file.size) }})
                          <button type="button" class="btn-close btn-close-white btn-sm ms-1"
                            @click="removeNewAttachment(index)" :disabled="isSaving"></button>
                        </span>
                      </div>
                    </div>
                    <div v-if="fileSizeError" class="text-danger mt-2">
                      {{ fileSizeError }}
                    </div>
                  </div>

                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" @click="cancelEdit" :disabled="isSaving">
                      Cancel
                    </button>
                    <button type="submit" class="btn btn-primary" :disabled="isSaving">
                      <span v-if="isSaving" class="spinner-border spinner-border-sm me-1"></span>
                      {{ isSaving ? 'Saving...' : 'Save Changes' }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        <!-- Notes List -->
        <div class="container mt-4">
          <!-- Search and Filter Controls -->
          <div class="container mt-4 mb-3">
            <div class="row g-3">
              <div class="col-md-4">
                <input v-model="searchQuery" @input="fetchNotes" type="text" class="form-control"
                  placeholder="Search notes..." />
              </div>
              <div class="col-md-3">
                <select v-model="selectedLabel" @change="fetchNotes" class="form-select">
                  <option value="">All Labels ({{ availableLabels.length }})</option>
                  <option v-for="label in availableLabels" :key="label" :value="label">
                    {{ label }}
                  </option>
                </select>
              </div>
              <div class="col-md-3">
                <select v-model="sortOption" @change="fetchNotes" class="form-select">
                  <option v-for="option in sortOptions" :key="option.value" :value="option.value">
                    {{ option.text }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Pinned Notes Section -->
          <div v-if="pinnedNotes.length > 0" class="mb-5">
            <h4 class="mb-3 border-bottom pb-2">
              <i class="bi bi-pin-angle-fill me-2"></i> Pinned Notes
            </h4>
            <div class="row">
              <div class="col-md-4 mb-4" v-for="note in pinnedNotes" :key="note._id">
                <div class="card h-100 pinned-highlight">
                  <div class="card-body">
                    <div v-if="note.labels && note.labels.length" class="mb-2 d-flex flex-wrap gap-1">
                      <span v-for="(label, index) in note.labels" :key="index" class="badge bg-primary">
                        {{ label }}
                      </span>
                    </div>
                    <h5 class="card-title">{{ note.title }}</h5>
                    <p class="card-text">{{ note.content }}</p>

                    <!-- Attachments Preview -->
                    <div v-if="note.attachments && note.attachments.length"
                      class="mt-3 d-flex align-items-center gap-2 flex-wrap">
                      <div v-for="(attachment, index) in note.attachments.slice(0, 3)" :key="index">
                        <img v-if="isImage(attachment.contentType)" :src="getAttachmentUrl(attachment.fileId)"
                          class="img-thumbnail" style="max-height: 100px; max-width: 100px; object-fit: contain;"
                          :alt="attachment.originalname" @error="handleImageError" />
                        <div v-else class="border p-2 rounded text-center" style="width: 100px; height: 100px;">
                          <i class="bi bi-file-earmark" style="font-size: 2rem;"></i>
                          <div style="font-size: 0.8rem;">{{ attachment.originalname }}</div>
                        </div>
                      </div>
                    </div>

                    <!-- "+N more" counter -->
                    <div v-if="note.attachments.length > 3"
                      class="d-flex justify-content-center align-items-center bg-secondary text-white rounded"
                      style="width: 50px; height: 50px; font-weight: bold;">
                      +{{ note.attachments.length - 3 }}
                    </div>

                    <!-- Action Buttons -->
                    <div class="mt-3 d-flex gap-2">
                      <button class="btn btn-primary" @click="editNote(note)">
                        <i class="bi bi-pencil"></i> Edit
                      </button>
                      <button class="btn btn-danger" @click="deleteNote(note._id)">
                        <i class="bi bi-trash"></i> Delete
                      </button>
                      <button class="btn btn-info" @click="viewNote(note)">
                        <i class="bi bi-eye"></i> View
                      </button>
                      <button class="btn" @click="togglePin(note)"
                        :class="note.isPinned ? 'btn-warning' : 'btn-outline-warning'">
                        <i :class="note.isPinned ? 'bi bi-pin-angle-fill text-white' : 'bi bi-pin-angle'"></i>
                      </button>
                      <button class="btn" @click="toggleFavourite(note)"
                        :class="note.isFavourite ? 'btn-danger' : 'btn-outline-danger'">
                        <i :class="note.isFavourite ? 'bi bi-heart-fill text-white' : 'bi bi-heart'"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Divider -->
          <div v-if="pinnedNotes.length > 0 && otherNotes.length > 0" class="my-4 border-bottom"></div>

          <!-- Other Notes Section -->
          <div v-if="otherNotes.length > 0">
            <h4 class="mb-3">All Notes</h4>
            <div class="row">
              <div class="col-md-4 mb-4" v-for="note in otherNotes" :key="note._id">
                <div class="card h-100">
                  <div class="card-body">
                    <div v-if="note.labels && note.labels.length" class="mb-2 d-flex flex-wrap gap-1">
                      <span v-for="(label, index) in note.labels" :key="index" class="badge bg-primary">
                        {{ label }}
                      </span>
                    </div>
                    <h5 class="card-title">{{ note.title }}</h5>
                    <p class="card-text">{{ note.content }}</p>

                    <!-- Attachments Preview -->
                    <div v-if="note.attachments && note.attachments.length"
                      class="mt-3 d-flex align-items-center gap-2 flex-wrap">
                      <div v-for="(attachment, index) in note.attachments.slice(0, 3)" :key="index">
                        <img v-if="isImage(attachment.contentType)" :src="getAttachmentUrl(attachment.fileId)"
                          class="img-thumbnail" style="max-height: 100px; max-width: 100px; object-fit: contain;"
                          :alt="attachment.originalname" @error="handleImageError" />
                        <div v-else class="border p-2 rounded text-center" style="width: 100px; height: 100px;">
                          <i class="bi bi-file-earmark" style="font-size: 2rem;"></i>
                          <div style="font-size: 0.8rem;">{{ attachment.originalname }}</div>
                        </div>
                      </div>
                    </div>

                    <!-- "+N more" counter -->
                    <div v-if="note.attachments.length > 3"
                      class="d-flex justify-content-center align-items-center bg-secondary text-white rounded"
                      style="width: 50px; height: 50px; font-weight: bold;">
                      +{{ note.attachments.length - 3 }}
                    </div>

                    <!-- Action Buttons -->
                    <div class="mt-3 d-flex gap-2">
                      <button class="btn btn-primary" @click="editNote(note)">
                        <i class="bi bi-pencil"></i> Edit
                      </button>
                      <button class="btn btn-danger" @click="deleteNote(note._id)">
                        <i class="bi bi-trash"></i> Delete
                      </button>
                      <button class="btn btn-info" @click="viewNote(note)">
                        <i class="bi bi-eye"></i> View
                      </button>
                      <button class="btn" @click="togglePin(note)"
                        :class="note.isPinned ? 'btn-warning' : 'btn-outline-warning'">
                        <i :class="note.isPinned ? 'bi bi-pin-angle-fill text-white' : 'bi bi-pin-angle'"></i>
                      </button>
                      <button class="btn" @click="toggleFavourite(note)"
                        :class="note.isFavourite ? 'btn-danger' : 'btn-outline-danger'">
                        <i :class="note.isFavourite ? 'bi bi-heart-fill text-white' : 'bi bi-heart'"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="!loadingNotes && notes.length === 0" class="text-center py-5">
            <i class="bi bi-journal-text" style="font-size: 3rem; opacity: 0.5;"></i>
            <h4 class="mt-3">No notes found</h4>
            <button class="btn btn-primary mt-2" @click="showCreateModal = true">
              <i class="bi bi-plus-lg me-1"></i> Create Your First Note
            </button>
          </div>

        </div>
      </template>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import NoteForm from './components/NoteForm.vue';
import LoginForm from './components/LoginForm.vue';

export default {
  components: {
    NoteForm,
    LoginForm
  },
  data() {
    return {
      isAuthenticated: false,
      notes: [],
      loadingNotes: false,
      isSaving: false,
      showCreateModal: false,
      showViewModal: false,
      showEditModal: false,
      currentNote: {},
      editingNote: {
        _id: '',
        title: '',
        content: '',
        labels: [],
        attachments: []
      },
      newAttachments: [],
      deletedAttachments: [],
      fileSizeError: '',
      newLabel: '',
      MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
      searchQuery: '',
      selectedLabel: '',
      sortOption: 'pinned',
      sortOptions: [
        { value: 'favourite', text: 'Favorites First' },
        { value: 'recent', text: 'Most Recent' },
        { value: 'title-asc', text: 'Title (A-Z)' },
        { value: 'title-desc', text: 'Title (Z-A)' }
      ],
      availableLabels: [],
    };
  },
  computed: {
    pinnedNotes() {
      return this.notes.filter(note => note.isPinned);
    },
    otherNotes() {
      return this.notes.filter(note => !note.isPinned);
    }
  },
  mounted() {
    this.isAuthenticated = !!localStorage.getItem('userId');
    if (this.isAuthenticated) {
      this.fetchNotes();
    }
  },
  methods: {
    goToLogin() {
      this.showCreateModal = false;
      this.showViewModal = false;
      this.showEditModal = false;
      this.$router.push('/login');
    },
    handleAuthSuccess() {
      this.isAuthenticated = true;
      this.fetchNotes();
    },
    async logout() {
      try {
        await axios.post('/api/logout');
        localStorage.removeItem('userId');
        this.isAuthenticated = false;
        this.notes = [];
      } catch (error) {
        console.error('Logout failed:', error);
      }
    },
    isImage(contentType) {
      const imageTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml'
      ];
      return imageTypes.includes(contentType);
    },
    getAttachmentUrl(fileId) {
      if (!fileId) return '';
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      return `${baseUrl}/api/files/${fileId}`;
    },
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]);
    },
    async fetchNotes() {
      this.loadingNotes = true;
      try {
        const response = await axios.get('/api/notes', {
          params: {
            q: this.searchQuery,
            label: this.selectedLabel,
            sort: this.sortOption
          }
        });

        // Handle both the notes and availableLabels from the response
        this.notes = response.data.notes || [];
        this.availableLabels = response.data.availableLabels || [];

        // Client-side sorting for title if needed
        if (this.sortOption === 'title-asc') {
          this.notes.sort((a, b) => a.title.localeCompare(b.title));
        } else if (this.sortOption === 'title-desc') {
          this.notes.sort((a, b) => b.title.localeCompare(a.title));
        }

      } catch (error) {
        console.error('Error fetching notes:', error);
      } finally {
        this.loadingNotes = false;
      }
    },
    addLabel() {
      const trimmedLabel = this.newLabel.trim();
      if (trimmedLabel && !this.editingNote.labels.includes(trimmedLabel)) {
        this.editingNote.labels.push(trimmedLabel);
        this.newLabel = '';

        // Update availableLabels if it's a new label
        if (!this.availableLabels.includes(trimmedLabel)) {
          this.availableLabels = [...this.availableLabels, trimmedLabel].sort();
        }
      }
    },
    editNote(note) {
      this.editingNote = {
        _id: note._id,
        title: note.title,
        content: note.content,
        labels: [...(note.labels || [])],
        attachments: [...(note.attachments || [])]
      };
      this.newAttachments = [];
      this.deletedAttachments = [];
      this.fileSizeError = '';
      this.newLabel = '';
      this.showEditModal = true;
    },
    async updateNote() {
      this.isSaving = true;
      this.fileSizeError = '';

      try {
        // Validate file sizes
        const oversizedFiles = this.newAttachments.filter(file => file.size > this.MAX_FILE_SIZE);
        if (oversizedFiles.length) {
          this.fileSizeError = `Some files exceed the 5MB limit (${oversizedFiles.map(f => f.name).join(', ')})`;
          return;
        }

        const formData = new FormData();
        formData.append('title', this.editingNote.title);
        formData.append('content', this.editingNote.content);
        formData.append('labels', JSON.stringify(this.editingNote.labels || []));
        formData.append('attachments', JSON.stringify(this.editingNote.attachments || []));

        // Add new files
        this.newAttachments.forEach(file => {
          formData.append('newAttachments', file);
        });

        // First update the note with new data
        await axios.put(`/api/notes/${this.editingNote._id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        // Then delete any removed attachments
        if (this.deletedAttachments.length) {
          await Promise.all(
            this.deletedAttachments.map(filename =>
              axios.delete(`/api/notes/${this.editingNote._id}/attachments/${filename}`)
            )
          );
        }

        this.showEditModal = false;
        this.fetchNotes();
      } catch (error) {
        console.error('Error updating note:', error);
        this.fileSizeError = error.response?.data?.error || 'Failed to save changes. Please try again.';
      } finally {
        this.isSaving = false;
      }
    },
    handleFileUpload(event) {
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/markdown'
      ];

      const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

      const files = Array.from(event.target.files);
      const validFiles = [];
      this.fileErrors = [];

      files.forEach(file => {
        if (!allowedTypes.includes(file.type)) {
          this.fileErrors.push(`${file.name} is not an allowed file type.`);
        } else if (file.size > MAX_FILE_SIZE) {
          this.fileErrors.push(`${file.name} exceeds the 20MB size limit.`);
        } else {
          validFiles.push(file);
        }
      });

      this.newAttachments = [...this.newAttachments, ...validFiles];
      event.target.value = ''; // Reset file input
    },
    removeAttachment(index) {
      // Add to deleted attachments list
      this.deletedAttachments.push(this.editingNote.attachments[index].filename);
      // Remove from display
      this.editingNote.attachments.splice(index, 1);
    },
    removeNewAttachment(index) {
      this.newAttachments.splice(index, 1);
    },
    removeLabel(index) {
      this.editingNote.labels.splice(index, 1);
    },
    addExistingLabel(label) {
      if (!this.editingNote.labels.includes(label)) {
        this.editingNote.labels.push(label);
      }
    },
    cancelEdit() {
      if (!this.isSaving) {
        this.showEditModal = false;
      }
    },
    async deleteNote(id) {
      try {
        await axios.delete(`/api/notes/${id}`);
        this.fetchNotes();
      } catch (error) {
        console.error('Error deleting note:', error);
      }

    },
    viewNote(note) {
      this.currentNote = note;
      this.showViewModal = true;
    },
    handleNoteCreated() {
      this.showCreateModal = false;
      this.fetchNotes();
    },
    async togglePin(note) {
      try {
        await axios.patch(`/api/notes/${note._id}`, {
          isPinned: !note.isPinned
        });
        this.fetchNotes();
      } catch (error) {
        console.error('Error toggling pin:', error);
      }
    },
    async toggleFavourite(note) {
      try {
        await axios.patch(`/api/notes/${note._id}`, {
          isFavourite: !note.isFavourite
        });
        this.fetchNotes();
      } catch (error) {
        console.error('Error toggling favorite:', error);
      }
    },
    handleImageError(event) {
      console.error('Image failed to load:', event.target.src);
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
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.pinned-highlight {
  border-left: 4px solid #ffc107;
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

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.badge {
  font-size: 0.85em;
  display: inline-flex;
  align-items: center;
}

.label-badge {
  cursor: pointer;
  transition: all 0.2s;
}

.label-badge:hover {
  opacity: 0.8;
  transform: translateY(-1px);
}

.btn-outline-warning {
  border-color: #ffc107;
  color: #ffc107;
}

.btn-outline-warning:hover {
  background-color: #ffc107;
  color: #000;
}

.btn-outline-danger {
  border-color: #dc3545;
  color: #dc3545;
}

.btn-outline-danger:hover {
  background-color: #dc3545;
  color: #fff;
}
</style>