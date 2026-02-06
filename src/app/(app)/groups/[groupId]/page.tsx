'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGroup, useDeleteGroup, useAddMember, useLeaveGroup } from '@/hooks/use-groups';
import { useProjects, useCreateProject } from '@/hooks/use-projects';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useAuthStore } from '@/store/auth';
import { Header } from '@/components/layout/header';
import { ProjectCard } from '@/components/projects/project-card';
import { ProjectForm } from '@/components/projects/project-form';
import { MemberList } from '@/components/groups/member-list';
import { Chat } from '@/components/messages/chat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Plus,
  FolderKanban,
  Users,
  MessageSquare,
  Settings,
  MoreVertical,
  Trash2,
  LogOut,
  Globe,
  Lock,
  Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from 'sonner';
import { CreateProjectDto } from '@/types';
import { useTranslation } from '@/lib/i18n';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  const { user } = useAuthStore();

  const { data: group, isLoading } = useGroup(groupId);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectsPage, setProjectsPage] = useState(1);
  const { data: projectsResult, isLoading: projectsLoading } = useProjects(groupId, {
    page: projectsPage,
    limit: 12,
    search: projectSearch || undefined,
  });
  const projects = projectsResult?.data;
  const createProject = useCreateProject();
  const deleteGroup = useDeleteGroup();
  const addMember = useAddMember();
  const leaveGroup = useLeaveGroup();

  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const { t } = useTranslation();

  const isAdmin = group?.adminId === user?.id ||
    group?.members?.some((m) => m.userId === user?.id && m.role === 'ADMIN');
  const isCreator = group?.adminId === user?.id;

  const handleCreateProject = async (data: { name: string; description?: string; groupId?: string }) => {
    try {
      await createProject.mutateAsync({ ...data, groupId } as CreateProjectDto);
      toast.success('Project created successfully!');
      setIsCreateProjectOpen(false);
    } catch {
      toast.error('Failed to create project');
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await deleteGroup.mutateAsync(groupId);
      toast.success('Group deleted');
      router.push('/groups');
    } catch {
      toast.error('Failed to delete group');
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await leaveGroup.mutateAsync(groupId);
      toast.success('Left the group');
      router.push('/groups');
    } catch {
      toast.error('Failed to leave group');
    }
  };

  const handleAddMember = async (userId: string) => {
    try {
      await addMember.mutateAsync({ groupId, data: { userId } });
      toast.success('Member added successfully');
    } catch {
      toast.error('Failed to add member');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Header />
        <div className="flex-1 p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex flex-col h-full">
        <Header title={t('groups.notFound')} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center animate-reveal">
            <Users className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">{t('groups.notFoundDesc')}</p>
            <Link href="/groups">
              <Button className="mt-4 rounded-xl">{t('groups.backToGroups')}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header />

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6 page-enter">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex items-center gap-4">
            <Link href="/groups">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{group.name}</h1>
                <Badge variant={group.isPublic ? 'secondary' : 'outline'} className="gap-1 rounded-lg">
                  {group.isPublic ? (
                    <><Globe className="h-3 w-3" /> {t('groups.public')}</>
                  ) : (
                    <><Lock className="h-3 w-3" /> {t('groups.private')}</>
                  )}
                </Badge>
              </div>
              {group.description && (
                <p className="text-muted-foreground mt-1">{group.description}</p>
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
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href={`/groups/${groupId}/settings`} className="gap-2">
                    <Settings className="h-4 w-4" />
                    {t('common.settings')}
                  </Link>
                </DropdownMenuItem>
              )}
              {!isCreator && (
                <DropdownMenuItem
                  className="text-destructive gap-2"
                  onClick={() => setIsLeaveOpen(true)}
                >
                  <LogOut className="h-4 w-4" />
                  {t('groups.leaveGroup')}
                </DropdownMenuItem>
              )}
              {isCreator && (
                <DropdownMenuItem
                  className="text-destructive gap-2"
                  onClick={() => setIsDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  {t('groups.deleteGroup')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="rounded-xl bg-muted/50 p-1">
            <TabsTrigger value="projects" className="gap-2 rounded-lg">
              <FolderKanban className="h-4 w-4" />
              {t('projects.title')}
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2 rounded-lg">
              <Users className="h-4 w-4" />
              {t('groups.members')}
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2 rounded-lg">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">
                  {t('projects.title')} ({projectsResult?.meta?.total || 0})
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t('projects.searchProjects')}
                    value={projectSearch}
                    onChange={(e) => { setProjectSearch(e.target.value); setProjectsPage(1); }}
                    className="pl-9 w-48 rounded-xl"
                  />
                </div>
              </div>
              <Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4" />
                    {t('projects.newProject')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card">
                  <DialogHeader>
                    <DialogTitle>{t('projects.createNewProject')}</DialogTitle>
                  </DialogHeader>
                  <ProjectForm
                    groupId={groupId}
                    onSubmit={handleCreateProject}
                    isLoading={createProject.isPending}
                    onCancel={() => setIsCreateProjectOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {projectsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-xl" />
                ))}
              </div>
            ) : projects && projects.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                  {projects.map((project) => (
                    <ProjectCard key={project.id} project={project} groupId={groupId} />
                  ))}
                </div>
                {projectsResult?.meta && (
                  <PaginationControls meta={projectsResult.meta} onPageChange={setProjectsPage} />
                )}
              </>
            ) : (
              <Card className="glass-card">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FolderKanban className="h-12 w-12 text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground">{t('projects.noProjects')}</p>
                  <Button
                    className="mt-4 gap-2 rounded-xl"
                    onClick={() => setIsCreateProjectOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    {t('projects.createFirstProject')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="members">
            <Card className="glass-card">
              <CardContent className="p-6">
                <MemberList
                  groupId={groupId}
                  adminId={group.adminId}
                  members={group.members || []}
                  isAdmin={isAdmin || false}
                  onAddMember={handleAddMember}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="h-[600px]">
            <Chat groupId={groupId} groupMembers={group?.members} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('groups.deleteGroup')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('groups.deleteConfirm', { name: group.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              className="bg-destructive hover:bg-destructive/90 rounded-xl"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Confirmation */}
      <AlertDialog open={isLeaveOpen} onOpenChange={setIsLeaveOpen}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('groups.leaveGroup')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('groups.leaveConfirm', { name: group.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveGroup}
              className="bg-destructive hover:bg-destructive/90 rounded-xl"
            >
              {t('groups.leaveGroup')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
