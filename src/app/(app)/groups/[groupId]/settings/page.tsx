'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGroup, useUpdateGroup, useDeleteGroup, useTransferOwnership } from '@/hooks/use-groups';
import { useAuthStore } from '@/store/auth';
import { Header } from '@/components/layout/header';
import { GroupForm } from '@/components/groups/group-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Settings, Trash2, Shield, Users, Calendar, ArrowRightLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import Link from 'next/link';
import { toast } from 'sonner';
import { UpdateGroupDto } from '@/types';
import { useTranslation } from '@/lib/i18n';

export default function GroupSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  const { user } = useAuthStore();

  const { data: group, isLoading } = useGroup(groupId);
  const updateGroup = useUpdateGroup();
  const deleteGroup = useDeleteGroup();
  const transferOwnership = useTransferOwnership();
  const [transferTarget, setTransferTarget] = useState<string | null>(null);
  const { t, locale } = useTranslation();

  const isAdmin = group?.adminId === user?.id ||
    group?.members?.some((m) => m.userId === user?.id && m.role === 'ADMIN');

  const handleUpdate = async (data: { name?: string; description?: string; isPublic?: boolean }) => {
    try {
      await updateGroup.mutateAsync({ id: groupId, data: data as UpdateGroupDto });
      toast.success('Group updated');
    } catch {
      toast.error('Failed to update group');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGroup.mutateAsync(groupId);
      toast.success('Group deleted');
      router.push('/groups');
    } catch {
      toast.error('Failed to delete group');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Header title={t('groups.groupSettings')} />
        <div className="flex-1 p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex flex-col h-full">
        <Header title={t('groups.notFound')} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center animate-reveal">
            <p className="text-muted-foreground">{t('groups.notFoundDesc')}</p>
            <Link href="/groups">
              <Button className="mt-4 rounded-xl">{t('groups.backToGroups')}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col h-full">
        <Header title={t('groups.accessDenied')} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center animate-reveal">
            <Shield className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">{t('groups.adminOnly')}</p>
            <Link href={`/groups/${groupId}`}>
              <Button className="mt-4 rounded-xl">{t('groups.backToGroup')}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header title={t('groups.groupSettings')} />

      <div className="flex-1 overflow-auto p-4 md:p-6 page-enter">
        <div className="max-w-2xl mx-auto space-y-6 stagger-children">
          <div className="flex items-center gap-4">
            <Link href={`/groups/${groupId}`}>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{group.name}</h1>
              <p className="text-muted-foreground">{t('groups.groupSettings')}</p>
            </div>
          </div>

          <Card className="glass-card overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary/50 to-purple-500/50" />
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{t('groups.general')}</CardTitle>
                  <CardDescription>{t('groups.generalDesc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <GroupForm
                group={group}
                onSubmit={handleUpdate}
                isLoading={updateGroup.isPending}
              />
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>{t('groups.groupInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg">
                <span className="text-sm text-muted-foreground">{t('groups.visibility')}</span>
                <Badge variant={group.isPublic ? 'default' : 'secondary'} className="rounded-lg">
                  {group.isPublic ? t('groups.public') : t('groups.private')}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg">
                <span className="text-sm text-muted-foreground">{t('groups.members')}</span>
                <div className="flex items-center gap-1 text-sm">
                  <Users className="h-4 w-4" />
                  {group.members?.length || 0}
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg">
                <span className="text-sm text-muted-foreground">{t('groups.created')}</span>
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(group.createdAt), 'MMMM d, yyyy', { locale: locale === 'fr' ? frLocale : undefined })}
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg">
                <span className="text-sm text-muted-foreground">{t('groups.admin')}</span>
                <span className="text-sm font-medium">{group.admin?.name}</span>
              </div>
            </CardContent>
          </Card>

          {group.adminId === user?.id && group.members && group.members.filter(m => m.userId !== user?.id).length > 0 && (
            <Card className="glass-card overflow-hidden border-amber-500/30">
              <div className="h-1 bg-gradient-to-r from-amber-500/50 to-orange-500/50" />
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/10">
                    <ArrowRightLeft className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <CardTitle>{t('groups.transferOwnership')}</CardTitle>
                    <CardDescription>{t('groups.transferOwnershipDesc')}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.members
                  .filter((m) => m.userId !== user?.id)
                  .map((m) => (
                    <div key={m.userId} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors duration-200">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={m.user.avatar} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {m.user.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{m.user.name}</p>
                          <p className="text-xs text-muted-foreground">{m.role}</p>
                        </div>
                      </div>
                      <AlertDialog open={transferTarget === m.userId} onOpenChange={(open) => !open && setTransferTarget(null)}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => setTransferTarget(m.userId)}
                        >
                          {t('groups.transfer')}
                        </Button>
                        <AlertDialogContent className="glass-card">
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('groups.transferConfirm', { name: m.user.name })}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('groups.transferConfirmDesc', { name: m.user.name })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => {
                                try {
                                  await transferOwnership.mutateAsync({ groupId, newOwnerId: m.userId });
                                  toast.success(`Ownership transferred to ${m.user.name}`);
                                  setTransferTarget(null);
                                  router.push(`/groups/${groupId}`);
                                } catch {
                                  toast.error('Failed to transfer ownership');
                                }
                              }}
                              className="bg-amber-600 hover:bg-amber-700 rounded-xl"
                            >
                              {t('groups.transferOwnership')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

          {group.adminId === user?.id && (
            <Card className="glass-card overflow-hidden border-destructive/30">
              <div className="h-1 bg-gradient-to-r from-red-500/50 to-orange-500/50" />
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-destructive/10">
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <CardTitle className="text-destructive">{t('groups.dangerZone')}</CardTitle>
                    <CardDescription>{t('groups.dangerZoneDesc')}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-3 rounded-xl">
                  <div>
                    <p className="text-sm font-medium">{t('groups.deleteThisGroup')}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('groups.deleteGroupDesc')}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="rounded-xl">
                        {t('groups.deleteGroup')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="glass-card">
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('groups.deleteGroup')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('groups.deleteConfirm', { name: group.name })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive hover:bg-destructive/90 rounded-xl"
                        >
                          {t('groups.deletePermanently')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
