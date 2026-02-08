'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGenerateProject } from '@/hooks/use-ai';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  FolderKanban,
  ListTodo,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

interface GenerateProjectDialogProps {
  groupId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenerateProjectDialog({
  groupId,
  open,
  onOpenChange,
}: GenerateProjectDialogProps) {
  const router = useRouter();
  const generateProject = useGenerateProject();
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<{ projectId: string; projectName: string; tasksCount: number } | null>(null);
  const { t } = useTranslation();

  const handleGenerate = async () => {
    if (!prompt.trim() || prompt.trim().length < 10) {
      toast.error(t('ai.promptTooShort') || 'Veuillez décrire votre projet plus en détail (min. 10 caractères).');
      return;
    }

    try {
      const data = await generateProject.mutateAsync({ prompt: prompt.trim(), groupId });
      setResult({
        projectId: data.project.id,
        projectName: data.project.name,
        tasksCount: data.tasksCount,
      });
      toast.success(t('ai.projectGenerated') || 'Projet généré avec succès !');
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Erreur lors de la génération';
      toast.error(msg);
    }
  };

  const handleClose = () => {
    setPrompt('');
    setResult(null);
    onOpenChange(false);
  };

  const handleGoToProject = () => {
    if (result) {
      router.push(`/groups/${groupId}/projects/${result.projectId}`);
      handleClose();
    }
  };

  const examples = [
    t('ai.example1') || 'Application mobile de livraison de repas avec suivi en temps réel',
    t('ai.example2') || 'Site e-commerce pour une boutique de vêtements avec paiement en ligne',
    t('ai.example3') || 'Plateforme de gestion de cours en ligne pour une université',
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass-card sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
              <Sparkles className="h-4 w-4 text-violet-500" />
            </div>
            {t('ai.generateProject') || 'Générer un projet avec l\'IA'}
          </DialogTitle>
          <DialogDescription>
            {t('ai.generateProjectDesc') || 'Décrivez votre idée de projet et l\'IA générera automatiquement le projet avec toutes ses tâches.'}
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-5 mt-2">
            {/* Prompt input */}
            <div className="space-y-2">
              <Label htmlFor="ai-prompt" className="text-sm font-medium">
                {t('ai.describeProject') || 'Décrivez votre projet'}
              </Label>
              <Textarea
                id="ai-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t('ai.promptPlaceholder') || 'Ex: Je veux créer une application de gestion de tâches pour une équipe de développeurs. Elle doit permettre de créer des projets, assigner des tâches, suivre l\'avancement...'}
                className="rounded-xl min-h-[120px] resize-none"
                disabled={generateProject.isPending}
              />
              <p className="text-xs text-muted-foreground">
                {t('ai.promptHint') || 'Plus votre description est détaillée, meilleur sera le résultat.'}
              </p>
            </div>

            {/* Examples */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lightbulb className="h-3 w-3" />
                {t('ai.examples') || 'Exemples d\'idées'}
              </div>
              <div className="flex flex-wrap gap-2">
                {examples.map((example, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="rounded-lg cursor-pointer hover:bg-muted/50 transition-colors text-xs py-1.5 px-3 max-w-full"
                    onClick={() => !generateProject.isPending && setPrompt(example)}
                  >
                    <span className="truncate">{example}</span>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              disabled={generateProject.isPending || prompt.trim().length < 10}
              className="w-full gap-2 rounded-xl py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-500/90 hover:to-fuchsia-500/90 shadow-lg text-white"
              size="lg"
            >
              {generateProject.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t('ai.generating') || 'Génération en cours... (peut prendre 15-30s)'}
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  {t('ai.generate') || 'Générer le projet'}
                </>
              )}
            </Button>
          </div>
        ) : (
          /* Success state */
          <div className="space-y-5 mt-2">
            <Card className="border-green-500/20 bg-green-500/5">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{t('ai.projectCreated') || 'Projet créé avec succès !'}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('ai.projectCreatedDesc') || 'L\'IA a généré votre projet avec toutes ses tâches.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 pt-2">
                    <div className="flex items-center gap-2">
                      <FolderKanban className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <p className="text-xs text-muted-foreground">{t('ai.project') || 'Projet'}</p>
                        <p className="text-sm font-semibold">{result.projectName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ListTodo className="h-5 w-5 text-violet-500" />
                      <div className="text-left">
                        <p className="text-xs text-muted-foreground">{t('ai.tasks') || 'Tâches'}</p>
                        <p className="text-sm font-semibold">{result.tasksCount} {t('ai.tasksCreated') || 'tâches créées'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 rounded-xl"
              >
                {t('common.close') || 'Fermer'}
              </Button>
              <Button
                onClick={handleGoToProject}
                className="flex-1 gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-500/90 hover:to-fuchsia-500/90 text-white"
              >
                {t('ai.viewProject') || 'Voir le projet'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
