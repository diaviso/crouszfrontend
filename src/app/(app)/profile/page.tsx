'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useMyGroups } from '@/hooks/use-groups';
import { useUpdateUser } from '@/hooks/use-users';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, FolderKanban, Calendar, Mail, Edit, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

export default function ProfilePage() {
  const { user, fetchUser } = useAuthStore();
  const { data: myGroupsResult } = useMyGroups();
  const updateUser = useUpdateUser();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const { t, locale } = useTranslation();

  const groups = myGroupsResult?.data;
  const totalProjects = groups?.reduce((acc, g) => acc + (g._count?.projects || 0), 0) || 0;

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    try {
      await updateUser.mutateAsync({ name: name.trim() });
      await fetchUser();
      toast.success('Profile updated');
      setIsEditing(false);
    } catch {
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title={t('profile.title')} />

      <div className="flex-1 overflow-auto p-4 md:p-6 page-enter">
        <div className="max-w-2xl mx-auto space-y-6 stagger-children">
          {/* Profile Card */}
          <Card className="glass-card overflow-hidden">
            {/* Banner gradient */}
            <div className="h-24 bg-gradient-to-r from-primary via-purple-500 to-primary animate-gradient" />
            <CardHeader className="-mt-12">
              <div className="flex items-end justify-between">
                <Avatar className="h-20 w-20 ring-4 ring-card shadow-xl">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-purple-500 text-white text-2xl font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {!isEditing ? (
                  <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4" />
                    {t('common.edit')}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => { setIsEditing(false); setName(user?.name || ''); }}>
                      <X className="h-4 w-4" />
                    </Button>
                    <Button size="sm" className="gap-2 rounded-xl" onClick={handleSave} disabled={updateUser.isPending}>
                      <Save className="h-4 w-4" />
                      {t('common.save')}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isEditing ? (
                <div className="space-y-2">
                  <Label htmlFor="name">{t('profile.displayName')}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('profile.yourName')}
                    className="rounded-xl"
                  />
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-bold">{user?.name}</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Mail className="h-4 w-4" />
                    {user?.email}
                  </div>
                </div>
              )}

              <Separator className="opacity-50" />

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {t('profile.joined', { date: user?.createdAt ? format(new Date(user.createdAt), 'MMMM d, yyyy', { locale: locale === 'fr' ? frLocale : undefined }) : '—' })}
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1 rounded-lg">
                  <span className="font-mono text-xs">Google</span>
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="glass-card card-3d overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="flex items-center gap-4 p-6 relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{groups?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">{t('groups.title')}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card card-3d overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="flex items-center gap-4 p-6 relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                  <FolderKanban className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalProjects}</p>
                  <p className="text-sm text-muted-foreground">{t('projects.title')}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Groups */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>{t('groups.myGroups')}</CardTitle>
              <CardDescription>{t('profile.groupsBelongTo')}</CardDescription>
            </CardHeader>
            <CardContent>
              {groups && groups.length > 0 ? (
                <div className="space-y-2">
                  {groups.slice(0, 5).map((group) => (
                    <div key={group.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors duration-200">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{group.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {group._count?.members || 0} {t('groups.members')} &middot; {group._count?.projects || 0} {t('groups.projects')}
                          </p>
                        </div>
                      </div>
                      <Badge variant={group.isPublic ? 'default' : 'secondary'} className="rounded-lg">
                        {group.isPublic ? t('groups.public') : t('groups.private')}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">{t('groups.noGroups')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
