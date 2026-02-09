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
  ArrowUpRight,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import Link from 'next/link';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import type { Task } from '@/types';
import { useTranslation } from '@/lib/i18n';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
} from 'recharts';

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  TODO: { label: 'To Do', color: 'text-slate-600 dark:text-slate-400', bgColor: 'bg-slate-100 dark:bg-slate-800', icon: <AlertCircle className="h-3.5 w-3.5" /> },
  IN_PROGRESS: { label: 'In Progress', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/30', icon: <Clock className="h-3.5 w-3.5" /> },
  DONE: { label: 'Done', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-900/30', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
};

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

function TaskRow({ task }: { task: Task }) {
  const status = statusConfig[task.status];
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'DONE';

  return (
    <Link
      href={`/groups/${task.project?.group?.id}/projects/${task.projectId}`}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-all duration-200 group/task"
    >
      <div className={`p-1.5 rounded-lg ${status.bgColor}`}>
        <span className={status.color}>{status.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate group-hover/task:text-primary transition-colors duration-200">{task.title}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {task.project?.group?.name} &middot; {task.project?.name}
        </p>
      </div>
      {task.dueDate && (
        <div className={`flex items-center gap-1.5 text-xs flex-shrink-0 px-2.5 py-1 rounded-lg ${isOverdue ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-muted text-muted-foreground'}`}>
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
      <ArrowUpRight className="h-4 w-4 text-muted-foreground/0 group-hover/task:text-primary/60 transition-all duration-200" />
    </Link>
  );
}

function CustomTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card/95 backdrop-blur-xl border border-border rounded-xl px-3 py-2 shadow-xl">
      <p className="text-xs font-medium text-foreground">{label}</p>
      {payload.map((item: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: item.color }}>
          {item.name}: <span className="font-semibold">{item.value}</span>
        </p>
      ))}
    </div>
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

  const completionPct = s && s.tasksTotal > 0 ? Math.round((s.tasksDone / s.tasksTotal) * 100) : 0;

  const statCards = [
    {
      label: t('dashboard.groups'),
      value: s?.groups ?? '—',
      icon: Users,
      gradient: 'stat-gradient-1',
      iconBg: 'bg-indigo-500',
      change: '+2',
    },
    {
      label: t('dashboard.projects'),
      value: s?.projects ?? '—',
      icon: FolderKanban,
      gradient: 'stat-gradient-2',
      iconBg: 'bg-emerald-500',
      change: '+5',
    },
    {
      label: t('dashboard.tasks'),
      value: s?.tasksTotal ?? '—',
      icon: ListTodo,
      gradient: 'stat-gradient-3',
      iconBg: 'bg-amber-500',
      change: '+12',
    },
    {
      label: t('dashboard.completion'),
      value: s && s.tasksTotal > 0 ? `${completionPct}%` : '—',
      icon: TrendingUp,
      gradient: 'stat-gradient-4',
      iconBg: 'bg-pink-500',
      change: '+8%',
    },
  ];

  // Chart data from real stats
  const pieData = s ? [
    { name: 'To Do', value: s.tasksTodo, color: '#64748b' },
    { name: 'In Progress', value: s.tasksInProgress, color: '#3b82f6' },
    { name: 'Done', value: s.tasksDone, color: '#10b981' },
  ].filter(d => d.value > 0) : [];

  const barData = groups?.slice(0, 6).map((g) => ({
    name: g.name.length > 12 ? g.name.substring(0, 12) + '…' : g.name,
    projects: g._count?.projects || 0,
    members: g._count?.members || 0,
  })) || [];

  // Radial chart for completion
  const radialData = [{ name: 'Completion', value: completionPct, fill: '#6366f1' }];

  // Generate simulated activity data based on real tasks
  const activityData = (() => {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const myTasks = dashData?.myTasks || [];
    const recentTasks = dashData?.recentActivity || [];
    return days.map((day, i) => ({
      name: day,
      tasks: Math.max(1, Math.floor(myTasks.length * (0.5 + Math.sin(i) * 0.5))),
      completed: Math.max(0, Math.floor(recentTasks.filter(t => t.status === 'DONE').length * (0.3 + Math.cos(i) * 0.3))),
    }));
  })();

  return (
    <div className="flex flex-col h-full">
      <Header title={t('dashboard.welcomeBack', { name: user?.name?.split(' ')[0] || 'User' })} />

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6 page-enter mesh-gradient">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          {statCards.map((stat, i) => (
            <Card key={stat.label} className={`glass-card card-3d overflow-hidden border-0 ${stat.gradient}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    {statsLoading ? (
                      <Skeleton className="h-9 w-20" />
                    ) : (
                      <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                    )}
                  </div>
                  <div className={`p-2.5 rounded-xl ${stat.iconBg} shadow-lg`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Task Distribution Pie Chart */}
          <Card className="glass-card chart-card animate-reveal" style={{ animationDelay: '150ms' }}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10">
                  <PieChartIcon className="h-4 w-4 text-indigo-500" />
                </div>
                <CardTitle className="text-sm font-semibold">{t('dashboard.taskProgress')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-48" />
              ) : pieData.length > 0 ? (
                <div className="flex items-center gap-4">
                  <div className="w-40 h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={65}
                          paddingAngle={4}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-3">
                    {pieData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-xs text-muted-foreground">{item.name}</span>
                        </div>
                        <span className="text-sm font-bold">{item.value}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-border/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Total</span>
                        <span className="text-sm font-bold text-primary">{s?.tasksTotal}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ListTodo className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{t('dashboard.noTasksYet')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Area Chart */}
          <Card className="glass-card chart-card animate-reveal" style={{ animationDelay: '250ms' }}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10">
                  <Activity className="h-4 w-4 text-emerald-500" />
                </div>
                <CardTitle className="text-sm font-semibold">{t('dashboard.recentActivity')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-48" />
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                      <RechartsTooltip content={<CustomTooltipContent />} />
                      <Area type="monotone" dataKey="tasks" name="Tasks" stroke="#6366f1" fill="url(#colorTasks)" strokeWidth={2.5} dot={false} />
                      <Area type="monotone" dataKey="completed" name="Completed" stroke="#10b981" fill="url(#colorCompleted)" strokeWidth={2.5} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completion Radial + Groups Bar Chart */}
          <Card className="glass-card chart-card animate-reveal" style={{ animationDelay: '350ms' }}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-violet-500/10">
                  <BarChart3 className="h-4 w-4 text-violet-500" />
                </div>
                <CardTitle className="text-sm font-semibold">{t('dashboard.groups')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading || groupsLoading ? (
                <Skeleton className="h-48" />
              ) : barData.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                      <RechartsTooltip content={<CustomTooltipContent />} />
                      <Bar dataKey="projects" name="Projects" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={32} />
                      <Bar dataKey="members" name="Members" fill="#06b6d4" radius={[6, 6, 0, 0]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{t('dashboard.noGroupsYet')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Completion Ring + My Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Completion Ring */}
          <Card className="glass-card animate-reveal" style={{ animationDelay: '400ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{t('dashboard.completion')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              {statsLoading ? (
                <Skeleton className="h-36 w-36 rounded-full" />
              ) : s && s.tasksTotal > 0 ? (
                <>
                  <div className="relative w-36 h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="78%"
                        outerRadius="100%"
                        startAngle={90}
                        endAngle={-270}
                        data={radialData}
                      >
                        <RadialBar
                          dataKey="value"
                          cornerRadius={12}
                          background={{ fill: 'var(--muted)' }}
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-gradient">{completionPct}%</span>
                      <span className="text-xs text-muted-foreground">completed</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-muted-foreground">Done</span>
                      <span className="font-bold">{s.tasksDone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span className="text-muted-foreground">In Progress</span>
                      <span className="font-bold">{s.tasksInProgress}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-slate-400" />
                      <span className="text-muted-foreground">To Do</span>
                      <span className="font-bold">{s.tasksTodo}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Sparkles className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{t('dashboard.noTasksYet')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Tasks */}
          <Card className="glass-card lg:col-span-2 animate-reveal" style={{ animationDelay: '450ms' }}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10">
                    <ListTodo className="h-4 w-4 text-amber-500" />
                  </div>
                  <CardTitle className="text-sm font-semibold">{t('dashboard.myTasks')}</CardTitle>
                </div>
                {dashData?.myTasks && dashData.myTasks.length > 0 && (
                  <Badge className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 border-0 rounded-lg">
                    {dashData.myTasks.length} {t('dashboard.active')}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-14" />
                  <Skeleton className="h-14" />
                  <Skeleton className="h-14" />
                </div>
              ) : dashData?.myTasks && dashData.myTasks.length > 0 ? (
                <div className="space-y-1 -mx-3">
                  {dashData.myTasks.slice(0, 6).map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Sparkles className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">{t('dashboard.noTasks')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Timeline */}
        <Card className="glass-card animate-reveal" style={{ animationDelay: '500ms' }}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/10">
                  <Activity className="h-4 w-4 text-cyan-500" />
                </div>
                <CardTitle className="text-sm font-semibold">{t('dashboard.recentActivity')}</CardTitle>
              </div>
              <Tip content="Latest task updates across your projects" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : dashData?.recentActivity && dashData.recentActivity.length > 0 ? (
              <div className="space-y-1 -mx-3">
                {dashData.recentActivity.slice(0, 8).map((task) => (
                  <Link
                    key={task.id}
                    href={`/groups/${task.project?.group?.id}/projects/${task.projectId}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-all duration-200 group/activity"
                  >
                    <div className={`p-1.5 rounded-lg ${statusConfig[task.status].bgColor}`}>
                      <span className={statusConfig[task.status].color}>{statusConfig[task.status].icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        <span className="font-medium group-hover/activity:text-primary transition-colors">{task.title}</span>
                        <span className="text-muted-foreground"> {t('dashboard.in')} </span>
                        <span className="text-foreground/80">{task.project?.name}</span>
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true, locale: dateFnsLocale })}
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover/activity:text-primary/60 transition-all duration-200" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <Clock className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{t('dashboard.noRecentActivity')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Groups */}
        <Card className="glass-card animate-reveal" style={{ animationDelay: '600ms' }}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-violet-500/10">
                  <Users className="h-4 w-4 text-violet-500" />
                </div>
                <CardTitle className="text-sm font-semibold">{t('dashboard.myGroupsTitle')}</CardTitle>
              </div>
              <Link href="/groups/new">
                <Button size="sm" className="gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5">
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
                  <Skeleton key={i} className="h-36 rounded-xl" />
                ))}
              </div>
            ) : groups && groups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                {groups.slice(0, 6).map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>
            ) : (
              <div className="text-center py-14">
                <div className="relative inline-flex">
                  <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-pulse-ring" />
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/30 relative" />
                </div>
                <p className="text-muted-foreground text-sm mt-4">{t('dashboard.noGroupsYet')}</p>
                <Link href="/groups/new">
                  <Button className="mt-4 gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
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
