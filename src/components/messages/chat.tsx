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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  addReaction,
  removeReaction,
  onReactionAdded,
  onReactionRemoved,
} from '@/lib/socket';
import { Send, Loader2, MoreVertical, Pencil, Trash2, X, Check, Smile, Paperclip, Reply, File as FileIcon } from 'lucide-react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n';
import emojiData from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { api } from '@/lib/api';

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏'];

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
  const { t, locale } = useTranslation();
  const { data, isLoading } = useMessages(groupId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<{ filename: string; originalName: string; mimeType: string; size: number; url: string }[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          prev.map((m) => (m.id === message.id ? message : m)),
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

    const unsubReactionAdded = onReactionAdded(({ messageId, reaction }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, reactions: [...(m.reactions || []), reaction] }
            : m
        )
      );
    });

    const unsubReactionRemoved = onReactionRemoved(({ messageId, emoji, userId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                reactions: (m.reactions || []).filter(
                  (r: any) => !(r.emoji === emoji && r.userId === userId)
                ),
              }
            : m
        )
      );
    });

    return () => {
      unsubMessage();
      unsubEdited();
      unsubDeleted();
      unsubTyping();
      unsubReactionAdded();
      unsubReactionRemoved();
    };
  }, [groupId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Typing indicator
  const handleTypingIndicator = useCallback(() => {
    sendTyping(groupId, true);
    const timeout = setTimeout(() => {
      sendTyping(groupId, false);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [groupId]);

  const handleSend = async () => {
    if (!newMessage.trim() && pendingAttachments.length === 0) return;
    if (isSending) return;

    // Extract mentions
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(newMessage)) !== null) {
      mentions.push(match[2]);
    }

    setIsSending(true);
    try {
      socketSendMessage(
        newMessage.trim() || ' ',
        groupId,
        mentions.length > 0 ? mentions : undefined,
        replyTo?.id,
        pendingAttachments.length > 0 ? pendingAttachments : undefined,
      );
      setNewMessage('');
      setShowMentionList(false);
      setReplyTo(null);
      setPendingAttachments([]);
      setShowEmojiPicker(false);
      sendTyping(groupId, false);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    handleTypingIndicator();
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

  const CROUSZ_AI_ID = 'crouszai-bot';
  const CROUSZ_AI_NAME = 'CrouszAI';

  const filteredMembers = groupMembers.filter(
    (m) => m.user.name.toLowerCase().includes(mentionFilter) && m.userId !== user?.id,
  );

  const showAiInMentions = CROUSZ_AI_NAME.toLowerCase().includes(mentionFilter);

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

  const handleReaction = (messageId: string, emoji: string) => {
    const message = messages.find((m) => m.id === messageId);
    const existingReaction = message?.reactions?.find(
      (r: any) => r.emoji === emoji && r.userId === user?.id
    );
    if (existingReaction) {
      removeReaction(messageId, groupId, emoji);
    } else {
      addReaction(messageId, groupId, emoji);
    }
  };

  const groupedReactions = (reactions: any[]) => {
    const grouped: Record<string, { emoji: string; count: number; users: string[]; hasCurrentUser: boolean }> = {};
    reactions?.forEach((r: any) => {
      if (!grouped[r.emoji]) {
        grouped[r.emoji] = { emoji: r.emoji, count: 0, users: [], hasCurrentUser: false };
      }
      grouped[r.emoji].count++;
      grouped[r.emoji].users.push(r.user?.name || '');
      if (r.userId === user?.id) {
        grouped[r.emoji].hasCurrentUser = true;
      }
    });
    return Object.values(grouped);
  };

  const handleEmojiSelect = (emoji: { native: string }) => {
    setNewMessage((prev) => prev + emoji.native);
    inputRef.current?.focus();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFile(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);

        const { data: uploadResult } = await api.post('/attachments/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        setPendingAttachments((prev) => [
          ...prev,
          {
            filename: uploadResult.filename,
            originalName: uploadResult.originalName,
            mimeType: uploadResult.mimeType,
            size: uploadResult.size,
            url: uploadResult.url,
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const isImageFile = (mimeType: string, filename?: string) => {
    if (mimeType && mimeType.startsWith('image/')) return true;
    if (filename) {
      const ext = filename.toLowerCase().split('.').pop();
      return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '');
    }
    return false;
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
                  const reactions = groupedReactions(message.reactions || []);

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

                      <div className={cn('max-w-[70%] flex flex-col', isOwn ? 'items-end' : 'items-start')}>
                        {/* Reply indicator */}
                        {message.replyTo && (
                          <div className="text-xs text-muted-foreground mb-1 px-3 py-1 rounded-lg bg-muted/50">
                            <Reply className="h-3 w-3 inline mr-1" />
                            {(message.replyTo as any).author?.name}: {(message.replyTo as any).content?.slice(0, 50)}
                          </div>
                        )}

                        <div className="group/msg relative">
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

                            {/* Attachments */}
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="mb-2 space-y-2">
                                {message.attachments.map((att: any) => (
                                  <div key={att.id}>
                                    {isImageFile(att.mimeType, att.originalName || att.filename) ? (
                                      <img
                                        src={att.url}
                                        alt={att.originalName}
                                        className="max-w-full rounded-lg max-h-48 object-cover cursor-pointer"
                                        onClick={() => window.open(att.url, '_blank')}
                                      />
                                    ) : null}
                                    <a
                                      href={att.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={cn(
                                        'flex items-center gap-2 p-2 rounded-lg',
                                        isOwn ? 'bg-white/10' : 'bg-background',
                                        isImageFile(att.mimeType, att.originalName || att.filename) ? 'hidden' : ''
                                      )}
                                    >
                                      <FileIcon className="h-4 w-4" />
                                      <span className="text-sm truncate">{att.originalName}</span>
                                    </a>
                                  </div>
                                ))}
                              </div>
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
                              {message.isEdited && ' • edited'}
                            </p>
                          </div>

                          {/* Message actions (reaction, reply, edit/delete) */}
                          {!editingMessage && (
                            <div className={cn(
                              'absolute top-0 opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-0.5',
                              isOwn ? 'left-0 -translate-x-full pr-1' : 'right-0 translate-x-full pl-1'
                            )}>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg">
                                    <Smile className="h-3.5 w-3.5" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-2" side={isOwn ? 'left' : 'right'}>
                                  <div className="flex gap-1">
                                    {EMOJI_LIST.map((emoji) => (
                                      <button
                                        key={emoji}
                                        onClick={() => handleReaction(message.id, emoji)}
                                        className="text-lg hover:scale-125 transition-transform p-1"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-lg"
                                onClick={() => setReplyTo(message)}
                              >
                                <Reply className="h-3.5 w-3.5" />
                              </Button>

                              {isOwn && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 rounded-lg"
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
                          )}
                        </div>

                        {/* Reactions */}
                        {reactions.length > 0 && (
                          <div className={cn('flex flex-wrap gap-1 mt-1', isOwn ? 'justify-end' : '')}>
                            {reactions.map((r) => (
                              <button
                                key={r.emoji}
                                onClick={() => handleReaction(message.id, r.emoji)}
                                className={cn(
                                  'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                                  r.hasCurrentUser
                                    ? 'bg-primary/10 border border-primary/30'
                                    : 'bg-muted/60'
                                )}
                                title={r.users.join(', ')}
                              >
                                <span>{r.emoji}</span>
                                <span>{r.count}</span>
                              </button>
                            ))}
                          </div>
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

      {/* Reply indicator */}
      {replyTo && (
        <div className="px-4 py-2 bg-muted/50 border-t border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Reply className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t('chat.replyingTo') || 'Replying to'}</span>
            <span className="font-medium">{replyTo.author.name}</span>
            <span className="text-muted-foreground truncate max-w-[200px]">{replyTo.content}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg" onClick={() => setReplyTo(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Pending Attachments Preview */}
      {pendingAttachments.length > 0 && (
        <div className="px-4 py-2 border-t border-border/50 bg-muted/30">
          <div className="flex flex-wrap gap-2">
            {pendingAttachments.map((att, index) => (
              <div
                key={index}
                className="relative group bg-background rounded-lg p-2 border border-border"
              >
                {isImageFile(att.mimeType, att.originalName) ? (
                  <img
                    src={att.url}
                    alt={att.originalName}
                    className="h-16 w-16 object-cover rounded"
                  />
                ) : (
                  <div className="h-16 w-16 flex flex-col items-center justify-center">
                    <FileIcon className="h-6 w-6 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground truncate max-w-full mt-1">
                      {att.originalName.slice(0, 10)}...
                    </span>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 border-t border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          {/* File Upload */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFile}
          >
            {uploadingFile ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Paperclip className="h-5 w-5" />
            )}
          </Button>

          {/* Emoji Picker */}
          <div className="relative flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="h-5 w-5" />
            </Button>
            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 z-50">
                <Picker
                  data={emojiData}
                  onEmojiSelect={handleEmojiSelect}
                  theme="dark"
                  locale={locale === 'fr' ? 'fr' : 'en'}
                  previewPosition="none"
                  skinTonePosition="none"
                />
              </div>
            )}
          </div>

          <div className="relative flex-1">
            <Input
              ref={inputRef}
              placeholder={t('chat.typeMessage')}
              value={newMessage}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowEmojiPicker(false)}
              className="w-full rounded-xl"
            />
            {showMentionList && (filteredMembers.length > 0 || showAiInMentions) && (
              <div className="absolute bottom-full left-0 mb-1 w-64 glass-card rounded-xl shadow-lg z-50 max-h-40 overflow-y-auto">
                {showAiInMentions && (
                  <button
                    key={CROUSZ_AI_ID}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 text-left text-sm rounded-lg transition-colors duration-150"
                    onClick={() => insertMention(CROUSZ_AI_ID, CROUSZ_AI_NAME)}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px] bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold">
                        AI
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{CROUSZ_AI_NAME}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground bg-violet-500/10 text-violet-500 px-1.5 py-0.5 rounded-full">Bot</span>
                  </button>
                )}
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
            disabled={(!newMessage.trim() && pendingAttachments.length === 0) || isSending}
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
