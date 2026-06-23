<template>
  <div class="map-page">
    <header class="map-header">
      <h2>配送地图</h2>
    </header>

    <section class="map-wrap">
      <div ref="mapContainerRef" class="map-container"></div>
      <div v-if="mapMessage" class="map-message">{{ mapMessage }}</div>
    </section>

    <section class="route-card">
      <div class="route-item">
        <span>距离</span>
        <strong>{{ routeSummary.distanceText }}</strong>
      </div>
      <div class="route-item">
        <span>时间</span>
        <strong>{{ routeSummary.durationText }}</strong>
      </div>
    </section>

    <section class="position-card">
      <div class="position-item">
        <span class="position-dot" style="background:#ff6b35"></span>
        <div>
          <strong>骑手位置</strong>
          <p v-if="riderCoord">{{ riderCoord.longitude.toFixed(6) }}, {{ riderCoord.latitude.toFixed(6) }}</p>
        </div>
      </div>
      <div class="position-item">
        <span class="position-dot" style="background:#0085ff"></span>
        <div>
          <strong>收货地址</strong>
          <p v-if="destCoord">{{ destCoord.longitude.toFixed(6) }}, {{ destCoord.latitude.toFixed(6) }}</p>
        </div>
      </div>
      <div class="position-item">
        <span class="position-dot" style="background:#67c23a"></span>
        <div>
          <strong>我的位置</strong>
          <p v-if="myCoord">{{ myCoord.longitude.toFixed(6) }}, {{ myCoord.latitude.toFixed(6) }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AMapLoader from '@amap/amap-jsapi-loader'
import { getCoordinateApi } from '@/api/location'
import { useLocationStore } from '@/stores/location'

interface Coord {
  longitude: number
  latitude: number
}

interface RouteSummary {
  distanceText: string
  durationText: string
}

type AMapNamespace = any

const route = useRoute()
const locationStore = useLocationStore()

const mapContainerRef = ref<HTMLElement | null>(null)
const mapMessage = ref('')
const routeSummary = ref<RouteSummary>({ distanceText: '规划中', durationText: '规划中' })

const riderCoord = ref<Coord | null>(null)
const destCoord = ref<Coord | null>(null)
const myCoord = computed<Coord | null>(() => {
  const c = locationStore.currentCoordinate
  return c ? { longitude: c.longitude, latitude: c.latitude } : null
})

let mapInstance: any = null
let drivingInstance: any = null
let pollTimer: number | undefined
let amapInstance: any = null

const amapKey = import.meta.env.VITE_AMAP_KEY
const amapServiceHost = import.meta.env.VITE_AMAP_SERVICE_HOST || ''

const initData = async () => {
  const dlng = route.query.destLng
  const dlat = route.query.destLat
  if (dlng && dlat) {
    destCoord.value = { longitude: Number(dlng), latitude: Number(dlat) }
  }

  const promises: Promise<void>[] = []
  const riderId = route.query.riderId as string
  if (riderId) {
    promises.push(
      getCoordinateApi(riderId).then(c => {
        riderCoord.value = { longitude: c.longitude, latitude: c.latitude }
      }).catch(() => {})
    )
  }

  if (!locationStore.currentCoordinate) {
    promises.push(locationStore.refreshLocationNow())
  }

  await Promise.all(promises)
}

const initMap = async () => {
  if (!amapKey) { mapMessage.value = '请配置高德地图 Key'; return }
  if (!mapContainerRef.value) return

  mapMessage.value = '地图加载中...'

  try {
    ;(window as any)._AMapSecurityConfig = { serviceHost: amapServiceHost }

    amapInstance = await AMapLoader.load({
      key: amapKey,
      version: '2.0',
      plugins: ['AMap.Scale', 'AMap.ToolBar', 'AMap.Driving'],
    })
    const AMap = amapInstance

    const center = destCoord.value || riderCoord.value || (myCoord.value ? [myCoord.value.longitude, myCoord.value.latitude] : [104.06, 30.57])

    mapInstance = new AMap.Map(mapContainerRef.value, {
      viewMode: '2D',
      zoom: 14,
      center: [center.longitude, center.latitude],
      resizeEnable: true,
    })

    addMarkers(AMap)
    addControls(AMap)
    if (riderCoord.value && destCoord.value) planRoute(AMap)
    mapInstance.setFitView()
    mapMessage.value = ''
  } catch {
    mapMessage.value = '地图加载失败'
  }
}

const createMarker = (AMap: AMapNamespace, coord: Coord, color: string) => {
  return new AMap.Marker({
    position: [coord.longitude, coord.latitude],
    anchor: 'center',
    content: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
  })
}

const addMarkers = (AMap: AMapNamespace) => {
  mapInstance.clearMap()
  if (riderCoord.value) mapInstance.add(createMarker(AMap, riderCoord.value, '#ff6b35'))
  if (destCoord.value) mapInstance.add(createMarker(AMap, destCoord.value, '#0085ff'))
  if (myCoord.value) mapInstance.add(createMarker(AMap, myCoord.value, '#67c23a'))
}

const addControls = (AMap: AMapNamespace) => {
  mapInstance.addControl(new AMap.Scale())
  mapInstance.addControl(new AMap.ToolBar({ position: 'RB' }))
}

const planRoute = (AMap: AMapNamespace) => {
  if (!riderCoord.value || !destCoord.value) return

  if (drivingInstance) { drivingInstance.clear(); drivingInstance = null }
  drivingInstance = new AMap.Driving({
    map: mapInstance,
    policy: AMap.DrivingPolicy.LEAST_TIME,
    hideMarkers: true,
    autoFitView: true,
  })

  drivingInstance.search(
    [riderCoord.value.longitude, riderCoord.value.latitude],
    [destCoord.value.longitude, destCoord.value.latitude],
    (status: string, result: any) => {
      if (status !== 'complete' || !result?.routes?.[0]) {
        routeSummary.value = { distanceText: '暂无结果', durationText: '暂无结果' }
        return
      }
      const route = result.routes[0]
      routeSummary.value = {
        distanceText: route.distance >= 1000 ? `${(route.distance / 1000).toFixed(1)} km` : `${Math.round(route.distance)} m`,
        durationText: `${Math.max(1, Math.round(route.time / 60))} 分钟`,
      }
    }
  )
}

const refreshRider = async () => {
  const riderId = route.query.riderId as string
  if (!riderId) return
  try {
    const c = await getCoordinateApi(riderId)
    riderCoord.value = { longitude: c.longitude, latitude: c.latitude }
  } catch { /* */ }
}

const refreshPositions = async () => {
  await Promise.all([
    refreshRider(),
    locationStore.refreshLocation(),
  ])
  if (mapInstance && amapInstance) {
    addMarkers(amapInstance)
    if (riderCoord.value && destCoord.value) planRoute(amapInstance)
  }
}

onMounted(async () => {
  await initData()
  initMap()
  pollTimer = window.setInterval(refreshPositions, 10000)
})

onUnmounted(() => {
  drivingInstance?.clear()
  mapInstance?.destroy()
  drivingInstance = null
  mapInstance = null
  if (pollTimer) { clearInterval(pollTimer); pollTimer = undefined }
})

</script>

<style scoped>
.map-page { min-height: 100%; display: flex; flex-direction: column; background: #f5f5f5; }
.map-header { height: 52px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background-image: linear-gradient(90deg, #0af, #0085ff); }
.map-header h2 { margin: 0; color: #fff; font-size: 20px; font-weight: 600; }
.map-wrap { position: relative; height: 380px; margin: 10px; border-radius: 8px; overflow: hidden; background: #eaf5ff; }
.map-container { width: 100%; height: 100%; }
.map-message { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #666; font-size: 14px; background: rgba(255,255,255,0.85); }

.route-card, .position-card { margin: 0 10px 12px; border-radius: 8px; overflow: hidden; background: #fff; }
.route-card { display: grid; grid-template-columns: 1fr 1fr; }
.route-item { min-height: 68px; display: flex; flex-direction: column; justify-content: center; gap: 6px; padding: 0 16px; }
.route-item:first-child { border-right: 1px solid #f0f0f0; }
.route-item span { color: #666; font-size: 13px; }
.route-item strong { color: #0085ff; font-size: 22px; font-weight: 700; }

.position-item { min-height: 64px; display: flex; align-items: flex-start; gap: 10px; padding: 13px 14px; border-bottom: 1px solid #f0f0f0; }
.position-item:last-child { border-bottom: none; }
.position-dot { width: 10px; height: 10px; margin-top: 5px; border-radius: 50%; flex-shrink: 0; }
.position-item strong { color: #222; font-size: 15px; font-weight: 600; }
.position-item p { margin: 4px 0 0; color: #666; font-size: 13px; }
</style>
