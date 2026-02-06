'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Group } from '@/types';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface GroupFormProps {
  group?: Group;
  onSubmit: (data: FormValues) => Promise<void>;
  isLoading?: boolean;
}

export function GroupForm({ group, onSubmit, isLoading }: GroupFormProps) {
  const { t } = useTranslation();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: group?.name || '',
      description: group?.description || '',
      isPublic: group?.isPublic ?? false,
    },
  });

  const handleSubmit = async (values: FormValues) => {
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('groups.groupName')}</FormLabel>
              <FormControl>
                <Input placeholder={t('groups.enterGroupName')} className="rounded-xl" {...field} />
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
                  placeholder={t('groups.descriptionPlaceholder')}
                  className="resize-none rounded-xl"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>{t('groups.descriptionOptional')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isPublic"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/50 p-4 hover:bg-muted/30 transition-colors duration-200">
              <div className="space-y-0.5">
                <FormLabel className="text-base">{t('groups.publicGroup')}</FormLabel>
                <FormDescription>
                  {t('groups.publicGroupDesc')}
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isLoading} className="rounded-xl bg-gradient-to-r from-primary to-purple-500 shadow-lg shadow-primary/20">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {group ? t('groups.updateGroup') : t('groups.createGroup')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
