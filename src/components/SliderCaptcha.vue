<template>
  <el-dialog
    :model-value="visible"
    title="安全验证"
    width="340px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="true"
    align-center
    @close="handleClose"
  >
    <div class="slider-captcha">
      <div
        ref="imageWrapRef"
        class="captcha-stage"
        :style="{ width: `${renderWidth}px`, height: `${renderHeight}px` }"
      >
        <template v-if="captcha">
          <img
            class="captcha-bg"
            :src="backgroundImageUrl"
            alt="验证码背景"
            draggable="false"
          />
          <img
            class="captcha-block"
            :src="templateImageUrl"
            alt="验证码滑块"
            draggable="false"
            :style="{
              width: `${templateRenderWidth}px`,
              height: `${templateRenderHeight}px`,
              transform: `translate3d(${blockLeft}px, 0, 0)`
            }"
          />
        </template>

        <div v-else class="captcha-empty">
          {{ loading ? '验证码加载中...' : '验证码加载失败' }}
        </div>
      </div>

      <div ref="trackRef" class="slider-track">
        <div
          class="slider-fill"
          :style="{ width: `${blockLeft + 20}px` }"
        ></div>
        <div
          class="slider-thumb"
          :class="{ success: verifyPassed, moving: isDragging }"
          :style="{ left: `${blockLeft}px` }"
          @mousedown="startDrag"
          @touchstart.prevent="startDrag"
        >
          <el-icon v-if="!verifyPassed" size="18"><ArrowRightBold /></el-icon>
          <el-icon v-else size="18"><Check /></el-icon>
        </div>
      </div>

      <p class="captcha-tip">
        {{ verifyPassed ? '验证通过' : '拖动滑块，使图片拼合完整' }}
      </p>

      <div class="captcha-actions">
        <el-button size="small" @click="refreshCaptcha" :loading="loading">
          刷新验证码
        </el-button>
        <el-button
          v-if="verifyPassed"
          type="primary"
          size="small"
          @click="handleConfirm"
        >
          确认
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowRightBold, Check } from '@element-plus/icons-vue'
import { showErrorMessage } from '@/api/http'
import {
  getSliderCaptchaApi,
  type SliderCaptchaTrack,
  type SliderCaptchaTrackPoint,
  type SliderCaptchaVO,
} from '@/api/risk'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success', data: { captchaId: string; captchaData: SliderCaptchaTrack }): void
  (e: 'cancel'): void
}>()

const STAGE_MAX_WIDTH = 280
const THUMB_SIZE = 40

const loading = ref(false)
const captcha = ref<SliderCaptchaVO | null>(null)
const blockLeft = ref(0)
const verifyPassed = ref(false)
const isDragging = ref(false)

const imageWrapRef = ref<HTMLDivElement | null>(null)
const trackRef = ref<HTMLDivElement | null>(null)

const trackList = ref<SliderCaptchaTrackPoint[]>([])
let dragStartClientX = 0
let dragStartClientY = 0
let startLeft = 0
let startTime = 0
let stopTime = 0

const bgWidth = computed(() => captcha.value?.backgroundImageWidth || STAGE_MAX_WIDTH)
const bgHeight = computed(() => captcha.value?.backgroundImageHeight || 160)
const renderScale = computed(() => Math.min(1, STAGE_MAX_WIDTH / bgWidth.value))
const renderWidth = computed(() => Math.round(bgWidth.value * renderScale.value))
const renderHeight = computed(() => Math.round(bgHeight.value * renderScale.value))
const templateRenderWidth = computed(() => Math.round((captcha.value?.templateImageWidth || 0) * renderScale.value))
const templateRenderHeight = computed(() => Math.round((captcha.value?.templateImageHeight || 0) * renderScale.value))

const backgroundImageUrl = computed(() => normalizeImage(captcha.value?.backgroundImage || ''))
const templateImageUrl = computed(() => normalizeImage(captcha.value?.templateImage || ''))

const normalizeImage = (image: string) => {
  if (!image) return ''
  if (image.startsWith('data:') || image.startsWith('http://') || image.startsWith('https://')) {
    return image
  }
  return `data:image/png;base64,${image}`
}

const getClientPoint = (e: MouseEvent | TouchEvent) => {
  if ('touches' in e) {
    const touch = e.touches[0]
    return touch ? { x: touch.clientX, y: touch.clientY } : null
  }

  return { x: e.clientX, y: e.clientY }
}

const maxLeft = () => {
  const trackWidth = trackRef.value?.clientWidth || renderWidth.value
  const imageMaxLeft = Math.max(0, renderWidth.value - templateRenderWidth.value)
  return Math.min(trackWidth - THUMB_SIZE, imageMaxLeft)
}

const appendTrack = (type: SliderCaptchaTrackPoint['type'], clientY?: number) => {
  if (!startTime) return

  const elapsed = Date.now() - startTime
  const x = blockLeft.value / renderScale.value
  const rawY = clientY === undefined ? 0 : (clientY - dragStartClientY) / renderScale.value
  const wobble = type === 'DOWN' ? 0 : Math.sin((trackList.value.length + 1) * 0.7) * 2

  trackList.value.push({
    x: Number(x.toFixed(2)),
    y: Number((rawY + wobble).toFixed(2)),
    t: elapsed,
    type,
  })
}

