'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { getJob } from '@/lib/api'

interface AnalysisStep {
  id: string
  label: string
  description: string
  duration: number
  icon: string
  stage: 'uploading' | 'parsing' | 'detecting' | 'analyzing' | 'ai_processing' | 'compiling'
}

interface AnalysisProgressProps {
  jobId?: string
}

const analysisSteps: AnalysisStep[] = [
  {
    id: 'upload',
    label: 'Uploading File',
    description: 'Securely transferring log data to analysis engine',
    duration: 1500,
    icon: '📤',
    stage: 'uploading'
  },
  {
    id: 'parse',
    label: 'Parsing Logs',
    description: 'Extracting and normalizing Cloudflare Gateway log entries',
    duration: 2000,
    icon: '📋',
    stage: 'parsing'
  },
  {
    id: 'detect',
    label: 'Running Detection Algorithms',
    description: 'Analyzing patterns for DLP violations, threats, and suspicious activity',
    duration: 2500,
    icon: '🔍',
    stage: 'detecting'
  },
  {
    id: 'analyze',
    label: 'Statistical Analysis',
    description: 'Computing burst rates, authentication failures, and data exfiltration patterns',
    duration: 2000,
    icon: '📊',
    stage: 'analyzing'
  },
  {
    id: 'ai',
    label: 'AI Processing',
    description: 'Generating security timeline and executive summary with Cloudflare AI',
    duration: 3500,
    icon: '🤖',
    stage: 'ai_processing'
  },
  {
    id: 'compile',
    label: 'Compiling Results',
    description: 'Preparing comprehensive security analysis report',
    duration: 1000,
    icon: '📈',
    stage: 'compiling'
  }
]

const stepDetails: Record<string, string[]> = {
  upload: [
    'Establishing secure connection',
    'Encrypting log data',
    'Transferring to analysis engine'
  ],
  parse: [
    'Reading log format',
    'Extracting timestamps and IPs',
    'Normalizing HTTP fields',
    'Identifying user sessions'
  ],
  detect: [
    'Checking DLP policies',
    'Identifying threat patterns',
    'Analyzing authentication failures',
    'Detecting data exfiltration attempts',
    'Scanning for suspicious URLs'
  ],
  analyze: [
    'Computing traffic baselines',
    'Identifying burst patterns',
    'Calculating risk scores',
    'Correlating security events'
  ],
  ai: [
    'Processing anomaly patterns',
    'Generating threat intelligence',
    'Creating executive summary',
    'Building security timeline',
    'Preparing recommendations'
  ],
  compile: [
    'Formatting analysis results',
    'Generating visualizations',
    'Preparing final report'
  ]
}

