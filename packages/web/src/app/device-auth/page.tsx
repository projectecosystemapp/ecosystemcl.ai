'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Terminal } from 'lucide-react';

export default function DeviceAuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthenticator((context) => [context.user]);
  
  const [userCode, setUserCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [status, setStatus] = useState<'input' | 'authorizing' | 'success' | 'error'>('input');
  const [error, setError] = useState('');

  useEffect(() => {
    // Get user_code from URL if provided
    const codeParam = searchParams.get('user_code');
    if (codeParam) {
      setUserCode(codeParam);
      setInputCode(codeParam);
    }
  }, [searchParams]);

  useEffect(() => {
    // Redirect to sign in if not authenticated
    if (!user) {
      const returnUrl = `/device-auth${window.location.search}`;
      router.push(`/auth?redirect_url=${encodeURIComponent(returnUrl)}`);
    }
  }, [user, router]);

  const handleAuthorize = async () => {
    if (!inputCode || inputCode.length !== 9) { // Format: XXXX-XXXX
      setError('Please enter a valid device code (format: XXXX-XXXX)');
      return;
    }

    setStatus('authorizing');
    setError('');

    try {
      // Authorize the device using the user code
      const response = await fetch('/api/device-auth/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_code: inputCode.toUpperCase(),
          action: 'approve',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Authorization failed');
      }

      setStatus('success');
      
      // Auto-close after success
      setTimeout(() => {
        window.close();
      }, 3000);

    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Authorization failed');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Terminal className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Connect ECOSYSTEMCL.AI CLI</CardTitle>
          <CardDescription>
            Enter the device code shown in your terminal to link your CLI with your ECOSYSTEMCL.AI account
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {status === 'input' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Device Code</label>
                <Input
                  type="text"
                  value={inputCode}
                  onChange={(e) => {
                    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    if (value.length > 4) {
                      value = value.slice(0, 4) + '-' + value.slice(4, 8);
                    }
                    setInputCode(value);
                  }}
                  placeholder="XXXX-XXXX"
                  className="text-center text-2xl font-mono tracking-wider"
                  maxLength={9}
                  autoFocus
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleAuthorize}
                className="w-full"
                size="lg"
                disabled={inputCode.length !== 9}
              >
                Authorize CLI Access
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Signed in as <span className="font-medium">{user.signInDetails?.loginId}</span>
              </div>
            </>
          )}

          {status === 'authorizing' && (
            <div className="text-center space-y-4 py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="text-lg">Authorizing your CLI...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4 py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <div className="space-y-2">
                <p className="text-lg font-semibold">CLI Authorized!</p>
                <p className="text-sm text-muted-foreground">
                  You can return to your terminal. This window will close automatically.
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4 py-8">
              <XCircle className="h-12 w-12 mx-auto text-red-500" />
              <div className="space-y-2">
                <p className="text-lg font-semibold">Authorization Failed</p>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button onClick={() => setStatus('input')} variant="outline" className="mt-4">
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
