'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Message, GroupMember } from '@/types';
import { useAuthStore } from '@/store/auth';
import { useMessages } from '@/hooks/use-messages';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getSocket,
  joinGroup,
  leaveGroup,
  sendMessage as socketSendMessage,
  editMessage as socketEditMessage,
  deleteMessage as socketDeleteMessage,
  sendTyping,
  onNewMessage,
  onMessageEdited,
  onMessageDeleted,
  onUserTyping,
} from '@/lib/socket';
import { Send, Loader2, MoreVertical, Pencil, Trash2, X, Check } from 'lucide-react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n';

interface ChatProps {
  groupId: string;
  groupMembers?: GroupMember[];
}

function formatMessageTime(date: Date, yesterdayLabel: string): string {
  if (isToday(date)) {
    return format(date, 'HH:mm');
  }
  if (isYesterday(date)) {
    return yesterdayLabel + ' ' + format(date, 'HH:mm');
  }
  return format(date, 'MMM d, HH:mm');
}

function DateSeparator({ date, todayLabel, yesterdayLabel }: { date: Date; todayLabel: string; yesterdayLabel: string }) {
  let label = format(date, 'MMMM d, yyyy');
  if (isToday(date)) label = todayLabel;
  if (isYesterday(date)) label = yesterdayLabel;

  return (
    <div className="flex items-center gap-4 py-4">
      <div className="flex-1 h-px bg-border/50" />
      <span className="text-xs font-medium text-muted-foreground px-3 py-1 rounded-full bg-muted/50">{label}</span>
      <div className="flex-1 h-px bg-border/50" />
    </div>
  );
}

