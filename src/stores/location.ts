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
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 4000 }
    )
  })
}

const loadAMap = async () => {
  if (!AMAP_KEY || typeof window === 'undefined') return null
  ;(window as Window & { _AMapSecurityConfig?: { serviceHost?: string } })._AMapSecurityConfig = {
    serviceHost: AMAP_SERVICE_HOST,
  }
  if (!amapPromise) {
    amapPromise = AMapLoader.load({ key: AMAP_KEY, version: '2.0', plugins: ['AMap.Geocoder'] })
  }
  return amapPromise
}

/** 逆地理编码：坐标 → 地址 */
const reverseGeocode = async (coordinate: Coordinate) => {
  const AMap = await loadAMap()
  if (!AMap) throw new Error('高德地图 SDK 未加载')
  const geocoder = new AMap.Geocoder()
  return new Promise<string>((resolve, reject) => {
    geocoder.getAddress([coordinate.longitude, coordinate.latitude], (status: string, result: {
      info?: string; regeocode?: { formattedAddress?: string; formatted_address?: string }
    }) => {
      const addr = result?.regeocode?.formattedAddress || result?.regeocode?.formatted_address || ''
      if (status === 'complete' && addr) resolve(addr)
      else reject(new Error(result?.info || '地址解析失败'))
    })
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

  const displayAddress = computed(() => currentAddress.value || DEFAULT_ADDRESS)

  const setAddress = (address: string) => { currentAddress.value = address || DEFAULT_ADDRESS; lastAddressAt.value = Date.now() }
  const setCoordinate = (coordinate: Coordinate) => { currentCoordinate.value = coordinate }

  const refreshAddress = async (coordinate: Coordinate) => {
    const now = Date.now(); addressRefreshing.value = true
    try {
      const address = await reverseGeocode(coordinate)
      if (address) setAddress(address)
      else { currentAddress.value = ADDRESS_FAILED; lastAddressAt.value = now }
    } catch { currentAddress.value = ADDRESS_FAILED; lastAddressAt.value = now }
    finally { addressRefreshing.value = false }
  }

  const uploadCurrentCoordinate = async (coordinate: Coordinate) => {
    const token = getToken()
    if (!token || !hasApiBaseUrl()) return
    uploading.value = true
    try {
      const uploaded = await uploadCoordinateApi({ longitude: coordinate.longitude, latitude: coordinate.latitude }, token)
      setCoordinate(uploaded)
    } finally { uploading.value = false }
  }

  const refreshLocation = async () => {
    if (locating.value) return currentCoordinate.value
    locating.value = true; lastError.value = ''
    try {
      const coordinate = await getBrowserCoordinate(); setCoordinate(coordinate)
      try { await uploadCurrentCoordinate(coordinate) } catch (e) { lastError.value = e instanceof Error ? e.message : '位置上传失败' }
      return currentCoordinate.value
    } catch (e) { lastError.value = e instanceof Error ? e.message : '定位失败'; return null }
    finally { locating.value = false }
  }

  const refreshAddressNow = async () => {
    if (!currentCoordinate.value) {
      addressRefreshing.value = true
      const coord = await refreshLocation()
      if (!coord) { addressRefreshing.value = false; return currentAddress.value }
    }
    await refreshAddress(currentCoordinate.value!)
    return currentAddress.value
  }

  const refreshLocationNow = async () => {
    addressRefreshing.value = true
    const coordinate = await refreshLocation()
    if (coordinate) await refreshAddress(coordinate)
    else addressRefreshing.value = false
    return coordinate
  }

  const startLocationService = (tokenGetter?: TokenGetter) => {
    if (tokenGetter) getToken = tokenGetter
    if (typeof window === 'undefined' || serviceStarted.value) return
    serviceStarted.value = true
    void refreshLocationNow()
    locationTimer = window.setInterval(() => { void refreshLocation() }, COORDINATE_REFRESH_MS)
  }

  const stopLocationService = () => {
    if (locationTimer) { clearInterval(locationTimer); locationTimer = undefined }
    serviceStarted.value = false; locating.value = false; uploading.value = false
  }

  /** 正向地理编码：地址 → 经纬度（SDK Geocoder 插件） */
  const geocodeAddress = async (address: string): Promise<{ longitude: number; latitude: number } | null> => {
    if (!address) return null
    const AMap = await loadAMap()
    if (!AMap) return null
    const geocoder = new AMap.Geocoder()
    return new Promise((resolve) => {
      geocoder.getLocation(address, (status: string, result: {
        info?: string; geocodes?: { location: { lng: number; lat: number } }[]
      }) => {
        if (status === 'complete' && result.geocodes?.[0]?.location) {
          resolve({ longitude: result.geocodes[0].location.lng, latitude: result.geocodes[0].location.lat })
        } else { resolve(null) }
      })
    })
  }

  /** 获取当前 GPS 位置 */
  // ---- 选中的收货地址（存 localStorage） ----
  const SELECTED_KEY = 'ele3_selected_location'

  const selectedLocation = ref<Record<string, unknown> | null>(null)
  try {
    const raw = localStorage.getItem(SELECTED_KEY)
    if (raw) selectedLocation.value = JSON.parse(raw)
  } catch { selectedLocation.value = null }

  const saveSelectedLocation = (loc: Record<string, unknown>) => {
    selectedLocation.value = loc
    localStorage.setItem(SELECTED_KEY, JSON.stringify(loc))
  }

  const clearSelectedLocation = () => {
    selectedLocation.value = null
    localStorage.removeItem(SELECTED_KEY)
  }

  /** 无选中时自动从服务端取第一个位置 */
  const ensureSelectedLocation = async () => {
    if (selectedLocation.value) return
    try {
      const { listUserLocationsApi } = await import('@/api/user')
      const result = await listUserLocationsApi(1, 1)
      if (result.items?.length > 0) {
        saveSelectedLocation(result.items[0] as unknown as Record<string, unknown>)
      }
    } catch { /* 静默 */ }
  }

  const getPositionNow = async () => {
    await refreshLocationNow()
    return { coordinate: currentCoordinate.value, address: currentAddress.value }
  }

  const getDistance = async (lng2: number, lat2: number) => {
    const coord = currentCoordinate.value
    if (!coord) return -1
    const AMap = await loadAMap()
    if (!AMap?.GeometryUtil) return -1
    return AMap.GeometryUtil.distance([coord.longitude, coord.latitude], [lng2, lat2]) as number
  }

  return {
    currentAddress, currentCoordinate, displayAddress,
    locating, addressRefreshing, uploading, serviceStarted, lastError,
    setAddress, setCoordinate,
    refreshAddressNow, refreshLocationNow,
    startLocationService, stopLocationService,
    selectedLocation, saveSelectedLocation, clearSelectedLocation, ensureSelectedLocation,
    getDistance, geocodeAddress, getPositionNow,
  }
})
