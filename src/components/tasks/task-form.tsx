'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Task, TaskStatus, CreateTaskDto, UpdateTaskDto } from '@/types';
import { useCreateTask, useUpdateTask } from '@/hooks/use-tasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useTranslation } from '@/lib/i18n';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
  dueDate: z.string().optional(),
  assigneeIds: z.array(z.string()).optional(),
});

interface TaskFormProps {
  task?: Task;
  projectId: string;
  defaultStatus?: TaskStatus;
  groupMembers: { id: string; name: string; avatar?: string }[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function TaskForm({
  task,
  projectId,
  defaultStatus = 'TODO',
  groupMembers,
  onSuccess,
  onCancel,
}: TaskFormProps) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const isLoading = createTask.isPending || updateTask.isPending;
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || defaultStatus,
      dueDate: task?.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
      assigneeIds: task?.assignees?.map((a) => a.userId) || [],
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const data = {
        ...values,
        dueDate: values.dueDate || undefined,
      };

      if (task) {
        await updateTask.mutateAsync({ id: task.id, data: data as UpdateTaskDto });
        toast.success('Task updated');
      } else {
        await createTask.mutateAsync({ ...data, projectId } as CreateTaskDto);
        toast.success('Task created');
      }
      onSuccess();
    } catch {
      toast.error(task ? 'Failed to update task' : 'Failed to create task');
    }
  };

  const selectedAssignees = form.watch('assigneeIds') || [];

  const toggleAssignee = (userId: string) => {
    const current = form.getValues('assigneeIds') || [];
    if (current.includes(userId)) {
      form.setValue(
        'assigneeIds',
        current.filter((id) => id !== userId)
      );
    } else {
      form.setValue('assigneeIds', [...current, userId]);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('tasks.taskTitle')}</FormLabel>
              <FormControl>
                <Input placeholder={t('tasks.enterTitle')} className="rounded-xl" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('tasks.description')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('tasks.descriptionPlaceholder')}
                  className="resize-none rounded-xl"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('tasks.status')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder={t('tasks.selectStatus')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="glass-card rounded-xl">
                    <SelectItem value="TODO" className="rounded-lg">{t('tasks.todo')}</SelectItem>
                    <SelectItem value="IN_PROGRESS" className="rounded-lg">{t('tasks.inProgress')}</SelectItem>
                    <SelectItem value="DONE" className="rounded-lg">{t('tasks.done')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('tasks.dueDate')}</FormLabel>
                <FormControl>
                  <Input type="date" className="rounded-xl" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {groupMembers.length > 0 && (
          <FormField
            control={form.control}
            name="assigneeIds"
            render={() => (
              <FormItem>
                <FormLabel>{t('tasks.assignees')}</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {groupMembers.map((member) => {
                    const isSelected = selectedAssignees.includes(member.id);
                    return (
                      <Button
                        key={member.id}
                        type="button"
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        className={`gap-2 rounded-xl transition-all duration-200 ${
                          isSelected
                            ? 'bg-gradient-to-r from-primary to-purple-500 shadow-lg shadow-primary/20'
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => toggleAssignee(member.id)}
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {member.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {member.name}
                        {isSelected && <X className="h-3 w-3" />}
                      </Button>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isLoading} className="rounded-xl bg-gradient-to-r from-primary to-purple-500 shadow-lg shadow-primary/20">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {task ? t('tasks.updateTask') : t('tasks.createTask')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
