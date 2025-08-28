'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getJob, getRows } from '@/lib/api'
import { Analysis, GatewayLog } from '@/lib/types'
import { SummaryCards } from '@/components/SummaryCards'
import { Timeline } from '@/components/Timeline'
import { AnomaliesTable } from '@/components/AnomaliesTable'
import { LogTable } from '@/components/LogTable'
import { Charts } from '@/components/Charts'

function ResultsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const jobId = searchParams.get('jobId')
  const shouldPoll = searchParams.get('polling') === 'true'
  
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(shouldPoll)
  const [error, setError] = useState('')
  const [logs, setLogs] = useState<GatewayLog[]>([])
  const [anomaliesExpanded, setAnomaliesExpanded] = useState(false)

  useEffect(() => {
    if (!jobId) {
      router.replace('/upload')
      return
    }

    let interval: NodeJS.Timeout | null = null

    const fetchJob = async () => {
      try {
        const response = await getJob(jobId)
        
        if (response.status === 'complete' && response.analysis) {
          setAnalysis(response.analysis)
          setPolling(false)
          setLoading(false)
          
          try {
            const rowsResponse = await getRows(jobId, 0, 200)
            setLogs(rowsResponse.rows)
          } catch (err) {
            console.error('Failed to load initial rows:', err)
          }
        } else if (polling) {
          if (!interval) {
            interval = setInterval(fetchJob, 3000)
          }
        }
      } catch (err) {
        setError((err as Error).message)
        setLoading(false)
        setPolling(false)
      }
    }

    fetchJob()

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [jobId, polling, router])

  if (!jobId) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <svg className="animate-spin h-16 w-16 text-blue-400 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-4 text-lg text-slate-300">
            {polling ? 'Processing logs...' : 'Loading results...'}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="bg-slate-800/90 backdrop-blur p-8 rounded-xl shadow-2xl border border-slate-700 max-w-md card-glow animate-fadeIn">
          <div className="flex items-center space-x-3 text-red-400 mb-4">
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <h2 className="text-lg font-semibold text-white">Error Loading Results</h2>
          </div>
          <p className="text-slate-300 mb-6">{error}</p>
          <button
            onClick={() => router.push('/upload')}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 px-6 rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all duration-300 font-semibold shadow-lg hover:shadow-blue-500/25"
          >
            Back to Upload
          </button>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="bg-slate-900/95 backdrop-blur shadow-xl border-b border-slate-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">
              <span className="gradient-text">Analysis Results</span>
            </h1>
            <button
              onClick={() => router.push('/upload')}
              className="flex items-center space-x-2 px-6 py-3 bg-slate-800/50 text-blue-400 hover:text-blue-300 hover:bg-slate-700/50 rounded-lg transition-all duration-300 border border-slate-700 hover:border-blue-500/50"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-semibold">New Analysis</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SummaryCards analysis={analysis} />
        
        <div className={`grid grid-cols-1 gap-6 mb-8 ${
          anomaliesExpanded ? '' : 'lg:grid-cols-3'
        }`}>
          <div className={anomaliesExpanded ? '' : 'lg:col-span-2'}>
            <AnomaliesTable 
              anomalies={analysis.anomalies} 
              onExpandChange={setAnomaliesExpanded}
            />
          </div>
          {!anomaliesExpanded && (
            <div className="lg:col-span-1">
              <Timeline timeline={analysis.timeline} />
            </div>
          )}
        </div>

        <div className="mb-8">
          <Charts analysis={analysis} logs={logs} anomalies={analysis.anomalies} />
        </div>

        <LogTable 
          jobId={jobId} 
          anomalies={analysis.anomalies}
          totalRows={analysis.totals.rows}
        />
      </div>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <svg className="animate-spin h-16 w-16 text-blue-400 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-4 text-lg text-slate-300">Loading...</p>
        </div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  )
}