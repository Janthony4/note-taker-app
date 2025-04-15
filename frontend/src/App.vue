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
        <div class="col-md-4" v-for="note in notes" :key="note._id">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">{{ note.title }}</h5>
              <p class="card-text">{{ note.content }}</p>
              <button class="btn btn-primary" @click="editNote(note._id)">Edit</button>
              <button class="btn btn-danger" @click="deleteNote(note._id)">Delete</button>
              <button class="btn btn-info" @click="viewNote(note._id)">View</button>
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
          this.fetchNotes(); // Re-fetch notes after deletion
        })
        .catch(error => {
          console.error('Error deleting note:', error);
        });
    },
    viewNote(id) {
      this.$router.push(`/note/${id}`);
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
}
</style>