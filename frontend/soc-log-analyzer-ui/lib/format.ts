export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-'
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '-'
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'UTC'
    }).format(date)
  } catch {
    return '-'
  }
}

export function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null) return '-'
  if (bytes === 0) return '0 B'
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`
}

export function getConfidenceColor(confidence: number): string {
  if (confidence < 0.4) return 'text-gray-600'
  if (confidence < 0.7) return 'text-yellow-600'
  return 'text-red-600'
}

export function getConfidenceBg(confidence: number): string {
  if (confidence < 0.4) return 'bg-gray-100'
  if (confidence < 0.7) return 'bg-yellow-100'
  return 'bg-red-100'
}

export function truncateUrl(url: string, maxLength: number = 50): string {
  if (url.length <= maxLength) return url
  return url.substring(0, maxLength - 3) + '...'
}