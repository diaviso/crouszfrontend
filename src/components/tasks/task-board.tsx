'use client';

import { useState, useMemo } from 'react';
import { Task, TaskStatus } from '@/types';
import { useUpdateTaskStatus } from '@/hooks/use-tasks';
import { TaskCard } from './task-card';
import { TaskForm } from './task-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Circle, Clock, CheckCircle2, Search, X, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { isPast, isToday, isTomorrow, addDays, isBefore } from 'date-fns';
import { useTranslation } from '@/lib/i18n';
import { useAuthStore } from '@/store/auth';
import { Tip } from '@/components/ui/tooltip';

interface TaskBoardProps {
  projectId: string;
  tasks: Task[];
  groupMembers: { id: string; name: string; avatar?: string }[];
}

const columnDefs: { status: TaskStatus; labelKey: string; icon: React.ReactNode; gradient: string; borderColor: string }[] = [
  {
    status: 'TODO',
    labelKey: 'tasks.todo',
    icon: <Circle className="h-4 w-4" />,
    gradient: 'from-slate-500/8 to-slate-400/3',
    borderColor: 'border-slate-200/60 dark:border-slate-700/40',
  },
  {
    status: 'IN_PROGRESS',
    labelKey: 'tasks.inProgress',
    icon: <Clock className="h-4 w-4 text-blue-500" />,
    gradient: 'from-blue-500/8 to-blue-400/3',
    borderColor: 'border-blue-200/60 dark:border-blue-700/40',
  },
  {
    status: 'DONE',
    labelKey: 'tasks.done',
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
    gradient: 'from-emerald-500/8 to-emerald-400/3',
    borderColor: 'border-emerald-200/60 dark:border-emerald-700/40',
  },
];

