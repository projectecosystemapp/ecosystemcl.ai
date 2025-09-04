'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Terminal, Download, Users, CreditCard, Menu, LogOut } from "lucide-react";
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { useEffect, useState } from 'react';

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      window.location.href = '/auth';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };
  
  if (!isClient) {
    return null;
  }
  
  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Terminal className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">ECOSYSTEMCL.AI</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/agents" className="text-gray-300 hover:text-white transition-colors">
              Agents
            </Link>
            <Link href="/pricing" className="text-gray-300 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/download" className="text-gray-300 hover:text-white transition-colors">
              Download
            </Link>
            <Link href="/docs" className="text-gray-300 hover:text-white transition-colors">
              Docs
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild className="hidden md:flex">
              <Link href="/download">
                <Download className="mr-2 h-4 w-4" />
                Download CLI
              </Link>
            </Button>
            
            {user ? (
              <>
                <Button size="sm" asChild>
                  <Link href="/dashboard">
                    Dashboard
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button size="sm" asChild>
                <Link href="/auth">
                  Sign In
                </Link>
              </Button>
            )}

            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
