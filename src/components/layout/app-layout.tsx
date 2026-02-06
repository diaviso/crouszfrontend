'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Sidebar } from './sidebar';
import { OfflineIndicator } from './offline-indicator';
import { connectSocket, disconnectSocket, connectNotificationSocket, connectConversationSocket } from '@/lib/socket';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, token, fetchUser } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (token) {
      connectSocket(token);
      connectNotificationSocket(token);
      connectConversationSocket(token);
    }
    return () => {
      disconnectSocket();
    };
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6 animate-reveal">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 animate-glow-pulse flex items-center justify-center">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 animate-spin-slow" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-lg font-semibold text-gradient">Crousz</p>
            <p className="text-sm text-muted-foreground">Loading your workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile sidebar overlay */}
      <div
        className={`sidebar-overlay lg:hidden ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-out
          lg:relative lg:translate-x-0 lg:w-72
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        {/* Mobile menu button */}
        <div className="lg:hidden flex items-center p-3 border-b border-border/50">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
      <OfflineIndicator />
    </div>
  );
}
