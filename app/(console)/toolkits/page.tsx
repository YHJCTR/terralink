'use client'

import { useState, useEffect } from 'react'
import ToolkitCard from '@/components/toolkit-card'
import { TL } from '@/lib/terralink'
import { Toolkit, Tool, User, Connection } from '@/lib/types'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function ToolkitsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [toolkits, setToolkits] = useState<Toolkit[]>([])
  const [connections, setConnections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [isToolDialogOpen, setIsToolDialogOpen] = useState(false)
  const [executionResult, setExecutionResult] = useState<any>(null)
  const [showResult, setShowResult] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // 获取用户信息
      const userData = await TL.me()
      setUser(userData)
      
      // 获取所有工具包
      const toolkitData = await TL.listToolkits()
      
      // 获取所有连接信息
      const allConnections: any[] = []
      for (const toolkit of toolkitData as Toolkit[]) {
        try {
          const toolkitConnections = await TL.getToolkitConnections(toolkit.name)
          allConnections.push(...toolkitConnections.map((conn: any) => ({
            ...conn,
            toolkit: toolkit.name
          })))
        } catch (error) {
          console.warn(`Failed to get connections for toolkit ${toolkit.name}:`, error)
        }
      }
      
      setConnections(allConnections)
      
      // 为每个toolkit添加连接数量信息
      const toolkitsWithConnections = (toolkitData as Toolkit[]).map((toolkit: Toolkit) => {
        const toolkitConnections = allConnections.filter((conn: any) => conn.toolkit === toolkit.name)
        
        return {
          ...toolkit,
          connectionCount: toolkitConnections.length,
          connections: toolkitConnections,
        }
      })
      
      setToolkits(toolkitsWithConnections)
      
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
      // 启动OAuth2流程或创建连接
      const request = {
        name: `${toolkitName}-connection`,
        auth_method: 'oauth2' as const
      }
      await TL.createConnection(toolkitName, request)
      // 重新获取数据以更新连接状态
      await fetchData()
    } catch (error) {
      console.error('Failed to connect toolkit:', error)
    }
  }

  const handleRevokeAccount = async (toolkitName: string, accountId: string) => {
    try {
      await TL.deleteConnection(accountId)
      // 重新获取数据以更新连接状态
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">加载中...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">工具包</h1>
          <p className="text-gray-600">浏览和管理可用的工具包</p>
        </div>
        
        {toolkits.length > 0 ? (
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {toolkits.map((toolkit) => (
              <div key={toolkit.name} className="break-inside-avoid mb-6">
                <ToolkitCard
                  toolkit={toolkit}
                  connectedAccounts={connections.filter(conn => conn.toolkit === toolkit.name)}
                  onConnect={() => handleConnect(toolkit.name)}
                  onRevokeAccount={(accountId: string | number) => handleRevokeAccount(toolkit.name, accountId.toString())}
                  onExecuteTool={(toolSlug: string, args: any) => handleExecuteTool(toolSlug, args)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无工具包</h3>
              <p className="text-gray-500">当前没有可用的工具包</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}