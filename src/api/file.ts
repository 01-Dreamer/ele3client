import { apiRequest } from './http'

// --- 类型 ---

export interface FileUploadVO {
  objectName: string
  url: string
  originalFilename: string
  size: number
  contentType: string
}

export interface DirectUploadPolicyRequest {
  originalFilename: string
  contentType: string
}

export interface DirectUploadPolicyVO {
  host: string
  objectName: string
  url: string
  accessKeyId: string
  policy: string
  signature: string
  expire: number
  successActionStatus: string
  contentType: string
}

// --- API ---

/** 上传图片文件（multipart/form-data） */
export const uploadFileApi = (file: File, token: string) => {
  const formData = new FormData()
  formData.append('file', file)
  return apiRequest<FileUploadVO>('/api/file/upload', {
    method: 'POST',
    body: formData,
    token,
  })
}

/** 获取 OSS 直传授权 */
export const getUploadPolicyApi = (payload: DirectUploadPolicyRequest, token: string) => {
  return apiRequest<DirectUploadPolicyVO>('/api/file/upload-policy', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  })
}

/** 删除自己的文件 */
export const deleteFileApi = (objectName: string, token: string) => {
  return apiRequest<null>(`/api/file/delete?objectName=${encodeURIComponent(objectName)}`, {
    method: 'DELETE',
    token,
  })
}
