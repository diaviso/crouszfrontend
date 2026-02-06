'use client';

import { useState } from 'react';
import { Task } from '@/types';
import { useDeleteTask } from '@/hooks/use-tasks';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Calendar, Edit, Trash2, MessageSquare } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { toast } from 'sonner';
import { TaskForm } from './task-form';
import { TaskComments } from './task-comments';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface TaskCardProps {
  task: Task;
  groupMembers?: { id: string; name: string; avatar?: string }[];
}

export function TaskCard({ task, groupMembers = [] }: TaskCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const deleteTask = useDeleteTask();
  const { t } = useTranslation();

  const handleDelete = async () => {
    try {
      await deleteTask.mutateAsync(task.id);
      toast.success(t('common.success'));
      setIsDeleteOpen(false);
    } catch {
      toast.error(t('common.error'));
    }
  };

  const getDueDateColor = () => {
    if (!task.dueDate) return '';
    const dueDate = new Date(task.dueDate);
    if (task.status === 'DONE') return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10';
    if (isPast(dueDate) && !isToday(dueDate)) return 'text-destructive bg-destructive/10';
    if (isToday(dueDate)) return 'text-amber-600 dark:text-amber-400 bg-amber-500/10';
    return 'text-muted-foreground bg-muted/50';
  };

  return (
    <>
      <Card
        className="bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer border-border/50 group/card"
        onClick={() => setIsDetailOpen(true)}
      >
        <CardHeader className="p-3 pb-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm leading-tight group-hover/card:text-primary transition-colors duration-200">{task.title}</h4>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 -mr-1 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-card">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsEditOpen(true); }}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => { e.stopPropagation(); setIsDeleteOpen(true); }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-3">
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
          )}

          <div className="flex items-center justify-between">
            {task.dueDate && (
              <Badge variant="outline" className={cn('text-xs gap-1 rounded-lg border-0', getDueDateColor())}>
                <Calendar className="h-3 w-3" />
                {format(new Date(task.dueDate), 'MMM d')}
              </Badge>
            )}

            {task.assignees && task.assignees.length > 0 && (
              <div className="flex -space-x-2">
                {task.assignees.slice(0, 3).map((assignment) => (
                  <Avatar key={assignment.id} className="h-6 w-6 border-2 border-card ring-1 ring-border/30">
                    <AvatarImage src={assignment.user.avatar} alt={assignment.user.name} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {assignment.user.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {task.assignees.length > 3 && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted border-2 border-card text-xs font-medium">
                    +{task.assignees.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto glass-card" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{task.title}</DialogTitle>
          </DialogHeader>
          {task.description && (
            <p className="text-sm text-muted-foreground">{task.description}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {task.dueDate && (
              <Badge variant="outline" className={cn('text-xs gap-1 rounded-lg border-0', getDueDateColor())}>
                <Calendar className="h-3 w-3" />
                {format(new Date(task.dueDate), 'MMMM d, yyyy')}
              </Badge>
            )}
            {task.assignees && task.assignees.length > 0 && (
              <div className="flex items-center gap-1">
                {task.assignees.map((a) => (
                  <Badge key={a.id} variant="secondary" className="gap-1 text-xs rounded-lg">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={a.user.avatar} />
                      <AvatarFallback className="text-[8px]">{a.user.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {a.user.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Separator className="opacity-50" />
          <TaskComments
            taskId={task.id}
            groupMembers={groupMembers?.map(m => ({ id: m.id, role: 'MEMBER' as const, joinedAt: '', userId: m.id, user: { id: m.id, name: m.name, avatar: m.avatar, email: '', googleId: '', createdAt: '', updatedAt: '' }, groupId: '' }))}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg glass-card">
          <DialogHeader>
            <DialogTitle>{t('tasks.editTask')}</DialogTitle>
          </DialogHeader>
          <TaskForm
            task={task}
            projectId={task.projectId}
            groupMembers={groupMembers}
            onSuccess={() => setIsEditOpen(false)}
            onCancel={() => setIsEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tasks.deleteTask')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tasks.deleteConfirm', { name: task.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 rounded-xl">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
