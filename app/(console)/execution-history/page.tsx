'use client'

import { useState, useEffect, useCallback } from 'react'
import { TL } from '@/lib/terralink'
import { Loader2, Search, Filter, Calendar, Clock, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

interface ToolExecution {
  id: number
  user_id: string
  tool_slug: string
  connection_id?: string
  started_at: string
  finished_at?: string
  ok?: boolean
  error?: string
  trace_id?: string
  input_size?: number
  output_size?: number
  cost_estimate?: number
  meta?: any
}

interface ExecutionHistoryResponse {
  items: ToolExecution[]
  total: number
  page: number
  size: number
  pages: number
}

export default function ExecutionHistoryPage() {
  const [executions, setExecutions] = useState<ToolExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(0)
  
  // Filter state
  const [filters, setFilters] = useState({
    tool_slug: '',
    success_only: '' as '' | 'true' | 'false',
    start_date: '',
    end_date: '',
    sort_by: 'started_at',
    sort_order: 'desc' as 'asc' | 'desc'
  })
  
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)
  const [selectedExecution, setSelectedExecution] = useState<ToolExecution | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const fetchExecutions = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage,
        size: pageSize
      }
      
      // Add filters with proper mapping - prioritize filter over search term
      if (filters.tool_slug && filters.tool_slug.trim()) {
        params.tool_slug = filters.tool_slug.trim()
      } else if (searchTerm && searchTerm.trim()) {
        params.tool_slug = searchTerm.trim()
      }
      
      if (filters.success_only !== '') {
        params.success_only = filters.success_only === 'true'
      }
      if (filters.start_date && filters.start_date.trim()) {
        params.start_date = filters.start_date.trim()
      }
      if (filters.end_date && filters.end_date.trim()) {
        params.end_date = filters.end_date.trim()
      }
      
      const response = await TL.getToolExecutionHistory(params) as ExecutionHistoryResponse
      setExecutions(response.items || [])
      setTotal(response.total || 0)
      setTotalPages(response.pages || 0)
    } catch (error) {
      console.error('Failed to fetch execution history:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExecutions()
  }, [currentPage])
  
  // Handle filters change debouncing separately
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    
    const timer = setTimeout(() => {
      fetchExecutions()
    }, 500)
    
    setDebounceTimer(timer)
    
    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [filters])

  const handleSearch = () => {
    setCurrentPage(1)
    fetchExecutions()
  }

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }, [])

  const getStatusIcon = (execution: ToolExecution) => {
    if (execution.ok === true) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    } else if (execution.ok === false) {
      return <XCircle className="w-4 h-4 text-red-500" />
    } else {
      return <AlertCircle className="w-4 h-4 text-yellow-500" />
    }
  }

  const getStatusText = (execution: ToolExecution) => {
    if (execution.ok === true) {
      return 'Success'
    } else if (execution.ok === false) {
      return 'Failed'
    } else {
      return 'Running'
    }
  }

  const formatDuration = (durationMs?: number) => {
    if (!durationMs) return '-'
    if (durationMs < 1000) return `${durationMs}ms`
    return `${(durationMs / 1000).toFixed(2)}s`
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  if (loading && executions.length === 0) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading execution history...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tool Execution History</h1>
        <p className="text-gray-600">View your tool execution history and detailed information</p>
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search box */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tool name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
          </div>
          
          {/* Filter button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-900 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4 mr-2 text-gray-900" />
            Filters
          </button>
          
          {/* Search button */}
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tool</label>
                <input
                  type="text"
                  placeholder="Tool name"
                  value={filters.tool_slug}
                  onChange={(e) => handleFilterChange('tool_slug', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.success_only}
                  onChange={(e) => handleFilterChange('success_only', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="">All Status</option>
                  <option value="true">Success</option>
                  <option value="false">Failed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Execution history table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Toolkit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tool Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {executions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No execution records
                  </td>
                </tr>
              ) : (
                executions.map((execution) => (
                  <tr key={execution.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(execution)}
                        <span className="ml-2 text-sm text-gray-900">
                          {getStatusText(execution)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {execution.tool_slug.split('.')[0] || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {execution.tool_slug.split('.').slice(1).join('.') || execution.tool_slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(execution.started_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {execution.finished_at && execution.started_at ? 
                        formatDuration(new Date(execution.finished_at).getTime() - new Date(execution.started_at).getTime()) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedExecution(execution)
                          setShowDetails(true)
                        }}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * pageSize, total)}
                  </span>{' '}
                  of <span className="font-medium">{total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {/* Page number buttons */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                    if (pageNum > totalPages) return null
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Details modal */}
      {showDetails && selectedExecution && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Execution Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Execution ID</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedExecution.id}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tool</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedExecution.tool_slug}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1 flex items-center">
                      {getStatusIcon(selectedExecution)}
                      <span className="ml-2 text-sm text-gray-900">
                        {getStatusText(selectedExecution)}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Time</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDateTime(selectedExecution.started_at)}</p>
                  </div>
                  
                  {selectedExecution.finished_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">End Time</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDateTime(selectedExecution.finished_at)}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedExecution.finished_at && selectedExecution.started_at ? 
                        formatDuration(new Date(selectedExecution.finished_at).getTime() - new Date(selectedExecution.started_at).getTime()) : '-'}
                    </p>
                  </div>
                  
                  {selectedExecution.trace_id && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Trace ID</label>
                      <p className="mt-1 text-sm text-gray-900 font-mono">{selectedExecution.trace_id}</p>
                    </div>
                  )}
                </div>
                
                {/* Technical Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Technical Information</h3>
                  
                  {selectedExecution.connection_id && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Connection ID</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedExecution.connection_id}</p>
                    </div>
                  )}
                  
                  {selectedExecution.input_size !== undefined && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Input Size</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedExecution.input_size} bytes</p>
                    </div>
                  )}
                  
                  {selectedExecution.output_size !== undefined && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Output Size</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedExecution.output_size} bytes</p>
                    </div>
                  )}
                  
                  {selectedExecution.cost_estimate !== undefined && selectedExecution.cost_estimate !== null && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Cost Estimate</label>
                      <p className="mt-1 text-sm text-gray-900">${selectedExecution.cost_estimate.toFixed(4)}</p>
                    </div>
                  )}
                  
                  {selectedExecution.error && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Error Message</label>
                      <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-800">{selectedExecution.error}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Metadata */}
              {selectedExecution.meta && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Metadata</h3>
                  <div className="bg-gray-50 rounded-md p-4">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(selectedExecution.meta, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}