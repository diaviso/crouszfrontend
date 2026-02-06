'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Project } from '@/types';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ProjectFormProps {
  project?: Project;
  groupId: string;
  onSubmit: (data: FormValues & { groupId?: string }) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function ProjectForm({ project, groupId, onSubmit, isLoading, onCancel }: ProjectFormProps) {
  const { t } = useTranslation();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: project?.name || '',
      description: project?.description || '',
    },
  });

  const handleSubmit = async (values: FormValues) => {
    if (project) {
      await onSubmit(values);
    } else {
      await onSubmit({ ...values, groupId });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('projects.projectName')}</FormLabel>
              <FormControl>
                <Input placeholder={t('projects.enterProjectName')} className="rounded-xl" {...field} />
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
              <FormLabel>{t('groups.description')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('projects.descriptionPlaceholder')}
                  className="resize-none rounded-xl"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>{t('projects.descriptionOptional')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">
              {t('common.cancel')}
            </Button>
          )}
          <Button type="submit" disabled={isLoading} className="rounded-xl bg-gradient-to-r from-primary to-purple-500 shadow-lg shadow-primary/20">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {project ? t('projects.updateProject') : t('projects.createProject')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
