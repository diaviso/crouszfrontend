'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useMyGroups } from '@/hooks/use-groups';
import { useUpdateUser, useProfileCompleteness, useUploadAvatar } from '@/hooks/use-users';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Users, FolderKanban, Calendar, Mail, Edit, Save, X,
  Briefcase, GraduationCap, Wrench, FileText, Phone, Linkedin, Plus, Camera,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

export default function ProfilePage() {
  const { user, fetchUser } = useAuthStore();
  const { data: myGroupsResult } = useMyGroups();
  const updateUser = useUpdateUser();
  const uploadAvatar = useUploadAvatar();
  const { data: completeness } = useProfileCompleteness();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const { t, locale } = useTranslation();

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setJobTitle(user.jobTitle || '');
      setSpecialty(user.specialty || '');
      setSkills(user.skills || []);
      setBio(user.bio || '');
      setPhone(user.phone || '');
      setLinkedin(user.linkedin || '');
    }
  }, [user]);

  const groups = myGroupsResult?.data;
  const totalProjects = groups?.reduce((acc, g) => acc + (g._count?.projects || 0), 0) || 0;

  const cancelEdit = () => {
    setIsEditing(false);
    if (user) {
      setName(user.name || '');
      setJobTitle(user.jobTitle || '');
      setSpecialty(user.specialty || '');
      setSkills(user.skills || []);
      setBio(user.bio || '');
      setPhone(user.phone || '');
      setLinkedin(user.linkedin || '');
    }
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(t('profile.nameRequired') || 'Le nom ne peut pas être vide');
      return;
    }
    try {
      await updateUser.mutateAsync({
        name: name.trim(),
        jobTitle: jobTitle.trim() || undefined,
        specialty: specialty.trim() || undefined,
        skills: skills.length > 0 ? skills : undefined,
        bio: bio.trim() || undefined,
        phone: phone.trim() || undefined,
        linkedin: linkedin.trim() || undefined,
      });
      await fetchUser();
      toast.success(t('profile.updated') || 'Profil mis à jour');
      setIsEditing(false);
    } catch {
      toast.error(t('profile.updateError') || 'Erreur lors de la mise à jour');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title={t('profile.title')} />

      <div className="flex-1 overflow-auto p-4 md:p-6 page-enter">
        <div className="max-w-2xl mx-auto space-y-6 stagger-children">
          {/* Profile Card */}
          <Card className="glass-card overflow-hidden">
            {/* Banner gradient */}
            <div className="h-24 bg-gradient-to-r from-primary via-purple-500 to-primary animate-gradient" />
            <CardHeader className="-mt-12">
              <div className="flex items-end justify-between">
                <div className="relative group">
                  <Avatar className="h-20 w-20 ring-4 ring-card shadow-xl">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-purple-500 text-white text-2xl font-bold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    <Camera className="h-6 w-6 text-white" />
                  </button>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error(t('profile.avatarTooLarge') || 'L\'image ne doit pas dépasser 5 Mo');
                        return;
                      }
                      try {
                        await uploadAvatar.mutateAsync(file);
                        await fetchUser();
                        toast.success(t('profile.avatarUpdated') || 'Photo de profil mise à jour');
                      } catch {
                        toast.error(t('profile.avatarError') || 'Erreur lors de la mise à jour de la photo');
                      }
                      e.target.value = '';
                    }}
                  />
                </div>
                {!isEditing ? (
                  <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4" />
                    {t('common.edit')}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={cancelEdit}>
                      <X className="h-4 w-4" />
                    </Button>
                    <Button size="sm" className="gap-2 rounded-xl" onClick={handleSave} disabled={updateUser.isPending}>
                      <Save className="h-4 w-4" />
                      {t('common.save')}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isEditing ? (
                <div className="space-y-2">
                  <Label htmlFor="name">{t('profile.displayName')}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('profile.yourName')}
                    className="rounded-xl"
                  />
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-bold">{user?.name}</h2>
                  {user?.jobTitle && (
                    <p className="text-sm text-primary font-medium mt-1">{user.jobTitle}</p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Mail className="h-4 w-4" />
                    {user?.email}
                  </div>
                </div>
              )}

              <Separator className="opacity-50" />

              {/* Profile completeness */}
              {completeness && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('profile.completion') || 'Complétion du profil'}</span>
                    <span className="font-bold">{completeness.percentage}%</span>
                  </div>
                  <Progress value={completeness.percentage} className="h-2" />
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {t('profile.joined', { date: user?.createdAt ? format(new Date(user.createdAt), 'MMMM d, yyyy', { locale: locale === 'fr' ? frLocale : undefined }) : '—' })}
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1 rounded-lg">
                  <span className="font-mono text-xs">Google</span>
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Professional Profile Card */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                {t('profile.professionalProfile') || 'Profil professionnel'}
              </CardTitle>
              <CardDescription>
                {t('profile.professionalProfileDesc') || 'Vos informations professionnelles visibles par les membres de vos groupes.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {isEditing ? (
                <>
                  {/* Job Title */}
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle" className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      {t('completeProfile.jobTitle') || 'Poste / Fonction'}
                    </Label>
                    <Input
                      id="jobTitle"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder={t('completeProfile.jobTitlePlaceholder') || 'Ex: Développeur Full-Stack, Chef de projet...'}
                      className="rounded-xl"
                    />
                  </div>

                  {/* Specialty */}
                  <div className="space-y-2">
                    <Label htmlFor="specialty" className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      {t('completeProfile.specialty') || 'Spécialité / Domaine'}
                    </Label>
                    <Input
                      id="specialty"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder={t('completeProfile.specialtyPlaceholder') || 'Ex: Intelligence Artificielle, Design UX...'}
                      className="rounded-xl"
                    />
                  </div>

                  {/* Skills */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                      {t('completeProfile.skills') || 'Compétences'}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={handleSkillKeyDown}
                        placeholder={t('completeProfile.skillsPlaceholder') || 'Tapez une compétence et appuyez sur Entrée...'}
                        className="rounded-xl flex-1"
                      />
                      <Button type="button" variant="outline" size="icon" className="rounded-xl shrink-0" onClick={addSkill} disabled={!skillInput.trim()}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="rounded-lg gap-1 py-1 px-3 cursor-pointer hover:bg-destructive/20 transition-colors" onClick={() => removeSkill(skill)}>
                            {skill}
                            <X className="h-3 w-3" />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {t('completeProfile.bio') || 'Bio / Présentation'}
                    </Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder={t('completeProfile.bioPlaceholder') || 'Décrivez-vous en quelques lignes...'}
                      className="rounded-xl min-h-[80px]"
                    />
                  </div>

                  {/* Phone & LinkedIn */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {t('completeProfile.phone') || 'Téléphone'}
                      </Label>
                      <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+221 77 000 00 00" className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin" className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4 text-muted-foreground" />
                        {t('completeProfile.linkedin') || 'LinkedIn'}
                      </Label>
                      <Input id="linkedin" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." className="rounded-xl" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {/* Display mode */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
                        <Briefcase className="h-3 w-3" />
                        {t('completeProfile.jobTitle') || 'Poste'}
                      </div>
                      <p className="text-sm font-medium">{user?.jobTitle || <span className="text-muted-foreground italic">{t('profile.notSpecified') || 'Non renseigné'}</span>}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
                        <GraduationCap className="h-3 w-3" />
                        {t('completeProfile.specialty') || 'Spécialité'}
                      </div>
                      <p className="text-sm font-medium">{user?.specialty || <span className="text-muted-foreground italic">{t('profile.notSpecified') || 'Non renseigné'}</span>}</p>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
                      <Wrench className="h-3 w-3" />
                      {t('completeProfile.skills') || 'Compétences'}
                    </div>
                    {user?.skills && user.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {user.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="rounded-lg py-1 px-3">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">{t('profile.notSpecified') || 'Non renseigné'}</p>
                    )}
                  </div>

                  {/* Bio */}
                  {user?.bio && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
                        <FileText className="h-3 w-3" />
                        {t('completeProfile.bio') || 'Bio'}
                      </div>
                      <p className="text-sm">{user.bio}</p>
                    </div>
                  )}

                  {/* Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {user?.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {user.phone}
                      </div>
                    )}
                    {user?.linkedin && (
                      <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="glass-card card-3d overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="flex items-center gap-4 p-6 relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{groups?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">{t('groups.title')}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card card-3d overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="flex items-center gap-4 p-6 relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                  <FolderKanban className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalProjects}</p>
                  <p className="text-sm text-muted-foreground">{t('projects.title')}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Groups */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>{t('groups.myGroups')}</CardTitle>
              <CardDescription>{t('profile.groupsBelongTo')}</CardDescription>
            </CardHeader>
            <CardContent>
              {groups && groups.length > 0 ? (
                <div className="space-y-2">
                  {groups.slice(0, 5).map((group) => (
                    <div key={group.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors duration-200">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{group.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {group._count?.members || 0} {t('groups.members')} &middot; {group._count?.projects || 0} {t('groups.projects')}
                          </p>
                        </div>
                      </div>
                      <Badge variant={group.isPublic ? 'default' : 'secondary'} className="rounded-lg">
                        {group.isPublic ? t('groups.public') : t('groups.private')}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">{t('groups.noGroups')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
