'use client'

import { useState, useEffect } from 'react'
import ToolkitCard from '@/components/toolkit-card'
import { TL } from '@/lib/terralink'
import { Toolkit, Tool, User, Connection } from '@/lib/types'
import { Loader2, CheckCircle, XCircle, Search, Filter, X } from 'lucide-react'

interface ToolkitWithConnections extends Toolkit {
  connectionCount: number;
  connections: any[];
  globalStats?: {
    total_connections: number;
    valid_enabled_connections: number;
    unique_users: number;
  };
}

export default function ToolkitsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [toolkits, setToolkits] = useState<ToolkitWithConnections[]>([])
  const [connections, setConnections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [isToolDialogOpen, setIsToolDialogOpen] = useState(false)
  const [executionResult, setExecutionResult] = useState<any>(null)
  const [showResult, setShowResult] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'connected'>('all')

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Get user information
      const userData = await TL.me()
      setUser(userData)
      
      // Get all toolkits
      const toolkitData = await TL.listToolkits()
      const toolkits = toolkitData as Toolkit[]
      
      // Fetch connections for each toolkit
      const connectionsPromises = toolkits.map(async (toolkit) => {
        try {
          const connections = await TL.getToolkitConnections(toolkit.name);
          return connections.map((conn: any) => ({
            ...conn,
            toolkit: toolkit.name,
            toolkit_name: toolkit.name
          }));
        } catch (error) {
          console.error(`Error fetching connections for ${toolkit.name}:`, error);
          return [];
        }
      });

      const allConnections = await Promise.all(connectionsPromises);
      const connections = allConnections.flat();
      
      console.log('🔍 All collected connections:', connections);
      console.log('🔍 Total connections count:', connections.length);
      
      setConnections(connections)
      
      // Calculate connection count for each toolkit and get global stats
      const toolkitsWithConnections = await Promise.all(toolkits.map(async (toolkit) => {
        const toolkitConnections = connections.filter(conn => 
          conn.toolkit === toolkit.name || conn.toolkit_name === toolkit.name
        );
        
        // Get global statistics for this toolkit
        let globalStats = undefined;
        try {
          globalStats = await TL.getToolkitConnectionStats(toolkit.name);
        } catch (error) {
          console.warn(`Failed to get global stats for ${toolkit.name}:`, error);
        }
        
        return {
          ...toolkit,
          connectionCount: toolkitConnections.length,
          connections: toolkitConnections,
          globalStats,
        };
      }));
      
      // Sort toolkits intelligently:
      // 1. Connected toolkits first
      // 2. Then by status (active first)
      // 3. Finally alphabetically by name
      const sortedToolkits = toolkitsWithConnections.sort((a, b) => {
        // First priority: connected toolkits
        if (a.connectionCount > 0 && b.connectionCount === 0) return -1
        if (a.connectionCount === 0 && b.connectionCount > 0) return 1
        
        // Second priority: active status (non-inactive)
        if (a.status !== 'inactive' && b.status === 'inactive') return -1
        if (a.status === 'inactive' && b.status !== 'inactive') return 1
        
        // Third priority: alphabetical by name
        return a.name.localeCompare(b.name)
      })
      
      console.log('🔍 Final toolkits with connection counts:', sortedToolkits);
      setToolkits(sortedToolkits)
      
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleConnect = async (toolkitName: string) => {
    try {
      // Start OAuth2 flow or create connection
      const request = {
        name: `${toolkitName}-connection`,
        auth_method: 'oauth2' as const
      }
      await TL.createConnection(toolkitName, request)
      // Refresh data to update connection status
      await fetchData()
    } catch (error) {
      console.error('Failed to connect toolkit:', error)
    }
  }

  const handleRevokeAccount = async (toolkitName: string, accountId: string) => {
    try {
      await TL.deleteConnection(accountId)
      // Refresh data to update connection status
      await fetchData()
    } catch (error) {
      console.error('Failed to revoke account:', error)
    }
  }

  const handleExecuteTool = async (toolSlug: string, args: any) => {
    try {
      const result = await TL.executeTool(toolSlug, args)
      return result
    } catch (error: any) {
      console.error('Failed to execute tool:', error)
      throw error
    }
  }

  // Filter toolkits based on search query and status filter
  const filteredToolkits = toolkits.filter((toolkit) => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      toolkit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      toolkit.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      toolkit.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    // Status filter
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && toolkit.status !== 'inactive') ||
      (statusFilter === 'inactive' && toolkit.status === 'inactive') ||
      (statusFilter === 'connected' && toolkit.connectionCount > 0)

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Toolkits</h1>
          <p className="text-gray-600">Browse and manage available toolkits</p>
        </div>

        {/* Statistics Overview */}
        {toolkits.length > 0 && (
          <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{toolkits.length}</div>
                <div className="text-sm text-gray-600 mt-1">Total Toolkits</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {toolkits.filter(t => t.connectionCount > 0).length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Connected</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {toolkits.filter(t => t.status !== 'inactive').length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Active</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {toolkits.reduce((total, toolkit) => total + (toolkit.tools?.length || 0), 0)}
                </div>
                <div className="text-sm text-gray-600 mt-1">Total Tools</div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="mb-8 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="flex-1 max-w-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Toolkits
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, description, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Filter by Status
                </label>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive' | 'connected')}
                    className="border border-gray-300 text-gray-500 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-w-[120px]"
                  >
                    <option value="all">All Status</option>
                    <option value="connected">Connected</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-900">
                  {filteredToolkits.length}
                </div>
                <div className="text-sm text-gray-500">
                  of {toolkits.length} toolkits
                </div>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredToolkits.length} of {toolkits.length} toolkits
              {searchQuery && ` for "${searchQuery}"`}
              {statusFilter !== 'all' && ` (${statusFilter})`}
            </span>
            {(searchQuery || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
        
        {filteredToolkits.length > 0 ? (
          <div className="space-y-8">
            {/* Connected Toolkits Section */}
            {filteredToolkits.some(t => t.connectionCount > 0) && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-6 bg-green-500 rounded-full"></div>
                  <h2 className="text-xl font-semibold text-gray-900">Connected Toolkits</h2>
                  <div className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    {filteredToolkits.filter(t => t.connectionCount > 0).length}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                  {filteredToolkits
                    .filter(toolkit => toolkit.connectionCount > 0)
                    .map((toolkit) => (
                      <div key={toolkit.name} className="h-fit">
                        <ToolkitCard
                          toolkit={toolkit}
                          connectedAccounts={connections.filter(conn => 
                            (conn.toolkit === toolkit.name || conn.toolkit_name === toolkit.name) &&
                            conn.status === 'valid' && conn.enabled
                          )}
                          globalStats={toolkit.globalStats}
                          onConnect={() => handleConnect(toolkit.name)}
                          onRevokeAccount={(accountId: string | number) => handleRevokeAccount(toolkit.name, accountId.toString())}
                          onExecuteTool={(toolSlug: string, args: any) => handleExecuteTool(toolSlug, args)}
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Available Toolkits Section */}
            {filteredToolkits.some(t => t.connectionCount === 0) && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                  <h2 className="text-xl font-semibold text-gray-900">Available Toolkits</h2>
                  <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    {filteredToolkits.filter(t => t.connectionCount === 0).length}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredToolkits
                    .filter(toolkit => toolkit.connectionCount === 0)
                    .map((toolkit) => (
                      <div key={toolkit.name} className="h-fit">
                        <ToolkitCard
                          toolkit={toolkit}
                          connectedAccounts={connections.filter(conn => 
                            (conn.toolkit === toolkit.name || conn.toolkit_name === toolkit.name) &&
                            conn.status === 'valid' && conn.enabled
                          )}
                          globalStats={toolkit.globalStats}
                          onConnect={() => handleConnect(toolkit.name)}
                          onRevokeAccount={(accountId: string | number) => handleRevokeAccount(toolkit.name, accountId.toString())}
                          onExecuteTool={(toolSlug: string, args: any) => handleExecuteTool(toolSlug, args)}
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : toolkits.length > 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No toolkits found</h3>
              <p className="text-gray-500 mb-4">
                No toolkits match your current search and filter criteria.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Clear filters
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Toolkits Available</h3>
              <p className="text-gray-500">There are currently no available toolkits</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}