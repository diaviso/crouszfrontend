'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { RichEditor } from '@/components/editor/rich-editor';
import { AiAssistant } from '@/components/editor/ai-assistant';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Sparkles,
  Download,
  FileDown,
  FileText,
  Save,
  PanelRightOpen,
  PanelRightClose,
  Plus,
  ArrowLeft,
  Trash2,
  Share2,
  Users,
  Search,
  Clock,
  Loader2,
  Settings,
  X,
  UserPlus,
  Eye,
  Pencil,
  FileEdit,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import { useAuthStore } from '@/store/auth';
import {
  useDocuments,
  useDocument,
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument,
  useShareDocument,
  useUnshareDocument,
  useDocumentHeader,
  useUpdateDocumentHeader,
  type Document,
} from '@/hooks/use-documents';
import { useSearchUsers } from '@/hooks/use-users';
import { cn } from '@/lib/utils';

export default function EditorPage() {
  const [editor, setEditor] = useState<any>(null);
  const [showAi, setShowAi] = useState(false);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showHeaderDialog, setShowHeaderDialog] = useState(false);
  const [shareSearch, setShareSearch] = useState('');
  const [headerHtml, setHeaderHtml] = useState('');
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const { data: documents, isLoading: docsLoading } = useDocuments();
  const { data: activeDoc, refetch: refetchActiveDoc } = useDocument(activeDocId);
  const createDoc = useCreateDocument();
  const updateDoc = useUpdateDocument();
  const deleteDoc = useDeleteDocument();
  const shareDoc = useShareDocument();
  const unshareDoc = useUnshareDocument();
  const { data: savedHeader } = useDocumentHeader();
  const updateHeader = useUpdateDocumentHeader();

  // Load document content into editor when opening or when data refreshes
  useEffect(() => {
    if (activeDoc && editor) {
      const currentContent = editor.getHTML();
      if (currentContent !== activeDoc.content) {
        editor.commands.setContent(activeDoc.content || '');
      }
      setDocTitle(activeDoc.title);
    }
  }, [activeDoc, editor]);

  // Load header setting
  useEffect(() => {
    if (savedHeader !== undefined && savedHeader !== null) {
      setHeaderHtml(savedHeader);
    }
  }, [savedHeader]);

  const handleCreateNew = async () => {
    try {
      const doc = await createDoc.mutateAsync({ title: 'Document sans titre', content: '' });
      setActiveDocId(doc.id);
      setDocTitle(doc.title);
      if (editor) editor.commands.setContent('');
      toast.success('Nouveau document créé');
    } catch {
      toast.error('Erreur lors de la création');
    }
  };

  const handleOpenDoc = async (doc: Document) => {
    // If reopening the same doc, force a refetch cycle
    if (activeDocId === doc.id) {
      await refetchActiveDoc();
    } else {
      setActiveDocId(doc.id);
    }
    setDocTitle(doc.title);
    setShowAi(false);
    // Immediately set content from list data, useEffect will update if server data differs
    if (editor && doc.content) {
      editor.commands.setContent(doc.content);
    }
  };

  const handleSave = async () => {
    if (!activeDocId || !editor) return;
    setIsSaving(true);
    try {
      await updateDoc.mutateAsync({
        id: activeDocId,
        title: docTitle,
        content: editor.getHTML(),
      });
      toast.success('Document enregistré');
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Supprimer ce document définitivement ?')) return;
    try {
      await deleteDoc.mutateAsync(docId);
      if (activeDocId === docId) {
        setActiveDocId(null);
        if (editor) editor.commands.setContent('');
      }
      toast.success('Document supprimé');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleBackToList = async () => {
    // Auto-save before going back
    if (activeDocId && editor) {
      try {
        await updateDoc.mutateAsync({
          id: activeDocId,
          title: docTitle,
          content: editor.getHTML(),
        });
      } catch { /* silent */ }
    }
    setActiveDocId(null);
    if (editor) editor.commands.setContent('');
  };

  const handleSaveHeader = async () => {
    try {
      await updateHeader.mutateAsync(headerHtml);
      setShowHeaderDialog(false);
      toast.success('En-tête enregistré');
    } catch {
      toast.error('Erreur');
    }
  };

  const handleInsertHeader = () => {
    if (!editor || !savedHeader) return;
    // Insert header at the beginning
    editor.commands.setContent(savedHeader + editor.getHTML());
    toast.success('En-tête inséré');
  };

  const handleExportWord = async () => {
    if (!editor) return;
    const htmlContent = editor.getHTML();
    if (!htmlContent || htmlContent === '<p></p>') {
      toast.error('Le document est vide');
      return;
    }

    const docx = await import('docx');
    const { Document: DocxDocument, Packer, Paragraph, TextRun, HeadingLevel, Table: DocxTable, TableRow: DocxTableRow, TableCell: DocxTableCell, WidthType, BorderStyle, AlignmentType, ImageRun } = docx;
    const { saveAs } = await import('file-saver');

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // Helper: convert base64 data URL to Uint8Array
    const dataUrlToUint8Array = (dataUrl: string): Uint8Array => {
      const base64 = dataUrl.split(',')[1];
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return bytes;
    };

    // Helper: get image dimensions from base64 by loading into an Image object
    const getImageDimensions = (src: string): Promise<{ width: number; height: number }> => {
      return new Promise((resolve) => {
        const img = new window.Image();
        img.onload = () => {
          const maxW = 600;
          const maxH = 400;
          let w = img.naturalWidth || 400;
          let h = img.naturalHeight || 300;
          if (w > maxW) { h = h * (maxW / w); w = maxW; }
          if (h > maxH) { w = w * (maxH / h); h = maxH; }
          resolve({ width: Math.round(w), height: Math.round(h) });
        };
        img.onerror = () => resolve({ width: 400, height: 300 });
        img.src = src;
      });
    };

    // Helper: find all <img> in an element
    const findImages = (el: HTMLElement): HTMLImageElement[] => {
      return Array.from(el.querySelectorAll('img'));
    };

    const children: any[] = [];

    // Title
    children.push(new Paragraph({
      children: [new TextRun({ text: docTitle, bold: true, size: 32, font: 'Calibri' })],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 300 },
    }));

    const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
    const tableBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

    // Helper: extract inline runs from an element
    const extractRuns = (el: HTMLElement, defaults: any = {}): any[] => {
      const runs: any[] = [];
      el.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent || '';
          if (text) runs.push(new TextRun({ text, size: 22, font: 'Calibri', ...defaults }));
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const childEl = child as HTMLElement;
          const childTag = childEl.tagName.toLowerCase();
          runs.push(new TextRun({
            text: childEl.textContent || '',
            size: 22,
            font: 'Calibri',
            ...defaults,
            bold: childTag === 'strong' || childTag === 'b' || defaults.bold,
            italics: childTag === 'em' || childTag === 'i' || defaults.italics,
            underline: childTag === 'u' ? {} : defaults.underline,
            strike: childTag === 's' || childTag === 'del' || defaults.strike,
          }));
        }
      });
      return runs.length > 0 ? runs : [new TextRun({ text: el.textContent || '', size: 22, font: 'Calibri', ...defaults })];
    };

    // Walk through DOM nodes
    const processNode = async (node: Node): Promise<void> => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) {
          children.push(new Paragraph({
            children: [new TextRun({ text, size: 22, font: 'Calibri' })],
            spacing: { after: 100 },
          }));
        }
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      if (['h1', 'h2', 'h3', 'h4'].includes(tag)) {
        const level = parseInt(tag[1]) as 1 | 2 | 3 | 4;
        const headingMap: Record<number, typeof HeadingLevel[keyof typeof HeadingLevel]> = {
          1: HeadingLevel.HEADING_1,
          2: HeadingLevel.HEADING_2,
          3: HeadingLevel.HEADING_3,
          4: HeadingLevel.HEADING_4,
        };
        children.push(new Paragraph({
          children: [new TextRun({ text: el.textContent || '', bold: true, size: 32 - level * 4, font: 'Calibri' })],
          heading: headingMap[level],
          spacing: { before: 200, after: 100 },
        }));
      } else if (tag === 'p') {
        // Check if this <p> contains images
        const imgs = findImages(el);
        if (imgs.length > 0) {
          // Process text content first (if any besides images)
          const textContent = el.textContent?.trim();
          if (textContent) {
            const runs = extractRuns(el);
            children.push(new Paragraph({ children: runs, spacing: { after: 100 } }));
          }
          // Then process each image
          for (const img of imgs) {
            const src = img.getAttribute('src') || '';
            if (src.startsWith('data:image/')) {
              try {
                const imgData = dataUrlToUint8Array(src);
                const dims = await getImageDimensions(src);
                children.push(new Paragraph({
                  children: [new ImageRun({ data: imgData, transformation: dims, type: 'png' })],
                  spacing: { before: 100, after: 100 },
                }));
              } catch { /* skip */ }
            }
          }
        } else {
          const runs = extractRuns(el);
          children.push(new Paragraph({ children: runs, spacing: { after: 100 } }));
        }
      } else if (tag === 'ul' || tag === 'ol') {
        const items = el.querySelectorAll(':scope > li');
        items.forEach((li, idx) => {
          const text = li.textContent?.trim() || '';
          if (!text) return;
          if (tag === 'ul') {
            children.push(new Paragraph({
              children: [new TextRun({ text, size: 22, font: 'Calibri' })],
              bullet: { level: 0 },
              spacing: { after: 60 },
            }));
          } else {
            children.push(new Paragraph({
              children: [new TextRun({ text: `${idx + 1}. ${text}`, size: 22, font: 'Calibri' })],
              spacing: { after: 60 },
              indent: { left: 360 },
            }));
          }
        });
      } else if (tag === 'blockquote') {
        children.push(new Paragraph({
          children: [new TextRun({ text: el.textContent || '', italics: true, size: 22, font: 'Calibri', color: '666666' })],
          indent: { left: 720 },
          spacing: { after: 100 },
        }));
      } else if (tag === 'img') {
        const src = el.getAttribute('src') || '';
        if (src.startsWith('data:image/')) {
          try {
            const imgData = dataUrlToUint8Array(src);
            const dims = await getImageDimensions(src);
            children.push(new Paragraph({
              children: [new ImageRun({ data: imgData, transformation: dims, type: 'png' })],
              spacing: { before: 100, after: 100 },
            }));
          } catch { /* skip broken images */ }
        }
      } else if (tag === 'hr') {
        children.push(new Paragraph({ children: [new TextRun({ text: '─'.repeat(50), size: 16, color: 'CCCCCC' })] }));
      } else if (tag === 'table') {
        // Build proper docx Table
        const trs = el.querySelectorAll('tr');
        const docxRows: any[] = [];

        trs.forEach((tr) => {
          const cells = tr.querySelectorAll('th, td');
          const docxCells: any[] = [];
          cells.forEach((cell) => {
            const isHeader = cell.tagName.toLowerCase() === 'th';
            docxCells.push(
              new DocxTableCell({
                children: [new Paragraph({
                  children: [new TextRun({
                    text: cell.textContent?.trim() || '',
                    size: 20,
                    font: 'Calibri',
                    bold: isHeader,
                  })],
                  spacing: { after: 40 },
                })],
                borders: tableBorders,
                width: { size: 0, type: WidthType.AUTO },
                shading: isHeader ? { fill: 'E8EBF0' } : undefined,
              })
            );
          });
          if (docxCells.length > 0) {
            docxRows.push(new DocxTableRow({ children: docxCells }));
          }
        });

        if (docxRows.length > 0) {
          children.push(new DocxTable({
            rows: docxRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }));
          children.push(new Paragraph({ children: [], spacing: { after: 100 } }));
        }
      } else {
        for (const child of Array.from(el.childNodes)) {
          await processNode(child);
        }
      }
    };

    for (const child of Array.from(tempDiv.childNodes)) {
      await processNode(child);
    }

    const doc = new DocxDocument({
      sections: [{ children }],
      creator: 'CrouszAI Editor',
      title: docTitle,
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${docTitle.replace(/\s+/g, '_')}.docx`);
    toast.success('Document exporté en Word');
  };

  const handleExportPDF = async () => {
    if (!editor) return;
    const htmlContent = editor.getHTML();
    if (!htmlContent || htmlContent === '<p></p>') {
      toast.error('Le document est vide');
      return;
    }

    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 20;

    const addPageIfNeeded = (space: number) => {
      if (y + space > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        y = 20;
      }
    };

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(docTitle, margin, y);
    y += 12;

    // Parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // Helper: load image dimensions from data URL
    const getImgDimsPDF = (src: string): Promise<{ w: number; h: number }> => {
      return new Promise((resolve) => {
        const img = new window.Image();
        img.onload = () => {
          const maxW = pageWidth - margin * 2;
          let w = img.naturalWidth || 200;
          let h = img.naturalHeight || 150;
          w = w / 3.78; h = h / 3.78;
          if (w > maxW) { h = h * (maxW / w); w = maxW; }
          const maxH = 120;
          if (h > maxH) { w = w * (maxH / h); h = maxH; }
          resolve({ w, h });
        };
        img.onerror = () => resolve({ w: 60, h: 40 });
        img.src = src;
      });
    };

    const addImageToPDF = async (src: string) => {
      if (!src.startsWith('data:image/')) return;
      try {
        const { w, h } = await getImgDimsPDF(src);
        addPageIfNeeded(h + 5);
        const fmt = src.includes('image/png') ? 'PNG' : 'JPEG';
        doc.addImage(src, fmt, margin, y, w, h);
        y += h + 5;
      } catch { /* skip */ }
    };

    const processNodePDF = async (node: Node): Promise<void> => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) {
          addPageIfNeeded(8);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
          doc.text(lines, margin, y);
          y += lines.length * 5 + 3;
        }
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      if (['h1', 'h2', 'h3', 'h4'].includes(tag)) {
        const level = parseInt(tag[1]);
        addPageIfNeeded(12);
        doc.setFontSize(20 - level * 2);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(59, 130, 246);
        doc.text(el.textContent || '', margin, y);
        y += 8;
        doc.setTextColor(0, 0, 0);
      } else if (tag === 'p') {
        // Check for images inside <p>
        const imgs = Array.from(el.querySelectorAll('img'));
        if (imgs.length > 0) {
          const textContent = el.textContent?.trim();
          if (textContent) {
            addPageIfNeeded(8);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            const lines = doc.splitTextToSize(textContent, pageWidth - margin * 2);
            doc.text(lines, margin, y);
            y += lines.length * 5 + 3;
          }
          for (const img of imgs) {
            await addImageToPDF(img.getAttribute('src') || '');
          }
        } else {
          addPageIfNeeded(8);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          const lines = doc.splitTextToSize(el.textContent || '', pageWidth - margin * 2);
          doc.text(lines, margin, y);
          y += lines.length * 5 + 3;
        }
      } else if (tag === 'ul' || tag === 'ol') {
        el.querySelectorAll(':scope > li').forEach((li, idx) => {
          addPageIfNeeded(6);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          const prefix = tag === 'ul' ? '•  ' : `${idx + 1}.  `;
          const lines = doc.splitTextToSize(prefix + (li.textContent || ''), pageWidth - margin * 2 - 5);
          doc.text(lines, margin + 5, y);
          y += lines.length * 5 + 2;
        });
        y += 2;
      } else if (tag === 'blockquote') {
        addPageIfNeeded(10);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(0.5);
        doc.line(margin + 2, y - 3, margin + 2, y + 5);
        const lines = doc.splitTextToSize(el.textContent || '', pageWidth - margin * 2 - 10);
        doc.text(lines, margin + 8, y);
        y += lines.length * 5 + 4;
        doc.setTextColor(0, 0, 0);
      } else if (tag === 'table') {
        const rows = el.querySelectorAll('tr');
        const tableData: string[][] = [];
        let head: string[][] = [];

        rows.forEach((row, idx) => {
          const cells = row.querySelectorAll('th, td');
          const rowData = Array.from(cells).map((c) => c.textContent?.trim() || '');
          if (row.querySelector('th') || idx === 0) {
            head = [rowData];
          } else {
            tableData.push(rowData);
          }
        });

        addPageIfNeeded(tableData.length * 8 + 15);
        autoTable(doc, {
          startY: y,
          head: head.length > 0 ? head : undefined,
          body: tableData.length > 0 ? tableData : [head[0] || []],
          margin: { left: margin, right: margin },
          styles: { fontSize: 9, font: 'helvetica' },
          headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          theme: 'grid',
        });
        y = (doc as any).lastAutoTable.finalY + 6;
      } else if (tag === 'img') {
        await addImageToPDF(el.getAttribute('src') || '');
      } else if (tag === 'hr') {
        addPageIfNeeded(6);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageWidth - margin, y);
        y += 6;
      } else {
        for (const child of Array.from(el.childNodes)) {
          await processNodePDF(child);
        }
      }
    };

    for (const child of Array.from(tempDiv.childNodes)) {
      await processNodePDF(child);
    }

    doc.save(`${docTitle.replace(/\s+/g, '_')}.pdf`);
    toast.success('Document exporté en PDF');
  };

  // ─── Document list view ───
  if (!activeDocId) {
    const myDocs = documents?.filter((d) => d.authorId === user?.id) || [];
    const sharedWithMe = documents?.filter((d) => d.authorId !== user?.id) || [];

    return (
      <div className="flex flex-col h-full">
        <Header />
        <div className="p-6 max-w-5xl mx-auto w-full overflow-y-auto flex-1 mesh-gradient">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15">
                  <FileEdit className="h-6 w-6 text-indigo-500" />
                </div>
                Éditeur de documents
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Créez, modifiez et partagez vos documents avec l'aide de l'IA
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => setShowHeaderDialog(true)}>
                <Settings className="h-4 w-4" />
                En-tête
              </Button>
              <Button className="gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5" onClick={handleCreateNew} disabled={createDoc.isPending}>
                {createDoc.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Nouveau document
              </Button>
            </div>
          </div>

          {/* My documents */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Mes documents</h2>
            {docsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : myDocs.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border/30 rounded-2xl bg-card/30">
                <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Aucun document. Créez votre premier document !</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {myDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="group relative p-4 rounded-xl border border-border/40 hover:border-indigo-500/30 hover:bg-card/80 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 cursor-pointer hover:-translate-y-0.5"
                    onClick={() => handleOpenDoc(doc)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <FileText className="h-5 w-5 text-primary/60" />
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {doc.shares.length > 0 && (
                          <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <Users className="h-3 w-3" /> {doc.shares.length}
                          </span>
                        )}
                        <Button
                          variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10 rounded-lg"
                          onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <h3 className="font-medium text-sm truncate">{doc.title}</h3>
                    <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(doc.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Shared with me */}
          {sharedWithMe.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Partagés avec moi</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sharedWithMe.map((doc) => (
                  <div
                    key={doc.id}
                    className="group p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-muted/30 transition-all cursor-pointer"
                    onClick={() => handleOpenDoc(doc)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <FileText className="h-5 w-5 text-blue-500/60" />
                      <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-full">
                        {doc.shares.find((s) => s.user.id === user?.id)?.canEdit ? 'Édition' : 'Lecture'}
                      </span>
                    </div>
                    <h3 className="font-medium text-sm truncate">{doc.title}</h3>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Par {doc.author.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Header settings dialog */}
        <HeaderDialog
          open={showHeaderDialog}
          onOpenChange={setShowHeaderDialog}
          headerHtml={headerHtml}
          setHeaderHtml={setHeaderHtml}
          onSave={handleSaveHeader}
          isPending={updateHeader.isPending}
        />
      </div>
    );
  }

  // ─── Editor view ───
  const isAuthor = activeDoc?.authorId === user?.id;

  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Main editor area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Document header bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={handleBackToList}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Input
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="border-none bg-transparent text-lg font-semibold h-8 px-1 focus-visible:ring-0 focus-visible:ring-offset-0 w-80"
                placeholder="Titre du document"
              />
            </div>
            <div className="flex items-center gap-2">
              {/* Insert header */}
              {savedHeader && (
                <Button variant="ghost" size="sm" className="gap-2 rounded-xl text-xs" onClick={handleInsertHeader}>
                  <Settings className="h-3.5 w-3.5" />
                  Insérer en-tête
                </Button>
              )}

              {/* Save */}
              <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Enregistrer
              </Button>

              {/* Share */}
              {isAuthor && (
                <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => setShowShareDialog(true)}>
                  <Share2 className="h-4 w-4" />
                  Partager
                </Button>
              )}

              {/* Export */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 rounded-xl">
                    <Download className="h-4 w-4" />
                    Exporter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportWord} className="gap-2 cursor-pointer">
                    <FileDown className="h-4 w-4 text-blue-500" />
                    Word (.docx)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPDF} className="gap-2 cursor-pointer">
                    <FileText className="h-4 w-4 text-red-500" />
                    PDF (.pdf)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Delete */}
              {isAuthor && (
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(activeDocId!)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}

              <Separator orientation="vertical" className="h-6" />

              {/* Toggle AI panel */}
              <Button
                variant={showAi ? 'default' : 'outline'}
                size="sm"
                className="gap-2 rounded-xl"
                onClick={() => setShowAi(!showAi)}
              >
                {showAi ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                <Sparkles className="h-4 w-4" />
                Assistant IA
              </Button>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            <RichEditor onEditorReady={setEditor} />
          </div>
        </div>

        {/* AI Assistant sidebar */}
        <AiAssistant editor={editor} isOpen={showAi} onClose={() => setShowAi(false)} />
      </div>

      {/* Share dialog */}
      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        document={activeDoc || null}
        onShare={(userId, canEdit) => shareDoc.mutateAsync({ documentId: activeDocId!, userId, canEdit })}
        onUnshare={(userId) => unshareDoc.mutateAsync({ documentId: activeDocId!, userId })}
        isSharing={shareDoc.isPending}
      />

      {/* Header settings dialog */}
      <HeaderDialog
        open={showHeaderDialog}
        onOpenChange={setShowHeaderDialog}
        headerHtml={headerHtml}
        setHeaderHtml={setHeaderHtml}
        onSave={handleSaveHeader}
        isPending={updateHeader.isPending}
      />
    </div>
  );
}

// ─── Share Dialog Component ───
function ShareDialog({
  open,
  onOpenChange,
  document,
  onShare,
  onUnshare,
  isSharing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  document: Document | null;
  onShare: (userId: string, canEdit: boolean) => Promise<any>;
  onUnshare: (userId: string) => Promise<any>;
  isSharing: boolean;
}) {
  const [search, setSearch] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const { data: users } = useSearchUsers(search);
  const { user: currentUser } = useAuthStore();

  const filteredUsers = (users || []).filter(
    (u: any) =>
      u.id !== currentUser?.id &&
      u.id !== document?.authorId &&
      !document?.shares.some((s) => s.user.id === u.id)
  );

  const handleShare = async (userId: string) => {
    try {
      await onShare(userId, canEdit);
      toast.success('Document partagé');
    } catch {
      toast.error('Erreur lors du partage');
    }
  };

  const handleUnshare = async (userId: string) => {
    try {
      await onUnshare(userId);
      toast.success('Partage retiré');
    } catch {
      toast.error('Erreur');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Partager le document
          </DialogTitle>
        </DialogHeader>

        {/* Current shares */}
        {document?.shares && document.shares.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs font-medium text-muted-foreground">Partagé avec</p>
            {document.shares.map((share) => (
              <div key={share.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={share.user.avatar || undefined} />
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{share.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{share.user.name}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      {share.canEdit ? <><Pencil className="h-2.5 w-2.5" /> Édition</> : <><Eye className="h-2.5 w-2.5" /> Lecture</>}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => handleUnshare(share.user.id)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Separator />

        {/* Add new share */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un utilisateur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch id="can-edit" checked={canEdit} onCheckedChange={setCanEdit} />
            <Label htmlFor="can-edit" className="text-sm">Autoriser la modification</Label>
          </div>

          <ScrollArea className="max-h-40">
            {search.length >= 2 && filteredUsers.map((u: any) => (
              <button
                key={u.id}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                onClick={() => handleShare(u.id)}
                disabled={isSharing}
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={u.avatar || undefined} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{u.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                </div>
                <UserPlus className="h-4 w-4 text-primary flex-shrink-0" />
              </button>
            ))}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Header Settings Dialog ───
function HeaderDialog({
  open,
  onOpenChange,
  headerHtml,
  setHeaderHtml,
  onSave,
  isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  headerHtml: string;
  setHeaderHtml: (v: string) => void;
  onSave: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            En-tête de document
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Définissez un en-tête HTML qui sera inséré au début de vos documents. Idéal pour un logo, un nom d'institution, une adresse, etc.
        </p>
        <textarea
          value={headerHtml}
          onChange={(e) => setHeaderHtml(e.target.value)}
          placeholder={'<div style="text-align: center;">\n  <h2>CROUSZ - Ziguinchor</h2>\n  <p>Adresse • Téléphone • Email</p>\n  <hr />\n</div>'}
          className="w-full min-h-[150px] p-3 rounded-xl border border-border bg-muted/20 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {headerHtml && (
          <div className="border border-border/50 rounded-xl p-4 bg-background">
            <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider">Aperçu</p>
            <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: headerHtml }} />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={onSave} disabled={isPending} className="gap-2">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
