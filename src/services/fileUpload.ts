import { getUploadPolicyApi, deleteFileApi } from '@/api/file'
import { showErrorMessage } from '@/api/http'

const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export interface UploadResult {
  url: string
  objectName: string
}

export const uploadImage = async (file: File, token: string): Promise<UploadResult | null> => {
  if (!SUPPORTED_TYPES.includes(file.type)) {
    showErrorMessage(new Error('仅支持 JPG、PNG、GIF、WebP 格式'))
    return null
  }
  if (file.size > MAX_FILE_SIZE) {
    showErrorMessage(new Error('图片大小不能超过 10MB'))
    return null
  }

  const policy = await getUploadPolicyApi(
    { originalFilename: file.name, contentType: file.type },
    token
  )

  const formData = new FormData()
  formData.append('key', policy.objectName)
  formData.append('policy', policy.policy)
  formData.append('OSSAccessKeyId', policy.accessKeyId)
  formData.append('signature', policy.signature)
  formData.append('success_action_status', policy.successActionStatus || '200')
  formData.append('Content-Type', file.type)
  formData.append('file', file)

  const response = await fetch(policy.host, { method: 'POST', body: formData })
  if (!response.ok) {
    showErrorMessage(new Error('图片上传失败'))
    return null
  }
  return { url: policy.url, objectName: policy.objectName }
}

/** 清理未使用的上传文件，失败静默 */
export const cleanupUpload = (objectName: string, token: string) => {
  if (!objectName) return
  deleteFileApi(objectName, token).catch(() => {})
}
