'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { useConversations, useGetOrCreateDirectConversation } from '@/hooks/use-conversations';
import { useAuthStore } from '@/store/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MessageSquare, Plus, Search, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { useTranslation } from '@/lib/i18n';
import { api } from '@/lib/api';
import type { Conversation, User } from '@/types';
import { ConversationView } from '@/components/messages/conversation-view';

export default function MessagesPage() {
  const { t, locale } = useTranslation();
  const dateFnsLocale = locale === 'fr' ? frLocale : undefined;
  const { user: currentUser } = useAuthStore();
  const { data: conversations, isLoading } = useConversations();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const createConversation = useGetOrCreateDirectConversation();

  // Search users for new conversation
  useEffect(() => {
    if (userSearch.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { data } = await api.get(`/users/search?q=${encodeURIComponent(userSearch)}`);
        setSearchResults(data.filter((u: User) => u.id !== currentUser?.id));
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearch, currentUser?.id]);

  const handleStartConversation = async (userId: string) => {
    try {
      const conversation = await createConversation.mutateAsync(userId);
      setSelectedConversation(conversation);
      setNewChatOpen(false);
      setUserSearch('');
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.userId !== currentUser?.id)?.user;
  };

  const filteredConversations = conversations?.filter(conv => {
    if (!searchQuery) return true;
    const other = getOtherParticipant(conv);
    return other?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           other?.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full">
      <Header title={t('messages.title') || 'Messages'} />

      <div className="flex-1 flex overflow-hidden">
        {/* Conversation List */}
        <div className="w-80 border-r border-border/40 flex flex-col bg-card/30 backdrop-blur-sm">
          {/* Search and New Chat */}
          <div className="p-3 space-y-2 border-b border-border/40">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('messages.searchConversations') || 'Search conversations...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
                <DialogTrigger asChild>
                  <Button size="icon" className="h-9 w-9 bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/20 rounded-xl">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('messages.newConversation') || 'New Conversation'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t('messages.searchUsers') || 'Search users by name or email...'}
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <ScrollArea className="h-64">
                      {searchLoading ? (
                        <div className="space-y-2 p-2">
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="space-y-1">
                          {searchResults.map((user) => (
                            <button
                              key={user.id}
                              onClick={() => handleStartConversation(user.id)}
                              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                            >
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                                  {user.name?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="text-left">
                                <p className="text-sm font-medium">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : userSearch.length >= 2 ? (
                        <p className="text-center text-sm text-muted-foreground py-8">
                          {t('messages.noUsersFound') || 'No users found'}
                        </p>
                      ) : (
                        <p className="text-center text-sm text-muted-foreground py-8">
                          {t('messages.typeToSearch') || 'Type at least 2 characters to search'}
                        </p>
                      )}
                    </ScrollArea>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Conversations */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="p-3 space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredConversations && filteredConversations.length > 0 ? (
              <div className="p-2">
                {filteredConversations.map((conv) => {
                  const other = getOtherParticipant(conv);
                  const lastMessage = conv.messages?.[0];
                  const isSelected = selectedConversation?.id === conv.id;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                        isSelected
                          ? 'bg-indigo-500/10 border border-indigo-500/20 shadow-sm'
                          : 'hover:bg-muted/50 border border-transparent'
                      }`}
                    >
                      <div className="relative">
                        <Avatar className="h-11 w-11">
                          <AvatarImage src={other?.avatar} />
                          <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                            {other?.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {(conv.unreadCount ?? 0) > 0 && (
                          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                            {conv.unreadCount}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">{other?.name}</p>
                          {lastMessage && (
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(lastMessage.createdAt), {
                                addSuffix: false,
                                locale: dateFnsLocale,
                              })}
                            </span>
                          )}
                        </div>
                        {lastMessage && (
                          <p className="text-xs text-muted-foreground truncate">
                            {lastMessage.authorId === currentUser?.id ? 'You: ' : ''}
                            {lastMessage.content}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 px-4">
                <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-sm text-muted-foreground text-center">
                  {t('messages.noConversations') || 'No conversations yet'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setNewChatOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('messages.startConversation') || 'Start a conversation'}
                </Button>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat View */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <ConversationView
              conversation={selectedConversation}
              currentUser={currentUser!}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground mesh-gradient">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-2xl animate-pulse-ring" />
                <MessageSquare className="h-16 w-16 mb-4 opacity-20 relative" />
              </div>
              <p className="text-lg font-medium">{t('messages.selectConversation') || 'Select a conversation'}</p>
              <p className="text-sm mt-1">{t('messages.selectConversationHint') || 'Choose a conversation from the list or start a new one'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
