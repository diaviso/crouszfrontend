'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useGlobalSearch } from '@/hooks/use-global-search';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Settings, LogOut, User, Users, FolderKanban, ListTodo, Loader2, Globe } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation, Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const { t, locale, setLocale } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { data: searchResults, isLoading: searchLoading } = useGlobalSearch(debouncedQuery);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (path: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    router.push(path);
  };

  const hasResults = searchResults && (
    searchResults.groups.length > 0 ||
    searchResults.projects.length > 0 ||
    searchResults.tasks.length > 0 ||
    searchResults.users.length > 0
  );

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border/40 bg-background/70 backdrop-blur-2xl px-6">
      {title && (
        <h1 className="text-lg font-semibold text-foreground tracking-tight">
          {title}
        </h1>
      )}

      <div className="ml-auto flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden md:block" ref={searchRef}>
          <div className={cn(
            'relative transition-all duration-400',
            isSearchFocused ? 'w-80' : 'w-64'
          )}>
            <Search className={cn(
              'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-300',
              isSearchFocused ? 'text-indigo-500' : 'text-muted-foreground'
            )} />
            <Input
              type="search"
              placeholder={t('common.search') || 'Search...'}
              className={cn(
                'h-9 pl-9 rounded-xl border-border/50 bg-muted/40 text-sm transition-all duration-300',
                'focus:bg-background focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 focus:shadow-lg focus:shadow-indigo-500/5'
              )}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
              onFocus={() => { setIsSearchOpen(true); setIsSearchFocused(true); }}
              onBlur={() => setIsSearchFocused(false)}
            />
          </div>

          {isSearchOpen && searchQuery.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-2xl border border-border/50 rounded-xl shadow-2xl shadow-black/10 max-h-80 overflow-y-auto z-50 animate-slide-down">
              {searchLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : hasResults ? (
                <div className="py-2">
                  {searchResults!.groups.length > 0 && (
                    <div>
                      <p className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Groups</p>
                      {searchResults!.groups.map((g) => (
                        <button
                          key={g.id}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 text-left transition-all duration-200 rounded-lg mx-1"
                          style={{ width: 'calc(100% - 8px)' }}
                          onClick={() => handleResultClick(`/groups/${g.id}`)}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10">
                            <Users className="h-4 w-4 text-indigo-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{g.name}</p>
                            {g.description && <p className="text-xs text-muted-foreground truncate">{g.description}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults!.projects.length > 0 && (
                    <div>
                      <p className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Projects</p>
                      {searchResults!.projects.map((p) => (
                        <button
                          key={p.id}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 text-left transition-all duration-200 rounded-lg mx-1"
                          style={{ width: 'calc(100% - 8px)' }}
                          onClick={() => handleResultClick(`/groups/${p.groupId}/projects/${p.id}`)}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                            <FolderKanban className="h-4 w-4 text-emerald-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{p.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{p.group?.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults!.tasks.length > 0 && (
                    <div>
                      <p className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Tasks</p>
                      {searchResults!.tasks.map((t) => (
                        <button
                          key={t.id}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 text-left transition-all duration-200 rounded-lg mx-1"
                          style={{ width: 'calc(100% - 8px)' }}
                          onClick={() => handleResultClick(`/groups/${t.project?.groupId}/projects/${t.projectId}`)}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                            <ListTodo className="h-4 w-4 text-amber-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{t.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{t.project?.name} &middot; {t.project?.group?.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Search className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    No results for &quot;{searchQuery}&quot;
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <NotificationBell />
        <ThemeToggle />

        {/* Language switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted/50">
              <Globe className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-32 glass-card">
            <DropdownMenuLabel>{t('common.language')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setLocale('fr')}
              className={cn('cursor-pointer gap-2 rounded-lg', locale === 'fr' && 'bg-primary/10 text-primary')}
            >
              FR {t('common.french')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setLocale('en')}
              className={cn('cursor-pointer gap-2 rounded-lg', locale === 'en' && 'bg-primary/10 text-primary')}
            >
              EN {t('common.english')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-indigo-500/20 transition-all duration-300">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-52 glass-card" align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer gap-2 rounded-lg">
                <User className="h-4 w-4" />
                {t('auth.profile')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer gap-2 rounded-lg">
                <Settings className="h-4 w-4" />
                {t('common.settings')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive cursor-pointer gap-2 rounded-lg"
              onClick={() => logout()}
            >
              <LogOut className="h-4 w-4" />
              {t('auth.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
