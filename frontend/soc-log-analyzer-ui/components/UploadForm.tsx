'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { postUpload } from '@/lib/api'
import { formatBytes } from '@/lib/format'
import { AnalysisProgress } from './AnalysisProgress'

export function UploadForm() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        setFile(null)
        return
      }
      setFile(selectedFile)
      setError('')
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file')
      return
    }

    setUploading(true)
    setError('')

    try {
      const response = await postUpload(file)
      
      // Add a minimum delay to show the full progress animation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (response.status === 'processing') {
        router.push(`/results?jobId=${response.jobId}&polling=true`)
      } else {
        router.push(`/results?jobId=${response.jobId}`)
      }
    } catch (err) {
      setError((err as Error).message || 'Upload failed')
      setUploading(false)
    }
  }

  // Show progress screen while uploading
  if (uploading) {
    return <AnalysisProgress />
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-slate-800/90 backdrop-blur shadow-2xl rounded-2xl p-8 border border-slate-700 card-glow animate-fadeIn">
        <h2 className="text-3xl font-bold mb-6 text-white">Upload Log File</h2>
        
        <div className="space-y-6">
          <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center bg-slate-900/50 hover:border-blue-500 hover:bg-slate-900/70 transition-all duration-300">
            <input
              id="file-upload"
              type="file"
              accept=".log,.txt,.json"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer inline-flex items-center justify-center"
            >
              <div>
                <svg className="mx-auto h-16 w-16 text-blue-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="mt-4 text-lg text-slate-200">
                  <span className="font-semibold text-blue-400 hover:text-blue-300">
                    Click to upload
                  </span>
                  <span className="text-slate-300"> or drag and drop</span>
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  .log, .txt, .json up to 10MB
                </p>
              </div>
            </label>
          </div>

          {file && (
            <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-white">{file.name}</p>
                    <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                  disabled={uploading}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-4 px-6 rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all duration-300 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed font-semibold text-lg shadow-lg hover:shadow-blue-500/25"
          >
            {uploading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Uploading and Analyzing...
              </span>
            ) : (
              'Upload & Analyze'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}