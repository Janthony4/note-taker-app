<template>
  <div class="login-container">
    <div class="card">
      <div class="card-body">
        <h3 class="text-center mb-4">{{ isRegister ? 'Register' : 'Login' }}</h3>
        <form @submit.prevent="handleSubmit">
          <div class="mb-3">
            <label class="form-label">Username</label>
            <input 
              type="text" 
              class="form-control" 
              v-model="username" 
              required
            >
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input 
              type="password" 
              class="form-control" 
              v-model="password" 
              required
            >
          </div>
          <div v-if="error" class="alert alert-danger">
            {{ error }}
          </div>
          <div class="d-grid gap-2">
            <button type="submit" class="btn btn-primary">
              {{ isRegister ? 'Register' : 'Login' }}
            </button>
            <button 
              type="button" 
              class="btn btn-link" 
              @click="isRegister = !isRegister"
            >
              {{ isRegister ? 'Already have an account? Login' : 'Need an account? Register' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      username: '',
      password: '',
      isRegister: false,
      error: ''
    };
  },
  methods: {
    async handleSubmit() {
      try {
        this.error = '';
        const endpoint = this.isRegister ? '/api/register' : '/api/login';
        const response = await axios.post(endpoint, {
          username: this.username,
          password: this.password
        });
        
        if (response.data.userId) {
          localStorage.setItem('userId', response.data.userId);
          this.$emit('auth-success');
        }
      } catch (error) {
        this.error = error.response?.data?.error || 'Authentication failed';
      }
    }
  }
};
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 2rem auto;
}
</style>