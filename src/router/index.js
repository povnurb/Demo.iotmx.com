import { createRouter, createWebHistory } from 'vue-router'
import Alarmas from '../views/Alarmas.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: Alarmas
  }   
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
