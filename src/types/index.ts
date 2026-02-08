export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  googleId: string;
  createdAt: string;
  updatedAt: string;
  jobTitle?: string;
  specialty?: string;
  skills?: string[];
  bio?: string;
  phone?: string;
  linkedin?: string;
}

export type GroupRole = 'ADMIN' | 'MEMBER';

export interface GroupMember {
  id: string;
  role: GroupRole;
  joinedAt: string;
  userId: string;
  user: User;
  groupId: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  adminId: string;
  admin?: User;
  members?: GroupMember[];
  projects?: Project[];
  _count?: {
    members: number;
    projects: number;
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  groupId: string;
  group?: Group;
  tasks?: Task[];
  attachments?: Attachment[];
  _count?: {
    tasks: number;
    attachments: number;
  };
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface TaskAssignment {
  id: string;
  assignedAt: string;
  taskId: string;
  userId: string;
  user: User;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  project?: Project;
  assignees?: TaskAssignment[];
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  projectId: string;
  project?: Project;
  uploadedById: string;
  uploadedBy?: User;
}

// Message Attachments
export interface MessageAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
  messageId: string;
}

// Message Reactions
export interface MessageReaction {
  id: string;
  emoji: string;
  createdAt: string;
  messageId: string;
  userId: string;
  user: User;
}

export interface Message {
  id: string;
  content: string;
  mentions: string[];
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  groupId: string;
  group?: Group;
  authorId: string;
  author: User;
  replyToId?: string;
  replyTo?: Message;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
}

export interface MessagesResponse {
  messages: Message[];
  nextCursor?: string;
}

// Conversations (Direct Messages)
export interface ConversationParticipant {
  id: string;
  joinedAt: string;
  lastReadAt: string;
  conversationId: string;
  userId: string;
  user: User;
}

export interface DirectMessageAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
  messageId: string;
}

export interface DirectMessageReaction {
  id: string;
  emoji: string;
  createdAt: string;
  messageId: string;
  userId: string;
  user: User;
}

export interface DirectMessage {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  conversationId: string;
  authorId: string;
  author: User;
  replyToId?: string;
  replyTo?: DirectMessage;
  attachments?: DirectMessageAttachment[];
  reactions?: DirectMessageReaction[];
}

export interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  participants: ConversationParticipant[];
  messages?: DirectMessage[];
  unreadCount?: number;
}

export interface DirectMessagesResponse {
  messages: DirectMessage[];
  nextCursor?: string;
}

// Pagination
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface GlobalSearchResult {
  groups: Group[];
  projects: (Project & { group?: Group })[];
  tasks: (Task & { project?: Project & { group?: Group } })[];
  users: User[];
}

// DTOs
export interface CreateGroupDto {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateGroupDto {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  groupId: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  dueDate?: string;
  projectId: string;
  assigneeIds?: string[];
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  dueDate?: string;
  assigneeIds?: string[];
}

export interface CreateMessageDto {
  content: string;
  groupId: string;
}

export interface AddMemberDto {
  userId: string;
  role?: GroupRole;
}

// Notifications
export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_COMMENT'
  | 'MESSAGE_MENTION'
  | 'GROUP_INVITE'
  | 'GROUP_ROLE_CHANGED'
  | 'TASK_STATUS_CHANGED';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, any>;
  createdAt: string;
  userId: string;
}

// Task Comments
export interface TaskComment {
  id: string;
  content: string;
  mentions: string[];
  createdAt: string;
  updatedAt: string;
  taskId: string;
  authorId: string;
  author: User;
}

export interface CreateTaskCommentDto {
  content: string;
  taskId: string;
  mentions?: string[];
}

// Dashboard
export interface DashboardStats {
  stats: {
    groups: number;
    projects: number;
    tasksTotal: number;
    tasksTodo: number;
    tasksInProgress: number;
    tasksDone: number;
  };
  myTasks: Task[];
  recentActivity: Task[];
}
