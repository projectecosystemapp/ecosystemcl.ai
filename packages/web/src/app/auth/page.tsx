'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">ECOSYSTEMCL.AI</h1>
          <p className="text-gray-300">Sign in to your agent platform</p>
        </div>
        
        <Authenticator
          hideSignUp={false}
          components={{
            Header() {
              return (
                <div className="text-center p-4">
                  <h2 className="text-2xl font-bold text-white">Welcome</h2>
                </div>
              );
            }
          }}
        >
          {({ signOut, user }) => {
            useEffect(() => {
              if (user) {
                router.push('/dashboard');
              }
            }, [user]);

            return (
              <div className="text-center">
                <p className="text-white">Redirecting to dashboard...</p>
              </div>
            );
          }}
        </Authenticator>
      </div>
    </div>
  );
}