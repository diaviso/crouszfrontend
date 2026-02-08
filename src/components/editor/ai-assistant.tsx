'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useGenerateDocument, useRewriteText, useContinueWriting } from '@/hooks/use-editor-ai';
import {
  Sparkles,
  FileText,
  RefreshCw,
  ArrowRight,
  Loader2,
  Wand2,
  Languages,
  Minimize2,
  BookOpen,
  ListChecks,
  PenLine,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

interface AiAssistantProps {
  editor: any;
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_ACTIONS = [
  { id: 'report', label: 'Rapport d\'activité', icon: FileText, prompt: 'Génère un rapport d\'activité professionnel et détaillé. Inclus un résumé exécutif, les activités réalisées, les résultats obtenus, les difficultés rencontrées et les recommandations.' },
  { id: 'note', label: 'Note de service', icon: BookOpen, prompt: 'Génère une note de service professionnelle avec objet, destinataires, contexte, dispositions et signature.' },
  { id: 'pv', label: 'Procès-verbal', icon: ListChecks, prompt: 'Génère un procès-verbal de réunion avec date, participants, ordre du jour, discussions, décisions prises et actions à mener.' },
  { id: 'plan', label: 'Plan d\'action', icon: PenLine, prompt: 'Génère un plan d\'action structuré avec objectifs, activités, responsables, échéances et indicateurs de suivi sous forme de tableau.' },
];

const REWRITE_ACTIONS = [
  { id: 'improve', label: 'Améliorer le style', instruction: 'Améliore le style rédactionnel, rends le texte plus professionnel et fluide.' },
  { id: 'simplify', label: 'Simplifier', instruction: 'Simplifie le texte pour le rendre plus clair et accessible, sans perdre les informations essentielles.' },
  { id: 'formal', label: 'Rendre plus formel', instruction: 'Rends le texte plus formel et institutionnel, adapté à un contexte administratif universitaire.' },
  { id: 'expand', label: 'Développer', instruction: 'Développe et enrichis le texte avec plus de détails, d\'exemples et d\'explications.' },
  { id: 'summarize', label: 'Résumer', instruction: 'Résume le texte en conservant les points essentiels. Sois concis mais complet.' },
  { id: 'translate_en', label: 'Traduire en anglais', instruction: 'Traduis le texte en anglais professionnel tout en conservant la mise en forme.' },
];

export function AiAssistant({ editor, isOpen, onClose }: AiAssistantProps) {
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'generate' | 'rewrite' | 'continue'>('generate');
  const { t } = useTranslation();

  const generateDoc = useGenerateDocument();
  const rewriteText = useRewriteText();
  const continueWriting = useContinueWriting();

  const isLoading = generateDoc.isPending || rewriteText.isPending || continueWriting.isPending;

  const handleGenerate = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim()) return;

    try {
      const html = await generateDoc.mutateAsync({ prompt: finalPrompt });
      if (editor) {
        editor.chain().focus().insertContent(html).run();
      }
      if (!customPrompt) setPrompt('');
      toast.success('Document généré avec succès');
    } catch {
      toast.error('Erreur lors de la génération');
    }
  };

  const handleRewrite = async (instruction: string) => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, '\n');

    if (!selectedText.trim()) {
      toast.error('Sélectionnez du texte à modifier');
      return;
    }

    // Get HTML of selection
    const selectedHtml = editor.getHTML();

    try {
      const html = await rewriteText.mutateAsync({
        text: selectedText,
        instruction,
      });
      // Replace selection with new content
      editor.chain().focus().deleteSelection().insertContent(html).run();
      toast.success('Texte modifié avec succès');
    } catch {
      toast.error('Erreur lors de la modification');
    }
  };

  const handleContinue = async () => {
    if (!editor) return;

    const currentContent = editor.getHTML();
    if (!currentContent || currentContent === '<p></p>') {
      toast.error('Le document est vide. Écrivez d\'abord du contenu ou utilisez la génération.');
      return;
    }

    try {
      const html = await continueWriting.mutateAsync({
        content: currentContent,
        instruction: prompt.trim() || undefined,
      });
      editor.chain().focus().insertContent(html).run();
      setPrompt('');
      toast.success('Texte ajouté avec succès');
    } catch {
      toast.error('Erreur lors de la continuation');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 border-l border-border/50 bg-background/95 backdrop-blur-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Assistant IA</h3>
            <p className="text-[10px] text-muted-foreground">CrouszAI Editor</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/50">
        {[
          { key: 'generate' as const, label: 'Générer', icon: Wand2 },
          { key: 'rewrite' as const, label: 'Modifier', icon: RefreshCw },
          { key: 'continue' as const, label: 'Continuer', icon: ArrowRight },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
              activeTab === tab.key
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Generate tab */}
          {activeTab === 'generate' && (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Actions rapides
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleGenerate(action.prompt)}
                      disabled={isLoading}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/50 hover:bg-muted/50 hover:border-primary/30 transition-all text-center group"
                    >
                      <action.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-[11px] font-medium leading-tight">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Prompt personnalisé
                </label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Décrivez le document que vous souhaitez générer..."
                  className="min-h-[100px] rounded-xl text-sm resize-none"
                  disabled={isLoading}
                />
                <Button
                  onClick={() => handleGenerate()}
                  disabled={!prompt.trim() || isLoading}
                  className="w-full mt-2 gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {isLoading ? 'Génération en cours...' : 'Générer'}
                </Button>
              </div>
            </>
          )}

          {/* Rewrite tab */}
          {activeTab === 'rewrite' && (
            <>
              <p className="text-xs text-muted-foreground">
                Sélectionnez du texte dans l'éditeur, puis choisissez une action ci-dessous.
              </p>
              <div className="space-y-2">
                {REWRITE_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleRewrite(action.instruction)}
                    disabled={isLoading}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:bg-muted/50 hover:border-primary/30 transition-all text-left group"
                  >
                    <RefreshCw className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    <span className="text-sm font-medium">{action.label}</span>
                  </button>
                ))}
              </div>

              <Separator />

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Instruction personnalisée
                </label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex: Reformule en utilisant un ton plus diplomatique..."
                  className="min-h-[80px] rounded-xl text-sm resize-none"
                  disabled={isLoading}
                />
                <Button
                  onClick={() => handleRewrite(prompt)}
                  disabled={!prompt.trim() || isLoading}
                  className="w-full mt-2 gap-2 rounded-xl"
                  variant="outline"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Appliquer
                </Button>
              </div>
            </>
          )}

          {/* Continue tab */}
          {activeTab === 'continue' && (
            <>
              <p className="text-xs text-muted-foreground">
                L'IA va continuer la rédaction à partir du contenu existant dans l'éditeur.
              </p>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Instructions (optionnel)
                </label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex: Continue avec la section sur les recommandations..."
                  className="min-h-[80px] rounded-xl text-sm resize-none"
                  disabled={isLoading}
                />
              </div>

              <Button
                onClick={handleContinue}
                disabled={isLoading}
                className="w-full gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                {isLoading ? 'Rédaction en cours...' : 'Continuer la rédaction'}
              </Button>
            </>
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                L'IA rédige votre contenu...
                <br />
                Cela peut prendre quelques secondes.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
