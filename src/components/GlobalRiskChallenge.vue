<template>
  <SliderCaptcha
    v-model:visible="captchaVisible"
    @success="handleCaptchaSuccess"
    @cancel="handleCaptchaCancel"
  />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import SliderCaptcha from '@/components/SliderCaptcha.vue'
import { clearRiskBySliderApi } from '@/api/risk'
import { useUserStore } from '@/stores/user'
import {
  rejectRiskChallenge,
  resolveRiskChallenge,
  riskChallengeState,
  setRiskChallengeResolving,
} from '@/services/riskChallenge'
import type { SliderCaptchaTrack } from '@/api/risk'

const userStore = useUserStore()

const captchaVisible = computed({
  get: () => riskChallengeState.visible,
  set: (visible) => {
    if (!visible && riskChallengeState.visible && !riskChallengeState.resolving) {
      rejectRiskChallenge(new Error('安全验证已取消'))
    }
  },
})

watch(
  () => riskChallengeState.visible,
  (visible) => {
    if (visible) {
      ElMessage.warning({
        message: riskChallengeState.message || '当前请求过于频繁，请完成安全验证',
        duration: 2000,
      })
    }
  }
)

const handleCaptchaSuccess = async (result: { captchaId: string; captchaData: SliderCaptchaTrack }) => {
  if (!userStore.userId) {
    const error = new Error('请先登录后再进行安全验证')
    ElMessage.error({
      message: error.message,
      duration: 2000,
    })
    rejectRiskChallenge(error)
    return
  }

  setRiskChallengeResolving(true)

  try {
    await clearRiskBySliderApi({
      userId: userStore.userId,
      captchaId: result.captchaId,
      captchaData: result.captchaData,
    })
    ElMessage.success({
      message: '验证通过，请继续操作',
      duration: 2000,
    })
    resolveRiskChallenge()
  } catch (error) {
    ElMessage.error({
      message: error instanceof Error ? error.message : '安全验证失败',
      duration: 2000,
    })
    rejectRiskChallenge(error)
  }
}

const handleCaptchaCancel = () => {
  if (!riskChallengeState.resolving) {
    rejectRiskChallenge(new Error('安全验证已取消'))
  }
}
</script>
