'use client'

import { GatewayLog } from '@/lib/types'
import { formatDate, formatBytes } from '@/lib/format'
import { useState, useEffect } from 'react'

interface RowDrawerProps {
  log: GatewayLog | null
  onClose: () => void
}

export function RowDrawer({ log, onClose }: RowDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showRawJson, setShowRawJson] = useState(false)

  useEffect(() => {
    if (log) {
      setIsOpen(true)
      setShowRawJson(false)
    } else {
      setIsOpen(false)
    }
  }, [log])

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(onClose, 300)
  }

  if (!log) return null

  const networkInfo = [
    { label: 'Source IP', value: log.sourceIp, icon: '🌐' },
    { label: 'HTTP Method', value: log.method, icon: '📡' },
    { label: 'Host', value: log.host, icon: '🏢' },
    { label: 'URL', value: log.url, icon: '🔗' },
    { label: 'Status Code', value: log.status, icon: '📊' },
    { label: 'Action', value: log.action, icon: '🛡️' },
  ]

  const userInfo = [
    { label: 'Identity Email', value: log.identityEmail, icon: '👤' },
    { label: 'Device Name', value: log.deviceName, icon: '💻' },
    { label: 'User Agent', value: log.userAgent, icon: '🌏' },
  ]

  const dataInfo = [
    { label: 'Bytes In', value: formatBytes(log.bytesIn), icon: '⬇️' },
    { label: 'Bytes Out', value: formatBytes(log.bytesOut), icon: '⬆️' },
  ]

  const policyInfo = [
    { label: 'Policy Name', value: log.policyName, icon: '📋' },
    { label: 'Timestamp', value: formatDate(log.timestamp), icon: '🕒' },
  ]

  const getActionColor = (action: string) => {
    switch (action) {
      case 'block': return 'text-red-500 bg-red-500/10'
      case 'isolate': return 'text-orange-500 bg-orange-500/10'
      case 'allow': return 'text-green-500 bg-green-500/10'
      case 'log': return 'text-blue-500 bg-blue-500/10'
      default: return 'text-gray-500 bg-gray-500/10'
    }
  }

  const getStatusColor = (status: number) => {
    if (status === 0) return 'text-red-500 bg-red-500/10'
    if (status >= 200 && status < 300) return 'text-green-500 bg-green-500/10'
    if (status >= 400 && status < 500) return 'text-yellow-500 bg-yellow-500/10'
    if (status >= 500) return 'text-red-500 bg-red-500/10'
    return 'text-gray-500 bg-gray-500/10'
  }

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`} 
        onClick={handleClose} 
      />
      <div className={`fixed right-0 top-0 h-full w-full max-w-lg bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Log Entry Details</h3>
                <p className="text-sm text-slate-400 mt-1">ID: {log.timestamp}-{log.sourceIp?.slice(-6) || 'unknown'}</p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-slate-700 rounded-lg transition-all duration-200 group"
                aria-label="Close drawer"
              >
                <svg className="h-5 w-5 text-slate-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRawJson(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    !showRawJson 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Formatted View
                </button>
                <button
                  onClick={() => setShowRawJson(true)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    showRawJson 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Raw JSON
                </button>
              </div>

              {!showRawJson ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`px-4 py-3 rounded-lg border ${getActionColor(log.action)} border-current/20`}>
                      <div className="text-xs opacity-75 mb-1">Action</div>
                      <div className="font-bold uppercase">{log.action}</div>
                    </div>
                    <div className={`px-4 py-3 rounded-lg border ${getStatusColor(log.status)} border-current/20`}>
                      <div className="text-xs opacity-75 mb-1">Status</div>
                      <div className="font-bold">{log.status === 0 ? 'Blocked' : log.status}</div>
                    </div>
                  </div>

                  <div className="bg-slate-800 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-slate-400 mb-3">Network Information</h4>
                    <div className="space-y-3">
                      {networkInfo.map(({ label, value }) => (
                        value !== undefined && value !== null && value !== '-' && (
                          <div key={label} className="flex flex-col">
                            <label className="text-xs text-slate-500 mb-1">
                              {label}
                            </label>
                            <div className="text-sm text-white font-mono bg-slate-900/50 px-3 py-2 rounded border border-slate-700 break-all">
                              {value}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-800 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-slate-400 mb-3">User Information</h4>
                    <div className="space-y-3">
                      {userInfo.map(({ label, value }) => (
                        value !== undefined && value !== null && value !== '-' && (
                          <div key={label} className="flex flex-col">
                            <label className="text-xs text-slate-500 mb-1">
                              {label}
                            </label>
                            <div className="text-sm text-white font-mono bg-slate-900/50 px-3 py-2 rounded border border-slate-700 break-all">
                              {value}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-800 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-slate-400 mb-3">Data Transfer</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {dataInfo.map(({ label, value }) => (
                        value !== undefined && value !== null && value !== '-' && (
                          <div key={label} className="bg-slate-900/50 px-3 py-3 rounded border border-slate-700">
                            <label className="text-xs text-slate-500 block mb-1">
                              {label}
                            </label>
                            <div className="text-lg font-bold text-white">
                              {value}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-800 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-slate-400 mb-3">Policy & Time</h4>
                    <div className="space-y-3">
                      {policyInfo.map(({ label, value }) => (
                        value !== undefined && value !== null && value !== '-' && (
                          <div key={label} className="flex flex-col">
                            <label className="text-xs text-slate-500 mb-1">
                              {label}
                            </label>
                            <div className="text-sm text-white font-mono bg-slate-900/50 px-3 py-2 rounded border border-slate-700">
                              {value}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-slate-950 rounded-lg overflow-hidden border border-slate-700">
                  <div className="bg-slate-800 px-4 py-2 border-b border-slate-700">
                    <span className="text-xs font-mono text-slate-400">raw_json_output</span>
                  </div>
                  <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed">
                    <code className="text-green-400">
{JSON.stringify(log, null, 2)}
                    </code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}