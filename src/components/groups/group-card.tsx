'use client';

import Link from 'next/link';
import { Group } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, FolderKanban, Lock, Globe, ArrowUpRight } from 'lucide-react';
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
      <Card className="h-full glass-card card-3d cursor-pointer group overflow-hidden relative">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <CardHeader className="pb-2 relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 transition-all duration-300 group-hover:from-indigo-500/25 group-hover:to-violet-500/25 group-hover:shadow-lg group-hover:shadow-indigo-500/10">
                <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">{group.name}</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {t('groups.createdAgo', { time: formatDistanceToNow(new Date(group.createdAt), { addSuffix: true, locale: locale === 'fr' ? frLocale : undefined }) })}
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="secondary"
              className={`text-[10px] px-2 py-0.5 rounded-lg border-0 ${group.isPublic ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'}`}
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
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/50">
                <Users className="h-3 w-3" />
                {group._count?.members || 0}
              </span>
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/50">
                <FolderKanban className="h-3 w-3" />
                {group._count?.projects || 0}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {group.admin && (
                <Avatar className="h-6 w-6 ring-2 ring-card">
                  <AvatarImage src={group.admin.avatar} alt={group.admin.name} />
                  <AvatarFallback className="text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                    {group.admin.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <ArrowUpRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-indigo-500 transition-all duration-300" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
