'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '@/hooks/use-notifications';
import { getNotificationSocket } from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  CheckCheck,
  MessageSquare,
  UserPlus,
  ClipboardList,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import type { NotificationType } from '@/types';
import { useTranslation } from '@/lib/i18n';

const iconMap: Record<NotificationType, React.ReactNode> = {
  TASK_ASSIGNED: <ClipboardList className="h-4 w-4 text-blue-500" />,
  TASK_COMMENT: <MessageSquare className="h-4 w-4 text-emerald-500" />,
  MESSAGE_MENTION: <MessageSquare className="h-4 w-4 text-purple-500" />,
  GROUP_INVITE: <UserPlus className="h-4 w-4 text-primary" />,
  GROUP_ROLE_CHANGED: <Shield className="h-4 w-4 text-orange-500" />,
  TASK_STATUS_CHANGED: <AlertCircle className="h-4 w-4 text-amber-500" />,
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t, locale } = useTranslation();
  const dateFnsLocale = locale === 'fr' ? frLocale : undefined;
  const { data: unread } = useUnreadCount();
  const { data: notifications } = useNotifications({ limit: 10 });
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  useEffect(() => {
    const socket = getNotificationSocket();
    if (!socket) return;

    const handleNotification = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    const handleUnreadCount = (data: { count: number }) => {
      queryClient.setQueryData(['notifications', 'unread-count'], { count: data.count });
    };

    socket.on('notification', handleNotification);
    socket.on('unreadCount', handleUnreadCount);

    return () => {
      socket.off('notification', handleNotification);
      socket.off('unreadCount', handleUnreadCount);
    };
  }, [queryClient]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }
    const data = notification.data;
    if (data?.groupId && data?.projectId) {
      router.push(`/groups/${data.groupId}/projects/${data.projectId}`);
    } else if (data?.groupId) {
      router.push(`/groups/${data.groupId}`);
    }
    setOpen(false);
  };

  const count = unread?.count || 0;

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="relative h-8 w-8 rounded-lg"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-lg shadow-xl z-50 animate-slide-down">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <h3 className="font-semibold text-sm">{t('notifications.title')}</h3>
            {count > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1 h-6 px-2"
                onClick={() => markAllAsRead.mutate()}
              >
                <CheckCheck className="h-3 w-3" />
                {t('notifications.markAllRead')}
              </Button>
            )}
          </div>
          <ScrollArea className="max-h-72">
            {notifications?.data && notifications.data.length > 0 ? (
              <div>
                {notifications.data.map((n) => (
                  <button
                    key={n.id}
                    className={`w-full text-left p-3 hover:bg-muted transition-colors duration-150 flex gap-2.5 border-b border-border/50 last:border-0 ${
                      !n.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
                    }`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className="flex-shrink-0 p-1.5 rounded-md bg-muted">
                      {iconMap[n.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{n.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: dateFnsLocale })}
                      </p>
                    </div>
                    {!n.read && (
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Bell className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{t('notifications.noNotifications')}</p>
              </div>
            )}
          </ScrollArea>
          {notifications?.data && notifications.data.length > 0 && (
            <div className="p-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs h-7"
                onClick={() => {
                  router.push('/notifications');
                  setOpen(false);
                }}
              >
                {t('notifications.viewAll')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
