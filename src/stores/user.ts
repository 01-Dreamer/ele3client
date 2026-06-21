import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  listThirdAccountBindingApi,
  loginApi,
  logoutApi,
  type LoginRequest,
  type ThirdAccountVO,
} from '@/api/auth'
import { getUserProfileApi } from '@/api/user'
import { hasApiBaseUrl } from '@/api/http'
import { useLocationStore } from '@/stores/location'

type UserRole = 'USER' | 'ADMIN' | 'MERCHANT' | 'RIDER' | string

export interface UserInfo {
  userId: string
  email: string
  role: UserRole
  status: number
  nickname?: string
  avatar?: string
  campusId?: string
}

interface StoredUserState {
  token: string
  userInfo: UserInfo | null
}

const STORAGE_KEY = 'ele3_user'

const readStoredState = (): StoredUserState => {
  if (typeof window === 'undefined') {
    return { token: '', userInfo: null }
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return { token: '', userInfo: null }
  }

  try {
    return JSON.parse(raw) as StoredUserState
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return { token: '', userInfo: null }
  }
}

const writeStoredState = (state: StoredUserState) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const removeStoredState = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(STORAGE_KEY)
}

export const useUserStore = defineStore('user', () => {
  const storedState = readStoredState()

  const token = ref(storedState.token)
  const userInfo = ref<UserInfo | null>(storedState.userInfo)
  const loading = ref(false)

  const isLoggedIn = computed(() => Boolean(token.value))
  const userId = computed(() => userInfo.value?.userId || '')
  const nickname = computed(() => userInfo.value?.nickname || userInfo.value?.email || '饿了么用户')
  const avatar = computed(() => userInfo.value?.avatar || '/default-avatar.svg')

  const persist = () => {
    writeStoredState({
      token: token.value,
      userInfo: userInfo.value
    })
  }

  const startLocationTracking = () => {
    const locationStore = useLocationStore()
    locationStore.startLocationService(() => token.value)
  }

  const stopLocationTracking = () => {
    const locationStore = useLocationStore()
    locationStore.stopLocationService()
  }

  const setLoginState = (nextToken: string, nextUserInfo: UserInfo) => {
    token.value = nextToken
    userInfo.value = nextUserInfo
    persist()
    startLocationTracking()
  }

  const login = async (payload: LoginRequest) => {
    loading.value = true

    try {
      if (!hasApiBaseUrl()) {
        throw new Error('请先在 .env 中配置 VITE_API_BASE_URL')
      }

      const data = await loginApi(payload)
      setLoginState(data.token, data.userInfo)
    } finally {
      loading.value = false
    }
  }

  const fetchProfile = async () => {
    if (!hasApiBaseUrl() || !token.value) {
      return userInfo.value
    }

    const profile = await getUserProfileApi(token.value)

    userInfo.value = {
      userId: userInfo.value?.userId || profile.userId || '',
      email: userInfo.value?.email || '',
      role: userInfo.value?.role || 'USER',
      status: userInfo.value?.status ?? 0,
      ...profile
    }
    persist()

    return userInfo.value
  }

  const setCampusId = (campusId: string) => {
    if (!userInfo.value) return
    userInfo.value = {
      ...userInfo.value,
      campusId
    }
    persist()
  }

  const syncBindings = async () => {
    if (!hasApiBaseUrl() || !token.value || !userInfo.value) {
      return []
    }

    const bindings = await listThirdAccountBindingApi(token.value)
    const campus = bindings.find((item: ThirdAccountVO) => item.provider === 'CAMPUS')

    if (campus?.openId) {
      setCampusId(campus.openId)
    } else if (userInfo.value.campusId) {
      setCampusId('')
    }

    return bindings
  }

  const logoutLocal = () => {
    stopLocationTracking()
    token.value = ''
    userInfo.value = null
    removeStoredState()
  }

  if (typeof window !== 'undefined' && token.value) {
    window.setTimeout(startLocationTracking, 0)
  }

  const logout = async () => {
    const currentToken = token.value

    try {
      if (hasApiBaseUrl() && currentToken) {
        await logoutApi(currentToken)
      }
    } catch {
      // 后端暂未提供退出接口时，仍然清理前端登录态。
    } finally {
      logoutLocal()
    }
  }

  return {
    token,
    userInfo,
    loading,
    isLoggedIn,
    userId,
    nickname,
    avatar,
    login,
    fetchProfile,
    logout,
    logoutLocal,
    startLocationTracking,
    stopLocationTracking,
    setCampusId,
    syncBindings,
    setLoginState
  }
})
