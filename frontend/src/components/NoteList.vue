<!-- <template>
  <div>
    <h1>Notes</h1>
    <ul>
      <li v-for="note in notes" :key="note._id">
        <router-link :to="{ name: 'NoteDetail', params: { id: note._id } }">
          {{ note.title }}
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import axios from 'axios';

interface Note {
  _id: string;
  title: string;
}

export default defineComponent({
  setup() {
    const notes = ref<Note[]>([]);

    onMounted(async () => {
      try {
        const response = await axios.get<Note[]>('/api/notes');
        notes.value = response.data;
      } catch (error) {
        console.error('Error fetching notes:', error);
      }
    });

    return {
      notes
    };
  }
});
</script> -->

<template>
  <div class="col-md-4" v-for="note in notes" :key="note._id">
    <div class="card">
      <div class="card-body">
        <h5 class="card-title">{{ note.title }}</h5>
        <p class="card-text">{{ note.content }}</p>
        
        <div v-if="note.attachments && note.attachments.length" class="mt-3">
          <h6>Attachments:</h6>
          <div v-for="(attachment, index) in note.attachments" :key="index" class="mb-2">
            <img v-if="attachment.contentType.startsWith('image/')" 
                 :src="`/uploads/${attachment.filename}`" 
                 class="img-thumbnail" 
                 style="max-height: 100px;" />
            <div v-else>
              <a :href="`/uploads/${attachment.filename}`" target="_blank">
                {{ attachment.filename }}
              </a>
            </div>
          </div>
        </div>
        
        <button class="btn btn-primary" @click="editNote(note._id)">Edit</button>
        <button class="btn btn-danger" @click="deleteNote(note._id)">Delete</button>
      </div>
    </div>
  </div>
</template>