'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ConnectionCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleConnectionCallback = async () => {
      if (isProcessing) {
        console.log('连接回调已在处理中，跳过重复执行');
        return;
      }

      setIsProcessing(true);
      console.log('开始处理工具包连接OAuth回调');

      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const connectionId = searchParams.get('connection_id');
        const provider = 'github'; // 目前只支持GitHub

        console.log('回调参数:', { code: code?.substring(0, 10) + '...', state, connectionId, provider });

        if (!code || !state || !connectionId) {
          throw new Error('缺少必要的回调参数');
        }

        // 调用后端连接回调API
        const response = await fetch('/api/v1/auth/connection/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            provider,
            code,
            state,
            connection_id: connectionId
          })
        });

        const result = await response.json();
        console.log('连接回调响应:', result);

        if (response.ok && result.success) {
          setStatus('success');
          setMessage('GitHub账户连接成功！');
          console.log('GitHub工具包连接成功');
          
          // 延迟后关闭窗口或跳转
          setTimeout(() => {
            // 如果是弹窗，关闭窗口
            if (window.opener) {
              window.close();
            } else {
              // 否则跳转回控制台
              router.push('/console');
            }
          }, 2000);
        } else {
          throw new Error(result.detail || result.error || '连接失败');
        }
      } catch (error) {
        console.error('工具包连接回调失败:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : '连接失败，请重试');
      }
    };

    handleConnectionCallback();
  }, []); // 移除依赖项以防止重复执行

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            工具包连接
          </h2>
          
          {status === 'processing' && (
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">正在处理GitHub连接...</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="mt-4">
              <div className="text-green-600">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="mt-2 text-sm text-green-600">{message}</p>
              <p className="mt-1 text-xs text-gray-500">窗口将自动关闭...</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="mt-4">
              <div className="text-red-600">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="mt-2 text-sm text-red-600">{message}</p>
              <button
                onClick={() => {
                  if (window.opener) {
                    window.close();
                  } else {
                    router.push('/console');
                  }
                }}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                返回控制台
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}