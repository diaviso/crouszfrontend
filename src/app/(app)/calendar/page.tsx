'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/header';
import { useDashboardStats } from '@/hooks/use-dashboard';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tip } from '@/components/ui/tooltip';
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  format,
  isPast,
} from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { Task } from '@/types';

const statusStyles: Record<string, { bg: string; dot: string }> = {
  TODO: { bg: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground/50' },
  IN_PROGRESS: { bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
  DONE: { bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
};

const statusIcons: Record<string, React.ReactNode> = {
  TODO: <AlertCircle className="h-3 w-3" />,
  IN_PROGRESS: <Clock className="h-3 w-3" />,
  DONE: <CheckCircle2 className="h-3 w-3" />,
};

export default function CalendarPage() {
  const { t, locale } = useTranslation();
  const dateFnsLocale = locale === 'fr' ? frLocale : undefined;
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const { data: dashData, isLoading } = useDashboardStats();

  const monthNames = [
    t('calendar.january'), t('calendar.february'), t('calendar.march'),
    t('calendar.april'), t('calendar.may'), t('calendar.june'),
    t('calendar.july'), t('calendar.august'), t('calendar.september'),
    t('calendar.october'), t('calendar.november'), t('calendar.december'),
  ];

  const dayNames = [
    t('calendar.mon'), t('calendar.tue'), t('calendar.wed'),
    t('calendar.thu'), t('calendar.fri'), t('calendar.sat'), t('calendar.sun'),
  ];

  const allTasks = useMemo(() => {
    if (!dashData) return [];
    return [...(dashData.myTasks || []), ...(dashData.recentActivity || [])].filter(
      (task, index, self) => task.dueDate && self.findIndex((t) => t.id === task.id) === index,
    );
  }, [dashData]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    allTasks.forEach((task) => {
      if (!task.dueDate) return;
      const key = format(new Date(task.dueDate), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(task);
    });
    return map;
  }, [allTasks]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const selectedDayTasks = selectedDay
    ? tasksByDate[format(selectedDay, 'yyyy-MM-dd')] || []
    : [];

  return (
    <div className="flex flex-col h-full">
      <Header title={t('calendar.title')} />

      <div className="flex-1 overflow-auto p-4 md:p-6 page-enter mesh-gradient">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-[500px]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
            {/* Calendar Grid */}
            <Card className="glass-card">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => {
                        setCurrentMonth(new Date());
                        setSelectedDay(new Date());
                      }}
                    >
                      {t('calendar.today')}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-xl"
                      onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-xl"
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-7 mb-2">
                  {dayNames.map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-semibold text-muted-foreground uppercase py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 border-t border-l border-border/50 rounded-xl overflow-hidden">
                  {calendarDays.map((day) => {
                    const key = format(day, 'yyyy-MM-dd');
                    const dayTasks = tasksByDate[key] || [];
                    const inMonth = isSameMonth(day, currentMonth);
                    const today = isToday(day);
                    const selected = selectedDay ? isSameDay(day, selectedDay) : false;

                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedDay(day)}
                        className={cn(
                          'relative min-h-[80px] border-r border-b border-border/50 p-1.5 text-left transition-all duration-200 hover:bg-primary/5',
                          !inMonth && 'bg-muted/30 text-muted-foreground/50',
                          selected && 'bg-primary/10 ring-2 ring-inset ring-primary shadow-inner',
                        )}
                      >
                        <span
                          className={cn(
                            'inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-all duration-200',
                            today && 'bg-gradient-to-br from-primary to-purple-500 text-white shadow-md shadow-primary/30',
                            !today && inMonth && 'text-foreground',
                          )}
                        >
                          {format(day, 'd')}
                        </span>
                        {dayTasks.length > 0 && (
                          <div className="mt-0.5 space-y-0.5">
                            {dayTasks.slice(0, 2).map((task) => (
                              <div
                                key={task.id}
                                className={cn(
                                  'flex items-center gap-1 rounded-md px-1 py-0.5 text-[10px] font-medium truncate',
                                  statusStyles[task.status]?.bg,
                                )}
                              >
                                <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', statusStyles[task.status]?.dot)} />
                                <span className="truncate">{task.title}</span>
                              </div>
                            ))}
                            {dayTasks.length > 2 && (
                              <div className="text-[10px] text-muted-foreground px-1">
                                +{dayTasks.length - 2}
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Side panel */}
            <div className="space-y-4">
              <Card className="glass-card">
                <CardContent className="p-5">
                  {selectedDay ? (
                    <>
                      <h3 className="text-sm font-bold text-foreground mb-1">
                        {format(selectedDay, 'EEEE d MMMM yyyy', { locale: dateFnsLocale })}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-4">
                        {selectedDayTasks.length > 0
                          ? t('calendar.tasksCount', { count: selectedDayTasks.length })
                          : t('tasks.noTasks')}
                      </p>

                      {selectedDayTasks.length > 0 ? (
                        <div className="space-y-3">
                          {selectedDayTasks.map((task) => {
                            const overdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'DONE';
                            return (
                              <Link
                                key={task.id}
                                href={`/groups/${task.project?.group?.id}/projects/${task.projectId}`}
                                className="block rounded-xl border border-border/50 p-3 hover:bg-muted/30 transition-all duration-200 hover:shadow-md"
                              >
                                <div className="flex items-start gap-2">
                                  <div className={cn('mt-0.5', statusStyles[task.status]?.bg, 'p-1 rounded-lg')}>
                                    {statusIcons[task.status]}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{task.title}</p>
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                                      {task.project?.group?.name} · {task.project?.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                      <Badge
                                        variant="secondary"
                                        className={cn('text-[10px] px-1.5 py-0 rounded-md', statusStyles[task.status]?.bg)}
                                      >
                                        {task.status === 'TODO' ? t('tasks.todo') : task.status === 'IN_PROGRESS' ? t('tasks.inProgress') : t('tasks.done')}
                                      </Badge>
                                      {overdue && (
                                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 rounded-md">
                                          {t('tasks.overdue')}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground/20 mb-2" />
                          <p className="text-sm text-muted-foreground">{t('tasks.noTasks')}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground/20 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {t('calendar.noTasksThisMonth')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Legend */}
              <Card className="glass-card">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">{t('tasks.status')}</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/50" />
                      {t('tasks.todo')}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/30" />
                      {t('tasks.inProgress')}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30" />
                      {t('tasks.done')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
