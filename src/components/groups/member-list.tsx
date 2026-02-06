'use client';

import { useState } from 'react';
import { GroupMember, User, GroupRole } from '@/types';
import { useAuthStore } from '@/store/auth';
import { useRemoveMember, useUpdateMemberRole } from '@/hooks/use-groups';
import { useSearchUsers } from '@/hooks/use-users';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { MoreVertical, Shield, UserMinus, UserPlus, Search, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from '@/lib/i18n';

interface MemberListProps {
  groupId: string;
  adminId: string;
  members: GroupMember[];
  isAdmin: boolean;
  onAddMember: (userId: string) => void;
}

export function MemberList({ groupId, adminId, members, isAdmin, onAddMember }: MemberListProps) {
  const { user: currentUser } = useAuthStore();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  const removeMember = useRemoveMember();
  const updateRole = useUpdateMemberRole();
  const { data: searchResults, isLoading: isSearching } = useSearchUsers(searchQuery);

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      await removeMember.mutateAsync({ groupId, userId: memberToRemove.userId });
      toast.success('Member removed successfully');
      setMemberToRemove(null);
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const handleUpdateRole = async (userId: string, role: GroupRole) => {
    try {
      await updateRole.mutateAsync({ groupId, userId, role });
      toast.success('Role updated successfully');
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleAddMember = (user: User) => {
    onAddMember(user.id);
    setIsAddDialogOpen(false);
    setSearchQuery('');
  };

  const existingMemberIds = new Set(members.map((m) => m.userId));
  const filteredSearchResults = searchResults?.filter(
    (user) => !existingMemberIds.has(user.id) && user.id !== adminId
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('groups.members')} ({members.length})</h3>
        {isAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 shadow-lg shadow-primary/20">
                <UserPlus className="h-4 w-4" />
                {t('groups.addMember')}
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <DialogHeader>
                <DialogTitle>{t('groups.addMember')}</DialogTitle>
                <DialogDescription>{t('groups.searchUsersDesc')}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t('groups.searchByEmail')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 rounded-xl"
                  />
                </div>
                <ScrollArea className="h-64">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : filteredSearchResults && filteredSearchResults.length > 0 ? (
                    <div className="space-y-2">
                      {filteredSearchResults.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between rounded-xl border border-border/50 p-3 hover:bg-muted/30 transition-colors duration-200"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback className="bg-primary/10 text-primary">{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <Button size="sm" className="rounded-xl" onClick={() => handleAddMember(user)}>
                            {t('groups.add')}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : searchQuery.length >= 2 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">{t('groups.noUsersFound')}</p>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      {t('groups.typeToSearch')}
                    </p>
                  )}
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search existing members */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('groups.searchMembers')}
          value={memberSearch}
          onChange={(e) => setMemberSearch(e.target.value)}
          className="pl-9 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        {members
          .filter((m) => {
            if (!memberSearch) return true;
            const q = memberSearch.toLowerCase();
            return (
              m.user.name.toLowerCase().includes(q) ||
              m.user.email.toLowerCase().includes(q)
            );
          })
          .map((member) => {
          const isGroupCreator = member.userId === adminId;
          const isCurrentUser = member.userId === currentUser?.id;

          return (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-xl border border-border/50 p-3 hover:bg-muted/30 transition-colors duration-200"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.user.avatar} alt={member.user.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {member.user.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{member.user.name}</p>
                    {isGroupCreator && (
                      <Crown className="h-4 w-4 text-amber-500" />
                    )}
                    {isCurrentUser && (
                      <Badge variant="outline" className="text-xs rounded-lg">{t('groups.you')}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{member.user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={member.role === 'ADMIN' ? 'default' : 'secondary'} className="rounded-lg">
                  {member.role === 'ADMIN' ? (
                    <><Shield className="mr-1 h-3 w-3" /> {t('groups.admin')}</>
                  ) : (
                    t('groups.member')
                  )}
                </Badge>

                {isAdmin && !isGroupCreator && !isCurrentUser && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-card rounded-xl">
                      <DropdownMenuItem
                        className="gap-2 rounded-lg"
                        onClick={() =>
                          handleUpdateRole(
                            member.userId,
                            member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN'
                          )
                        }
                      >
                        <Shield className="h-4 w-4" />
                        {member.role === 'ADMIN' ? t('groups.removeAdmin') : t('groups.makeAdmin')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive gap-2 rounded-lg"
                        onClick={() => setMemberToRemove(member)}
                      >
                        <UserMinus className="h-4 w-4" />
                        {t('groups.remove')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('groups.removeMember')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('groups.removeConfirm', { name: memberToRemove?.user.name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive hover:bg-destructive/90 rounded-xl"
            >
              {t('groups.remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
