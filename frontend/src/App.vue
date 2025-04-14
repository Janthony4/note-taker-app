<!-- <template>
  <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <div class="container-fluid">
        <span class="navbar-brand mb-0 h1">NoteTaker</span>
      </div>
    </nav>

    <div class="container mt-4">
      <div class="row">
        <div class="col-md-4" v-for="note in notes" :key="note.id">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">{{ note.title }}</h5>
              <p class="card-text">{{ note.content }}</p>
              <button class="btn btn-primary" @click="editNote(note.id)">Edit</button>
              <button class="btn btn-danger" @click="deleteNote(note.id)">Delete</button>
              <button class="btn btn-info" @click="viewNote(note.id)">View</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      notes: [
        { id: 1, title: 'First Note', content: 'This is the content of the first note.' },
        { id: 2, title: 'Second Note', content: 'This is the content of the second note.' },
        { id: 3, title: 'Third Note', content: 'This is the content of the third note.' },
      ],
    };
  },
  methods: {
    editNote(id) {
      alert(`Editing note with ID: ${id}`);
      // You can add your logic here for editing the note.
    },
    deleteNote(id) {
      this.notes = this.notes.filter(note => note.id !== id);
      alert(`Deleted note with ID: ${id}`);
    },
    viewNote(id) {
      alert(`Viewing note with ID: ${id}`);
      // You can add your logic here to show the note in full view.
    }
  }
};
</script>

<style scoped>
/* Add any additional styling you need */
</style>
-->
<template>
  <div>
    <!-- Header -->
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <div class="container-fluid">
        <span class="navbar-brand mb-0 h1">NoteTaker</span>
      </div>
    </nav>

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

export default {
  data() {
    return {
      notes: []
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
    }
  }
};
</script>

<style scoped>

</style>

