import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import NoteDetail from '../components/NoteDetail.vue';
import NoteForm from '../components/NoteForm.vue';
import LoginForm from '../components/LoginForm.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/note/:id',
    name: 'NoteDetail',
    component: NoteDetail,
    props: true 
  },
  {
    path: '/create',
    name: 'CreateNote',
    component: NoteForm
  },
  {
    path: '/edit/:id',
    name: 'EditNote',
    component: NoteForm,
    props: true
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginForm
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;
