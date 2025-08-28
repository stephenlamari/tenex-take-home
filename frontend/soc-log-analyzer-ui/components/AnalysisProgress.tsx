'use client'

import { useEffect, useState } from 'react'

interface AnalysisStep {
  id: string
  label: string
  description: string
  duration: number
  icon: string
}

const analysisSteps: AnalysisStep[] = [
  {
    id: 'upload',
    label: 'Uploading File',
    description: 'Securely transferring log data to analysis engine',
    duration: 800,
    icon: '📤'
  },
  {
    id: 'parse',
    label: 'Parsing Logs',
    description: 'Extracting and normalizing Cloudflare Gateway log entries',
    duration: 1200,
    icon: '📋'
  },
  {
    id: 'detect',
    label: 'Running Detection Algorithms',
    description: 'Analyzing patterns for DLP violations, threats, and suspicious activity',
    duration: 1800,
    icon: '🔍'
  },
  {
    id: 'analyze',
    label: 'Statistical Analysis',
    description: 'Computing burst rates, authentication failures, and data exfiltration patterns',
    duration: 1500,
    icon: '📊'
  },
  {
    id: 'ai',
    label: 'AI Processing',
    description: 'Generating security timeline and executive summary with Cloudflare AI',
    duration: 2000,
    icon: '🤖'
  },
  {
    id: 'compile',
    label: 'Compiling Results',
    description: 'Preparing comprehensive security analysis report',
    duration: 700,
    icon: '📈'
  }
]

export function AnalysisProgress() {
  const [currentStep, setCurrentStep] = useState(0)
  const [stepProgress, setStepProgress] = useState(0)
  const [overallProgress, setOverallProgress] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())

  useEffect(() => {
    const totalDuration = analysisSteps.reduce((sum, step) => sum + step.duration, 0)
    let elapsedTime = 0
    let currentStepIndex = 0
    let currentStepElapsed = 0

    const interval = setInterval(() => {
      elapsedTime += 50
      currentStepElapsed += 50

      // Update overall progress
      setOverallProgress(Math.min((elapsedTime / totalDuration) * 100, 100))

      // Check if current step is complete
      if (currentStepIndex < analysisSteps.length) {
        const currentStepData = analysisSteps[currentStepIndex]
        
        // Update step progress
        const progress = Math.min((currentStepElapsed / currentStepData.duration) * 100, 100)
        setStepProgress(progress)

        if (currentStepElapsed >= currentStepData.duration) {
          // Mark step as completed
          setCompletedSteps(prev => new Set([...prev, currentStepData.id]))
          
          // Move to next step
          currentStepIndex++
          currentStepElapsed = 0
          
          if (currentStepIndex < analysisSteps.length) {
            setCurrentStep(currentStepIndex)
            setStepProgress(0)
          }
        }
      }

      // Clear interval when all steps are done
      if (elapsedTime >= totalDuration) {
        clearInterval(interval)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [])

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
                            Processing...
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
                        <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-200 ease-out"
                            style={{ width: `${stepProgress}%` }}
                          />
                        </div>
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
            <span className="text-sm font-bold text-blue-400">
              {Math.round(overallProgress)}%
            </span>
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
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-400">
              {overallProgress < 100 ? (
                <>
                  <span className="inline-block animate-pulse">●</span>
                  {' '}Detecting anomalies and security threats...
                </>
              ) : (
                <span className="text-green-400">Analysis complete! Preparing results...</span>
              )}
            </p>
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