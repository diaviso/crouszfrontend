'use client';

import Link from 'next/link';
import { Group } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, FolderKanban, Lock, Globe } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { useTranslation } from '@/lib/i18n';

interface GroupCardProps {
  group: Group;
}

export function GroupCard({ group }: GroupCardProps) {
  const { t, locale } = useTranslation();
  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="h-full glass-card card-3d cursor-pointer group">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/50 transition-colors group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/70">
                <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{group.name}</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {t('groups.createdAgo', { time: formatDistanceToNow(new Date(group.createdAt), { addSuffix: true, locale: locale === 'fr' ? frLocale : undefined }) })}
                </CardDescription>
              </div>
            </div>
            <Badge 
              variant="secondary" 
              className={`text-[10px] px-1.5 py-0.5 ${group.isPublic ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
            >
              {group.isPublic ? (
                <>
                  <Globe className="h-2.5 w-2.5 mr-1" />
                  {t('groups.public')}
                </>
              ) : (
                <>
                  <Lock className="h-2.5 w-2.5 mr-1" />
                  {t('groups.private')}
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {group.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{group.description}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {group._count?.members || 0}
              </span>
              <span className="flex items-center gap-1">
                <FolderKanban className="h-3 w-3" />
                {group._count?.projects || 0}
              </span>
            </div>

            {group.admin && (
              <Avatar className="h-6 w-6">
                <AvatarImage src={group.admin.avatar} alt={group.admin.name} />
                <AvatarFallback className="text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                  {group.admin.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
