import { reactive } from 'vue'

interface RiskChallengeState {
  visible: boolean
  message: string
  resolving: boolean
}

let activePromise: Promise<void> | null = null
let resolveActive: (() => void) | null = null
let rejectActive: ((reason?: unknown) => void) | null = null

export const riskChallengeState = reactive<RiskChallengeState>({
  visible: false,
  message: '',
  resolving: false,
})

export const requestRiskChallenge = (message = '请提交验证码') => {
  if (activePromise) {
    return activePromise
  }

  riskChallengeState.visible = true
  riskChallengeState.message = message
  riskChallengeState.resolving = false

  activePromise = new Promise<void>((resolve, reject) => {
    resolveActive = resolve
    rejectActive = reject
  })

  return activePromise
}

export const resolveRiskChallenge = () => {
  resolveActive?.()
  resetRiskChallenge()
}

export const rejectRiskChallenge = (reason?: unknown) => {
  rejectActive?.(reason)
  resetRiskChallenge()
}

export const setRiskChallengeResolving = (resolving: boolean) => {
  riskChallengeState.resolving = resolving
}

const resetRiskChallenge = () => {
  riskChallengeState.visible = false
  riskChallengeState.message = ''
  riskChallengeState.resolving = false
  activePromise = null
  resolveActive = null
  rejectActive = null
}
