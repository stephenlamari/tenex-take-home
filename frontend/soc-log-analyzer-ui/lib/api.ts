import { UploadResponse, JobResponse, RowsResponse } from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

class ApiClient {
  private authHeader: string | null = null

  setAuth(username: string, password: string) {
    const encoded = btoa(`${username}:${password}`)
    this.authHeader = `Basic ${encoded}`
  }

  clearAuth() {
    this.authHeader = null
  }

  getAuthHeader(): string | null {
    return this.authHeader
  }

  private async fetchWithAuth(url: string, options?: RequestInit) {
    const headers = new Headers(options?.headers)
    
    if (this.authHeader) {
      headers.set('Authorization', this.authHeader)
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (response.status === 401) {
      throw new Error('Authentication failed. Please check your credentials.')
    }

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }

    return response
  }

  async postUpload(file: File): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await this.fetchWithAuth(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    })

    return response.json()
  }

  async getJob(jobId: string): Promise<JobResponse> {
    const response = await this.fetchWithAuth(`${API_BASE_URL}/api/jobs/${jobId}`)
    return response.json()
  }

  async getRows(jobId: string, offset: number = 0, limit: number = 200): Promise<RowsResponse> {
    const params = new URLSearchParams({ offset: offset.toString(), limit: limit.toString() })
    const response = await this.fetchWithAuth(`${API_BASE_URL}/api/jobs/${jobId}/rows?${params}`)
    return response.json()
  }
}

export const apiClient = new ApiClient()
export const { postUpload, getJob, getRows } = {
  postUpload: apiClient.postUpload.bind(apiClient),
  getJob: apiClient.getJob.bind(apiClient),
  getRows: apiClient.getRows.bind(apiClient),
}