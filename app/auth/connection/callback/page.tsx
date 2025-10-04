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
        console.log('Connection callback already processing, skipping duplicate execution');
        return;
      }

      setIsProcessing(true);
      console.log('Starting toolkit connection OAuth callback processing');

      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const connectionId = searchParams.get('connection_id');
        const provider = 'github'; // Currently only supports GitHub

        console.log('Callback parameters:', { code: code?.substring(0, 10) + '...', state, connectionId, provider });

        if (!code || !state || !connectionId) {
          throw new Error('Missing required callback parameters');
        }

        // Call backend connection callback API
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
        console.log('Connection callback response:', result);

        if (response.ok && result.success) {
          setStatus('success');
          setMessage('GitHub account connected successfully!');
          console.log('GitHub toolkit connection successful');
          
          // Close window or redirect after delay
          setTimeout(() => {
            // If it's a popup, close the window
            if (window.opener) {
              window.close();
            } else {
              // Otherwise redirect back to console
              router.push('/console');
            }
          }, 2000);
        } else {
          throw new Error(result.detail || result.error || 'Connection failed');
        }
      } catch (error) {
        console.error('Toolkit connection callback failed:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Connection failed, please try again');
      }
    };

    handleConnectionCallback();
  }, []); // Remove dependencies to prevent duplicate execution

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Toolkit Connection
          </h2>
          
          {status === 'processing' && (
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Processing GitHub connection...</p>
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
              <p className="mt-1 text-xs text-gray-500">Window will close automatically...</p>
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
                Return to Console
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}