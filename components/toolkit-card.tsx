'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Toolkit, Tool } from '@/lib/types';
import ToolExecutionDialog from './tool-execution-dialog';

interface ToolkitCardProps {
  toolkit: Toolkit;
  connectedAccounts?: any[];
  onConnect: () => void;
  onRevokeAccount: (id: string | number) => void;
  onExecuteTool: (toolSlug: string, args: any) => void;
}

export default function ToolkitCard({ 
  toolkit, 
  connectedAccounts = [], 
  onConnect, 
  onRevokeAccount, 
  onExecuteTool 
}: ToolkitCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleToolClick = (tool: Tool) => {
    setSelectedTool(tool);
    setIsDialogOpen(true);
  };

  const handleToolExecution = (toolSlug: string, args: any) => {
    onExecuteTool(toolSlug, args);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{toolkit.name}</h3>
            {toolkit.description && (
              <p className="text-sm text-gray-600 mt-1">{toolkit.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs rounded-full ${
              toolkit.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {toolkit.status === 'active' ? '活跃' : '未激活'}
            </span>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">版本:</span>
            <span className="ml-2 text-gray-900">{toolkit.version || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-600">工具数量:</span>
            <span className="ml-2 text-gray-900">{toolkit.tools?.length || 0}</span>
          </div>
          <div>
            <span className="text-gray-600">更新时间:</span>
            <span className="ml-2 text-gray-900">{formatDate(toolkit.updated_at)}</span>
          </div>
        </div>

        {toolkit.tags && toolkit.tags.length > 0 && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-1">
              {toolkit.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 连接账户信息 */}
        {connectedAccounts.length > 0 && (
          <div className="mt-4">
            <h5 className="text-sm font-medium text-gray-900 mb-2">已连接账户</h5>
            <div className="space-y-2">
              {connectedAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm text-green-800">{account.external_id || account.id}</span>
                  <button
                    onClick={() => onRevokeAccount(account.id)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    撤销
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 连接按钮 */}
        {connectedAccounts.length === 0 && (
          <div className="mt-4">
            <button
              onClick={onConnect}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              连接 {toolkit.name}
            </button>
          </div>
        )}
      </div>

      {expanded && toolkit.tools && toolkit.tools.length > 0 && (
        <div className="border-t border-gray-200">
          <div className="p-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">可用工具</h4>
            <div className="space-y-3">
              {toolkit.tools.map((tool) => (
                <div
                  key={tool.slug}
                  onClick={() => handleToolClick(tool)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h5 className="font-medium text-gray-900">{tool.name}</h5>
                      <span className={`px-2 py-1 text-xs rounded ${
                        tool.status === 'available'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {tool.status === 'available' ? '可用' : '不可用'}
                      </span>
                      {tool.requires_connection && (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                          需要连接
                        </span>
                      )}
                    </div>
                    {tool.description && (
                      <p className="text-sm text-gray-600 mt-1">{tool.description}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>版本: {tool.version || 'N/A'}</span>
                      {tool.category && <span>分类: {tool.category}</span>}
                      <span>Slug: {tool.slug}</span>
                    </div>
                  </div>
                  <div className="text-sm text-blue-600">
                    点击测试
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <ToolExecutionDialog
        tool={selectedTool}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onExecute={handleToolExecution}
      />
    </div>
  );
}
