import { io, Socket } from 'socket.io-client';
import { Message, DirectMessage } from '@/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3011';

let socket: Socket | null = null;
let notificationSocket: Socket | null = null;
let conversationSocket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(token: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(`${WS_URL}/messages`, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('WebSocket connected');
  });

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
  });

  return socket;
}

export function getNotificationSocket(): Socket | null {
  return notificationSocket;
}

export function connectNotificationSocket(token: string): Socket {
  if (notificationSocket?.connected) {
    return notificationSocket;
  }

  notificationSocket = io(`${WS_URL}/notifications`, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  notificationSocket.on('connect', () => {
    console.log('Notification WebSocket connected');
  });

  notificationSocket.on('disconnect', () => {
    console.log('Notification WebSocket disconnected');
  });

  notificationSocket.on('connect_error', (error) => {
    console.error('Notification WebSocket connection error:', error);
  });

  return notificationSocket;
}

export function disconnectNotificationSocket(): void {
  if (notificationSocket) {
    notificationSocket.disconnect();
    notificationSocket = null;
  }
}

// Conversation Socket (Direct Messages)
export function getConversationSocket(): Socket | null {
  return conversationSocket;
}

export function connectConversationSocket(token: string): Socket {
  if (conversationSocket?.connected) {
    return conversationSocket;
  }

  conversationSocket = io(`${WS_URL}/conversations`, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  conversationSocket.on('connect', () => {
    console.log('Conversation WebSocket connected');
  });

  conversationSocket.on('disconnect', () => {
    console.log('Conversation WebSocket disconnected');
  });

  conversationSocket.on('connect_error', (error) => {
    console.error('Conversation WebSocket connection error:', error);
  });

  return conversationSocket;
}

export function disconnectConversationSocket(): void {
  if (conversationSocket) {
    conversationSocket.disconnect();
    conversationSocket = null;
  }
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  disconnectNotificationSocket();
  disconnectConversationSocket();
}

export function joinGroup(groupId: string): void {
  socket?.emit('joinGroup', { groupId });
}

export function leaveGroup(groupId: string): void {
  socket?.emit('leaveGroup', { groupId });
}

export function sendMessage(
  content: string,
  groupId: string,
  mentions?: string[],
  replyToId?: string,
  attachments?: { filename: string; originalName: string; mimeType: string; size: number; url: string }[],
): void {
  socket?.emit('sendMessage', { content, groupId, mentions, replyToId, attachments });
}

export function editMessage(messageId: string, groupId: string, content: string): void {
  socket?.emit('editMessage', { messageId, groupId, content });
}

export function deleteMessage(messageId: string, groupId: string): void {
  socket?.emit('deleteMessage', { messageId, groupId });
}

export function sendTyping(groupId: string, isTyping: boolean): void {
  socket?.emit('typing', { groupId, isTyping });
}

export function onNewMessage(callback: (message: Message) => void): () => void {
  socket?.on('newMessage', callback);
  return () => {
    socket?.off('newMessage', callback);
  };
}

export function onMessageEdited(callback: (message: Message) => void): () => void {
  socket?.on('messageEdited', callback);
  return () => {
    socket?.off('messageEdited', callback);
  };
}

export function onMessageDeleted(callback: (data: { messageId: string }) => void): () => void {
  socket?.on('messageDeleted', callback);
  return () => {
    socket?.off('messageDeleted', callback);
  };
}

export function onUserTyping(
  callback: (data: { userId: string; isTyping: boolean }) => void
): () => void {
  socket?.on('userTyping', callback);
  return () => {
    socket?.off('userTyping', callback);
  };
}

// Group message reactions
export function addReaction(messageId: string, groupId: string, emoji: string): void {
  socket?.emit('addReaction', { messageId, groupId, emoji });
}

export function removeReaction(messageId: string, groupId: string, emoji: string): void {
  socket?.emit('removeReaction', { messageId, groupId, emoji });
}

export function onReactionAdded(callback: (data: { messageId: string; reaction: any }) => void): () => void {
  socket?.on('reactionAdded', callback);
  return () => {
    socket?.off('reactionAdded', callback);
  };
}

export function onReactionRemoved(callback: (data: { messageId: string; emoji: string; userId: string }) => void): () => void {
  socket?.on('reactionRemoved', callback);
  return () => {
    socket?.off('reactionRemoved', callback);
  };
}

// ===== Direct Message Functions =====
export function joinConversation(conversationId: string): void {
  conversationSocket?.emit('joinConversation', { conversationId });
}

export function leaveConversation(conversationId: string): void {
  conversationSocket?.emit('leaveConversation', { conversationId });
}

export function sendDirectMessage(
  conversationId: string,
  content: string,
  replyToId?: string,
  attachments?: { filename: string; originalName: string; mimeType: string; size: number; url: string }[]
): void {
  conversationSocket?.emit('sendDirectMessage', { conversationId, content, replyToId, attachments });
}

export function editDirectMessage(messageId: string, conversationId: string, content: string): void {
  conversationSocket?.emit('editDirectMessage', { messageId, conversationId, content });
}

export function deleteDirectMessage(messageId: string, conversationId: string): void {
  conversationSocket?.emit('deleteDirectMessage', { messageId, conversationId });
}

export function addDirectReaction(messageId: string, conversationId: string, emoji: string): void {
  conversationSocket?.emit('addDirectReaction', { messageId, conversationId, emoji });
}

export function removeDirectReaction(messageId: string, conversationId: string, emoji: string): void {
  conversationSocket?.emit('removeDirectReaction', { messageId, conversationId, emoji });
}

export function markConversationAsRead(conversationId: string): void {
  conversationSocket?.emit('markAsRead', { conversationId });
}

export function sendConversationTyping(conversationId: string, isTyping: boolean): void {
  conversationSocket?.emit('typing', { conversationId, isTyping });
}

export function onNewDirectMessage(callback: (message: DirectMessage) => void): () => void {
  conversationSocket?.on('newDirectMessage', callback);
  return () => {
    conversationSocket?.off('newDirectMessage', callback);
  };
}

export function onDirectMessageEdited(callback: (message: DirectMessage) => void): () => void {
  conversationSocket?.on('directMessageEdited', callback);
  return () => {
    conversationSocket?.off('directMessageEdited', callback);
  };
}

export function onDirectMessageDeleted(callback: (data: { messageId: string }) => void): () => void {
  conversationSocket?.on('directMessageDeleted', callback);
  return () => {
    conversationSocket?.off('directMessageDeleted', callback);
  };
}

export function onDirectReactionAdded(callback: (data: { messageId: string; reaction: any }) => void): () => void {
  conversationSocket?.on('directReactionAdded', callback);
  return () => {
    conversationSocket?.off('directReactionAdded', callback);
  };
}

export function onDirectReactionRemoved(callback: (data: { messageId: string; emoji: string; userId: string }) => void): () => void {
  conversationSocket?.on('directReactionRemoved', callback);
  return () => {
    conversationSocket?.off('directReactionRemoved', callback);
  };
}

export function onConversationTyping(
  callback: (data: { conversationId: string; userId: string; isTyping: boolean }) => void
): () => void {
  conversationSocket?.on('userTyping', callback);
  return () => {
    conversationSocket?.off('userTyping', callback);
  };
}

export function onConversationUpdated(
  callback: (data: { conversationId: string; lastMessage: DirectMessage }) => void
): () => void {
  conversationSocket?.on('conversationUpdated', callback);
  return () => {
    conversationSocket?.off('conversationUpdated', callback);
  };
}
