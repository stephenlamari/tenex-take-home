'use client'

import { useState } from 'react'
import { Anomaly } from '@/lib/types'
import { formatDate, formatConfidence, getConfidenceColor, getConfidenceBg } from '@/lib/format'
import { generateAnomaliesCSV, downloadCSV } from '@/lib/csv'
import { RowDrawer } from './RowDrawer'

interface AnomaliesTableProps {
  anomalies: Anomaly[]
  onExpandChange?: (expanded: boolean) => void
}

export function AnomaliesTable({ anomalies, onExpandChange }: AnomaliesTableProps) {
  const [selectedLog, setSelectedLog] = useState<Anomaly['raw_log'] | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedExplanations, setExpandedExplanations] = useState<Set<number>>(new Set())
  
  const handleExpandToggle = () => {
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    onExpandChange?.(newExpanded)
  }
  
  const toggleExplanation = (index: number, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click
    setExpandedExplanations(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const handleExport = () => {
    const csv = generateAnomaliesCSV(anomalies)
    downloadCSV(csv, `anomalies-${new Date().toISOString().split('T')[0]}.csv`)
  }

  if (anomalies.length === 0) {
    return (
      <div className="bg-slate-800/90 backdrop-blur p-8 rounded-xl shadow-lg border border-slate-700 card-glow animate-fadeIn">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-white">No anomalies detected</h3>
          <p className="mt-1 text-sm text-slate-400">All logs appear to be normal activity</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-slate-800/90 backdrop-blur rounded-xl shadow-lg border border-slate-700 overflow-hidden card-glow animate-fadeIn">
        <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">
            Detected Anomalies ({anomalies.length})
          </h3>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExpandToggle}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-700/50 text-blue-300 rounded-lg hover:bg-slate-600/50 transition-all duration-300 text-sm font-medium border border-slate-600 hover:border-blue-500/50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d={isExpanded ? "M7 12h10M12 7v10" : "M4 8h16M4 16h16"} />
              </svg>
              <span>{isExpanded ? 'Collapse Table' : 'Expand Table'}</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-blue-500/25"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export CSV</span>
          </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Rule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Explanation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800/50 divide-y divide-slate-700">
              {anomalies.map((anomaly, index) => (
                <tr
                  key={index}
                  onClick={() => setSelectedLog(anomaly.raw_log)}
                  className="hover:bg-slate-700/50 cursor-pointer transition-all duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {anomaly.rule}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConfidenceBg(anomaly.confidence)} ${getConfidenceColor(anomaly.confidence)}`}>
                      {formatConfidence(anomaly.confidence)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">
                    <div className="flex items-start space-x-2">
                      <div className={`flex-1 ${
                        expandedExplanations.has(index) 
                          ? 'whitespace-normal break-words bg-slate-900/50 p-3 rounded-lg border border-slate-700' 
                          : 'truncate max-w-xs'
                      }`}>
                        {expandedExplanations.has(index) ? (
                          <div>
                            <div className="font-medium text-blue-300 text-xs mb-2">FULL EXPLANATION:</div>
                            <div className="text-slate-200">{anomaly.explanation}</div>
                          </div>
                        ) : (
                          anomaly.explanation
                        )}
                      </div>
                      {anomaly.explanation.length > 50 && (
                        <button
                          onClick={(e) => toggleExplanation(index, e)}
                          className="flex-shrink-0 p-1 rounded text-blue-400 hover:text-blue-300 hover:bg-slate-700/50 transition-all duration-200"
                          title={expandedExplanations.has(index) ? 'Show less' : 'Show more'}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {expandedExplanations.has(index) ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            )}
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {formatDate(anomaly.raw_log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {anomaly.raw_log.identityEmail || anomaly.raw_log.sourceIp}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {anomaly.raw_log.host}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      anomaly.raw_log.action === 'block' ? 'bg-red-900/50 text-red-300 border border-red-700' :
                      anomaly.raw_log.action === 'isolate' ? 'bg-orange-900/50 text-orange-300 border border-orange-700' :
                      anomaly.raw_log.action === 'allow' ? 'bg-green-900/50 text-green-300 border border-green-700' :
                      'bg-gray-900/50 text-gray-300 border border-gray-700'
                    }`}>
                      {anomaly.raw_log.action}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <RowDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
    </>
  )
}