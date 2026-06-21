import { getUserBriefApi, type UserBriefVO } from '@/api/user'

const cache = new Map<string, UserBriefVO>()

export const fetchUserBrief = async (userId: string): Promise<UserBriefVO | null> => {
  if (!userId) return null
  if (cache.has(userId)) return cache.get(userId)!
  try {
    const brief = await getUserBriefApi(userId)
    if (brief && brief.userId) {
      cache.set(userId, brief)
      return brief
    }
  } catch { /* 静默 */ }
  return null
}

/** 批量拉取并缓存 */
export const fetchUserBriefs = async (userIds: string[]) => {
  const unique = [...new Set(userIds)].filter(Boolean)
  await Promise.all(unique.map(fetchUserBrief))
}

export const getCachedBrief = (userId: string): UserBriefVO | null =>
  cache.get(userId) || null

export const getUserNickname = (userId: string) => {
  const b = cache.get(userId)
  return b?.nickname || userId || '未知用户'
}

export const getUserAvatar = (userId: string) => {
  const b = cache.get(userId)
  return b?.avatar || '/default-avatar.svg'
}
