'use client'

import { useState, useEffect, useMemo } from 'react'
import { GatewayLog, Anomaly } from '@/lib/types'
import { getRows } from '@/lib/api'
import { formatDate, formatBytes, truncateUrl } from '@/lib/format'
import { RowDrawer } from './RowDrawer'

interface LogTableProps {
  jobId: string
  anomalies: Anomaly[]
  totalRows: number
}

export function LogTable({ jobId, anomalies, totalRows }: LogTableProps) {
  const [rows, setRows] = useState<GatewayLog[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [selectedLog, setSelectedLog] = useState<GatewayLog | null>(null)
  
  const [statusFilter, setStatusFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  
  const pageSize = 200
  const totalPages = Math.ceil(totalRows / pageSize)
  
  const anomalyIndices = useMemo(() => 
    new Set(anomalies.map(a => a.row_index)),
    [anomalies]
  )

  useEffect(() => {
    loadRows()
  }, [page])

  const loadRows = async () => {
    setLoading(true)
    try {
      const response = await getRows(jobId, page * pageSize, pageSize)
      setRows(response.rows)
    } catch (error) {
      console.error('Failed to load rows:', error)
    }
    setLoading(false)
  }

  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      if (statusFilter && row.status.toString() !== statusFilter) return false
      if (actionFilter && row.action !== actionFilter) return false
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        return (
          row.identityEmail?.toLowerCase().includes(term) ||
          row.sourceIp.toLowerCase().includes(term) ||
          row.host.toLowerCase().includes(term)
        )
      }
      return true
    })
  }, [rows, statusFilter, actionFilter, searchTerm])

  const uniqueStatuses = useMemo(() => 
    [...new Set(rows.map(r => r.status.toString()))].sort(),
    [rows]
  )
  
  const uniqueActions = useMemo(() => 
    [...new Set(rows.map(r => r.action))].sort(),
    [rows]
  )

  if (loading && rows.length === 0) {
    return (
      <div className="bg-slate-800/90 backdrop-blur p-8 rounded-xl shadow-lg border border-slate-700 card-glow animate-fadeIn">
        <div className="flex justify-center">
          <svg className="animate-spin h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-slate-800/90 backdrop-blur rounded-xl shadow-lg border border-slate-700 overflow-hidden card-glow animate-fadeIn">
        <div className="px-6 py-4 border-b border-slate-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <h3 className="text-xl font-bold text-white">
              All Logs ({totalRows.toLocaleString()})
            </h3>
            
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="Search email/IP/host..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-700 border border-slate-600 text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400"
              />
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-700 border border-slate-600 text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400"
              >
                <option value="">All Statuses</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-700 border border-slate-600 text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400"
              >
                <option value="">All Actions</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  User/Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Source IP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Host
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Bytes Out
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800/50 divide-y divide-slate-700">
              {filteredRows.map((row, index) => {
                const globalIndex = page * pageSize + index
                const isAnomaly = anomalyIndices.has(globalIndex)
                
                return (
                  <tr
                    key={index}
                    onClick={() => setSelectedLog(row)}
                    className={`hover:bg-slate-700/50 cursor-pointer transition-all duration-200 ${
                      isAnomaly ? 'border-l-4 border-red-500 bg-red-900/20 hover:bg-red-900/30' : ''
                    }`}
                  >
                    <td className="px-6 py-3 whitespace-nowrap text-xs text-slate-300">
                      {isAnomaly && (
                        <svg className="inline h-4 w-4 text-red-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                      {formatDate(row.timestamp)}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-xs text-white">
                      {row.identityEmail || '-'}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-xs text-slate-300 font-mono">
                      {row.sourceIp}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-xs text-slate-300">
                      <span className="font-medium">{row.method}</span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-xs text-slate-300">
                      {truncateUrl(row.host, 30)}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-xs">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        row.status >= 200 && row.status < 300 ? 'bg-green-900/50 text-green-300 border border-green-700' :
                        row.status >= 400 && row.status < 500 ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700' :
                        row.status >= 500 ? 'bg-red-900/50 text-red-300 border border-red-700' :
                        'bg-gray-900/50 text-gray-300 border border-gray-700'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-xs">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        row.action === 'block' ? 'bg-red-900/50 text-red-300 border border-red-700' :
                        row.action === 'isolate' ? 'bg-orange-900/50 text-orange-300 border border-orange-700' :
                        row.action === 'allow' ? 'bg-green-900/50 text-green-300 border border-green-700' :
                        'bg-gray-900/50 text-gray-300 border border-gray-700'
                      }`}>
                        {row.action}
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-xs text-slate-300">
                      {formatBytes(row.bytesOut)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-slate-700 flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Page {page + 1} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-4 py-2 text-sm bg-slate-700 border border-slate-600 text-slate-200 rounded-lg hover:bg-slate-600 hover:border-slate-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 text-sm bg-slate-700 border border-slate-600 text-slate-200 rounded-lg hover:bg-slate-600 hover:border-slate-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      
      <RowDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
    </>
  )
}