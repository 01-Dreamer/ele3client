import { getWasmModuleApi, getChallengeApi } from '@/api/agent'

let powReady = false
let computePow: ((challenge: string, difficulty: number) => Promise<{ nonce: string; answer: number; hash: string }>) | null = null
let cachedPowResponse: string | null = null
let powPromise: Promise<string | null> | null = null

const initWasm = async () => {
  if (powReady) return
  try {
    const { js, wasm } = await getWasmModuleApi()
    const wasmBytes = Uint8Array.from(atob(wasm), (c) => c.charCodeAt(0))
    const wasmModule = await WebAssembly.instantiate(wasmBytes, {
      env: {
        memory: new WebAssembly.Memory({ initial: 256 }),
        emscripten_resize_heap: () => {},
        pow_result_callback: () => {},
      },
    })
    const exports = wasmModule.instance.exports as Record<string, WebAssembly.ExportValue>
    const memory = exports.memory as WebAssembly.Memory
    const compute = exports.compute_pow as (challengePtr: number, challengeLen: number, difficulty: number) => number
    const getAnswer = exports.get_answer as () => number
    const getHashPtr = exports.get_hash_ptr as () => number

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    computePow = async (challenge: string, difficulty: number) => {
      const encoded = encoder.encode(challenge)
      const ptr = new Uint8Array(memory.buffer, 0, encoded.length + 1)
      ptr.set(encoded)
      const result = compute(ptr.byteOffset, encoded.length, difficulty)
      if (result !== 0) throw new Error('PoW 计算失败')
      const answer = getAnswer()
      const hashPtr = getHashPtr()
      const hashBytes = new Uint8Array(memory.buffer, hashPtr, 64)
      const hash = decoder.decode(hashBytes)
      return { nonce: challenge, answer, hash }
    }
    powReady = true
  } catch (e) {
    console.error('WASM 初始化失败，降级为 JS PoW', e)
    powReady = true
  }
}

/** 提前计算 PoW，返回 X-Agent-Pow-Response 头（格式: nonce:answer:hash） */
const computePowResponse = async (): Promise<string> => {
  await initWasm()
  const { challenge, difficulty } = await getChallengeApi()

  if (computePow) {
    const result = await computePow(challenge, difficulty)
    return `${result.nonce}:${result.answer}:${result.hash}`
  }
  return solvePowJs(challenge, difficulty)
}

/** 获取或预计算 PoW 响应（缓存复用） */
export const getPowResponse = async (): Promise<string> => {
  if (cachedPowResponse) return cachedPowResponse
  if (powPromise) return powPromise
  powPromise = computePowResponse().then((r) => {
    cachedPowResponse = r
    powPromise = null
    return r
  }).catch(() => {
    powPromise = null
    return null
  })
  return powPromise
}

/** 标记当前 PoW 已失效，下次获取时重新计算 */
export const invalidatePow = () => {
  cachedPowResponse = null
}

/** 执行 PoW 验证（供 chat 失败重试用） */
export const solvePow = async (): Promise<string | null> => {
  cachedPowResponse = null
  powPromise = null
  return getPowResponse()
}

// --- JS 降级 ---

const solvePowJs = async (challenge: string, difficulty: number) => {
  const targetPrefix = '0'.repeat(difficulty)
  let answer = 0
  while (true) {
    const raw = challenge + ':' + answer
    const hash = await sha256(raw)
    if (hash.startsWith(targetPrefix)) {
      return `${challenge}:${answer}:${hash}`
    }
    answer++
    if (answer % 1000 === 0) await new Promise((r) => setTimeout(r, 0))
  }
}

const sha256 = async (message: string) => {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