export function AnalysisProgress({ jobId }: AnalysisProgressProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [stepProgress, setStepProgress] = useState(0)
  const [overallProgress, setOverallProgress] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null)
  const [processingDetails, setProcessingDetails] = useState<string>('')
  const [startTime] = useState(Date.now())
  const [isSlowProgress, setIsSlowProgress] = useState(false)
  const [currentSubStep, setCurrentSubStep] = useState(0)
  const [hasReachedEnd, setHasReachedEnd] = useState(false)
  const [hasServerStage, setHasServerStage] = useState(false)

  const totalDuration = useMemo(() => analysisSteps.reduce((sum, step) => sum + step.duration, 0), [])

  const fetchJobStatus = useCallback(async () => {
    if (!jobId) return false
    
    try {
      const response = await getJob(jobId)
      if (response.status === 'complete') {
        return true
      }
      
      if (response.processingStage) {
        setHasServerStage(true)
        const stepIndex = analysisSteps.findIndex(s => s.stage === response.processingStage.current)
        if (stepIndex >= 0) {
          setCurrentStep(stepIndex)
          setStepProgress(response.processingStage.progress || 0)
          setProcessingDetails(response.processingStage.message || '')
          
          if (typeof response.processingStage.estimatedTimeRemaining === 'number') {
            setEstimatedTimeRemaining(response.processingStage.estimatedTimeRemaining)
          } else {
            // Clear stale simulated ETA when using server stages (especially for AI step)
            setEstimatedTimeRemaining(null)
          }

          // Compute overall progress based on real stage + durations
          const completedBefore = analysisSteps.slice(0, stepIndex).reduce((sum, s) => sum + s.duration, 0)
          const currentTotal = analysisSteps[stepIndex].duration
          const overall = ((completedBefore + (currentTotal * (response.processingStage.progress || 0) / 100)) / totalDuration) * 100
          // Cap to 99% until complete to avoid premature 100%
          setOverallProgress(Math.min(99, Math.max(0, overall)))
        }
      }
    } catch (error) {
      console.error('Failed to fetch job status:', error)
    }
    
    return false
  }, [jobId, totalDuration])

  useEffect(() => {
    let elapsedTime = 0
    let currentStepIndex = 0
    let currentStepElapsed = 0
    let pollInterval: NodeJS.Timeout | null = null

    // Poll for real status if we have a jobId
    if (jobId) {
      pollInterval = setInterval(async () => {
        const isComplete = await fetchJobStatus()
        if (isComplete) {
          setOverallProgress(100)
          setCompletedSteps(new Set(analysisSteps.map(s => s.id)))
          setCurrentStep(analysisSteps.length - 1)
          setStepProgress(100)
          if (pollInterval) clearInterval(pollInterval)
          // Redirect to results after a brief delay
          setTimeout(() => {
            window.location.href = `/results?jobId=${jobId}`
          }, 1500)
        }
      }, 2000)
    }

    const interval = setInterval(() => {
      // If we have server-provided stages, don't drive the simulation-based progress
      if (jobId && hasServerStage) {
        return
      }
      elapsedTime += 50
      currentStepElapsed += 50

      // Calculate estimated time remaining
      const progressPercentage = (elapsedTime / totalDuration) * 100
      if (progressPercentage > 0) {
        const estimatedTotal = (100 / progressPercentage) * elapsedTime
        const remaining = Math.max(0, estimatedTotal - elapsedTime)
        setEstimatedTimeRemaining(Math.round(remaining / 1000))
      }

      // Check if progress is slower than expected (for AI processing)
      const actualElapsed = Date.now() - startTime
      if (actualElapsed > totalDuration * 1.5 && currentStepIndex === 4) {
        setIsSlowProgress(true)
        // Slow down the progress animation for AI step
        if (currentStepIndex === 4 && stepProgress < 90) {
          currentStepElapsed -= 25 // Slow down by half
        }
      }

      // Update overall progress - keep at 95% max until actually complete
      setOverallProgress(Math.min((elapsedTime / totalDuration) * 100, 95))

      // Check if current step is complete
      if (currentStepIndex < analysisSteps.length) {
        const currentStepData = analysisSteps[currentStepIndex]
        
        // Update step progress
        const progress = Math.min((currentStepElapsed / currentStepData.duration) * 100, 100)
        if (!jobId || currentStepIndex < 4) { // Only animate if no real status or before AI step
          setStepProgress(progress)
        }
        
        // Update substep based on progress
        const details = stepDetails[currentStepData.id] || []
        if (details.length > 0) {
          const subStepIndex = Math.floor((progress / 100) * details.length)
          setCurrentSubStep(Math.min(subStepIndex, details.length - 1))
        }

        if (currentStepElapsed >= currentStepData.duration) {
          // Mark step as completed
          setCompletedSteps(prev => new Set([...prev, currentStepData.id]))
          
          // Move to next step
          currentStepIndex++
          currentStepElapsed = 0
          setCurrentSubStep(0)
          
          if (currentStepIndex < analysisSteps.length) {
            setCurrentStep(currentStepIndex)
            setStepProgress(0)
          } else {
            // We've reached the end of all steps
            setHasReachedEnd(true)
            setStepProgress(100)
          }
        }
      }

      // Clear interval when all steps are done but keep polling
      if (elapsedTime >= totalDuration * 2 || hasReachedEnd) { // Give extra time for slow processing
        clearInterval(interval)
        // If we've reached the end, keep everything at 100% for the last step
        if (hasReachedEnd) {
          setCurrentStep(analysisSteps.length - 1)
          setStepProgress(100)
          setCompletedSteps(new Set(analysisSteps.map(s => s.id)))
        }
      }
    }, 50)

    return () => {
      clearInterval(interval)
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [jobId, fetchJobStatus, startTime, hasServerStage, totalDuration])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950/20 to-slate-900 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25 animate-pulse">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            Analyzing Security Logs
          </h1>
          <p className="text-lg text-blue-300">
            Our AI-powered engine is processing your log file
          </p>
        </div>

        {/* Progress Steps */}
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 shadow-2xl border border-slate-700/50 mb-8">
          <div className="space-y-4">
            {analysisSteps.map((step, index) => {
              const isActive = index === currentStep
              const isCompleted = completedSteps.has(step.id)
              
              return (
                <div
                  key={step.id}
                  className={`
                    relative rounded-xl p-4 transition-all duration-500
                    ${isActive ? 'bg-blue-950/30 border border-blue-500/50 shadow-lg shadow-blue-500/10' : ''}
                    ${isCompleted ? 'opacity-70' : ''}
                    ${!isActive && !isCompleted ? 'opacity-40' : ''}
                  `}
                >
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className={`
                      flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl
                      transition-all duration-500
                      ${isActive ? 'bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse shadow-lg shadow-blue-500/50' : ''}
                      ${isCompleted ? 'bg-green-600' : ''}
                      ${!isActive && !isCompleted ? 'bg-slate-700' : ''}
                    `}>
                      {isCompleted ? '✓' : step.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-semibold text-lg transition-colors duration-500 ${
                          isActive ? 'text-blue-300' : 'text-slate-300'
                        }`}>
                          {step.label}
                        </h3>
                        {isActive && (
                          <span className="text-sm text-blue-400 animate-pulse">
                            {stepProgress > 0 ? `${Math.round(stepProgress)}%` : 'Processing...'}
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-sm text-green-400">
                            Complete
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mb-2">
                        {step.description}
                      </p>
                      
                      {/* Step Progress Bar */}
                      {isActive && (
                        <>
                          <div className="h-1 bg-slate-700 rounded-full overflow-hidden mb-2">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-200 ease-out relative"
                              style={{ width: `${stepProgress}%` }}
                            >
                              <div className="absolute inset-0 bg-white/20 animate-shimmer" />
                            </div>
                          </div>
                          
                          {/* Sub-steps */}
                          {stepDetails[step.id] && (
                            <div className="ml-2 space-y-1">
                              {stepDetails[step.id].map((detail, idx) => (
                                <div
                                  key={idx}
                                  className={`flex items-center space-x-2 text-xs transition-all duration-300 ${
                                    idx <= currentSubStep ? 'opacity-100' : 'opacity-40'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    idx < currentSubStep ? 'bg-green-400' : 
                                    idx === currentSubStep ? 'bg-blue-400 animate-pulse' : 
                                    'bg-slate-600'
                                  }`} />
                                  <span className={`${
                                    idx === currentSubStep ? 'text-blue-300' : 'text-slate-500'
                                  }`}>
                                    {detail}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Overall Progress */}
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 shadow-2xl border border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-300">Overall Progress</span>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-bold text-blue-400">
                {Math.round(overallProgress)}%
              </span>
              {overallProgress > 0 && overallProgress < 100 && (
                <span className="text-xs text-slate-500">
                  Step {currentStep + 1} of {analysisSteps.length}
                </span>
              )}
            </div>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${overallProgress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-shimmer" />
            </div>
          </div>
          
          {/* Status Message */}
          <div className="mt-4 text-center space-y-2">
            <p className="text-sm text-slate-400">
              {overallProgress < 100 ? (
                <>
                  <span className="inline-block animate-pulse">●</span>
                  {' '}
                  {processingDetails || analysisSteps[currentStep]?.description || 'Detecting anomalies and security threats...'}
                </>
              ) : (
                <span className="text-green-400">Analysis complete! Preparing results...</span>
              )}
            </p>
            
            {/* Prefer server ETA; hide naive ETA during AI step unless server-provided */}
            {estimatedTimeRemaining !== null && estimatedTimeRemaining > 0 && (
              <p className="text-xs text-slate-500">
                Estimated time remaining: {formatTimeRemaining(estimatedTimeRemaining)}
              </p>
            )}
            
            {isSlowProgress && currentStep >= 4 && (
              <p className="text-xs text-amber-400 animate-pulse">
                {currentStep === 5 
                  ? 'Finalizing report - almost done...' 
                  : 'AI processing is taking longer than usual - analyzing complex patterns...'}
              </p>
            )}
          </div>
        </div>

        {/* Animated Background Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl animate-spin-slow" />
        </div>
      </div>
    </div>
  )
}

function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes < 60) {
    return remainingSeconds > 0 
      ? `${minutes} min ${remainingSeconds} sec`
      : `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} min`
}
