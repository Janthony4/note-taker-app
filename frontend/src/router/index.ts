import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import NoteDetail from '../components/NoteDetail.vue';
import NoteForm from '../components/NoteForm.vue'; // This will be reused for both creating and editing

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
    props: true  // Pass the 'id' as a prop to the NoteDetail component
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
    props: true  // Pass the 'id' as a prop to the NoteForm component
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;
