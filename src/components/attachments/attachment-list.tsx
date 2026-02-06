'use client';

import { useState, useRef } from 'react';
import { Attachment } from '@/types';
import { useUploadAttachment, useDeleteAttachment } from '@/hooks/use-attachments';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Upload,
  Download,
  Trash2,
  Loader2,
  Presentation,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

interface AttachmentListProps {
  projectId: string;
  attachments: Attachment[];
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return <FileImage className="h-8 w-8 text-purple-500" />;
  }
  if (mimeType.includes('pdf')) {
    return <FileText className="h-8 w-8 text-red-500" />;
  }
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
  }
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
    return <Presentation className="h-8 w-8 text-orange-500" />;
  }
  if (mimeType.includes('word') || mimeType.includes('document')) {
    return <FileText className="h-8 w-8 text-blue-500" />;
  }
  return <File className="h-8 w-8 text-muted-foreground" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function AttachmentList({ projectId, attachments }: AttachmentListProps) {
  const { t, locale } = useTranslation();
  const [attachmentToDelete, setAttachmentToDelete] = useState<Attachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadAttachment = useUploadAttachment();
  const deleteAttachment = useDeleteAttachment();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadAttachment.mutateAsync({ projectId, file });
      toast.success('File uploaded successfully');
    } catch {
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!attachmentToDelete) return;

    try {
      await deleteAttachment.mutateAsync(attachmentToDelete.id);
      toast.success('File deleted');
      setAttachmentToDelete(null);
    } catch {
      toast.error('Failed to delete file');
    }
  };

  const handleDownload = (attachment: Attachment) => {
    const token = localStorage.getItem('token');
    const url = `${process.env.NEXT_PUBLIC_API_URL}/attachments/${attachment.id}/download`;

    // Create a temporary link with auth header
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = attachment.originalName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        a.remove();
      })
      .catch(() => toast.error('Failed to download file'));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('attachments.title')} ({attachments.length})</h3>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="*/*"
            onChange={handleFileSelect}
          />
          <Button
            size="sm"
            className="gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 shadow-lg shadow-primary/20"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {t('attachments.upload')}
          </Button>
        </div>
      </div>

      {attachments.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <File className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground">{t('attachments.noAttachments')}</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              {t('attachments.noAttachmentsHint')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 stagger-children">
          {attachments.map((attachment) => (
            <Card key={attachment.id} className="glass-card hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 p-2 rounded-xl bg-muted/50 group-hover:bg-muted/80 transition-colors duration-200">
                    {getFileIcon(attachment.mimeType)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{attachment.originalName}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{formatFileSize(attachment.size)}</span>
                      <span className="text-border">•</span>
                      <span>{format(new Date(attachment.createdAt), 'MMM d, yyyy', { locale: locale === 'fr' ? frLocale : undefined })}</span>
                      {attachment.uploadedBy && (
                        <>
                          <span className="text-border">•</span>
                          <div className="flex items-center gap-1">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={attachment.uploadedBy.avatar} />
                              <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                                {attachment.uploadedBy.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{attachment.uploadedBy.name}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors duration-200"
                      onClick={() => handleDownload(attachment)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors duration-200"
                      onClick={() => setAttachmentToDelete(attachment)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!attachmentToDelete} onOpenChange={() => setAttachmentToDelete(null)}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('attachments.deleteFile')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('attachments.deleteFileConfirm', { name: attachmentToDelete?.originalName || '' })}
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
    </div>
  );
}
