'use client';

import { useState, useMemo } from 'react';
import { useGroups, useMyGroups, useJoinGroup } from '@/hooks/use-groups';
import { useAuthStore } from '@/store/auth';
import { Header } from '@/components/layout/header';
import { GroupCard } from '@/components/groups/group-card';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Plus, Search, Globe, Lock } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

export default function GroupsPage() {
  const { user } = useAuthStore();
  const joinGroup = useJoinGroup();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [myGroupsPage, setMyGroupsPage] = useState(1);
  const [publicGroupsPage, setPublicGroupsPage] = useState(1);
  const [activeTab, setActiveTab] = useState('my-groups');
  const { t } = useTranslation();

  const searchTimeout = useMemo(() => {
    return (value: string) => {
      const timeout = setTimeout(() => {
        setDebouncedSearch(value);
        setMyGroupsPage(1);
        setPublicGroupsPage(1);
      }, 300);
      return () => clearTimeout(timeout);
    };
  }, []);

  const { data: myGroupsResult, isLoading: myLoading } = useMyGroups({
    page: myGroupsPage,
    limit: 12,
    search: debouncedSearch || undefined,
  });

  const { data: allGroupsResult, isLoading: allLoading } = useGroups({
    page: publicGroupsPage,
    limit: 12,
    search: debouncedSearch || undefined,
    filter: 'public',
  });

  const myGroups = myGroupsResult?.data;
  const publicGroups = allGroupsResult?.data?.filter(
    (g) =>
      g.adminId !== user?.id &&
      !g.members?.some((m) => m.userId === user?.id)
  );

  const handleJoinGroup = async (groupId: string) => {
    try {
      await joinGroup.mutateAsync(groupId);
      toast.success('Successfully joined the group!');
    } catch {
      toast.error('Failed to join group');
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    searchTimeout(value);
  };

  return (
    <div className="flex flex-col h-full">
      <Header title={t('groups.title')} />

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6 page-enter mesh-gradient">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('groups.searchGroups')}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 rounded-xl border-border/50 bg-card/80 focus:bg-card"
            />
          </div>
          <Link href="/groups/new">
            <Button className="gap-2 w-full sm:w-auto rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5">
              <Plus className="h-4 w-4" />
              {t('groups.createGroup')}
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="my-groups" className="space-y-6" onValueChange={setActiveTab}>
          <TabsList className="rounded-xl bg-muted/50 p-1">
            <TabsTrigger value="my-groups" className="gap-2 rounded-lg">
              <Lock className="h-4 w-4" />
              {t('groups.myGroups')} {myGroupsResult?.meta && `(${myGroupsResult.meta.total})`}
            </TabsTrigger>
            <TabsTrigger value="public" className="gap-2 rounded-lg">
              <Globe className="h-4 w-4" />
              {t('groups.discover')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-groups">
            {myLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
              </div>
            ) : myGroups && myGroups.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                  {myGroups.map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </div>
                {myGroupsResult?.meta && (
                  <PaginationControls meta={myGroupsResult.meta} onPageChange={setMyGroupsPage} />
                )}
              </>
            ) : (
              <Card className="glass-card">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? t('groups.noGroupsSearch') : t('groups.noGroups')}
                  </p>
                  {!searchQuery && (
                    <Link href="/groups/new">
                      <Button className="mt-4 gap-2 rounded-xl">
                        <Plus className="h-4 w-4" />
                        {t('groups.createFirstGroup')}
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="public">
            {allLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
              </div>
            ) : publicGroups && publicGroups.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                  {publicGroups.map((group) => (
                    <Card
                      key={group.id}
                      className="h-full glass-card card-3d overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <CardContent className="p-6 relative">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{group.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {group._count?.members || 0} {t('groups.members')}
                              </p>
                            </div>
                          </div>
                        </div>
                        {group.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                            {group.description}
                          </p>
                        )}
                        <Button
                          className="w-full rounded-xl"
                          onClick={() => handleJoinGroup(group.id)}
                          disabled={joinGroup.isPending}
                        >
                          {t('groups.joinGroup')}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {allGroupsResult?.meta && (
                  <PaginationControls meta={allGroupsResult.meta} onPageChange={setPublicGroupsPage} />
                )}
              </>
            ) : (
              <Card className="glass-card">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Globe className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? t('groups.noPublicGroupsSearch')
                      : t('groups.noPublicGroups')}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
