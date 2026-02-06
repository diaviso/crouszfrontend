'use client';

import { useState, useEffect, useRef } from 'react';
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
  Send,
  Smile,
  Paperclip,
  MoreVertical,
  Reply,
  Pencil,
  Trash2,
  X,
  Check,
  Image as ImageIcon,
  File,
  Loader2,
} from 'lucide-react';
import emojiData from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { useTranslation } from '@/lib/i18n';
import { useConversationMessages } from '@/hooks/use-conversations';
import {
  joinConversation,
  leaveConversation,
  sendDirectMessage,
  editDirectMessage,
  deleteDirectMessage,
  addDirectReaction,
  removeDirectReaction,
  markConversationAsRead,
  sendConversationTyping,
  onNewDirectMessage,
  onDirectMessageEdited,
  onDirectMessageDeleted,
  onDirectReactionAdded,
  onDirectReactionRemoved,
  onConversationTyping,
} from '@/lib/socket';
import type { Conversation, DirectMessage, User } from '@/types';

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏'];

interface ConversationViewProps {
  conversation: Conversation;
  currentUser: User;
}

export function ConversationView({ conversation, currentUser }: ConversationViewProps) {
  const { t, locale } = useTranslation();
  const dateFnsLocale = locale === 'fr' ? frLocale : undefined;
  const { data: messagesData, isLoading, refetch } = useConversationMessages(conversation.id);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState<DirectMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<DirectMessage | null>(null);
  const [editContent, setEditContent] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<{ filename: string; originalName: string; mimeType: string; size: number; url: string }[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const otherParticipant = conversation.participants.find(
    (p) => p.userId !== currentUser.id
  )?.user;

  // Initialize messages from query
  useEffect(() => {
    if (messagesData?.messages) {
      setMessages(messagesData.messages);
    }
  }, [messagesData?.messages]);

  // Join conversation room and set up listeners
  useEffect(() => {
    joinConversation(conversation.id);
    markConversationAsRead(conversation.id);

    const unsubNewMessage = onNewDirectMessage((message) => {
      if (message.conversationId === conversation.id) {
        setMessages((prev) => [...prev, message]);
        markConversationAsRead(conversation.id);
      }
    });

    const unsubEdited = onDirectMessageEdited((message) => {
      if (message.conversationId === conversation.id) {
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? message : m))
        );
      }
    });

    const unsubDeleted = onDirectMessageDeleted(({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    const unsubReactionAdded = onDirectReactionAdded(({ messageId, reaction }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, reactions: [...(m.reactions || []), reaction] }
            : m
        )
      );
    });

    const unsubReactionRemoved = onDirectReactionRemoved(({ messageId, emoji, userId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                reactions: (m.reactions || []).filter(
                  (r) => !(r.emoji === emoji && r.userId === userId)
                ),
              }
            : m
        )
      );
    });

    const unsubTyping = onConversationTyping(({ conversationId, userId, isTyping }) => {
      if (conversationId === conversation.id && userId !== currentUser.id) {
        setTypingUsers((prev) =>
          isTyping
            ? [...new Set([...prev, userId])]
            : prev.filter((id) => id !== userId)
        );
      }
    });

    return () => {
      leaveConversation(conversation.id);
      unsubNewMessage();
      unsubEdited();
      unsubDeleted();
      unsubReactionAdded();
      unsubReactionRemoved();
      unsubTyping();
    };
  }, [conversation.id, currentUser.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim() && pendingAttachments.length === 0) return;

    sendDirectMessage(
      conversation.id,
      newMessage.trim() || ' ',
      replyTo?.id,
      pendingAttachments.length > 0 ? pendingAttachments : undefined
    );

    setNewMessage('');
    setReplyTo(null);
    setPendingAttachments([]);
    setShowEmojiPicker(false);
    sendConversationTyping(conversation.id, false);
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

  const handleTyping = (value: string) => {
    setNewMessage(value);
    sendConversationTyping(conversation.id, value.length > 0);
  };

  const handleEdit = (message: DirectMessage) => {
    setEditingMessage(message);
    setEditContent(message.content);
  };

  const handleSaveEdit = () => {
    if (!editingMessage || !editContent.trim()) return;
    editDirectMessage(editingMessage.id, conversation.id, editContent.trim());
    setEditingMessage(null);
    setEditContent('');
  };

  const handleDelete = (messageId: string) => {
    deleteDirectMessage(messageId, conversation.id);
  };

  const handleReaction = (messageId: string, emoji: string) => {
    const message = messages.find((m) => m.id === messageId);
    const existingReaction = message?.reactions?.find(
      (r) => r.emoji === emoji && r.userId === currentUser.id
    );

    if (existingReaction) {
      removeDirectReaction(messageId, conversation.id, emoji);
    } else {
      addDirectReaction(messageId, conversation.id, emoji);
    }
  };


  const groupedReactions = (reactions: DirectMessage['reactions']) => {
    const grouped: Record<string, { emoji: string; count: number; users: string[]; hasCurrentUser: boolean }> = {};
    reactions?.forEach((r) => {
      if (!grouped[r.emoji]) {
        grouped[r.emoji] = { emoji: r.emoji, count: 0, users: [], hasCurrentUser: false };
      }
      grouped[r.emoji].count++;
      grouped[r.emoji].users.push(r.user.name);
      if (r.userId === currentUser.id) {
        grouped[r.emoji].hasCurrentUser = true;
      }
    });
    return Object.values(grouped);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card/50">
        <Avatar className="h-10 w-10">
          <AvatarImage src={otherParticipant?.avatar} />
          <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
            {otherParticipant?.name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{otherParticipant?.name}</p>
          <p className="text-xs text-muted-foreground">{otherParticipant?.email}</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <Skeleton className="h-16 w-64 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-3">
            {messages.map((message, index) => {
              const isOwn = message.authorId === currentUser.id;
              const showAvatar =
                index === 0 ||
                messages[index - 1].authorId !== message.authorId;
              const reactions = groupedReactions(message.reactions);

              return (
                <div
                  key={message.id}
                  className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
                >
                  {!isOwn && showAvatar ? (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage src={message.author.avatar} />
                      <AvatarFallback className="text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                        {message.author.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : !isOwn ? (
                    <div className="w-8" />
                  ) : null}

                  <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                    {/* Reply indicator */}
                    {message.replyTo && (
                      <div className={`text-xs text-muted-foreground mb-1 px-3 py-1 rounded-lg bg-muted/50 ${isOwn ? 'ml-auto' : ''}`}>
                        <Reply className="h-3 w-3 inline mr-1" />
                        {message.replyTo.author.name}: {message.replyTo.content.slice(0, 50)}
                        {message.replyTo.content.length > 50 ? '...' : ''}
                      </div>
                    )}

                    {/* Message bubble */}
                    <div className="group relative">
                      {editingMessage?.id === message.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-w-[200px]"
                            autoFocus
                          />
                          <Button size="icon" variant="ghost" onClick={handleSaveEdit}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditingMessage(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div
                            className={`px-4 py-2 rounded-2xl ${
                              isOwn
                                ? 'bg-indigo-600 text-white rounded-br-md'
                                : 'bg-muted rounded-bl-md'
                            }`}
                          >
                            {/* Attachments */}
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="mb-2 space-y-2">
                                {message.attachments.map((att) => (
                                  <div key={att.id}>
                                    {isImageFile(att.mimeType, att.originalName || att.filename) ? (
                                      <img
                                        src={att.url}
                                        alt={att.originalName}
                                        className="max-w-full rounded-lg max-h-48 object-cover cursor-pointer"
                                        onClick={() => window.open(att.url, '_blank')}
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          target.nextElementSibling?.classList.remove('hidden');
                                        }}
                                      />
                                    ) : null}
                                    <a
                                      href={att.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`flex items-center gap-2 p-2 rounded-lg ${
                                        isOwn ? 'bg-white/10' : 'bg-background'
                                      } ${isImageFile(att.mimeType, att.originalName || att.filename) ? 'hidden' : ''}`}
                                    >
                                      <File className="h-4 w-4" />
                                      <span className="text-sm truncate">{att.originalName}</span>
                                    </a>
                                  </div>
                                ))}
                              </div>
                            )}

                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                            <div className={`flex items-center gap-1 mt-1 text-[10px] ${isOwn ? 'text-white/70' : 'text-muted-foreground'}`}>
                              <span>{format(new Date(message.createdAt), 'HH:mm', { locale: dateFnsLocale })}</span>
                              {message.isEdited && <span>• {t('messages.edited') || 'edited'}</span>}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-full pr-1' : 'right-0 translate-x-full pl-1'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5`}>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <Smile className="h-4 w-4" />
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
                              className="h-7 w-7"
                              onClick={() => setReplyTo(message)}
                            >
                              <Reply className="h-4 w-4" />
                            </Button>

                            {isOwn && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => handleEdit(message)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    {t('common.edit') || 'Edit'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(message.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {t('common.delete') || 'Delete'}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Reactions */}
                    {reactions.length > 0 && (
                      <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                        {reactions.map((r) => (
                          <button
                            key={r.emoji}
                            onClick={() => handleReaction(message.id, r.emoji)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                              r.hasCurrentUser
                                ? 'bg-indigo-100 dark:bg-indigo-900/50 border border-indigo-300 dark:border-indigo-700'
                                : 'bg-muted'
                            }`}
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

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>{otherParticipant?.name} {t('messages.isTyping') || 'is typing...'}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">{t('messages.noMessages') || 'No messages yet'}</p>
            <p className="text-xs">{t('messages.startChatting') || 'Start the conversation!'}</p>
          </div>
        )}
      </ScrollArea>

      {/* Reply indicator */}
      {replyTo && (
        <div className="px-4 py-2 bg-muted/50 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Reply className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t('messages.replyingTo') || 'Replying to'}</span>
            <span className="font-medium">{replyTo.author.name}</span>
            <span className="text-muted-foreground truncate max-w-[200px]">{replyTo.content}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyTo(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Pending Attachments Preview */}
      {pendingAttachments.length > 0 && (
        <div className="px-4 py-2 border-t border-border bg-muted/30">
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
                    <File className="h-6 w-6 text-muted-foreground" />
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

      {/* Input */}
      <div className="p-4 border-t border-border bg-card/50">
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
            className="h-9 w-9"
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
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
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

          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('messages.typeMessage') || 'Type a message...'}
            className="flex-1"
            onFocus={() => setShowEmojiPicker(false)}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() && pendingAttachments.length === 0}
            className="h-9 w-9 bg-indigo-600 hover:bg-indigo-700"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
