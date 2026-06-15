import { createRouter, createWebHistory } from 'vue-router'
import ChatView from '../views/ChatView.vue'
import HomeView from '../views/HomeView.vue'
import LocationView from '../views/LocationView.vue'
import LoginView from '../views/LoginView.vue'
import MapView from '../views/MapView.vue'
import MessageView from '../views/MessageView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import OrderView from '../views/OrderView.vue'
import ProfileView from '../views/ProfileView.vue'
import RegisterView from '../views/RegisterView.vue'
import ShopView from '../views/ShopView.vue'

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
      path: '/map',
      name: 'map',
      component: MapView
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
    },
    {
      path: '/shop',
      name: 'shop',
      component: ShopView
    },
    {
      path: '/shop/:id',
      name: 'shop-detail',
      component: ShopView
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView
    }
  ]
})

export default router
