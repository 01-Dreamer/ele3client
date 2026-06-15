import { createRouter, createWebHistory } from 'vue-router'
import ChatView from '../views/ChatView.vue'
import HomeView from '../views/HomeView.vue'
import LocationView from '../views/LocationView.vue'
import LoginView from '../views/LoginView.vue'
import MessageView from '../views/MessageView.vue'
import OrderView from '../views/OrderView.vue'
import ProfileView from '../views/ProfileView.vue'
import RegisterView from '../views/RegisterView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/home',
      redirect: '/'
    },
    {
      path: '/chat',
      name: 'chat',
      component: ChatView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/location',
      name: 'location',
      component: LocationView
    },
    {
      path: '/message',
      name: 'message',
      component: MessageView
    },
    {
      path: '/order',
      name: 'order',
      component: OrderView
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    }
  ]
})

export default router
