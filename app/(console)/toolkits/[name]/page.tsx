'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, Zap, Settings, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { TL } from '@/lib/terralink'
import { Toolkit, Tool, Connection } from '@/lib/types'
import ToolExecutionDialog from '@/components/tool-execution-dialog'

export default function ToolkitDetailPage() {
  const params = useParams()
  const router = useRouter()
  const toolkitName = params.name as string
  
  const [toolkit, setToolkit] = useState<Toolkit | null>(null)
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [isToolDialogOpen, setIsToolDialogOpen] = useState(false)


  useEffect(() => {
    fetchToolkitDetails()
  }, [toolkitName])

  const fetchToolkitDetails = async () => {
    try {
      setLoading(true)
      console.log('Fetching toolkit details for:', toolkitName)
      
      // Get toolkit details
      const toolkits = await TL.listToolkits()
      console.log('Available toolkits:', toolkits)
      const foundToolkit = toolkits.find((t: Toolkit) => t.name === toolkitName)
      console.log('Found toolkit:', foundToolkit)
      
      if (!foundToolkit) {
        console.error('Toolkit not found, redirecting to /toolkits')
        router.push('/toolkits')
        return
      }
      
      setToolkit(foundToolkit)
      
      // Get connections for this toolkit
      try {
        console.log('Fetching connections for toolkit:', toolkitName)
        const toolkitConnections = await TL.getToolkitConnections(toolkitName)
        console.log('Toolkit connections:', toolkitConnections)
        setConnections(toolkitConnections)
      } catch (error) {
        console.warn(`Failed to get connections for toolkit ${toolkitName}:`, error)
        setConnections([])
      }
      
    } catch (error) {
      console.error('Failed to fetch toolkit details:', error)
    } finally {
      setLoading(false)
    }
  }



  const handleRevokeConnection = async (connectionId: string) => {
    try {
      await TL.deleteConnection(connectionId)
      await fetchToolkitDetails() // Refresh data
    } catch (error) {
      console.error('Failed to revoke connection:', error)
    }
  }

  const handleToolTest = (tool: Tool) => {
    setSelectedTool(tool)
    setIsToolDialogOpen(true)
  }

  const handleToolExecution = async (toolSlug: string, args: any) => {
    return await TL.executeTool(toolSlug, args)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'active':
      case 'available':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'inactive':
      case 'unavailable':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading toolkit details...</p>
        </div>
      </div>
    )
  }

  if (!toolkit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Toolkit not found</p>
          <button
            onClick={() => router.push('/toolkits')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Toolkits
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/toolkits')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  {toolkit.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{toolkit.name}</h1>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusIcon(toolkit.status)}
                    <span className="text-sm text-gray-600 capitalize">{toolkit.status || 'Unknown'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Toolkit Information */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Overview Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
              
              {toolkit.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600 leading-relaxed">{toolkit.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{toolkit.tools?.length || 0}</div>
                  <div className="text-sm text-gray-600 mt-1">Tools Available</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{connections.length}</div>
                  <div className="text-sm text-gray-600 mt-1">Active Connections</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{toolkit.version || 'N/A'}</div>
                  <div className="text-sm text-gray-600 mt-1">Version</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{toolkit.tags?.length || 0}</div>
                  <div className="text-sm text-gray-600 mt-1">Tags</div>
                </div>
              </div>
              
              {toolkit.tags && toolkit.tags.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {toolkit.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tools Section */}
            {toolkit.tools && toolkit.tools.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Tools</h2>
                <div className="space-y-4">
                  {toolkit.tools.map((tool) => (
                    <div
                      key={tool.slug}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">{tool.name}</h3>
                            {getStatusIcon(tool.status)}
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              tool.status === 'available'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {tool.status === 'available' ? 'Available' : 'Unavailable'}
                            </span>
                            {tool.requires_connection && (
                              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                Connection Required
                              </span>
                            )}
                          </div>
                          
                          {tool.description && (
                            <p className="text-gray-600 mb-3">{tool.description}</p>
                          )}
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <span>Slug: <code className="bg-gray-100 px-1 rounded">{tool.slug}</code></span>
                            {tool.version && <span>Version: {tool.version}</span>}
                            {tool.category && <span>Category: {tool.category}</span>}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleToolTest(tool)}
                          className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                        >
                          <Zap className="w-4 h-4" />
                          <span>Start Test</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Connections & Metadata */}
          <div className="space-y-6">
            
            {/* Connections Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Connections</h2>
              
              {connections.length > 0 ? (
                <div className="space-y-3">
                  {connections.map((connection) => (
                    <div key={connection.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{connection.name}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          connection.status === 'valid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {connection.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Method: {connection.auth_method}</div>
                        {connection.last_used_at && (
                          <div>Last used: {formatDate(connection.last_used_at)}</div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRevokeConnection(connection.id)}
                        className="mt-2 text-xs text-red-600 hover:text-red-800"
                      >
                        Revoke Connection
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No connections configured</p>
                </div>
              )}
            </div>

            {/* Metadata Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Toolkit ID:</span>
                  <span className="font-mono text-gray-900">{toolkit.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Version:</span>
                  <span className="text-gray-900">{toolkit.version || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-gray-900 capitalize">{toolkit.status || 'Unknown'}</span>
                </div>
                {toolkit.updated_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="text-gray-900">{formatDate(toolkit.updated_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tool Execution Dialog */}
      <ToolExecutionDialog
        tool={selectedTool}
        isOpen={isToolDialogOpen}
        onClose={() => setIsToolDialogOpen(false)}
        onExecute={handleToolExecution}
      />
    </div>
  )
}