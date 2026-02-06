'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useUpdateUser } from '@/hooks/use-users';
import { useTheme } from 'next-themes';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tip } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Save, Shield, Bell, Palette, Trash2, Sun, Moon, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { user, fetchUser, logout } = useAuthStore();
  const updateUser = useUpdateUser();
  const [name, setName] = useState(user?.name || '');
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    try {
      await updateUser.mutateAsync({ name: name.trim() });
      await fetchUser();
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const themeOptions = [
    { value: 'light', icon: Sun, label: t('settings.lightMode') || 'Light' },
    { value: 'dark', icon: Moon, label: t('settings.darkMode') },
    { value: 'system', icon: Monitor, label: 'System' },
  ];

  return (
    <div className="flex flex-col h-full">
      <Header title={t('settings.title')} />

      <div className="flex-1 overflow-auto p-4 md:p-6 page-enter">
        <div className="max-w-2xl mx-auto space-y-6 stagger-children">
          {/* Account Settings */}
          <Card className="glass-card overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary/50 to-purple-500/50" />
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{t('settings.account')}</CardTitle>
                  <CardDescription>{t('settings.accountDesc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('settings.displayName')}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('settings.yourDisplayName')}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('settings.email')}</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted/50 rounded-xl"
                />
                <p className="text-xs text-muted-foreground">
                  {t('settings.emailManaged')}
                </p>
              </div>
              <Button onClick={handleSaveProfile} disabled={updateUser.isPending} className="gap-2 rounded-xl">
                <Save className="h-4 w-4" />
                {t('settings.saveChanges')}
              </Button>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card className="glass-card overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-blue-500/50 to-cyan-500/50" />
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/10">
                  <Bell className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle>{t('settings.notifications')}</CardTitle>
                  <CardDescription>{t('settings.notificationsDesc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors duration-200">
                <div>
                  <p className="text-sm font-medium">{t('settings.emailNotifications')}</p>
                  <p className="text-xs text-muted-foreground">{t('settings.emailNotificationsDesc')}</p>
                </div>
                <Switch />
              </div>
              <Separator className="opacity-50" />
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors duration-200">
                <div>
                  <p className="text-sm font-medium">{t('settings.taskReminders')}</p>
                  <p className="text-xs text-muted-foreground">{t('settings.taskRemindersDesc')}</p>
                </div>
                <Switch />
              </div>
              <Separator className="opacity-50" />
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors duration-200">
                <div>
                  <p className="text-sm font-medium">{t('settings.newMessageAlerts')}</p>
                  <p className="text-xs text-muted-foreground">{t('settings.newMessageAlertsDesc')}</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card className="glass-card overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-violet-500/50 to-pink-500/50" />
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-violet-500/10">
                  <Palette className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <CardTitle>{t('settings.appearance')}</CardTitle>
                  <CardDescription>{t('settings.appearanceDesc')}</CardDescription>
                </div>
                <Tip content="Choose your preferred theme for the interface" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      'flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300',
                      theme === option.value
                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                        : 'border-border/50 hover:border-border hover:bg-muted/30'
                    )}
                  >
                    <div className={cn(
                      'p-3 rounded-xl transition-all duration-300',
                      theme === option.value ? 'bg-primary/20' : 'bg-muted'
                    )}>
                      <option.icon className={cn(
                        'h-6 w-6 transition-colors duration-300',
                        theme === option.value ? 'text-primary' : 'text-muted-foreground'
                      )} />
                    </div>
                    <span className={cn(
                      'text-sm font-medium transition-colors duration-300',
                      theme === option.value ? 'text-primary' : 'text-muted-foreground'
                    )}>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="glass-card overflow-hidden border-destructive/30">
            <div className="h-1 bg-gradient-to-r from-red-500/50 to-orange-500/50" />
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-destructive/10">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-destructive">{t('settings.dangerZone')}</CardTitle>
                  <CardDescription>{t('settings.dangerZoneDesc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 rounded-xl">
                <div>
                  <p className="text-sm font-medium">{t('settings.logoutAllSessions')}</p>
                  <p className="text-xs text-muted-foreground">{t('settings.logoutAllSessionsDesc')}</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="rounded-xl">
                      {t('auth.logout')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="glass-card">
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('auth.logoutConfirm')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('auth.logoutDesc')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => logout()}
                        className="bg-destructive hover:bg-destructive/90 rounded-xl"
                      >
                        {t('auth.logout')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
