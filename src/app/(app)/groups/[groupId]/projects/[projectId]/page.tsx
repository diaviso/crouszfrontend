'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProject, useDeleteProject, useUpdateProject } from '@/hooks/use-projects';
import { useTasks } from '@/hooks/use-tasks';
import { useAttachments } from '@/hooks/use-attachments';
import { useGroup } from '@/hooks/use-groups';
import { Header } from '@/components/layout/header';
import { TaskBoard } from '@/components/tasks/task-board';
import { AttachmentList } from '@/components/attachments/attachment-list';
import { ProjectForm } from '@/components/projects/project-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  ListTodo,
  Paperclip,
  MoreVertical,
  Edit,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { UpdateProjectDto } from '@/types';
import { useTranslation } from '@/lib/i18n';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  const projectId = params.projectId as string;

  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: group } = useGroup(groupId);
  const { data: tasksResult, isLoading: tasksLoading } = useTasks(projectId);
  const tasks = tasksResult?.data;
  const { data: attachmentsResult, isLoading: attachmentsLoading } = useAttachments(projectId);
  const attachments = attachmentsResult?.data;
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { t } = useTranslation();

  const groupMembers = group?.members?.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    avatar: m.user.avatar,
  })) || [];

  // Add group admin if not in members
  if (group?.admin && !groupMembers.find((m) => m.id === group.admin!.id)) {
    groupMembers.unshift({
      id: group.admin.id,
      name: group.admin.name,
      avatar: group.admin.avatar,
    });
  }

  const handleUpdateProject = async (data: { name?: string; description?: string }) => {
    try {
      await updateProject.mutateAsync({ id: projectId, data: data as UpdateProjectDto });
      toast.success('Project updated');
      setIsEditOpen(false);
    } catch {
      toast.error('Failed to update project');
    }
  };

  const handleDeleteProject = async () => {
    try {
      await deleteProject.mutateAsync(projectId);
      toast.success('Project deleted');
      router.push(`/groups/${groupId}`);
    } catch {
      toast.error('Failed to delete project');
    }
  };

  if (projectLoading) {
    return (
      <div className="flex flex-col h-full">
        <Header />
        <div className="flex-1 p-6 space-y-6">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col h-full">
        <Header title={t('projects.notFound')} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center animate-reveal">
            <ListTodo className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">{t('projects.notFoundDesc')}</p>
            <Link href={`/groups/${groupId}`}>
              <Button className="mt-4 rounded-xl">{t('groups.backToGroup')}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header />

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6 page-enter mesh-gradient">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/groups/${groupId}`}>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{project.name}</h1>
              </div>
              {project.description && (
                <p className="text-muted-foreground mt-1">{project.description}</p>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-xl">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card">
              <DropdownMenuItem onClick={() => setIsEditOpen(true)} className="gap-2">
                <Edit className="h-4 w-4" />
                {t('projects.editProject')}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive gap-2"
                onClick={() => setIsDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                {t('projects.deleteProject')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tasks" className="space-y-6 flex-1">
          <TabsList className="rounded-xl bg-muted/50 p-1">
            <TabsTrigger value="tasks" className="gap-2 rounded-lg">
              <ListTodo className="h-4 w-4" />
              {t('tasks.title')} ({tasksResult?.meta?.total || 0})
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-2 rounded-lg">
              <Paperclip className="h-4 w-4" />
              {t('projects.files')} ({attachmentsResult?.meta?.total || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="h-[calc(100vh-280px)]">
            {tasksLoading ? (
              <div className="flex gap-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="flex-1 h-96 rounded-xl" />
                ))}
              </div>
            ) : (
              <TaskBoard
                projectId={projectId}
                tasks={tasks || []}
                groupMembers={groupMembers}
              />
            )}
          </TabsContent>

          <TabsContent value="files">
            <Card className="glass-card">
              <CardContent className="p-6">
                {attachmentsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <AttachmentList
                    projectId={projectId}
                    attachments={attachments || []}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>{t('projects.editProject')}</DialogTitle>
          </DialogHeader>
          <ProjectForm
            project={project}
            groupId={groupId}
            onSubmit={handleUpdateProject}
            isLoading={updateProject.isPending}
            onCancel={() => setIsEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('projects.deleteProject')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('projects.deleteConfirm', { name: project.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-destructive hover:bg-destructive/90 rounded-xl"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
