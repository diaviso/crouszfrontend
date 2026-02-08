'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useMyGroups } from '@/hooks/use-groups';
import { useAuthStore } from '@/store/auth';
import { useTranslation } from '@/lib/i18n';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  MessageSquare,
  CalendarDays,
  LogOut,
  Plus,
  ChevronRight,
  X,
  Sparkles,
  FileEdit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tip } from '@/components/ui/tooltip';

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { data: result, isLoading } = useMyGroups();
  const groups = result?.data;
  const { t } = useTranslation();

  const navigation = [
    { name: t('sidebar.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('sidebar.messages'), href: '/messages', icon: MessageSquare },
    { name: t('sidebar.groups'), href: '/groups', icon: Users },
    { name: t('sidebar.calendar'), href: '/calendar', icon: CalendarDays },
    { name: t('sidebar.editor'), href: '/editor', icon: FileEdit },
  ];

  return (
    <div className="flex h-full w-full flex-col glass-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 group" onClick={onClose}>
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 transition-all duration-300 group-hover:shadow-indigo-500/50 group-hover:scale-105">
            <FolderKanban className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            Crousz
          </span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10 lg:hidden"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="mx-4 h-px bg-white/[0.08]" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group/nav',
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-white border-l-2 border-indigo-400'
                    : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
                )}
              >
                <item.icon className={cn(
                  'h-5 w-5 transition-all duration-200',
                  isActive ? 'text-indigo-400' : 'text-slate-500 group-hover/nav:text-slate-300'
                )} />
                <span className="flex-1">{item.name}</span>
                {isActive && (
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {t('sidebar.myGroups')}
            </span>
            <Link href="/groups/new" onClick={onClose}>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-all duration-200"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <nav className="space-y-0.5">
            {isLoading ? (
              <div className="space-y-1.5 px-1">
                <Skeleton className="h-8 w-full bg-white/5 rounded-lg" />
                <Skeleton className="h-8 w-full bg-white/5 rounded-lg" />
                <Skeleton className="h-8 w-full bg-white/5 rounded-lg" />
              </div>
            ) : groups && groups.length > 0 ? (
              groups.map((group) => {
                const isActive = pathname.includes(`/groups/${group.id}`);
                return (
                  <Link
                    key={group.id}
                    href={`/groups/${group.id}`}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-200 group/item',
                      isActive
                        ? 'bg-white/[0.08] text-white'
                        : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-300'
                    )}
                  >
                    <div className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold transition-all duration-200',
                      isActive
                        ? 'bg-indigo-500/30 text-indigo-300'
                        : 'bg-white/[0.06] text-slate-500 group-hover/item:bg-indigo-500/20 group-hover/item:text-indigo-400'
                    )}>
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate flex-1 text-[13px]">{group.name}</span>
                    <ChevronRight className={cn(
                      'h-3 w-3 text-slate-600 transition-all duration-200',
                      'opacity-0 -translate-x-1 group-hover/item:opacity-100 group-hover/item:translate-x-0',
                      isActive && 'opacity-100 translate-x-0'
                    )} />
                  </Link>
                );
              })
            ) : (
              <p className="px-3 py-2 text-xs text-slate-600">{t('sidebar.noGroups')}</p>
            )}
          </nav>
        </div>
      </ScrollArea>

      <div className="mx-4 h-px bg-white/[0.08]" />

      {/* User section */}
      <div className="p-3">
        <Link
          href="/profile"
          onClick={onClose}
          className="flex items-center gap-3 rounded-lg p-2.5 transition-all duration-200 hover:bg-white/[0.06] group/user"
        >
          <div className="relative">
            <Avatar className="h-9 w-9 ring-2 ring-white/10 transition-all duration-200 group-hover/user:ring-indigo-500/40">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-[#0f172a] dark:border-[#08080c]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-slate-200">{user?.name}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
          </div>
          <Tip content={t('auth.logout')}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all duration-200 flex-shrink-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                logout();
              }}
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </Tip>
        </Link>
      </div>
    </div>
  );
}
