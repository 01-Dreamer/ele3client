<template>
  <div class="map-page">
    <header class="map-header">
      <h2>地图</h2>
    </header>

    <section class="map-wrap">
      <div ref="mapContainerRef" class="map-container"></div>

      <div v-if="mapMessage" class="map-message">
        {{ mapMessage }}
      </div>
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
      <div
        v-for="point in mapPoints"
        :key="point.name"
        class="position-item"
      >
        <span class="position-dot" :style="{ backgroundColor: point.color }"></span>
        <div>
          <strong>{{ point.name }}</strong>
          <p>{{ point.address }}</p>
          <small>{{ point.lng }}, {{ point.lat }}</small>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'

interface MapPoint {
  name: string
  address: string
  lng: number
  lat: number
  color: string
}

interface RouteSummary {
  distanceText: string
  durationText: string
}

type AMapNamespace = any

const mapContainerRef = ref<HTMLElement | null>(null)
const mapMessage = ref('')
const routeSummary = ref<RouteSummary>({
  distanceText: '规划中',
  durationText: '规划中'
})
let mapInstance: any = null
let drivingInstance: any = null

const amapKey = import.meta.env.VITE_AMAP_KEY
const amapServiceHost = import.meta.env.VITE_AMAP_SERVICE_HOST || ''

const mapPoints: [MapPoint, MapPoint] = [
  {
    name: '目的地',
    address: '天府软件园D区',
    lng: 104.066541,
    lat: 30.572269,
    color: '#0085ff'
  },
  {
    name: '骑手',
    address: '天府软件园A区附近',
    lng: 104.071021,
    lat: 30.575806,
    color: '#ff6b35'
  }
]

const mapCenter = computed<[number, number]>(() => {
  const lng = (mapPoints[0].lng + mapPoints[1].lng) / 2
  const lat = (mapPoints[0].lat + mapPoints[1].lat) / 2
  return [lng, lat]
})

// 初始化地图。
const initMap = async () => {
  if (!amapKey) {
    mapMessage.value = '请先在 .env 中配置高德地图 Key'
    return
  }

  if (!mapContainerRef.value) {
    return
  }

  mapMessage.value = '地图加载中...'

  try {
    ;(window as Window & {
      _AMapSecurityConfig?: { serviceHost?: string }
    })._AMapSecurityConfig = {
      serviceHost: amapServiceHost
    }

    const AMap = await AMapLoader.load({
      key: amapKey,
      version: '2.0',
      plugins: ['AMap.Scale', 'AMap.ToolBar', 'AMap.Driving']
    })

    mapInstance = new AMap.Map(mapContainerRef.value, {
      viewMode: '2D',
      zoom: 15,
      center: mapCenter.value,
      resizeEnable: true
    })

    addMarkers(AMap)
    addControls(AMap)
    planRoute(AMap)
    mapInstance.setFitView()
    mapMessage.value = ''
  } catch (error) {
    console.error(error)
    mapMessage.value = '地图加载失败，请检查高德地图 Key 和代理服务'
  }
}

// 添加地图标记。
const addMarkers = (AMap: AMapNamespace) => {
  const markers = mapPoints.map((point) => {
    return new AMap.Marker({
      position: [point.lng, point.lat],
      anchor: 'bottom-center',
      content: createMarkerContent(point)
    })
  })

  mapInstance.add(markers)
}

// 创建地图标记内容。
const createMarkerContent = (point: MapPoint) => {
  return `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      transform: translateY(4px);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    ">
      <div style="
        min-width: 68px;
        padding: 5px 8px;
        border-radius: 15px;
        background: ${point.color};
        color: #fff;
        font-size: 12px;
        line-height: 1;
        text-align: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.18);
      ">${point.name}</div>
      <div style="
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 3px solid #fff;
        background: ${point.color};
        box-shadow: 0 2px 7px rgba(0,0,0,0.24);
      "></div>
    </div>
  `
}

// 添加地图控件。
const addControls = (AMap: AMapNamespace) => {
  mapInstance.addControl(new AMap.Scale())
  mapInstance.addControl(new AMap.ToolBar({ position: 'RB' }))
}

// 规划地图路线。
const planRoute = (AMap: AMapNamespace) => {
  const riderPoint = mapPoints[1]
  const userPoint = mapPoints[0]

  routeSummary.value = {
    distanceText: '规划中',
    durationText: '规划中'
  }

  drivingInstance = new AMap.Driving({
    map: mapInstance,
    policy: AMap.DrivingPolicy.LEAST_TIME,
    hideMarkers: true,
    showTraffic: true,
    autoFitView: true
  })

  drivingInstance.search(
    [riderPoint.lng, riderPoint.lat],
    [userPoint.lng, userPoint.lat],
    (status: string, result: any) => {
      if (status !== 'complete') {
        routeSummary.value = {
          distanceText: '暂无结果',
          durationText: '暂无结果'
        }
        return
      }

      const route = result?.routes?.[0]

      if (!route) {
        routeSummary.value = {
          distanceText: '暂无结果',
          durationText: '暂无结果'
        }
        return
      }

      routeSummary.value = {
        distanceText: formatDistance(route.distance),
        durationText: formatDuration(route.time)
      }
    }
  )
}

// 格式化距离。
const formatDistance = (distance: number) => {
  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(1)} km`
  }

  return `${Math.round(distance)} m`
}

// 格式化时间。
const formatDuration = (seconds: number) => {
  const minutes = Math.max(1, Math.round(seconds / 60))
  return `${minutes} 分钟`
}

onMounted(initMap)

onUnmounted(() => {
  drivingInstance?.clear()
  mapInstance?.destroy()
  drivingInstance = null
  mapInstance = null
})
</script>

<style scoped>
.map-page {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.map-header {
  height: 52px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 18px;
  background-image: linear-gradient(90deg, #0af, #0085ff);
}

.map-header h2 {
  margin: 0;
  color: #ffffff;
  font-size: 20px;
  font-weight: 600;
}

.map-wrap {
  position: relative;
  height: 430px;
  margin: 12px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #eaf5ff;
}

.map-container {
  width: 100%;
  height: 100%;
}

.map-message {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: #666666;
  font-size: 14px;
  line-height: 1.5;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.86);
}

.route-card,
.position-card {
  margin: 0 12px 16px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #ffffff;
}

.route-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.route-item {
  min-height: 72px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
}

.route-item:first-child {
  border-right: 1px solid #f0f0f0;
}

.route-item span {
  color: #666666;
  font-size: 13px;
}

.route-item strong {
  color: #0085ff;
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
}

.position-item {
  min-height: 70px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 13px 14px;
  border-bottom: 1px solid #f0f0f0;
}

.position-item:last-child {
  border-bottom: none;
}

.position-dot {
  width: 11px;
  height: 11px;
  margin-top: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}

.position-item strong {
  color: #222222;
  font-size: 15px;
  font-weight: 600;
}

.position-item p {
  margin: 6px 0 0;
  color: #666666;
  font-size: 13px;
}

.position-item small {
  display: block;
  margin-top: 4px;
  color: #999999;
  font-size: 12px;
}
</style>