export function Chat({ groupId, groupMembers = [] }: ChatProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { data, isLoading } = useMessages(groupId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editContent, setEditContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize messages from query
  useEffect(() => {
    if (data?.messages) {
      setMessages(data.messages);
    }
  }, [data?.messages]);

  // Join/leave group room
  useEffect(() => {
    const socket = getSocket();
    if (socket?.connected) {
      joinGroup(groupId);
    }

    return () => {
      if (socket?.connected) {
        leaveGroup(groupId);
      }
    };
  }, [groupId]);

  // Handle real-time events
  useEffect(() => {
    const unsubMessage = onNewMessage((message) => {
      if (message.groupId === groupId) {
        setMessages((prev) => [...prev, message]);
      }
    });

    const unsubEdited = onMessageEdited((message) => {
      if (message.groupId === groupId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? { ...m, content: message.content } : m)),
        );
      }
    });

    const unsubDeleted = onMessageDeleted(({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    const unsubTyping = onUserTyping(({ userId, isTyping }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (isTyping) {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    });

    return () => {
      unsubMessage();
      unsubEdited();
      unsubDeleted();
      unsubTyping();
    };
  }, [groupId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Typing indicator
  const handleTyping = useCallback(() => {
    sendTyping(groupId, true);
    const timeout = setTimeout(() => {
      sendTyping(groupId, false);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [groupId]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    // Extract mentions
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(newMessage)) !== null) {
      mentions.push(match[2]);
    }

    setIsSending(true);
    try {
      socketSendMessage(newMessage.trim(), groupId, mentions.length > 0 ? mentions : undefined);
      setNewMessage('');
      setShowMentionList(false);
      sendTyping(groupId, false);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    handleTyping();
    // Check for @ trigger
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
    const lastAtIndex = newMessage.lastIndexOf('@');
    const before = newMessage.substring(0, lastAtIndex);
    setNewMessage(`${before}@[${memberName}](${memberId}) `);
    setShowMentionList(false);
    inputRef.current?.focus();
  };

  const filteredMembers = groupMembers.filter(
    (m) => m.user.name.toLowerCase().includes(mentionFilter) && m.userId !== user?.id,
  );

  // Render message content with highlighted mentions
  const renderMessageContent = (content: string, isOwn: boolean) => {
    const parts = content.split(/(@\[([^\]]+)\]\([^)]+\))/g);
    return parts.map((part, i) => {
      if (part.match(/^@\[([^\]]+)\]\([^)]+\)$/)) {
        const name = part.match(/^@\[([^\]]+)\]/)?.[1];
        return (
          <span key={i} className={cn(
            'rounded-md px-1.5 font-medium',
            isOwn ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
          )}>
            @{name}
          </span>
        );
      }
      if (i % 3 !== 0) return null;
      return <span key={i}>{part}</span>;
    });
  };

  const handleStartEdit = (message: Message) => {
    setEditingMessage(message);
    setEditContent(message.content);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  const handleSaveEdit = () => {
    if (!editingMessage || !editContent.trim()) return;
    socketEditMessage(editingMessage.id, groupId, editContent.trim());
    setEditingMessage(null);
    setEditContent('');
  };

  const handleDeleteMessage = (messageId: string) => {
    socketDeleteMessage(messageId, groupId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupedMessages: { date: Date; messages: Message[] }[] = [];
  messages.forEach((message) => {
    const messageDate = new Date(message.createdAt);
    const lastGroup = groupedMessages[groupedMessages.length - 1];

    if (!lastGroup || !isSameDay(lastGroup.date, messageDate)) {
      groupedMessages.push({ date: messageDate, messages: [message] });
    } else {
      lastGroup.messages.push(message);
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 rounded-lg" />
                <Skeleton className="h-12 w-64 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full glass-card rounded-xl overflow-hidden">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Send className="h-8 w-8 text-primary/40" />
            </div>
            <p className="text-muted-foreground">{t('chat.noMessages')}</p>
            <p className="text-sm text-muted-foreground/60 mt-1">{t('chat.noMessagesHint')}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {groupedMessages.map((group, groupIndex) => (
              <div key={groupIndex}>
                <DateSeparator date={group.date} todayLabel={t('chat.today')} yesterdayLabel={t('chat.yesterday')} />
                {group.messages.map((message, index) => {
                  const isOwn = message.authorId === user?.id;
                  const showAvatar =
                    index === 0 ||
                    group.messages[index - 1]?.authorId !== message.authorId;

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        'flex items-end gap-2 py-1',
                        isOwn ? 'flex-row-reverse' : 'flex-row'
                      )}
                    >
                      {showAvatar ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.author.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {message.author.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-8" />
                      )}

                      <div className={cn('group/msg relative max-w-[70%]', isOwn ? 'flex flex-row-reverse items-start gap-1' : 'flex items-start gap-1')}>
                        <div
                          className={cn(
                            'rounded-2xl px-4 py-2 transition-shadow duration-200',
                            isOwn
                              ? 'bg-gradient-to-br from-primary to-purple-600 text-white rounded-br-sm shadow-lg shadow-primary/20'
                              : 'bg-muted/60 backdrop-blur-sm border border-border/50 rounded-bl-sm'
                          )}
                        >
                          {!isOwn && showAvatar && (
                            <p className="text-xs font-medium text-primary mb-1">
                              {message.author.name}
                            </p>
                          )}
                          {editingMessage?.id === message.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit();
                                  if (e.key === 'Escape') handleCancelEdit();
                                }}
                                className="h-7 text-sm bg-white/20 border-white/30 text-inherit rounded-lg"
                                autoFocus
                              />
                              <Button size="icon" variant="ghost" className="h-6 w-6 rounded-lg" onClick={handleSaveEdit}>
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6 rounded-lg" onClick={handleCancelEdit}>
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {renderMessageContent(message.content, isOwn)}
                            </p>
                          )}
                          <p
                            className={cn(
                              'text-[10px] mt-1',
                              isOwn ? 'text-white/50' : 'text-muted-foreground/60'
                            )}
                          >
                            {formatMessageTime(new Date(message.createdAt), t('chat.yesterday'))}
                          </p>
                        </div>
                        {isOwn && !editingMessage && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover/msg:opacity-100 transition-opacity flex-shrink-0 rounded-lg"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={isOwn ? 'end' : 'start'} className="glass-card rounded-xl">
                              <DropdownMenuItem onClick={() => handleStartEdit(message)} className="gap-2 rounded-lg">
                                <Pencil className="h-3.5 w-3.5" />
                                {t('chat.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive gap-2 rounded-lg"
                                onClick={() => handleDeleteMessage(message.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                {t('chat.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {typingUsers.size > 0 && (
              <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                <div className="flex gap-1">
                  <span className="animate-bounce text-primary">•</span>
                  <span className="animate-bounce text-primary" style={{ animationDelay: '0.1s' }}>•</span>
                  <span className="animate-bounce text-primary" style={{ animationDelay: '0.2s' }}>•</span>
                </div>
                {t('chat.typing')}
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              placeholder={t('chat.typeMessage')}
              value={newMessage}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-xl"
            />
            {showMentionList && filteredMembers.length > 0 && (
              <div className="absolute bottom-full left-0 mb-1 w-64 glass-card rounded-xl shadow-lg z-50 max-h-40 overflow-y-auto">
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
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="rounded-xl bg-gradient-to-r from-primary to-purple-600 shadow-lg shadow-primary/20"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
