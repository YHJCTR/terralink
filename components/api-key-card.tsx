'use client';

import { useState } from 'react';
import { Eye, EyeOff, Copy, Trash2 } from 'lucide-react';
import { ApiKey } from '@/lib/types';

interface ApiKeyCardProps {
  apiKey: ApiKey;
  onDelete: (id: string | number) => void;
}

export default function ApiKeyCard({ apiKey, onDelete }: ApiKeyCardProps) {
  // 移除showKey状态，不再需要切换显示/隐藏
  // const [showKey, setShowKey] = useState(true);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      // 尝试使用多个可能的字段来获取API密钥
      const keyToCopy = apiKey.key || apiKey.key_preview || '';
      if (keyToCopy) {
        await navigator.clipboard.writeText(keyToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        console.error('No API key available to copy');
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const maskKey = (key?: string) => {
    if (!key) {
      // 尝试使用key_preview
      if (apiKey.key_preview) return apiKey.key_preview;
      return ''; 
    }
    if (key.length <= 8) return key;
    return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{apiKey.name || apiKey.label || '未命名API密钥'}</h3>
          {apiKey.description && (
            <p className="text-sm text-gray-600 mt-1">{apiKey.description}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            apiKey.status === 'active' || apiKey.is_active
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {(apiKey.status === 'active' || apiKey.is_active) ? '活跃' : '已禁用'}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API 密钥
          </label>
          <div className="flex items-center space-x-2">
            <code className="flex-1 bg-gray-50 px-3 py-2 rounded border text-sm font-mono text-black">
              {apiKey.key || apiKey.key_preview || ''}
            </code>
            {/* 移除显示/隐藏按钮 */}
            <button
              onClick={copyToClipboard}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="复制密钥"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={() => {
                // 确保ID是数字类型
                const numericId = typeof apiKey.id === 'string' ? parseInt(apiKey.id, 10) : apiKey.id;
                onDelete(numericId); // 传递转换后的数字ID
              }}
              className="p-2 text-red-500 hover:text-red-700 transition-colors"
              title="删除密钥"
            >
              <Trash2 size={16} />
            </button>
          </div>
          {copied && (
            <p className="text-sm text-green-600 mt-1">已复制到剪贴板</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-black">
          <div>
            <span className="text-gray-600">创建时间:</span>
            <span className="ml-2 text-black">{formatDate(apiKey.created_at)}</span>
          </div>
          <div>
            <span className="text-gray-600">最后使用:</span>
            <span className="ml-2 text-black">
              {apiKey.last_used ? formatDate(apiKey.last_used) : '从未使用'}
            </span>
          </div>
        </div>

        {apiKey.permissions && apiKey.permissions.length > 0 && (
          <div>
            <span className="text-sm text-gray-600">权限:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {apiKey.permissions.map((permission, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                >
                  {permission}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}