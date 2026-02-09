'use client';

import Link from 'next/link';
import { Project } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderKanban, ListTodo, Paperclip, ArrowUpRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ProjectCardProps {
  project: Project;
  groupId: string;
}

export function ProjectCard({ project, groupId }: ProjectCardProps) {
  return (
    <Link href={`/groups/${groupId}/projects/${project.id}`}>
      <Card className="h-full glass-card card-3d cursor-pointer group overflow-hidden relative">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <CardHeader className="pb-3 relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15 transition-all duration-300 group-hover:from-emerald-500/25 group-hover:to-teal-500/25 group-hover:shadow-lg group-hover:shadow-emerald-500/10">
                <FolderKanban className="h-5 w-5 text-emerald-500 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div>
                <CardTitle className="text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">{project.name}</CardTitle>
                <CardDescription className="mt-0.5 text-xs">
                  Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                </CardDescription>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-emerald-500 transition-all duration-300 mt-1" />
          </div>
        </CardHeader>
        <CardContent className="relative">
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{project.description}</p>
          )}

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50">
              <ListTodo className="h-3.5 w-3.5" />
              {project._count?.tasks || 0} tasks
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50">
              <Paperclip className="h-3.5 w-3.5" />
              {project._count?.attachments || 0} files
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
