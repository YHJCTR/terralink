'use client';

import { useState } from 'react';
import { X, Play, Settings, Zap } from 'lucide-react';
import { Toolkit, Tool } from '@/lib/types';
import ToolExecutionDialog from './tool-execution-dialog';

interface ToolkitPlaygroundProps {
  toolkit: Toolkit;
  isOpen: boolean;
  onClose: () => void;
  onExecuteTool: (toolSlug: string, args: any) => Promise<any>;
}

export default function ToolkitPlayground({ 
  toolkit, 
  isOpen, 
  onClose, 
  onExecuteTool 
}: ToolkitPlaygroundProps) {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [isToolDialogOpen, setIsToolDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredTools = toolkit.tools?.filter(tool => 
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tool.description && tool.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    tool.slug.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleToolTest = (tool: Tool) => {
    setSelectedTool(tool);
    setIsToolDialogOpen(true);
  };

  const handleToolExecution = async (toolSlug: string, args: any) => {
    return await onExecuteTool(toolSlug, args);
  };

  const getToolStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'unavailable':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'deprecated':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getToolStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'unavailable':
        return 'Unavailable';
      case 'deprecated':
        return 'Deprecated';
      default:
        return 'Unknown';
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                <Zap size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                  <span>{toolkit.name} Tool Playground</span>
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Test and debug all tools in the toolkit
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Search and Stats */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{toolkit.tools?.length || 0}</div>
                  <div className="text-gray-500">Total Tools</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {toolkit.tools?.filter(t => t.status === 'available').length || 0}
                  </div>
                  <div className="text-gray-500">Available Tools</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{filteredTools.length}</div>
                  <div className="text-gray-500">Search Results</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tools Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredTools.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTools.map((tool) => (
                  <div
                    key={tool.slug}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-300 group"
                  >
                    {/* Tool Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {tool.name}
                        </h3>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 text-xs rounded-full border ${getToolStatusColor(tool.status)}`}>
                            {getToolStatusText(tool.status)}
                          </span>
                          {tool.requires_connection && (
                            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-full">
                              Connection Required
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToolTest(tool)}
                          disabled={tool.status !== 'available'}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            tool.status === 'available'
                              ? 'bg-blue-500 text-white hover:bg-blue-600 hover:scale-105 shadow-md'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                          title={tool.status === 'available' ? 'Test Tool' : 'Tool Unavailable'}
                        >
                          <Play size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Tool Description */}
                    {tool.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {tool.description}
                      </p>
                    )}

                    {/* Tool Details */}
                    <div className="space-y-2 text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span>Slug:</span>
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">{tool.slug}</span>
                      </div>
                      {tool.version && (
                        <div className="flex justify-between">
                          <span>Version:</span>
                          <span>{tool.version}</span>
                        </div>
                      )}
                      {tool.category && (
                        <div className="flex justify-between">
                          <span>Category:</span>
                          <span>{tool.category}</span>
                        </div>
                      )}
                      {tool.parameters && (
                        <div className="flex justify-between">
                          <span>Parameters:</span>
                          <span>{Object.keys(tool.parameters.properties || {}).length}</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Test Button */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleToolTest(tool)}
                        disabled={tool.status !== 'available'}
                        className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                          tool.status === 'available'
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-md hover:shadow-lg'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {tool.status === 'available' ? 'Start Test' : 'Tool Unavailable'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'No matching tools found' : 'No available tools'}
                </h3>
                <p className="text-gray-500">
                  {searchQuery 
                    ? 'Try adjusting your search criteria or clear the search to view all tools'
                    : 'This toolkit currently has no available tools'
                  }
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}
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
    </>
  );
}