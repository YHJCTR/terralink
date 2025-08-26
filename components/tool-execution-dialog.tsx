'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Tool } from '@/lib/types';

interface ToolExecutionDialogProps {
  tool: Tool | null;
  isOpen: boolean;
  onClose: () => void;
  onExecute: (toolSlug: string, args: any) => void;
}

export default function ToolExecutionDialog({
  tool,
  isOpen,
  onClose,
  onExecute
}: ToolExecutionDialogProps) {
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  if (!isOpen || !tool) return null;

  const handleParameterChange = (paramName: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const validateParameters = () => {
    if (!tool?.parameters?.required) return { isValid: true, errors: [] };
    
    const errors: string[] = [];
    const required = tool.parameters.required;
    
    required.forEach((paramKey: string) => {
      const value = parameters[paramKey];
      if (value === undefined || value === null || value === '') {
        const param = tool.parameters.properties?.[paramKey];
        errors.push(`${paramKey}${param?.description ? ` (${param.description})` : ''} 是必填参数`);
      }
    });
    
    return { isValid: errors.length === 0, errors };
  };

  const handleExecute = async () => {
    const validation = validateParameters();
    if (!validation.isValid) {
      alert(`参数验证失败:\n${validation.errors.join('\n')}`);
      return;
    }
    
    setIsExecuting(true);
    setExecutionResult(null);
    setExecutionError(null);
    setShowResult(false);
    
    try {
      // 清理参数，移除空值
      const cleanedParameters = Object.entries(parameters).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);
      
      const result = await onExecute(tool.slug, cleanedParameters);
      setExecutionResult(result);
      setShowResult(true);
    } catch (error) {
      console.error('Tool execution failed:', error);
      setExecutionError(error instanceof Error ? error.message : '工具执行失败');
      setShowResult(true);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setParameters({});
    setExecutionResult(null);
    setExecutionError(null);
    setShowResult(false);
  };

  const renderParameterInput = (key: string, param: any) => {
    const value = parameters[key] ?? param.default ?? '';
    const isRequired = tool?.parameters?.required?.includes(key) || false;
    
    const handleChange = (newValue: any) => {
      setParameters(prev => ({
        ...prev,
        [key]: newValue
      }));
    };

    const baseInputClass = "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors text-gray-900";
    const inputClass = `${baseInputClass} ${isRequired && !value ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`;

    switch (param.type) {
      case 'string':
        // 检查是否有枚举值
        if (param.enum && Array.isArray(param.enum)) {
          return (
            <select
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              className={inputClass}
            >
              <option value="">请选择...</option>
              {param.enum.map((option: string) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          );
        }
        // 检查是否是长文本
        if (param.format === 'textarea' || (param.maxLength && param.maxLength > 100)) {
          return (
            <textarea
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              className={inputClass}
              placeholder={param.description || `请输入${key}`}
              rows={3}
              maxLength={param.maxLength}
            />
          );
        }
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className={inputClass}
            placeholder={param.description || `请输入${key}`}
            maxLength={param.maxLength}
            pattern={param.pattern}
          />
        );
      
      case 'number':
      case 'integer':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(param.type === 'integer' ? parseInt(e.target.value) || '' : parseFloat(e.target.value) || '')}
            className={inputClass}
            placeholder={param.description || `请输入${key}`}
            min={param.minimum}
            max={param.maximum}
            step={param.type === 'integer' ? 1 : 'any'}
          />
        );
      
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value === true || value === 'true'}
              onChange={(e) => handleChange(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">
              {param.description || key}
            </span>
          </div>
        );
      
      case 'array':
        return (
          <div className="space-y-2">
            <textarea
              value={Array.isArray(value) ? value.join('\n') : value}
              onChange={(e) => {
                const lines = e.target.value.split('\n').filter(line => line.trim());
                handleChange(lines);
              }}
              className={inputClass}
              placeholder={param.description || `每行输入一个${key}项目`}
              rows={3}
            />
            <p className="text-xs text-gray-500">每行输入一个项目</p>
          </div>
        );
      
      case 'object':
        return (
          <textarea
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleChange(parsed);
              } catch {
                handleChange(e.target.value);
              }
            }}
            className={inputClass}
            placeholder={param.description || `请输入JSON格式的${key}`}
            rows={4}
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className={inputClass}
            placeholder={param.description || `请输入${key}`}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-400">执行工具: {tool.name}</h2>
            {tool.description && (
              <p className="text-sm text-gray-600 mt-1">{tool.description}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {!showResult ? (
            // 参数配置界面
            tool.parameters && tool.parameters.properties && Object.keys(tool.parameters.properties).length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">参数配置</h3>
                {Object.entries(tool.parameters.properties).map(([key, param]: [string, any]) => {
                  const isRequired = tool.parameters.required?.includes(key);
                  const hasValue = parameters[key] !== undefined && parameters[key] !== null && parameters[key] !== '';
                  
                  return (
                    <div key={key} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        <span className="flex items-center justify-between">
                          <span>
                            {key}
                            {isRequired && <span className="text-red-500 ml-1">*</span>}
                          </span>
                          <span className="text-xs text-gray-400 font-normal">
                            {param.type}
                            {param.format && ` (${param.format})`}
                          </span>
                        </span>
                      </label>
                      {renderParameterInput(key, param)}
                      <div className="flex justify-between items-start">
                        {param.description && (
                          <p className="text-xs text-gray-500 flex-1">{param.description}</p>
                        )}
                        {isRequired && !hasValue && (
                          <p className="text-xs text-red-500 ml-2">必填</p>
                        )}
                      </div>
                      {/* 显示参数约束信息 */}
                      {(param.minimum !== undefined || param.maximum !== undefined || param.maxLength || param.enum) && (
                        <div className="text-xs text-gray-400">
                          {param.minimum !== undefined && `最小值: ${param.minimum}`}
                          {param.maximum !== undefined && ` 最大值: ${param.maximum}`}
                          {param.maxLength && ` 最大长度: ${param.maxLength}`}
                          {param.enum && ` 可选值: ${param.enum.join(', ')}`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">此工具无需参数配置</p>
              </div>
            )
          ) : (
            // 执行结果界面
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">执行结果</h3>
              {executionError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-red-800 font-medium mb-2">执行失败</h4>
                  <p className="text-red-700 text-sm">{executionError}</p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="text-green-800 font-medium mb-2">执行成功</h4>
                  <div className="bg-white border rounded p-3 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                      {typeof executionResult === 'string' 
                        ? executionResult 
                        : JSON.stringify(executionResult, null, 2)
                      }
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          {!showResult ? (
            // 参数配置阶段的按钮
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleExecute}
                disabled={isExecuting}
                className="px-4 py-2 bg-blue-500 text-black rounded-md hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
              >
                {isExecuting ? '执行中...' : '执行工具'}
              </button>
            </>
          ) : (
            // 结果显示阶段的按钮
            <>
              <button
                onClick={() => setShowResult(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                返回
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                关闭
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}