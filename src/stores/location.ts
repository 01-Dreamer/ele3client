import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import AMapLoader from '@amap/amap-jsapi-loader'
import { hasApiBaseUrl } from '@/api/http'
import { uploadCoordinateApi } from '@/api/location'

interface Coordinate {
  longitude: number
  latitude: number
  updateTime?: number
}

type TokenGetter = () => string
type AMapNamespace = any

const COORDINATE_REFRESH_MS = 5000
const DEFAULT_ADDRESS = '定位中...'
const ADDRESS_FAILED = '地址解析失败'
const AMAP_KEY = import.meta.env.VITE_AMAP_KEY
const AMAP_SERVICE_HOST = import.meta.env.VITE_AMAP_SERVICE_HOST || ''

let amapPromise: Promise<AMapNamespace> | null = null
let geocoderInstance: any = null

const toCoordinate = (position: GeolocationPosition): Coordinate => ({
  longitude: position.coords.longitude,
  latitude: position.coords.latitude,
  updateTime: Date.now(),
})

const getBrowserCoordinate = () => {
  return new Promise<Coordinate>((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('当前浏览器不支持定位'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(toCoordinate(position)),
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 4000,
      }
    )
  })
}

const formatCoordinateText = (coordinate: Coordinate | null) => {
  if (!coordinate) return ''
  return `${coordinate.longitude.toFixed(6)}, ${coordinate.latitude.toFixed(6)}`
}

const loadAMap = async () => {
  if (!AMAP_KEY || typeof window === 'undefined') {
    return null
  }

  // 通过代理 serviceHost 访问，nginx 附加 jscode
  ;(window as Window & {
    _AMapSecurityConfig?: { serviceHost?: string }
  })._AMapSecurityConfig = {
    serviceHost: AMAP_SERVICE_HOST,
  }

  if (!amapPromise) {
    amapPromise = AMapLoader.load({
      key: AMAP_KEY,
      version: '2.0',
      plugins: ['AMap.Geocoder'],
    })
  }

  return amapPromise
}

const reverseGeocode = async (coordinate: Coordinate) => {
  const AMap = await loadAMap()

  if (!AMap) {
    throw new Error('高德地图 SDK 未加载')
  }

  if (!geocoderInstance) {
    geocoderInstance = new AMap.Geocoder()
  }

  return new Promise<string>((resolve, reject) => {
    geocoderInstance.getAddress(
      [coordinate.longitude, coordinate.latitude],
      (status: string, result: {
        info?: string
        regeocode?: {
          formattedAddress?: string
          formatted_address?: string
        }
      }) => {
        const address = result?.regeocode?.formattedAddress || result?.regeocode?.formatted_address || ''

        if (status === 'complete' && address) {
          resolve(address)
          return
        }

        reject(new Error(result?.info || address || '地址解析失败'))
      }
    )
  })
}

export const useLocationStore = defineStore('location', () => {
  const currentAddress = ref(DEFAULT_ADDRESS)
  const currentCoordinate = ref<Coordinate | null>(null)
  const locating = ref(false)
  const addressRefreshing = ref(false)
  const uploading = ref(false)
  const serviceStarted = ref(false)
  const lastAddressAt = ref(0)
  const lastError = ref('')

  let locationTimer: number | undefined
  let getToken: TokenGetter = () => ''

  const coordinateText = computed(() => formatCoordinateText(currentCoordinate.value))
  const displayAddress = computed(() => currentAddress.value || DEFAULT_ADDRESS)

  const setAddress = (address: string) => {
    currentAddress.value = address || DEFAULT_ADDRESS
    lastAddressAt.value = Date.now()
  }

  const setCoordinate = (coordinate: Coordinate) => {
    currentCoordinate.value = coordinate
  }

  const refreshAddress = async (coordinate: Coordinate) => {
    const now = Date.now()
    addressRefreshing.value = true

    try {
      const address = await reverseGeocode(coordinate)
      if (address) {
        setAddress(address)
      } else {
        currentAddress.value = ADDRESS_FAILED
        lastAddressAt.value = now
      }
    } catch {
      currentAddress.value = ADDRESS_FAILED
      lastAddressAt.value = now
    } finally {
      addressRefreshing.value = false
    }
  }

  const uploadCurrentCoordinate = async (coordinate: Coordinate) => {
    const token = getToken()

    if (!token || !hasApiBaseUrl()) {
      return
    }

    uploading.value = true

    try {
      const uploaded = await uploadCoordinateApi(
        {
          longitude: coordinate.longitude,
          latitude: coordinate.latitude,
        },
        token
      )
      setCoordinate(uploaded)
    } finally {
      uploading.value = false
    }
  }

  const refreshLocation = async () => {
    if (locating.value) {
      return currentCoordinate.value
    }

    locating.value = true
    lastError.value = ''

    try {
      const coordinate = await getBrowserCoordinate()
      setCoordinate(coordinate)

      try {
        await uploadCurrentCoordinate(coordinate)
      } catch (error) {
        lastError.value = error instanceof Error ? error.message : '位置上传失败'
      }

      return currentCoordinate.value
    } catch (error) {
      lastError.value = error instanceof Error ? error.message : '定位失败'
      return null
    } finally {
      locating.value = false
    }
  }

  const refreshAddressNow = async () => {
    if (!currentCoordinate.value) {
      addressRefreshing.value = true
      const coordinate = await refreshLocation()

      if (!coordinate) {
        addressRefreshing.value = false
        return currentAddress.value
      }
    }

    const coordinate = currentCoordinate.value

    if (!coordinate) {
      return currentAddress.value
    }

    await refreshAddress(coordinate)
    return currentAddress.value
  }

  const refreshLocationNow = async () => {
    addressRefreshing.value = true
    const coordinate = await refreshLocation()

    if (coordinate) {
      await refreshAddress(coordinate)
    } else {
      addressRefreshing.value = false
    }

    return coordinate
  }

  const startLocationService = (tokenGetter?: TokenGetter) => {
    if (tokenGetter) {
      getToken = tokenGetter
    }

    if (typeof window === 'undefined' || serviceStarted.value) {
      return
    }

    serviceStarted.value = true
    void refreshLocationNow()

    locationTimer = window.setInterval(() => {
      void refreshLocation()
    }, COORDINATE_REFRESH_MS)
  }

  const stopLocationService = () => {
    if (locationTimer) {
      window.clearInterval(locationTimer)
      locationTimer = undefined
    }

    serviceStarted.value = false
    locating.value = false
    uploading.value = false
  }

  return {
    currentAddress,
    currentCoordinate,
    coordinateText,
    displayAddress,
    locating,
    addressRefreshing,
    uploading,
    serviceStarted,
    lastError,
    setAddress,
    setCoordinate,
    refreshAddressNow,
    refreshLocationNow,
    startLocationService,
    stopLocationService,
  }
})
