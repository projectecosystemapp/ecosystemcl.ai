'use client';

import { useState } from 'react';
import { signIn, signUp, confirmSignUp } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [mode, setMode] = useState<'signIn' | 'signUp' | 'confirm'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await signIn({
        username: email,
        password,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      });
      setMode('confirm');
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await confirmSignUp({
        username: email,
        confirmationCode,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Confirmation failed');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'confirm') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="w-full max-w-md p-8 bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">ECOSYSTEMCL.AI</h1>
            <p className="text-gray-300">Confirm your email address</p>
          </div>
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-200">
              {error}
            </div>
          )}
          <form onSubmit={handleConfirm} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirmation Code
              </label>
              <input
                type="text"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded text-white"
                placeholder="Enter confirmation code"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full p-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded font-medium"
            >
              {loading ? 'Confirming...' : 'Confirm'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="w-full max-w-md p-8 bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">ECOSYSTEMCL.AI</h1>
          <p className="text-gray-300">
            {mode === 'signIn' ? 'Sign in to your agent platform' : 'Create your agent account'}
          </p>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-200">
            {error}
          </div>
        )}
        <form onSubmit={mode === 'signIn' ? handleSignIn : handleSignUp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded text-white focus:border-purple-500 focus:outline-none"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded text-white focus:border-purple-500 focus:outline-none"
              placeholder="Enter your password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded font-medium transition-colors"
          >
            {loading ? 'Loading...' : (mode === 'signIn' ? 'Sign In' : 'Sign Up')}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button
            onClick={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            {mode === 'signIn' 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Sign in"
            }
          </button>
        </div>
      </div>
    </div>
  );
}