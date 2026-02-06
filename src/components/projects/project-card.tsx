'use client';

import Link from 'next/link';
import { Project } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderKanban, ListTodo, Paperclip } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ProjectCardProps {
  project: Project;
  groupId: string;
}

export function ProjectCard({ project, groupId }: ProjectCardProps) {
  return (
    <Link href={`/groups/${groupId}/projects/${project.id}`}>
      <Card className="h-full glass-card card-3d cursor-pointer group overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="pb-3 relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-emerald-500/10">
                <FolderKanban className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="text-lg group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200">{project.name}</CardTitle>
                <CardDescription className="mt-1">
                  Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative">
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{project.description}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ListTodo className="h-4 w-4" />
              {project._count?.tasks || 0} tasks
            </span>
            <span className="flex items-center gap-1.5">
              <Paperclip className="h-4 w-4" />
              {project._count?.attachments || 0} files
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
