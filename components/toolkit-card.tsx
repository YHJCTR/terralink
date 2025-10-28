'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Zap, ExternalLink } from 'lucide-react';
import { Toolkit, Tool } from '@/lib/types';
import ToolExecutionDialog from './tool-execution-dialog';
import ToolkitPlayground from './toolkit-playground';

interface ToolkitCardProps {
  toolkit: Toolkit;
  connectedAccounts?: any[];
  globalStats?: {
    total_connections: number;
    valid_enabled_connections: number;
    unique_users: number;
  };
  onConnect: () => void;
  onRevokeAccount: (id: string | number) => void;
  onExecuteTool: (toolSlug: string, args: any) => Promise<any>;
}

export default function ToolkitCard({ 
  toolkit, 
  connectedAccounts = [], 
  globalStats,
  onConnect, 
  onRevokeAccount, 
  onExecuteTool 
}: ToolkitCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false);

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

  const handleToolExecution = async (toolSlug: string, args: any) => {
    return await onExecuteTool(toolSlug, args);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-300">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                {toolkit.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{toolkit.name}</h3>
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                  toolkit.status === 'inactive' 
                    ? 'bg-gray-100 text-gray-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {toolkit.status === 'inactive' ? 'Inactive' : 'Active'}
                </span>
              </div>
            </div>
            {toolkit.description && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{toolkit.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPlaygroundOpen(true)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group"
              title="Open Tool Playground"
            >
              <Zap size={18} className="group-hover:text-blue-600" />
            </button>
            <button
              onClick={() => router.push(`/toolkits/${encodeURIComponent(toolkit.name)}`)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group"
              title="View Toolkit Details"
            >
              <ExternalLink size={18} className="group-hover:text-blue-600" />
            </button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{toolkit.tools?.length || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Tools</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {globalStats ? globalStats.unique_users : connectedAccounts.length}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {globalStats ? 'Connected Users' : 'My Connections'}
          </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
          <span>Version: {toolkit.version || 'N/A'}</span>
        <span>Updated: {formatDate(toolkit.updated_at)}</span>
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

        {/* Connected accounts information */}
          {connectedAccounts.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-900 mb-2">Connected Accounts</h5>
            <div className="space-y-2">
              {connectedAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm text-green-800">{account.external_id || account.id}</span>
                  <button
                    onClick={() => onRevokeAccount(account.id)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connect button */}
        {connectedAccounts.length === 0 && (
          <div className="mt-4">
            <button
              onClick={onConnect}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              Connect {toolkit.name}
            </button>
          </div>
        )}
      </div>

      {expanded && toolkit.tools && toolkit.tools.length > 0 && (
        <div className="border-t border-gray-200">
          <div className="p-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Available Tools</h4>
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
                        {tool.status === 'available' ? 'Available' : 'Unavailable'}
                      </span>
                      {tool.requires_connection && (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                          Connection Required
                        </span>
                      )}
                    </div>
                    {tool.description && (
                      <p className="text-sm text-gray-600 mt-1">{tool.description}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>Version: {tool.version || 'N/A'}</span>
                      {tool.category && <span>Category: {tool.category}</span>}
                      <span>Slug: {tool.slug}</span>
                    </div>
                  </div>
                  <div className="text-sm text-blue-600">
                    Test Tool
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
      
      <ToolkitPlayground
        toolkit={toolkit}
        isOpen={isPlaygroundOpen}
        onClose={() => setIsPlaygroundOpen(false)}
        onExecuteTool={onExecuteTool}
      />
    </div>
  );
}
