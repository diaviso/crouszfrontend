'use client';

import { useState } from 'react';
import { useTaskComments, useCreateTaskComment, useDeleteTaskComment } from '@/hooks/use-task-comments';
import { useAuthStore } from '@/store/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Send, Trash2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { toast } from 'sonner';
import type { GroupMember } from '@/types';
import { useTranslation } from '@/lib/i18n';

interface TaskCommentsProps {
  taskId: string;
  groupMembers?: GroupMember[];
}

export function TaskComments({ taskId, groupMembers = [] }: TaskCommentsProps) {
  const { user } = useAuthStore();
  const { t, locale } = useTranslation();
  const [content, setContent] = useState('');
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');

  const { data: commentsResult, isLoading } = useTaskComments(taskId);
  const createComment = useCreateTaskComment();
  const deleteComment = useDeleteTaskComment();

  const comments = commentsResult?.data || [];

  const handleSubmit = async () => {
    if (!content.trim()) return;

    // Extract mentions from @[name](id) format
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[2]);
    }

    try {
      await createComment.mutateAsync({
        content: content.trim(),
        taskId,
        mentions,
      });
      setContent('');
    } catch {
      toast.error('Failed to post comment');
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;
    try {
      await deleteComment.mutateAsync(commentToDelete);
      setCommentToDelete(null);
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    // Check if user is typing a mention
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
      setShowMentionList(true);
      setMentionFilter('');
    } else if (lastAtIndex !== -1) {
      const textAfterAt = value.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('[')) {
        setShowMentionList(true);
        setMentionFilter(textAfterAt.toLowerCase());
      } else {
        setShowMentionList(false);
      }
    } else {
      setShowMentionList(false);
    }
  };

  const insertMention = (memberId: string, memberName: string) => {
    const lastAtIndex = content.lastIndexOf('@');
    const before = content.substring(0, lastAtIndex);
    setContent(`${before}@[${memberName}](${memberId}) `);
    setShowMentionList(false);
  };

  // Render comment content with highlighted mentions
  const renderContent = (text: string) => {
    const parts = text.split(/(@\[([^\]]+)\]\([^)]+\))/g);
    return parts.map((part, i) => {
      if (part.match(/^@\[([^\]]+)\]\([^)]+\)$/)) {
        const name = part.match(/^@\[([^\]]+)\]/)?.[1];
        return (
          <span key={i} className="bg-primary/10 text-primary rounded-md px-1.5 font-medium">
            @{name}
          </span>
        );
      }
      // Skip the captured groups
      if (i % 3 !== 0) return null;
      return <span key={i}>{part}</span>;
    });
  };

  const filteredMembers = groupMembers.filter(
    (m) =>
      m.user.name.toLowerCase().includes(mentionFilter) &&
      m.userId !== user?.id,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <MessageSquare className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold text-sm">{t('comments.title')} ({comments.length})</h3>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group p-2 rounded-xl hover:bg-muted/30 transition-colors duration-200">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={comment.author?.avatar} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {comment.author?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{comment.author?.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: locale === 'fr' ? frLocale : undefined })}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 mt-0.5 whitespace-pre-wrap">
                  {renderContent(comment.content)}
                </p>
              </div>
              {comment.authorId === user?.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive rounded-lg"
                  onClick={() => setCommentToDelete(comment.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">{t('comments.noComments')}</p>
      )}

      <Separator className="bg-border/50" />

      {/* New comment input */}
      <div className="relative">
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {user?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder={t('comments.placeholder')}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              className="resize-none text-sm rounded-xl"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                className="gap-1 rounded-xl bg-gradient-to-r from-primary to-purple-500 shadow-lg shadow-primary/20"
                onClick={handleSubmit}
                disabled={!content.trim() || createComment.isPending}
              >
                <Send className="h-3.5 w-3.5" />
                {t('comments.submit')}
              </Button>
            </div>
          </div>
        </div>

        {/* Mention dropdown */}
        {showMentionList && filteredMembers.length > 0 && (
          <div className="absolute bottom-full left-11 mb-1 w-64 glass-card rounded-xl shadow-lg z-50 max-h-40 overflow-y-auto">
            {filteredMembers.map((m) => (
              <button
                key={m.userId}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 text-left text-sm rounded-lg transition-colors duration-150"
                onClick={() => insertMention(m.userId, m.user.name)}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={m.user.avatar} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {m.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span>{m.user.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!commentToDelete} onOpenChange={() => setCommentToDelete(null)}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('comments.deleteComment')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('comments.deleteCommentDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteComment} className="bg-destructive hover:bg-destructive/90 rounded-xl">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
