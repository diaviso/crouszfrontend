'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useUpdateUser, useProfileCompleteness, useUploadAvatar } from '@/hooks/use-users';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Briefcase,
  GraduationCap,
  Wrench,
  FileText,
  Phone,
  Linkedin,
  X,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Camera,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import { Progress } from '@/components/ui/progress';

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, fetchUser } = useAuthStore();
  const updateUser = useUpdateUser();
  const uploadAvatar = useUploadAvatar();
  const { data: completeness, refetch: refetchCompleteness } = useProfileCompleteness();
  const { t } = useTranslation();

  const [jobTitle, setJobTitle] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setJobTitle(user.jobTitle || '');
      setSpecialty(user.specialty || '');
      setSkills(user.skills || []);
      setBio(user.bio || '');
      setPhone(user.phone || '');
      setLinkedin(user.linkedin || '');
    }
  }, [user]);

  // Redirect if profile is already >= 30%
  useEffect(() => {
    if (completeness && completeness.percentage >= 30) {
      router.push('/dashboard');
    }
  }, [completeness, router]);

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

  // Local completeness calculation for live preview
  const localPercentage = (() => {
    let total = 0;
    if (user?.name) total += 15;
    if (user?.avatar) total += 5;
    if (jobTitle.trim()) total += 25;
    if (specialty.trim()) total += 25;
    if (skills.length > 0) total += 20;
    if (bio.trim()) total += 5;
    if (phone.trim()) total += 2.5;
    if (linkedin.trim()) total += 2.5;
    return Math.round(total);
  })();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUser.mutateAsync({
        jobTitle: jobTitle.trim() || undefined,
        specialty: specialty.trim() || undefined,
        skills: skills.length > 0 ? skills : undefined,
        bio: bio.trim() || undefined,
        phone: phone.trim() || undefined,
        linkedin: linkedin.trim() || undefined,
      });
      await fetchUser();
      await refetchCompleteness();
      toast.success(t('completeProfile.saved') || 'Profil mis à jour !');

      if (localPercentage >= 30) {
        router.push('/dashboard');
      }
    } catch {
      toast.error(t('completeProfile.error') || 'Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  const canContinue = localPercentage >= 30;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6 animate-reveal">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="relative group mx-auto w-20 h-20">
            <Avatar className="h-20 w-20 ring-4 ring-primary/20 shadow-xl">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-purple-500 text-white text-2xl font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => document.getElementById('avatar-upload-cp')?.click()}
            >
              <Camera className="h-6 w-6 text-white" />
            </button>
            <input
              id="avatar-upload-cp"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) {
                  toast.error(t('profile.avatarTooLarge') || 'L\'image ne doit pas d\u00e9passer 5 Mo');
                  return;
                }
                try {
                  await uploadAvatar.mutateAsync(file);
                  await fetchUser();
                  await refetchCompleteness();
                  toast.success(t('profile.avatarUpdated') || 'Photo de profil mise \u00e0 jour');
                } catch {
                  toast.error(t('profile.avatarError') || 'Erreur lors de la mise \u00e0 jour de la photo');
                }
                e.target.value = '';
              }}
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gradient">
              {t('completeProfile.title') || 'Complétez votre profil professionnel'}
            </h1>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              {t('completeProfile.subtitle') || 'Pour commencer à utiliser Crousz, veuillez renseigner votre profil professionnel (minimum 30%).'}
            </p>
          </div>
        </div>

        {/* Progress */}
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {t('completeProfile.completion') || 'Complétion du profil'}
              </span>
              <span className={`text-sm font-bold ${canContinue ? 'text-green-500' : 'text-orange-500'}`}>
                {localPercentage}%
              </span>
            </div>
            <Progress value={localPercentage} className="h-3" />
            <div className="flex items-center gap-2 mt-3">
              {canContinue ? (
                <div className="flex items-center gap-2 text-green-500 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('completeProfile.ready') || 'Votre profil est suffisamment complet !'}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-orange-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {t('completeProfile.minimum') || 'Minimum 30% requis pour continuer'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              {t('completeProfile.professionalInfo') || 'Informations professionnelles'}
            </CardTitle>
            <CardDescription>
              {t('completeProfile.professionalInfoDesc') || 'Ces informations aident vos collègues à mieux vous connaître.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Job Title */}
            <div className="space-y-2">
              <Label htmlFor="jobTitle" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                {t('completeProfile.jobTitle') || 'Poste / Fonction'} *
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
                {t('completeProfile.specialty') || 'Spécialité / Domaine'} *
              </Label>
              <Input
                id="specialty"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder={t('completeProfile.specialtyPlaceholder') || 'Ex: Intelligence Artificielle, Design UX, Marketing Digital...'}
                className="rounded-xl"
              />
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                {t('completeProfile.skills') || 'Compétences'} *
              </Label>
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  placeholder={t('completeProfile.skillsPlaceholder') || 'Tapez une compétence et appuyez sur Entrée...'}
                  className="rounded-xl flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-xl shrink-0"
                  onClick={addSkill}
                  disabled={!skillInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="rounded-lg gap-1 py-1 px-3 cursor-pointer hover:bg-destructive/20 transition-colors"
                      onClick={() => removeSkill(skill)}
                    >
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
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+221 77 000 00 00"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin" className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4 text-muted-foreground" />
                  {t('completeProfile.linkedin') || 'LinkedIn'}
                </Label>
                <Input
                  id="linkedin"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="rounded-xl"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!canContinue || isSaving}
            className="gap-2 rounded-xl px-8 py-3 text-base bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg"
            size="lg"
          >
            {isSaving
              ? (t('common.loading') || 'Chargement...')
              : (t('completeProfile.continue') || 'Continuer vers Crousz')}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
