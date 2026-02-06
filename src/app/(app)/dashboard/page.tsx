'use client';

import { useAuthStore } from '@/store/auth';
import { useDashboardStats } from '@/hooks/use-dashboard';
import { useMyGroups } from '@/hooks/use-groups';
import { Header } from '@/components/layout/header';
import { GroupCard } from '@/components/groups/group-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tip } from '@/components/ui/tooltip';
import {
  Users,
  FolderKanban,
  ListTodo,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Calendar,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import type { Task } from '@/types';
import { useTranslation } from '@/lib/i18n';

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  TODO: { label: 'To Do', color: 'text-slate-600 dark:text-slate-400', bgColor: 'bg-slate-100 dark:bg-slate-800', icon: <AlertCircle className="h-3.5 w-3.5" /> },
  IN_PROGRESS: { label: 'In Progress', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/30', icon: <Clock className="h-3.5 w-3.5" /> },
  DONE: { label: 'Done', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-900/30', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
};

function ProgressBar({ todo, inProgress, done }: { todo: number; inProgress: number; done: number }) {
  const total = todo + inProgress + done;
  if (total === 0) return null;

  const todoPct = (todo / total) * 100;
  const inProgressPct = (inProgress / total) * 100;
  const donePct = (done / total) * 100;

  return (
    <div className="space-y-4">
      <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        {donePct > 0 && (
          <div 
            className="bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700 ease-out" 
            style={{ width: `${donePct}%` }} 
          />
        )}
        {inProgressPct > 0 && (
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-700 ease-out" 
            style={{ width: `${inProgressPct}%` }} 
          />
        )}
        {todoPct > 0 && (
          <div 
            className="bg-slate-300 dark:bg-slate-600 transition-all duration-700 ease-out" 
            style={{ width: `${todoPct}%` }} 
          />
        )}
      </div>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Done</span>
          <span className="font-semibold text-foreground">{done}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">In Progress</span>
          <span className="font-semibold text-foreground">{inProgress}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-slate-400" />
          <span className="text-muted-foreground">To Do</span>
          <span className="font-semibold text-foreground">{todo}</span>
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const status = statusConfig[task.status];
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'DONE';

  return (
    <Link
      href={`/groups/${task.project?.group?.id}/projects/${task.projectId}`}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 group/task"
    >
      <div className={`p-1.5 rounded-md ${status.bgColor}`}>
        <span className={status.color}>{status.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate group-hover/task:text-primary transition-colors duration-200">{task.title}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {task.project?.group?.name} &middot; {task.project?.name}
        </p>
      </div>
      {task.dueDate && (
        <div className={`flex items-center gap-1.5 text-xs flex-shrink-0 px-2 py-1 rounded-md ${isOverdue ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground'}`}>
          <Calendar className="h-3 w-3" />
          {format(new Date(task.dueDate), 'MMM d')}
        </div>
      )}
      {task.assignees && task.assignees.length > 0 && (
        <div className="flex -space-x-1.5 flex-shrink-0">
          {task.assignees.slice(0, 3).map((a) => (
            <Avatar key={a.userId} className="h-6 w-6 border-2 border-card">
              <AvatarImage src={a.user?.avatar} />
              <AvatarFallback className="text-[9px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                {a.user?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
      )}
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: dashData, isLoading: statsLoading } = useDashboardStats();
  const { data: result, isLoading: groupsLoading } = useMyGroups();
  const groups = result?.data;
  const { t, locale } = useTranslation();
  const dateFnsLocale = locale === 'fr' ? frLocale : undefined;

  const s = dashData?.stats;

  const statCards = [
    { label: t('dashboard.groups'), value: s?.groups ?? '—', icon: Users, bgColor: 'bg-indigo-50 dark:bg-indigo-900/30', iconColor: 'text-indigo-600 dark:text-indigo-400' },
    { label: t('dashboard.projects'), value: s?.projects ?? '—', icon: FolderKanban, bgColor: 'bg-emerald-50 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    { label: t('dashboard.tasks'), value: s?.tasksTotal ?? '—', icon: ListTodo, bgColor: 'bg-amber-50 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400' },
    {
      label: t('dashboard.completion'),
      value: s && s.tasksTotal > 0 ? `${Math.round((s.tasksDone / s.tasksTotal) * 100)}%` : '—',
      icon: TrendingUp,
      bgColor: 'bg-violet-50 dark:bg-violet-900/30',
      iconColor: 'text-violet-600 dark:text-violet-400',
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <Header title={t('dashboard.welcomeBack', { name: user?.name?.split(' ')[0] || 'User' })} />

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6 page-enter">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          {statCards.map((stat) => (
            <Card key={stat.label} className="glass-card card-3d overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    )}
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Task Progress + My Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="glass-card animate-reveal" style={{ animationDelay: '200ms' }}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">{t('dashboard.taskProgress')}</CardTitle>
                <Tip content="Visual overview of your tasks across all projects" />
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-16" />
              ) : s && s.tasksTotal > 0 ? (
                <ProgressBar todo={s.tasksTodo} inProgress={s.tasksInProgress} done={s.tasksDone} />
              ) : (
                <div className="text-center py-8">
                  <ListTodo className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{t('dashboard.noTasksYet')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card animate-reveal" style={{ animationDelay: '300ms' }}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">{t('dashboard.myTasks')}</CardTitle>
                {dashData?.myTasks && dashData.myTasks.length > 0 && (
                  <Badge className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100">
                    {dashData.myTasks.length} {t('dashboard.active')}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : dashData?.myTasks && dashData.myTasks.length > 0 ? (
                <div className="space-y-1 -mx-3">
                  {dashData.myTasks.slice(0, 5).map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Sparkles className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{t('dashboard.noTasks')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="glass-card animate-reveal" style={{ animationDelay: '400ms' }}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">{t('dashboard.recentActivity')}</CardTitle>
              <Tip content="Latest task updates across your projects" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : dashData?.recentActivity && dashData.recentActivity.length > 0 ? (
              <div className="space-y-1 -mx-3">
                {dashData.recentActivity.slice(0, 8).map((task) => (
                  <Link
                    key={task.id}
                    href={`/groups/${task.project?.group?.id}/projects/${task.projectId}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200"
                  >
                    <div className={`p-1.5 rounded-md ${statusConfig[task.status].bgColor}`}>
                      <span className={statusConfig[task.status].color}>{statusConfig[task.status].icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        <span className="font-medium">{task.title}</span>
                        <span className="text-muted-foreground"> {t('dashboard.in')} </span>
                        <span className="text-foreground/80">{task.project?.name}</span>
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true, locale: dateFnsLocale })}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t('dashboard.noRecentActivity')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Groups */}
        <Card className="glass-card animate-reveal" style={{ animationDelay: '500ms' }}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">{t('dashboard.myGroupsTitle')}</CardTitle>
              <Link href="/groups/new">
                <Button size="sm" className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/30">
                  <Plus className="h-3.5 w-3.5" />
                  {t('dashboard.newGroup')}
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {groupsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-36" />
                ))}
              </div>
            ) : groups && groups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                {groups.slice(0, 6).map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">{t('dashboard.noGroupsYet')}</p>
                <Link href="/groups/new">
                  <Button className="mt-4 gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                    <Plus className="h-4 w-4" />
                    {t('dashboard.createFirstGroup')}
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
