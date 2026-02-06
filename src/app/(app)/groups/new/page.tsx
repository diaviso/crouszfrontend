'use client';

import { useRouter } from 'next/navigation';
import { useCreateGroup } from '@/hooks/use-groups';
import { Header } from '@/components/layout/header';
import { GroupForm } from '@/components/groups/group-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { CreateGroupDto } from '@/types';
import { useTranslation } from '@/lib/i18n';

export default function NewGroupPage() {
  const router = useRouter();
  const createGroup = useCreateGroup();
  const { t } = useTranslation();

  const handleSubmit = async (data: { name: string; description?: string; isPublic: boolean }) => {
    try {
      const group = await createGroup.mutateAsync(data as CreateGroupDto);
      toast.success('Group created successfully!');
      router.push(`/groups/${group.id}`);
    } catch {
      toast.error('Failed to create group');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title={t('groups.createNewGroup')} />

      <div className="flex-1 overflow-auto p-4 md:p-6 page-enter">
        <div className="max-w-2xl mx-auto space-y-6">
          <Link href="/groups">
            <Button variant="ghost" className="gap-2 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
              {t('groups.backToGroups')}
            </Button>
          </Link>

          <Card className="glass-card overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-primary animate-gradient" />
            <CardHeader>
              <CardTitle>{t('groups.createNewGroup')}</CardTitle>
              <CardDescription>
                {t('groups.createNewGroupDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GroupForm onSubmit={handleSubmit} isLoading={createGroup.isPending} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
