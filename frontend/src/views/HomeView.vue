<template>
  <div>
    <router-link to="/create">Create Note</router-link>
    <NoteList />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import NoteList from '../components/NoteList.vue';

export default defineComponent({
  components: {
    NoteList
  }
});
</script>