const refreshCaptcha = async () => {
  loading.value = true
  verifyPassed.value = false
  blockLeft.value = 0
  trackList.value = []
  startTime = 0
  stopTime = 0

  try {
    captcha.value = await getSliderCaptchaApi()
    await nextTick()
  } catch (error) {
    captcha.value = null
    showErrorMessage(error)
  } finally {
    loading.value = false
  }
}

const startDrag = (e: MouseEvent | TouchEvent) => {
  if (!captcha.value || verifyPassed.value || loading.value) return

  const point = getClientPoint(e)
  if (!point) return

  dragStartClientX = point.x
  dragStartClientY = point.y
  startLeft = blockLeft.value
  startTime = Date.now()
  stopTime = 0
  trackList.value = []
  isDragging.value = true
  appendTrack('DOWN', point.y)

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', endDrag)
  document.addEventListener('touchmove', onDrag, { passive: false })
  document.addEventListener('touchend', endDrag)
}

const onDrag = (e: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return
  e.preventDefault()

  const point = getClientPoint(e)
  if (!point) return

  const delta = point.x - dragStartClientX
  blockLeft.value = Math.max(0, Math.min(maxLeft(), startLeft + delta))
  appendTrack('MOVE', point.y)
}

const endDrag = (e?: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return

  const point = e ? getClientPoint(e) : null
  stopTime = Math.max(Date.now(), startTime + 420)
  appendTrack('UP', point?.y)
  isDragging.value = false

  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', endDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', endDrag)

  if (blockLeft.value < 8) {
    resetDrag()
    return
  }

  verifyPassed.value = true
}

const resetDrag = () => {
  blockLeft.value = 0
  verifyPassed.value = false
  trackList.value = []
  startTime = 0
  stopTime = 0
}

const buildTrackList = () => {
  const finalX = blockLeft.value / renderScale.value
  const duration = Math.max(420, stopTime - startTime)

  if (trackList.value.length >= 12) {
    const lastIndex = trackList.value.length - 1
    return trackList.value.map((track, index) => ({
      ...track,
      t: index === lastIndex ? duration : Math.min(track.t, duration - 1),
    }))
  }

  const points: SliderCaptchaTrackPoint[] = []
  const count = 18

  for (let i = 0; i < count; i += 1) {
    const progress = i / (count - 1)
    const eased = 1 - Math.pow(1 - progress, 2.2)

    points.push({
      x: Number((finalX * eased).toFixed(2)),
      y: Number((Math.sin(i * 0.8) * 2.5).toFixed(2)),
      t: Number((duration * progress).toFixed(2)),
      type: i === 0 ? 'DOWN' : i === count - 1 ? 'UP' : 'MOVE',
    })
  }

  return points
}

const buildCaptchaTrack = (): SliderCaptchaTrack | null => {
  if (!captcha.value || !startTime) return null

  const left = Math.round(blockLeft.value / renderScale.value)

  return {
    bgImageWidth: captcha.value.backgroundImageWidth,
    bgImageHeight: captcha.value.backgroundImageHeight,
    templateImageWidth: captcha.value.templateImageWidth,
    templateImageHeight: captcha.value.templateImageHeight,
    startTime,
    stopTime: Math.max(stopTime, startTime + 420),
    left,
    top: 0,
    trackList: buildTrackList(),
    data: captcha.value.data,
  }
}

const handleConfirm = () => {
  const track = buildCaptchaTrack()

  if (!captcha.value || !track) {
    ElMessage.warning('请先完成滑块验证')
    return
  }

  emit('success', {
    captchaId: captcha.value.id,
    captchaData: track,
  })
  emit('update:visible', false)
}

const handleClose = () => {
  emit('update:visible', false)
  if (!verifyPassed.value) {
    emit('cancel')
  }
}

watch(
  () => props.visible,
  async (val) => {
    if (val) {
      await refreshCaptcha()
    } else {
      resetDrag()
    }
  }
)
</script>

<style scoped>
.slider-captcha {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.captcha-stage {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: #f3f6fb;
  user-select: none;
}

.captcha-bg,
.captcha-block {
  position: absolute;
  inset: 0 auto auto 0;
  display: block;
  height: 100%;
  object-fit: fill;
  pointer-events: none;
  user-select: none;
}

.captcha-bg {
  width: 100%;
}

.captcha-block {
  will-change: transform;
  transition: transform 0.04s linear;
}

.captcha-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8a96a8;
  font-size: 14px;
}

.slider-track {
  position: relative;
  width: 100%;
  height: 40px;
  background: #edf1f6;
  border-radius: 20px;
  overflow: hidden;
}

.slider-fill {
  position: absolute;
  inset: 0 auto 0 0;
  background: #d8ecff;
  border-radius: 20px 0 0 20px;
  transition: width 0.04s linear;
}

.slider-thumb {
  position: absolute;
  top: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid #d0d7e2;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8a96a8;
  cursor: grab;
  user-select: none;
  touch-action: none;
  z-index: 2;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
}

.slider-thumb.moving {
  cursor: grabbing;
  border-color: #0085ff;
  color: #0085ff;
}

.slider-thumb.success {
  background: #67c23a;
  border-color: #67c23a;
  color: #ffffff;
  cursor: default;
}

.captcha-tip {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

.captcha-actions {
  display: flex;
  gap: 8px;
}
</style>