export function TaskBoard({ projectId, tasks, groupMembers }: TaskBoardProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createColumnStatus, setCreateColumnStatus] = useState<TaskStatus>('TODO');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [dueDateFilter, setDueDateFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const updateStatus = useUpdateTaskStatus();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }

      if (assigneeFilter !== 'all') {
        if (assigneeFilter === 'unassigned') {
          if (task.assignees && task.assignees.length > 0) return false;
        } else {
          if (!task.assignees?.some((a) => a.userId === assigneeFilter)) return false;
        }
      }

      if (dueDateFilter !== 'all' && task.status !== 'DONE') {
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        switch (dueDateFilter) {
          case 'overdue':
            if (!dueDate || !isPast(dueDate)) return false;
            break;
          case 'today':
            if (!dueDate || !isToday(dueDate)) return false;
            break;
          case 'week':
            if (!dueDate || !isBefore(dueDate, addDays(new Date(), 7))) return false;
            break;
          case 'no-date':
            if (dueDate) return false;
            break;
        }
      }

      return true;
    });
  }, [tasks, searchQuery, assigneeFilter, dueDateFilter]);

  const activeFilterCount = [
    searchQuery ? 1 : 0,
    assigneeFilter !== 'all' ? 1 : 0,
    dueDateFilter !== 'all' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearFilters = () => {
    setSearchQuery('');
    setAssigneeFilter('all');
    setDueDateFilter('all');
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return filteredTasks.filter((task) => task.status === status);
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (status: TaskStatus) => {
    setDragOverColumn(null);
    if (!draggedTask || draggedTask.status === status) {
      setDraggedTask(null);
      return;
    }

    const isAssignee = draggedTask.assignees?.some((a) => a.userId === user?.id);
    const hasNoAssignees = !draggedTask.assignees || draggedTask.assignees.length === 0;
    if (!isAssignee && !hasNoAssignees) {
      toast.error(t('tasks.onlyAssigneesCanUpdate'));
      setDraggedTask(null);
      return;
    }

    try {
      await updateStatus.mutateAsync({ id: draggedTask.id, status });
      toast.success(t('tasks.statusUpdated'));
    } catch {
      toast.error(t('tasks.statusUpdateFailed'));
    }
    setDraggedTask(null);
  };

  const openCreateDialog = (status: TaskStatus) => {
    setCreateColumnStatus(status);
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('tasks.searchTasks')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 rounded-xl"
          />
        </div>
        <Button
          variant={showFilters ? 'secondary' : 'outline'}
          size="sm"
          className="gap-1.5 h-9 rounded-xl"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-3.5 w-3.5" />
          {t('tasks.filters')}
          {activeFilterCount > 0 && (
            <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" className="gap-1 h-9 text-muted-foreground rounded-xl" onClick={clearFilters}>
            <X className="h-3.5 w-3.5" />
            {t('tasks.clearFilters')}
          </Button>
        )}
        {filteredTasks.length !== tasks.length && (
          <span className="text-xs text-muted-foreground">
            {t('tasks.showing', { count: String(filteredTasks.length), total: String(tasks.length) })}
          </span>
        )}
        <Tip content="Drag and drop tasks between columns to update status" />
      </div>

      {showFilters && (
        <div className="flex items-center gap-3 flex-wrap pb-1 animate-slide-down">
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-48 h-9 rounded-xl">
              <SelectValue placeholder={t('tasks.filterByAssignee')} />
            </SelectTrigger>
            <SelectContent className="glass-card">
              <SelectItem value="all">{t('tasks.allAssignees')}</SelectItem>
              <SelectItem value="unassigned">{t('tasks.unassigned')}</SelectItem>
              {groupMembers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={m.avatar} />
                      <AvatarFallback className="text-[9px]">{m.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {m.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dueDateFilter} onValueChange={setDueDateFilter}>
            <SelectTrigger className="w-48 h-9 rounded-xl">
              <SelectValue placeholder={t('tasks.filterByDueDate')} />
            </SelectTrigger>
            <SelectContent className="glass-card">
              <SelectItem value="all">{t('tasks.allDates')}</SelectItem>
              <SelectItem value="overdue">{t('tasks.overdue')}</SelectItem>
              <SelectItem value="today">{t('tasks.dueToday')}</SelectItem>
              <SelectItem value="week">{t('tasks.dueThisWeek')}</SelectItem>
              <SelectItem value="no-date">{t('tasks.noDueDate')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Board Columns */}
      <div className="flex gap-4 flex-1 min-h-0 overflow-x-auto pb-2">
      {columnDefs.map((column) => {
        const columnTasks = getTasksByStatus(column.status);
        const isDragTarget = draggedTask && draggedTask.status !== column.status && dragOverColumn === column.status;

        return (
          <div
            key={column.status}
            className={cn(
              'flex-1 min-w-[300px] rounded-2xl border-2 p-4 transition-all duration-300',
              `bg-gradient-to-b ${column.gradient}`,
              column.borderColor,
              isDragTarget && 'border-primary shadow-lg shadow-primary/10 scale-[1.01]',
              draggedTask && draggedTask.status !== column.status && !isDragTarget && 'border-dashed'
            )}
            onDragOver={(e) => handleDragOver(e, column.status)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(column.status)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {column.icon}
                <h3 className="font-semibold">{t(column.labelKey)}</h3>
                <span className="text-sm text-muted-foreground bg-background/60 backdrop-blur-sm px-2 py-0.5 rounded-full">
                  {columnTasks.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg hover:bg-background/60"
                onClick={() => openCreateDialog(column.status)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-3 pr-2">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <TaskCard task={task} groupMembers={groupMembers} />
                  </div>
                ))}
                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {t('tasks.noTasks')}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        );
      })}
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg glass-card">
          <DialogHeader>
            <DialogTitle>{t('tasks.createNewTask')}</DialogTitle>
          </DialogHeader>
          <TaskForm
            projectId={projectId}
            defaultStatus={createColumnStatus}
            groupMembers={groupMembers}
            onSuccess={() => setIsCreateDialogOpen(false)}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
