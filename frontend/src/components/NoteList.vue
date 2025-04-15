<template>
  <div class="col-md-4 mb-4" v-for="note in notes" :key="note._id">
    <div class="card h-100">
      <div class="card-body">
        <h5 class="card-title">{{ note.title }}</h5>
        <p class="card-text">{{ note.content }}</p>
        
        <!-- Attachments Section -->
        <div v-if="note.attachments && note.attachments.length" class="mt-3">
          <h6 class="text-muted">Attachments:</h6>
          <div class="d-flex flex-wrap gap-2">
            <div v-for="(attachment, index) in note.attachments" :key="index">
              <p class="text-muted small">Debug: {{ getAttachmentUrl(attachment.filename) }}</p>
              <!-- Display images -->
              <img v-if="isImage(attachment.contentType)" 
                   :src="getAttachmentUrl(attachment.filename)" 
                   class="img-thumbnail" 
                   style="max-height: 150px; max-width: 100%; object-fit: contain;"
                   :alt="attachment.originalname" />
              
              <!-- Display download links for non-images -->
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
        
        <div class="mt-3 d-flex gap-2">
          <button class="btn btn-sm btn-primary" @click="editNote(note._id)">Edit</button>
          <button class="btn btn-sm btn-danger" @click="deleteNote(note._id)">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    isImage(contentType) {
      return contentType && contentType.startsWith('image/');
    },
    getAttachmentUrl(filename) {
      return `${import.meta.env.VITE_API_BASE_URL || ''}/uploads/${filename}`;
    }
  }
}
</script>

<style scoped>
.card {
  transition: transform 0.2s;
}
.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}
</style>